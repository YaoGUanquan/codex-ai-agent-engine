#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const targetRoot = resolve(repoRoot, '.tmp-install-smoke-checks', randomUUID())

ensureInsideRepo(targetRoot)
cleanupTarget()
mkdirSync(targetRoot, { recursive: true })

try {
  const existingTemplateDir = resolve(targetRoot, 'docs', 'ae', 'templates')
  const existingTemplatePath = resolve(existingTemplateDir, 'user-template.md')
  mkdirSync(existingTemplateDir, { recursive: true })
  writeFileSync(existingTemplatePath, 'user-owned template\n', 'utf8')
  const staleSkillDirs = ['ae-officecli', 'ae-docx', 'ae-xlsx', 'ae-pptx']
  for (const skillName of staleSkillDirs) {
    const staleSkillDir = resolve(targetRoot, '.agents', 'skills', skillName)
    mkdirSync(staleSkillDir, { recursive: true })
    writeFileSync(resolve(staleSkillDir, 'SKILL.md'), `# stale ${skillName}\n`, 'utf8')
  }
  const staleScriptPaths = [
    resolve(targetRoot, 'scripts', 'check-officecli-available.mjs'),
    resolve(targetRoot, 'scripts', 'check-officecli-smoke.mjs'),
  ]
  for (const staleScriptPath of staleScriptPaths) {
    mkdirSync(resolve(staleScriptPath, '..'), { recursive: true })
    writeFileSync(staleScriptPath, '// stale officecli script\n', 'utf8')
  }

  run(process.execPath, [resolve(repoRoot, 'scripts', 'install-project.mjs'), '--target', targetRoot])

  const expectedPaths = [
    'plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-work-report/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-task-loop/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-constitution/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-tasks/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-backend/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-debug/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-tdd/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-computer-use-guard/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-video-edit-computer/SKILL.md',
    '.agents/skills/ae-prd/agents/openai.yaml',
    '.agents/skills/ae-work-report/agents/openai.yaml',
    '.agents/skills/ae-task-loop/agents/openai.yaml',
    '.agents/skills/ae-constitution/agents/openai.yaml',
    '.agents/skills/ae-tasks/agents/openai.yaml',
    '.agents/skills/ae-web-app/agents/openai.yaml',
    '.agents/skills/ae-backend/agents/openai.yaml',
    '.agents/skills/ae-debug/agents/openai.yaml',
    '.agents/skills/ae-tdd/agents/openai.yaml',
    '.agents/skills/ae-claude-code/agents/openai.yaml',
    '.agents/skills/ae-computer-use-guard/agents/openai.yaml',
    '.agents/skills/ae-imagegen-prompt/agents/openai.yaml',
    '.agents/skills/ae-video-edit-computer/agents/openai.yaml',
    'docs/ae/templates/ae-skill-profiles.example.yaml',
    'docs/ae/templates/constitution-template.md',
    'docs/ae/templates/requirements-quality-checklist.md',
    'docs/ae/templates/computer-use-hooks/README.md',
    'docs/ae/templates/computer-use-hooks/hooks.example.json',
    'docs/ae/templates/computer-use-hooks/pre-tool-use-computer-budget.example.py',
    'scripts/ae-tools.mjs',
    'scripts/set-ae-language.mjs',
  ]
  for (const relPath of expectedPaths) {
    const fullPath = resolve(targetRoot, relPath)
    if (!existsSync(fullPath)) throw new Error(`Missing installed path: ${relative(targetRoot, fullPath)}`)
  }
  if (!existsSync(existingTemplatePath)) {
    throw new Error('Install removed a pre-existing user docs/ae/templates file')
  }
  for (const skillName of staleSkillDirs) {
    const staleSkillDir = resolve(targetRoot, '.agents', 'skills', skillName)
    if (existsSync(staleSkillDir)) {
      throw new Error(`Install left removed OfficeCLI skill in target mirror: ${skillName}`)
    }
  }
  for (const staleScriptPath of staleScriptPaths) {
    if (existsSync(staleScriptPath)) {
      throw new Error(`Install left removed OfficeCLI script in target project: ${relative(targetRoot, staleScriptPath)}`)
    }
  }

  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'prd'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'report'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'loop'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'constitution'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'tasks'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'web'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'backend'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'debug'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'tdd'], { cwd: targetRoot })
  const recoveryResult = JSON.parse(run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'recovery'], { cwd: targetRoot }).stdout)
  if (recoveryResult.exists !== true || recoveryResult.worktree !== targetRoot) {
    throw new Error('Installed recovery command did not inspect the target project root')
  }
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'claude'], { cwd: targetRoot })
  const claudeCheckResult = JSON.parse(run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'claude-delegate', '--check'], { cwd: targetRoot }).stdout)
  if (!['ok', 'skip'].includes(claudeCheckResult.status) || typeof claudeCheckResult.available !== 'boolean') {
    throw new Error('Installed claude-delegate check did not return stable availability JSON')
  }
  const expectedBilingualLabels = [
    ['ae-prd', 'AE PRD'],
    ['ae-work-report', 'AE Work Report'],
    ['ae-task-loop', 'AE Task Loop'],
    ['ae-constitution', 'AE Constitution'],
    ['ae-tasks', 'AE Tasks'],
    ['ae-claude-code', 'AE Claude Code'],
    ['ae-computer-use-guard', 'AE 电脑控制约束 / AE Computer Use Guard'],
    ['ae-imagegen-prompt', 'AE 图片生成提示词 / AE Imagegen Prompt'],
    ['ae-video-edit-computer', 'AE 电脑剪辑视频 / AE Video Edit Computer'],
  ]
  for (const [skillName, expectedLabel] of expectedBilingualLabels) {
    const yaml = readFileSync(resolve(targetRoot, '.agents', 'skills', skillName, 'agents', 'openai.yaml'), 'utf8')
    if (!yaml.includes(expectedLabel)) {
      throw new Error(`Initial bilingual install did not preserve ${skillName} label`)
    }
  }

  const profileTemplate = readFileSync(resolve(targetRoot, 'docs', 'ae', 'templates', 'ae-skill-profiles.example.yaml'), 'utf8')
  if (!profileTemplate.includes('server_profile: low_resource')) {
    throw new Error('Installed profile template does not default to low_resource')
  }
  if (!profileTemplate.includes('2G/4-core relay')) {
    throw new Error('Installed profile template does not explain the 2G/4-core relay default')
  }
  if (!profileTemplate.includes('hook_guard:')) {
    throw new Error('Installed profile template does not include hook_guard defaults')
  }
  if (!profileTemplate.includes('deny_computer_use_when_missing: true')) {
    throw new Error('Installed profile template does not block Computer Use when hooks are missing')
  }
  if (!profileTemplate.includes('local_tool_guard:')) {
    throw new Error('Installed profile template does not include local_tool_guard defaults')
  }
  if (!profileTemplate.includes('ffmpeg') || !profileTemplate.includes('ffprobe')) {
    throw new Error('Installed profile template does not list ffmpeg/ffprobe local tool defaults')
  }
  if (!profileTemplate.includes('multi_agent:')) {
    throw new Error('Installed profile template does not include multi_agent defaults')
  }
  if (!profileTemplate.includes('enabled: auto # auto analyzes safe parallelism')) {
    throw new Error('Installed profile template does not set multi_agent to auto analysis by default')
  }
  if (!profileTemplate.includes('max_workers: 3')) {
    throw new Error('Installed profile template does not document multi_agent max_workers default')
  }
  if (!profileTemplate.includes('skill_governance:')) {
    throw new Error('Installed profile template does not include skill governance defaults')
  }
  if (!profileTemplate.includes('forbid_path_traversal: true')) {
    throw new Error('Installed profile template does not include path traversal governance defaults')
  }

  const hooksReadme = readFileSync(resolve(targetRoot, 'docs', 'ae', 'templates', 'computer-use-hooks', 'README.md'), 'utf8')
  if (!hooksReadme.includes('Computer Use') || !hooksReadme.includes('ffmpeg')) {
    throw new Error('Installed hooks README does not explain Computer Use and local media tool policy')
  }
  const hooksJson = JSON.parse(readFileSync(resolve(targetRoot, 'docs', 'ae', 'templates', 'computer-use-hooks', 'hooks.example.json'), 'utf8'))
  if (hooksJson.policy?.computer_use_requires_hooks !== true) {
    throw new Error('Installed hooks example does not require hooks for Computer Use')
  }
  if (hooksJson.policy?.deny_computer_use_when_missing !== true) {
    throw new Error('Installed hooks example does not deny Computer Use when hooks are missing')
  }

  run(process.execPath, [resolve(targetRoot, 'scripts', 'set-ae-language.mjs'), '--lang', 'en'], { cwd: targetRoot })
  const expectedEnglishLabels = [
    ['ae-prd', 'AE PRD'],
    ['ae-work-report', 'AE Work Report'],
    ['ae-task-loop', 'AE Task Loop'],
    ['ae-constitution', 'AE Constitution'],
    ['ae-tasks', 'AE Tasks'],
    ['ae-web-app', 'AE Web App'],
    ['ae-claude-code', 'AE Claude Code'],
    ['ae-computer-use-guard', 'AE Computer Use Guard'],
    ['ae-imagegen-prompt', 'AE Imagegen Prompt'],
    ['ae-video-edit-computer', 'AE Video Edit Computer'],
  ]
  for (const [skillName, expectedLabel] of expectedEnglishLabels) {
    const yaml = readFileSync(resolve(targetRoot, '.agents', 'skills', skillName, 'agents', 'openai.yaml'), 'utf8')
    if (!yaml.includes(expectedLabel)) {
      throw new Error(`Installed language switch did not update ${skillName} metadata to English`)
    }
  }

  run(process.execPath, [resolve(targetRoot, 'scripts', 'set-ae-language.mjs'), '--lang', 'zh-CN'], { cwd: targetRoot })
  const expectedChineseLabels = [
    ['ae-prd', 'AE PRD'],
    ['ae-work-report', 'AE 工作总结'],
    ['ae-task-loop', 'AE 任务循环'],
    ['ae-constitution', 'AE Constitution'],
    ['ae-tasks', 'AE Tasks'],
    ['ae-web-app', 'AE Web 应用开发'],
    ['ae-claude-code', 'AE Claude Code'],
    ['ae-computer-use-guard', 'AE 电脑控制约束'],
    ['ae-imagegen-prompt', 'AE 图片生成提示词'],
    ['ae-video-edit-computer', 'AE 电脑剪辑视频'],
  ]
  for (const [skillName, expectedLabel] of expectedChineseLabels) {
    const yaml = readFileSync(resolve(targetRoot, '.agents', 'skills', skillName, 'agents', 'openai.yaml'), 'utf8')
    if (!yaml.includes(expectedLabel)) {
      throw new Error(`Installed language switch did not update ${skillName} metadata to zh-CN`)
    }
  }

  console.log(JSON.stringify({
    status: 'ok',
    targetRoot: relative(repoRoot, targetRoot),
    verifiedSkills: [
      'ae-prd',
      'ae-work-report',
      'ae-task-loop',
      'ae-constitution',
      'ae-tasks',
      'ae-web-app',
      'ae-backend',
      'ae-debug',
      'ae-tdd',
      'ae-claude-code',
      'ae-computer-use-guard',
      'ae-imagegen-prompt',
      'ae-video-edit-computer',
    ],
    verifiedLanguageModes: ['bilingual', 'en', 'zh-CN'],
    verifiedDefaultProfile: 'beginner+low_resource_2g4core_relay',
    verifiedHookPolicy: 'computer_use_requires_hooks',
    verifiedLocalToolPolicy: 'video_requires_ffmpeg_ffprobe_checks',
    verifiedMultiAgentPolicy: 'multi_agent_auto_analysis_by_default',
    verifiedSkillGovernancePolicy: 'source_mirror_metadata_and_path_safety',
    verifiedCommands: ['recovery', 'claude-delegate'],
  }, null, 2))
} finally {
  cleanupTarget()
}

function cleanupTarget() {
  if (!existsSync(targetRoot)) return
  ensureInsideRepo(targetRoot)
  rmSync(targetRoot, { recursive: true, force: true })
}

function ensureInsideRepo(path) {
  const relativePath = relative(repoRoot, path)
  if (relativePath.startsWith('..') || relativePath === '') {
    throw new Error(`Refusing to operate outside repo root: ${path}`)
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })
  if (result.status === 0) return result
  throw new Error([
    `Command failed: ${command} ${args.join(' ')}`,
    result.stdout?.trim() || '',
    result.stderr?.trim() || '',
  ].filter(Boolean).join('\n'))
}
