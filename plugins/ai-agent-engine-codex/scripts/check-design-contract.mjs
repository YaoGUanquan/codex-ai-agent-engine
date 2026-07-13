#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const args = process.argv.slice(2)
const targetRoot = resolve(readArg('--target') || repoRoot)
const designRoot = resolve(targetRoot, 'docs', 'ae', 'designs')
const requiredFrontmatter = {
  type: 'design',
  status: null,
  date: null,
  title: null,
  format: 'human-readable-design',
  sharded: null,
}
const allowedStatuses = new Set(['drafted', 'ready', 'review-passed', 'review-needs-fix', 'blocked', 'aborted', 'active', 'completed'])
const requiredSections = [
  'Source',
  'AI Parse Contract',
  'Split Manifest',
  'Overview',
  'Implementation Constraints',
  'Decisions',
  'Mapping Tables',
  'Architecture',
  'API',
  'Database',
  'UI/UX',
  'Test Cases',
  'Security',
  'Observability',
  'Non-Functional',
  'Consistency Check',
]
const requiredMappingSections = [
  'api-field-to-database-column-mapping',
  'api-error-to-ui-state-mapping',
  'test-case-to-contract-coverage',
  'ui-component-to-api-endpoint-mapping',
]
const requiredConsistencyFields = [
  'requiredDimensionsCovered',
  'omittedDimensionsJustified',
  'stableIdsUnique',
  'mappingTablesComplete',
  'sourceScopePreserved',
  'reviewStatus',
]
const stableIdPattern = /\b(?:ADR|EP|T|TC|ST)-\d{3}\b/g
const errors = []
let checked = 0

if (existsSync(designRoot)) {
  for (const file of walk(designRoot)) {
    if (!file.endsWith('/design.md')) continue
    checked++
    validateDesign(file)
  }
}

if (errors.length > 0) {
  console.error(JSON.stringify({ status: 'failed', targetRoot, checked, errors }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ status: 'ok', targetRoot, checked }, null, 2))

function validateDesign(file) {
  const relPath = toPosix(relative(targetRoot, file))
  const content = readFileSync(file, 'utf8')
  const frontmatter = parseFrontmatter(content)
  if (!frontmatter) {
    errors.push({ path: relPath, field: 'frontmatter', message: 'design contract requires YAML frontmatter' })
    return
  }

  for (const [field, expected] of Object.entries(requiredFrontmatter)) {
    if (!hasField(frontmatter, field)) {
      errors.push({ path: relPath, field, message: `design contract requires ${field}` })
    } else if (expected !== null && frontmatter[field] !== expected) {
      errors.push({ path: relPath, field, message: `${field} must be ${expected}` })
    }
  }
  if (frontmatter.status && !allowedStatuses.has(frontmatter.status)) {
    errors.push({ path: relPath, field: 'status', message: 'status is not valid for design' })
  }
  if (hasField(frontmatter, 'sharded') && typeof frontmatter.sharded !== 'boolean') {
    errors.push({ path: relPath, field: 'sharded', message: 'sharded must be boolean true or false' })
  }
  if (frontmatter.origin && looksLikePath(frontmatter.origin) && !isRepositoryRelativePath(frontmatter.origin)) {
    errors.push({ path: relPath, field: 'origin', message: 'origin must be a repository-relative path' })
  }
  validateOriginPair(relPath, frontmatter)

  const sections = parseSections(content)
  for (const section of requiredSections) {
    if (!sections.has(section)) {
      errors.push({ path: relPath, field: 'section', message: `missing required section: ${section}` })
    }
  }
  for (const section of requiredMappingSections) {
    if (!sections.has(section)) {
      errors.push({ path: relPath, field: 'mapping', message: `missing mapping table section: ${section}` })
    }
  }

  validateExplicitOmittedDimensions(relPath, sections.get('Overview') || '')
  validateConsistencyFields(relPath, sections.get('Consistency Check') || '')
  validateStableIds(relPath, content)
  const manifestFiles = validateSplitManifest(relPath, file, sections.get('Split Manifest') || '')
  validateStableReferences(relPath, file, content, sections, manifestFiles)
}

function validateSplitManifest(path, designFile, sectionBody) {
  const designDir = dirname(designFile)
  const entries = extractManifestFiles(sectionBody)
  const validFiles = []
  if (entries.length === 0) {
    errors.push({ path, field: 'splitManifest', message: 'Split Manifest must list at least design.md' })
    return validFiles
  }

  for (const entry of entries) {
    const normalized = unquote(entry).replace(/\\/g, '/')
    if (!normalized || isAbsolute(normalized) || /^[a-zA-Z]:[\\/]/.test(normalized)) {
      errors.push({ path, field: 'splitManifest', message: `Split Manifest file must be repository-relative: ${entry}` })
      continue
    }
    const candidate = normalized.includes('/') ? resolve(targetRoot, normalized) : resolve(designDir, normalized)
    const relativeToDesign = relative(designDir, candidate)
    if (relativeToDesign === '..' || relativeToDesign.startsWith(`..${sep}`) || isAbsolute(relativeToDesign)) {
      errors.push({ path, field: 'splitManifest', message: `Split Manifest file must stay inside the design directory: ${entry}` })
      continue
    }
    if (!candidate.toLowerCase().endsWith('.md')) {
      errors.push({ path, field: 'splitManifest', message: `Split Manifest file must be Markdown: ${entry}` })
      continue
    }
    if (!existsSync(candidate) || !statSync(candidate).isFile()) {
      errors.push({ path, field: 'splitManifest', message: `Split Manifest file does not exist: ${entry}` })
      continue
    }
    validFiles.push(candidate)
  }
  if (!validFiles.some((candidate) => resolve(candidate) === resolve(designFile))) {
    errors.push({ path, field: 'splitManifest', message: 'Split Manifest must list design.md' })
  }
  return [...new Set(validFiles)]
}

