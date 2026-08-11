// Shared helpers for the artifact/contract checker scripts in this directory.
import { readdirSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

export function readArg(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

export function isRepositoryRelativePath(value) {
  return typeof value === 'string' && value.length > 0 && !isAbsolute(value) && !/^[a-zA-Z]:[\\/]/.test(value) && !value.split(/[\\/]+/).includes('..')
}

export function looksLikePath(value) {
  return typeof value === 'string' && /[\\/]/.test(value)
}

export function toPosix(value) {
  return value.replace(/\\/g, '/')
}

export function hasField(data, key) {
  return Object.prototype.hasOwnProperty.call(data, key)
}

export function parseScalar(value) {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1)
  return value
}

export function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null
  const normalized = content.replace(/\r\n/g, '\n')
  const end = normalized.indexOf('\n---\n', 4)
  if (end < 0) return null
  const data = {}
  for (const line of normalized.slice(4, end).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const index = line.indexOf(':')
    if (index < 0) continue
    const key = line.slice(0, index).trim()
    const raw = line.slice(index + 1).trim()
    data[key] = parseScalar(raw)
  }
  return data
}

// Walks regular files below root, skipping symbolic links, and returns POSIX-style absolute paths.
export function walkFiles(root) {
  const files = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue
    const full = resolve(root, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(full))
    else if (entry.isFile()) files.push(toPosix(full))
  }
  return files
}
