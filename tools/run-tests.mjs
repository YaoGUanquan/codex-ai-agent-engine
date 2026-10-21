#!/usr/bin/env node
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { walkFiles } from './files.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const testsRoot = resolve(repoRoot, 'tests')
const files = walkFiles(testsRoot)
  .filter((file) => file.endsWith('.test.mjs'))
  .sort()

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
