import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

test('renderYaml supports Claude Code delegation metadata', () => {
  const englishYaml = renderYaml(skillMetadata['ae-claude-code'], 'en')
  const chineseYaml = renderYaml(skillMetadata['ae-claude-code'], 'zh-CN')
  const bilingualYaml = renderYaml(skillMetadata['ae-claude-code'], 'bilingual')

  assert.match(englishYaml, /display_name: "AE Claude Code"/)
  assert.match(englishYaml, /short_description: "Use local Claude Code CLI as a controlled external worker"/)
  assert.match(chineseYaml, /display_name: "AE Claude Code"/)
  assert.match(bilingualYaml, /AE Claude Code/)
})

test('renderYaml supports markitdown and static server metadata', () => {
  const markitdownYaml = renderYaml(skillMetadata['ae-markitdown'], 'en')
  const staticServerYaml = renderYaml(skillMetadata['ae-static-server'], 'en')

  assert.match(markitdownYaml, /display_name: "AE Markitdown"/)
  assert.match(markitdownYaml, /Convert local files to Markdown/)
  assert.match(staticServerYaml, /display_name: "AE Static Server"/)
  assert.match(staticServerYaml, /Serve local static files/)
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

test('OfficeCLI skills are removed from active metadata', () => {
  assert.equal(skillMetadata['ae-officecli'], undefined)
  assert.equal(skillMetadata['ae-docx'], undefined)
  assert.equal(skillMetadata['ae-xlsx'], undefined)
  assert.equal(skillMetadata['ae-pptx'], undefined)
})

test('renderYaml supports Spec Kit inspired workflow metadata', () => {
  const constitutionYaml = renderYaml(skillMetadata['ae-constitution'], 'en')
  const tasksYaml = renderYaml(skillMetadata['ae-tasks'], 'en')
  assert.match(constitutionYaml, /display_name: "AE Constitution"/)
  assert.match(constitutionYaml, /project governance/)
  assert.match(tasksYaml, /display_name: "AE Tasks"/)
  assert.match(tasksYaml, /dependency-ordered/)
})

test('Ponytail-inspired minimality guidance is present in source and mirror skills', () => {
  const expectedBySkill = {
    'ae-work': [
      /## Minimality Gate/,
      /Prefer standard library, framework, database, browser, shell, or platform-native capabilities over custom code\./,
      /Do not leave open-ended "later" notes\./,
    ],
    'ae-review': [
      /## Complexity Lane/,
      /`delete`/,
      /`stdlib`/,
      /`native`/,
      /`yagni`/,
      /`shrink`/,
      /expected impact/,
      /Do not flag narrow tests, trust-boundary validation, security controls, accessibility basics, or explicit user requirements as bloat\./,
    ],
    'ae-plan': [
      /simplest viable route/,
      /New dependencies, abstractions, broad refactors, or extra files need a current requirement or repository pattern/,
      /speculative future flexibility/,
    ],
    'ae-task-loop': [
      /smallest plausible change/,
      /Broaden scope only when the latest evidence invalidates the smaller fix\./,
      /Do not remove validation, trust-boundary checks, security controls, or explicit user requirements merely to make the fix smaller\./,
    ],
  }

  for (const [skillName, expectations] of Object.entries(expectedBySkill)) {
    const sourceBody = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirrorBody = readSkillBody('.agents/skills', skillName)
    assert.equal(mirrorBody, sourceBody, `${skillName} mirror should match plugin source`)
    for (const expectation of expectations) {
      assert.match(sourceBody, expectation, `${skillName} should include ${expectation}`)
    }
  }
})

test('check-install-smoke reports ok and verifies new skills', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.ok(result.verifiedCommands.includes('recovery'))
  assert.ok(result.verifiedCommands.includes('claude-delegate'))
  assert.deepEqual(result.verifiedSkills, [
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
    'ae-markitdown',
    'ae-static-server',
    'ae-computer-use-guard',
    'ae-imagegen-prompt',
    'ae-video-edit-computer',
  ])
})

test('claude-delegate availability check returns ok or skip', () => {
  const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--check'])
  assert.match(result.status, /^(ok|skip)$/)
  assert.equal(typeof result.available, 'boolean')
  assert.equal(result.write_policy, 'codex-reviewed')
})

test('claude-delegate prompt mode skips safely when Claude is unavailable', () => {
  const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--prompt', 'Summarize the repo.'])
  assert.match(result.status, /^(ok|skip|failed)$/)
  assert.equal(typeof result.available, 'boolean')
  if (!result.available) {
    assert.equal(result.status, 'skip')
    assert.match(result.reason, /claude/)
  }
})

test('claude-delegate supports Windows cmd shims', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-shim-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 test-shim',
      '  exit /b 0',
      ')',
      'echo shim-output:%*',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--check', '--command', shimPath])
    assert.equal(result.status, 'ok')
    assert.equal(result.available, true)
    assert.match(result.version, /9\.9\.9 test-shim/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('claude-delegate discovers Windows cmd shims on PATH', { skip: process.platform !== 'win32' }, () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-path-shim-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 path-shim',
      '  exit /b 0',
      ')',
      'echo path-shim-output:%*',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--check'], repoRoot, {
      PATH: `${tempRoot};${process.env.PATH || ''}`,
    })
    assert.equal(result.status, 'ok')
    assert.equal(result.available, true)
    assert.equal(result.command, 'claude.cmd')
    assert.match(result.version, /9\.9\.9 path-shim/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('claude-delegate sends default prompts through stdin', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-prompt-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 test-shim',
      '  exit /b 0',
      ')',
      'set /p PROMPT=',
      'echo shim-prompt:%PROMPT%',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--prompt', 'AE_CLAUDE_OK', '--command', shimPath])
    assert.equal(result.status, 'ok')
    assert.deepEqual(result.args, ['-p'])
    assert.match(result.stdout, /shim-prompt:AE_CLAUDE_OK/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('help can find Claude Code delegation capability', () => {
  const output = runNodeScriptRaw('node scripts/ae-tools.mjs help claude')
  assert.match(output, /ae-claude-code/)
  assert.match(output, /claude-delegate/)
})

test('help can find markitdown and static server capabilities', () => {
  const markitdownOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help markitdown')
  assert.match(markitdownOutput, /ae-markitdown/)
  assert.match(markitdownOutput, /markitdown/)

  const serverOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help static')
  assert.match(serverOutput, /ae-static-server/)
  assert.match(serverOutput, /static-server/)
})

test('installed language switching updates active skills for all supported modes', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.deepEqual(result.verifiedLanguageModes, ['bilingual', 'en', 'zh-CN'])
  assert.equal(result.verifiedDefaultProfile, 'beginner+low_resource_2g4core_relay')
  assert.equal(result.verifiedHookPolicy, 'computer_use_requires_hooks')
  assert.equal(result.verifiedLocalToolPolicy, 'video_requires_ffmpeg_ffprobe_checks')
  assert.equal(result.verifiedMultiAgentPolicy, 'multi_agent_auto_analysis_by_default')
  assert.equal(result.verifiedSkillGovernancePolicy, 'source_mirror_metadata_and_path_safety')
})

test('package check script omits OfficeCLI checks', () => {
  const packageJson = JSON.parse(runNodeScriptRaw('node -e "console.log(JSON.stringify(require(\'./package.json\')))"'))
  const checkScript = packageJson.scripts.check
  assert.doesNotMatch(checkScript, /node scripts\/check-officecli-available\.mjs/)
  assert.doesNotMatch(checkScript, /node scripts\/check-officecli-smoke\.mjs/)
  assert.match(checkScript, /node scripts\/check-ae-artifacts\.mjs/)
  assert.match(checkScript, /node scripts\/ae-tools\.mjs ae-graph-build --root scripts/)
  assert.match(checkScript, /node scripts\/ae-tools\.mjs ae-graph-query --root scripts --path ae-tools\.mjs/)
})

test('renderYaml supports PRD, work report, and task loop metadata', () => {
  const skills = [
    ['ae-prd', 'AE PRD'],
    ['ae-work-report', 'AE Work Report'],
    ['ae-task-loop', 'AE Task Loop'],
    ['ae-constitution', 'AE Constitution'],
    ['ae-tasks', 'AE Tasks'],
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
    assert.equal(result.freshness.status, 'fresh')
    assert.equal(result.freshness.canUseAsEvidence, true)
    assert.equal(typeof result.freshness.fingerprint, 'string')
    assert.equal(result.store.path, 'docs/ae/graphs/graph.json')
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
    assert.equal(result.freshness.status, 'fresh')
    assert.equal(result.store.path, 'docs/ae/graphs/graph.json')
    assert.deepEqual(result.matchedNodes.map((node) => node.path), ['src/main.js'])
    assert.ok(result.relatedEdges.some((edge) => edge.to === 'src/helper.js'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('review-contract selects reviewers and writes evidence ledger records', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-review-contract-'))
  try {
    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'review-contract',
      '--kind',
      'code',
      '--mode',
      'report-only',
      '--targets',
      'code,document',
      '--has-security',
      '--write-evidence',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.kind, 'code')
    assert.ok(result.reviewers.includes('correctness-reviewer'))
    assert.ok(result.reviewers.includes('security-reviewer'))
    assert.equal(result.targetCoverage.code.status, 'covered')
    assert.equal(result.evidence.kind, 'review-contract')
    assert.match(result.evidence.path, /^docs\/ae\/evidence\/artifacts\/review-contract\//)

    const ledger = runNodeScriptJson(['scripts/ae-tools.mjs', 'evidence', 'read'], tempRoot)
    assert.equal(ledger.status, 'ok')
    assert.equal(ledger.state, 'passed')
    assert.equal(ledger.records.length, 1)
    assert.equal(ledger.records[0].evidenceKind, 'review-contract')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('markitdown converts JSON arrays and CSV files to Markdown tables', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-markitdown-'))
  try {
    writeFileSync(join(tempRoot, 'items.json'), JSON.stringify([{ name: 'Ada', score: 2 }, { name: 'Lin', score: 3 }]), 'utf8')
    writeFileSync(join(tempRoot, 'items.csv'), 'name,score\nAda,2\nLin,3\n', 'utf8')

    const jsonResult = runNodeScriptJson(['scripts/ae-tools.mjs', 'markitdown', 'items.json'], tempRoot)
    assert.equal(jsonResult.status, 'ok')
    assert.equal(jsonResult.format, 'json')
    assert.match(jsonResult.markdown, /\| name \| score \|/)
    assert.match(jsonResult.markdown, /\| Ada \| 2 \|/)

    const csvResult = runNodeScriptJson(['scripts/ae-tools.mjs', 'markitdown', 'items.csv'], tempRoot)
    assert.equal(csvResult.status, 'ok')
    assert.equal(csvResult.format, 'csv')
    assert.match(csvResult.markdown, /\| name \| score \|/)
    assert.match(csvResult.markdown, /\| Lin \| 3 \|/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('static-server dry run returns a local preview URL without starting a process', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-static-server-'))
  try {
    writeFileSync(join(tempRoot, 'index.html'), '<!doctype html><title>AE</title>', 'utf8')
    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'static-server', 'index.html', '--port', '43123', '--dry-run'], tempRoot)
    assert.equal(result.status, 'ok')
    assert.equal(result.serving.path, 'index.html')
    assert.equal(result.url, 'http://127.0.0.1:43123/index.html')
    assert.equal(result.dryRun, true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze reports multi-agent defaults as auto suggest', () => {
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
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.multi_agent_config.effective.mode, 'suggest')
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
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

test('task-analyze treats enabled auto as automatic safe suggestion', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: auto',
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
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze warns and falls back to auto for unknown multi-agent enabled values', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: maybe',
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
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.ok(result.warnings.includes('Ignoring unknown multi_agent.enabled: maybe'))
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
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

test('task-analyze blocks auto write agents unless allow_write_agents is true', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: auto',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: false',
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
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.multi_agent_config.effective.mode, 'auto')
    assert.equal(result.execution_strategy, 'serial_with_multi_agent_blockers')
    assert.equal(result.read_parallel_eligibility.can_parallelize, true)
    assert.deepEqual(result.read_parallel_eligibility.blockers, [])
    assert.equal(result.write_parallel_eligibility.can_parallelize, false)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.write_parallel_eligibility.blockers, ['multi_agent.allow_write_agents is false'])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze reports auto parallel readiness only with write-agent opt-in', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: true',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
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
      '### U3 - Third unit',
      '',
      '- Depends on: U1',
      '- Files:',
      '  - `tests/one.test.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.effective.enabled, true)
    assert.equal(result.multi_agent_config.effective.mode, 'auto')
    assert.equal(result.multi_agent_config.effective.allow_write_agents, true)
    assert.equal(result.execution_strategy, 'auto_parallel_ready')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.equal(result.write_parallel_eligibility.config_allows_write_agents, true)
    assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2'], ['U3']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze keeps review_only as read-only parallel strategy without write agents', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: auto',
      '  mode: review_only',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
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
    assert.equal(result.execution_strategy, 'parallel_review_only')
    assert.equal(result.read_parallel_eligibility.can_parallelize, true)
    assert.deepEqual(result.read_parallel_eligibility.blockers, [])
    assert.equal(result.write_parallel_eligibility.can_parallelize, false)
    assert.equal(result.write_parallel_eligibility.config_allows_write_agents, false)
    assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
    assert.deepEqual(result.write_parallel_eligibility.blockers, ['multi_agent.mode is review_only; write workers remain disabled'])
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze separates write config readiness from pre-edit spawn readiness', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: true',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
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
    assert.equal(result.execution_strategy, 'auto_parallel_ready')
    assert.equal(result.write_parallel_eligibility.can_parallelize, true)
    assert.equal(result.write_parallel_eligibility.config_allows_write_agents, true)
    assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
    assert.deepEqual(result.write_parallel_eligibility.pre_spawn_requirements, ['ae-work pre-edit gate must confirm a clean Git state before write delegation'])
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze parses forbidden files separately from owned files', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - Script unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '- Forbidden files:',
      '  - `package-lock.json`',
      '  - `src/shared.js`',
      '',
      '### U2 - Docs unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `docs/guide.md`',
      '- Forbidden files: none',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.deepEqual(result.units[0].files.map((file) => file.path), ['src/one.js'])
    assert.deepEqual(result.units[0].forbidden_files, ['package-lock.json', 'src/shared.js'])
    assert.deepEqual(result.units[1].forbidden_files, [])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze keeps comma-separated dependency ids with trailing punctuation', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none.',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none.',
      '- Files:',
      '  - `src/two.js`',
      '',
      '### U3 - Third unit',
      '',
      '- Depends on: U1, U2.',
      '- Files:',
      '  - `tests/one.test.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.deepEqual(result.units.map((unit) => unit.depends_on), [[], [], ['U1', 'U2']])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2'], ['U3']])
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

function runNodeScriptJson(args, cwd = repoRoot, env = {}) {
  const result = spawnSync(process.execPath, args.map((arg, index) => index === 0 ? resolve(repoRoot, arg) : arg), {
    cwd,
    env: { ...process.env, ...env },
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

function readSkillBody(root, skillName) {
  return readFileSync(resolve(repoRoot, root, skillName, 'SKILL.md'), 'utf8')
}
