import { lstatSync, readdirSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = fileURLToPath(new URL('../', import.meta.url))

export function isWithin(root, target) {
  const rel = relative(root, target)
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\'))
}

export function walkFiles(root) {
  const absolute = resolve(root)
  if (lstatSync(absolute).isSymbolicLink() || relative(absolute, realpathSync(absolute)) !== '') {
    throw new Error(`Linked root is not allowed: ${absolute}`)
  }
  const files = []
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) throw new Error(`Linked resource is not allowed: ${path}`)
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) files.push(path)
      else throw new Error(`Unsupported resource: ${path}`)
    }
  }
  visit(absolute)
  return files.sort()
}

export function isMain(url) {
  return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(url))
}
