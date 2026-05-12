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

test('renderYaml emits Chinese metadata for ae-officecli', () => {
  const yaml = renderYaml(skillMetadata['ae-officecli'], 'zh-CN')
  assert.match(yaml, /display_name: "AE OfficeCLI"/)
  assert.match(yaml, /short_description: "将 OfficeCLI 作为外部引擎处理 Office 文档自动化任务"/)
})

test('renderYaml emits Chinese metadata for OfficeCLI format skills', () => {
  const docxYaml = renderYaml(skillMetadata['ae-docx'], 'zh-CN')
  const xlsxYaml = renderYaml(skillMetadata['ae-xlsx'], 'zh-CN')
  const pptxYaml = renderYaml(skillMetadata['ae-pptx'], 'zh-CN')
  assert.match(docxYaml, /display_name: "AE DOCX"/)
  assert.match(docxYaml, /default_prompt: "使用 \$ae-docx 处理这个 Word 文档任务。"/)
  assert.match(xlsxYaml, /display_name: "AE XLSX"/)
  assert.match(xlsxYaml, /default_prompt: "使用 \$ae-xlsx 处理这个 Excel 任务。"/)
  assert.match(pptxYaml, /display_name: "AE PPTX"/)
  assert.match(pptxYaml, /default_prompt: "使用 \$ae-pptx 处理这个 PowerPoint 任务。"/)
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
  assert.deepEqual(result.verifiedSkills, ['ae-officecli', 'ae-docx', 'ae-xlsx', 'ae-pptx', 'ae-web-app', 'ae-backend', 'ae-debug', 'ae-tdd'])
})

test('installed language switching updates OfficeCLI skills for all supported modes', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.deepEqual(result.verifiedLanguageModes, ['bilingual', 'en', 'zh-CN'])
})

test('check-officecli-available returns ok or skip', () => {
  const result = runNodeScript('scripts/check-officecli-available.mjs')
  assert.match(result.status, /^(ok|skip)$/)
  assert.equal(typeof result.available, 'boolean')
})

test('check-officecli-smoke returns ok or skip', () => {
  const result = runNodeScript('scripts/check-officecli-smoke.mjs')
  assert.match(result.status, /^(ok|skip)$/)
  assert.equal(typeof result.available, 'boolean')
})

test('package check script runs officecli checks as commands', () => {
  const packageJson = JSON.parse(runNodeScriptRaw('node -e "console.log(JSON.stringify(require(\'./package.json\')))"'))
  const checkScript = packageJson.scripts.check
  assert.match(checkScript, /node scripts\/check-officecli-available\.mjs/)
  assert.match(checkScript, /node scripts\/check-officecli-smoke\.mjs/)
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

function runNodeScriptRaw(command) {
  const result = spawnSync(command, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  })

  assert.equal(
    result.status,
    0,
    [result.stdout?.trim() || '', result.stderr?.trim() || ''].filter(Boolean).join('\n'),
  )

  return result.stdout
}
