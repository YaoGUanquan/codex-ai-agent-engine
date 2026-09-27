// Shared low-level helpers for ae-tools command modules.
import { closeSync, existsSync, fstatSync, lstatSync, openSync, opendirSync, readFileSync, readSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { createHash } from 'node:crypto'

const textDecoder = new TextDecoder('utf-8')

export function readJson(path) {
  return JSON.parse(readText(path))
}

export function readText(path) {
  return textDecoder.decode(readFileSync(path))
}

export function parseOptions(args) {
  const opts = { _: [] }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const keyValue = arg.slice(2)
      const eq = keyValue.indexOf('=')
      if (eq >= 0) {
        appendOption(opts, keyValue.slice(0, eq), keyValue.slice(eq + 1))
      } else {
        const next = args[i + 1]
        if (next && !next.startsWith('--')) {
          appendOption(opts, keyValue, next)
          i++
        } else {
          appendOption(opts, keyValue, true)
        }
      }
    } else {
      const idx = arg.indexOf(':')
      if (idx > 0 && /^[a-zA-Z-]+$/.test(arg.slice(0, idx))) {
        opts[arg.slice(0, idx)] = arg.slice(idx + 1)
      } else {
        opts._.push(arg)
      }
    }
  }
  return opts
}

// Repeated flags accumulate into arrays so commands like `gate --validation A --validation B`
// record every occurrence instead of keeping only the last one.
function appendOption(opts, key, value) {
  if (!(key in opts)) {
    opts[key] = value
    return
  }
  if (Array.isArray(opts[key])) opts[key].push(value)
  else opts[key] = [opts[key], value]
}

export function arrayOpt(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value).split('|').map((s) => s.trim()).filter(Boolean)
}

export function truthy(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes'
}

export function splitCsv(value) {
  if (!value) return []
  return String(value).split(',').map((item) => item.trim()).filter(Boolean)
}

export function redactOptions(opts) {
  const out = { ...opts }
  delete out._
  return out
}

export function safeResolve(root, input) {
  if (!input) throw new Error('path is required')
  if (isAbsolute(input) || /^[a-zA-Z]:/.test(input)) throw new Error(`absolute paths are not accepted here: ${input}`)
  const abs = resolve(root, input)
  const rel = relative(root, abs)
  if (rel.startsWith('..') || rel.includes(`..${sep}`) || isAbsolute(rel)) throw new Error(`path escapes worktree: ${input}`)
  return abs
}

export function assertCanonicalContained(root, candidate, label = 'path') {
  const canonicalRoot = realpathSync(root)
  let existing = candidate
  while (!existsSync(existing)) {
    const parent = dirname(existing)
    if (parent === existing) throw new Error(`${label} has no resolvable parent: ${candidate}`)
    existing = parent
  }
  const canonicalExisting = realpathSync(existing)
  const rel = relative(canonicalRoot, canonicalExisting)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`${label} escapes worktree after resolution: ${candidate}`)
  }
  return candidate
}

export function normalizeRelPath(input) {
  const value = input.trim().replace(/^\.\//, '').replace(/\\/g, '/')
  if (!value || /\s/.test(value) || value.includes('..') || value.startsWith('/') || /^[a-zA-Z]:/.test(value)) return null
  return value.replace(/[),.;:]+$/, '')
}

export function normalizeArtifactOutputPath(input, kind) {
  const normalized = normalizeRelPath(String(input))
  if (!normalized) throw new Error(`${kind} output path is invalid: ${input}`)
  return normalized
}

export function toPosix(path) {
  return path.replace(/\\/g, '/')
}

export function safeName(value) {
  const name = String(value).replace(/[^a-zA-Z0-9._-]/g, '-')
  if (!name || name === '.' || name === '..') throw new Error(`invalid safe name: ${value}`)
  return name
}

export function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function stableHash(value) {
  return createHash('sha256').update(stableStringify(value), 'utf8').digest('hex')
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}

export function clampInteger(value, fallback, min, max) {
  if (!Number.isInteger(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function clonePlain(value) {
  return JSON.parse(JSON.stringify(value))
}

export function listFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      for (const child of listFiles(entryPath)) out.push(join(entry.name, child))
    } else if (entry.isFile()) {
      out.push(entry.name)
    }
  }
  return out
}

