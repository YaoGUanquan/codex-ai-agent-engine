// task-analyze / task-brief commands: plan-unit extraction and multi-agent strategy.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { collectSourceFiles } from './graph.mjs'
import { parseSimpleYaml } from './yaml.mjs'
import { clampInteger, extractFiles, isPlainObject, normalizeArtifactOutputPath, parseOptions, readText, safeName, safeResolve, timestamp } from './utils.mjs'

const stopWords = new Set('the a an in on at to for of with and or is are was were be been being have has had do does did will would could should may might can this that these those it its from by as not no but if then else when where how what which who why all each every both few some any most other such than too very just about after before into over under until up down out use using used fix add update remove create implement plan review task feature bug error issue'.split(' '))
const defaultMultiAgentConfig = {
  enabled: 'auto',
  mode: 'suggest',
  max_workers: 3,
  min_parallel_units: 2,
  require_clean_git: true,
  require_plan_dependencies: true,
  require_disjoint_files: true,
  allow_write_agents: false,
  review_lanes_parallel: true,
}
const multiAgentModes = new Set(['suggest', 'review_only', 'auto'])
const multiAgentEnabledValues = new Set(['auto', true, false])

export function taskAnalyze(worktree, args) {
  const opts = parseOptions(args)
  const mode = opts.mode || 'scan'
  if (!['scan', 'plan'].includes(mode)) throw new Error('task-analyze --mode must be scan or plan')
  const multiAgent = loadMultiAgentConfig(worktree)
  if (mode === 'plan') {
    if (!opts.plan) throw new Error('task-analyze --mode plan requires --plan <path>')
    const planPath = safeResolve(worktree, opts.plan)
    const text = readText(planPath)
    const units = extractPlanUnits(text)
    const enriched = units.map((unit, index) => ({ ...unit, priority: index + 1, suggested_validation: suggestValidation(unit.files.map((f) => f.path)) }))
    return buildTaskOutput(enriched, multiAgent.warnings, { multiAgent, source_mode: 'plan' })
  }

  const task = opts.task || opts._.join(' ')
  if (!task.trim()) throw new Error('task-analyze --mode scan requires --task <description> or trailing text')
  const keywords = extractKeywords(task)
  const files = collectSourceFiles(worktree).filter((file) => matchesKeywords(file.relativePath, keywords)).slice(0, 30)
  const grouped = groupFiles(files)
  const units = grouped.length > 0
    ? grouped.map((group, index) => ({
      id: `S${index + 1}`,
      description: `Work related to ${group.label}`,
      files: group.files.map((file) => ({ path: file.relativePath, source: 'tool_scan' })),
      suggested_validation: suggestValidation(group.files.map((file) => file.relativePath)),
      priority: index + 1,
    }))
    : [{ id: 'S1', description: task, files: [], suggested_validation: ['run the narrowest relevant project validation'], priority: 1 }]
  return buildTaskOutput(units, [
    ...multiAgent.warnings,
    ...(grouped.length === 0 ? ['No matching source files found; manual scoping required.'] : []),
  ], { multiAgent, source_mode: 'scan' })
}

