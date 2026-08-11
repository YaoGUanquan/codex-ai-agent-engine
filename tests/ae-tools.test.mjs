import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { writeMemoryFixture, runNodeScriptJson, runGit, runNodeScriptRaw } from './helpers/skill-test-utils.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

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
    assert.deepEqual(result.args, [
      '-p',
      '--output-format', 'json',
      '--no-session-persistence',
      '--permission-mode', 'plan',
      '--tools', 'Read,Grep,Glob',
      '--allowed-tools', 'Read,Grep,Glob',
      '--disable-slash-commands',
    ])
    assert.match(result.stdout, /shim-prompt:AE_CLAUDE_OK/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('claude-delegate reports no-output diagnostics', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-no-output-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 no-output-shim',
      '  exit /b 0',
      ')',
      'exit /b 0',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--prompt', 'NO_OUTPUT', '--command', shimPath])
    assert.equal(result.status, 'ok')
    assert.equal(result.stdout, '')
    assert.equal(result.stderr, '')
    assert.ok(Array.isArray(result.diagnostics))
    assert.ok(result.diagnostics.some((diagnostic) => /no output/i.test(diagnostic)))
    assert.ok(result.diagnostics.some((diagnostic) => /--add-dir|--tools|--claude-arg/i.test(diagnostic)))
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

test('tiered capability help groups every skill and preserves filtered output', () => {
  const sourcePath = resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json')
  const mirrorPath = resolve(repoRoot, '.agents/skills/ae-help/references/capability-catalog.json')
  const source = JSON.parse(readFileSync(sourcePath, 'utf8'))
  const mirror = JSON.parse(readFileSync(mirrorPath, 'utf8'))
  const expectedByTier = {
    core: ['ae-ideate', 'ae-brainstorm', 'ae-prd', 'ae-design', 'ae-lfg', 'ae-plan', 'ae-constitution', 'ae-tasks', 'ae-work', 'ae-refactor', 'ae-review', 'ae-frontend-design', 'ae-web-app', 'ae-web-forge', 'ae-backend', 'ae-debug', 'ae-reverse-engineering', 'ae-task-loop', 'ae-tdd', 'ae-test-browser', 'ae-test-api', 'ae-handoff'],
    docs: ['ae-doc-humanize', 'ae-doc-structure', 'ae-markitdown', 'ae-work-report'],
    tools: ['ae-claude-code', 'ae-sql', 'ae-swagger-parser', 'ae-static-server', 'ae-prompt-optimize', 'ae-save-experience'],
    meta: ['ae-help', 'ae-init', 'ae-skill-creator', 'ae-skill-audit', 'ae-agent-creator', 'ae-update', 'ae-language'],
  }

  assert.deepEqual(mirror, source, 'capability catalog mirror should match plugin source')
  assert.equal(source.source.observedCommit, '76d832c96a1c810410982bf28b425a3aedb461ab')
  assert.equal(source.source.license, 'GPL-3.0-or-later')
  assert.equal(source.skills.length, Object.values(expectedByTier).flat().length)
  for (const [tier, names] of Object.entries(expectedByTier)) {
    assert.deepEqual(source.skills.filter((skill) => skill.tier === tier).map((skill) => skill.name), names)
  }
  assert.deepEqual([...new Set(source.skills.map((skill) => skill.tier))].sort(), ['core', 'docs', 'meta', 'tools'])

  const fullOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help')
  const headings = ['### 核心工程流程 (core)', '### 文档处理 (docs)', '### 辅助工具 (tools)', '### 维护与配置 (meta)']
  let previousIndex = -1
  for (const heading of headings) {
    const index = fullOutput.indexOf(heading)
    assert.ok(index > previousIndex, `${heading} should appear in deterministic tier order`)
    previousIndex = index
  }

  const filteredOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help design')
  assert.match(filteredOutput, /### 核心工程流程 \(core\)/)
  assert.doesNotMatch(filteredOutput, /### 文档处理 \(docs\)/)
  assert.doesNotMatch(filteredOutput, /### 辅助工具 \(tools\)/)
  assert.doesNotMatch(filteredOutput, /### 维护与配置 \(meta\)/)
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

test('memory registry queries return only declared, bounded metadata and relations', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-memory-registry-'))
  try {
    writeMemoryFixture(tempRoot)
    const before = readdirSync(tempRoot).sort()
    const check = runNodeScriptJson(['scripts/check-memory-knowledge-contract.mjs', '--root', '.'], tempRoot)
    assert.equal(check.status, 'ok')
    assert.equal(check.documentCount, 2)
    assert.equal(check.relationCount, 2)

    const memory = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-memory-query', '--topic', 'graph', '--relation', 'supports', '--limit', '1', '--excerpt', '32'], tempRoot)
    assert.equal(memory.status, 'ok')
    assert.deepEqual(memory.results.map((result) => result.id), ['graph-memory'])
    assert.equal(memory.results[0].relations[0].provenance, 'declared')
    assert.equal(memory.limits.truncated, false)
    assert.ok(memory.results[0].excerpt.length <= 35)

    const map = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-knowledge-map', '--limit', '1'], tempRoot)
    assert.equal(map.status, 'ok')
    assert.equal(map.edges.length, 1)
    assert.equal(map.limits.truncated, true)
    assert.equal(map.nodes.length, 2, 'map nodes must be bounded by selected declared edges')
    assert.ok(map.edges.every((edge) => edge.provenance === 'declared'))

    const query = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-knowledge-query', '--path', 'docs/ae/references/graph.md', '--direction', 'incoming'], tempRoot)
    assert.equal(query.status, 'ok')
    assert.deepEqual(query.edges.map((edge) => edge.from), ['graph-memory'])
    assert.deepEqual(readdirSync(tempRoot).sort(), before, 'memory commands must not create worktree state')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('memory registry rejects malformed data and reports no declared match separately', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-memory-registry-'))
  const invalidRoot = mkdtempSync(join(tmpdir(), 'ae-memory-invalid-'))
  try {
    writeMemoryFixture(tempRoot)
    const noMatch = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-memory-query', '--topic', 'absent'], tempRoot)
    assert.equal(noMatch.status, 'ok')
    assert.deepEqual(noMatch.results, [])
    assert.deepEqual(noMatch.diagnostics, ['no declared match'])

    mkdirSync(join(invalidRoot, 'docs', '08-ai-memory'), { recursive: true })
    mkdirSync(join(invalidRoot, 'docs', 'ae'), { recursive: true })
    writeFileSync(join(invalidRoot, 'docs', '08-ai-memory', '00-registry.json'), '{not json', 'utf8')
    const invalid = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'ae-tools.mjs'), 'ae-memory-query', '--topic', 'graph'], {
      cwd: invalidRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    assert.equal(invalid.status, 1)
    const output = JSON.parse(invalid.stdout)
    assert.equal(output.status, 'invalid')
    assert.match(output.diagnostics.join('\n'), /invalid registry JSON/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
    rmSync(invalidRoot, { recursive: true, force: true })
  }
})

test('memory registry rejects duplicate, unsafe, dangling, and unsupported declarations', () => {
  const cases = [
    ['duplicate id', (registry) => { registry.documents[1].id = registry.documents[0].id }],
    ['duplicate path', (registry) => { registry.documents[1].path = registry.documents[0].path }],
    ['missing target', (registry) => { registry.documents[0].path = 'docs/08-ai-memory/missing.md' }],
    ['outside memory allowlist', (registry) => { registry.documents[0].path = 'docs/00-process/memory.md' }],
    ['unsupported relation target', (registry) => { registry.relations[0].to = 'docs/00-process/evidence.md' }],
    ['unsupported relation type', (registry) => { registry.relations[0].type = 'guesses' }],
    ['missing evidence', (registry) => { delete registry.relations[0].evidence }],
    ['hidden target path', (registry) => { registry.documents[0].path = 'docs/08-ai-memory/.env.md' }],
  ]

  for (const [label, mutate] of cases) {
    const tempRoot = mkdtempSync(join(tmpdir(), 'ae-memory-invalid-'))
    try {
      writeMemoryFixture(tempRoot)
      const registryPath = join(tempRoot, 'docs', '08-ai-memory', '00-registry.json')
      const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
      mutate(registry)
      writeFileSync(registryPath, JSON.stringify(registry), 'utf8')
      const result = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-memory-knowledge-contract.mjs')], {
        cwd: tempRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      })
      assert.equal(result.status, 1, label)
      assert.equal(JSON.parse(result.stdout).status, 'invalid', label)
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }
})

test('memory registry preserves UTF-8 and rejects oversized registry or document reads', () => {
  const utf8Root = mkdtempSync(join(tmpdir(), 'ae-memory-utf8-'))
  const registryRoot = mkdtempSync(join(tmpdir(), 'ae-memory-large-registry-'))
  const documentRoot = mkdtempSync(join(tmpdir(), 'ae-memory-large-document-'))
  try {
    writeMemoryFixture(utf8Root)
    const utf8MemoryPath = join(utf8Root, 'docs', '08-ai-memory', '01-memory.md')
    writeFileSync(utf8MemoryPath, '# 图谱记忆\n这是 UTF-8 内容。\n', 'utf8')
    const utf8 = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-memory-query', '--topic', 'graph'], utf8Root)
    assert.match(utf8.results[0].excerpt, /图谱记忆/)

    writeMemoryFixture(registryRoot)
    const registryPath = join(registryRoot, 'docs', '08-ai-memory', '00-registry.json')
    const oversizedRegistry = JSON.parse(readFileSync(registryPath, 'utf8'))
    oversizedRegistry.padding = 'x'.repeat(300000)
    writeFileSync(registryPath, JSON.stringify(oversizedRegistry), 'utf8')
    const oversizedCheck = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-memory-knowledge-contract.mjs')], {
      cwd: registryRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    assert.equal(oversizedCheck.status, 1)
    assert.match(JSON.parse(oversizedCheck.stdout).diagnostics.join('\n'), /262144 byte limit/)

    writeMemoryFixture(documentRoot)
    writeFileSync(join(documentRoot, 'docs', '08-ai-memory', '01-memory.md'), `# Large\n${'x'.repeat(520 * 1024)}`, 'utf8')
    const oversizedQuery = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'ae-tools.mjs'), 'ae-memory-query', '--topic', 'graph'], {
      cwd: documentRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    assert.equal(oversizedQuery.status, 1)
    assert.match(JSON.parse(oversizedQuery.stdout).diagnostics.join('\n'), /524288 byte limit/)
  } finally {
    for (const root of [utf8Root, registryRoot, documentRoot]) rmSync(root, { recursive: true, force: true })
  }
})

test('memory registry rejects link path components before reading targets', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-memory-link-'))
  const outsideRoot = mkdtempSync(join(tmpdir(), 'ae-memory-link-outside-'))
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'
  try {
    mkdirSync(join(tempRoot, 'docs', '08-ai-memory'), { recursive: true })
    mkdirSync(join(outsideRoot, 'memory'), { recursive: true })
    writeFileSync(join(outsideRoot, 'memory', 'linked.md'), '# linked\n', 'utf8')
    symlinkSync(join(outsideRoot, 'memory'), join(tempRoot, 'docs', '08-ai-memory', 'linked'), linkType)
    writeFileSync(join(tempRoot, 'docs', '08-ai-memory', '00-registry.json'), JSON.stringify({
      schemaVersion: 1,
      documents: [{
        id: 'linked-memory',
        path: 'docs/08-ai-memory/linked/linked.md',
        kind: 'memory',
        role: 'unsafe link fixture',
        topics: ['link'],
        reviewStatus: 'current',
      }],
      relations: [],
    }), 'utf8')
    const result = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-memory-knowledge-contract.mjs'), '--root', '.'], {
      cwd: tempRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    assert.equal(result.status, 1)
    const output = JSON.parse(result.stdout)
    assert.equal(output.status, 'invalid')
    assert.match(output.diagnostics.join('\n'), /symbolic link or junction/i)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
    rmSync(outsideRoot, { recursive: true, force: true })
  }
})

test('memory registry rejects linked --root ancestors before reading a registry', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-memory-root-link-'))
  const outsideRoot = mkdtempSync(join(tmpdir(), 'ae-memory-root-link-outside-'))
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'
  try {
    writeMemoryFixture(join(outsideRoot, 'scoped'))
    symlinkSync(outsideRoot, join(tempRoot, 'linked'), linkType)
    const result = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-memory-knowledge-contract.mjs'), '--root', 'linked/scoped'], {
      cwd: tempRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    assert.equal(result.status, 1)
    const output = JSON.parse(result.stdout)
    assert.equal(output.status, 'invalid')
    assert.match(output.diagnostics.join('\n'), /symbolic link or junction is not allowed: linked/i)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
    rmSync(outsideRoot, { recursive: true, force: true })
  }
})

test('memory and graph commands reject missing values for value-taking options', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-memory-missing-option-'))
  try {
    writeMemoryFixture(tempRoot)
    const contractCases = [
      ['ae-memory-query', '--topic', 'graph', '--limit'],
      ['ae-memory-query', '--topic', 'graph', '--excerpt'],
      ['ae-memory-query', '--topic', '--relation', 'supports'],
      ['ae-knowledge-query', '--path', 'docs/ae/references/graph.md', '--direction'],
      ['ae-knowledge-query', '--path', 'docs/ae/references/graph.md', '--relation'],
      ['ae-knowledge-query', '--path', '--direction', 'incoming'],
    ]
    for (const args of contractCases) {
      const result = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'ae-tools.mjs'), ...args], {
        cwd: tempRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      })
      assert.equal(result.status, 1, args.join(' '))
      const output = JSON.parse(result.stdout)
      assert.equal(output.status, 'invalid')
      assert.match(output.diagnostics.join('\n'), /requires a non-empty value/)
    }

    for (const args of [
      ['ae-graph-build', '--root', 'src', '--limit', '--no-write'],
      ['ae-graph-build', '--root', 'src', '--edge-limit', '--no-write'],
    ]) {
      const result = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'ae-tools.mjs'), ...args], {
        cwd: tempRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      })
      assert.equal(result.status, 1, args.join(' '))
      assert.match(result.stderr, /requires a non-empty value/)
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('graph helpers report additive file and explicit edge limits without writing state', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-graph-limits-'))
  try {
    mkdirSync(join(tempRoot, 'src'), { recursive: true })
    writeFileSync(join(tempRoot, 'src', 'main.js'), "import './first.js'\nimport './second.js'\n", 'utf8')
    writeFileSync(join(tempRoot, 'src', 'first.js'), 'export const first = 1\n', 'utf8')
    writeFileSync(join(tempRoot, 'src', 'second.js'), 'export const second = 2\n', 'utf8')
    writeFileSync(join(tempRoot, 'src', 'third.js'), 'export const third = 3\n', 'utf8')
    const defaultResult = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-graph-build', '--root', '.', '--no-write'], tempRoot)
    assert.equal(defaultResult.limits.files.requested, null)
    assert.equal(defaultResult.limits.files.effective, 500)
    assert.equal(defaultResult.limits.edges.effective, null)
    assert.equal(defaultResult.limits.edges.truncated, false)

    const capped = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-graph-build', '--root', '.', '--limit', '3', '--edge-limit', '1', '--no-write'], tempRoot)
    assert.equal(capped.limits.files.requested, 3)
    assert.equal(capped.limits.files.truncated, true)
    assert.equal(capped.limits.edges.requested, 1)
    assert.equal(capped.limits.edges.truncated, true)
    assert.equal(capped.edges.length, 1)
    assert.equal(existsSync(join(tempRoot, 'docs', 'ae', 'graphs', 'graph.json')), false)
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
    assert.equal(result.store.schemaVersion, 1)
    assert.equal(result.store.written, false)
    assert.equal(existsSync(join(tempRoot, 'docs', 'ae', 'graphs', 'graph.json')), false)
    assert.ok(result.nodes.some((node) => node.path === 'src/main.js'))
    assert.ok(result.edges.some((edge) => edge.from === 'src/main.js' && edge.to === 'src/helper.js' && edge.type === 'imports'))
    assert.ok(result.edges.every((edge) => edge.provenance === 'inferred'))
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
    assert.equal(result.store.schemaVersion, 1)
    assert.equal(result.store.written, false)
    assert.equal(existsSync(join(tempRoot, 'docs', 'ae', 'graphs', 'graph.json')), false)
    assert.deepEqual(result.matchedNodes.map((node) => node.path), ['src/main.js'])
    assert.ok(result.relatedEdges.some((edge) => edge.to === 'src/helper.js'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('graph helper documentation states that graph snapshots are not persisted', () => {
  const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
  const readmeEn = readFileSync(resolve(repoRoot, 'README.en.md'), 'utf8')

  assert.match(readme, /不会写入 `docs\/ae\/graphs\/graph\.json`/)
  assert.match(readmeEn, /do not write `docs\/ae\/graphs\/graph\.json`/i)
})

test('review-contract selects reviewers and writes evidence ledger records', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-review-contract-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae'), { recursive: true })
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

test('task-brief extracts a single AE implementation unit into an evidence artifact', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-brief-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '## Implementation Units',
      '',
      '### U1 - First unit',
      '',
      '- Goal: first',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Goal: second',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'task-brief',
      '--plan',
      'docs/ae/plans/plan.md',
      '--unit',
      'U2',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.unit, 'U2')
    assert.equal(result.plan, 'docs/ae/plans/plan.md')
    assert.match(result.artifact.path, /^docs\/ae\/evidence\/artifacts\/task-brief\//)
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, /### U2 - Second unit/)
    assert.doesNotMatch(artifactBody, /### U1 - First unit/)
    assert.match(artifactBody, /`src\/two\.js`/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-brief accepts Unit-style headings that task-analyze already supports', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-brief-unit-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '## Implementation Units',
      '',
      '### Unit 1: First unit',
      '',
      '- Goal: first',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### Unit 2: Second unit',
      '',
      '- Goal: second',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'task-brief',
      '--plan',
      'docs/ae/plans/plan.md',
      '--unit',
      'U2',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.unit, 'U2')
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, /### Unit 2: Second unit/)
    assert.doesNotMatch(artifactBody, /### Unit 1: First unit/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-brief accepts localized 单元 headings that task-analyze already supports', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-brief-cn-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '## Implementation Units',
      '',
      '### 单元 1：第一项',
      '',
      '- Goal: first',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### 单元 2：第二项',
      '',
      '- Goal: second',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'task-brief',
      '--plan',
      'docs/ae/plans/plan.md',
      '--unit',
      'U2',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.unit, 'U2')
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, /### 单元 2：第二项/)
    assert.doesNotMatch(artifactBody, /### 单元 1：第一项/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('review-package writes commit list stat summary and diff into an evidence artifact', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-review-package-'))
  try {
    runGit(['init'], tempRoot)
    runGit(['config', 'user.name', 'Codex Test'], tempRoot)
    runGit(['config', 'user.email', 'codex@example.com'], tempRoot)

    writeFileSync(join(tempRoot, 'sample.txt'), 'one\n', 'utf8')
    runGit(['add', 'sample.txt'], tempRoot)
    runGit(['commit', '-m', 'initial'], tempRoot)
    const base = runGit(['rev-parse', 'HEAD'], tempRoot).stdout.trim()

    writeFileSync(join(tempRoot, 'sample.txt'), 'one\ntwo\n', 'utf8')
    runGit(['add', 'sample.txt'], tempRoot)
    runGit(['commit', '-m', 'update sample'], tempRoot)
    const head = runGit(['rev-parse', 'HEAD'], tempRoot).stdout.trim()

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'review-package',
      '--base',
      base,
      '--head',
      head,
      '--with-impact',
      '--impact-file-limit',
      '0',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.base, base)
    assert.equal(result.head, head)
    assert.equal(result.inventory.changedFileCount, 1)
    assert.deepEqual(result.inventory.files.map((file) => file.path), ['sample.txt'])
    assert.equal(result.inventory.files[0].role, 'document')
    assert.equal(result.inventory.files[0].additions, 1)
    assert.equal(result.inventory.files[0].deletions, 0)
    assert.equal(result.inventory.files[0].binary, false)
    assert.equal(result.impact.status, 'advisory')
    assert.equal(result.impact.fileLimit, 1)
    assert.equal(result.impact.sourceFilesScanned, 1)
    assert.deepEqual(result.impact.seedFiles, ['sample.txt'])
    assert.match(result.artifact.path, /^docs\/ae\/evidence\/artifacts\/review-package\//)
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, new RegExp(`# Review package: ${base}\\.\\.${head}`))
    assert.match(artifactBody, /## Commits/)
    assert.match(artifactBody, /update sample/)
    assert.match(artifactBody, /## Files changed/)
    assert.match(artifactBody, /sample\.txt/)
    assert.match(artifactBody, /## Review inventory/)
    assert.match(artifactBody, /## Impact context/)
    assert.match(artifactBody, /## Diff/)
    assert.match(artifactBody, /\+two/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('review-package retains renamed file identity in its review inventory', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-review-package-rename-'))
  try {
    runGit(['init'], tempRoot)
    runGit(['config', 'user.name', 'Codex Test'], tempRoot)
    runGit(['config', 'user.email', 'codex@example.com'], tempRoot)

    writeFileSync(join(tempRoot, 'old-name.js'), 'export const value = 1\n', 'utf8')
    runGit(['add', 'old-name.js'], tempRoot)
    runGit(['commit', '-m', 'initial'], tempRoot)
    const base = runGit(['rev-parse', 'HEAD'], tempRoot).stdout.trim()

    runGit(['mv', 'old-name.js', 'new-name.js'], tempRoot)
    runGit(['commit', '-m', 'rename sample'], tempRoot)
    const head = runGit(['rev-parse', 'HEAD'], tempRoot).stdout.trim()

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'review-package',
      '--base',
      base,
      '--head',
      head,
    ], tempRoot)

    assert.equal(result.inventory.changedFileCount, 1)
    assert.equal(result.inventory.files[0].path, 'new-name.js')
    assert.equal(result.inventory.files[0].previousPath, 'old-name.js')
    assert.match(result.inventory.files[0].status, /^R/)
    assert.equal(result.inventory.files[0].additions, 0)
    assert.equal(result.inventory.files[0].deletions, 0)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('review-package marks binary files without invented line counts', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-review-package-binary-'))
  try {
    runGit(['init'], tempRoot)
    runGit(['config', 'user.name', 'Codex Test'], tempRoot)
    runGit(['config', 'user.email', 'codex@example.com'], tempRoot)

    writeFileSync(join(tempRoot, 'README.md'), '# fixture\n', 'utf8')
    runGit(['add', 'README.md'], tempRoot)
    runGit(['commit', '-m', 'initial'], tempRoot)
    writeFileSync(join(tempRoot, 'sample.bin'), Buffer.from([0, 1, 2, 3]))
    runGit(['add', 'sample.bin'], tempRoot)
    runGit(['commit', '-m', 'add binary sample'], tempRoot)
    const head = runGit(['rev-parse', 'HEAD'], tempRoot).stdout.trim()
    const base = runGit(['rev-parse', 'HEAD^'], tempRoot).stdout.trim()

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'review-package',
      '--base',
      base,
      '--head',
      head,
    ], tempRoot)

    assert.equal(result.inventory.files[0].path, 'sample.bin')
    assert.equal(result.inventory.files[0].binary, true)
    assert.equal(result.inventory.files[0].additions, null)
    assert.equal(result.inventory.files[0].deletions, null)
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

test('ae-tools command modules stay an acyclic layered import graph', () => {
  // node --check only parses single files; ESM import cycles surface at runtime
  // as TDZ/undefined bindings, so guard the module graph statically instead.
  const modulesDir = resolve(repoRoot, 'plugins', 'ai-agent-engine-codex', 'scripts', 'ae-tools')
  const moduleFiles = readdirSync(modulesDir).filter((name) => name.endsWith('.mjs'))
  assert.ok(moduleFiles.includes('utils.mjs'), 'expected the shared utils module to exist')

  const graph = new Map()
  for (const name of moduleFiles) {
    // Strip a UTF-8 BOM so a BOM-prefixed module cannot hide its first import line.
    const source = readFileSync(join(modulesDir, name), 'utf8').replace(/^\uFEFF/, '')
    const localImports = [...source.matchAll(/^import\s[^\n]*?from\s+'\.\/([\w-]+\.mjs)'/gm)].map((match) => match[1])
    for (const dep of localImports) {
      assert.ok(moduleFiles.includes(dep), `${name} imports missing module ${dep}`)
    }
    graph.set(name, localImports)
  }

  assert.deepEqual(graph.get('utils.mjs'), [], 'utils.mjs is the foundation layer and must not import sibling modules')

  const visiting = new Set()
  const done = new Set()
  const visit = (name, path) => {
    if (done.has(name)) return
    assert.ok(!visiting.has(name), `circular import among ae-tools modules: ${[...path, name].join(' -> ')}`)
    visiting.add(name)
    for (const dep of graph.get(name)) visit(dep, [...path, name])
    visiting.delete(name)
    done.add(name)
  }
  for (const name of graph.keys()) visit(name, [])
})
