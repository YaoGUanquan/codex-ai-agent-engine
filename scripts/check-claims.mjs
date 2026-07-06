#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const targetRoot = resolve(readArg('--target') || repoRoot)
const dryRun = args.includes('--dry-run')
const includes = readArgs('--include')

const allowedLayers = new Set(['Memory', 'Knowledge', 'Guardrail', 'Delegation', 'Distribution'])
const allowedStatuses = new Set(['active', 'assumption', 'deferred', 'retracted'])
const allowedEvidenceTypes = new Set(['path', 'command', 'assumption', 'deferred'])
const requiredFields = ['id', 'claim', 'source', 'layer', 'status', 'evidenceType', 'evidence']
const errors = []
const warnings = []
const unverifiable = []
const claimFiles = new Set()
let claimsChecked = 0

ensureInside(targetRoot, targetRoot, 'target')

if (!dryRun) {
  errors.push({
    file: null,
    line: null,
    field: 'dryRun',
    message: 'Only --dry-run mode is supported in this version.',
  })
}

const files = collectMarkdownFiles()
for (const file of files) {
  inspectFile(file)
}

const status = errors.length > 0 ? 'failed' : warnings.length > 0 || unverifiable.length > 0 ? 'warning' : 'ok'
const result = {
  status,
  dryRun,
  targetRoot,
  filesScanned: files.length,
  claimFiles: Array.from(claimFiles).sort(),
  claimsChecked,
  warnings,
  errors,
  unverifiable,
}

console.log(JSON.stringify(result, null, 2))
if (errors.length > 0) process.exit(1)

function collectMarkdownFiles() {
  if (includes.length > 0) {
    return includes.map((entry) => resolveInclude(entry)).sort()
  }
  if (!existsSync(targetRoot)) return []
  return walk(targetRoot)
    .filter((file) => file.endsWith('.md'))
    .sort()
}

function resolveInclude(entry) {
  if (isAbsolute(entry) || hasParentTraversal(entry)) {
    pushError(null, null, 'include', `include must be repository-relative: ${entry}`)
    return targetRoot
  }

  const fullPath = resolve(targetRoot, entry)
  if (!isInside(targetRoot, fullPath)) {
    pushError(null, null, 'include', `include escapes target root: ${entry}`)
    return targetRoot
  }
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    pushError(toPosix(entry), null, 'include', `included file does not exist: ${entry}`)
  }
  return fullPath
}

function inspectFile(file) {
  if (!existsSync(file) || !statSync(file).isFile()) return
  const relativeFile = toPosix(relative(targetRoot, file))
  const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n')

  for (let index = 0; index < lines.length; index++) {
    if (lines[index].trim() !== '```ae-claim') continue

    const startLine = index + 1
    const blockLines = []
    index++
    while (index < lines.length && !lines[index].trim().startsWith('```')) {
      blockLines.push(lines[index])
      index++
    }

    if (index >= lines.length) {
      pushError(relativeFile, startLine, 'block', 'claim block is missing closing fence')
      continue
    }

    claimFiles.add(relativeFile)
    claimsChecked++
    validateClaim(parseClaim(blockLines), relativeFile, startLine)
  }
}

function parseClaim(lines) {
  const claim = {}
  for (const line of lines) {
    if (!line.trim()) continue
    const index = line.indexOf(':')
    if (index < 0) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    if (key) claim[key] = value
  }
  return claim
}

function validateClaim(claim, file, line) {
  for (const field of requiredFields) {
    if (!claim[field]) {
      pushError(file, line, field, `claim requires ${field}`)
    }
  }

  if (claim.id && !/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/.test(claim.id)) {
    pushError(file, line, 'id', 'id must use uppercase tokens separated by hyphens')
  }
  if (claim.layer && !allowedLayers.has(claim.layer)) {
    pushError(file, line, 'layer', `layer must be one of ${Array.from(allowedLayers).join(', ')}`)
  }
  if (claim.status && !allowedStatuses.has(claim.status)) {
    pushError(file, line, 'status', `status must be one of ${Array.from(allowedStatuses).join(', ')}`)
  }
  if (claim.evidenceType && !allowedEvidenceTypes.has(claim.evidenceType)) {
    pushError(file, line, 'evidenceType', `evidenceType must be one of ${Array.from(allowedEvidenceTypes).join(', ')}`)
  }
  if (claim.source) {
    validateRepoPath(claim.source, file, line, 'source')
  }

  if (!claim.evidenceType || !claim.evidence) return

  if (claim.evidenceType === 'path') {
    validateRepoPath(claim.evidence, file, line, 'evidence')
    return
  }

  if (claim.evidenceType === 'assumption' || claim.evidenceType === 'deferred') {
    const expectedStatus = claim.evidenceType
    if (claim.status && claim.status !== expectedStatus) {
      pushError(file, line, 'status', `${claim.evidenceType} evidence requires status: ${expectedStatus}`)
    }
    if (!claim.reason) {
      pushError(file, line, 'reason', `${claim.evidenceType} evidence requires reason`)
    }
  }

  const entry = {
    file,
    line,
    claimId: claim.id || null,
    evidenceType: claim.evidenceType,
    evidence: claim.evidence,
    reason: claim.reason || null,
  }
  unverifiable.push(entry)
  warnings.push({
    file,
    line,
    claimId: claim.id || null,
    field: 'evidence',
    message: `${claim.evidenceType} evidence is not automatically verified in dry-run mode`,
  })
}

function validateRepoPath(value, file, line, field) {
  if (isAbsolute(value) || hasParentTraversal(value)) {
    pushError(file, line, field, `${field} must be a repository-relative path`)
    return
  }

  const fullPath = resolve(targetRoot, value)
  if (!isInside(targetRoot, fullPath)) {
    pushError(file, line, field, `${field} escapes target root`)
    return
  }
  if (!existsSync(fullPath)) {
    pushError(file, line, field, `${field} path does not exist: ${value}`)
  }
}

function walk(root) {
  const results = []
  if (!existsSync(root)) return results

  for (const entry of readdirSync(root)) {
    if (['.git', '.analysis', '.worktrees', 'worktrees', 'node_modules', 'dist', 'build', 'coverage'].includes(entry)) continue
    const fullPath = resolve(root, entry)
    if (!isInside(targetRoot, fullPath)) continue
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...walk(fullPath))
    } else if (stat.isFile()) {
      results.push(fullPath)
    }
  }
  return results
}

function readArg(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

function readArgs(name) {
  const values = []
  for (let index = 0; index < args.length; index++) {
    if (args[index] === name && args[index + 1]) values.push(args[index + 1])
  }
  return values
}

function pushError(file, line, field, message) {
  errors.push({ file, line, field, message })
}

function ensureInside(root, path, label) {
  if (!isInside(root, path)) throw new Error(`${label} must stay inside root: ${path}`)
}

function isInside(root, path) {
  const relPath = relative(root, path)
  return relPath === '' || (!relPath.startsWith('..') && !isAbsolute(relPath))
}

function hasParentTraversal(value) {
  return String(value).split(/[\\/]+/).includes('..')
}

function toPosix(value) {
  return value.replace(/\\/g, '/')
}
