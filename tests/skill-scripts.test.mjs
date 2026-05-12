import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderYaml, skillMetadata } from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

test('renderYaml emits Chinese metadata for ae-web-app', () => {
  const yaml = renderYaml(skillMetadata['ae-web-app'], 'zh-CN')
  assert.match(yaml, /display_name: "AE Web 应用开发"/)
  assert.match(yaml, /short_description: "基于现有仓库技术栈构建或扩展 Web 应用"/)
  assert.match(yaml, /default_prompt: "使用 \$ae-web-app 实现这个 Web 应用流程。"/)
})

test('renderYaml emits bilingual metadata for ae-help', () => {
  const yaml = renderYaml(skillMetadata['ae-help'], 'bilingual')
  assert.match(yaml, /display_name: "AE 帮助 \/ AE Help"/)
  assert.match(yaml, /short_description: "查看 Codex 中可用的 AE 工作流能力 \/ List AE workflow capabilities for Codex"/)
})

test('check-skill-mirror reports ok', () => {
  const result = runNodeScript('scripts/check-skill-mirror.mjs')
  assert.equal(result.status, 'ok')
  assert.ok(result.fileCount > 0)
})

test('check-skill-language-metadata reports ok', () => {
  const result = runNodeScript('scripts/check-skill-language-metadata.mjs')
  assert.equal(result.status, 'ok')
  assert.equal(result.skillCount, result.metadataCount)
})

test('check-install-smoke reports ok and verifies new skills', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.deepEqual(result.verifiedSkills, ['ae-web-app', 'ae-backend', 'ae-debug', 'ae-tdd'])
})

function runNodeScript(relativePath) {
  const scriptPath = resolve(repoRoot, relativePath)
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })

  assert.equal(
    result.status,
    0,
    [
      `Command failed: node ${relativePath}`,
      result.stdout?.trim() || '',
      result.stderr?.trim() || '',
    ].filter(Boolean).join('\n'),
  )

  return JSON.parse(result.stdout)
}
