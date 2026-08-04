import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const REGISTRY_PATH = 'docs/08-ai-memory/00-registry.json'
const MEMORY_ROOT = 'docs/08-ai-memory/'
const AE_ROOT = 'docs/ae/'
const MAX_REGISTRY_BYTES = 256 * 1024
const MAX_DOCUMENT_BYTES = 512 * 1024
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const DEFAULT_EXCERPT_CHARS = 600
const KINDS = new Set(['memory', 'maintenance'])
const REVIEW_STATUSES = new Set(['current', 'reviewed', 'historical'])
const RELATION_TYPES = new Set(['governs', 'documents', 'implements', 'records', 'references', 'supports', 'supersedes'])
const DIRECTIONS = new Set(['incoming', 'outgoing', 'both'])

export function checkMemoryKnowledgeRegistry(worktree, args = []) {
  const options = parseOptions(args)
  const optionCheck = validateValueOptions(options, ['root'])
  if (!optionCheck.ok) return invalid('ae-memory-registry-check', {}, optionCheck.diagnostics)
  const root = resolveRoot(worktree, options.root)
  if (!root.ok) return invalid('ae-memory-registry-check', {}, root.diagnostics)
  const loaded = loadRegistry(root.path)
  if (!loaded.ok) return invalid('ae-memory-registry-check', { root: root.relative }, loaded.diagnostics)
  return {
    status: 'ok',
    tool: 'ae-memory-registry-check',
    root: root.relative,
    registry: REGISTRY_PATH,
    schemaVersion: loaded.registry.schemaVersion,
    documentCount: loaded.registry.documents.length,
    relationCount: loaded.registry.relations.length,
    freshness: loaded.freshness,
    limitations: limitations(),
  }
}

export function memoryQuery(worktree, args = []) {
  const options = parseOptions(args)
  const optionCheck = validateValueOptions(options, ['root', 'topic', 'path', 'relation', 'limit', 'excerpt'])
  if (!optionCheck.ok) return invalid('ae-memory-query', {}, optionCheck.diagnostics)
  const query = {
    topic: stringOption(options.topic),
    path: normalizeQueryPath(options.path),
    relation: stringOption(options.relation),
  }
  if (!query.topic && !query.path && !query.relation) {
    return invalid('ae-memory-query', query, ['one of --topic, --path, or --relation is required'])
  }
  const root = resolveRoot(worktree, options.root)
  if (!root.ok) return invalid('ae-memory-query', query, root.diagnostics)
  const loaded = loadRegistry(root.path)
  if (!loaded.ok) return invalid('ae-memory-query', query, loaded.diagnostics)
  const limit = parseLimit(options.limit)
  if (!limit.ok) return invalid('ae-memory-query', query, limit.diagnostics)
  const excerptChars = parseExcerptLimit(options.excerpt)
  if (!excerptChars.ok) return invalid('ae-memory-query', query, excerptChars.diagnostics)

  const relationsByDocument = indexRelations(loaded.registry.relations)
  const matches = loaded.registry.documents
    .filter((document) => matchesMemoryQuery(document, relationsByDocument.get(document.id) || [], query))
    .map((document) => ({ document, score: memoryMatchScore(document, relationsByDocument.get(document.id) || [], query) }))
    .sort((left, right) => right.score - left.score || left.document.path.localeCompare(right.document.path) || left.document.id.localeCompare(right.document.id))
  const selected = matches.slice(0, limit.value)
  const results = []
  for (const match of selected) {
    const source = readTextTarget(loaded.root, match.document.path, MAX_DOCUMENT_BYTES)
    if (!source.ok) return invalid('ae-memory-query', query, source.diagnostics)
    const relations = (relationsByDocument.get(match.document.id) || []).map(publicRelation)
    results.push({
      id: match.document.id,
      path: match.document.path,
      kind: match.document.kind,
      role: match.document.role,
      topics: match.document.topics,
      reviewStatus: match.document.reviewStatus,
      matchScore: match.score,
      excerpt: excerpt(source.text, excerptChars.value),
      relations,
      freshness: fileFreshness(match.document.path, source.stat),
    })
  }
  return {
    status: 'ok',
    tool: 'ae-memory-query',
    root: root.relative,
    query,
    results,
    diagnostics: results.length === 0 ? ['no declared match'] : [],
    limits: { records: limit.value, returned: results.length, truncated: matches.length > results.length, excerptCharacters: excerptChars.value },
    freshness: loaded.freshness,
    limitations: limitations(),
  }
}

