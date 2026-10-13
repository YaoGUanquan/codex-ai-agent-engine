#!/usr/bin/env node
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const testsRoot = resolve(repoRoot, 'tests')
const files = walk(testsRoot)
  .filter((file) => file.endsWith('.test.mjs'))
  .sort((left, right) => left.localeCompare(right))

if (files.length === 0) {
  console.error('No test files found under tests/**/*.test.mjs')
  process.exit(1)
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  cwd: repoRoot,
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true })
  const collected = []
  for (const entry of entries) {
    const absolute = join(directory, entry.name)
    if (entry.isDirectory()) collected.push(...walk(absolute))
    else if (entry.isFile()) collected.push(absolute)
  }
  return collected
}
