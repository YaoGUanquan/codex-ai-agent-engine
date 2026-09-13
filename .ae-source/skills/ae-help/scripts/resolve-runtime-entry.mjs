#!/usr/bin/env node
import { lstatSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function resolveRuntimeEntry({ projectRoot = process.cwd(), homeRoot = homedir() } = {}) {
  const root = resolve(projectRoot)
  if (!statSync(root).isDirectory()) throw new Error('AE_RUNTIME_ENTRY_INVALID: project root must be a directory')
  const local = findEntry(root, ['scripts', 'ae-tools.mjs'])
  if (local) return local
  const global = findEntry(resolve(homeRoot), ['.agents', 'ai-agent-engine-codex', 'bin', 'ae.mjs'])
  if (global) return global
  throw new Error('AE_RUNTIME_ENTRY_NOT_FOUND: no project wrapper or current-user global dispatcher; inspect the installation before continuing')
}

function findEntry(root, parts) {
  let path = root
  for (const [index, part] of parts.entries()) {
    path = resolve(path, part)
    try {
      lstatSync(path)
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
    // A dangling link is an invalid installation, not permission to change versions.
    const info = statSync(path)
    const valid = index === parts.length - 1 ? info.isFile() : info.isDirectory()
    if (!valid) throw new Error(`AE_RUNTIME_ENTRY_INVALID: unexpected file type at ${path}`)
  }
  return path
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.length !== 0 && (args.length !== 2 || args[0] !== '--project-root' || !args[1] || args[1].startsWith('--'))) {
      throw new Error('Usage: node resolve-runtime-entry.mjs [--project-root <directory>]')
    }
    console.log(resolveRuntimeEntry({ projectRoot: args[1] || process.cwd() }))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
