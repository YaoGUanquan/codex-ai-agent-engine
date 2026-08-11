// Shallow dependency graph commands and source-file scanning shared with tasks/review.
import { readdirSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { gitFingerprint } from './git.mjs'
import { extractFiles, normalizeRelPath, parseOptions, readText, safeResolve, stableHash, toPosix, uniqueObjects } from './utils.mjs'

const excludedDirs = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.cache', '.next', '.nuxt', '__pycache__', '.ae',
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
  const fileLimit = graphLimit(opts.limit, 500, '--limit')
  const edgeLimit = graphLimit(opts['edge-limit'], null, '--edge-limit')
  const eligibleFiles = collectSourceFiles(root)
  const files = eligibleFiles.slice(0, fileLimit.effective)
  const graph = buildShallowGraph(root, files)
  const allEdges = graph.edges
  graph.edges = edgeLimit.effective === null ? allEdges : allEdges.slice(0, edgeLimit.effective)
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
    freshness: graphFreshness(worktree, root, graph),
    limits: {
      files: {
        requested: fileLimit.requested,
        effective: fileLimit.effective,
        eligible: eligibleFiles.length,
        returned: files.length,
        truncated: eligibleFiles.length > files.length,
      },
      edges: {
        requested: edgeLimit.requested,
        effective: edgeLimit.effective,
        returned: graph.edges.length,
        truncated: graph.edges.length < allEdges.length,
      },
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

function graphFreshness(worktree, root, graph) {
  const input = {
    root: toPosix(relative(worktree, root)) || '.',
    nodes: graph.nodes.map((node) => node.path),
    edges: graph.edges,
    externalDependencies: graph.externalDependencies,
    git: gitFingerprint(worktree),
  }
  return {
    status: 'fresh',
    canUseAsEvidence: true,
    fingerprint: stableHash(input),
    basis: ['current filesystem scan completed during this command'],
    git: input.git,
  }
}

export function collectSourceFiles(root, dir = root) {
  const out = []
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) out.push(...collectSourceFiles(root, full))
      continue
    }
    if (!entry.isFile()) continue
    if (entry.name.startsWith('.env')) continue
    const ext = extname(entry.name)
    if (excludedExts.has(ext)) continue
    if (sourceExts.has(ext) || sourceNames.has(entry.name)) {
      out.push({ path: full, relativePath: toPosix(relative(root, full)) })
    }
  }
  return out.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

export function buildShallowGraph(root, files) {
  const fileSet = new Set(files.map((file) => file.relativePath))
  const nodes = files.map((file) => {
    const ext = extname(file.relativePath).toLowerCase()
    return {
      path: file.relativePath,
      kind: graphNodeKind(file.relativePath, ext),
      module: file.relativePath.split('/')[0],
    }
  })
  const edges = []
  const external = []
  for (const file of files) {
    const text = readText(file.path)
    const deps = extractDependencies(text)
    for (const dep of deps) {
      if (dep.startsWith('.') || dep.startsWith('/')) {
        const resolved = resolveLocalDependency(file.relativePath, dep, fileSet)
        if (resolved) edges.push({ from: file.relativePath, to: resolved, type: 'imports', specifier: dep, provenance: 'inferred' })
      } else {
        external.push({ from: file.relativePath, dependency: dep })
      }
    }
    for (const reference of extractFiles(text)) {
      if (fileSet.has(reference) && reference !== file.relativePath) {
        edges.push({ from: file.relativePath, to: reference, type: 'mentions', provenance: 'inferred' })
      }
    }
  }
  return {
    nodes,
    edges: uniqueObjects(edges).slice(0, 1000),
    entrypoints: detectGraphEntrypoints(fileSet),
    externalDependencies: uniqueObjects(external).slice(0, 200),
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
    /\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+[^'"]+\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) deps.add(match[1])
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
