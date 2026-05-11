#!/usr/bin/env node
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const targetRoot = resolve(readArg('--target') || process.cwd())
const branch = readArg('--branch') || 'main'
const repo = readArg('--repo') || readInstalledRepo(targetRoot)
const lang = readArg('--lang') || readInstalledLang(targetRoot) || 'en'
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
  run('git', ['clone', '--depth', '1', '--branch', branch, repo, tempRoot])
  const installer = resolve(tempRoot, 'scripts', 'install-project.mjs')
  if (!existsSync(installer)) fail(`Installer not found in cloned repository: ${installer}`)
  run(process.execPath, [installer, '--target', targetRoot, '--lang', lang])
  console.log(JSON.stringify({ status: 'updated', targetRoot, repo, branch, lang }, null, 2))
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}

function readArg(name) {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] || null : null
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

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', shell: false })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
