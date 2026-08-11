// review-package and review-contract commands.
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname } from 'node:path'
import { writeEvidenceRecord } from './evidence.mjs'
import { runGitRequired, verifyGitRef } from './git.mjs'
import { buildShallowGraph, collectSourceFiles, graphNodeKind } from './graph.mjs'
import { clampInteger, normalizeArtifactOutputPath, parseOptions, redactOptions, safeName, safeResolve, scalarMarkdownCell, splitCsv, timestamp, toPosix, truthy } from './utils.mjs'

export function reviewPackage(worktree, args) {
  const opts = parseOptions(args)
  const base = String(opts.base || opts._[0] || '').trim()
  const head = String(opts.head || opts._[1] || '').trim()
  if (!base) throw new Error('review-package requires --base <ref>')
  if (!head) throw new Error('review-package requires --head <ref>')

  verifyGitRef(worktree, base, 'base')
  verifyGitRef(worktree, head, 'head')

  const outRel = opts.out ? normalizeArtifactOutputPath(String(opts.out), 'review-package') : defaultReviewPackageArtifactPath(worktree, base, head)
  const outPath = safeResolve(worktree, outRel)
  mkdirSync(dirname(outPath), { recursive: true })

  const commitLog = runGitRequired(worktree, ['log', '--oneline', `${base}..${head}`])
  const diffStat = runGitRequired(worktree, ['diff', '--stat', `${base}..${head}`])
  const inventory = buildReviewFileInventory(worktree, base, head)
  const impact = truthy(opts['with-impact']) || truthy(opts.impact)
    ? buildReviewImpactContext(worktree, inventory, opts)
    : null
  const diffBody = runGitRequired(worktree, ['diff', '-U10', `${base}..${head}`])
  const content = [
    `# Review package: ${base}..${head}`,
    '',
    '## Commits',
    commitLog || '(no commits)',
    '',
    '## Files changed',
    diffStat || '(no file changes)',
    '',
    '## Review inventory',
    reviewInventoryMarkdown(inventory),
    '',
    ...(impact ? ['## Impact context', reviewImpactMarkdown(impact), ''] : []),
    '## Diff',
    diffBody || '(no diff)',
    '',
  ].join('\n')
  writeFileSync(outPath, content, 'utf8')

  return {
    status: 'ok',
    base,
    head,
    inventory,
    impact,
    artifact: {
      path: outRel,
      bytes: statSync(outPath).size,
    },
  }
}

function buildReviewFileInventory(worktree, base, head) {
  const nameStatus = runGitRequired(worktree, ['diff', '--name-status', '-z', '--find-renames', `${base}..${head}`])
  const numStat = runGitRequired(worktree, ['diff', '--numstat', '-z', '--find-renames', `${base}..${head}`])
  const statsByPath = parseGitNumStat(numStat)
  const files = parseGitNameStatus(nameStatus).map((entry) => {
    const stat = statsByPath.get(entry.path) || { additions: null, deletions: null, binary: false }
    return {
      ...entry,
      ...stat,
      role: graphNodeKind(entry.path, extname(entry.path).toLowerCase()),
    }
  }).sort((left, right) => left.path.localeCompare(right.path))
  return {
    changedFileCount: files.length,
    files,
    reviewRule: 'Every changed file is a review target unless its exclusion is explicitly recorded in the review result.',
  }
}

function parseGitNameStatus(output) {
  const fields = output.split('\0')
  const entries = []
  for (let index = 0; index < fields.length;) {
    const status = fields[index++]
    if (!status) continue
    const previousPath = /^[RC]/.test(status) ? fields[index++] : null
    const path = fields[index++]
    if (!path) continue
    entries.push({
      path: toPosix(path),
      previousPath: previousPath ? toPosix(previousPath) : null,
      status,
    })
  }
  return entries
}

function parseGitNumStat(output) {
  const fields = output.split('\0')
  const stats = new Map()
  for (let index = 0; index < fields.length;) {
    const record = fields[index++]
    if (!record) continue
    const firstTab = record.indexOf('\t')
    const secondTab = record.indexOf('\t', firstTab + 1)
    if (firstTab < 0 || secondTab < 0) continue
    const additionsRaw = record.slice(0, firstTab)
    const deletionsRaw = record.slice(firstTab + 1, secondTab)
    let path = record.slice(secondTab + 1)
    if (path === '') {
      index += 1
      path = fields[index++]
    }
    if (!path) continue
    const binary = additionsRaw === '-' || deletionsRaw === '-'
    stats.set(toPosix(path), {
      additions: binary ? null : Number(additionsRaw),
      deletions: binary ? null : Number(deletionsRaw),
      binary,
    })
  }
  return stats
}

