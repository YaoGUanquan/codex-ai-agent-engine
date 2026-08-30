#!/usr/bin/env node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const repo = readArg('--repo') || 'https://github.com/YaoGUanquan/codex-ai-agent-engine.git'
const branch = readArg('--branch') || 'main'
const passthrough = passthroughArgs()
const tempRoot = mkdtempSync(resolve(tmpdir(), 'ae-codex-global-update-'))

try {
  run('git', ['clone', '--depth', '1', '--branch', branch, repo, tempRoot])
  const installer = resolve(tempRoot, 'scripts', 'install-global.mjs')
  const preview = runJson(process.execPath, [installer, 'preview', ...passthrough])
  const result = runJson(process.execPath, [installer, 'apply', ...passthrough, '--apply', '--operation', preview.operationId, '--confirm', preview.confirmation])
  console.log(JSON.stringify({ status: 'updated', repo, branch, preview, result }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? `ERROR: ${error.message}` : `ERROR: ${String(error)}`)
  process.exitCode = Number.isInteger(error?.exitCode) ? error.exitCode : 1
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}

function readArg(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] || null : null
}

function passthroughArgs() {
  const kept = []
  for (let index = 0; index < args.length; index++) {
    if (['--repo', '--branch', '--target'].includes(args[index])) {
      index++
      continue
    }
    kept.push(args[index])
  }
  return kept
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', shell: false })
  if (result.error) throw result.error
  if (result.status !== 0) throw commandFailure(`${command} failed`, result.status)
}

function runJson(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', stdio: 'pipe', shell: false })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || 'global installer failed').trim()
    throw commandFailure(detail, result.status)
  }
  return JSON.parse(result.stdout)
}

function commandFailure(message, status) {
  const error = new Error(message)
  error.exitCode = status ?? 1
  return error
}
