#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { stripVTControlCharacters } from 'node:util'

const args = process.argv.slice(2)
const targetRoot = resolve(readArg('--target') || process.cwd())
const branch = readArg('--branch') || 'main'
const repo = readArg('--repo') || readInstalledRepo(targetRoot)
const lang = readArg('--lang') || readInstalledLang(targetRoot) || 'bilingual'
const supportedLangs = new Set(['en', 'zh-CN', 'bilingual'])

if (!supportedLangs.has(lang)) {
  fail('Usage: node scripts/update-ae-codex.mjs [--repo <url>] [--branch main] [--target <project>] [--lang en|zh-CN|bilingual]')
}

if (!repo || isPlaceholderRepo(repo)) {
  fail([
    'Repository URL is not configured.',
    'Pass --repo https://github.com/<owner>/<repo>.git or update plugins/ai-agent-engine-codex/.codex-plugin/plugin.json repository.',
  ].join('\n'))
}

const tempRoot = mkdtempSync(resolve(tmpdir(), 'ae-codex-update-'))
try {
  run('git', ['clone', '--depth', '1', '--branch', branch, '--', repo, tempRoot])
  const sourceRevision = run('git', ['-C', tempRoot, 'rev-parse', 'HEAD'], { capture: true }).trim()
  const expectedRevision = readArg('--revision')
  if (expectedRevision && expectedRevision !== sourceRevision) throw new Error('cloned source revision does not match --revision; target was not changed')
  const installer = resolve(tempRoot, 'scripts', 'install-project.mjs')
  if (!existsSync(installer)) throw new Error(`Installer not found in cloned repository: ${installer}`)
  const installerFingerprint = createHash('sha256').update(readFileSync(installer)).digest('hex')
  run(process.execPath, [installer, '--target', targetRoot, '--lang', lang, ...(args.includes('--replace-modified') ? ['--replace-modified'] : [])])
  const maintenance = args.includes('--no-tidy')
    ? { status: 'skipped', reason: 'maintenance disabled by --no-tidy' }
    : runPostUpdateMaintenance(targetRoot)
  const statePath = resolve(targetRoot, '.agents', 'ai-agent-engine-codex', 'project-install.json')
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : null
  console.log(JSON.stringify({
    status: maintenance.status === 'failed' ? 'updated-maintenance-failed' : 'updated',
    installation: 'updated', targetRoot, repo: redactRepository(repo), branch, lang,
    source_revision: sourceRevision, installer_fingerprint: installerFingerprint,
    source_fingerprint: state?.sourceFingerprint || null, operationId: state?.operationId || null,
    maintenance, maintenance_complete: maintenance.status === 'applied',
  }, null, 2))
  if (maintenance.status === 'failed') process.exitCode = 1
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}

// Post-update maintenance: run the freshly installed CLI's conservative tidy pass
// (done/empty notes, expired evidence, memory budget report; never --archive-stale).
// Installation is already committed; maintenance failure is a separate, retryable outcome.
function runPostUpdateMaintenance(targetRoot) {
  const cli = resolve(targetRoot, 'scripts', 'ae-tools.mjs')
  if (!existsSync(cli)) return { status: 'skipped', reason: 'scripts/ae-tools.mjs not found in target project' }
  const result = spawnSync(process.execPath, [cli, 'tidy', '--apply'], { cwd: targetRoot, encoding: 'utf8', stdio: 'pipe', shell: false, timeout: 60000, maxBuffer: 4 * 1024 * 1024 })
  if (result.error) return { status: 'failed', reason: `tidy failed to start or complete: ${result.error.code || result.error.message}` }
  if (result.status !== 0) {
    return { status: 'failed', reason: `tidy exited with ${result.status}`, retry: 'run tidy separately after inspecting the target; do not reinstall to retry maintenance' }
  }
  try {
    const report = JSON.parse(result.stdout)
    if (!['ok', 'applied'].includes(report.status)) return { status: 'failed', reason: 'tidy reported an unsuccessful business status' }
    return {
      status: 'applied',
      archivedTasks: report.applied?.archivedTasks ?? [],
      removedEmptyDirs: report.applied?.removedEmptyDirs ?? [],
      movedEvidence: report.applied?.movedEvidence ?? [],
      ledgerRewrites: report.applied?.ledgerRewrites ?? 0,
      memoryBudget: report.memoryBudget ?? null,
    }
  } catch {
    return { status: 'failed', reason: 'tidy output was not parseable JSON' }
  }
}

function readArg(name) {
  const idx = args.indexOf(name)
  if (idx < 0) return null
  const value = args[idx + 1]
  if (!value || value.startsWith('--')) fail(`${name} requires a value`)
  return value
}

function readInstalledRepo(targetRoot) {
  const manifest = resolve(targetRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json')
  if (!existsSync(manifest)) return null
  try {
    return JSON.parse(readFileSync(manifest, 'utf8')).repository || null
  } catch {
    return null
  }
}

function readInstalledLang(targetRoot) {
  const file = resolve(targetRoot, '.agents', 'skills', 'ae-help', 'agents', 'openai.yaml')
  if (!existsSync(file)) return null
  const content = readFileSync(file, 'utf8')
  if (content.includes('查看 Codex 中可用的 AE 工作流能力 / List AE workflow capabilities for Codex')) return 'bilingual'
  if (content.includes('查看 Codex 中可用的 AE 工作流能力')) return 'zh-CN'
  if (content.includes('List AE workflow capabilities for Codex')) return 'en'
  return null
}

function isPlaceholderRepo(value) {
  return (
    !value ||
    value.includes('<owner>') ||
    value.includes('<repo>') ||
    value.includes('your-org') ||
    value.includes('jiangqiang1996/ai-agent-engine')
  )
}

function run(command, commandArgs, { capture = false } = {}) {
  const result = spawnSync(command, commandArgs, { stdio: 'pipe', encoding: 'utf8', shell: false, timeout: 120000, maxBuffer: 4 * 1024 * 1024 })
  if (result.error || result.status !== 0) {
    const diagnostics = [result.error?.message, result.stdout, result.stderr].filter(Boolean).map(safeDiagnostic)
    throw new Error([`${command} failed with exit code ${result.status ?? 1}; update did not complete`, ...diagnostics].join('\n'))
  }
  if (!capture && command !== 'git' && result.stdout) process.stdout.write(result.stdout)
  return result.stdout || ''
}

function safeDiagnostic(value) {
  const text = stripVTControlCharacters(String(value))
    .replaceAll(repo, redactRepository(repo))
    .replace(/https?:\/\/[^\s"'<>]+/gi, redactRepository)
    .replace(/((?:authorization|proxy-authorization|cookie|set-cookie)\s*:)[^\r\n]*/gi, '$1 [redacted]')
    .replace(/((?:token|password|passwd|secret|api[-_]?key|access[-_]?token|refresh[-_]?token)["']?\s*[:=]\s*["']?)[^\s"',;]+/gi, '$1[redacted]')
  const bytes = Buffer.from(text)
  if (bytes.length <= 8192) return text.trim()
  return `${bytes.subarray(0, 4096).toString('utf8')}\n[diagnostic truncated]\n${bytes.subarray(-4096).toString('utf8')}`
}

function redactRepository(value) {
  try {
    const url = new URL(value)
    url.username = ''; url.password = ''; url.search = ''; url.hash = ''
    return url.href
  } catch { return value }
}
function fail(message) {
  console.error(message)
  process.exit(1)
}