function buildReviewImpactContext(worktree, inventory, opts) {
  const depth = clampInteger(Number(opts['impact-depth'] || opts.impactDepth || 2), 2, 0, 4)
  const fileLimit = clampInteger(Number(opts['impact-file-limit'] || opts.impactFileLimit || 500), 500, 1, 5000)
  const files = collectSourceFiles(worktree).slice(0, fileLimit)
  const graph = buildShallowGraph(worktree, files)
  const nodes = new Set(graph.nodes.map((node) => node.path))
  const seeds = inventory.files.map((file) => file.path).filter((path) => nodes.has(path))
  const unresolvedChangedFiles = inventory.files.map((file) => file.path).filter((path) => !nodes.has(path))
  const reached = new Map(seeds.map((path) => [path, { path, hops: 0, relations: ['changed'] }]))
  const queue = [...seeds]
  while (queue.length > 0) {
    const current = queue.shift()
    const currentEntry = reached.get(current)
    if (!currentEntry || currentEntry.hops >= depth) continue
    for (const edge of graph.edges) {
      const neighbor = edge.from === current ? edge.to : edge.to === current ? edge.from : null
      if (!neighbor) continue
      const relation = edge.from === current ? `depends-on:${edge.type}` : `dependent:${edge.type}`
      const existing = reached.get(neighbor)
      if (!existing) {
        reached.set(neighbor, { path: neighbor, hops: currentEntry.hops + 1, relations: [relation] })
        queue.push(neighbor)
      } else if (!existing.relations.includes(relation)) {
        existing.relations.push(relation)
      }
    }
  }
  return {
    status: 'advisory',
    depth,
    fileLimit,
    sourceFilesScanned: files.length,
    seedFiles: seeds,
    unresolvedChangedFiles,
    relatedFiles: [...reached.values()]
      .filter((entry) => entry.hops > 0)
      .sort((left, right) => left.hops - right.hops || left.path.localeCompare(right.path)),
    limitations: [
      'static shallow scan only',
      'impact context is review guidance, not a completeness proof',
      'dynamic imports, aliases, generated code, and framework-specific resolution may be incomplete',
    ],
  }
}

function reviewInventoryMarkdown(inventory) {
  if (inventory.files.length === 0) return '(no changed files)'
  const lines = ['| Path | Status | Added | Deleted | Role |', '| --- | --- | ---: | ---: | --- |']
  for (const file of inventory.files) {
    const additions = file.binary ? 'binary' : file.additions ?? 'unknown'
    const deletions = file.binary ? 'binary' : file.deletions ?? 'unknown'
    lines.push(`| ${scalarMarkdownCell(file.path)} | ${scalarMarkdownCell(file.status)} | ${additions} | ${deletions} | ${file.role} |`)
  }
  return lines.join('\n')
}

function reviewImpactMarkdown(impact) {
  const lines = [
    `- Status: ${impact.status}; depth: ${impact.depth}; source files scanned: ${impact.sourceFilesScanned}.`,
    `- Changed files represented in the graph: ${impact.seedFiles.length}.`,
  ]
  if (impact.unresolvedChangedFiles.length > 0) lines.push(`- Unresolved changed files: ${impact.unresolvedChangedFiles.map((path) => `\`${path}\``).join(', ')}.`)
  if (impact.relatedFiles.length === 0) lines.push('- Related files: none found within the configured depth.')
  else {
    lines.push('- Related files:')
    for (const file of impact.relatedFiles) lines.push(`  - \`${file.path}\` (hop ${file.hops}; ${file.relations.join(', ')})`)
  }
  lines.push(`- Limitations: ${impact.limitations.join('; ')}.`)
  return lines.join('\n')
}

