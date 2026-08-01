#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export const codexSecurityBaseline = {
  sourceUrl: 'https://github.com/openai/codex-security',
  gitHead: '8f4348ea8b7d8d5c05417400b519a72cce24f0fd',
  packageName: '@openai/codex-security',
  packageVersion: '0.1.4',
  observedOn: '2026-07-31',
}

export function inspectCodexSecurityUpstream({ run = runCommand } = {}) {
  const git = run('git', ['ls-remote', `${codexSecurityBaseline.sourceUrl}.git`, 'HEAD'])
  const npm = run('npm', ['view', codexSecurityBaseline.packageName, 'version', 'license', '--json'])
  const gitHead = parseGitHead(git.stdout)
  const npmMetadata = parseNpmMetadata(npm.stdout)
  const observed = {
    gitHead,
    packageVersion: npmMetadata?.version || null,
    packageLicense: npmMetadata?.license || null,
  }
  const unavailable = []
  if (!gitHead) unavailable.push('git')
  if (!npmMetadata?.version) unavailable.push('npm')
  const drift = {
    gitHead: gitHead !== null && gitHead !== codexSecurityBaseline.gitHead,
    packageVersion: npmMetadata?.version != null && npmMetadata.version !== codexSecurityBaseline.packageVersion,
  }

  return {
    status: unavailable.length === 0 ? (drift.gitHead || drift.packageVersion ? 'drift-detected' : 'up-to-date') : 'partial-observation',
    readOnly: true,
    writesPerformed: false,
    baseline: codexSecurityBaseline,
    observed,
    drift,
    unavailable,
    adoptionRequired: drift.gitHead || drift.packageVersion,
    nextStep: drift.gitHead || drift.packageVersion
      ? 'Run ae-skill-audit, then PRD/plan/review before adopting upstream changes.'
      : unavailable.length > 0
        ? 'Retry when Git and npm registry access are available; do not infer that local guidance is current.'
        : 'No adoption action is required from this observation.',
  }
}

export function parseGitHead(output) {
  const match = String(output || '').match(/^([0-9a-f]{40})\s+HEAD\s*$/m)
  return match ? match[1] : null
}

export function parseNpmMetadata(output) {
  try {
    const value = JSON.parse(String(output || ''))
    if (!value || typeof value !== 'object' || typeof value.version !== 'string') return null
    return { version: value.version, license: typeof value.license === 'string' ? value.license : null }
  } catch {
    return null
  }
}

function runCommand(command, args) {
  // npm is a .cmd shim on Windows; this command and every argument are fixed constants.
  const result = process.platform === 'win32' && command === 'npm'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm view @openai/codex-security version license --json'], { encoding: 'utf8', stdio: 'pipe' })
    : spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' })
  return {
    status: result.status,
    stdout: result.stdout || '',
    available: !result.error && result.status === 0,
  }
}

function main() {
  console.log(JSON.stringify(inspectCodexSecurityUpstream(), null, 2))
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  main()
}
