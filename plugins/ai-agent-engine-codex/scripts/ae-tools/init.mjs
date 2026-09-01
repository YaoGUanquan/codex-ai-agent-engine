// init command: project scaffolding rendered from external UTF-8 template files.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseOptions, readText, safeResolve, truthy } from './utils.mjs'

export const generatedMarker = '<!-- ae-codex:init managed -->'
export const generatedEndMarker = '<!-- /ae-codex:init managed -->'

const profileNames = ['minimal', 'ae-core', 'full']
const coreDirectories = [
  'docs/ae',
  'docs/ae/prds',
  'docs/ae/brainstorms',
  'docs/ae/plans',
  'docs/ae/reviews',
  'docs/ae/gates',
  'docs/ae/handoffs',
  'docs/ae/experience',
  'docs/ae/solutions',
  'docs/ae/archive',
  'docs/00-process',
  'docs/00-process/active',
  'docs/00-process/archive',
  'docs/00-process/templates',
  'docs/08-ai-memory',
]
const fullOnlyDirectories = [
  'docs/01-history',
  'docs/02-design',
  'docs/03-analysis',
  'docs/04-api',
  'docs/05-reports',
  'docs/06-sql',
  'docs/06-sql/migrations',
  'docs/06-sql/ddl',
  'docs/06-sql/ad-hoc',
  'docs/06-sql/archive',
  'docs/07-test-data',
  'docs/99-archive',
]
const nestedManifestNames = ['package.json', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'go.mod', 'pyproject.toml', 'Cargo.toml']
const scanExcludedDirectories = new Set(['.git', '.next', '.venv', 'build', 'coverage', 'dist', 'docs', 'node_modules', 'target', 'vendor'])
const maxScanDepth = 3
const maxScanResults = 50

const templatesRoot = resolve(fileURLToPath(new URL('./init-templates', import.meta.url)))
const templateKeys = [
  'agents',
  'aeReadme',
  'processReadme',
  'archiveRules',
  'syncPlanTemplate',
  'encodingRules',
  'memoryIndex',
  'memoryProjectContext',
  'memoryArchitecture',
  'memoryKeyWorkflows',
  'memoryKnownPitfalls',
  'memoryDecisionLog',
  'memoryMaintenanceRules',
  'memoryPromptTemplate',
]

