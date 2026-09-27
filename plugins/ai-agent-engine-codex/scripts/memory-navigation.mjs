import { createHash } from 'node:crypto'
import { closeSync, lstatSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync } from 'node:fs'
import { join, relative } from 'node:path'
import { PAGE_BYTES, ROUTER_BYTES as INDEX_BYTES, ROUTER_LINES as INDEX_LINES, checkedFile, command, decoder, directoryEntries, docsLocation, documentLockName, hash, lineCount, options, readBounded as readMemoryFile, splitPages, writeExclusive } from './bounded-documents.mjs'
import { isDocumentPage, parseRouter, searchDocuments } from './docs-lifecycle.mjs'

const INDEX = '00-index.md'
const MARKER = '<!-- ae-memory-router:v1 -->'
const HISTORY = /^00-index-history-[a-f0-9]{64}-\d{4}\.md$/
const COMPACT_BYTES = 1024 * 1024

export function memoryIndex(worktree, args = []) {
  return command('ae-memory-index', () => {
    const opts = options(args, ['docs-root', 'expect-sha256'], ['check', 'compact', 'apply'])
    if (opts.apply && !opts.compact) throw new Error('--apply requires --compact')
    if (opts.check && opts.compact) throw new Error('--check and --compact are mutually exclusive')
    if (opts['expect-sha256'] && !opts.apply) throw new Error('--expect-sha256 requires --apply')
    const location = memoryLocation(worktree, opts['docs-root'])
    const source = readMemoryFile(location, INDEX, COMPACT_BYTES)
    const text = decoder.decode(source.bytes)
    const sourceHash = hash(source.bytes)
    const managed = parseRouter(source.bytes, relative(location.docsRoot, source.path).replaceAll('\\', '/'), { root: location.docsRoot })
    const index = { path: INDEX, bytes: source.bytes.length, lines: lineCount(text), sha256: sourceHash }
    index.withinBudget = index.bytes <= INDEX_BYTES && index.lines <= INDEX_LINES
    const oversized = listMemoryFiles(location)
      .filter((name) => name !== INDEX)
      .map((name) => ({ path: name, bytes: checkedFile(location, name).stat.size }))
      .filter((file) => file.bytes > PAGE_BYTES)
    const result = {
      status: opts.check && (!index.withinBudget || oversized.length) ? 'invalid' : 'ok',
      mode: opts.check ? 'check' : 'audit',
      docsRoot: location.docsRoot,
      index,
      budgets: { indexBytes: INDEX_BYTES, indexLines: INDEX_LINES, topicBytes: PAGE_BYTES },
      oversized: oversized.slice(0, 20),
      oversizedCount: oversized.length,
      reportTruncated: oversized.length > 20,
      diagnostics: [
        ...(!index.withinBudget ? ['00-index.md exceeds the router budget; preview --compact before an authorized apply'] : []),
        ...(oversized.length ? ['oversized topic files require separate distillation; index compaction does not rewrite them'] : []),
      ],
    }
    if (!opts.compact) return result
    if (opts.apply && (!/^[a-f0-9]{64}$/.test(opts['expect-sha256'] || '') || opts['expect-sha256'] !== sourceHash)) {
      throw new Error('--apply requires --expect-sha256 matching the current index; preview again')
    }
    if (managed || text.replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] === MARKER) {
      if (!index.withinBudget) throw new Error('managed router grew beyond its budget; move new entries to their owning topic, not another history snapshot')
      return { ...result, mode: 'unchanged', diagnostics: result.diagnostics }
    }
    const pages = splitPages(source.bytes).map((bytes, number) => ({
      path: `00-index-history-${sourceHash}-${String(number + 1).padStart(4, '0')}.md`,
      bytes,
    }))
    const router = renderRouter(text, sourceHash, pages.length)
    if (Buffer.byteLength(router) > INDEX_BYTES || lineCount(router) > INDEX_LINES) throw new Error('generated router exceeds its budget')
    const publicPages = pages.map((page) => ({ path: page.path, bytes: page.bytes.length, sha256: hash(page.bytes) }))
    const preview = {
      ...result,
      mode: opts.apply ? 'applied' : 'preview',
      replacement: { bytes: Buffer.byteLength(router), lines: lineCount(router), withinBudget: true },
      diagnostics: opts.apply ? result.diagnostics.filter((item) => !item.startsWith('00-index.md exceeds')) : result.diagnostics,
      history: publicPages,
      recovery: 'Concatenate history pages in the listed order; verify source SHA-256 before restoring 00-index.md. Pages preserve original bytes and relative link bases, not cross-page anchors.',
    }
    if (opts.apply) applyCompaction(location, sourceHash, pages, router)
    return preview
  })
}

