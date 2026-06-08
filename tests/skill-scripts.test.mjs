import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
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

test('renderYaml supports Computer Use video skills in all language modes', () => {
  const skills = [
    ['ae-computer-use-guard', 'AE Computer Use Guard', 'AE 电脑控制约束'],
    ['ae-imagegen-prompt', 'AE Imagegen Prompt', 'AE 图片生成提示词'],
    ['ae-video-edit-computer', 'AE Video Edit Computer', 'AE 电脑剪辑视频'],
  ]

  for (const [skillName, englishLabel, chineseLabel] of skills) {
    const englishYaml = renderYaml(skillMetadata[skillName], 'en')
    const chineseYaml = renderYaml(skillMetadata[skillName], 'zh-CN')
    const bilingualYaml = renderYaml(skillMetadata[skillName], 'bilingual')

    assert.match(englishYaml, new RegExp(`display_name: "${englishLabel}"`))
    assert.match(chineseYaml, new RegExp(`display_name: "${chineseLabel}"`))
    assert.match(bilingualYaml, new RegExp(`display_name: "${chineseLabel} / ${englishLabel}"`))
  }
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
  assert.deepEqual(result.verifiedSkills, [
    'ae-prd',
    'ae-work-report',
    'ae-task-loop',
    'ae-officecli',
    'ae-docx',
    'ae-xlsx',
    'ae-pptx',
    'ae-web-app',
    'ae-backend',
    'ae-debug',
    'ae-tdd',
    'ae-computer-use-guard',
    'ae-imagegen-prompt',
    'ae-video-edit-computer',
  ])
})

test('installed language switching updates OfficeCLI skills for all supported modes', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.deepEqual(result.verifiedLanguageModes, ['bilingual', 'en', 'zh-CN'])
  assert.equal(result.verifiedDefaultProfile, 'beginner+low_resource_2g4core_relay')
  assert.equal(result.verifiedHookPolicy, 'computer_use_requires_hooks')
  assert.equal(result.verifiedLocalToolPolicy, 'video_requires_ffmpeg_ffprobe_checks')
  assert.equal(result.verifiedMultiAgentPolicy, 'multi_agent_disabled_by_default')
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
  assert.match(checkScript, /node scripts\/check-ae-artifacts\.mjs/)
  assert.match(checkScript, /node scripts\/ae-tools\.mjs ae-graph-build --root scripts/)
  assert.match(checkScript, /node scripts\/ae-tools\.mjs ae-graph-query --root scripts --path ae-tools\.mjs/)
})

test('renderYaml supports PRD, work report, and task loop metadata', () => {
  const skills = [
    ['ae-prd', 'AE PRD'],
    ['ae-work-report', 'AE Work Report'],
    ['ae-task-loop', 'AE Task Loop'],
  ]

  for (const [skillName, englishLabel] of skills) {
    const yaml = renderYaml(skillMetadata[skillName], 'en')
    assert.match(yaml, new RegExp(`display_name: "${englishLabel}"`))
  }
})