export function taskBrief(worktree, args) {
  const opts = parseOptions(args)
  const plan = opts.plan || opts._[0]
  const unitId = String(opts.unit || opts['unit-id'] || opts._[1] || '').trim()
  if (!plan) throw new Error('task-brief requires --plan <path>')
  if (!unitId) throw new Error('task-brief requires --unit <id>')

  const planPath = safeResolve(worktree, plan)
  const unit = extractPlanUnit(readText(planPath), unitId)
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
    return [{ id: 'U1', description: 'Plan execution', files: extractFiles(text).map((path) => ({ path, source: 'plan' })) }]
  }

  return headings.map((match, index) => {
    const next = headings[index + 1]
    const id = /^U\d+/i.test(match[1]) ? match[1].toUpperCase() : `U${index + 1}`
    const bodyStart = match.index + match[0].length
    const sectionEnd = next?.index ?? findNextMajorSection(text, bodyStart)
    const body = text.slice(bodyStart, sectionEnd)
    const forbiddenFiles = extractUnitFiles(body, 'Forbidden files')
    return {
      id,
      description: (match[2] || `Unit ${index + 1}`).trim(),
      depends_on: extractUnitDependencies(body),
      files: extractOwnedUnitFiles(body, forbiddenFiles).map((path) => ({ path, source: 'plan' })),
      forbidden_files: forbiddenFiles,
    }
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
  const match = cleaned.match(/^(?:unit\s*)?(u\d+)$/i)
  return match ? match[1].toUpperCase() : null
}

function findNextMajorSection(text, startIndex) {
  const nextMajor = text.slice(startIndex).search(/\n##\s+/)
  return nextMajor >= 0 ? startIndex + nextMajor : text.length
}

function extractUnitFiles(text, label) {
  const section = extractListFieldSection(text, label)
  if (section === null) return []
  if (/^\s*(none|n\/a|not_applicable|null|[-]+)\s*$/i.test(section.trim())) return []
  return extractFiles(section)
}

function extractOwnedUnitFiles(text, forbiddenFiles) {
  const filesSection = extractListFieldSection(text, 'Files')
  const owned = filesSection === null ? extractFiles(text) : extractUnitFiles(text, 'Files')
  const forbidden = new Set(forbiddenFiles)
  return owned.filter((path) => !forbidden.has(path))
}

function extractListFieldSection(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp(`^\\s*-?\\s*${escaped}:\\s*([^\\n\\r]*)`, 'im'))
  if (!match || match.index === undefined) return null
  const lineEnd = text.indexOf('\n', match.index)
  const bodyStart = lineEnd === -1 ? text.length : lineEnd + 1
  const inline = match[1].trim()
  const nextField = text.slice(bodyStart).search(/^\s*-?\s*[A-Z][A-Za-z /-]*:\s*/m)
  const block = nextField >= 0 ? text.slice(bodyStart, bodyStart + nextField) : text.slice(bodyStart)
  return [inline, block].filter(Boolean).join('\n').trim()
}

function extractKeywords(text) {
  const words = new Set()
  for (const match of text.matchAll(/[\p{L}\p{N}_./-]+/gu)) {
    const raw = match[0].toLowerCase()
    if (raw.length < 3 || stopWords.has(raw)) continue
    words.add(raw)
    for (const part of raw.split(/[./_-]+/)) {
      if (part.length >= 3 && !stopWords.has(part)) words.add(part)
    }
  }
  return [...words]
}

function matchesKeywords(path, keywords) {
  if (keywords.length === 0) return false
  const lower = path.toLowerCase()
  return keywords.some((keyword) => lower.includes(keyword))
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
  const multiAgent = options.multiAgent || { config: { ...defaultMultiAgentConfig }, source: 'default', path: null, warnings: [] }
  const config = multiAgent.config
  const conflict_matrix = []
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const left = new Set(units[i].files.map((f) => f.path))
      const shared = units[j].files.map((f) => f.path).filter((path) => left.has(path))
      if (shared.length > 0) conflict_matrix.push({ unit_a: units[i].id, unit_b: units[j].id, shared_files: shared })
    }
  }
  const hasConflict = conflict_matrix.length > 0
  const dependencyReport = analyzeDependencies(units)
  const commonParallelBlockers = multiAgentBlockers(units, {
    config,
    hasConflict,
    dependencyReport,
    sourceMode: options.source_mode || 'scan',
    includeWriteBlockers: false,
  })
  const readBlockers = [...commonParallelBlockers]
  if (!config.review_lanes_parallel) readBlockers.push('multi_agent.review_lanes_parallel is false')
  const writeBlockers = multiAgentBlockers(units, {
    config,
    hasConflict,
    dependencyReport,
    sourceMode: options.source_mode || 'scan',
    includeWriteBlockers: true,
  })
  const canReadParallelize = readBlockers.length === 0
  const canWriteParallelize = writeBlockers.length === 0
  const waves = buildParallelWaves(units, {
    maxWorkers: config.max_workers,
    serial: !canReadParallelize,
  })
  const preSpawnRequirements = config.require_clean_git ? ['ae-work pre-edit gate must confirm a clean Git state before write delegation'] : []
  const configAllowsWriteAgents = canWriteParallelize && config.enabled !== false && config.mode === 'auto' && config.allow_write_agents
  const workerRequests = buildWorkerRequests(units, waves, { config, canReadParallelize, canWriteParallelize, dependencyReport, hasConflict })
  return {
    units,
    conflict_matrix,
    parallel_groups: [{ id: 'G1', unit_ids: units.map((u) => u.id), is_parallel_safe: !hasConflict, blocker_reason: hasConflict ? 'shared files detected' : undefined }],
    multi_agent_config: {
      source: multiAgent.source,
      path: multiAgent.path,
      effective: config,
    },
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
      read_only_default: true,
      write_requires_explicit_opt_in: true,
      required_worker_fields: ['unit_id', 'owned_files', 'forbidden_files', 'depends_on', 'validation', 'prohibited_operations', 'return_format'],
      abort_signals: ['shared files detected', 'unknown dependency', 'dirty Git state before write delegation', 'worker edits outside owned files', 'validation failure'],
    },
    worker_requests: workerRequests,
    execution_order: units.map((u) => u.id),
    warnings,
  }
}

