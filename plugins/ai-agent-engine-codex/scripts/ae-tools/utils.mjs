// Shared low-level helpers for ae-tools command modules.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
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