export function memorySearch(worktree, args = []) {
  return command('ae-memory-search', () => {
    const opts = options(args, ['docs-root', 'query', 'path', 'limit', 'excerpt', 'max-files', 'max-bytes', 'page', 'line'], ['history'])
    const location = memoryLocation(worktree, opts['docs-root'])
    const paths = (opts.path ? [opts.path] : listMemoryFiles(location).filter((name) => opts.history
      ? name === INDEX || HISTORY.test(name)
      : name !== INDEX && !isDocumentPage(name)))
      .map((name) => checkedFile(location, name).relativePath)
    if (opts.path && (!paths[0].endsWith('.md') || (opts.history ? paths[0] !== INDEX && !HISTORY.test(paths[0]) : HISTORY.test(paths[0])))) {
      throw new Error('--path must name memory Markdown in the selected scope; --history allows only the managed index and legacy index history, not current topics')
    }
    const result = searchDocuments({ docsRoot: location.docsRoot, root: location.docsRoot }, paths.map((name) => `08-ai-memory/${name}`), opts, opts.history ? [`08-ai-memory/${INDEX}`] : [])
    return {
      ...result,
      scope: opts.history ? 'index-history' : 'current-memory',
      results: result.results.map((item) => ({ ...item, historical: Boolean(opts.history) })),
      resume: result.resume ? { ...result.resume, path: result.resume.path.replace(/^08-ai-memory\//, '') } : null,
      limits: { ...result.limits, returned: result.results.length },
      limitations: ['literal case-insensitive text matches, not declared relations or semantic validation', 'read-only; top-level memory plus its managed pages; use --path for a nested file; managed index and legacy index history require --history for historical scope'],
    }
  })
}

function memoryLocation(worktree, explicitDocsRoot) {
  const { docsRoot } = docsLocation(worktree, explicitDocsRoot)
  const root = join(docsRoot, '08-ai-memory')
  const stat = lstatSync(root)
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('08-ai-memory must be a non-link directory')
  return { docsRoot, root: realpathSync.native(root) }
}

function listMemoryFiles(location) {
  const paths = []
  let entries = 0
  for (const entry of directoryEntries(location.root)) {
    if (++entries > 4096) throw new Error('memory directory exceeds 4096 entries; use a scoped --path or reorganize topics')
    if (!entry.name.startsWith('.') && entry.name.endsWith('.md')) paths.push(entry.name)
  }
  return paths.sort()
}

function renderRouter(source, sourceHash, count) {
  const lang = /[\u3400-\u9fff]/.test(source) ? 'zh-CN' : 'en'
  const template = readFileSync(new URL(`./ae-tools/init-templates/${lang}/memoryIndex.md`, import.meta.url), 'utf8').trim()
  return `${MARKER}\n${template}\n\n## Preserved Index History\n\n- Source SHA-256: \`${sourceHash}\`.\n- ${count} ordered, immutable pages: \`00-index-history-${sourceHash}-*.md\`.\n- Search these historical fragments only with \`ae-memory-search --history --query "<text>"\`.\n- Do not append new events here or to the history pages. Update the owning topic.\n`
}

function applyCompaction(location, sourceHash, pages, router) {
  const indexPath = checkedFile({ root: location.docsRoot }, `08-ai-memory/${INDEX}`).relativePath
  const locks = [
    join(location.root, documentLockName(indexPath)),
    join(location.root, '.ae-memory-index.lock'),
  ]
  const held = []
  try {
    // Retain the legacy guard while coordinating with the generic index writer.
    for (const path of locks) held.push({ path, fd: openSync(path, 'wx') })
    assertSource(location, sourceHash)
    // Preflight every destination before creating any page.
    for (const page of pages) {
      const target = join(location.root, page.path)
      try {
        lstatSync(target)
      } catch (error) {
        if (error.code === 'ENOENT') continue
        throw error
      }
      const existing = readMemoryFile(location, page.path, PAGE_BYTES)
      if (!existing.bytes.equals(page.bytes)) throw new Error(`history page conflict: ${page.path}`)
    }
    for (const page of pages) {
      const target = join(location.root, page.path)
      try {
        writeExclusive(target, page.bytes)
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
      }
      if (!readMemoryFile(location, page.path, PAGE_BYTES).bytes.equals(page.bytes)) throw new Error(`history page verification failed: ${page.path}`)
    }
    const recovered = createHash('sha256')
    for (const page of pages) recovered.update(readMemoryFile(location, page.path, PAGE_BYTES).bytes)
    if (recovered.digest('hex') !== sourceHash) throw new Error('history recovery hash mismatch')
    const replacement = join(location.root, `.ae-memory-index-${sourceHash}.tmp`)
    writeExclusive(replacement, router)
    assertSource(location, sourceHash)
    renameSync(replacement, checkedFile(location, INDEX).path)
    if (readMemoryFile(location, INDEX, INDEX_BYTES).bytes.toString('utf8') !== router) throw new Error('router readback failed; recover from verified history pages')
  } finally {
    for (const lock of held.reverse()) {
      closeSync(lock.fd)
      unlinkSync(lock.path)
    }
  }
}

function assertSource(location, expected) {
  if (hash(readMemoryFile(location, INDEX, COMPACT_BYTES).bytes) !== expected) throw new Error('source index changed; preview again')
}
