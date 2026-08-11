// init command: project scaffolding rendered from external UTF-8 template files.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseOptions, readText, safeResolve, truthy } from './utils.mjs'

export const generatedMarker = '<!-- ae-codex:init managed -->'

const templatesRoot = resolve(fileURLToPath(new URL('./init-templates', import.meta.url)))
const templateKeys = [
  'agents',
  'aeReadme',
  'memoryReadme',
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
  const dryRun = truthy(opts['dry-run'])
  const force = truthy(opts.force)
  const projectContext = detectProjectContext(worktree)
  const templates = initTemplates(lang, projectContext)
  const directories = [
    'docs/ae',
    'docs/ae/brainstorms',
    'docs/ae/plans',
    'docs/ae/reviews',
    'docs/ae/gates',
    'docs/ae/handoffs',
    'docs/ae/experience',
    'docs/ae/solutions',
    'docs/ae/archive',
    'docs/ai-memory',
    'docs/00-process',
    'docs/00-process/active',
    'docs/00-process/archive',
    'docs/00-process/templates',
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
    'docs/08-ai-memory',
    'docs/99-archive',
  ]
  const files = [
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
    ['docs/ai-memory/README.md', templates.memoryReadme],
  ]

  const createdDirectories = []
  const createdFiles = []
  const updatedFiles = []
  const skippedFiles = []

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
    if (force && isManagedFile(full)) {
      updatedFiles.push(path)
      if (!dryRun) writeFileSync(full, content, 'utf8')
    } else {
      skippedFiles.push(path)
    }
  }

  return {
    status: dryRun ? 'dry-run' : 'initialized',
    worktree,
    lang,
    force,
    created_directories: createdDirectories,
    created_files: createdFiles,
    updated_files: updatedFiles,
    skipped_files: skippedFiles,
    detected_context: projectContext,
    notes: [
      'Existing files are not overwritten unless --force is used and the file contains the AE init marker.',
      'Store AE workflow artifacts under docs/ae, process/archive docs under docs/00-process, and durable AI memory under docs/08-ai-memory.',
      'Read and write generated Markdown as UTF-8. On Windows, do not trust garbled console rendering until verified with explicit UTF-8 reads.',
    ],
  }
}

export function isManagedFile(path) {
  try {
    return readText(path).includes(generatedMarker)
  } catch {
    return false
  }
}

function initTemplates(lang, context) {
  if (lang === 'bilingual') {
    const en = loadLangTemplates('en', context)
    const zh = loadLangTemplates('zh-CN', context)
    return Object.fromEntries(templateKeys.map((key) => [key, `${zh[key]}\n\n---\n\n${en[key]}`]))
  }
  return loadLangTemplates(lang, context)
}

function loadLangTemplates(lang, context) {
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
  }
  return Object.fromEntries(templateKeys.map((key) => [key, renderTemplate(lang, key, replacements)]))
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
    for (const [name, command] of Object.entries(packageJson.scripts || {})) {
      scripts.push(`${name}: ${command}`)
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
