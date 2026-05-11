#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pluginRoot = resolve(__dirname, '..')
const catalogPath = join(pluginRoot, 'skills', 'ae-help', 'references', 'capability-catalog.json')
const textDecoder = new TextDecoder('utf-8')

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
const stopWords = new Set('the a an in on at to for of with and or is are was were be been being have has had do does did will would could should may might can this that these those it its from by as not no but if then else when where how what which who why all each every both few some any most other such than too very just about after before into over under until up down out use using used fix add update remove create implement plan review task feature bug error issue'.split(' '))

function main() {
  const [command, ...args] = process.argv.slice(2)
  try {
    switch (command) {
      case 'help':
      case undefined:
        printHelp(args.join(' ').trim())
        break
      case 'recovery':
        printJson(recovery(process.cwd()))
        break
      case 'task-analyze':
        printJson(taskAnalyze(process.cwd(), args))
        break
      case 'gate':
        printJson(gate(process.cwd(), args))
        break
      case 'swagger':
        printSwagger(args)
        break
      default:
        throw new Error(`Unknown command: ${command}\nAvailable: help, recovery, task-analyze, gate, swagger`)
    }
  } catch (error) {
    console.error(formatError(error))
    process.exitCode = 1
  }
}

function printHelp(query) {
  const catalog = readJson(catalogPath)
  const q = query.toLowerCase()
  const skills = catalog.skills.filter((skill) => {
    if (!q) return true
    return [skill.name, skill.entry, skill.target, skill.purpose, skill.script, skill.artifactPath].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  const lines = []
  lines.push('# AI Agent Engine for Codex')
  lines.push('')
  lines.push(`来源参考: ${catalog.source.name} (${catalog.source.observedCommit.slice(0, 7)})`)
  lines.push(`运行边界: ${catalog.codexPort.runtimeBoundary}`)
  lines.push('')
  lines.push('## 入口')
  lines.push('')
  for (const skill of skills) {
    const entry = skill.entry || `/${skill.name}`
    const target = skill.target ? `${skill.target}: ` : ''
    lines.push(`- ${target}${entry} (${skill.name})`)
    lines.push(`  说明: ${skill.purpose}`)
    if (skill.script) lines.push(`  脚本: ${skill.script}`)
    if (skill.artifactPath) lines.push(`  产物路径: ${skill.artifactPath}`)
  }
  if (skills.length === 0) {
    lines.push(`没有匹配的 AE 能力: ${query}`)
  }
  lines.push('')
  lines.push('## 产物路径')
  for (const [key, value] of Object.entries(catalog.artifactPaths)) {
    lines.push(`- ${key}: ${value}`)
  }
  lines.push('')
  lines.push('## 说明')
  for (const item of catalog.notes || []) {
    lines.push(`- ${item}`)
  }
  console.log(lines.join('\n'))
}

function recovery(worktree) {
  const docsAe = join(worktree, 'docs', 'ae')
  const result = {
    worktree,
    exists: existsSync(docsAe),
    candidates: [],
    recommendation: 'no_artifacts_found',
  }
  const specs = [
    ['requirements', join(docsAe, 'brainstorms'), /requirements\.md$/],
    ['plan', join(docsAe, 'plans'), /plan\.md$/],
    ['review', join(docsAe, 'reviews'), /.*/],
    ['gate', join(docsAe, 'gates'), /\.json$/],
    ['handoff', join(docsAe, 'handoffs'), /\.md$/],
  ]
  for (const [type, dir, pattern] of specs) {
    for (const file of listFiles(dir).filter((f) => pattern.test(f))) {
      const full = join(dir, file)
      const st = statSync(full)
      result.candidates.push({ type, path: toPosix(relative(worktree, full)), mtime: st.mtime.toISOString(), size: st.size })
    }
  }
  result.candidates.sort((a, b) => b.mtime.localeCompare(a.mtime))
  if (result.candidates.length > 0) {
    const latest = result.candidates[0]
    result.recommendation = latest.type === 'plan'
      ? 'resume_with_ae-work_or_review_plan'
      : latest.type === 'requirements'
        ? 'resume_with_ae-plan'
        : latest.type === 'gate'
          ? 'inspect_gate_then_continue_or_close'
          : 'inspect_latest_artifact'
    result.latest = latest
  }
  return result
}

function taskAnalyze(worktree, args) {
  const opts = parseOptions(args)
  const mode = opts.mode || 'scan'
  if (!['scan', 'plan'].includes(mode)) throw new Error('task-analyze --mode must be scan or plan')
  if (mode === 'plan') {
    if (!opts.plan) throw new Error('task-analyze --mode plan requires --plan <path>')
    const planPath = safeResolve(worktree, opts.plan)
    const text = readText(planPath)
    const units = extractPlanUnits(text)
    const enriched = units.map((unit, index) => ({ ...unit, priority: index + 1, suggested_validation: suggestValidation(unit.files.map((f) => f.path)) }))
    return buildTaskOutput(enriched)
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
  return buildTaskOutput(units, grouped.length === 0 ? ['No matching source files found; manual scoping required.'] : [])
}

function gate(worktree, args) {
  const opts = parseOptions(args)
  const workflow = opts.workflow || 'work'
  const checkpoint = opts.checkpoint || 'final'
  const validation = arrayOpt(opts.validation)
  const gitOps = arrayOpt(opts.git)
  const blockers = []
  const warnings = []

  if (!['lfg', 'work'].includes(workflow)) blockers.push('workflow must be lfg or work')
  if (!['start', 'before_plan', 'before_work', 'before_review', 'final'].includes(checkpoint)) blockers.push('checkpoint is not recognized')

  if (['before_work', 'before_review', 'final'].includes(checkpoint) && opts.plan) {
    const planPath = safeResolve(worktree, opts.plan)
    if (!existsSync(planPath)) blockers.push(`plan file does not exist: ${opts.plan}`)
  } else if (['before_work', 'before_review', 'final'].includes(checkpoint) && !opts.plan) {
    warnings.push('plan path not provided')
  }

  if (['before_review', 'final'].includes(checkpoint) && validation.length === 0) {
    blockers.push('validation commands are required before review/final gate')
  }

  if (checkpoint === 'final') {
    if (!opts['review-status']) warnings.push('review status not provided')
    if (!opts['worktree-decision']) warnings.push('worktree decision not provided')
    if (gitOps.length > 0 && !opts['git-auth']) blockers.push('git operations were reported but --git-auth evidence was not provided')
  }

  const result = {
    workflow,
    checkpoint,
    status: blockers.length > 0 ? 'block' : 'pass',
    worktree,
    plan_path: opts.plan || null,
    validation_commands: validation,
    review_status: opts['review-status'] || null,
    worktree_decision: opts['worktree-decision'] || null,
    git_operations: gitOps,
    blockers,
    warnings,
    notes: opts.notes || null,
    generated_at: new Date().toISOString(),
  }

  if (truthy(opts['write-proof'])) {
    const dir = join(worktree, 'docs', 'ae', 'gates')
    mkdirSync(dir, { recursive: true })
    const file = `${timestamp()}-${workflow}-${checkpoint}.json`
    const proofPath = join(dir, file)
    writeFileSync(proofPath, JSON.stringify(result, null, 2), 'utf8')
    result.proof_path = toPosix(relative(worktree, proofPath))
  }

  return result
}

function printSwagger(args) {
  const opts = parseSwaggerArgs(args)
  if (!opts.source) throw new Error('swagger requires <source>')
  if (/^https?:\/\//i.test(opts.source)) {
    throw new Error('Remote URL parsing must use Codex network approval first. Download the spec or provide a local file.')
  }
  const sourcePath = safeResolve(process.cwd(), opts.source)
  const spec = loadSpec(sourcePath)
  const operations = collectOperations(spec)
  const filtered = filterOperations(operations, opts)
  const mode = opts.mode || (opts.method && opts.path && filtered.length === 1 ? 'detail' : 'overview')
  const result = {
    source: opts.source,
    title: spec.info?.title || null,
    version: spec.info?.version || null,
    openapi: spec.openapi || spec.swagger || null,
    total_operations: operations.length,
    matched_operations: filtered.length,
    mode,
    operations: mode === 'detail' ? filtered.slice(0, 5).map(detailOperation) : filtered.slice(0, 50).map(summaryOperation),
  }
  printJson(result)
}

function readJson(path) {
  return JSON.parse(readText(path))
}

function readText(path) {
  return textDecoder.decode(readFileSync(path))
}

function listFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      for (const child of listFiles(entryPath)) out.push(join(entry.name, child))
    } else if (entry.isFile()) {
      out.push(entry.name)
    }
  }
  return out
}

