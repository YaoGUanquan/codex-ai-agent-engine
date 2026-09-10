#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const targetRoot = resolve(readArg('--target') || repoRoot)
const skillRoots = [
  resolve(targetRoot, 'plugins', 'ai-agent-engine-codex', 'skills'),
  resolve(targetRoot, '.ae-source', 'skills'),
]
const maxDescriptionLength = 1024
const errors = []
const warnings = []
let checkedSkills = 0
let checkedMarkdownFiles = 0

for (const root of skillRoots) {
  validateSkillRoot(root)
}

const result = {
  status: errors.length === 0 ? 'ok' : 'failed',
  targetRoot,
  checkedRoots: skillRoots.map((root) => toPosix(relative(targetRoot, root))),
  checkedSkills,
  checkedMarkdownFiles,
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
    const relEntry = toPosix(relative(targetRoot, resolve(root, entry.name)))
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
  const relSkillDir = toPosix(relative(targetRoot, skillDir))

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

  for (const markdownFile of collectMarkdownFiles(skillDir)) {
    checkedMarkdownFiles++
    validateMarkdownLinks(markdownFile, readFileSync(markdownFile, 'utf8'))
  }
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

function collectMarkdownFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory() && !entry.isSymbolicLink()) files.push(...collectMarkdownFiles(path))
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path)
  }
  return files.sort((a, b) => a.localeCompare(b))
}

function validateMarkdownLinks(file, content) {
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = linkPattern.exec(content)) !== null) {
    let rawTarget = match[1].trim()
    if (rawTarget.startsWith('<') && rawTarget.endsWith('>')) rawTarget = rawTarget.slice(1, -1)
    rawTarget = rawTarget.split('#')[0].split('?')[0]
    if (!rawTarget || rawTarget.startsWith('#') || /^[a-z]+:/i.test(rawTarget) || rawTarget.startsWith('/')) continue
    if (!rawTarget.toLowerCase().endsWith('.md')) continue

    const target = resolve(dirname(file), rawTarget)
    if (!isInsideTarget(target)) {
      errors.push({
        path: toPosix(relative(targetRoot, file)),
        target: rawTarget,
        message: 'relative Markdown link escapes the target repository',
      })
      continue
    }
    if (!existsSync(target) || !statSync(target).isFile()) {
      errors.push({
        path: toPosix(relative(targetRoot, file)),
        target: rawTarget,
        message: 'linked Markdown file does not exist',
      })
    }
  }
}

function ensureInsideRepo(path, label) {
  const relPath = relative(targetRoot, path)
  if (relPath === '' || relPath.startsWith('..') || /^[A-Za-z]:/.test(relPath)) {
    throw new Error(`${label} must stay inside repository: ${path}`)
  }
}

function isInsideTarget(path) {
  const relPath = relative(targetRoot, path)
  return relPath === '' || (!relPath.startsWith('..') && !/^[A-Za-z]:/.test(relPath))
}

function readArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

function toPosix(value) {
  return value.replace(/\\/g, '/')
}
