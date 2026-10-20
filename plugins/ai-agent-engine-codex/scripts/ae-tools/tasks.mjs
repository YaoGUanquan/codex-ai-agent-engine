// task-analyze / task-brief commands: plan-unit extraction and multi-agent strategy.
import { existsSync, mkdirSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDocumentPage } from '../docs-lifecycle.mjs'
import { scanSourceFiles } from './graph.mjs'
import { parseSimpleYaml } from './yaml.mjs'
import { assertCanonicalContained, boundedInteger, extractFiles, isPlainObject, normalizeArtifactOutputPath, parseOptions, readBoundedText, safeName, safeResolve, scanOptions, timestamp, toPosix } from './utils.mjs'

const stopWords = new Set('the a an in on at to for of with and or is are was were be been being have has had do does did will would could should may might can this that these those it its from by as not no but if then else when where how what which who why all each every both few some any most other such than too very just about after before into over under until up down out use using used fix add update remove create implement plan review task feature bug error issue'.split(' '))
const teamRoles = JSON.parse(readBoundedText(fileURLToPath(new URL('../../skills/ae-help/references/team-roles.json', import.meta.url)), 64 * 1024).text)
const defaultMultiAgentConfig = {
  enabled: 'auto',
  mode: 'auto',
  max_workers: 'auto',
  fallback_max_workers: 3,
  preferred_model: teamRoles.preferred_model,
  min_parallel_units: 2,
  require_clean_git: false,
  require_plan_dependencies: true,
  require_disjoint_files: true,
  allow_write_agents: true,
  review_lanes_parallel: true,
}
const multiAgentModes = new Set(['suggest', 'review_only', 'auto'])
const multiAgentEnabledValues = new Set(['auto', true, false])
const toWorktreePath = (root, path) => toPosix(relative(root, path))
const ownershipKey = (path) => process.platform === 'win32' ? path.toLowerCase() : path

export function taskAnalyze(worktree, args) {
  const opts = parseOptions(args)
  const mode = opts.mode || 'scan'
  if (!['scan', 'plan'].includes(mode)) throw new Error('task-analyze --mode must be scan or plan')
  const multiAgent = loadMultiAgentConfig(worktree)
  const capacity = resolveWorkerCapacity(multiAgent.config, opts)
  if (mode === 'plan') {
    if (!opts.plan) throw new Error('task-analyze --mode plan requires --plan <path>')
    const planPath = safeResolve(worktree, opts.plan)
    assertCanonicalContained(worktree, planPath, 'plan')
    const text = readBoundedText(planPath).text
    const units = extractPlanUnits(text)
    if (units.length > 200 || units.some((unit) => unit.files.length + (unit.read_only_files?.length || 0) + (unit.forbidden_files?.length || 0) > 1000)) throw new Error('plan analysis exceeds 200 units or 1000 files per unit; split the plan without truncating ownership')
    const enriched = units.map((unit, index) => ({ ...unit, priority: index + 1, suggested_validation: suggestValidation(unit.files.map((f) => f.path)) }))
    const executionState = loadExecutionState(worktree, opts['execution-state'], enriched)
    return buildTaskOutput(enriched, multiAgent.warnings, { worktree, multiAgent, capacity, executionState, source_mode: 'plan' })
  }

  const task = opts.task || opts._.join(' ')
  if (typeof task !== 'string' || task.length > 4096) throw new Error('task description must be a string of at most 4096 characters')
  if (!task.trim()) throw new Error('task-analyze --mode scan requires --task <description> or trailing text')
  const keywords = extractKeywords(task)
  const root = opts.root ? safeResolve(worktree, opts.root) : worktree
  assertCanonicalContained(worktree, root, 'task scan root')
  const scan = scanSourceFiles(root, { ...scanOptions(opts, { maxFiles: 1000 }), readText: true, includeDocumentPages: opts['include-document-pages'] })
  const contractWords = /distributed|concurren|bulk|batch|queue|分布式|并发|大数据|批量/i.test(task)
    ? ['queue', 'retry', 'timeout', 'lock', 'transaction', 'batch', 'pagination', 'stream', 'idempotency']
    : []
  const matches = scan.files.map((file) => {
    const pathMatches = keywords.filter((word) => file.relativePath.toLowerCase().includes(word))
    const content = file.text.toLowerCase()
    const contentMatches = keywords.filter((word) => content.includes(word))
    const contractMatches = contractWords.filter((word) => content.includes(word))
    return { ...file, score: pathMatches.length * 4 + contentMatches.length * 2 + contractMatches.length, match: { path: pathMatches, content: contentMatches, contract: contractMatches } }
  }).filter((file) => file.score > 0).sort((left, right) => right.score - left.score || left.relativePath.localeCompare(right.relativePath))
  const files = matches.slice(0, 30)
  const grouped = groupFiles(files)
  const units = grouped.length > 0
    ? grouped.map((group, index) => ({
      id: `S${index + 1}`,
      description: `Work related to ${group.label}`,
      files: group.files.map((file) => ({ path: toWorktreePath(worktree, file.path), source: 'tool_scan', score: file.score, match: file.match })),
      suggested_validation: suggestValidation(group.files.map((file) => file.relativePath)),
      priority: index + 1,
    }))
    : [{ id: 'S1', description: task, files: [], suggested_validation: ['run the narrowest relevant project validation'], priority: 1 }]
  const result = buildTaskOutput(units, [
    ...multiAgent.warnings,
    'Scan matches are advisory candidates, not an ownership or completeness proof; verify contracts and callers manually.',
    ...(grouped.length === 0 ? ['No matching source files found; manual scoping required.'] : []),
  ], { worktree, multiAgent, capacity, executionState: loadExecutionState(worktree, opts['execution-state'], units), source_mode: 'scan' })
  const returned = units.reduce((count, unit) => count + unit.files.length, 0)
  return {
    ...result,
    completeness: { complete: scan.completeness.complete && matches.length <= returned, reasons: [...scan.completeness.reasons, ...(matches.length > returned ? ['candidate-limit'] : [])] },
    diagnostics: scan.diagnostics,
    limits: scan.limits,
    scope: scan.scope,
    manual_scope_review_required: true,
  }
}