export function boundedInteger(value, fallback, name, min = 1, max = 1_000_000) {
  if (value === undefined) return fallback
  if (!['string', 'number'].includes(typeof value) || String(value).trim() === '') throw new Error(`${name} requires an integer`)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`${name} must be an integer from ${min} to ${max}`)
  return parsed
}

export function scanOptions(opts = {}, defaults = {}) {
  return {
    maxFiles: boundedInteger(opts['file-limit'] ?? opts.limit, defaults.maxFiles ?? 500, '--file-limit', 1, 10000),
    maxEntries: boundedInteger(opts['entry-limit'], defaults.maxEntries ?? 20000, '--entry-limit', 1, 100000),
    maxDepth: boundedInteger(opts['max-depth'], defaults.maxDepth ?? 32, '--max-depth', 0, 128),
    maxFileBytes: boundedInteger(opts['max-file-bytes'], defaults.maxFileBytes ?? 1024 * 1024, '--max-file-bytes', 1, 16 * 1024 * 1024),
    maxTotalBytes: boundedInteger(opts['max-total-bytes'], defaults.maxTotalBytes ?? 16 * 1024 * 1024, '--max-total-bytes', 1, 256 * 1024 * 1024),
    maxErrors: boundedInteger(opts['max-errors'], defaults.maxErrors ?? 20, '--max-errors', 1, 1000),
    maxMs: boundedInteger(opts['max-ms'], defaults.maxMs ?? 10000, '--max-ms', 1, 120000),
  }
}

// Read the descriptor, not a second path lookup; reject growth and replacement races.
export function readBoundedText(path, maxBytes = 1024 * 1024) {
  const before = lstatSync(path)
  if (!before.isFile() || before.isSymbolicLink()) throw new Error('not a regular non-link file')
  if (before.size > maxBytes) throw new Error(`file exceeds byte limit ${maxBytes}`)
  const fd = openSync(path, 'r')
  try {
    const opened = fstatSync(fd)
    if (!opened.isFile() || opened.ino !== before.ino || opened.dev !== before.dev || opened.size > maxBytes) throw new Error('file changed before read')
    const buffer = Buffer.alloc(Math.min(opened.size + 1, maxBytes + 1))
    let bytes = 0
    while (bytes < buffer.length) {
      const count = readSync(fd, buffer, bytes, buffer.length - bytes, null)
      if (!count) break
      bytes += count
    }
    const after = fstatSync(fd)
    if (bytes !== opened.size || after.size !== opened.size || after.mtimeMs !== opened.mtimeMs) throw new Error('file changed during read')
    const data = buffer.subarray(0, bytes)
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(data), bytes, sha256: createHash('sha256').update(data).digest('hex'), mtimeMs: after.mtimeMs }
  } finally {
    closeSync(fd)
  }
}

