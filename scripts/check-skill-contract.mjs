#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const skillRoots = [
  resolve(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills'),
  resolve(repoRoot, '.agents', 'skills'),
]
const maxDescriptionLength = 1024
const errors = []
const warnings = []
let checkedSkills = 0

for (const root of skillRoots) {
  validateSkillRoot(root)
}

const result = {
  status: errors.length === 0 ? 'ok' : 'failed',
  checkedRoots: skillRoots.map((root) => toPosix(relative(repoRoot, root))),
  checkedSkills,
  skillCount: checkedSkills,
  errors,
  warnings,
}

if (errors.length > 0) {
  console.error(JSON.stringify(result, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(result, null, 2))

function validateSkillRoot(root) {
  ensureInsideRepo(root, 'skillRoot')
  if (!existsSync(root)) {
    errors.push({ root: toPosix(relative(repoRoot, root)), message: 'skill root does not exist' })
    return
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const relEntry = toPosix(relative(repoRoot, resolve(root, entry.name)))
    if (!entry.isDirectory() || !entry.name.startsWith('ae-')) {
      errors.push({ path: relEntry, message: 'skill root entries must be ae-* directories only' })
      continue
    }
    validateSkillDirectory(resolve(root, entry.name), entry.name)
  }
}

function validateSkillDirectory(skillDir, dirName) {
  ensureInsideRepo(skillDir, 'skillDir')
  const skillFile = resolve(skillDir, 'SKILL.md')
  const metadataFile = resolve(skillDir, 'agents', 'openai.yaml')
  const relSkillDir = toPosix(relative(repoRoot, skillDir))

  if (!existsSync(skillFile)) {
    errors.push({ path: relSkillDir, message: 'missing SKILL.md' })
    return
  }
  if (!existsSync(metadataFile)) {
    errors.push({ path: relSkillDir, message: 'missing agents/openai.yaml' })
  }

  checkedSkills++
  const content = readFileSync(skillFile, 'utf8')
  const frontmatter = parseFrontmatter(content)
  if (!frontmatter) {
    errors.push({ path: toPosix(relative(repoRoot, skillFile)), message: 'missing or malformed frontmatter' })
    return
  }

  if (frontmatter.name !== dirName) {
    errors.push({
      path: toPosix(relative(repoRoot, skillFile)),
      field: 'name',
      message: `frontmatter name must match directory name ${dirName}`,
    })
  }

  if (!frontmatter.description) {
    errors.push({ path: toPosix(relative(repoRoot, skillFile)), field: 'description', message: 'description is required' })
  } else if (frontmatter.description.length > maxDescriptionLength) {
    errors.push({
      path: toPosix(relative(repoRoot, skillFile)),
      field: 'description',
      message: `description exceeds ${maxDescriptionLength} characters`,
    })
  } else if (frontmatter.description.length < 20) {
    warnings.push({
      path: toPosix(relative(repoRoot, skillFile)),
      field: 'description',
      message: 'description is short; confirm trigger clarity',
    })
  }

  validateSkillLinks(skillFile, content)
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return null

  const data = {}
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const index = line.indexOf(':')
    if (index < 0) {
      errors.push({ field: 'frontmatter', message: `invalid frontmatter line: ${line}` })
      continue
    }
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    if (!key) continue
    data[key] = parseScalar(value)
  }
  return data
}

function parseScalar(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function validateSkillLinks(file, content) {
  const linkPattern = /\[[^\]]+\]\(([^)]+SKILL\.md(?:#[^)]+)?)\)/g
  let match
  while ((match = linkPattern.exec(content)) !== null) {
    const rawTarget = match[1].split('#')[0]
    if (/^[a-z]+:\/\//i.test(rawTarget)) continue

    const target = resolve(dirname(file), rawTarget)
    ensureInsideRepo(target, 'skillLink')
    if (!existsSync(target) || !statSync(target).isFile()) {
      errors.push({
        path: toPosix(relative(repoRoot, file)),
        target: rawTarget,
        message: 'linked SKILL.md does not exist',
      })
    }
  }
}

function ensureInsideRepo(path, label) {
  const relPath = relative(repoRoot, path)
  if (relPath === '' || relPath.startsWith('..') || /^[A-Za-z]:/.test(relPath)) {
    throw new Error(`${label} must stay inside repository: ${path}`)
  }
}

function toPosix(value) {
  return value.replace(/\\/g, '/')
}
