#!/usr/bin/env node
import { readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const scanRoots = [
  'scripts',
  'plugins/ai-agent-engine-codex/scripts',
  'tests',
]

const files = scanRoots.flatMap((root) => walk(resolve(repoRoot, root))).sort()
const failures = []

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', stdio: 'pipe' })
  if (result.status !== 0) {
    failures.push({
      path: toPosix(relative(repoRoot, file)),
      message: (result.stderr || result.stdout || `node --check exited with ${result.status}`).trim(),
    })
  }
}

const result = {
  status: failures.length === 0 ? 'ok' : 'failed',
  scanRoots,
  checkedFiles: files.length,
  failures,
}

if (failures.length > 0) {
  console.error(JSON.stringify(result, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(result, null, 2))

function walk(root) {
  const out = []
  let entries = []
  try { entries = readdirSync(root, { withFileTypes: true }) } catch { return out }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    const full = resolve(root, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith('.mjs')) out.push(full)
  }
  return out
}

function toPosix(value) {
  return value.replace(/\\/g, '/')
}