export function knowledgeMap(worktree, args = []) {
  const options = parseOptions(args)
  const optionCheck = validateValueOptions(options, ['root', 'limit'])
  if (!optionCheck.ok) return invalid('ae-knowledge-map', {}, optionCheck.diagnostics)
  const root = resolveRoot(worktree, options.root)
  if (!root.ok) return invalid('ae-knowledge-map', {}, root.diagnostics)
  const loaded = loadRegistry(root.path)
  if (!loaded.ok) return invalid('ae-knowledge-map', {}, loaded.diagnostics)
  const limit = parseLimit(options.limit)
  if (!limit.ok) return invalid('ae-knowledge-map', {}, limit.diagnostics)
  const edges = [...loaded.registry.relations].sort(compareRelations)
  const selectedEdges = edges.slice(0, limit.value).map(publicRelation)
  const selectedDocumentIds = new Set(selectedEdges.map((edge) => edge.from))
  const targetNodes = [...new Set(selectedEdges.map((edge) => edge.to))]
    .sort()
    .map((path) => ({ id: `artifact:${path}`, path, kind: 'artifact', provenance: 'declared' }))
  const memoryNodes = loaded.registry.documents
    .filter((document) => selectedDocumentIds.has(document.id))
    .sort(compareDocuments)
    .map((document) => ({ id: document.id, path: document.path, kind: document.kind, role: document.role, topics: document.topics, reviewStatus: document.reviewStatus, provenance: 'declared' }))
  return {
    status: 'ok',
    tool: 'ae-knowledge-map',
    root: root.relative,
    schemaVersion: loaded.registry.schemaVersion,
    nodes: [...memoryNodes, ...targetNodes].sort((left, right) => left.path.localeCompare(right.path) || left.id.localeCompare(right.id)),
    edges: selectedEdges,
    limits: { records: limit.value, returned: selectedEdges.length, truncated: edges.length > selectedEdges.length },
    freshness: loaded.freshness,
    limitations: [...limitations(), 'declared documentation relations only; source imports and mentions require ae-graph-build or ae-graph-query'],
  }
}

export function knowledgeQuery(worktree, args = []) {
  const options = parseOptions(args)
  const optionCheck = validateValueOptions(options, ['root', 'path', 'relation', 'direction', 'limit'])
  if (!optionCheck.ok) return invalid('ae-knowledge-query', {}, optionCheck.diagnostics)
  const path = normalizeQueryPath(options.path)
  const relation = stringOption(options.relation)
  const direction = stringOption(options.direction) || 'both'
  if (!path) return invalid('ae-knowledge-query', { path, relation, direction }, ['--path is required'])
  if (!DIRECTIONS.has(direction)) return invalid('ae-knowledge-query', { path, relation, direction }, ['--direction must be incoming, outgoing, or both'])
  const root = resolveRoot(worktree, options.root)
  if (!root.ok) return invalid('ae-knowledge-query', { path, relation, direction }, root.diagnostics)
  const loaded = loadRegistry(root.path)
  if (!loaded.ok) return invalid('ae-knowledge-query', { path, relation, direction }, loaded.diagnostics)
  const limit = parseLimit(options.limit)
  if (!limit.ok) return invalid('ae-knowledge-query', { path, relation, direction }, limit.diagnostics)
  const documentById = new Map(loaded.registry.documents.map((document) => [document.id, document]))
  const matching = loaded.registry.relations
    .filter((edge) => (!relation || edge.type === relation) && matchesDirection(edge, path, direction, documentById))
    .sort(compareRelations)
  const selected = matching.slice(0, limit.value).map((edge) => ({
    ...publicRelation(edge),
    fromPath: documentById.get(edge.from).path,
  }))
  return {
    status: 'ok',
    tool: 'ae-knowledge-query',
    root: root.relative,
    query: { path, relation, direction },
    edges: selected,
    diagnostics: selected.length === 0 ? ['no declared match'] : [],
    limits: { records: limit.value, returned: selected.length, truncated: matching.length > selected.length },
    freshness: loaded.freshness,
    limitations: [...limitations(), 'direction filters declared relation endpoints; it does not infer an inverse relation type'],
  }
}

