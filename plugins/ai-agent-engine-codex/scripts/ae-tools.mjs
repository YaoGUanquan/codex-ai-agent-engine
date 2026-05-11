#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pluginRoot = resolve(__dirname, '..')
const catalogPath = join(pluginRoot, 'skills', 'ae-help', 'references', 'capability-catalog.json')
const textDecoder = new TextDecoder('utf-8')
const generatedMarker = '<!-- ae-codex:init managed -->'

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
      case 'init':
        printJson(initProject(process.cwd(), args))
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
        throw new Error(`Unknown command: ${command}\nAvailable: help, init, recovery, task-analyze, gate, swagger`)
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
  const commands = (catalog.commands || []).filter((command) => {
    if (!q) return true
    return [command.name, command.purpose, command.script].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  const lines = []
  lines.push('# AI Agent Engine for Codex')
  lines.push('')
  lines.push(`来源参考: ${catalog.source.name} (${catalog.source.observedCommit.slice(0, 7)})`)
  lines.push(`运行边界: ${catalog.codexPort.runtimeBoundary}`)
  if (skills.length > 0) {
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
  }
  if (skills.length === 0 && commands.length === 0) {
    lines.push(`没有匹配的 AE 能力: ${query}`)
  }
  lines.push('')
  lines.push('## 产物路径')
  for (const [key, value] of Object.entries(catalog.artifactPaths)) {
    lines.push(`- ${key}: ${value}`)
  }
  if (commands.length > 0) {
    lines.push('')
    lines.push('## CLI Commands')
    for (const command of commands) {
      lines.push(`- ${command.name}`)
      lines.push(`  Purpose: ${command.purpose}`)
      if (command.script) lines.push(`  Script: ${command.script}`)
    }
  }
  lines.push('')
  lines.push('## 说明')
  for (const item of catalog.notes || []) {
    lines.push(`- ${item}`)
  }
  console.log(lines.join('\n'))
}

function initProject(worktree, args) {
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

function initTemplates(lang, context) {
  if (lang === 'zh-CN') return zhInitTemplates(context)
  if (lang === 'bilingual') return bilingualInitTemplates(context)
  return enInitTemplates(context)
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

function enInitTemplates(context) {
  return {
    agents: `${generatedMarker}
# AGENTS.md

## Project Profile

- Project: ${context.name}
${context.description ? `- Description: ${context.description}\n` : ''}- Detected signals:
${formatList(context.indicators)}
- Important paths:
${formatList(context.importantPaths)}

## Project Rules

- Read existing documentation before changing behavior.
- Keep changes scoped to the requested task.
- Prefer the project's existing patterns over new abstractions.
- Do not overwrite user work or revert unrelated changes.
- Record AE workflow artifacts under \`docs/ae\`.
- Record active process notes under \`docs/00-process/active\`.
- Archive completed process notes under \`docs/00-process/archive/YYYY-MM/<task-name>\` or \`docs/99-archive/YYYY-MM/<topic>\`.
- Record durable AI memory under \`docs/08-ai-memory\`.

## Encoding Rules

- Read and write text files as UTF-8, preferably UTF-8 without BOM.
- When Chinese text appears garbled in PowerShell or terminal output, verify with explicit UTF-8 reads before changing content.
- Do not rewrite a file only to fix console display unless the underlying bytes are confirmed wrong.

## Validation

- Run the narrowest relevant validation before delivery.
- If validation cannot be run, state the reason and remaining risk.
`,
    aeReadme: `${generatedMarker}
# AE Workflow Artifacts

This directory stores process artifacts created while using AI Agent Engine for Codex.

## Directory Map

- \`brainstorms/\`: requirement clarification and acceptance notes.
- \`plans/\`: implementation plans.
- \`reviews/\`: code or document review reports.
- \`gates/\`: validation and delivery gate evidence.
- \`handoffs/\`: next-session handoff notes.
- \`experience/\`: reusable implementation experience.
- \`solutions/\`: solution comparisons and selected approaches.
- \`archive/\`: completed or superseded process records.

## Relationship to Project Docs

- Use \`docs/ae\` for AE workflow artifacts and compatibility with AE skills.
- Use \`docs/00-process\` for active execution notes and archive rules.
- Use \`docs/08-ai-memory\` for durable cross-session project memory.
`,
    memoryReadme: `${generatedMarker}
# AI Memory Compatibility Note

The canonical durable AI memory location is \`docs/08-ai-memory\`.

This directory is kept as a compatibility pointer for earlier AE init versions. Write new durable memory to \`docs/08-ai-memory\` unless this project explicitly chooses another path.
`,
    processReadme: `${generatedMarker}
# Process Documents

Use this area for task execution notes that need resume, verification, or later archive.

## Directories

- \`active/\`: in-progress execution plans and process notes.
- \`templates/\`: reusable process templates and archive rules.
- \`archive/YYYY-MM/<task-name>/\`: completed task archive.

Create active process notes for code changes, SQL/data operations, interface integration, batch file moves, cross-module design, and AI memory updates. Simple read-only answers do not require a process note.
`,
    archiveRules: `${generatedMarker}
# Archive Rules

## Archive Triggers

- The active process note status is \`done\`.
- Relevant validation has run or the remaining risk is explicitly documented.
- Any durable memory updates have been checked against \`docs/08-ai-memory/00-index.md\`.

## Archive Locations

- Process archive: \`docs/00-process/archive/YYYY-MM/<task-name>/\`
- Topic archive: \`docs/99-archive/YYYY-MM/<topic-or-ticket>/\`
- AE compatibility archive: \`docs/ae/archive/\` may point to the process archive when AE artifacts are involved.

## Archive Contents

- Active process note or plan.
- Related analysis, design, API, SQL, report, test data, and validation records.
- A short summary of key commands, SQL, and user-provided outputs when relevant.

## After Archive

- Update the active note with the archive path before moving it, or leave a small index if the project wants one.
- Update \`docs/08-ai-memory\` only with stable reusable knowledge, not raw task logs.
`,
    syncPlanTemplate: `${generatedMarker}
# Sync Execution Plan

## Basic Info

- Plan Name:
- Topic/Issue:
- Created At:
- Owner:
- Status: \`in_progress\` / \`blocked\` / \`done\`

## Goal and Scope

- Goal:
- Scope:
- Non-goals:

## Steps

| Step | Content | Owner | Validation Command/SQL | Result Summary | Status | User Confirmation |
|---|---|---|---|---|---|---|
| 1 |  | Agent/User |  |  | todo | pending |
| 2 |  | Agent/User |  |  | todo | pending |

## Command and SQL Feedback

- Command outputs:
- SQL outputs:
- Exceptions and handling:

## Resume State

- Completed:
- In progress:
- Next step:
- Required input:

## Archive

- Archive time:
- Archive path: \`docs/00-process/archive/YYYY-MM/<plan-name>/\`
- Archived files:
`,
    encodingRules: `${generatedMarker}
# Encoding Rules

## Required Encoding

- Use UTF-8 for Markdown, JSON, YAML, SQL, scripts, and generated text files.
- Prefer UTF-8 without BOM unless a target tool requires BOM.
- Keep Chinese content in files only after verifying the underlying bytes are UTF-8.

## Windows and PowerShell Notes

- PowerShell console rendering can make valid UTF-8 Chinese text look garbled.
- For verification, use explicit UTF-8 reads, for example:

\`\`\`powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Get-Content -Path .\\AGENTS.md -Encoding utf8 -Raw
\`\`\`

- Do not trust a garbled terminal preview alone. Check file bytes, Git diff, or explicit UTF-8 output before editing.
`,
    memoryIndex: `${generatedMarker}
# AI Memory Index

## Purpose

- This is the canonical durable AI memory for the project.
- Store only stable, reusable, cross-session knowledge.
- Do not store one-off debug logs, transient command output, or unconfirmed guesses.

## Navigation

- \`01-project-context.md\`: project purpose, stack, paths, and local constraints.
- \`02-architecture-boundaries.md\`: module and responsibility boundaries.
- \`03-key-workflows.md\`: recurring workflows.
- \`04-known-pitfalls.md\`: known pitfalls and encoding issues.
- \`05-decision-log.md\`: durable decisions.
- \`06-agent-maintenance-rules.md\`: rules for reading and updating memory.
- \`99-prompt-template.md\`: reusable prompt for initializing or maintaining memory.

## Maintenance Rule

Start by reading this index, then read only the relevant topic files. At task close, decide whether new stable knowledge should be added. If not, say no memory update was needed.
`,
    memoryProjectContext: `${generatedMarker}
# Project Context

## Project

- Name: ${context.name}
${context.description ? `- Description: ${context.description}\n` : ''}
## Detected Signals

${formatList(context.indicators)}

## Important Paths

${formatList(context.importantPaths)}

## Useful Scripts

${formatList(context.scripts)}
`,
    memoryArchitecture: `${generatedMarker}
# Architecture Boundaries

Record stable module boundaries, ownership, runtime boundaries, and integration points here.
`,
    memoryKeyWorkflows: `${generatedMarker}
# Key Workflows

Record stable workflows that should be reused across tasks.

## Template

- Workflow:
- When to use:
- Steps:
- Validation:
- Known risks:
`,
    memoryKnownPitfalls: `${generatedMarker}
# Known Pitfalls

## Encoding

- Chinese text may look garbled in Windows/PowerShell output even when the file is valid UTF-8.
- Verify with explicit UTF-8 reads before editing generated Markdown.
`,
    memoryDecisionLog: `${generatedMarker}
# Decision Log

Record durable decisions here.

## Template

- Date:
- Decision:
- Context:
- Consequence:
- Revisit when:
`,
    memoryMaintenanceRules: `${generatedMarker}
# AI Memory Maintenance Rules

## Read Rules

- Read \`00-index.md\` first.
- Then read only topic files related to the current task.
- Avoid full memory scans unless the task is broad or ambiguous.

## Update Rules

- Write only stable, long-lived, reusable knowledge.
- Prefer updating existing topic files over creating new ones.
- Do not write one-off logs, raw command output, or unverified guesses.

## Task Close Rule

- At task close, decide whether new durable knowledge was created.
- If yes, update the smallest relevant memory file and mention it in the final response.
- If no, state that no AI memory update was needed.
`,
    memoryPromptTemplate: `${generatedMarker}
# Prompt Template

Use this when asking an agent to maintain project memory:

\`\`\`text
Read docs/08-ai-memory/00-index.md first, then only the relevant topic files. Complete the task with the smallest safe change. At the end, decide whether new stable project knowledge should be written back to docs/08-ai-memory. Do not record one-off logs or unconfirmed guesses.
\`\`\`
`,
  }
}

function zhInitTemplates(context) {
  return {
    agents: `${generatedMarker}
# AGENTS.md

## 项目画像

- 项目：${context.name}
${context.description ? `- 描述：${context.description}\n` : ''}- 检测信号：
${formatList(context.indicators, '待补充')}
- 重要路径：
${formatList(context.importantPaths, '待补充')}

## 项目规则

- 修改行为前先阅读已有文档。
- 变更范围保持在当前任务内。
- 优先沿用项目已有模式，不轻易新增抽象。
- 不覆盖用户已有工作，不回退无关变更。
- AE 工作流产物记录在 \`docs/ae\`。
- 执行中的过程记录放在 \`docs/00-process/active\`。
- 已完成的过程记录归档到 \`docs/00-process/archive/YYYY-MM/<task-name>\` 或 \`docs/99-archive/YYYY-MM/<topic>\`。
- 长期 AI 记忆记录在 \`docs/08-ai-memory\`。

## 中文与编码规则

- 文档、JSON、YAML、SQL、脚本和生成文本统一使用 UTF-8，优先 UTF-8 无 BOM。
- PowerShell 或终端输出中文乱码时，先用显式 UTF-8 读取验证，不要直接改写文件。
- 不要仅因控制台显示乱码就重写文件，必须先确认文件字节本身确实错误。

## 验证

- 交付前运行最小且相关的验证命令。
- 如果无法验证，说明原因和剩余风险。
`,
    aeReadme: `${generatedMarker}
# AE 工作流产物

这里存放使用 AI Agent Engine for Codex 时产生的过程文档。

## 目录说明

- \`brainstorms/\`：需求澄清和验收标准。
- \`plans/\`：实现计划。
- \`reviews/\`：代码或文档审查报告。
- \`gates/\`：验证和交付门禁证据。
- \`handoffs/\`：下次继续工作的交接说明。
- \`experience/\`：可复用的实现经验。
- \`solutions/\`：方案比较和选型记录。
- \`archive/\`：已完成或已废弃的过程记录。

## 与项目文档的关系

- \`docs/ae\` 保留为 AE 技能兼容的工作流产物目录。
- \`docs/00-process\` 记录执行中的方案、归档规则和可续跑状态。
- \`docs/08-ai-memory\` 记录跨会话复用的长期项目记忆。
`,
    memoryReadme: `${generatedMarker}
# AI 记忆兼容说明

当前项目长期 AI 记忆的标准目录是 \`docs/08-ai-memory\`。

本目录仅作为早期 AE init 版本的兼容入口。新的长期记忆应写入 \`docs/08-ai-memory\`，除非项目明确另行约定。
`,
    processReadme: `${generatedMarker}
# 过程文档

这里存放需要断点续跑、验证回传或后续归档的任务过程文档。

## 目录说明

- \`active/\`：执行中的同步方案和过程记录。
- \`templates/\`：过程模板、归档规则和编码规则。
- \`archive/YYYY-MM/<task-name>/\`：已完成任务归档。

涉及代码修改、SQL/数据操作、接口联调、批量文件移动、跨模块设计、长期 AI 记忆更新时，应创建过程记录。简单只读问答不强制创建。
`,
    archiveRules: `${generatedMarker}
# 文档归档规则

## 归档触发条件

- 执行中的过程记录状态为 \`done\`。
- 相关验证已经执行，或剩余风险已明确记录。
- 如产生长期知识，已对照 \`docs/08-ai-memory/00-index.md\` 完成最小必要更新。

## 归档目录

- 过程归档：\`docs/00-process/archive/YYYY-MM/<task-name>/\`
- 专题归档：\`docs/99-archive/YYYY-MM/<topic-or-ticket>/\`
- AE 兼容归档：如涉及 AE 产物，\`docs/ae/archive/\` 可保留指向过程归档的说明。

## 归档内容

- 执行中的过程记录或计划文件。
- 关联分析、设计、API、SQL、报告、测试数据和验证记录。
- 必要时记录关键命令、SQL 和用户回传输出的摘要。

## 归档后动作

- 移动前在过程记录中写明归档路径，或按项目需要保留简短索引。
- 只把稳定、可复用、长期有效的结论写入 \`docs/08-ai-memory\`，不要把原始过程日志写入记忆库。
`,
    syncPlanTemplate: `${generatedMarker}
# 同步执行方案

## 基本信息

- 计划名称：
- 主题/问题编号：
- 创建时间：
- 负责人：
- 当前状态：\`in_progress\` / \`blocked\` / \`done\`

## 目标与范围

- 目标：
- 范围：
- 非目标：

## 执行步骤

| 步骤 | 内容 | 执行人 | 验证命令/SQL | 结果摘要 | 状态 | 用户确认 |
|---|---|---|---|---|---|---|
| 1 |  | Agent/User |  |  | todo | pending |
| 2 |  | Agent/User |  |  | todo | pending |

## 命令与 SQL 回传记录

- 命令执行输出：
- SQL 执行输出：
- 异常与处理：

## 断点续跑信息

- 已完成步骤：
- 进行中步骤：
- 下一步：
- 继续执行所需输入：

## 完成归档动作

- 归档时间：
- 归档路径：\`docs/00-process/archive/YYYY-MM/<plan-name>/\`
- 归档文件清单：
`,
    encodingRules: `${generatedMarker}
# 中文与编码规则

## 统一编码

- Markdown、JSON、YAML、SQL、脚本和生成文本统一使用 UTF-8。
- 优先使用 UTF-8 无 BOM，除非目标工具明确要求 BOM。
- 写入中文内容后，应通过显式 UTF-8 读取或 Git diff 验证。

## Windows 与 PowerShell 注意事项

- PowerShell 控制台可能把合法 UTF-8 中文显示成乱码。
- 验证文件内容时可使用：

\`\`\`powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Get-Content -Path .\\AGENTS.md -Encoding utf8 -Raw
\`\`\`

- 不要只凭乱码预览判断文件损坏；先检查显式 UTF-8 输出、Git diff 或文件字节。
`,
    memoryIndex: `${generatedMarker}
# AI 记忆索引

## 目的

- 这里是当前项目的标准长期 AI 记忆库。
- 只沉淀稳定、可复用、跨会话仍有价值的知识。
- 不记录一次性调试日志、临时命令输出或未确认猜测。

## 文件导航

- \`01-project-context.md\`：项目定位、技术栈、路径和本地约束。
- \`02-architecture-boundaries.md\`：模块边界、职责边界和集成点。
- \`03-key-workflows.md\`：长期复用的关键流程。
- \`04-known-pitfalls.md\`：历史坑点、易混淆边界和编码问题。
- \`05-decision-log.md\`：长期有效的决策。
- \`06-agent-maintenance-rules.md\`：AI 读取和更新记忆的规则。
- \`99-prompt-template.md\`：初始化或维护记忆库的提示词模板。

## 维护规则

开始任务时先读本索引，再按主题读取相关文件。任务结束时判断是否产生新的稳定知识；没有则说明本次无需更新 AI 记忆库。
`,
    memoryProjectContext: `${generatedMarker}
# 项目上下文

## 项目

- 名称：${context.name}
${context.description ? `- 描述：${context.description}\n` : ''}
## 检测信号

${formatList(context.indicators, '待补充')}

## 重要路径

${formatList(context.importantPaths, '待补充')}

## 可用脚本

${formatList(context.scripts, '待补充')}
`,
    memoryArchitecture: `${generatedMarker}
# 架构边界

记录长期稳定的模块边界、职责边界、运行边界和集成点。
`,
    memoryKeyWorkflows: `${generatedMarker}
# 关键工作流

记录需要跨任务复用的稳定流程。

## 模板

- 工作流：
- 使用场景：
- 步骤：
- 验证：
- 已知风险：
`,
    memoryKnownPitfalls: `${generatedMarker}
# 已知坑点

## 中文与编码

- Windows/PowerShell 输出可能把合法 UTF-8 中文显示成乱码。
- 修改生成的 Markdown 前，先用显式 UTF-8 读取验证。
`,
    memoryDecisionLog: `${generatedMarker}
# 决策记录

这里记录长期有效的项目决策。

## 模板

- 日期：
- 决策：
- 背景：
- 影响：
- 何时重新评估：
`,
    memoryMaintenanceRules: `${generatedMarker}
# AI 记忆维护规则

## 读取规则

- 优先读取 \`00-index.md\`。
- 再按任务主题读取必要文件。
- 避免默认全量扫描，除非任务本身很宽或上下文不清。

## 更新规则

- 只写入稳定、长期有效、可复用的信息。
- 优先更新现有主题文件，主题明显独立时再新建文件。
- 不写入一次性日志、原始命令输出或未确认猜测。

## 任务结束规则

- 每次任务完成后判断是否形成新的稳定知识。
- 若有，更新最相关的最小记忆文件，并在最终说明中列出。
- 若没有，明确说明本次无需更新 AI 记忆库。
`,
    memoryPromptTemplate: `${generatedMarker}
# 提示词模板

要求 agent 维护项目记忆时可使用：

\`\`\`text
先读取 docs/08-ai-memory/00-index.md，再只读取与当前任务相关的专题文件。用最小安全改动完成任务。结束时判断是否需要把新的稳定项目知识写回 docs/08-ai-memory。不要记录一次性日志、原始命令输出或未确认猜测。
\`\`\`
`,
  }
}

function bilingualInitTemplates(context) {
  const en = enInitTemplates(context)
  const zh = zhInitTemplates(context)
  return Object.fromEntries(Object.keys(en).map((key) => [key, `${zh[key]}\n\n---\n\n${en[key]}`]))
}

function isManagedFile(path) {
  try {
    return readText(path).includes(generatedMarker)
  } catch {
    return false
  }
}

function recovery(worktree) {
  const docsAe = join(worktree, 'docs', 'ae')
  const docsProcess = join(worktree, 'docs', '00-process')
  const result = {
    worktree,
    exists: existsSync(docsAe) || existsSync(docsProcess),
    candidates: [],
    recommendation: 'no_artifacts_found',
  }
  const specs = [
    ['requirements', join(docsAe, 'brainstorms'), /requirements\.md$/],
    ['plan', join(docsAe, 'plans'), /plan\.md$/],
    ['review', join(docsAe, 'reviews'), /.*/],
    ['gate', join(docsAe, 'gates'), /\.json$/],
    ['handoff', join(docsAe, 'handoffs'), /\.md$/],
    ['process-note', join(docsProcess, 'active'), /\.md$/],
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
    result.recommendation = latest.type === 'process-note'
      ? 'resume_with_process_note'
      : latest.type === 'plan'
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
