// Shallow dependency graph commands and source-file scanning shared with tasks/review.
import { dirname, extname, join, relative } from 'node:path'
import { isDocumentPage } from '../docs-lifecycle.mjs'
import { gitFingerprint } from './git.mjs'
import { assertCanonicalContained, extractFiles, normalizeRelPath, parseOptions, readBoundedText, safeResolve, scanFiles, scanOptions, stableHash, toPosix } from './utils.mjs'

const excludedDirs = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.cache', '.next', '.nuxt', '__pycache__', '.ae', '.venv', 'vendor', 'target',
])
const excludedExts = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.mov', '.avi', '.webm', '.zip', '.tar', '.gz', '.rar', '.7z', '.pdf', '.doc', '.docx',
  '.xlsx', '.xls', '.csv',
])
const sourceExts = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.hpp',
  '.rb', '.php', '.swift', '.kt', '.scala', '.vue', '.svelte', '.json', '.yaml', '.yml', '.toml', '.xml',
  '.md', '.rst', '.adoc', '.txt', '.css', '.scss', '.less', '.html', '.sql', '.prisma', '.graphql', '.proto',
  '.sh', '.bash', '.ps1', '.bat', '.cmd',
])
const sourceNames = new Set(['Dockerfile', 'Makefile', 'Jenkinsfile'])

export function graphBuild(worktree, args) {
  const opts = parseOptions(args)
  const root = opts.root ? safeResolve(worktree, opts.root) : worktree
  assertCanonicalContained(worktree, root, 'graph root')
  const fileLimit = graphLimit(opts.limit, 500, '--limit')
  const edgeLimit = graphLimit(opts['edge-limit'], null, '--edge-limit')
  const scan = scanSourceFiles(root, { ...scanOptions(opts), maxFiles: fileLimit.effective, readText: true, includeDocumentPages: opts['include-document-pages'] })
  const files = scan.files
  const graph = buildShallowGraph(root, files, { edgeLimit: edgeLimit.effective ?? 1000 })
  const completeness = {
    complete: scan.completeness.complete && graph.completeness.complete,
    reasons: [...new Set([...scan.completeness.reasons, ...graph.completeness.reasons])],
  }
  const store = {
    path: 'docs/ae/graphs/graph.json',
    schemaVersion: 1,
    written: false,
  }
  const result = {
    status: 'ok',
    mode: 'shallow-dependency-graph',
    root: toPosix(relative(worktree, root)) || '.',
    generatedAt: new Date().toISOString(),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    entrypoints: graph.entrypoints,
    externalDependencies: graph.externalDependencies,
    nodes: graph.nodes,
    edges: graph.edges,
    freshness: graphFreshness(worktree, root, graph, completeness, scan.scope),
    scope: scan.scope,
    completeness,
    diagnostics: { scan: scan.diagnostics, graph: graph.diagnostics },
    limits: {
      files: {
        requested: fileLimit.requested,
        effective: fileLimit.effective,
        eligible: scan.diagnostics.filesMatched,
        eligibleIsExact: scan.completeness.complete,
        returned: files.length,
        truncated: !scan.completeness.complete,
      },
      edges: {
        requested: edgeLimit.requested,
        effective: edgeLimit.effective,
        returned: graph.edges.length,
        hardCap: edgeLimit.effective ?? 1000,
        truncated: graph.completeness.reasons.includes('edge-limit'),
      },
      scan: scan.limits,
    },
    store,
    limitations: [
      'static shallow scan only',
      'JSON snapshot only; no SQLite persistence, sharding, or preview page',
      'dynamic imports, generated code, aliases, and framework-specific resolution may be incomplete',
    ],
  }
  return result
}