function loadRegistry(root) {
  const registry = readTextTarget(root, REGISTRY_PATH, MAX_REGISTRY_BYTES)
  if (!registry.ok) return registry
  let parsed
  try {
    parsed = JSON.parse(registry.text)
  } catch (error) {
    return failure([`invalid registry JSON: ${error.message}`])
  }
  const diagnostics = validateRegistry(root, parsed)
  if (diagnostics.length > 0) return failure(diagnostics)
  return {
    ok: true,
    root,
    registry: parsed,
    freshness: {
      status: 'fresh',
      basis: ['current filesystem lstat and realpath checks completed during this command'],
      registry: fileFreshness(REGISTRY_PATH, registry.stat),
    },
  }
}

function validateRegistry(root, registry) {
  const diagnostics = []
  if (!isObject(registry)) return ['registry must be a JSON object']
  if (registry.schemaVersion !== 1) diagnostics.push('registry schemaVersion must be 1')
  if (!Array.isArray(registry.documents) || registry.documents.length === 0) diagnostics.push('registry documents must be a non-empty array')
  if (!Array.isArray(registry.relations)) diagnostics.push('registry relations must be an array')
  if (diagnostics.length > 0) return diagnostics
  const documentIds = new Set()
  const documentPaths = new Set()
  for (const [index, document] of registry.documents.entries()) {
    const label = `documents[${index}]`
    if (!isObject(document)) {
      diagnostics.push(`${label} must be an object`)
      continue
    }
    if (!isStableId(document.id)) diagnostics.push(`${label}.id must be a lowercase stable identifier`)
    if (documentIds.has(document.id)) diagnostics.push(`${label}.id duplicates ${document.id}`)
    documentIds.add(document.id)
    if (!isMemoryPath(document.path)) diagnostics.push(`${label}.path must be a Markdown file below ${MEMORY_ROOT}`)
    if (documentPaths.has(document.path)) diagnostics.push(`${label}.path duplicates ${document.path}`)
    documentPaths.add(document.path)
    if (!KINDS.has(document.kind)) diagnostics.push(`${label}.kind is not supported`)
    if (!isNonEmptyString(document.role)) diagnostics.push(`${label}.role must be non-empty`)
    if (!Array.isArray(document.topics) || document.topics.length === 0 || document.topics.some((topic) => !isNonEmptyString(topic)) || new Set(document.topics).size !== document.topics.length) diagnostics.push(`${label}.topics must be a non-empty unique string array`)
    if (!REVIEW_STATUSES.has(document.reviewStatus)) diagnostics.push(`${label}.reviewStatus is not supported`)
    validateExistingSafeFile(root, document.path, label, diagnostics)
  }
  for (const [index, relation] of registry.relations.entries()) {
    const label = `relations[${index}]`
    if (!isObject(relation)) {
      diagnostics.push(`${label} must be an object`)
      continue
    }
    if (!documentIds.has(relation.from)) diagnostics.push(`${label}.from must reference an existing document id`)
    if (!isArtifactPath(relation.to)) diagnostics.push(`${label}.to must be AGENTS.md or a Markdown file below ${AE_ROOT}`)
    if (!RELATION_TYPES.has(relation.type)) diagnostics.push(`${label}.type is not supported`)
    validateExistingSafeFile(root, relation.to, label, diagnostics)
    if (!isObject(relation.evidence) || !isEvidencePath(relation.evidence.path) || !isNonEmptyString(relation.evidence.note)) {
      diagnostics.push(`${label}.evidence must contain an allowed path and non-empty note`)
    } else {
      validateExistingSafeFile(root, relation.evidence.path, `${label}.evidence`, diagnostics)
    }
  }
  return diagnostics
}

function validateExistingSafeFile(root, path, label, diagnostics) {
  const checked = safeFile(root, path)
  if (!checked.ok) diagnostics.push(...checked.diagnostics.map((message) => `${label}: ${message}`))
}