export function taskBrief(worktree, args) {
  const opts = parseOptions(args)
  const plan = opts.plan || opts._[0]
  const unitId = String(opts.unit || opts['unit-id'] || opts._[1] || '').trim()
  if (!plan) throw new Error('task-brief requires --plan <path>')
  if (!unitId) throw new Error('task-brief requires --unit <id>')

  const planPath = safeResolve(worktree, plan)
  assertCanonicalContained(worktree, planPath, 'plan')
  const unit = extractPlanUnit(readBoundedText(planPath).text, unitId)
  if (!unit) throw new Error(`task-brief could not find unit ${unitId} in ${plan}`)

  const outRel = opts.out ? normalizeArtifactOutputPath(String(opts.out), 'task-brief') : defaultTaskBriefArtifactPath(unitId)
  const outPath = safeResolve(worktree, outRel)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, `${unit.body.trimEnd()}\n`, 'utf8')

  return {
    status: 'ok',
    plan,
    unit: unit.id,
    heading: unit.heading,
    artifact: {
      path: outRel,
      bytes: statSync(outPath).size,
      lineCount: unit.body.trimEnd().split(/\r?\n/).length,
    },
  }
}

function extractPlanUnits(text) {
  const headingPattern = /^###\s+(U\d+|单元\s*\d+|Unit\s*\d+)\s*[-:：]?\s*([^\n\r]*)/gim
  const headings = [...text.matchAll(headingPattern)]
  if (headings.length === 0) {
    return [{ id: 'U1', description: 'Plan execution', files: extractFiles(text).map((path) => ({ path, source: 'plan' })), ownership_declared: false }]
  }

  return headings.map((match, index) => {
    const next = headings[index + 1]
    const id = /^U\d+/i.test(match[1]) ? match[1].toUpperCase() : `U${index + 1}`
    const bodyStart = match.index + match[0].length
    const sectionEnd = next?.index ?? findNextMajorSection(text, bodyStart)
    const body = text.slice(bodyStart, sectionEnd)
    const forbiddenFiles = extractUnitFiles(body, 'Forbidden files')
    const role = extractListFieldSection(body, 'Role')
    const shared = extractListFieldSection(body, 'Shared resources')
    return {
      id,
      description: (match[2] || `Unit ${index + 1}`).trim(),
      depends_on: extractUnitDependencies(body),
      files: extractOwnedUnitFiles(body, forbiddenFiles).map((path) => ({ path, source: 'plan' })),
      forbidden_files: forbiddenFiles,
      read_only_files: extractUnitFiles(body, 'Read-only files'),
      role: role || 'worker',
      shared_resources: shared === null ? null : parseSharedResources(shared),
      acceptance: extractListFieldSection(body, 'Acceptance'),
      data_access_budget: extractListFieldSection(body, 'Data Access Budget'),
      ownership_declared: Boolean(extractListFieldSection(body, 'Files') || extractListFieldSection(body, 'Read-only files')),
      manual_review_required: [
        ...(!role ? ['role'] : []),
        ...(extractListFieldSection(body, 'Read-only files') === null ? ['read_only_files'] : []),
        ...(shared === null ? ['shared_resources'] : []),
        ...(!extractListFieldSection(body, 'Acceptance') ? ['acceptance'] : []),
        ...(!extractListFieldSection(body, 'Data Access Budget') ? ['data_access_budget'] : []),
      ],
    }
  })
}