export function initProject(worktree, args) {
  const opts = parseOptions(args)
  const lang = opts.lang || 'en'
  if (!['en', 'zh-CN', 'bilingual'].includes(lang)) {
    throw new Error('init --lang must be en, zh-CN, or bilingual')
  }
  const profile = opts.profile || 'ae-core'
  if (!profileNames.includes(profile)) {
    throw new Error('init --profile must be minimal, ae-core, or full')
  }
  const nestedMode = opts.nested || null
  if (nestedMode && nestedMode !== 'preview') {
    throw new Error('init --nested must be preview')
  }
  const dryRun = truthy(opts['dry-run'])
  const force = truthy(opts.force)
  const explainInstructions = truthy(opts['explain-instructions'])
  const projectContext = detectProjectContext(worktree)
  const templates = initTemplates(lang, projectContext, profile)
  const directories = profile === 'minimal' ? [] : [...coreDirectories, ...(profile === 'full' ? fullOnlyDirectories : [])]
  const coreFiles = [
    ['AGENTS.md', templates.agents],
    ['docs/ae/README.md', templates.aeReadme],
    ['docs/00-process/README.md', templates.processReadme],
    ['docs/00-process/templates/archive-rules.md', templates.archiveRules],
    ['docs/00-process/templates/sync-execution-plan-template.md', templates.syncPlanTemplate],
    ['docs/00-process/templates/encoding-rules.md', templates.encodingRules],
    ['docs/08-ai-memory/00-index.md', templates.memoryIndex],
    ['docs/08-ai-memory/01-project-context.md', templates.memoryProjectContext],
    ['docs/08-ai-memory/02-architecture-boundaries.md', templates.memoryArchitecture],
    ['docs/08-ai-memory/03-key-workflows.md', templates.memoryKeyWorkflows],
    ['docs/08-ai-memory/04-known-pitfalls.md', templates.memoryKnownPitfalls],
    ['docs/08-ai-memory/05-decision-log.md', templates.memoryDecisionLog],
    ['docs/08-ai-memory/06-agent-maintenance-rules.md', templates.memoryMaintenanceRules],
    ['docs/08-ai-memory/99-prompt-template.md', templates.memoryPromptTemplate],
  ]
  const files = profile === 'minimal' ? coreFiles.slice(0, 1) : coreFiles

  const createdDirectories = []
  const createdFiles = []
  const updatedFiles = []
  const skippedFiles = []
  const conflictedFiles = []

  for (const dir of directories) {
    const full = safeResolve(worktree, dir)
    if (!existsSync(full)) {
      createdDirectories.push(dir)
      if (!dryRun) mkdirSync(full, { recursive: true })
    }
  }

  for (const [path, content] of files) {
    const full = safeResolve(worktree, path)
    if (!existsSync(full)) {
      createdFiles.push(path)
      if (!dryRun) {
        mkdirSync(dirname(full), { recursive: true })
        writeFileSync(full, content, 'utf8')
      }
      continue
    }
    if (!force) {
      skippedFiles.push(path)
      continue
    }
    const existing = readText(full)
    const update = replaceManagedRegion(existing, content)
    if (update.status === 'updated') {
      updatedFiles.push(path)
      if (!dryRun) writeFileSync(full, update.content, 'utf8')
    } else if (update.status === 'legacy-managed') {
      conflictedFiles.push({
        path,
        reason: 'legacy-marker-without-managed-region',
        action: 'preserved; migrate user content around a bounded AE managed region before retrying --force',
      })
    } else {
      skippedFiles.push(path)
    }
  }

  const instructionInventory = explainInstructions ? inspectInstructions(worktree) : null
  const nestedCandidates = nestedMode === 'preview' ? discoverNestedCandidates(worktree) : []

  return {
    status: dryRun ? 'dry-run' : 'initialized',
    worktree,
    lang,
    profile,
    force,
    nested_mode: nestedMode,
    created_directories: createdDirectories,
    created_files: createdFiles,
    updated_files: updatedFiles,
    skipped_files: skippedFiles,
    conflicted_files: conflictedFiles,
    detected_context: projectContext,
    ...(instructionInventory ? { instruction_inventory: instructionInventory } : {}),
    ...(nestedMode === 'preview' ? { nested_candidates: nestedCandidates } : {}),
    notes: [
      'Existing files are preserved by default. --force replaces only a complete AE managed region; legacy marker-only files are reported as conflicts.',
      'AGENTS.md is a client-neutral Markdown convention. instruction_inventory.codex_effective_files describes Codex-specific precedence only.',
      'Nested candidates are bounded suggestions and are never created automatically.',
      profile === 'minimal'
        ? 'The minimal profile creates only AGENTS.md and does not pre-create AE workflow directories.'
        : 'Store AE workflow artifacts under docs/ae, process/archive docs under docs/00-process, and durable AI memory under docs/08-ai-memory.',
      'Read and write generated Markdown as UTF-8. On Windows, do not trust garbled console rendering until verified with explicit UTF-8 reads.',
    ],
  }
}

export function isManagedFile(path) {
  try {
    return managedRegionStatus(readText(path)) !== 'unmanaged'
  } catch {
    return false
  }
}

export function replaceManagedRegion(existing, replacement) {
  const status = managedRegionStatus(existing)
  if (status !== 'bounded') return { status }
  const start = existing.indexOf(generatedMarker)
  const end = existing.indexOf(generatedEndMarker, start) + generatedEndMarker.length
  return {
    status: 'updated',
    content: `${existing.slice(0, start)}${replacement}${existing.slice(end)}`,
  }
}

function initTemplates(lang, context, profile) {
  if (lang === 'bilingual') {
    const en = loadLangTemplates('en', context, profile)
    const zh = loadLangTemplates('zh-CN', context, profile)
    return Object.fromEntries(templateKeys.map((key) => [key, managedContent(`${templateBody(zh[key])}\n\n---\n\n${templateBody(en[key])}`)]))
  }
  const templates = loadLangTemplates(lang, context, profile)
  return Object.fromEntries(templateKeys.map((key) => [key, managedContent(templateBody(templates[key]))]))
}