function readTextTarget(root, path, maxBytes) {
  const checked = safeFile(root, path)
  if (!checked.ok) return checked
  if (checked.stat.size > maxBytes) return failure([`${path} exceeds the ${maxBytes} byte limit`])
  try {
    return { ok: true, path: checked.path, stat: checked.stat, text: readFileSync(checked.path, 'utf8') }
  } catch (error) {
    return failure([`cannot read ${path}: ${error.message}`])
  }
}

function safeFile(root, input) {
  const normalized = normalizeRepositoryPath(input)
  if (!normalized) return failure([`invalid repository-relative path: ${input}`])
  const candidate = resolve(root, normalized)
  const rootRelative = relative(root, candidate)
  if (rootRelative === '' || rootRelative.startsWith('..') || rootRelative.startsWith(`..${sep}`) || isAbsolute(rootRelative)) return failure([`path escapes worktree: ${input}`])
  const parts = normalized.split('/')
  let current = root
  for (const part of parts) {
    current = resolve(current, part)
    let stat
    try {
      stat = lstatSync(current)
    } catch {
      return failure([`missing path component: ${toPosix(relative(root, current))}`])
    }
    if (stat.isSymbolicLink()) return failure([`symbolic link or junction is not allowed: ${toPosix(relative(root, current))}`])
  }
  const stat = lstatSync(candidate)
  if (!stat.isFile()) return failure([`path must be a regular file: ${normalized}`])
  try {
    const realRoot = realpathSync(root)
    const realCandidate = realpathSync(candidate)
    const realRelative = relative(realRoot, realCandidate)
    if (realRelative === '' || realRelative.startsWith('..') || realRelative.startsWith(`..${sep}`) || isAbsolute(realRelative)) return failure([`realpath escapes worktree: ${normalized}`])
  } catch (error) {
    return failure([`cannot resolve realpath for ${normalized}: ${error.message}`])
  }
  return { ok: true, path: candidate, stat }
}

function resolveRoot(worktree, rootOption) {
  const worktreeRoot = resolve(worktree)
  const normalized = rootOption === undefined ? '.' : normalizeRepositoryPath(rootOption)
  if (!normalized) return failure(['--root must be a repository-relative directory'])
  const root = normalized === '.' ? worktreeRoot : resolve(worktreeRoot, normalized)
  const rel = relative(worktreeRoot, root)
  if (rel.startsWith('..') || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return failure(['--root escapes the current worktree'])
  try {
    const realWorktree = realpathSync(worktreeRoot)
    let current = worktreeRoot
    for (const part of normalized === '.' ? [] : normalized.split('/')) {
      current = resolve(current, part)
      const stat = lstatSync(current)
      if (stat.isSymbolicLink()) return failure([`symbolic link or junction is not allowed: ${toPosix(relative(worktreeRoot, current))}`])
      if (!stat.isDirectory()) return failure([`--root path component must be a directory: ${toPosix(relative(worktreeRoot, current))}`])
    }
    const stat = lstatSync(root)
    if (stat.isSymbolicLink() || !stat.isDirectory()) return failure(['--root must be a non-link directory'])
    const realRoot = realpathSync(root)
    const realRelative = relative(realWorktree, realRoot)
    if (realRelative.startsWith('..') || realRelative.startsWith(`..${sep}`) || isAbsolute(realRelative)) return failure(['--root realpath escapes the current worktree'])
  } catch (error) {
    return failure([`invalid --root: ${error.message}`])
  }
  return { ok: true, path: root, relative: toPosix(relative(worktreeRoot, root)) || '.' }
}

function matchesMemoryQuery(document, relations, query) {
  return (!query.topic || document.topics.includes(query.topic))
    && (!query.path || document.path === query.path)
    && (!query.relation || relations.some((relation) => relation.type === query.relation))
}

function memoryMatchScore(document, relations, query) {
  return (query.path && document.path === query.path ? 4 : 0)
    + (query.topic && document.topics.includes(query.topic) ? 2 : 0)
    + (query.relation && relations.some((relation) => relation.type === query.relation) ? 1 : 0)
}

function matchesDirection(edge, path, direction, documentById) {
  const fromPath = documentById.get(edge.from)?.path
  return (direction === 'outgoing' && fromPath === path)
    || (direction === 'incoming' && edge.to === path)
    || (direction === 'both' && (fromPath === path || edge.to === path))
}

function indexRelations(relations) {
  const map = new Map()
  for (const relation of relations) {
    const current = map.get(relation.from) || []
    current.push(relation)
    map.set(relation.from, current.sort(compareRelations))
  }
  return map
}

function publicRelation(relation) {
  return { from: relation.from, to: relation.to, type: relation.type, provenance: 'declared', evidence: relation.evidence }
}

function compareDocuments(left, right) {
  return left.path.localeCompare(right.path) || left.id.localeCompare(right.id)
}

function compareRelations(left, right) {
  return left.from.localeCompare(right.from) || left.to.localeCompare(right.to) || left.type.localeCompare(right.type)
}

function parseLimit(value) {
  if (value === undefined) return { ok: true, value: DEFAULT_LIMIT }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) return failure([`--limit must be an integer from 1 to ${MAX_LIMIT}`])
  return { ok: true, value: parsed }
}