function defaultReviewPackageArtifactPath(worktree, base, head) {
  const baseShort = runGitRequired(worktree, ['rev-parse', '--short', base]).trim() || safeName(base).slice(0, 7)
  const headShort = runGitRequired(worktree, ['rev-parse', '--short', head]).trim() || safeName(head).slice(0, 7)
  return `docs/ae/evidence/artifacts/review-package/review-${baseShort}..${headShort}-${timestamp()}.diff`
}

export function reviewContract(worktree, args) {
  const opts = parseOptions(args)
  const kind = String(opts.kind || opts._[0] || 'code')
  const mode = String(opts.mode || 'report-only')
  const targets = splitCsv(opts.targets || opts.targetTypes)
  const reviewers = selectReviewersForContract(kind, opts, targets)
  const targetCoverage = computeReviewTargetCoverage(targets, reviewers)
  const result = {
    status: 'ok',
    kind,
    normalizedKind: kind === 'mixed' || kind === 'hybrid' ? 'general' : kind,
    mode,
    reviewers,
    targetCoverage,
    gate: kind === 'code'
      ? 'P0/P1 findings block delivery unless explicitly accepted by the user.'
      : 'Document findings block downstream work when they invalidate scope, acceptance, validation, or rollback.',
    notes: [
      'This contract selects review lenses only; it does not replace the review itself.',
      'Use the evidence command or --write-evidence to persist the contract for later gate checks.',
    ],
  }
  if (truthy(opts['write-evidence'])) {
    result.evidence = writeEvidenceRecord(worktree, 'review-contract', {
      kind,
      mode,
      reviewers,
      targetCoverage,
      inputs: redactOptions(opts),
    })
  }
  return result
}

function selectReviewersForContract(kind, opts, targets = []) {
  const reviewers = new Set()
  if (kind === 'code') {
    for (const name of ['correctness-reviewer', 'testing-reviewer', 'standards-reviewer', 'maintainability-reviewer']) reviewers.add(name)
  } else {
    for (const name of ['coherence-reviewer', 'feasibility-reviewer']) reviewers.add(name)
  }
  if (kind === 'general' || kind === 'mixed' || kind === 'hybrid') {
    for (const name of ['coherence-reviewer', 'feasibility-reviewer', 'traceability-reviewer']) reviewers.add(name)
  }
  for (const target of targets) {
    for (const name of targetReviewers(target)) reviewers.add(name)
  }
  if (truthy(opts['has-security']) || truthy(opts.has_security)) reviewers.add('security-reviewer')
  if (truthy(opts['has-api']) || truthy(opts.has_api)) reviewers.add('api-contract-reviewer')
  if (truthy(opts['has-reliability']) || truthy(opts.has_reliability)) reviewers.add('reliability-reviewer')
  if (truthy(opts['has-performance']) || truthy(opts.has_performance)) reviewers.add('performance-reviewer')
  if (truthy(opts['has-database']) || truthy(opts.has_database) || truthy(opts['has-migrations']) || truthy(opts.has_migrations)) reviewers.add('data-migrations-reviewer')
  if (truthy(opts['has-evidence']) || truthy(opts.has_evidence_claim)) reviewers.add('evidence-reviewer')
  if (truthy(opts['has-goal-alignment']) || truthy(opts.has_goal_alignment)) reviewers.add('goal-alignment-reviewer')
  return [...reviewers]
}

function targetReviewers(target) {
  const map = {
    code: ['correctness-reviewer', 'testing-reviewer', 'maintainability-reviewer'],
    requirements: ['requirements-reviewer'],
    design: ['design-lens-reviewer'],
    prototype: ['prototype-reviewer'],
    'test-case': ['test-case-reviewer'],
    plan: ['step-granularity-reviewer', 'product-lens-reviewer'],
    config: ['standards-reviewer'],
    asset: ['agent-native-reviewer'],
    document: ['coherence-reviewer', 'feasibility-reviewer', 'evidence-reviewer'],
  }
  return map[target] || []
}

function computeReviewTargetCoverage(targets, reviewers) {
  const selected = new Set(reviewers)
  const coverage = {}
  for (const target of targets) {
    const candidates = targetReviewers(target)
    const matched = candidates.filter((name) => selected.has(name))
    coverage[target] = {
      status: matched.length > 0 ? 'covered' : 'uncovered',
      reviewers: matched,
    }
  }
  return coverage
}
