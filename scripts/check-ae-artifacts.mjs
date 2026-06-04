#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const targetRoot = resolve(readArg('--target') || repoRoot)
const artifactRoot = resolve(targetRoot, 'docs', 'ae')

const allowedTypes = new Set(['prd', 'prd-shard', 'plan', 'plan-shard', 'design', 'design-shard', 'work', 'review'])
const allowedStatuses = new Set(['drafted', 'ready', 'review-passed', 'review-needs-fix', 'blocked', 'aborted', 'active', 'completed'])
const prdStatuses = new Set(['drafted', 'review-passed', 'completed'])
const planStatuses = new Set(['drafted', 'ready', 'active', 'completed'])
const errors = []
let checked = 0

if (existsSync(artifactRoot)) {
  for (const file of walk(artifactRoot)) {
    if (!file.endsWith('.md')) continue
    const content = readFileSync(file, 'utf8')
    const frontmatter = parseFrontmatter(content)
    if (!frontmatter) continue
    const relPath = toPosix(relative(targetRoot, file))
    checked++
    validateFrontmatter(relPath, frontmatter)
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({
    status: 'failed',
    targetRoot,
    checked,
    errors,
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'ok',
  targetRoot,
  checked,
}, null, 2))

function validateFrontmatter(path, data) {
  if (!allowedTypes.has(data.type)) {
    errors.push({ path, field: 'type', message: `type must be one of ${Array.from(allowedTypes).join(', ')}` })
  }
  if (!allowedStatuses.has(data.status)) {
    errors.push({ path, field: 'status', message: `status is not valid for ${data.type || 'artifact'}` })
  }
  if (data.origin && looksLikePath(data.origin) && !isRepositoryRelativePath(data.origin)) {
    errors.push({ path, field: 'origin', message: 'origin must be a repository-relative path' })
  }
  if (data.supersededBy && !isRepositoryRelativePath(data.supersededBy)) {
    errors.push({ path, field: 'supersededBy', message: 'supersededBy must be a repository-relative path' })
  }
  if (data.type === 'prd') {
    if (!data.date) errors.push({ path, field: 'date', message: 'prd requires date' })
    if (!data.topic) errors.push({ path, field: 'topic', message: 'prd requires topic' })
    if (!prdStatuses.has(data.status)) errors.push({ path, field: 'status', message: 'prd status must be drafted, review-passed, or completed' })
  }
  if (data.type === 'plan') {
    if (!data.date) errors.push({ path, field: 'date', message: 'plan requires date' })
    if (!data.title) errors.push({ path, field: 'title', message: 'plan requires title' })
    if (!planStatuses.has(data.status)) errors.push({ path, field: 'status', message: 'plan status must be drafted, ready, active, or completed' })
  }
  if (String(data.type || '').endsWith('-shard')) {
    if (!data.parent || !isRepositoryRelativePath(data.parent)) {
      errors.push({ path, field: 'parent', message: 'shard artifacts require repository-relative parent' })
    }
    if (!data.module) errors.push({ path, field: 'module', message: 'shard artifacts require module' })
  }
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null
  const normalized = content.replace(/\r\n/g, '\n')
  const end = normalized.indexOf('\n---\n', 4)
  if (end < 0) return null
  const block = normalized.slice(4, end)
  const data = {}
  for (const line of block.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const index = line.indexOf(':')
    if (index < 0) continue
    const key = line.slice(0, index).trim()
    const raw = line.slice(index + 1).trim()
    data[key] = parseScalar(raw)
  }
  return data
}

function parseScalar(value) {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function walk(root) {
  const files = []
  for (const entry of readdirSync(root)) {
    const full = resolve(root, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) files.push(...walk(full))
    else if (stat.isFile()) files.push(full)
  }
  return files
}

function readArg(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

function isRepositoryRelativePath(value) {
  return typeof value === 'string' && value.length > 0 && !isAbsolute(value) && !/^[a-zA-Z]:[\\/]/.test(value) && !value.split(/[\\/]+/).includes('..')
}

function looksLikePath(value) {
  return typeof value === 'string' && /[\\/]/.test(value)
}

function toPosix(value) {
  return value.replace(/\\/g, '/')
}
