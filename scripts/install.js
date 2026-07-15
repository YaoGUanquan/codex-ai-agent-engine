#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scope = process.argv.find((arg) => arg === 'global' || arg === 'project') || 'project'
if (scope !== 'project') {
  console.error('This branch supports project-level installation only.')
  process.exit(1)
}

const script = resolve(dirname(fileURLToPath(import.meta.url)), 'install-project.mjs')
const result = spawnSync(process.execPath, [script, '--target', process.cwd()], {
  stdio: 'inherit',
  env: process.env,
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