test('swagger parses local YAML and resolves local schema refs', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-swagger-'))
  try {
    writeFileSync(join(tempRoot, 'openapi.yaml'), [
      'openapi: 3.0.0',
      'info:',
      '  title: YAML API',
      '  version: 1.0.0',
      'paths:',
      '  /users:',
      '    post:',
      '      tags: [users]',
      '      summary: Create user',
      '      requestBody:',
      '        content:',
      '          application/json:',
      '            schema:',
      '              $ref: "#/components/schemas/UserInput"',
      '      responses:',
      '        "200":',
      '          description: ok',
      'components:',
      '  schemas:',
      '    UserInput:',
      '      type: object',
      '      properties:',
      '        name:',
      '          type: string',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'swagger', 'openapi.yaml', 'method:POST', 'path:/users', 'mode:detail'], tempRoot)
    assert.equal(result.title, 'YAML API')
    assert.equal(result.openapi, '3.0.0')
    assert.equal(result.matched_operations, 1)
    assert.equal(result.operations[0].requestBody.content['application/json'].schema.type, 'object')
    assert.equal(result.operations[0].requestBody.content['application/json'].schema.properties.name.type, 'string')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('swagger parses YAML sequence objects used by parameters', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-swagger-'))
  try {
    writeFileSync(join(tempRoot, 'openapi.yaml'), [
      'openapi: 3.0.0',
      'info:',
      '  title: Common YAML API',
      '  version: 1.0.0',
      'paths:',
      '  /users/{id}:',
      '    get:',
      '      tags:',
      '        - users',
      '      summary: Get user',
      '      parameters:',
      '        - name: id',
      '          in: path',
      '          required: true',
      '          schema:',
      '            type: string',
      '      responses:',
      '        "200":',
      '          description: ok',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'swagger', 'openapi.yaml', 'method:GET', 'path:/users/{id}', 'mode:detail'], tempRoot)
    assert.equal(result.matched_operations, 1)
    assert.deepEqual(result.operations[0].tags, ['users'])
    assert.deepEqual(result.operations[0].parameters, [{
      name: 'id',
      in: 'path',
      required: true,
      description: null,
      schema: {
        type: 'string',
        format: null,
      },
    }])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts rejects invalid managed frontmatter', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'prds'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'prds', 'bad.md'), [
      '---',
      'type: prd',
      'status: active',
      'date: 2026-06-04',
      'topic: missing',
      '---',
      '# Bad PRD',
      '',
    ].join('\n'), 'utf8')

    const result = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-ae-artifacts.mjs'), '--target', tempRoot], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /status/)
    assert.match(result.stderr, /prd/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('graph-build reports shallow local dependencies', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-graph-'))
  try {
    mkdirSync(join(tempRoot, 'src'), { recursive: true })
    writeFileSync(join(tempRoot, 'src', 'main.js'), [
      "import { helper } from './helper.js'",
      "import fs from 'node:fs'",
      'helper()',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'src', 'helper.js'), [
      'export function helper() {',
      "  return 'ok'",
      '}',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-graph-build', '--root', '.'], tempRoot)
    assert.equal(result.status, 'ok')
    assert.equal(result.mode, 'shallow-dependency-graph')
    assert.ok(result.nodes.some((node) => node.path === 'src/main.js'))
    assert.ok(result.edges.some((edge) => edge.from === 'src/main.js' && edge.to === 'src/helper.js' && edge.type === 'imports'))
    assert.ok(result.externalDependencies.some((dep) => dep.from === 'src/main.js' && dep.dependency === 'node:fs'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('graph-query filters shallow graph by path', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-graph-'))
  try {
    mkdirSync(join(tempRoot, 'src'), { recursive: true })
    writeFileSync(join(tempRoot, 'src', 'main.js'), "import './helper.js'\n", 'utf8')
    writeFileSync(join(tempRoot, 'src', 'helper.js'), 'export const value = 1\n', 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-graph-query', '--root', '.', '--path', 'src/main.js'], tempRoot)
    assert.equal(result.status, 'ok')
    assert.deepEqual(result.matchedNodes.map((node) => node.path), ['src/main.js'])
    assert.ok(result.relatedEdges.some((edge) => edge.to === 'src/helper.js'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze reports multi-agent defaults as disabled', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.source, 'default')
    assert.equal(result.multi_agent_config.effective.enabled, false)
    assert.equal(result.execution_strategy, 'serial')
    assert.deepEqual(result.parallel_eligibility.blockers, ['multi_agent.enabled is false'])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1'], ['U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze keeps multi-agent disabled when enabled is false', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: false',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: false',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: true',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.source, 'profile')
    assert.equal(result.multi_agent_config.effective.enabled, false)
    assert.equal(result.multi_agent_config.effective.mode, 'auto')
    assert.equal(result.execution_strategy, 'serial')
    assert.equal(result.parallel_eligibility.can_parallelize, false)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, ['multi_agent.enabled is false'])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1'], ['U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze uses opt-in multi-agent suggest config for dependency waves', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: true',
      '  mode: suggest',
      '  max_workers: 2',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: false',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - Script analysis',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `scripts/a.mjs`',
      '',
      '### U2 - Skill docs',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `docs/skill.md`',
      '',
      '### U3 - Tests',
      '',
      '- Depends on: U1',
      '- Files:',
      '  - `tests/a.test.mjs`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.source, 'profile')
    assert.equal(result.multi_agent_config.path, '.codex/ae-skill-profiles.yaml')
    assert.equal(result.multi_agent_config.effective.enabled, true)
    assert.equal(result.multi_agent_config.effective.max_workers, 2)
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2'], ['U3']])
    assert.deepEqual(result.units.map((unit) => unit.depends_on), [[], [], ['U1']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
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

function runNodeScriptJson(args, cwd = repoRoot) {
  const result = spawnSync(process.execPath, args.map((arg, index) => index === 0 ? resolve(repoRoot, arg) : arg), {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  })

  assert.equal(
    result.status,
    0,
    [
      `Command failed: node ${args.join(' ')}`,
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