function parseSharedResources(section) {
  if (/^(none|无)$/i.test(section.trim())) return []
  return section.split(/[,，\n]+/).map((item) => {
    const value = item.trim().replace(/^-\s+/, '').replace(/`/g, '')
    const match = value.match(/^([a-zA-Z0-9][a-zA-Z0-9:._/-]*)=(read|write)$/)
    return match ? { key: match[1], access: match[2] } : { invalid: value }
  })
}

function extractUnitDependencies(text) {
  const match = text.match(/^\s*-\s*Depends on:\s*([^\n\r]*)/im) || text.match(/^\s*Depends on:\s*([^\n\r]*)/im)
  if (!match) return null
  const raw = match[1].trim()
  if (!raw || /^(none|n\/a|not_applicable|null|无|无依赖|-+)$/i.test(raw)) return []
  return raw
    .split(/[,，、\s]+/)
    .map((item) => normalizeDependencyId(item))
    .filter(Boolean)
}

function normalizeDependencyId(value) {
  const cleaned = String(value).trim().replace(/[),.;:]+$/, '')
  if (/^(none|n\/a|not_applicable|null|无|无依赖|-+)$/i.test(cleaned)) return null
  const match = cleaned.match(/^(?:unit\s*)?(u\d+)$/i)
  return match ? match[1].toUpperCase() : cleaned
}

function findNextMajorSection(text, startIndex) {
  const nextMajor = text.slice(startIndex).search(/\n##\s+/)
  return nextMajor >= 0 ? startIndex + nextMajor : text.length
}

function extractUnitFiles(text, label) {
  const section = extractListFieldSection(text, label)
  if (section === null) return []
  if (/^\s*(none|n\/a|not_applicable|null|无|[-]+)\s*$/i.test(section.trim())) return []
  const quoted = [...section.matchAll(/`([^`]+)`/g)].map((match) => match[1])
  const unquoted = section.replace(/`[^`]+`/g, '')
  const rawPaths = [...unquoted.matchAll(/[^\s,'"<>]+\.[a-zA-Z0-9]+/g)].map((match) => match[0].replace(/[),.;:]+$/, ''))
  return [...new Set([...quoted, ...rawPaths, ...extractFiles(unquoted)])]
}

function extractOwnedUnitFiles(text, forbiddenFiles) {
  const filesSection = extractListFieldSection(text, 'Files')
  const owned = filesSection === null ? extractFiles(text) : extractUnitFiles(text, 'Files')
  const forbidden = new Set([...forbiddenFiles, ...extractUnitFiles(text, 'Read-only files')])
  return owned.filter((path) => !forbidden.has(path))
}

function extractListFieldSection(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp(`^[\\t ]*-?[\\t ]*${escaped}:[\\t ]*([^\\n\\r]*)`, 'im'))
  if (!match || match.index === undefined) return null
  const lineEnd = text.indexOf('\n', match.index)
  const bodyStart = lineEnd === -1 ? text.length : lineEnd + 1
  const inline = match[1].trim()
  const nextField = text.slice(bodyStart).search(/^[\t ]*-?[\t ]*[A-Z][A-Za-z /-]*:[\t ]*/m)
  const block = nextField >= 0 ? text.slice(bodyStart, bodyStart + nextField) : text.slice(bodyStart)
  return [inline, block].filter(Boolean).join('\n').trim()
}

function extractKeywords(text) {
  const words = new Set()
  for (const match of text.matchAll(/[\p{L}\p{N}_./-]+/gu)) {
    const raw = match[0].toLowerCase()
    if (raw.length < 2 || stopWords.has(raw)) continue
    words.add(raw)
    for (const part of raw.split(/[./_-]+/)) {
      if (part.length >= 3 && !stopWords.has(part)) words.add(part)
    }
  }
  return [...words].slice(0, 32)
}

function groupFiles(files) {
  const byDir = new Map()
  for (const file of files) {
    const dir = file.relativePath.split('/').slice(0, 2).join('/') || dirname(file.relativePath)
    if (!byDir.has(dir)) byDir.set(dir, [])
    byDir.get(dir).push(file)
  }
  return [...byDir.entries()].map(([label, groupFiles]) => ({ label, files: groupFiles.slice(0, 8) })).slice(0, 8)
}

function suggestValidation(paths) {
  const commands = []
  const exts = new Set(paths.map((p) => extname(p)))
  if ([...exts].some((ext) => ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext))) {
    commands.push('npm test or npm run typecheck')
  }
  if ([...exts].some((ext) => ['.py'].includes(ext))) commands.push('pytest')
  if ([...exts].some((ext) => ['.go'].includes(ext))) commands.push('go test ./...')
  if ([...exts].some((ext) => ['.java'].includes(ext))) commands.push('mvn test or gradle test')
  if ([...exts].every((ext) => ['.md', '.txt', ''].includes(ext))) commands.push('manual document review')
  return commands.length > 0 ? [...new Set(commands)] : ['run project-specific validation']
}

function buildTaskOutput(units, warnings = [], options = {}) {
  const unitDiagnostics = []
  const duplicateIds = new Set(units.filter((unit, index) => units.findIndex((other) => other.id === unit.id) !== index).map((unit) => unit.id))
  units = units.map((unit) => {
    const normalizePaths = (paths, allowDirectories = false) => [...new Set(paths.flatMap((path) => {
      try {
        const resolved = safeResolve(options.worktree, toPosix(path))
        assertCanonicalContained(options.worktree, resolved, 'unit ownership')
        if (/[*?<>|:\0]/.test(path)) throw new Error('ownership must name a worktree-relative path without wildcards')
        const directory = /[\\/]$|[\\/]\.\.?$/.test(path) || existsSync(resolved) && statSync(resolved).isDirectory()
        if (directory && !allowDirectories) throw new Error('ownership must name explicit files, not directories')
        let ancestor = resolved
        while (!existsSync(ancestor)) ancestor = dirname(ancestor)
        const canonical = join(realpathSync(ancestor), relative(ancestor, resolved))
        const normalized = toWorktreePath(realpathSync(options.worktree), canonical)
        if (!normalized && !allowDirectories) throw new Error('ownership must name a bounded path, not the worktree root')
        return [normalized ? `${normalized}${directory && allowDirectories ? '/' : ''}` : '.']
      } catch (error) {
        unitDiagnostics.push({ unit: unit.id, code: 'invalid_path', path, message: error.message })
        return []
      }
    }))]
    const role = unit.role || 'worker'
    const readOnlyRole = ['reviewer', 'requirements'].includes(role)
    const declaredReads = normalizePaths(unit.read_only_files || [])
    const forbiddenPaths = normalizePaths(unit.forbidden_files || [], true)
    const protectedKeys = new Set(declaredReads.map(ownershipKey))
    const isForbidden = (path) => forbiddenPaths.some((forbidden) => {
      const boundary = ownershipKey(forbidden.replace(/\/+$/, ''))
      const candidate = ownershipKey(path)
      return boundary === '.' || candidate === boundary || candidate.startsWith(`${boundary}/`)
    })
    const files = unit.files.flatMap((file) => normalizePaths([file.path]).flatMap((path) => {
      if (!file.read_only && !readOnlyRole && (protectedKeys.has(ownershipKey(path)) || isForbidden(path))) {
        unitDiagnostics.push({ unit: unit.id, code: 'ambiguous_ownership', path, message: 'canonical path is both writable and read-only or forbidden' })
        if (isForbidden(path)) return []
      }
      return [{
        ...file, path, ...(file.read_only || isDocumentPage(path) || readOnlyRole || options.source_mode === 'scan' || protectedKeys.has(ownershipKey(path)) ? { read_only: true } : {}),
      }]
    }))
    const readOnlyPaths = normalizePaths([...(unit.read_only_files || []), ...files.filter((file) => file.read_only).map((file) => file.path)])
    if (options.source_mode === 'plan' && !unit.ownership_declared) {
      unitDiagnostics.push({ unit: unit.id, code: 'missing_ownership', message: 'unit must explicitly declare Files or Read-only files; inferred references are advisory' })
    }
    if (!Object.hasOwn(teamRoles.roles, role)) unitDiagnostics.push({ unit: unit.id, code: 'invalid_role', message: `unknown role: ${role}` })
    if (duplicateIds.has(unit.id)) unitDiagnostics.push({ unit: unit.id, code: 'duplicate_unit_id', message: 'unit ID must be unique' })
    if (readOnlyRole && unit.shared_resources?.some((resource) => resource.access === 'write')) {
      unitDiagnostics.push({ unit: unit.id, code: 'read_only_role_write_resource', message: 'read-only roles cannot own writable shared resources' })
    }
    if (unit.shared_resources?.some((resource) => resource.invalid !== undefined)) {
      unitDiagnostics.push({ unit: unit.id, code: 'invalid_shared_resources', message: 'Shared resources must be none or comma-separated key=read|write entries' })
    }
    return {
      ...unit, role, files, read_only_files: readOnlyPaths,
      forbidden_files: [...new Set([...forbiddenPaths, ...files.filter((file) => file.read_only).map((file) => file.path)])],
      manual_review_required: unit.manual_review_required || ['ownership', 'role', 'read_only_files', 'shared_resources', 'acceptance', 'data_access_budget'],
      business_independence_verified: false,
    }
  })
  if (units.some((unit) => unit.files.some((file) => isDocumentPage(file.path)))) {
    warnings = [...warnings, 'Immutable document pages are read-only evidence, never writable ownership; update their owning document through the document lifecycle commands.']
  }
  const multiAgent = options.multiAgent || { config: { ...defaultMultiAgentConfig }, source: 'default', path: null, warnings: [] }
  const config = multiAgent.config
  const conflict_matrix = buildConflictMatrix(units)
  const dependencyReport = analyzeDependencies(units)
  const executionState = options.executionState || { source: 'default', units: Object.fromEntries(units.map((unit) => [unit.id, 'pending'])) }
  const capacity = resolveWorkerCapacity(config, { 'host-slots': options.capacity?.host_slots ?? undefined }, Object.values(executionState.units).filter((state) => state === 'running').length)
  const commonParallelBlockers = multiAgentBlockers(units, {
    config, capacity,
    dependencyReport,
    sourceMode: options.source_mode || 'scan',
    includeWriteBlockers: false,
  })
  const scheduling = {
    maxWorkers: capacity.effective_max_workers, conflicts: conflict_matrix, state: executionState.units,
    invalidUnits: new Set(unitDiagnostics.map((item) => item.unit)),
    readOnlyUnits: new Set(units.filter((unit) => unit.files.every((file) => file.read_only)).map((unit) => unit.id)),
    reviewLanesParallel: config.review_lanes_parallel,
  }
  const waves = buildParallelWaves(units, { ...scheduling, serial: commonParallelBlockers.length > 0 })
  const readBlockers = [...commonParallelBlockers]
  if (!config.review_lanes_parallel) readBlockers.push('multi_agent.review_lanes_parallel is false')
  const writeBlockers = multiAgentBlockers(units, {
    config, capacity,
    dependencyReport,
    sourceMode: options.source_mode || 'scan',
    includeWriteBlockers: true,
  })
  if (!waves.some((wave) => wave.unit_ids.length >= config.min_parallel_units)) {
    const reasons = [
      ...dependencyReport.unknown.map((item) => `unknown dependency ${item.dependency} referenced by ${item.unit}`),
      ...(dependencyReport.unresolved.length ? [`cyclic or unresolved dependencies: ${dependencyReport.unresolved.join(', ')}`] : []),
      ...unitDiagnostics.map((item) => `${item.unit}: ${item.message}`),
      ...(conflict_matrix.length ? ['file or shared resource conflicts require serial assignments'] : []),
    ]
    for (const blockers of [readBlockers, writeBlockers]) {
      if (!blockers.length) blockers.push(...(reasons.length ? reasons : ['no conflict-free parallel candidate wave is available']))
    }
  }
  const canReadParallelize = readBlockers.length === 0
  const canWriteParallelize = writeBlockers.length === 0
  const preSpawnRequirements = config.require_clean_git ? ['ae-work pre-edit gate must confirm a clean Git state before write delegation'] : []
  if (units.some((unit) => unit.manual_review_required.length > 0)) preSpawnRequirements.push('parent must manually review missing business independence, acceptance and data budget declarations before write delegation')
  const configAllowsWriteAgents = canWriteParallelize && config.enabled !== false && config.mode === 'auto' && config.allow_write_agents
  const readiness = buildReadiness(units, { ...scheduling, config, parallel: commonParallelBlockers.length === 0 })
  const workerRequests = buildWorkerRequests(units, waves, { config, canReadParallelize, canWriteParallelize, readiness, state: executionState.units })
  return {
    units,
    conflict_matrix,
    parallel_groups: [{
      id: 'G1', unit_ids: units.map((u) => u.id),
      is_parallel_safe: canReadParallelize && conflict_matrix.length === 0 && dependencyReport.is_valid && unitDiagnostics.length === 0,
      business_independence_verified: false,
      blocker_reason: readBlockers.length ? readBlockers.join('; ') : conflict_matrix.length || !dependencyReport.is_valid || unitDiagnostics.length ? 'only the conflict-free candidate waves may run concurrently' : undefined,
    }],
    multi_agent_config: {
      source: multiAgent.source,
      status: multiAgent.source === 'invalid' ? 'invalid' : 'valid',
      path: multiAgent.path,
      effective: config,
    },
    capacity,
    execution_state: executionState,
    readiness,
    dependency_diagnostics: dependencyReport,
    unit_diagnostics: unitDiagnostics,
    manual_scope_review_required: options.source_mode !== 'plan' || units.some((unit) => unit.manual_review_required.length > 0) || unitDiagnostics.length > 0,
    execution_strategy: chooseExecutionStrategy(config, canReadParallelize, canWriteParallelize),
    read_parallel_eligibility: {
      can_parallelize: canReadParallelize,
      blockers: readBlockers,
      notes: multiAgentNotes(config, 'read'),
    },
    write_parallel_eligibility: {
      can_parallelize: canWriteParallelize,
      config_allows_write_agents: configAllowsWriteAgents,
      can_spawn_write_agents_now: false,
      blockers: writeBlockers,
      pre_spawn_requirements: preSpawnRequirements,
      dependency_declarations_present: dependencyReport.declarations_present,
      notes: multiAgentNotes(config, 'write'),
    },
    parallel_eligibility: {
      can_parallelize: canReadParallelize,
      can_spawn_write_agents: false,
      blockers: readBlockers,
      pre_spawn_requirements: preSpawnRequirements,
      dependency_declarations_present: dependencyReport.declarations_present,
      notes: multiAgentNotes(config),
    },
    parallel_waves: waves,
    execution_contract: {
      orchestrator: 'parent-codex-agent',
      decision: 'task-analyze reports readiness; the parent agent decides whether to spawn workers',
      read_only_default: config.mode !== 'auto' || !config.allow_write_agents,
      write_requires_explicit_opt_in: false,
      write_requires_parent_gate: true,
      runtime_verified: false,
      required_worker_fields: ['unit_id', 'role', 'job', 'reasoning_effort', 'preferred_model', 'owned_files', 'read_only_files', 'shared_resources', 'acceptance', 'data_access_budget', 'forbidden_files', 'depends_on', 'validation', 'prohibited_operations', 'return_format'],
      abort_signals: ['overlapping active file or shared resource ownership', 'unknown dependency', 'unresolved overlapping user edits', 'worker edits outside owned files', 'validation failure', 'material business-contract change'],
    },
    worker_requests: workerRequests,
    execution_order: units.map((u) => u.id),
    warnings,
  }
}

function buildWorkerRequests(units, waves, context) {
  const waveByUnit = new Map(waves.flatMap((wave) => wave.unit_ids.map((id) => [id, wave.id])))
  return units.map((unit) => {
    const ownedFiles = unit.files.filter((file) => !file.read_only).map((file) => file.path)
    const readOnlyFiles = unit.read_only_files || []
    const readOnlyUnit = ownedFiles.length === 0
    const role = teamRoles.roles[unit.role]
    return {
      unit_id: unit.id,
      wave_id: waveByUnit.get(unit.id) || null,
      owned_files: ownedFiles,
      read_only_files: readOnlyFiles,
      forbidden_files: unit.forbidden_files || [],
      depends_on: unit.depends_on || [],
      role: unit.role,
      job: role?.job || null,
      reasoning_effort: role?.reasoning_effort || null,
      preferred_model: context.config.preferred_model,
      model_verification_required: true,
      runtime_verified: false,
      shared_resources: unit.shared_resources ?? null,
      acceptance: unit.acceptance ?? null,
      data_access_budget: unit.data_access_budget ?? null,
      manual_review_required: unit.manual_review_required,
      business_independence_verified: false,
      state: context.state[unit.id],
      ready_now: context.readiness.runnable_unit_ids.includes(unit.id)
        && context.config.enabled !== false
        && (readOnlyUnit || context.config.mode === 'auto' && context.config.allow_write_agents),
      lane: readOnlyUnit ? 'read-only' : context.canReadParallelize || context.canWriteParallelize ? 'read-or-write-after-parent-gate' : 'serial',
      authorization: readOnlyUnit ? 'read-only-review' : context.canWriteParallelize && context.config.mode === 'auto' && context.config.allow_write_agents ? 'explicit-parent-approval-required' : 'read-only-review-or-parent-execution',
      validation: unit.suggested_validation || ['run project-specific validation'],
      prohibited_operations: ['git add', 'git commit', 'git push', 'git reset', 'git checkout', 'destructive cleanup', 'service startup unless assigned'],
      return_format: ['changed_files', 'tests_run', 'tests', 'risks', 'conflicts', 'unfinished_work'],
    }
  })
}

function extractPlanUnit(text, unitId) {
  const normalized = text.replace(/\r\n/g, '\n')
  const canonicalUnitId = String(unitId).trim().toUpperCase()
  const headingPattern = /^###\s+(U\d+|单元\s*\d+|Unit\s*\d+)\s*[-:：]?\s*([^\n\r]*)/gim
  const headings = [...normalized.matchAll(headingPattern)]
  for (const [index, match] of headings.entries()) {
    const id = /^U\d+/i.test(match[1]) ? match[1].toUpperCase() : `U${index + 1}`
    if (id !== canonicalUnitId || match.index === undefined) continue
    const next = headings[index + 1]
    const bodyStart = match.index
    const sectionEnd = next?.index ?? findNextMajorSection(normalized, match.index + match[0].length)
    return {
      id,
      heading: (match[2] || `Unit ${index + 1}`).trim(),
      body: normalized.slice(bodyStart, sectionEnd).trimEnd(),
    }
  }
  return null
}

function defaultTaskBriefArtifactPath(unitId) {
  return `docs/ae/evidence/artifacts/task-brief/${safeName(unitId)}-${timestamp()}.md`
}

function loadMultiAgentConfig(worktree) {
  const profilePath = join(worktree, '.codex', 'ae-skill-profiles.yaml')
  const warnings = []
  if (!existsSync(profilePath)) {
    return {
      config: { ...defaultMultiAgentConfig },
      source: 'default',
      path: null,
      warnings,
    }
  }
  try {
    assertCanonicalContained(worktree, profilePath, 'multi-agent profile')
    const profile = parseSimpleYaml(readBoundedText(profilePath, 64 * 1024).text)
    if (profile.multi_agent !== undefined && !isPlainObject(profile.multi_agent)) throw new Error('multi_agent must be a mapping')
    const raw = profile.multi_agent ?? {}
    return {
      config: normalizeMultiAgentConfig(raw),
      source: 'profile',
      path: '.codex/ae-skill-profiles.yaml',
      warnings,
    }
  } catch (error) {
    warnings.push(`Invalid .codex/ae-skill-profiles.yaml multi_agent config: ${error.message}; parallel execution disabled until corrected`)
    return {
      config: { ...defaultMultiAgentConfig, enabled: false, allow_write_agents: false },
      source: 'invalid',
      path: '.codex/ae-skill-profiles.yaml',
      warnings,
    }
  }
}

function normalizeMultiAgentConfig(raw) {
  const config = { ...defaultMultiAgentConfig }
  if (multiAgentEnabledValues.has(raw.enabled)) {
    config.enabled = raw.enabled
  } else if (raw.enabled !== undefined) {
    throw new Error(`unsupported multi_agent.enabled: ${raw.enabled}`)
  }
  for (const key of ['require_clean_git', 'require_plan_dependencies', 'require_disjoint_files', 'allow_write_agents', 'review_lanes_parallel']) {
    if (raw[key] !== undefined && typeof raw[key] !== 'boolean') throw new Error(`multi_agent.${key} must be boolean`)
    if (typeof raw[key] === 'boolean') config[key] = raw[key]
  }
  if (typeof raw.mode === 'string' && multiAgentModes.has(raw.mode)) {
    config.mode = raw.mode
  } else if (raw.mode !== undefined) {
    throw new Error(`unsupported multi_agent.mode: ${raw.mode}`)
  }
  for (const key of Object.keys(raw)) if (!(key in defaultMultiAgentConfig)) throw new Error(`unsupported multi_agent field: ${key}`)
  config.max_workers = raw.max_workers === undefined || raw.max_workers === 'auto'
    ? defaultMultiAgentConfig.max_workers
    : boundedInteger(raw.max_workers, undefined, 'multi_agent.max_workers', 0, Number.MAX_SAFE_INTEGER)
  config.fallback_max_workers = boundedInteger(raw.fallback_max_workers, defaultMultiAgentConfig.fallback_max_workers, 'multi_agent.fallback_max_workers', 0, Number.MAX_SAFE_INTEGER)
  if (raw.preferred_model !== undefined) {
    if (typeof raw.preferred_model !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(raw.preferred_model)) throw new Error('multi_agent.preferred_model must be inherit or an explicit model name')
    config.preferred_model = raw.preferred_model
  }
  config.min_parallel_units = boundedInteger(raw.min_parallel_units, defaultMultiAgentConfig.min_parallel_units, 'multi_agent.min_parallel_units', 2, 8)
  return config
}

function resolveWorkerCapacity(config, opts, runningWorkers = 0) {
  const hostSlots = opts['host-slots'] === undefined ? null : boundedInteger(opts['host-slots'], undefined, '--host-slots', 0, Number.MAX_SAFE_INTEGER)
  const auto = config.max_workers === 'auto'
  const totalLimit = auto ? hostSlots === null ? config.fallback_max_workers : null : config.max_workers
  const available = totalLimit === null ? hostSlots : Math.max(0, totalLimit - runningWorkers)
  return {
    configured_max_workers: config.max_workers,
    host_slots: hostSlots,
    running_workers: runningWorkers,
    total_worker_limit: totalLimit,
    effective_max_workers: hostSlots === null ? available : Math.min(available, hostSlots),
    source: auto ? hostSlots === null ? 'fallback' : 'host' : 'configured',
    assumption: auto && hostSlots === null ? `Host slots are unavailable; assuming fallback_max_workers=${config.fallback_max_workers}, not a provider limit.` : null,
  }
}

function loadExecutionState(worktree, input, units) {
  const states = Object.fromEntries(units.map((unit) => [unit.id, 'pending']))
  if (input === undefined) return { source: 'default', path: null, units: states, evidence_verified: false }
  if (typeof input !== 'string' || !input) throw new Error('--execution-state requires a worktree-relative JSON path')
  const path = safeResolve(worktree, input)
  assertCanonicalContained(worktree, path, 'execution-state')
  let data
  try {
    data = JSON.parse(readBoundedText(path, 64 * 1024).text)
  } catch (error) {
    throw new Error(`Invalid execution-state: ${error.message}`)
  }
  if (!isPlainObject(data) || Object.keys(data).some((key) => key !== 'units') || !isPlainObject(data.units)) throw new Error('execution-state must be an object containing only a units mapping')
  const validStates = new Set(['pending', 'running', 'passed', 'failed', 'blocked', 'cancelled'])
  for (const [id, state] of Object.entries(data.units)) {
    if (!Object.hasOwn(states, id) || !validStates.has(state)) throw new Error(`execution-state has an unknown unit or invalid state: ${id}`)
    states[id] = state
  }
  return { source: 'parent-supplied', path: toWorktreePath(worktree, path), units: states, evidence_verified: false }
}

function analyzeDependencies(units) {
  const unitIds = new Set(units.map((unit) => unit.id))
  const declarationsPresent = units.length <= 1 || units.every((unit) => Array.isArray(unit.depends_on))
  const unknown = []
  for (const unit of units) {
    for (const dependency of unit.depends_on || []) {
      if (!unitIds.has(dependency)) unknown.push({ unit: unit.id, dependency })
    }
  }
  const completed = new Set()
  while (true) {
    const ready = units.filter((unit) => !completed.has(unit.id) && (unit.depends_on || []).every((id) => completed.has(id)))
    if (ready.length === 0) break
    for (const unit of ready) completed.add(unit.id)
  }
  const unresolved = units.filter((unit) => !completed.has(unit.id)).map((unit) => unit.id)
  const duplicateIds = units.length !== unitIds.size
  return {
    declarations_present: declarationsPresent,
    unknown,
    unresolved,
    duplicateIds,
    is_valid: unknown.length === 0 && unresolved.length === 0 && !duplicateIds,
  }
}

function multiAgentBlockers(units, context) {
  const { config, capacity, dependencyReport, sourceMode, includeWriteBlockers = true } = context
  const blockers = []
  if (config.enabled === false) return ['multi_agent.enabled is false']
  if (capacity.effective_max_workers < 2) blockers.push('effective worker capacity is less than 2')
  if (units.length < config.min_parallel_units) blockers.push(`fewer than ${config.min_parallel_units} implementation units`)
  if (includeWriteBlockers && config.mode === 'review_only') blockers.push('multi_agent.mode is review_only; write workers remain disabled')
  if (includeWriteBlockers && units.every((unit) => unit.files.every((file) => file.read_only))) blockers.push('all units require read-only review, not write delegation')
  if (config.require_plan_dependencies && sourceMode !== 'plan') blockers.push('plan mode is required for dependency-aware parallel execution')
  if (config.require_plan_dependencies && !dependencyReport.declarations_present) blockers.push('plan units must declare Depends on')
  if (dependencyReport.duplicateIds) blockers.push('duplicate unit IDs')
  if (includeWriteBlockers && config.mode === 'auto' && !config.allow_write_agents) blockers.push('multi_agent.allow_write_agents is false')
  return blockers
}

function chooseExecutionStrategy(config, canReadParallelize, canWriteParallelize = canReadParallelize) {
  if (config.enabled === false) return 'serial'
  if (config.mode === 'review_only') return 'parallel_review_only'
  if (config.mode === 'auto') return canWriteParallelize ? 'auto_parallel_ready' : 'serial_with_multi_agent_blockers'
  if (!canReadParallelize) return 'suggest_serial'
  return 'suggest_parallel'
}

function multiAgentNotes(config, lane = 'compat') {
  const notes = [
    'task-analyze only reports strategy; the orchestrating Codex agent decides whether to spawn sub-agents',
  ]
  if (lane !== 'read' && config.require_clean_git) notes.push('run git status, current branch, and latest commit before write delegation')
  if (config.enabled === 'auto') notes.push('automatic recommendations still require the parent to verify ownership, acceptance, model support and platform permissions before dispatch')
  if (!config.allow_write_agents) notes.push('write-agent spawning is disabled unless allow_write_agents is explicitly true')
  return notes
}

function buildConflictMatrix(units) {
  const accessByUnit = units.map((unit) => {
    const files = new Map(unit.read_only_files.map((path) => [ownershipKey(path), { path, access: 'read' }]))
    for (const file of unit.files) {
      const key = ownershipKey(file.path)
      if (files.get(key)?.access !== 'write') files.set(key, { path: file.path, access: file.read_only ? 'read' : 'write' })
    }
    const resources = new Map()
    for (const resource of unit.shared_resources || []) {
      if (resource.invalid === undefined && resources.get(resource.key) !== 'write') resources.set(resource.key, resource.access)
    }
    return { files, resources }
  })
  const conflicts = []
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const left = accessByUnit[i]
      const right = accessByUnit[j]
      const sharedFiles = [...left.files].filter(([path, file]) => right.files.has(path) && (file.access === 'write' || right.files.get(path).access === 'write')).map(([, file]) => file.path)
      const sharedResources = [...left.resources].filter(([key, access]) => right.resources.has(key) && (access === 'write' || right.resources.get(key) === 'write')).map(([key]) => key)
      if (sharedFiles.length || sharedResources.length) conflicts.push({
        unit_a: units[i].id, unit_b: units[j].id, shared_files: sharedFiles, shared_resources: sharedResources,
      })
    }
  }
  return conflicts
}

function conflictLookup(conflicts) {
  const neighbors = new Map()
  for (const { unit_a: a, unit_b: b } of conflicts) {
    if (!neighbors.has(a)) neighbors.set(a, new Set())
    if (!neighbors.has(b)) neighbors.set(b, new Set())
    neighbors.get(a).add(b)
    neighbors.get(b).add(a)
  }
  return (a, b) => neighbors.get(a)?.has(b) || false
}

function selectConflictFree(ready, reserved, limit, conflicts, options) {
  const selected = []
  for (const id of ready) {
    if (selected.length >= limit) break
    if (!options.reviewLanesParallel && options.readOnlyUnits.has(id) && [...reserved, ...selected].some((other) => options.readOnlyUnits.has(other))) continue
    if ([...reserved, ...selected].every((other) => !conflicts(id, other))) selected.push(id)
  }
  return selected
}

function buildReadiness(units, options) {
  const conflicts = conflictLookup(options.conflicts)
  const running = units.filter((unit) => options.state[unit.id] === 'running').map((unit) => unit.id)
  const pending = units.filter((unit) => options.state[unit.id] === 'pending')
  const ready = pending.filter((unit) => !options.invalidUnits.has(unit.id)
    && options.config.enabled !== false
    && (options.readOnlyUnits.has(unit.id) || options.config.mode === 'auto' && options.config.allow_write_agents)
    && (unit.depends_on || []).every((id) => options.state[id] === 'passed')
    && running.every((id) => !conflicts(unit.id, id))).map((unit) => unit.id)
  const runnable = selectConflictFree(ready, running, options.parallel ? options.maxWorkers : Math.min(1, options.maxWorkers), conflicts, options)
  return {
    ready_unit_ids: ready,
    runnable_unit_ids: runnable,
    queued_unit_ids: pending.filter((unit) => !runnable.includes(unit.id)).map((unit) => unit.id),
    running_unit_ids: running,
    evidence_verified: false,
    note: 'Readiness filters allowed lanes before reserving free slots and uses parent-supplied states; future candidate waves may include currently disabled write assignments and never prove dependency completion or authorize dispatch.',
  }
}

function buildParallelWaves(units, options) {
  const maxWorkers = options.serial ? Math.min(1, options.maxWorkers) : options.maxWorkers
  if (maxWorkers === 0) return []
  const conflicts = conflictLookup(options.conflicts)
  const running = units.filter((unit) => options.state[unit.id] === 'running').map((unit) => unit.id)
  const completed = new Set(units.filter((unit) => options.state[unit.id] === 'passed').map((unit) => unit.id))
  const remaining = units.filter((unit) => options.state[unit.id] === 'pending' && !options.invalidUnits.has(unit.id))
  const waves = []

  while (remaining.some((unit) => !completed.has(unit.id))) {
    const ready = remaining.filter((unit) => !completed.has(unit.id) && (unit.depends_on || []).every((id) => completed.has(id))).map((unit) => unit.id)
    const selected = selectConflictFree(ready, running, maxWorkers, conflicts, options)
    if (!selected.length) break
    waves.push({ id: `W${waves.length + 1}`, unit_ids: selected, candidate_only: true })
    for (const id of selected) completed.add(id)
  }
  return waves
}