function loadLangTemplates(lang, context, profile) {
  const fallback = lang === 'zh-CN' ? '待补充' : 'TBD'
  const descriptionLine = lang === 'zh-CN'
    ? (context.description ? `- 描述：${context.description}\n` : '')
    : (context.description ? `- Description: ${context.description}\n` : '')
  const replacements = {
    name: context.name,
    descriptionLine,
    indicators: formatList(context.indicators, fallback),
    importantPaths: formatList(context.importantPaths, fallback),
    scripts: formatList(context.scripts, fallback),
    aeWorkflowRules: aeWorkflowRules(lang, profile),
  }
  return Object.fromEntries(templateKeys.map((key) => [key, renderTemplate(lang, key, replacements)]))
}

function aeWorkflowRules(lang, profile) {
  if (profile === 'minimal') {
    return lang === 'zh-CN'
      ? '- 除非当前任务明确需要，否则不要预建 AE 工作流目录。'
      : '- Do not pre-create AE workflow directories unless the current task explicitly requires them.'
  }
  return lang === 'zh-CN'
    ? [
        '- AE 工作流产物记录在 `docs/ae`。',
        '- 执行中的过程记录放在 `docs/00-process/active`。',
        '- 已完成的过程记录归档到 `docs/00-process/archive/YYYY-MM/<task-name>` 或 `docs/99-archive/YYYY-MM/<topic>`。',
        '- 长期 AI 记忆记录在 `docs/08-ai-memory`。',
      ].join('\n')
    : [
        '- Record AE workflow artifacts under `docs/ae`.',
        '- Record active process notes under `docs/00-process/active`.',
        '- Archive completed process notes under `docs/00-process/archive/YYYY-MM/<task-name>` or `docs/99-archive/YYYY-MM/<topic>`.',
        '- Record durable AI memory under `docs/08-ai-memory`.',
      ].join('\n')
}

function renderTemplate(lang, key, replacements) {
  // Normalize CRLF so a CRLF checkout cannot change generated file bytes.
  const raw = readText(join(templatesRoot, lang, `${key}.md`)).replace(/\r\n/g, '\n')
  return raw.replace(/\{\{(\w+)\}\}/g, (match, token) => {
    if (!(token in replacements)) throw new Error(`unknown init template placeholder ${match} in ${lang}/${key}.md`)
    return replacements[token]
  })
}

function detectProjectContext(worktree) {
  const packagePath = join(worktree, 'package.json')
  const packageJson = existsSync(packagePath) ? readOptionalJson(packagePath) : null
  const indicators = []
  const importantPaths = []
  const scripts = []
  if (packageJson) {
    indicators.push('Node.js package.json')
    if (packageJson.type) indicators.push(`package type: ${packageJson.type}`)
    const runner = detectPackageRunner(worktree, packageJson)
    for (const [name, command] of Object.entries(packageJson.scripts || {})) {
      scripts.push(`\`${markdownInlineCode(`${runner} run ${name}`)}\` - ${markdownSingleLine(command)}`)
    }
  }
  const pathSignals = [
    ['pom.xml', 'Maven Java project'],
    ['build.gradle', 'Gradle project'],
    ['go.mod', 'Go module'],
    ['pyproject.toml', 'Python pyproject'],
    ['Cargo.toml', 'Rust Cargo project'],
    ['README.md', 'README.md'],
    ['README.zh-CN.md', 'README.zh-CN.md'],
    ['.agents', 'project-local Codex agents'],
    ['plugins', 'plugin directory'],
    ['scripts', 'scripts directory'],
    ['src', 'source directory'],
    ['docs', 'docs directory'],
  ]
  for (const [path, label] of pathSignals) {
    if (existsSync(join(worktree, path))) {
      indicators.push(label)
      importantPaths.push(path)
    }
  }
  const repoName = basename(worktree)
  return {
    name: packageJson?.name || repoName,
    description: packageJson?.description || null,
    indicators: [...new Set(indicators)].slice(0, 20),
    importantPaths: [...new Set(importantPaths)].slice(0, 20),
    scripts: scripts.slice(0, 20),
  }
}

function managedRegionStatus(content) {
  const starts = countOccurrences(content, generatedMarker)
  const ends = countOccurrences(content, generatedEndMarker)
  if (starts === 1 && ends === 1 && content.indexOf(generatedMarker) < content.indexOf(generatedEndMarker)) return 'bounded'
  if (starts > 0) return 'legacy-managed'
  return 'unmanaged'
}