export function graphQuery(worktree, args) {
  const opts = parseOptions(args)
  if (!opts.path && !opts.keyword) throw new Error('graph-query requires --path <file> or --keyword <text>')
  const graph = graphBuild(worktree, args)
  const keyword = opts.keyword ? String(opts.keyword).toLowerCase() : null
  const path = opts.path ? normalizeRelPath(String(opts.path)) : null
  if (opts.path && !path) throw new Error('graph-query --path must be a valid relative file path')
  const matchedNodes = graph.nodes.filter((node) => {
    if (path && node.path !== path) return false
    if (keyword && ![node.path, node.kind, node.module].filter(Boolean).join(' ').toLowerCase().includes(keyword)) return false
    return true
  })
  const matchedPaths = new Set(matchedNodes.map((node) => node.path))
  const relatedEdges = graph.edges.filter((edge) => matchedPaths.has(edge.from) || matchedPaths.has(edge.to))
  return {
    status: 'ok',
    mode: 'shallow-dependency-query',
    query: { path, keyword },
    matchedNodes,
    relatedEdges,
    externalDependencies: graph.externalDependencies.filter((dep) => !path || dep.from === path),
    freshness: graph.freshness,
    scope: graph.scope,
    completeness: graph.completeness,
    diagnostics: graph.diagnostics,
    limits: graph.limits,
    store: graph.store,
    limitations: graph.limitations,
  }
}

