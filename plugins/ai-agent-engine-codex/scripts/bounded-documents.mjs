import { createHash } from 'node:crypto'
import { closeSync, fsyncSync, lstatSync, opendirSync, openSync, readSync, realpathSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path'
import { safeFile } from './memory-knowledge-contract.mjs'
import { parseOptions } from './ae-tools/utils.mjs'

export const ROUTER_BYTES = 4096
export const ROUTER_LINES = 80
export const PAGE_BYTES = 15 * 1024
export const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })

export function docsLocation(worktree, explicitDocsRoot) {
  if (explicitDocsRoot && !isAbsolute(explicitDocsRoot)) throw new Error('--docs-root must be an absolute, explicitly resolved docs directory')
  const requested = resolve(explicitDocsRoot || join(worktree, 'docs'))
  assertDirectory(requested)
  const docsRoot = realpathSync.native(requested)
  return { docsRoot, root: docsRoot }
}

export function assertDirectory(directory) {
  const anchor = parse(directory).root
  let current = anchor
  for (const part of relative(anchor, directory).split(sep).filter(Boolean)) {
    current = join(current, part)
    const stat = lstatSync(current)
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('docs root must contain only non-link directory components')
  }
}

export function checkedFile(location, name) {
  const checked = safeFile(location.root, name)
  if (!checked.ok) throw new Error(checked.diagnostics.join('; '))
  // Use filesystem spelling without globally folding case or accepting unsafe alias targets.
  const root = realpathSync.native(location.root)
  const relativePath = relative(root, realpathSync.native(checked.path)).replaceAll('\\', '/')
  const canonical = safeFile(root, relativePath)
  if (!canonical.ok) throw new Error(canonical.diagnostics.join('; '))
  if (canonical.stat.dev !== checked.stat.dev || canonical.stat.ino !== checked.stat.ino) {
    throw new Error(`${name} changed during identity resolution; retry`)
  }
  return { ...canonical, relativePath }
}

export function* directoryEntries(directory) {
  const handle = opendirSync(directory)
  try {
    let entry
    while ((entry = handle.readSync()) !== null) yield entry
  } finally {
    handle.closeSync()
  }
}

export function readBounded(location, name, maxBytes) {
  const file = checkedFile(location, name)
  if (file.stat.size > maxBytes) throw new Error(`${name} exceeds the ${maxBytes} byte read limit`)
  const fd = openSync(file.path, 'r')
  try {
    // A sentinel byte detects concurrent growth without an unbounded read.
    const buffer = Buffer.alloc(file.stat.size + 1)
    let length = 0
    while (length < buffer.length) {
      const count = readSync(fd, buffer, length, buffer.length - length, length)
      if (!count) break
      length += count
    }
    if (length !== file.stat.size) throw new Error(`${name} changed during the read; retry`)
    return { ...file, bytes: buffer.subarray(0, length) }
  } finally {
    closeSync(fd)
  }
}

export function splitPages(bytes) {
  const pages = []
  let start = 0
  while (start < bytes.length) {
    let end = Math.min(start + PAGE_BYTES, bytes.length)
    if (end < bytes.length) {
      const newline = bytes.lastIndexOf(10, end - 1)
      if (newline < start) throw new Error('document contains a line larger than the page budget; split it manually before compaction')
      end = newline + 1
      const heading = bytes.lastIndexOf(Buffer.from('\n## '), end - 1)
      if (heading >= start && heading + 1 > start) end = heading + 1
    }
    pages.push(bytes.subarray(start, end))
    start = end
  }
  return pages.length ? pages : [bytes]
}

export function writeExclusive(path, bytes) {
  const fd = openSync(path, 'wx')
  try {
    writeFileSync(fd, bytes)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
}

export function options(args, values, flags) {
  const parsed = parseOptions(args)
  if (parsed._.length) throw new Error('unexpected positional arguments')
  for (const [key, value] of Object.entries(parsed)) {
    if (key === '_') continue
    if (values.includes(key)) {
      if (typeof value !== 'string' || !value.trim()) throw new Error(`--${key} requires one non-empty value`)
    } else if (!flags.includes(key) || value !== true) throw new Error(`unknown or invalid option: --${key}`)
  }
  return parsed
}

export function integer(value, fallback, min, max, name) {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`--${name} must be an integer from ${min} to ${max}`)
  return parsed
}

export function command(tool, run) {
  try {
    return { tool, ...run() }
  } catch (error) {
    return { status: 'invalid', tool, diagnostics: [error.message] }
  }
}

export function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function documentLockName(path) {
  return `.ae-doc-${hash(path).slice(0, 16)}.lock`
}

export function lineCount(text) {
  return text.length ? text.split('\n').length - Number(text.endsWith('\n')) : 0
}

export function clip(text, limit) {
  return [...text].slice(0, limit).join('')
}
