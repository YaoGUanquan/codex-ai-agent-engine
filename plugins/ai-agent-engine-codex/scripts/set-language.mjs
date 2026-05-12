#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderYaml, skillMetadata, supportedLanguages } from './skill-language-metadata.mjs'

const args = process.argv.slice(2)
const lang = readArg('--lang') || args[0] || 'en'
const targetRoot = resolve(readArg('--target') || process.cwd())

if (!supportedLanguages.has(lang)) {
  console.error('Usage: node scripts/set-language.mjs --lang en|zh-CN|bilingual [--target <project>]')
  process.exit(1)
}

const roots = [
  resolve(targetRoot, 'plugins', 'ai-agent-engine-codex', 'skills'),
  resolve(targetRoot, '.agents', 'skills'),
]

let changed = 0
for (const root of roots) {
  if (!existsSync(root)) continue
  for (const [skill, item] of Object.entries(skillMetadata)) {
    const file = resolve(root, skill, 'agents', 'openai.yaml')
    if (!existsSync(file)) continue
    writeFileSync(file, renderYaml(item, lang), 'utf8')
    changed++
  }
}

console.log(JSON.stringify({ status: 'language-updated', lang, targetRoot, filesChanged: changed }, null, 2))

function readArg(name) {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] || null : null
}
