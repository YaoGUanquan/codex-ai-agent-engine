import { createHash } from 'node:crypto'
import { closeSync, lstatSync, openSync, readFileSync, renameSync, unlinkSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { PAGE_BYTES, ROUTER_BYTES, ROUTER_LINES, checkedFile, clip, command, decoder, directoryEntries, docsLocation, documentLockName, hash, integer, lineCount, options, readBounded, splitPages, writeExclusive } from './bounded-documents.mjs'

const MARKER = '<!-- ae-doc-pages:v1 '
const GENERATED = /^ae-doc-[a-f0-9]{16}-[a-f0-9]{64}-\d{6}\.md$/
const OLD_INDEX = /^00-index-history-[a-f0-9]{64}-\d{4}\.md$/
const MAX_SOURCE_BYTES = 8 * 1024 * 1024
const MAX_ENTRIES = 50000
const MAX_PAGES = 999999
const MAX_FILE_BYTES = 512 * 1024

export function documentKind(path) {
  if (/(^|\/)(?:archive|99-archive|06-sql|07-test-data|evidence|gates|fixtures|migrations)(\/|$)/i.test(path)) return 'protected'
  if (/^08-ai-memory\/.+\.md$/i.test(path)) return /^(?:00-index|index)\.md$/i.test(basename(path)) ? 'router' : 'topic'
  if (/^01-history\/.+\.md$/i.test(path)) return /^(?:00-index|index)\.md$/i.test(basename(path)) ? 'router' : 'history'
  if (/(^|\/)(?:00-index|index)\.md$/i.test(path)) return 'router'
  if (/(?:-tracker|-issue-log)\.md$/i.test(path) && /^(?:03-analysis|05-reports)\//i.test(path)) return 'log'
  return 'protected'
}

export function isDocumentPage(path) {
  const name = process.platform === 'win32' ? basename(path).toLowerCase() : basename(path)
  return GENERATED.test(name) || OLD_INDEX.test(name)
}

export function docsMaintain(worktree, args = []) {
  return command('ae-docs-maintain', () => {
    const opts = options(args, ['docs-root', 'path', 'expect-sha256'], ['check', 'compact', 'apply', 'verify'])
    if (opts.apply && !opts.compact) throw new Error('--apply requires --compact')
    if (opts.compact && opts.verify) throw new Error('--compact and --verify are mutually exclusive')
    if (opts.check && (opts.compact || opts.verify)) throw new Error('--check cannot be combined with --compact or --verify')
    if (opts['expect-sha256'] && !opts.apply) throw new Error('--expect-sha256 requires --apply')
    const location = docsLocation(worktree, opts['docs-root'])
    if (opts.compact || opts.verify) {
      if (!opts.path) throw new Error('--compact and --verify require one --path; audit before selecting a document')
      const path = canonicalPath(location, opts.path)
      if (documentKind(path) === 'protected' || isDocumentPage(path)) throw new Error('protected document or immutable page; automatic rewriting is not allowed')
      const source = readBounded(location, path, MAX_SOURCE_BYTES)
      const metadata = parseRouter(source.bytes, path, location)
      if (opts.verify) return verifyDocument(location, path, metadata)
      requireExpectedHash(opts, hash(source.bytes))
      if (metadata) return { status: 'ok', mode: 'unchanged', path, pages: metadata.pages }
      if (source.bytes.toString('utf8').includes('<!-- ae-memory-router:v1 -->')) {
        if (source.bytes.length > ROUTER_BYTES || lineCount(decoder.decode(source.bytes)) > ROUTER_LINES) throw new Error('legacy managed index regrew; move appended events into their owning documents')
        return { status: 'ok', mode: 'unchanged', path, diagnostics: ['legacy index router retained; use ae-memory-search --history for its original pages'] }
      }
      const prepared = prepareDocument(path, source.bytes)
      const result = {
        status: 'ok', mode: opts.apply ? 'applied' : 'preview', docsRoot: location.docsRoot, path,
        source: { bytes: source.bytes.length, sha256: hash(source.bytes) },
        replacement: { bytes: Buffer.byteLength(prepared.router), lines: lineCount(prepared.router) },
        pages: prepared.metadata.pages, pageBytes: PAGE_BYTES,
        recovery: { originalPages: prepared.metadata.originalPages, sha256: prepared.metadata.sourceSha256, pattern: pagePath(path, prepared.metadata, 1).replace('000001.md', '*.md') },
        limitations: ['Pages preserve bytes and ordinary relative link bases. Cross-page anchors, reference definitions and original incoming anchors are not rewritten.'],
      }
      if (opts.apply) applyDocument(location, path, hash(source.bytes), prepared)
      return result
    }
    const inventory = documentInventory(location, opts.path)
    return {
      status: opts.check && inventory.oversizedCount ? 'invalid' : 'ok', mode: opts.check ? 'check' : 'audit',
      docsRoot: location.docsRoot, ...inventory,
      budgets: { routerBytes: ROUTER_BYTES, routerLines: ROUTER_LINES, pageBytes: PAGE_BYTES },
      diagnostics: inventory.oversizedCount ? ['mutable documents exceed their budgets; preview each --path with --compact'] : [],
    }
  })
}

export function docsAppend(worktree, args = []) {
  return command('ae-docs-append', () => {
    const opts = options(args, ['docs-root', 'path', 'entry', 'expect-sha256', 'expect-entry-sha256'], ['apply'])
    if (!opts.path || !opts.entry) throw new Error('--path and --entry are required docs-relative Markdown files')
    if (!opts.apply && (opts['expect-sha256'] || opts['expect-entry-sha256'])) throw new Error('expected hashes require --apply')
    const location = docsLocation(worktree, opts['docs-root'])
    const path = canonicalPath(location, opts.path)
    if (!['topic', 'history', 'log'].includes(documentKind(path)) || isDocumentPage(path)) throw new Error('append is restricted to a topic, development history or rolling log, never a navigation index or protected document')
    const entryPath = canonicalPath(location, opts.entry)
    if (path === entryPath || isDocumentPage(entryPath)) throw new Error('entry must be a separate, non-page Markdown file')
    const source = readBounded(location, path, MAX_SOURCE_BYTES)
    const entry = readBounded(location, entryPath, PAGE_BYTES)
    if (!entry.bytes.length || !decoder.decode(entry.bytes).trim()) throw new Error('entry is empty')
    if (parseRouter(entry.bytes, entryPath, location) || entry.bytes.includes(Buffer.from('<!-- ae-memory-router:v1 -->'))) throw new Error('entry must be a content record, not another router')
    const sourceHash = hash(source.bytes)
    const entryHash = hash(entry.bytes)
    requireExpectedHash(opts, sourceHash)
    if (opts.apply && opts['expect-entry-sha256'] !== entryHash) throw new Error('--apply requires --expect-entry-sha256 matching the previewed entry')
    const current = parseRouter(source.bytes, path, location)
    const prepared = current ? { metadata: current, pages: [] } : prepareDocument(path, source.bytes)
    const previousPages = prepared.metadata.pages
    // Each appended entry owns immutable pages. No global ever-growing event list.
    prepared.pages.push(...splitPages(entry.bytes).map((bytes, index) => ({ number: previousPages + index + 1, bytes })))
    prepared.metadata = { ...prepared.metadata, pages: previousPages + prepared.pages.filter((page) => page.number > previousPages).length, bytes: prepared.metadata.bytes + entry.bytes.length }
    prepared.router = renderRouter(prepared.metadata)
    const result = {
      status: 'ok', mode: opts.apply ? 'applied' : 'preview', path,
      sourceSha256: sourceHash, entrySha256: entryHash,
      appendedPages: prepared.metadata.pages - previousPages,
      pages: prepared.metadata.pages, routerBytes: Buffer.byteLength(prepared.router),
    }
    if (opts.apply) {
      applyDocument(location, path, sourceHash, prepared, () => {
        if (hash(readBounded(location, entryPath, PAGE_BYTES).bytes) !== entryHash) throw new Error('entry changed during apply; preview again')
      })
    }
    return result
  })
}

export function documentInventory(location, selectedPath) {
  const paths = selectedPath ? [canonicalPath(location, selectedPath)] : listDocuments(location)
  const oversized = []
  const protectedLarge = []
  let managed = 0
  let pages = 0
  for (const path of paths) {
    const kind = documentKind(path)
    // Inventory only metadata for protected material, including sensitive-named paths.
    // listDocuments has already refused links; do not open protected content.
    if (kind === 'protected' && !isDocumentPage(path)) {
      const stat = lstatSync(join(location.root, path))
      if (stat.size > PAGE_BYTES) protectedLarge.push({ path, bytes: stat.size })
      continue
    }
    const file = checkedFile(location, path)
    if (isDocumentPage(path)) {
      pages++
      if (file.stat.size > PAGE_BYTES) throw new Error(`immutable page exceeds its budget: ${path}`)
      continue
    }
    const budget = kind === 'router' ? ROUTER_BYTES : PAGE_BYTES
    let over = file.stat.size > budget
    if (file.stat.size <= PAGE_BYTES) {
      const source = readBounded(location, path, PAGE_BYTES)
      const metadata = parseRouter(source.bytes, path, location)
      if (metadata) managed++
      if (kind === 'router' && lineCount(decoder.decode(source.bytes)) > ROUTER_LINES) over = true
    }
    if (over) oversized.push({ path, kind, bytes: file.stat.size })
  }
  return {
    files: paths.length, managed, pages,
    oversized: oversized.slice(0, 30), oversizedCount: oversized.length,
    protectedLarge: protectedLarge.slice(0, 10), protectedLargeCount: protectedLarge.length,
    reportTruncated: oversized.length > 30 || protectedLarge.length > 10,
  }
}

export function listDocuments(location) {
  const paths = []
  let entries = 0
  function walk(directory, prefix, depth) {
    if (depth > 24) throw new Error('document directory depth exceeds 24; select --path')
    for (const entry of directoryEntries(directory)) {
      if (++entries > MAX_ENTRIES) throw new Error('document inventory exceeds 50000 entries; select --path')
      if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build', 'coverage'].includes(entry.name)) continue
      if (entry.isSymbolicLink()) throw new Error(`linked document entry is not allowed: ${prefix}${entry.name}`)
      const path = `${prefix}${entry.name}`
      if (entry.isDirectory()) walk(join(directory, entry.name), `${path}/`, depth + 1)
      else if (entry.isFile() && entry.name.endsWith('.md')) paths.push(path)
    }
  }
  walk(location.root, '', 0)
  return paths.sort()
}

export function docsSearch(worktree, args = []) {
  return command('ae-docs-search', () => {
    const opts = options(args, ['docs-root', 'query', 'path', 'limit', 'excerpt', 'max-files', 'max-bytes', 'page', 'line'], [])
    const location = docsLocation(worktree, opts['docs-root'])
    const paths = opts.path ? [canonicalPath(location, opts.path)] : listDocuments(location).filter((path) => documentKind(path) !== 'protected' && !isDocumentPage(path))
    return searchDocuments(location, paths, opts)
  })
}

export function searchDocuments(location, paths, opts, managedOnlyPaths = []) {
    if (!opts.query || [...opts.query].length > 160) throw new Error('--query requires 1-160 characters of literal text')
    const limit = integer(opts.limit, 5, 1, 20, 'limit')
    const excerptChars = integer(opts.excerpt, 240, 40, 800, 'excerpt')
    const maxFiles = integer(opts['max-files'], 128, 1, 512, 'max-files')
    const maxBytes = integer(opts['max-bytes'], MAX_SOURCE_BYTES, 1, MAX_SOURCE_BYTES, 'max-bytes')
    const startPage = integer(opts.page, 1, 1, MAX_PAGES, 'page')
    const startLine = integer(opts.line, 1, 1, 1000000, 'line')
    if ((opts.page || opts.line) && !opts.path) throw new Error('--page and --line require --path')
    const results = []
    const scan = { files: 0, bytes: 0, complete: true, stoppedBy: null }
    let resume = null
    const needle = new RegExp(opts.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu')
    function stop(reason, path, page, line = opts.path && page === startPage ? startLine : 1) {
      scan.complete = false
      scan.stoppedBy = reason
      resume = { path, page, line }
    }
    function read(path, owner, page, ceiling) {
      if (scan.files >= maxFiles) { stop('max-files', owner, page); return null }
      const file = checkedFile(location, path)
      if (file.stat.size > ceiling || scan.bytes + file.stat.size > maxBytes) {
        stop(file.stat.size > ceiling ? 'file-bytes' : 'max-bytes', owner, page)
        return null
      }
      const bytes = readBounded(location, path, Math.min(ceiling, maxBytes - scan.bytes)).bytes
      scan.files++
      scan.bytes += bytes.length
      return bytes
    }
    function search(bytes, path, owner, page) {
      let heading = ''
      const lines = decoder.decode(bytes).split(/\r?\n/)
      for (const [index, line] of lines.entries()) {
        if (/^#{1,6}\s/.test(line)) heading = clip(line.replace(/^#+\s*/, ''), 120)
        if (opts.path && page === startPage && index + 1 < startLine) continue
        const offset = line.search(needle)
        if (offset < 0) continue
        if (results.length >= limit) { stop('results', owner, page, index + 1); return }
        const points = [...line]
        const start = Math.max(0, [...line.slice(0, offset)].length - Math.floor(excerptChars / 4))
        results.push({ path, document: owner, page, line: index + 1, heading, excerpt: points.slice(start, start + excerptChars).join(''), excerptTruncated: start > 0 || points.length > excerptChars })
      }
    }
    for (const path of paths) {
      const source = read(path, path, startPage, MAX_FILE_BYTES)
      if (!source) break
      const metadata = parseRouter(source, path, location)
      if (metadata) {
        if (startPage > metadata.pages) throw new Error('--page exceeds the document page count')
        for (let page = startPage; page <= metadata.pages; page++) {
          const name = pagePath(path, metadata, page)
          const bytes = read(name, path, page, PAGE_BYTES)
          if (!bytes) break
          search(bytes, name, path, page)
          if (!scan.complete) break
        }
      } else {
        if (startPage !== 1) throw new Error('--page requires a managed paged document')
        // History queries may select an index, but its unpaged navigation is not historical content.
        if (!managedOnlyPaths.includes(path)) search(source, path, path, 1)
      }
      if (!scan.complete) break
    }
    return {
      status: 'ok', docsRoot: location.docsRoot, query: opts.query, results, scan, resume,
      limits: { records: limit, excerptCharacters: excerptChars, maxFiles, maxBytes, truncated: !scan.complete },
      diagnostics: scan.complete ? (results.length ? [] : ['no text match']) : [`search incomplete: ${scan.stoppedBy}; use the resume path/page/line or narrow the query; a single-path resume does not complete other documents`],
      limitations: ['literal text search; paged topic content retains its original authority and may include superseded decisions', 'default scope is mutable documents only; protected Markdown requires explicit --path; files above 512KiB require a dedicated bounded reader'],
    }
}

function canonicalPath(location, input) {
  const checked = checkedFile(location, input)
  if (!checked.relativePath.endsWith('.md')) throw new Error('document path must be Markdown')
  return checked.relativePath
}

function prepareDocument(path, bytes) {
  const text = decoder.decode(bytes)
  const pages = splitPages(bytes).map((part, index) => ({ number: index + 1, bytes: part }))
  const metadata = {
    path, kind: documentKind(path), lang: /[\u3400-\u9fff]/.test(text) ? 'zh-CN' : 'en',
    title: clip(text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0].replace(/^#+\s*/, ''), 120),
    sourceSha256: hash(bytes), originalBytes: bytes.length, originalPages: pages.length,
    pages: pages.length, bytes: bytes.length,
  }
  return { metadata, pages, router: renderRouter(metadata) }
}

export function parseRouter(bytes, path, location) {
  const text = decoder.decode(bytes)
  if (!text.startsWith(MARKER)) {
    if (/(?:^|\n)[\t \r\uFEFF]*<!--\s*ae-doc-pages:v1\b/.test(text)) throw new Error(`damaged managed router: ${path}; restore its exact header before writing`)
    return null
  }
  const line = text.split('\n', 1)[0]
  if (!line.endsWith(' -->')) throw new Error(`invalid router header: ${path}`)
  const metadata = JSON.parse(line.slice(MARKER.length, -4))
  if (!matchesRouterPath(metadata.path, path, location) || metadata.kind !== documentKind(path) || !['en', 'zh-CN'].includes(metadata.lang) || !/^[a-f0-9]{64}$/.test(metadata.sourceSha256) ||
      typeof metadata.title !== 'string' || [...metadata.title].length > 120 ||
      !Number.isSafeInteger(metadata.originalBytes) || metadata.originalBytes < 0 || metadata.originalBytes > MAX_SOURCE_BYTES ||
      !Number.isSafeInteger(metadata.bytes) || metadata.bytes < metadata.originalBytes ||
      !Number.isInteger(metadata.originalPages) || metadata.originalPages < 1 || metadata.originalPages > Math.min(metadata.originalBytes + 1, 16384) ||
      !Number.isInteger(metadata.pages) || metadata.pages < metadata.originalPages || metadata.pages > MAX_PAGES) {
    throw new Error(`invalid router metadata: ${path}`)
  }
  if (text !== renderRouter(metadata)) throw new Error(`managed router was edited or appended: ${path}; preserve the edit separately and restore the router before using ae-docs-append`)
  return metadata
}

function matchesRouterPath(stored, requested, location) {
  if (stored === requested) return true
  if (!location || typeof stored !== 'string') return false
  return checkedFile(location, stored).relativePath === checkedFile(location, requested).relativePath
}

export function pagePath(path, metadata, number) {
  // Existing v1 metadata owns the page namespace even when its path was a Windows alias.
  return join(dirname(path), `ae-doc-${hash(metadata.path).slice(0, 16)}-${metadata.sourceSha256}-${String(number).padStart(6, '0')}.md`).replaceAll('\\', '/')
}

function renderRouter(metadata) {
  if (metadata.pages > MAX_PAGES) throw new Error('document exceeds 999999 pages; start a new topic/history period')
  // These templates are the serialized v1 format. Text changes need a versioned reader/migration.
  const template = readFileSync(new URL(`./ae-tools/init-templates/${metadata.lang}/documentRouter.md`, import.meta.url), 'utf8')
  const values = {
    title: metadata.title || 'Document', path: metadata.path, pages: metadata.pages,
    firstPage: basename(pagePath(metadata.path, metadata, 1)), lastPage: basename(pagePath(metadata.path, metadata, metadata.pages)),
    originalPages: metadata.originalPages, originalBytes: metadata.originalBytes, sha256: metadata.sourceSha256,
  }
  let body = template
  for (const [key, value] of Object.entries(values)) body = body.replaceAll(`{{${key}}}`, String(value))
  const router = `${MARKER}${JSON.stringify(metadata)} -->\n${body}`
  if (Buffer.byteLength(router) > ROUTER_BYTES || lineCount(router) > ROUTER_LINES) throw new Error('router exceeds its fixed budget')
  return router
}

function requireExpectedHash(opts, sourceHash) {
  if (opts.apply && opts['expect-sha256'] !== sourceHash) throw new Error('--apply requires --expect-sha256 matching the current source; preview again')
}

function applyDocument(location, path, sourceHash, prepared, recheckEntry = () => {}) {
  const sourcePath = checkedFile(location, path).path
  const lock = join(dirname(sourcePath), documentLockName(path))
  const lockFd = openSync(lock, 'wx')
  function assertSource() {
    if (hash(readBounded(location, path, MAX_SOURCE_BYTES).bytes) !== sourceHash) throw new Error('source changed during apply; preview again')
  }
  try {
    assertSource()
    recheckEntry()
    const pages = prepared.pages.map((page) => ({ ...page, path: pagePath(path, prepared.metadata, page.number) }))
    for (const page of pages) {
      try { lstatSync(join(location.root, page.path)) } catch (error) {
        if (error.code === 'ENOENT') continue
        throw error
      }
      if (!readBounded(location, page.path, PAGE_BYTES).bytes.equals(page.bytes)) throw new Error(`page conflict: ${page.path}`)
    }
    for (const page of pages) {
      try { writeExclusive(join(location.root, page.path), page.bytes) } catch (error) {
        if (error.code !== 'EEXIST') throw error
      }
      if (!readBounded(location, page.path, PAGE_BYTES).bytes.equals(page.bytes)) throw new Error(`page verification failed: ${page.path}`)
    }
    if (pages[0]?.number === 1) verifyOriginal(location, path, prepared.metadata)
    const replacement = join(dirname(sourcePath), `.ae-doc-${hash(path).slice(0, 16)}-${hash(prepared.router)}.tmp`)
    writeExclusive(replacement, prepared.router)
    assertSource()
    recheckEntry()
    renameSync(replacement, checkedFile(location, path).path)
    if (readBounded(location, path, ROUTER_BYTES).bytes.toString('utf8') !== prepared.router) throw new Error('router readback failed; verified pages remain recoverable')
  } finally {
    closeSync(lockFd)
    unlinkSync(lock)
  }
}

function verifyOriginal(location, path, metadata) {
  const recovered = createHash('sha256')
  let bytes = 0
  for (let page = 1; page <= metadata.originalPages; page++) {
    const content = readBounded(location, pagePath(path, metadata, page), PAGE_BYTES).bytes
    bytes += content.length
    if (bytes > MAX_SOURCE_BYTES) throw new Error('recovery exceeds the source budget')
    recovered.update(content)
  }
  if (bytes !== metadata.originalBytes || recovered.digest('hex') !== metadata.sourceSha256) throw new Error('original content recovery hash mismatch')
}

function verifyDocument(location, path, metadata) {
  if (!metadata) throw new Error('--verify requires a managed document')
  verifyOriginal(location, path, metadata)
  let bytes = metadata.originalBytes
  for (let page = metadata.originalPages + 1; page <= metadata.pages; page++) {
    const size = checkedFile(location, pagePath(path, metadata, page)).stat.size
    if (size > PAGE_BYTES) throw new Error('appended page exceeds its budget')
    bytes += size
  }
  if (bytes !== metadata.bytes) throw new Error('appended page byte count mismatch')
  return {
    status: 'ok', mode: 'verified', path, originalSha256: metadata.sourceSha256,
    originalBytes: metadata.originalBytes, pages: metadata.pages, bytes,
    verification: { original: 'sha256', appended: 'presence-and-size-only' },
  }
}
