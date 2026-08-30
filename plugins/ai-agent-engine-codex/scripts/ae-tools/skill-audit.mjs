import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { normalizeArtifactOutputPath, parseOptions, safeResolve, truthy } from './utils.mjs'

export function skillAuditCommand(worktree, args) {
  const opts = parseOptions(args)
  if (truthy(opts.watch)) return watchExternalSkills(worktree, opts)
  const sourceRoot = safeResolve(worktree, 'plugins/ai-agent-engine-codex/skills')
  const mirrorRoot = safeResolve(worktree, '.ae-source/skills')
  const names = readdirSync(sourceRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
  const records = names.map((name) => auditSkill(worktree, sourceRoot, mirrorRoot, name))
  const result = {
    status: 'ok',
    tool: 'skill-audit',
    generatedAt: new Date().toISOString(),
    sourceCount: names.length,
    mirrorCount: records.filter((record) => record.mirrorEqual).length,
    findingCount: records.reduce((count, record) => count + record.findings.length, 0),
    auditedDimensions: ['trigger', 'scope', 'routing', 'runtimeBoundary', 'artifactContract', 'validation', 'metadataMirror', 'licenseProvenance'],
    records,
    limitations: [
      'static document inspection only; dimension signals indicate inspectable guidance, not semantic correctness',
      'does not prove runtime skill behavior or user outcomes',
      'license/provenance is evaluated at repository distribution level; source-specific reuse still needs claim provenance',
      'defer/reject records require human adoption decisions',
    ],
  }
  if (opts.out) {
    const outRel = normalizeArtifactOutputPath(String(opts.out), 'skill-audit')
    const outPath = safeResolve(worktree, outRel)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
    result.output = outRel
  }
  return result
}

function auditSkill(worktree, sourceRoot, mirrorRoot, name) {
  const sourcePath = join(sourceRoot, name, 'SKILL.md')
  const mirrorPath = join(mirrorRoot, name, 'SKILL.md')
  const sourceExists = existsSync(sourcePath) && statSync(sourcePath).isFile()
  const mirrorExists = existsSync(mirrorPath) && statSync(mirrorPath).isFile()
  const source = sourceExists ? readFileSync(sourcePath, 'utf8') : ''
  const mirror = mirrorExists ? readFileSync(mirrorPath, 'utf8') : ''
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)
  const hasName = Boolean(frontmatter && /^name:\s*\S+/m.test(frontmatter[1]))
  const hasDescription = Boolean(frontmatter && /^description:\s*.+/m.test(frontmatter[1]))
  const hasVerification = /validation|verification|evidence|test/i.test(source)
  const dimensions = {
    trigger: dimension(hasDescription, hasDescription ? 'frontmatter description declares the invocation boundary' : 'missing description trigger'),
    scope: dimension(/##\s+(Workflow|Rules|Scope|Operating Principles|Boundaries)/i.test(source), 'workflow, rule, scope, or boundary section'),
    routing: dimension(/\b(route|routing|use when|route to|entrypoint|handoff)\b/i.test(source), 'routing or handoff guidance'),
    runtimeBoundary: dimension(/\b(runtime|boundary|approval|permission|do not|must not|never)\b/i.test(source), 'runtime, authorization, or negative boundary guidance'),
    artifactContract: dimension(/docs\/|artifact|output|record|template/i.test(source), 'artifact, output, record, template, or docs path guidance'),
    validation: dimension(hasVerification, 'validation, verification, evidence, or test guidance'),
    metadataMirror: dimension(hasName && hasDescription && sourceExists && mirrorExists && source === mirror, 'frontmatter and source/mirror equality'),
    licenseProvenance: dimension(true, 'repository GPL-2.0-only distribution boundary; external adaptations require per-source audit evidence'),
  }
  const findings = []
  if (!sourceExists) findings.push({ severity: 'P1', code: 'missing-source', evidence: `plugins/ai-agent-engine-codex/skills/${name}/SKILL.md`, impact: 'Skill cannot be distributed.' })
  if (!mirrorExists || source !== mirror) findings.push({ severity: 'P1', code: 'mirror-mismatch', evidence: `.ae-source/skills/${name}/SKILL.md`, impact: 'Maintenance mirror can drift from plugin source.' })
  if (!hasName || !hasDescription) findings.push({ severity: 'P1', code: 'frontmatter-contract', evidence: sourcePath, impact: 'Skill trigger metadata is incomplete.' })
  if (!hasVerification) findings.push({ severity: 'P2', code: 'verification-guidance-gap', evidence: sourcePath, impact: 'Static guidance does not state an observable verification signal.', disposition: 'defer until a real usage gap or targeted requirement exists.' })
  const hasDeferredDimension = Object.values(dimensions).some((item) => item.status === 'defer')
  return { name, status: findings.some((finding) => finding.severity === 'P1') ? 'finding' : findings.length || hasDeferredDimension ? 'defer' : 'pass', sourcePath: `plugins/ai-agent-engine-codex/skills/${name}/SKILL.md`, mirrorPath: `.ae-source/skills/${name}/SKILL.md`, sourceExists, mirrorExists, mirrorEqual: sourceExists && mirrorExists && source === mirror, hasName, hasDescription, hasVerification, dimensions, findings }
}

function dimension(present, evidence) {
  return { status: present ? 'inspectable' : 'defer', evidence }
}

function watchExternalSkills(worktree, opts) {
  const watchlistRel = opts.watchlist ? String(opts.watchlist) : 'docs/ae/references/external-skill-watchlist.json'
  const result = {
    status: 'ok',
    tool: 'skill-audit-watch',
    generatedAt: new Date().toISOString(),
    watchlist: watchlistRel,
    sources: [],
    limitations: [
      'watch compares pinned commits and optional caller-supplied changed paths; it does not rewrite AE skills, memory, or the watchlist',
      'live git ls-remote may be unavailable; use --remote-commit and repeat --changed-path for deterministic checks',
    ],
  }
  let watchlistPath
  try {
    watchlistPath = safeResolve(worktree, watchlistRel)
  } catch (error) {
    result.sources.push(unavailableSource(null, 'unavailable', error.message || 'invalid-watchlist-path'))
    return maybeWriteWatch(worktree, opts, result)
  }
  if (!existsSync(watchlistPath) || !statSync(watchlistPath).isFile()) {
    result.sources.push(unavailableSource(null, 'unavailable', 'missing-watchlist'))
    return maybeWriteWatch(worktree, opts, result)
  }
  const watchlist = JSON.parse(readFileSync(watchlistPath, 'utf8'))
  const requested = opts.source ? String(opts.source) : null
  const sources = Array.isArray(watchlist.sources)
    ? watchlist.sources.map((source) => ({
        ...source,
        pinnedCommit: validateCommit(source.pinnedCommit, `watchlist pinnedCommit for ${source.id || source.sourceUrl || 'unknown source'}`),
      }))
    : []
  if (!requested && sources.length > 1 && (opts['remote-commit'] !== undefined || opts['changed-path'] !== undefined)) {
    throw new Error('--source is required when explicit remote-commit or changed-path evidence is used with multiple watched sources')
  }
  result.sources = sources
    .filter((source) => !requested || source.id === requested || source.sourceUrl === requested)
    .map((source) => inspectWatchedSource(source, opts))
  if (result.sources.length === 0) {
    result.sources.push(unavailableSource(requested, 'unavailable', requested ? 'source-not-in-watchlist' : 'empty-watchlist'))
  }
  return maybeWriteWatch(worktree, opts, result)
}

function inspectWatchedSource(source, opts) {
  const adoptedSkills = uniqueSkills(source.adopted)
  const changedPaths = normalizeChangedPaths(opts['changed-path'])
  const base = {
    id: source.id || null,
    sourceUrl: source.sourceUrl || null,
    license: source.license || null,
    pinnedCommit: source.pinnedCommit || null,
    refSource: source.refSource || 'HEAD',
    sourceRole: source.sourceRole || 'supplementary-research',
    capabilityDomains: Array.isArray(source.capabilityDomains) ? source.capabilityDomains : [],
    adoptedSkills,
    rejected: Array.isArray(source.rejected) ? source.rejected : [],
    recommendation: 'none',
  }
  const remote = resolveRemoteCommit(source, opts)
  if (remote.freshness === 'unavailable') {
    return {
      ...base,
      freshness: 'unavailable',
      freshnessMethod: remote.freshnessMethod,
      reason: remote.reason,
      observedCommit: null,
      impactStatus: 'unavailable',
      candidateSkills: [],
      affectedSkills: [],
    }
  }
  const stale = remote.observedCommit !== source.pinnedCommit
  const affectedSkills = stale && changedPaths.length > 0
    ? matchAffectedSkills(source.adopted, changedPaths)
    : []
  const impactStatus = !stale
    ? 'current'
    : changedPaths.length === 0
      ? 'stale-impact-unverified'
      : affectedSkills.length > 0
        ? 'stale-affected'
        : 'stale-unrelated'
  return {
    ...base,
    freshness: stale ? 'stale' : 'current',
    freshnessMethod: remote.freshnessMethod,
    observedCommit: remote.observedCommit,
    impactStatus,
    changedPathEvidence: changedPaths,
    candidateSkills: impactStatus === 'stale-impact-unverified' ? adoptedSkills : [],
    affectedSkills,
    recommendation: impactStatus === 'stale-affected'
      ? 'recheck-affected-skills'
      : impactStatus === 'stale-impact-unverified'
        ? 'collect-changed-path-evidence'
        : 'none',
  }
}

function normalizeChangedPaths(value) {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value]
  return [...new Set(values.map((item) => normalizeChangedPath(String(item))))]
}

