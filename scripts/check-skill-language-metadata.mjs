#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { skillMetadata } from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const sourceRoot = resolve(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills')
const mirrorRoot = resolve(repoRoot, '.agents', 'skills')

const sourceSkills = listSkillDirs(sourceRoot)
const metadataSkills = Object.keys(skillMetadata).sort()

const missingMetadata = sourceSkills.filter((name) => !metadataSkills.includes(name))
const extraMetadata = metadataSkills.filter((name) => !sourceSkills.includes(name))
const missingSourceYaml = sourceSkills.filter((name) => !existsSync(resolve(sourceRoot, name, 'agents', 'openai.yaml')))
const missingMirrorYaml = sourceSkills.filter((name) => !existsSync(resolve(mirrorRoot, name, 'agents', 'openai.yaml')))

if (
  missingMetadata.length === 0 &&
  extraMetadata.length === 0 &&
  missingSourceYaml.length === 0 &&
  missingMirrorYaml.length === 0
) {
  console.log(JSON.stringify({
    status: 'ok',
    skillCount: sourceSkills.length,
    metadataCount: metadataSkills.length,
  }, null, 2))
  process.exit(0)
}

console.error(JSON.stringify({
  status: 'mismatch',
  missingMetadata,
  extraMetadata,
  missingSourceYaml,
  missingMirrorYaml,
}, null, 2))
process.exit(1)

function listSkillDirs(root) {
  return readdirSync(root)
    .filter((name) => statSync(resolve(root, name)).isDirectory())
    .sort()
}
