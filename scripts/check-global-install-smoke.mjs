#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const installer = resolve(repoRoot, 'scripts', 'install-global.mjs')
if (!existsSync(installer)) fail(`global installer not found: ${installer}`)
const result = spawnSync(process.execPath, [installer, 'preview'], { cwd: repoRoot, encoding: 'utf8' })
if (result.status !== 0) fail(result.stderr || 'global preview failed')
const preview = JSON.parse(result.stdout)
if (preview.status !== 'preview') fail('global preview did not return preview status')
if (resolve(preview.homeRoot) !== resolve(homedir())) fail('global preview escaped the current user home')
if (resolve(preview.personalPluginRoot) !== resolve(homedir(), 'plugins', 'ai-agent-engine-codex')) fail('global preview did not expose the personal plugin source root')
if (resolve(preview.personalMarketplace) !== resolve(homedir(), '.agents', 'plugins', 'marketplace.json')) fail('global preview did not expose the personal marketplace path')
if (resolve(preview.cursorSkillsRoot) !== resolve(homedir(), '.cursor', 'skills')) fail('global preview did not expose the Cursor user skill root')
if (!Array.isArray(preview.cursorSkills) || preview.cursorSkills.length === 0) fail('global preview did not classify Cursor skills')
if (!Array.isArray(preview.projects) || preview.projects.some((project) => project.role === 'consumer')) fail('default global preview must not infer consumer projects')
if (preview.projects.filter((project) => project.role === 'distribution-source').length !== 1) fail('global preview did not retain the source exclusion')
console.log(JSON.stringify({ status: 'ok', checked: ['preview', 'current-user-home', 'personal-plugin-paths', 'cursor-skill-paths', 'explicit-manifest-required', 'source-exclusion'] }, null, 2))

function fail(message) {
  console.error(message)
  process.exit(1)
}