function extractManifestFiles(sectionBody) {
  const entries = []
  const lines = sectionBody.replace(/\r\n/g, '\n').split('\n')
  let filesIndent = null
  for (const line of lines) {
    const filesMatch = /^(\s*)-\s+files\s*:\s*$/i.exec(line)
    if (filesMatch) {
      filesIndent = filesMatch[1].length
      continue
    }
    if (filesIndent === null) continue
    if (!line.trim()) continue
    const entryMatch = /^(\s*)-\s+(.+?)\s*$/.exec(line)
    if (!entryMatch || entryMatch[1].length <= filesIndent) break
    entries.push(entryMatch[2])
  }
  return entries
}

function validateStableReferences(path, designFile, designContent, sections, manifestFiles) {
  const declarations = extractOwnedDeclarations(designContent)
  const declarationPattern = /^#{3,6}\s+((?:ADR|EP|T|TC|ST)-\d{3})\b/gm
  for (const manifestFile of manifestFiles) {
    if (resolve(manifestFile) === resolve(designFile)) continue
    const content = readFileSync(manifestFile, 'utf8')
    for (const match of content.matchAll(declarationPattern)) declarations.add(match[1])
  }

  const references = new Set()
  for (const section of requiredMappingSections) {
    for (const match of (sections.get(section) || '').matchAll(stableIdPattern)) references.add(match[0])
  }
  for (const reference of references) {
    if (!declarations.has(reference)) {
      errors.push({ path, field: 'stableReference', message: `mapping table references undeclared stable ID: ${reference}` })
    }
  }
}

function extractOwnedDeclarations(content) {
  const owners = {
    ADR: 'Decisions',
    EP: 'API',
    T: 'Database',
    ST: 'UI/UX',
    TC: 'Test Cases',
  }
  const declarations = new Set()
  let parentSection = null
  for (const line of content.replace(/\r\n/g, '\n').split('\n')) {
    const parentMatch = /^##\s+(.+?)\s*$/.exec(line)
    if (parentMatch) {
      parentSection = parentMatch[1].trim()
      continue
    }
    const declarationMatch = /^#{3,6}\s+((ADR|EP|T|TC|ST)-\d{3})\b/.exec(line)
    if (declarationMatch && owners[declarationMatch[2]] === parentSection) declarations.add(declarationMatch[1])
  }
  return declarations
}

function validateExplicitOmittedDimensions(path, overview) {
  const line = overview.split('\n').find((value) => /Explicit omitted dimensions:/i.test(value))
  if (!line) {
    errors.push({ path, field: 'omittedDimensions', message: 'Overview must include Explicit omitted dimensions' })
    return
  }
  if (!/none/i.test(line) && !/explicitly-omitted/.test(line)) {
    errors.push({ path, field: 'omittedDimensions', message: 'omitted dimensions must use explicitly-omitted or state none' })
  }
}

function validateConsistencyFields(path, sectionBody) {
  for (const field of requiredConsistencyFields) {
    const pattern = new RegExp(`\\b${field}\\s*:`)
    if (!pattern.test(sectionBody)) {
      errors.push({ path, field: 'consistency', message: `Consistency Check missing ${field}` })
    }
  }
}

function validateStableIds(path, content) {
  const counts = new Map()
  for (const match of content.matchAll(stableIdPattern)) {
    counts.set(match[0], (counts.get(match[0]) || 0) + 1)
  }
  for (const [id, count] of counts) {
    if (count > 1 && /^ADR-/.test(id) && content.match(new RegExp(`^### ${id}\\b`, 'gm'))?.length > 1) {
      errors.push({ path, field: 'stableId', message: `duplicate decision stable ID: ${id}` })
    }
  }
  if (![...counts.keys()].some((id) => id.startsWith('ADR-'))) {
    errors.push({ path, field: 'stableId', message: 'at least one ADR-XXX decision ID is required' })
  }
  if (![...counts.keys()].some((id) => id.startsWith('TC-'))) {
    errors.push({ path, field: 'stableId', message: 'at least one TC-XXX test case ID is required' })
  }
}

function parseSections(content) {
  const sections = new Map()
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  let current = null
  let buffer = []
  for (const line of lines) {
    const match = /^#{2,3}\s+(.+?)\s*$/.exec(line)
    if (match) {
      if (current) sections.set(current, buffer.join('\n'))
      current = match[1].trim()
      buffer = []
    } else if (current) {
      buffer.push(line)
    }
  }
  if (current) sections.set(current, buffer.join('\n'))
  return sections
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null
  const normalized = content.replace(/\r\n/g, '\n')
  const end = normalized.indexOf('\n---\n', 4)
  if (end < 0) return null
  const data = {}
  for (const line of normalized.slice(4, end).split('\n')) {
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
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1)
  return value
}

function unquote(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('`') && trimmed.endsWith('`')) || (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function walk(root) {
  const files = []
  for (const entry of readdirSync(root)) {
    const full = resolve(root, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) files.push(...walk(full))
    else if (stat.isFile()) files.push(toPosix(full))
  }
  return files
}

function validateOriginPair(path, data) {
  const hasOrigin = hasField(data, 'origin')
  const hasOriginFingerprint = hasField(data, 'originFingerprint')
  if (hasOrigin !== hasOriginFingerprint) {
    errors.push({ path, field: hasOrigin ? 'originFingerprint' : 'origin', message: 'origin and originFingerprint must be provided together' })
  }
}

function readArg(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

function hasField(data, key) {
  return Object.prototype.hasOwnProperty.call(data, key)
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