function managedContent(content) {
  return `${generatedMarker}\n${content.trim()}\n${generatedEndMarker}\n`
}

function templateBody(content) {
  return content.replaceAll(generatedMarker, '').replaceAll(generatedEndMarker, '').trim()
}

function countOccurrences(content, token) {
  return content.split(token).length - 1
}

function detectPackageRunner(worktree, packageJson) {
  const declared = String(packageJson.packageManager || '').split('@')[0]
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(declared)) return declared
  if (existsSync(join(worktree, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(worktree, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(worktree, 'bun.lock')) || existsSync(join(worktree, 'bun.lockb'))) return 'bun'
  return 'npm'
}

function markdownInlineCode(value) {
  return markdownSingleLine(value).replace(/`/g, '\\`')
}

function markdownSingleLine(value) {
  return String(value).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function inspectInstructions(worktree) {
  const files = scanTree(worktree, ({ relativePath, fullPath }) => {
    return ['AGENTS.md', 'AGENTS.override.md']
      .filter((name) => existsSync(join(fullPath, name)))
      .map((name) => ({
        path: relativePath === '.' ? name : `${relativePath.replace(/\\/g, '/')}/${name}`,
        kind: name === 'AGENTS.override.md' ? 'override' : 'standard',
        scope: relativePath.replace(/\\/g, '/'),
      }))
  })
  const byScope = new Map()
  for (const file of files) {
    const current = byScope.get(file.scope) || []
    current.push(file)
    byScope.set(file.scope, current)
  }
  const scopeSelections = [...byScope.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([scope, candidates]) => {
    const selected = candidates.find((file) => file.kind === 'override') || candidates.find((file) => file.kind === 'standard')
    return {
      scope,
      selected_file: selected.path,
      shadowed_files: candidates.filter((file) => file !== selected).map((file) => file.path),
    }
  })
  const rootSelection = scopeSelections.find((selection) => selection.scope === '.')
  return {
    convention: 'AGENTS.md is standard Markdown with no required fields; nested files may provide more specific project guidance.',
    codex_precedence: 'Within one directory Codex selects AGENTS.override.md before AGENTS.md, then merges selected files from project root toward the working directory.',
    files,
    codex_effective_files: rootSelection ? [rootSelection.selected_file] : [],
    codex_scope_selections: scopeSelections,
    bounded: true,
    max_depth: maxScanDepth,
    max_results: maxScanResults,
  }
}

function discoverNestedCandidates(worktree) {
  return scanTree(worktree, ({ relativePath, fullPath, depth }) => {
    if (depth === 0) return null
    const manifests = nestedManifestNames.filter((name) => existsSync(join(fullPath, name)))
    if (manifests.length === 0) return null
    const instructionFiles = ['AGENTS.override.md', 'AGENTS.md'].filter((name) => existsSync(join(fullPath, name)))
    return {
      path: relativePath.replace(/\\/g, '/'),
      manifests,
      suggested_path: `${relativePath.replace(/\\/g, '/')}/AGENTS.md`,
      existing_instructions: instructionFiles,
    }
  })
}

function scanTree(worktree, visitor) {
  const results = []
  const visit = (directory, depth) => {
    if (results.length >= maxScanResults || depth > maxScanDepth) return
    const relativePath = relative(worktree, directory) || '.'
    const result = visitor({ fullPath: directory, relativePath, depth })
    if (Array.isArray(result)) results.push(...result.slice(0, maxScanResults - results.length))
    else if (result) results.push(result)
    if (depth === maxScanDepth) return
    const entries = readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.startsWith('.') && !scanExcludedDirectories.has(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (results.length >= maxScanResults) break
      visit(join(directory, entry.name), depth + 1)
    }
  }
  visit(worktree, 0)
  return results.sort((a, b) => a.path.localeCompare(b.path))
}

function readOptionalJson(path) {
  try {
    return JSON.parse(readText(path))
  } catch {
    return null
  }
}

function formatList(items, fallback = 'TBD') {
  if (!items || items.length === 0) return `- ${fallback}`
  return items.map((item) => `- ${item}`).join('\n')
}
