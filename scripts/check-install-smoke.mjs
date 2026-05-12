#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
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
  run(process.execPath, [resolve(repoRoot, 'scripts', 'install-project.mjs'), '--target', targetRoot, '--lang', 'bilingual'])

  const expectedPaths = [
    'plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-backend/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-debug/SKILL.md',
    'plugins/ai-agent-engine-codex/skills/ae-tdd/SKILL.md',
    '.agents/skills/ae-web-app/agents/openai.yaml',
    '.agents/skills/ae-backend/agents/openai.yaml',
    '.agents/skills/ae-debug/agents/openai.yaml',
    '.agents/skills/ae-tdd/agents/openai.yaml',
    'scripts/ae-tools.mjs',
    'scripts/set-ae-language.mjs',
  ]
  for (const relPath of expectedPaths) {
    const fullPath = resolve(targetRoot, relPath)
    if (!existsSync(fullPath)) throw new Error(`Missing installed path: ${relative(targetRoot, fullPath)}`)
  }

  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'web'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'backend'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'debug'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'ae-tools.mjs'), 'help', 'tdd'], { cwd: targetRoot })
  run(process.execPath, [resolve(targetRoot, 'scripts', 'set-ae-language.mjs'), '--lang', 'en'], { cwd: targetRoot })

  const webAppYaml = readFileSync(resolve(targetRoot, '.agents', 'skills', 'ae-web-app', 'agents', 'openai.yaml'), 'utf8')
  if (!webAppYaml.includes('AE Web App')) {
    throw new Error('Installed language switch did not update ae-web-app metadata to English')
  }

  console.log(JSON.stringify({
    status: 'ok',
    targetRoot: relative(repoRoot, targetRoot),
    verifiedSkills: ['ae-web-app', 'ae-backend', 'ae-debug', 'ae-tdd'],
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