function parseExcerptLimit(value) {
  if (value === undefined) return { ok: true, value: DEFAULT_EXCERPT_CHARS }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4000) return failure(['--excerpt must be an integer from 1 to 4000'])
  return { ok: true, value: parsed }
}

function parseOptions(args) {
  const options = {}
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (!arg.startsWith('--')) continue
    const [key, inline] = arg.slice(2).split('=', 2)
    const next = inline === undefined ? args[index + 1] : undefined
    if (inline !== undefined) options[key] = inline
    else if (next && !next.startsWith('--')) {
      options[key] = next
      index++
    } else options[key] = true
  }
  return options
}

function validateValueOptions(options, names) {
  const diagnostics = names
    .filter((name) => Object.hasOwn(options, name) && (typeof options[name] !== 'string' || !options[name].trim()))
    .map((name) => `--${name} requires a non-empty value`)
  return diagnostics.length === 0 ? { ok: true } : failure(diagnostics)
}

function normalizeRepositoryPath(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/\\/g, '/')
  if (!normalized || normalized === '.') return normalized || null
  if (isAbsolute(normalized) || /^[A-Za-z]:/.test(normalized)) return null
  const parts = normalized.split('/')
  if (parts.some((part) => !part || part === '.' || part === '..' || part.startsWith('.') || /(^|[._-])(env|secret|token|credential|password)([._-]|$)/i.test(part))) return null
  return parts.join('/')
}

function normalizeQueryPath(value) {
  return typeof value === 'string' ? normalizeRepositoryPath(value) : null
}

function isMemoryPath(path) {
  return typeof path === 'string' && path.startsWith(MEMORY_ROOT) && path.endsWith('.md') && Boolean(normalizeRepositoryPath(path))
}

function isArtifactPath(path) {
  return path === 'AGENTS.md' || (typeof path === 'string' && path.startsWith(AE_ROOT) && path.endsWith('.md') && Boolean(normalizeRepositoryPath(path)))
}

function isEvidencePath(path) {
  return isMemoryPath(path) || isArtifactPath(path)
}

function isStableId(value) {
  return typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringOption(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function excerpt(value, characters) {
  const compact = value.replace(/\r\n/g, '\n').trim()
  return compact.length <= characters ? compact : `${compact.slice(0, characters)}...`
}

function fileFreshness(path, stat) {
  return { path, bytes: stat.size, modifiedAt: new Date(stat.mtimeMs).toISOString() }
}

function limitations() {
  return [
    'canonical Markdown remains the source of truth',
    'declared metadata only; no unregistered-document search or inferred relation',
    'read-only local filesystem operation; no network, database, cache, or persistent graph',
  ]
}

function invalid(tool, query, diagnostics) {
  return { status: 'invalid', tool, query, diagnostics, limitations: limitations() }
}

function failure(diagnostics) {
  return { ok: false, diagnostics }
}

function toPosix(path) {
  return path.replace(/\\/g, '/')
}