function normalizeChangedPath(value) {
  const normalized = value.trim().replaceAll('\\', '/')
  if (!normalized || normalized.startsWith('/') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized) || normalized.split('/').includes('..')) {
    throw new Error(`Invalid --changed-path: ${value}`)
  }
  const repoRelative = normalized.split('/').filter((part) => part && part !== '.').join('/')
  if (!repoRelative) throw new Error(`Invalid --changed-path: ${value}`)
  return repoRelative
}

function matchAffectedSkills(adopted, changedPaths) {
  const matched = []
  for (const item of Array.isArray(adopted) ? adopted : []) {
    const upstreamPaths = Array.isArray(item.upstreamPaths)
      ? item.upstreamPaths
      : item.upstream
        ? [item.upstream]
        : []
    const matches = upstreamPaths.some((upstreamPath) => {
      const normalized = normalizeChangedPath(String(upstreamPath))
      return changedPaths.some((changedPath) => changedPath === normalized || changedPath.startsWith(`${normalized}/`))
    })
    if (matches && item.aeSkill && !matched.includes(item.aeSkill)) matched.push(item.aeSkill)
  }
  return matched
}

function resolveRemoteCommit(source, opts) {
  if (opts['remote-commit'] !== undefined) {
    if (Array.isArray(opts['remote-commit'])) throw new Error('--remote-commit must be provided exactly once')
    return {
      freshness: 'observed',
      freshnessMethod: 'explicit-remote-commit',
      observedCommit: validateCommit(opts['remote-commit'], '--remote-commit'),
    }
  }
  if (truthy(opts['no-fetch'])) {
    return {
      freshness: 'unavailable',
      freshnessMethod: 'unavailable',
      reason: 'no-fetch',
    }
  }
  if (!source.sourceUrl) {
    return {
      freshness: 'unavailable',
      freshnessMethod: 'unavailable',
      reason: 'missing-source-url',
    }
  }
  const ref = source.refSource || 'HEAD'
  const fetched = spawnSync('git', ['ls-remote', source.sourceUrl, ref], {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 15000,
  })
  if (fetched.status !== 0) {
    return {
      freshness: 'unavailable',
      freshnessMethod: 'unavailable',
      reason: fetched.stderr?.trim() || 'git-ls-remote-failed',
    }
  }
  const observedCommit = String(fetched.stdout || '').trim().split(/\s+/)[0] || ''
  if (!/^[0-9a-f]{40}$/i.test(observedCommit)) {
    return {
      freshness: 'unavailable',
      freshnessMethod: 'unavailable',
      reason: 'unresolved-remote-commit',
    }
  }
  return {
    freshness: 'observed',
    freshnessMethod: 'git-ls-remote',
    observedCommit: validateCommit(observedCommit, 'git ls-remote commit'),
  }
}

function validateCommit(value, label) {
  const commit = typeof value === 'string' ? value.trim() : ''
  if (!/^[0-9a-fA-F]{40}$/.test(commit)) throw new Error(`Invalid ${label}: expected exactly 40 hexadecimal characters`)
  return commit.toLowerCase()
}

function uniqueSkills(adopted) {
  return [...new Set((Array.isArray(adopted) ? adopted : []).map((item) => item.aeSkill).filter(Boolean))]
}

function unavailableSource(id, freshnessMethod, reason) {
  return {
    id,
    freshness: 'unavailable',
    freshnessMethod,
    reason,
    observedCommit: null,
    impactStatus: 'unavailable',
    candidateSkills: [],
    affectedSkills: [],
    recommendation: 'none',
  }
}

function maybeWriteWatch(worktree, opts, result) {
  if (!opts.out) return result
  const outRel = normalizeArtifactOutputPath(String(opts.out), 'skill-audit')
  const outPath = safeResolve(worktree, outRel)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  result.output = outRel
  return result
}