function collectSourceFiles(root, dir = root) {
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
    return {
      id,
      description: (match[2] || `Unit ${index + 1}`).trim(),
      files: extractFiles(body).map((path) => ({ path, source: 'plan' })),
    }
  })
}

function findNextMajorSection(text, startIndex) {
  const nextMajor = text.slice(startIndex).search(/\n##\s+/)
  return nextMajor >= 0 ? startIndex + nextMajor : text.length
}

function extractFiles(text) {
  const candidates = new Set()
  const patterns = [
    /`([^`]+\.[a-zA-Z0-9]+)`/g,
    /(?:^|\s)((?:src|app|lib|test|tests|docs|config|scripts|packages|components|services|utils|tools|pages|views)\/[\w.\-/]+)(?=\s|$|,|;|\))/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const cleaned = normalizeRelPath(match[1])
      if (cleaned) candidates.add(cleaned)
    }
  }
  return [...candidates].sort()
}

function normalizeRelPath(input) {
  const value = input.trim().replace(/^\.\//, '').replace(/\\/g, '/')
  if (!value || value.includes('..') || value.startsWith('/') || /^[a-zA-Z]:/.test(value)) return null
  return value.replace(/[),.;:]+$/, '')
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

function buildTaskOutput(units, warnings = []) {
  const conflict_matrix = []
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const left = new Set(units[i].files.map((f) => f.path))
      const shared = units[j].files.map((f) => f.path).filter((path) => left.has(path))
      if (shared.length > 0) conflict_matrix.push({ unit_a: units[i].id, unit_b: units[j].id, shared_files: shared })
    }
  }
  const hasConflict = conflict_matrix.length > 0
  return {
    units,
    conflict_matrix,
    parallel_groups: [{ id: 'G1', unit_ids: units.map((u) => u.id), is_parallel_safe: !hasConflict, blocker_reason: hasConflict ? 'shared files detected' : undefined }],
    execution_order: units.map((u) => u.id),
    warnings,
  }
}

function loadSpec(path) {
  const text = readText(path)
  const ext = extname(path).toLowerCase()
  if (ext === '.json' || text.trim().startsWith('{')) return JSON.parse(text)
  throw new Error('YAML parsing is not bundled in the MVP script. Provide JSON or install a YAML parser in a follow-up MCP implementation.')
}

function collectOperations(spec) {
  const operations = []
  const validMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'])
  for (const [pathName, pathItem] of Object.entries(spec.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue
    for (const [method, op] of Object.entries(pathItem)) {
      if (!validMethods.has(method.toLowerCase())) continue
      operations.push({ path: pathName, method: method.toUpperCase(), operation: op || {}, pathParameters: pathItem.parameters || [], spec })
    }
  }
  return operations
}

function filterOperations(operations, opts) {
  return operations.filter((item) => {
    if (opts.method && item.method !== opts.method.toUpperCase()) return false
    if (opts.path && item.path !== opts.path) return false
    if (opts.tag) {
      const tags = Array.isArray(item.operation.tags) ? item.operation.tags : []
      if (!tags.some((tag) => String(tag).toLowerCase() === opts.tag.toLowerCase())) return false
    }
    if (opts.keyword) {
      const haystack = [item.path, item.operation.summary, item.operation.description, item.operation.operationId, ...(item.operation.tags || [])].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(opts.keyword.toLowerCase())) return false
    }
    return true
  })
}

function summaryOperation(item) {
  return {
    method: item.method,
    path: item.path,
    operationId: item.operation.operationId || null,
    summary: item.operation.summary || null,
    tags: item.operation.tags || [],
  }
}

function detailOperation(item) {
  const parameters = [...(item.pathParameters || []), ...(item.operation.parameters || [])]
  const responses = Object.entries(item.operation.responses || {}).map(([status, response]) => ({
    status,
    description: response?.description || null,
    contentTypes: response?.content ? Object.keys(response.content) : [],
  }))
  return {
    ...summaryOperation(item),
    description: item.operation.description || null,
    deprecated: Boolean(item.operation.deprecated),
    parameters: parameters.map((p) => ({ name: p.name, in: p.in, required: Boolean(p.required), description: p.description || null, schema: summarizeSchema(p.schema) })),
    requestBody: summarizeRequestBody(item.operation.requestBody),
    responses,
    security: item.operation.security || item.spec.security || [],
  }
}

function summarizeRequestBody(body) {
  if (!body) return null
  return {
    required: Boolean(body.required),
    description: body.description || null,
    contentTypes: body.content ? Object.keys(body.content) : [],
    schemas: Object.fromEntries(Object.entries(body.content || {}).map(([type, media]) => [type, summarizeSchema(media.schema)])),
  }
}

function summarizeSchema(schema) {
  if (!schema) return null
  if (schema.$ref) return { ref: schema.$ref }
  return {
    type: schema.type || null,
    format: schema.format || null,
    required: schema.required || undefined,
    properties: schema.properties ? Object.keys(schema.properties).slice(0, 40) : undefined,
    items: schema.items ? summarizeSchema(schema.items) : undefined,
  }
}

function parseSwaggerArgs(args) {
  const opts = { source: null }
  for (const arg of args) {
    const idx = arg.indexOf(':')
    if (idx > 0 && ['method', 'path', 'tag', 'keyword', 'mode'].includes(arg.slice(0, idx))) {
      opts[arg.slice(0, idx)] = arg.slice(idx + 1)
    } else if (!opts.source) {
      opts.source = arg
    }
  }
  return opts
}

function parseOptions(args) {
  const opts = { _: [] }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const keyValue = arg.slice(2)
      const eq = keyValue.indexOf('=')
      if (eq >= 0) {
        opts[keyValue.slice(0, eq)] = keyValue.slice(eq + 1)
      } else {
        const next = args[i + 1]
        if (next && !next.startsWith('--')) {
          opts[keyValue] = next
          i++
        } else {
          opts[keyValue] = true
        }
      }
    } else {
      const idx = arg.indexOf(':')
      if (idx > 0 && /^[a-zA-Z-]+$/.test(arg.slice(0, idx))) {
        opts[arg.slice(0, idx)] = arg.slice(idx + 1)
      } else {
        opts._.push(arg)
      }
    }
  }
  return opts
}

function arrayOpt(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value).split('|').map((s) => s.trim()).filter(Boolean)
}

function safeResolve(root, input) {
  if (!input) throw new Error('path is required')
  if (isAbsolute(input) || /^[a-zA-Z]:/.test(input)) throw new Error(`absolute paths are not accepted here: ${input}`)
  const abs = resolve(root, input)
  const rel = relative(root, abs)
  if (rel.startsWith('..') || rel.includes(`..${sep}`) || isAbsolute(rel)) throw new Error(`path escapes worktree: ${input}`)
  return abs
}

function truthy(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes'
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function toPosix(path) {
  return path.replace(/\\/g, '/')
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2))
}

function formatError(error) {
  return error instanceof Error ? `ERROR: ${error.message}` : `ERROR: ${String(error)}`
}

main()
