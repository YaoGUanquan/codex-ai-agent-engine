#!/usr/bin/env node
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderYaml, skillMetadata, supportedLanguages } from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'

const args = process.argv.slice(2)
const lang = readArg('--lang') || args[0] || 'bilingual'

if (!supportedLanguages.has(lang)) {
  console.error('Usage: node scripts/set-language.mjs --lang en|zh-CN|bilingual')
  process.exit(1)
}

const roots = [
  resolve('plugins', 'ai-agent-engine-codex', 'skills'),
  resolve('.ae-source', 'skills'),
]

let changed = 0
for (const root of roots) {
  for (const [skill, item] of Object.entries(skillMetadata)) {
    const file = resolve(root, skill, 'agents', 'openai.yaml')
    if (!existsSync(file)) continue
    writeFileSync(file, renderYaml(item, lang), 'utf8')
    changed++
  }
}

console.log(JSON.stringify({ status: 'language-updated', lang, filesChanged: changed }, null, 2))

function readArg(name) {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] || null : null
}
