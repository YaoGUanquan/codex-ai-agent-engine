#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const result = spawnSync('officecli', ['--version'], {
  encoding: 'utf8',
  shell: false,
  stdio: 'pipe',
})

if (result.status === 0) {
  console.log(JSON.stringify({
    status: 'ok',
    available: true,
    versionOutput: result.stdout.trim(),
  }, null, 2))
  process.exit(0)
}

console.log(JSON.stringify({
  status: 'skip',
  available: false,
  reason: result.error?.message || result.stderr.trim() || 'officecli not found in PATH',
}, null, 2))
