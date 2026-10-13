#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  DEFAULT_IMPLICIT_TIER,
  coreImplicitSkills,
  renderYaml,
  skillMetadata,
  supportedImplicitTiers,
  supportedLanguages,
} from './skill-language-metadata.mjs'

const args = process.argv.slice(2)
const lang = readArg('--lang') || args[0] || 'bilingual'
const targetRoot = resolve(readArg('--target') || process.cwd())
const implicitArg = readArg('--implicit')

if (!supportedLanguages.has(lang)) {
  console.error('Usage: node scripts/set-language.mjs --lang en|zh-CN|bilingual [--implicit core|all|none] [--target <project>]')
  process.exit(1)
}

if (implicitArg && !supportedImplicitTiers.has(implicitArg)) {
  console.error('Usage: node scripts/set-language.mjs --lang en|zh-CN|bilingual [--implicit core|all|none] [--target <project>]')
  process.exit(1)
}

const roots = [
  resolve(targetRoot, 'plugins', 'ai-agent-engine-codex', 'skills'),
  resolve(targetRoot, '.agents', 'skills'),
]

const settingsPath = resolve(targetRoot, '.agents', 'ai-agent-engine-codex', 'display-settings.json')
const implicitTier = implicitArg || readPersistedImplicitTier(settingsPath) || detectImplicitTier(roots) || DEFAULT_IMPLICIT_TIER

let changed = 0
for (const root of roots) {
  if (!existsSync(root)) continue
  for (const [skill, item] of Object.entries(skillMetadata)) {
    const file = resolve(root, skill, 'agents', 'openai.yaml')
    if (!existsSync(file)) continue
    writeFileSync(file, renderYaml(item, lang, { implicitTier }), 'utf8')
    changed++
  }
}

if (implicitArg || existsSync(settingsPath)) {
  persistImplicitTier(settingsPath, implicitTier)
}

console.log(JSON.stringify({
  status: 'language-updated',
  lang,
  implicitTier,
  targetRoot,
  filesChanged: changed,
}, null, 2))

function readArg(name) {
  const idx = args.indexOf(name)
  return idx >= 0 ? args[idx + 1] || null : null
}

function readPersistedImplicitTier(path) {
  if (!existsSync(path)) return null
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'))
    return supportedImplicitTiers.has(value?.implicitTier) ? value.implicitTier : null
  } catch {
    return null
  }
}

function persistImplicitTier(path, tier) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify({ schemaVersion: 1, implicitTier: tier }, null, 2)}\n`, 'utf8')
}

function detectImplicitTier(candidateRoots) {
  const coreSet = new Set(coreImplicitSkills)
  for (const root of candidateRoots) {
    if (!existsSync(root)) continue
    const present = []
    const allowed = []
    for (const skill of Object.keys(skillMetadata)) {
      const file = resolve(root, skill, 'agents', 'openai.yaml')
      if (!existsSync(file)) continue
      present.push(skill)
      const content = readFileSync(file, 'utf8')
      if (/^ {2}allow_implicit_invocation:\s*true\s*$/m.test(content)) allowed.push(skill)
    }
    if (present.length === 0) continue
    if (allowed.length === 0) return 'none'
    if (allowed.length === present.length) return 'all'
    if (
      allowed.length === coreImplicitSkills.length
      && allowed.every((name) => coreSet.has(name))
      && coreImplicitSkills.every((name) => allowed.includes(name))
    ) {
      return 'core'
    }
    return DEFAULT_IMPLICIT_TIER
  }
  return null
}