function graphLimit(value, defaultValue, option) {
  if (value === undefined) return { requested: null, effective: defaultValue }
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${option} requires a non-empty value`)
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10000) throw new Error(`${option} must be an integer from 1 to 10000`)
  return { requested: parsed, effective: parsed }
}

function graphFreshness(worktree, root, graph, completeness, scope) {
  const input = {
    root: toPosix(relative(worktree, root)) || '.',
    nodes: graph.nodes.map((node) => ({ path: node.path, sha256: node.sha256 })),
    edges: graph.edges,
    externalDependencies: graph.externalDependencies,
    git: gitFingerprint(worktree),
    completeness,
    scope,
  }
  return {
    status: completeness.complete ? 'fresh' : 'partial',
    canUseAsEvidence: completeness.complete,
    fingerprint: stableHash(input),
    basis: ['bounded current filesystem scan; fingerprint includes scanned content hashes; not a repository snapshot'],
    git: input.git,
  }
}

export function collectSourceFiles(root, dir = root) {
  assertCanonicalContained(root, dir, 'source root')
  const scan = scanSourceFiles(dir)
  const files = scan.files.map((file) => ({ ...file, relativePath: toPosix(relative(root, file.path)) }))
  Object.defineProperty(files, 'scan', { value: { completeness: scan.completeness, diagnostics: scan.diagnostics, limits: scan.limits, scope: scan.scope } })
  return files
}

export function scanSourceFiles(root, options = {}) {
  const { includeDocumentPages = false, ...budgets } = options
  if (typeof includeDocumentPages !== 'boolean') throw new Error('--include-document-pages is a flag without a value')
  const scan = scanFiles(root, {
    ...budgets,
    excludeDir: (name) => excludedDirs.has(name),
    excludeFile: (name) => !includeDocumentPages && isDocumentPage(name),
    include: (name) => !name.startsWith('.env') && !excludedExts.has(extname(name).toLowerCase())
      && (sourceExts.has(extname(name).toLowerCase()) || sourceNames.has(name)),
  })
  return { ...scan, scope: { documentPages: includeDocumentPages ? 'included' : 'excluded' } }
}

export function buildShallowGraph(root, files, { edgeLimit = 1000, externalLimit = 200 } = {}) {
  const fileSet = new Set(files.map((file) => file.relativePath))
  const nodes = files.map((file) => {
    const ext = extname(file.relativePath).toLowerCase()
    return {
      path: file.relativePath,
      kind: graphNodeKind(file.relativePath, ext),
      module: file.relativePath.split('/')[0],
      sha256: file.sha256 ?? null,
    }
  })
  const nodesByPath = new Map(nodes.map((node) => [node.path, node]))
  const edges = []
  const external = []
  const seenEdges = new Set()
  const seenExternal = new Set()
  const reasons = new Set()
  const diagnostics = { errors: [], bytesRead: 0 }
  const add = (out, seen, value, limit, reason) => {
    const key = JSON.stringify(value)
    if (seen.has(key)) return
    if (out.length >= limit) { reasons.add(reason); return }
    seen.add(key)
    out.push(value)
  }
  for (const file of files) {
    let text = file.text
    if (text === undefined) {
      try {
        assertCanonicalContained(root, file.path, 'graph file')
        const content = readBoundedText(file.path, Math.min(1024 * 1024, 16 * 1024 * 1024 - diagnostics.bytesRead))
        text = content.text
        diagnostics.bytesRead += content.bytes
        nodesByPath.get(file.relativePath).sha256 = content.sha256
      } catch (error) {
        reasons.add('read-error')
        diagnostics.errors.push({ path: file.relativePath, message: error.message })
        if (diagnostics.errors.length >= 20) break
        continue
      }
    }
    const deps = extractDependencies(text)
    for (const dep of deps) {
      if (dep.startsWith('.') || dep.startsWith('/')) {
        const resolved = resolveLocalDependency(file.relativePath, dep, fileSet)
        if (resolved) add(edges, seenEdges, { from: file.relativePath, to: resolved, type: 'imports', specifier: dep, provenance: 'inferred' }, edgeLimit, 'edge-limit')
      } else {
        add(external, seenExternal, { from: file.relativePath, dependency: dep }, externalLimit, 'external-limit')
      }
    }
    for (const reference of extractFiles(text)) {
      if (fileSet.has(reference) && reference !== file.relativePath) {
        add(edges, seenEdges, { from: file.relativePath, to: reference, type: 'mentions', provenance: 'inferred' }, edgeLimit, 'edge-limit')
      }
    }
  }
  return {
    nodes,
    edges,
    entrypoints: detectGraphEntrypoints(fileSet),
    externalDependencies: external,
    completeness: { complete: reasons.size === 0, reasons: [...reasons] },
    diagnostics,
  }
}

export function graphNodeKind(path, ext) {
  if (path.startsWith('tests/') || path.includes('.test.') || path.includes('.spec.')) return 'test'
  if (path.startsWith('docs/') || ['.md', '.rst', '.adoc', '.txt'].includes(ext)) return 'document'
  if (path.startsWith('scripts/') || ['.sh', '.bash', '.ps1', '.bat', '.cmd'].includes(ext)) return 'script'
  if (['.json', '.yaml', '.yml', '.toml', '.xml'].includes(ext)) return 'config'
  return 'source'
}

function extractDependencies(text) {
  const deps = new Set()
  const patterns = [
    /\bimport\s+(['"])([^'"\r\n]+)\1/g,
    /\b(?:import|require)\s*\(\s*(['"])([^'"\r\n]+)\1\s*\)/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) deps.add(match[2])
  }
  // Track declaration boundaries without rescanning the remaining file for each keyword.
  const tokens = /\b(import|export)\b|\bfrom\s+(['"])([^'"\r\n]+)\2|['";]/g
  let declaration = false
  for (const match of text.matchAll(tokens)) {
    if (match[1]) {
      declaration = true
    } else {
      if (declaration && match[3]) deps.add(match[3])
      declaration = false
    }
  }
  return [...deps]
}

function resolveLocalDependency(fromPath, specifier, fileSet) {
  const baseDir = dirname(fromPath).replace(/\\/g, '/')
  const raw = specifier.startsWith('/') ? specifier.slice(1) : toPosix(join(baseDir, specifier))
  const candidates = [
    raw,
    `${raw}.js`,
    `${raw}.jsx`,
    `${raw}.mjs`,
    `${raw}.cjs`,
    `${raw}.ts`,
    `${raw}.tsx`,
    `${raw}.json`,
    `${raw}/index.js`,
    `${raw}/index.ts`,
    `${raw}/index.tsx`,
  ].map(normalizeRelPath).filter(Boolean)
  return candidates.find((candidate) => fileSet.has(candidate)) || null
}

function detectGraphEntrypoints(fileSet) {
  return [
    'package.json',
    'scripts/ae-tools.mjs',
    'plugins/ai-agent-engine-codex/scripts/ae-tools.mjs',
    'README.md',
    'AGENTS.md',
  ].filter((path) => fileSet.has(path))
}