// Budgets cover traversal as well as returned results. Policy exclusions are not errors.
export function scanFiles(root, options = {}) {
  const limits = { ...scanOptions(), ...options }
  for (const key of ['maxFiles', 'maxEntries', 'maxDepth', 'maxFileBytes', 'maxTotalBytes', 'maxErrors', 'maxMs']) {
    boundedInteger(limits[key], undefined, key, key === 'maxDepth' ? 0 : 1, key.includes('Bytes') ? 256 * 1024 * 1024 : 1_000_000)
  }
  const files = []
  const reasons = new Set()
  const diagnostics = { entriesVisited: 0, filesMatched: 0, bytesRead: 0, bytesSelected: 0, skipped: {}, errors: [], errorCount: 0, samples: [] }
  const start = Date.now()
  let halted = false
  const recordSkip = (path, reason, incomplete = true) => {
    diagnostics.skipped[reason] = (diagnostics.skipped[reason] || 0) + 1
    if (incomplete) reasons.add(reason)
    if (incomplete && diagnostics.samples.length < 20) diagnostics.samples.push({ path: toPosix(relative(root, path)) || '.', reason })
  }
  const recordError = (path, error) => {
    diagnostics.errorCount++
    reasons.add('read-error')
    if (diagnostics.errors.length < limits.maxErrors) diagnostics.errors.push({ path: toPosix(relative(root, path)) || '.', code: error.code || 'READ_FAILED', message: error.message })
    if (diagnostics.errorCount >= limits.maxErrors) { reasons.add('error-limit'); halted = true }
  }
  const expired = () => {
    if (Date.now() - start >= limits.maxMs) { reasons.add('time-limit'); halted = true }
    return halted
  }
  const walk = (dir, depth) => {
    if (expired()) return
    let handle
    const entries = []
    try {
      if (lstatSync(dir).isSymbolicLink()) { recordSkip(dir, 'symbolic-link'); return }
      assertCanonicalContained(root, dir, 'scan directory')
      handle = opendirSync(dir)
      while (!expired()) {
        const entry = handle.readSync()
        if (!entry) break
        if (diagnostics.entriesVisited >= limits.maxEntries) { reasons.add('entry-limit'); break }
        diagnostics.entriesVisited++
        entries.push(entry)
      }
    } catch (error) {
      recordError(dir, error)
    } finally {
      handle?.closeSync()
    }
    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      if (expired()) break
      const path = join(dir, entry.name)
      const relativePath = toPosix(relative(root, path))
      if (entry.isSymbolicLink()) { recordSkip(path, 'symbolic-link'); continue }
      if (entry.isDirectory()) {
        if (options.excludeDir?.(entry.name, relativePath)) { recordSkip(path, 'excluded-directory', false); continue }
        if (depth >= limits.maxDepth) { recordSkip(path, 'depth-limit'); continue }
        if (diagnostics.entriesVisited >= limits.maxEntries) { recordSkip(path, 'entry-limit'); continue }
        walk(path, depth + 1)
        continue
      }
      if (!entry.isFile()) continue
      if (options.excludeFile?.(entry.name, relativePath)) { recordSkip(path, 'excluded-file', false); continue }
      if (options.include && !options.include(entry.name, relativePath)) continue
      diagnostics.filesMatched++
      if (files.length >= limits.maxFiles) { reasons.add('file-limit'); halted = true; break }
      try {
        assertCanonicalContained(root, path, 'scan file')
        const st = lstatSync(path)
        if (!st.isFile() || st.isSymbolicLink()) { recordSkip(path, 'changed-file'); continue }
        if (st.size > limits.maxFileBytes) { recordSkip(path, 'file-byte-limit'); continue }
        if (diagnostics.bytesSelected + st.size > limits.maxTotalBytes) { reasons.add('total-byte-limit'); halted = true; break }
        const file = { path, relativePath, sizeBytes: st.size, mtimeMs: st.mtimeMs }
        diagnostics.bytesSelected += st.size
        if (options.readText) {
          const content = readBoundedText(path, Math.min(st.size, limits.maxFileBytes))
          diagnostics.bytesRead += content.bytes
          if (content.text.includes('\0')) { recordSkip(path, 'binary-file'); continue }
          Object.assign(file, content)
        }
        files.push(file)
      } catch (error) {
        recordError(path, error)
      }
    }
  }
  walk(resolve(root), 0)
  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
  return {
    files,
    completeness: { complete: reasons.size === 0, reasons: [...reasons], scope: 'eligible non-link files under the selected root; policy exclusions omitted' },
    diagnostics: { ...diagnostics, elapsedMs: Date.now() - start },
    limits: Object.fromEntries(Object.entries(limits).filter(([key]) => key.startsWith('max'))),
  }
}

export function uniqueObjects(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = JSON.stringify(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

export function extractFiles(text) {
  const candidates = new Set()
  const patterns = [
    /`([^`]+\.[a-zA-Z0-9]+)`/g,
    /(?:^|\s)((?:src|app|lib|test|tests|docs|config|scripts|packages|components|services|utils|tools|pages|views)\/[\w.\-/]+)(?=\s|$|,|;|\))/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const cleaned = normalizeRelPath(match[1])
      if (cleaned) candidates.add(cleaned)
    }
  }
  return [...candidates].sort()
}

export function scalarMarkdownCell(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value).replace(/\|/g, '\\|')
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

export function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

export function printContractResult(result) {
  printJson(result)
  if (result.status !== 'ok') process.exitCode = 1
}

export function formatError(error) {
  return error instanceof Error ? `ERROR: ${error.message}` : `ERROR: ${String(error)}`
}