function buildWorkerRequests(units, waves, context) {
  const waveByUnit = new Map(waves.flatMap((wave) => wave.unit_ids.map((id) => [id, wave.id])))
  return units.map((unit) => ({
    unit_id: unit.id,
    wave_id: waveByUnit.get(unit.id) || null,
    owned_files: unit.files.map((file) => file.path),
    forbidden_files: unit.forbidden_files || [],
    depends_on: unit.depends_on || [],
    lane: context.canReadParallelize ? 'read-or-write-after-parent-gate' : 'serial',
    authorization: context.canWriteParallelize && context.config.mode === 'auto' && context.config.allow_write_agents ? 'explicit-parent-approval-required' : 'read-only-review-or-parent-execution',
    validation: unit.suggested_validation || ['run project-specific validation'],
    prohibited_operations: ['git add', 'git commit', 'git push', 'git reset', 'git checkout', 'destructive cleanup', 'service startup unless assigned'],
    return_format: ['changed_files', 'tests_run', 'risks', 'conflicts'],
  }))
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
    const profile = parseSimpleYaml(readText(profilePath))
    const raw = isPlainObject(profile.multi_agent) ? profile.multi_agent : {}
    return {
      config: normalizeMultiAgentConfig(raw, warnings),
      source: 'profile',
      path: '.codex/ae-skill-profiles.yaml',
      warnings,
    }
  } catch (error) {
    warnings.push(`Ignoring invalid .codex/ae-skill-profiles.yaml multi_agent config: ${error.message}`)
    return {
      config: { ...defaultMultiAgentConfig },
      source: 'default',
      path: '.codex/ae-skill-profiles.yaml',
      warnings,
    }
  }
}

function normalizeMultiAgentConfig(raw, warnings) {
  const config = { ...defaultMultiAgentConfig }
  if (multiAgentEnabledValues.has(raw.enabled)) {
    config.enabled = raw.enabled
  } else if (raw.enabled !== undefined) {
    warnings.push(`Ignoring unknown multi_agent.enabled: ${raw.enabled}`)
  }
  for (const key of ['require_clean_git', 'require_plan_dependencies', 'require_disjoint_files', 'allow_write_agents', 'review_lanes_parallel']) {
    if (typeof raw[key] === 'boolean') config[key] = raw[key]
  }
  if (typeof raw.mode === 'string' && multiAgentModes.has(raw.mode)) {
    config.mode = raw.mode
  } else if (raw.mode !== undefined) {
    warnings.push(`Ignoring unknown multi_agent.mode: ${raw.mode}`)
  }
  config.max_workers = clampInteger(raw.max_workers, defaultMultiAgentConfig.max_workers, 1, 8)
  config.min_parallel_units = clampInteger(raw.min_parallel_units, defaultMultiAgentConfig.min_parallel_units, 2, 8)
  return config
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
  return {
    declarations_present: declarationsPresent,
    unknown,
    is_valid: unknown.length === 0,
  }
}

