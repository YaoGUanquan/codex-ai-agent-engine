#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const installer = resolve(repoRoot, 'scripts', 'install-global.mjs')
if (!existsSync(installer)) fail(`global installer not found: ${installer}`)
const result = spawnSync(process.execPath, [installer, 'preview'], { cwd: repoRoot, encoding: 'utf8' })
if (result.status !== 0) fail(result.stderr || 'global preview failed')
const preview = JSON.parse(result.stdout)
if (preview.status !== 'preview') fail('global preview did not return preview status')
if (resolve(preview.homeRoot) !== resolve(homedir())) fail('global preview escaped the current user home')
if (!Array.isArray(preview.projects) || preview.projects.filter((project) => project.role === 'consumer').length !== 7) fail('global preview did not retain the seven-consumer first batch')
if (preview.projects.filter((project) => project.role === 'distribution-source').length !== 1 || preview.projects.filter((project) => project.role === 'deferred').length !== 1) fail('global preview did not retain source/deferred exclusions')
console.log(JSON.stringify({ status: 'ok', checked: ['preview', 'current-user-home', 'seven-consumer-manifest', 'source-deferred-exclusions'] }, null, 2))

function fail(message) {
  console.error(message)
  process.exit(1)
}
