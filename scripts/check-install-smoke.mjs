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
  const staleSkillDirs = [
    'ae-officecli',
    'ae-docx',
    'ae-xlsx',
    'ae-pptx',
    'ae-computer-use-guard',
    'ae-video-edit-computer',
  ]
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
    'plugins/ai-agent-engine-codex/skills/ae-design/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-web-forge/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-backend/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-debug/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-tdd/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-claude-code/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-markitdown/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-static-server/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/SKILL.md',
    'plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs',
    'plugins/ai-agent-engine-codex/.codex-plugin/plugin.json',
    '.agents/skills/ae-prd/agents/openai.yaml',
    '.agents/skills/ae-work-report/agents/openai.yaml',
    '.agents/skills/ae-task-loop/agents/openai.yaml',
    '.agents/skills/ae-constitution/agents/openai.yaml',
    '.agents/skills/ae-tasks/agents/openai.yaml',
    '.agents/skills/ae-design/agents/openai.yaml',
    '.agents/skills/ae-web-app/agents/openai.yaml',
    '.agents/skills/ae-web-forge/agents/openai.yaml',
    '.agents/skills/ae-backend/agents/openai.yaml',
    '.agents/skills/ae-debug/agents/openai.yaml',
    '.agents/skills/ae-tdd/agents/openai.yaml',
    '.agents/skills/ae-claude-code/agents/openai.yaml',
    '.agents/skills/ae-markitdown/agents/openai.yaml',
    '.agents/skills/ae-static-server/agents/openai.yaml',
    '.agents/skills/ae-imagegen-prompt/agents/openai.yaml',
    'docs/ae/templates/ae-skill-profiles.example.yaml',
    'docs/ae/templates/constitution-template.md',
    'docs/ae/templates/requirements-quality-checklist.md',
    'scripts/ae-tools.mjs',
    'scripts/set-ae-language.mjs',
    'scripts/check-ae-artifacts.mjs',
    'scripts/check-design-contract.mjs',
  ]
  for (const relPath of expectedPaths) {
    const fullPath = resolve(targetRoot, relPath)
    if (!existsSync(fullPath)) throw new Error(`Missing installed path: ${relative(targetRoot, fullPath)}`)
  }
  const sourcePluginManifest = JSON.parse(readFileSync(resolve(repoRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json'), 'utf8'))
  const installedPluginManifest = JSON.parse(readFileSync(resolve(targetRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json'), 'utf8'))
  if (installedPluginManifest.version !== sourcePluginManifest.version) {
    throw new Error(`Installed plugin version mismatch: expected ${sourcePluginManifest.version}, got ${installedPluginManifest.version}`)
  }
  if (!existsSync(existingTemplatePath)) {
    throw new Error('Install removed a pre-existing user docs/ae/templates file')
  }
  for (const skillName of staleSkillDirs) {
    const staleSkillDir = resolve(targetRoot, '.agents', 'skills', skillName)
    if (existsSync(staleSkillDir)) {
      throw new Error(`Install left removed skill in target mirror: ${skillName}`)
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
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'design'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'web'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'forge'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'backend'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'debug'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'tdd'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'markitdown'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'static'], { cwd: targetRoot })
  const recoveryResult = JSON.parse(run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'recovery'], { cwd: targetRoot }).stdout)
  if (recoveryResult.exists !== true || recoveryResult.worktree !== targetRoot) {
    throw new Error('Installed recovery command did not inspect the target project root')
  }
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'claude'], { cwd: targetRoot })
  const artifactResult = JSON.parse(run(process.execPath, [resolve(targetRoot, 'scripts', 'check-ae-artifacts.mjs')], { cwd: targetRoot }).stdout)
  if (artifactResult.status !== 'ok' || artifactResult.targetRoot !== targetRoot) {
    throw new Error('Installed check-ae-artifacts command did not inspect the target project root')
  }
  const designContractResult = JSON.parse(run(process.execPath, [resolve(targetRoot, 'scripts', 'check-design-contract.mjs')], { cwd: targetRoot }).stdout)
  if (designContractResult.status !== 'ok' || designContractResult.checked !== 0) {
    throw new Error('Installed check-design-contract command did not return stable no-design JSON')
  }
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
    ['ae-design', 'AE 设计契约 / AE Design'],
    ['ae-web-forge', 'AE Web Forge'],
    ['ae-claude-code', 'AE Claude Code'],
    ['ae-markitdown', 'AE Markitdown'],
    ['ae-static-server', 'AE 静态服务器 / AE Static Server'],
    ['ae-imagegen-prompt', 'AE 图片生成提示词 / AE Imagegen Prompt'],
  ]
  for (const [skillName, expectedLabel] of expectedBilingualLabels) {
    const yaml = readFileSync(resolve(targetRoot, '.agents', 'skills', skillName, 'agents', 'openai.yaml'), 'utf8')
    if (!yaml.includes(expectedLabel)) {
      throw new Error(`Initial bilingual install did not preserve ${skillName} label`)
    }
  }

  const profileTemplate = readFileSync(resolve(targetRoot, 'docs', 'ae', 'templates', 'ae-skill-profiles.example.yaml'), 'utf8')
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


  run(process.execPath, [resolve(targetRoot, 'scripts', 'set-ae-language.mjs'), '--lang', 'en'], { cwd: targetRoot })
  const expectedEnglishLabels = [
    ['ae-prd', 'AE PRD'],
    ['ae-work-report', 'AE Work Report'],
    ['ae-task-loop', 'AE Task Loop'],
    ['ae-constitution', 'AE Constitution'],
    ['ae-tasks', 'AE Tasks'],
    ['ae-design', 'AE Design'],
    ['ae-web-app', 'AE Web App'],
    ['ae-web-forge', 'AE Web Forge'],
    ['ae-claude-code', 'AE Claude Code'],
    ['ae-markitdown', 'AE Markitdown'],
    ['ae-static-server', 'AE Static Server'],
    ['ae-imagegen-prompt', 'AE Imagegen Prompt'],
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
    ['ae-design', 'AE 设计契约'],
    ['ae-web-app', 'AE Web 应用开发'],
    ['ae-web-forge', 'AE Web Forge'],
    ['ae-claude-code', 'AE Claude Code'],
    ['ae-markitdown', 'AE Markitdown'],
    ['ae-static-server', 'AE 静态服务器'],
    ['ae-imagegen-prompt', 'AE 图片生成提示词'],
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
      'ae-design',
      'ae-web-app',
      'ae-web-forge',
      'ae-backend',
      'ae-debug',
      'ae-tdd',
      'ae-claude-code',
      'ae-markitdown',
      'ae-static-server',
      'ae-imagegen-prompt',
    ],
    verifiedLanguageModes: ['bilingual', 'en', 'zh-CN'],
    verifiedMultiAgentPolicy: 'multi_agent_auto_analysis_by_default',
    verifiedSkillGovernancePolicy: 'source_mirror_metadata_and_path_safety',
    verifiedPluginVersion: installedPluginManifest.version,
    verifiedCommands: ['recovery', 'claude-delegate', 'markitdown', 'static-server', 'check-ae-artifacts', 'check-design-contract'],
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
