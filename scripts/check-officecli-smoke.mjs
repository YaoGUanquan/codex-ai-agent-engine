#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const tempRoot = resolve(repoRoot, '.tmp-officecli-smoke', randomUUID())
const docPath = resolve(tempRoot, 'smoke.docx')

const availability = run('officecli', ['--version'])
if (availability.status !== 0) {
  console.log(JSON.stringify({
    status: 'skip',
    available: false,
    reason: availability.error?.message || availability.stderr.trim() || 'officecli not found in PATH',
  }, null, 2))
  process.exit(0)
}

mkdirSync(tempRoot, { recursive: true })

try {
  runOrThrow('officecli', ['docx', 'create', '--output', docPath])
  runOrThrow('officecli', ['docx', 'query', '--input', docPath, '--json'])

  console.log(JSON.stringify({
    status: 'ok',
    available: true,
    tempRoot: relative(repoRoot, tempRoot),
    verified: ['docx create', 'docx query --json'],
  }, null, 2))
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    stdio: 'pipe',
  })
}

function runOrThrow(command, args) {
  const result = run(command, args)
  if (result.status === 0) return result
  throw new Error([
    `Command failed: ${command} ${args.join(' ')}`,
    result.stdout.trim(),
    result.stderr.trim(),
  ].filter(Boolean).join('\n'))
}