function multiAgentBlockers(units, context) {
  const { config, hasConflict, dependencyReport, sourceMode, includeWriteBlockers = true } = context
  const blockers = []
  if (config.enabled === false) return ['multi_agent.enabled is false']
  if (config.max_workers < 2) blockers.push('multi_agent.max_workers is less than 2')
  if (units.length < config.min_parallel_units) blockers.push(`fewer than ${config.min_parallel_units} implementation units`)
  if (includeWriteBlockers && config.mode === 'review_only') blockers.push('multi_agent.mode is review_only; write workers remain disabled')
  if (config.require_disjoint_files && hasConflict) blockers.push('shared files detected across units')
  if (config.require_plan_dependencies && sourceMode !== 'plan') blockers.push('plan mode is required for dependency-aware parallel execution')
  if (config.require_plan_dependencies && !dependencyReport.declarations_present) blockers.push('plan units must declare Depends on')
  for (const item of dependencyReport.unknown) blockers.push(`unknown dependency ${item.dependency} referenced by ${item.unit}`)
  if (includeWriteBlockers && config.mode === 'auto' && !config.allow_write_agents) blockers.push('multi_agent.allow_write_agents is false')
  return blockers
}

function chooseExecutionStrategy(config, canReadParallelize, canWriteParallelize = canReadParallelize) {
  if (config.enabled === false) return 'serial'
  if (config.mode === 'review_only') return 'parallel_review_only'
  if (!canReadParallelize) return config.mode === 'auto' ? 'serial_with_multi_agent_blockers' : 'suggest_serial'
  if (!canWriteParallelize && config.mode === 'auto') return 'serial_with_multi_agent_blockers'
  if (config.mode === 'auto') return config.allow_write_agents ? 'auto_parallel_ready' : 'auto_parallel_blocked'
  return 'suggest_parallel'
}

function multiAgentNotes(config, lane = 'compat') {
  const notes = [
    'task-analyze only reports strategy; the orchestrating Codex agent decides whether to spawn sub-agents',
  ]
  if (lane !== 'read' && config.require_clean_git) notes.push('run git status, current branch, and latest commit before write delegation')
  if (config.enabled === 'auto') notes.push('multi_agent.enabled=auto only enables analysis and recommendations; write workers still require mode=auto and allow_write_agents=true')
  if (!config.allow_write_agents) notes.push('write-agent spawning is disabled unless allow_write_agents is explicitly true')
  return notes
}

function buildParallelWaves(units, options) {
  const maxWorkers = Math.max(1, options.maxWorkers || 1)
  if (options.serial || units.length <= 1) return units.map((unit, index) => ({ id: `W${index + 1}`, unit_ids: [unit.id] }))
  const byId = new Map(units.map((unit) => [unit.id, unit]))
  const completed = new Set()
  const remaining = new Set(units.map((unit) => unit.id))
  const waves = []

  while (remaining.size > 0) {
    const ready = [...remaining].filter((id) => (byId.get(id).depends_on || []).every((dependency) => completed.has(dependency)))
    if (ready.length === 0) {
      for (const id of remaining) waves.push({ id: `W${waves.length + 1}`, unit_ids: [id], blocker_reason: 'cyclic or unresolved dependencies' })
      break
    }
    for (let i = 0; i < ready.length; i += maxWorkers) {
      const chunk = ready.slice(i, i + maxWorkers)
      waves.push({ id: `W${waves.length + 1}`, unit_ids: chunk })
      for (const id of chunk) {
        remaining.delete(id)
        completed.add(id)
      }
    }
  }

  return waves
}
