#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const repoArg = readArg('--repo') || args[0]
if (!repoArg) {
  console.error('Usage: node scripts/set-repository.mjs --repo https://github.com/<owner>/<repo>[.git]')
  process.exit(1)
}

const normalized = normalizeRepo(repoArg)
const replacements = new Map([
  ['https://github.com/<owner>/<repo>.git', `${normalized.https}.git`],
  ['https://github.com/<owner>/<repo>', normalized.https],
  ['https://raw.githubusercontent.com/<owner>/<repo>/main/INSTALL.md', `${normalized.rawBase}/main/INSTALL.md`],
  ['https://github.com/<owner>', `https://github.com/${normalized.owner}`],
])

const files = [
  'README.md',
  'README.zh-CN.md',
  'INSTALL.md',
  'INSTALL.zh-CN.md',
  'NOTICE.md',
  'plugins/ai-agent-engine-codex/.codex-plugin/plugin.json',
]

for (const file of files) {
  let text = readFileSync(file, 'utf8')
  for (const [from, to] of replacements) text = text.split(from).join(to)
  writeFileSync(file, text, 'utf8')
}

const manifestPath = 'plugins/ai-agent-engine-codex/.codex-plugin/plugin.json'
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
manifest.repository = `${normalized.https}.git`
manifest.homepage = normalized.https
manifest.author.url = `https://github.com/${normalized.owner}`
manifest.interface.websiteURL = normalized.https
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(JSON.stringify({ status: 'updated', repository: `${normalized.https}.git`, rawInstall: `${normalized.rawBase}/main/INSTALL.md` }, null, 2))

function readArg(name) {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] || null : null
}

function normalizeRepo(input) {
  const cleaned = input.trim().replace(/\.git$/, '').replace(/\/$/, '')
  const match = cleaned.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/)
  if (!match) {
    console.error('Only https://github.com/<owner>/<repo> URLs are supported by this helper.')
    process.exit(1)
  }
  const [, owner, repo] = match
  return {
    owner,
    repo,
    https: `https://github.com/${owner}/${repo}`,
    rawBase: `https://raw.githubusercontent.com/${owner}/${repo}`,
  }
}
