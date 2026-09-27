import { closeSync, existsSync, fstatSync, lstatSync, openSync, opendirSync, readSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { relative, resolve } from 'node:path'
import { boundedInteger } from './ae-tools/utils.mjs'

// Preserve the original d:/f: digest format so installed ownership records remain valid.
export function fingerprintManagedPath(path, options = {}) {
  const root = resolve(path)
  if (!existsSync(root)) return null
  const limits = {
    maxEntries: 20000, maxDepth: 128, maxFileBytes: 16 * 1024 * 1024,
    maxTotalBytes: 256 * 1024 * 1024, maxMs: 120000, ...options,
  }
  for (const [key, value] of Object.entries(limits)) boundedInteger(value, undefined, key, key === 'maxDepth' ? 0 : 1, 1024 * 1024 * 1024)
  const hash = createHash('sha256')
  const budget = { entries: 0, bytes: 0, started: Date.now() }
  const chunk = Buffer.alloc(65536)
  const visit = (target, depth) => {
    if (depth > limits.maxDepth || ++budget.entries > limits.maxEntries || Date.now() - budget.started > limits.maxMs) throw new Error(`fingerprint traversal budget exceeded: ${root}`)
    const st = lstatSync(target)
    if (st.isSymbolicLink()) throw new Error(`symbolic link is not allowed in managed component: ${target}`)
    const rel = relative(root, target).replace(/\\/g, '/') || '.'
    hash.update(`${st.isDirectory() ? 'd' : 'f'}:${rel}:`)
    if (st.isDirectory()) {
      const names = []
      const dir = opendirSync(target)
      try {
        let entry
        while ((entry = dir.readSync())) {
          if (names.length + budget.entries >= limits.maxEntries || Date.now() - budget.started > limits.maxMs) throw new Error(`fingerprint entry/time budget exceeded: ${root}`)
          names.push(entry.name)
        }
      } finally { dir.closeSync() }
      for (const name of names.sort()) visit(resolve(target, name), depth + 1)
    } else {
      if (!st.isFile() || st.size > limits.maxFileBytes || budget.bytes + st.size > limits.maxTotalBytes) throw new Error(`fingerprint byte budget exceeded or unsupported file: ${target}`)
      const fd = openSync(target, 'r')
      let count = 0
      try {
        const opened = fstatSync(fd)
        if (!opened.isFile() || opened.ino !== st.ino || opened.dev !== st.dev || opened.size !== st.size || opened.mtimeMs !== st.mtimeMs) throw new Error(`file changed before fingerprint: ${target}`)
        let size
        while ((size = readSync(fd, chunk, 0, chunk.length, null))) {
          count += size
          if (count > st.size || Date.now() - budget.started > limits.maxMs) throw new Error(`file changed or timed out during fingerprint: ${target}`)
          hash.update(chunk.subarray(0, size))
        }
        const after = fstatSync(fd)
        const current = lstatSync(target)
        if (count !== st.size || after.size !== st.size || after.mtimeMs !== st.mtimeMs || current.ino !== st.ino || current.isSymbolicLink()) throw new Error(`file changed during fingerprint: ${target}`)
      } finally { closeSync(fd) }
      budget.bytes += count
    }
  }
  visit(root, 0)
  return { sha256: hash.digest('hex'), kind: lstatSync(root).isDirectory() ? 'directory' : 'file' }
}
