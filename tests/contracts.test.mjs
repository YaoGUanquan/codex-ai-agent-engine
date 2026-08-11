import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { runNodeScript, runNodeScriptJson, runAeArtifactCheck, runDesignContractCheck, writeAeArtifact, validDesignContractLines } from './helpers/skill-test-utils.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

test('check-skill-mirror reports ok', () => {
  const result = runNodeScript('scripts/check-skill-mirror.mjs')
  assert.equal(result.status, 'ok')
  assert.ok(result.fileCount > 0)
})

test('root package and plugin manifest keep synchronized distribution versions', () => {
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))
  const pluginManifest = JSON.parse(readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/.codex-plugin/plugin.json'), 'utf8'))

  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/)
  assert.equal(pluginManifest.version, packageJson.version)
})

test('check-release-notes requires READMEs and changelogs to share the release-note contract', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-release-notes-'))
  const zhEntry = (version, date = '2026-08-03') => `### ${version}（${date}）\n\n- 中文变更摘要 ${version}。\n\n`
  const enEntry = (version, date = '2026-08-03') => `### ${version} (${date})\n\n- English change summary ${version}.\n\n`
  const writeDoc = (name, content) => writeFileSync(join(tempRoot, name), content, 'utf8')
  const writeValidFixture = () => {
    writeDoc('README.md', `完整历史见 [CHANGELOG.md](CHANGELOG.md)。\n\n${zhEntry('1.2.3')}`)
    writeDoc('README.en.md', `Full history: [CHANGELOG.en.md](CHANGELOG.en.md).\n\n${enEntry('1.2.3')}`)
    writeDoc('CHANGELOG.md', `# 版本更新记录\n\n${zhEntry('1.2.3')}${zhEntry('1.2.2', '2026-08-02')}`)
    writeDoc('CHANGELOG.en.md', `# Changelog\n\n${enEntry('1.2.3')}${enEntry('1.2.2', '2026-08-02')}`)
  }
  const runInvalid = () => spawnSync(process.execPath, [resolve(repoRoot, 'scripts/check-release-notes.mjs'), '--target', tempRoot], {
    cwd: repoRoot,
    encoding: 'utf8',
  })

  try {
    mkdirSync(join(tempRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin'), { recursive: true })
    writeFileSync(join(tempRoot, 'package.json'), JSON.stringify({ version: '1.2.3' }), 'utf8')
    writeFileSync(join(tempRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json'), JSON.stringify({ version: '1.2.3' }), 'utf8')

    writeValidFixture()
    const valid = runNodeScriptJson(['scripts/check-release-notes.mjs', '--target', tempRoot])
    assert.equal(valid.status, 'ok')
    assert.equal(valid.version, '1.2.3')
    assert.deepEqual(valid.changelogs, ['CHANGELOG.md', 'CHANGELOG.en.md'])

    writeValidFixture()
    writeDoc('README.en.md', 'Full history: [CHANGELOG.en.md](CHANGELOG.en.md).\n\n### 1.2.3 (2026-08-03)\n')
    let invalid = runInvalid()
    assert.equal(invalid.status, 1)
    assert.match(invalid.stderr, /change-summary bullet/)

    writeValidFixture()
    writeDoc('CHANGELOG.en.md', `# Changelog\n\n${enEntry('1.2.2', '2026-08-02')}`)
    invalid = runInvalid()
    assert.equal(invalid.status, 1)
    assert.match(invalid.stderr, /CHANGELOG\.en\.md must contain a level-three 1\.2\.3 entry/)

    writeValidFixture()
    const sixVersions = ['1.2.3', '1.2.2', '1.2.1', '1.2.0', '1.1.9', '1.1.8']
    writeDoc('README.md', `完整历史见 [CHANGELOG.md](CHANGELOG.md)。\n\n${sixVersions.map((entry) => zhEntry(entry)).join('')}`)
    writeDoc('CHANGELOG.md', `# 版本更新记录\n\n${sixVersions.map((entry) => zhEntry(entry)).join('')}`)
    invalid = runInvalid()
    assert.equal(invalid.status, 1)
    assert.match(invalid.stderr, /README\.md keeps at most 5 version entries/)

    writeValidFixture()
    writeDoc('README.md', `版本历史。\n\n${zhEntry('1.2.3')}`)
    invalid = runInvalid()
    assert.equal(invalid.status, 1)
    assert.match(invalid.stderr, /README\.md must link to CHANGELOG\.md/)

    writeValidFixture()
    writeDoc('README.md', `完整历史见 [CHANGELOG.md](CHANGELOG.md)。\n\n${zhEntry('1.2.3')}${zhEntry('1.2.1', '2026-08-01')}`)
    invalid = runInvalid()
    assert.equal(invalid.status, 1)
    assert.match(invalid.stderr, /README\.md version 1\.2\.1 is missing from CHANGELOG\.md/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-skill-language-metadata reports ok', () => {
  const result = runNodeScript('scripts/check-skill-language-metadata.mjs')
  assert.equal(result.status, 'ok')
  assert.equal(result.skillCount, result.metadataCount)
})

test('check-skill-contract reports ok without external dependencies', () => {
  const result = runNodeScript('scripts/check-skill-contract.mjs')
  assert.equal(result.status, 'ok')
  assert.equal(result.skillCount, result.checkedSkills)
  assert.equal(result.errors.length, 0)
})

test('skill roots contain only ae-* skill directories', () => {
  for (const root of ['plugins/ai-agent-engine-codex/skills', '.agents/skills']) {
    const invalidEntries = readdirSync(resolve(repoRoot, root), { withFileTypes: true })
      .filter((entry) => !entry.isDirectory() || !entry.name.startsWith('ae-'))
      .map((entry) => entry.name)

    assert.deepEqual(invalidEntries, [], `${root} should contain only ae-* skill directories`)
  }
})

test('package check layers keep required check steps without OfficeCLI', () => {
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))
  const scripts = packageJson.scripts
  for (const layer of ['check', 'check:syntax', 'check:contracts', 'check:smoke', 'check:all']) {
    assert.ok(typeof scripts[layer] === 'string' && scripts[layer].length > 0, `scripts.${layer} must exist`)
  }
  const allLayers = ['check', 'check:syntax', 'check:contracts', 'check:smoke', 'check:all'].map((name) => scripts[name]).join(' && ')
  assert.doesNotMatch(allLayers, /officecli/i)
  const hasStep = (pattern) => new RegExp(pattern).test(allLayers)
  const requiredSteps = [
    'scripts\\/check-syntax\\.mjs',
    'scripts\\/check-skill-mirror\\.mjs',
    'scripts\\/check-skill-language-metadata\\.mjs',
    'scripts\\/check-skill-contract\\.mjs',
    'scripts\\/check-ae-artifacts\\.mjs',
    'scripts\\/check-design-contract\\.mjs',
    'scripts\\/check-memory-knowledge-contract\\.mjs',
    'scripts\\/check-release-notes\\.mjs',
    'scripts\\/check-claims\\.mjs',
    'ae-memory-query',
    'ae-graph-build',
    'ae-graph-query',
  ]
  for (const step of requiredSteps) {
    assert.ok(hasStep(step), `check layers must include a step matching ${step}`)
  }
  // Heavy install smoke stays in the dedicated smoke layer, not the default check.
  assert.match(scripts['check:smoke'], /check-install-smoke\.mjs/)
  assert.match(scripts['check:smoke'], /check-global-install-smoke\.mjs/)
  assert.doesNotMatch(scripts.check, /install-smoke/)
  assert.doesNotMatch(scripts['check:contracts'], /install-smoke/)
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

test('check-ae-artifacts compatibility mode allows legacy pre-contract prd and plan', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/legacy-prd.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: legacy',
      '---',
      '# Legacy PRD',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/legacy-plan.md', [
      '---',
      'type: plan',
      'status: drafted',
      'date: 2026-06-23',
      'title: legacy',
      '---',
      '# Legacy Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /"status": "ok"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts compatibility mode allows historical target-project statuses', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/implemented-prd.md', [
      '---',
      'type: prd',
      'status: implemented',
      'date: 2026-06-30',
      'topic: implemented legacy prd',
      'format: human-readable-requirements',
      'sharded: false',
      '---',
      '# Implemented Legacy PRD',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/paused-plan.md', [
      '---',
      'type: plan',
      'status: archived-paused',
      'date: 2026-06-29',
      'title: paused legacy plan',
      'format: human-readable-plan',
      'sharded: false',
      '---',
      '# Paused Legacy Plan',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/reviewed-plan.md', [
      '---',
      'type: plan',
      'status: reviewed',
      'date: 2026-06-09',
      'title: reviewed legacy plan',
      '---',
      '# Reviewed Legacy Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /"status": "ok"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts compatibility mode rejects new contract artifact missing fields', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/plans/new-plan.md', [
      '---',
      'type: plan',
      'status: drafted',
      'date: 2026-06-24',
      'title: missing contract',
      '---',
      '# New Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /format/)
    assert.match(result.stderr, /sharded/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts strict mode rejects legacy artifact missing contract fields', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/legacy-prd.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: legacy',
      '---',
      '# Legacy PRD',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.notEqual(result.status, 0)
    assert.equal(JSON.parse(result.stderr).strict, true)
    assert.match(result.stderr, /format/)
    assert.match(result.stderr, /sharded/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts compatibility mode allows legacy partial origin lineage', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/partial-origin.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: partial origin',
      'origin: docs/source.md',
      '---',
      '# Partial Origin',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/prds/partial-fingerprint.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: partial fingerprint',
      'originFingerprint: legacy-fingerprint',
      '---',
      '# Partial Fingerprint',
      '',
    ])

    const compatibility = runAeArtifactCheck(tempRoot)
    assert.equal(compatibility.status, 0, compatibility.stderr)

    const strict = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.notEqual(strict.status, 0)
    assert.match(strict.stderr, /originFingerprint/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts rejects new partial origin lineage in compatibility and strict modes', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/partial-origin.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-24',
      'topic: partial origin',
      'format: human-readable-requirements',
      'sharded: false',
      'origin: docs/source.md',
      '---',
      '# Partial Origin',
      '',
    ])

    const compatibility = runAeArtifactCheck(tempRoot)
    assert.notEqual(compatibility.status, 0)
    assert.match(compatibility.stderr, /originFingerprint/)

    const strict = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.notEqual(strict.status, 0)
    assert.match(strict.stderr, /originFingerprint/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts accepts valid new contract prd and plan artifacts', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/new-prd.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-24',
      'topic: new prd',
      'format: human-readable-requirements',
      'sharded: false',
      'origin: docs/source.md',
      'originFingerprint: sha256:abc123',
      '---',
      '# New PRD',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/new-plan.md', [
      '---',
      'type: plan',
      'status: drafted',
      'date: 2026-06-24',
      'title: new plan',
      'format: human-readable-plan',
      'sharded: false',
      'origin: docs/ae/prds/new-prd.md',
      'originFingerprint: sha256:def456',
      '---',
      '# New Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /"status": "ok"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-design-contract passes when no design artifacts exist', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-design-contract-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae'), { recursive: true })
    const result = runDesignContractCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    const output = JSON.parse(result.stdout)
    assert.equal(output.status, 'ok')
    assert.equal(output.checked, 0)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-design-contract accepts a valid design contract', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-design-contract-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/designs/sample-2026-07-07/design.md', validDesignContractLines())
    const result = runDesignContractCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    const output = JSON.parse(result.stdout)
    assert.equal(output.status, 'ok')
    assert.equal(output.checked, 1)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-design-contract rejects malformed design contracts with structured errors', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-design-contract-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/designs/bad-2026-07-07/design.md', [
      '---',
      'type: design',
      'status: drafted',
      'date: 2026-07-07',
      'title: bad design',
      'format: human-readable-design',
      'sharded: false',
      '---',
      '# Design: bad design',
      '',
      '## Overview',
      '',
      '## Decisions',
      '',
      '### ADR-001 - First decision',
      '',
      '### ADR-001 - Duplicate decision',
      '',
    ])

    const result = runDesignContractCheck(tempRoot)
    assert.notEqual(result.status, 0)
    const output = JSON.parse(result.stderr)
    assert.equal(output.status, 'failed')
    assert.equal(output.checked, 1)
    assert.ok(output.errors.some((error) => error.field === 'section' && /AI Parse Contract/.test(error.message)))
    assert.ok(output.errors.some((error) => error.field === 'stableId' && /ADR-001/.test(error.message)))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('design contract semantic validation resolves mapping IDs and split files', () => {
  const danglingRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const traversalRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const missingRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const validSplitRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  try {
    const danglingLines = validDesignContractLines().map((line) => line.replace('| EP-001 | n/a | T-001 |', '| EP-999 | n/a | T-001 |'))
    writeAeArtifact(danglingRoot, 'docs/ae/designs/sample-2026-07-07/design.md', danglingLines)
    const dangling = runDesignContractCheck(danglingRoot)
    assert.notEqual(dangling.status, 0)
    const danglingOutput = JSON.parse(dangling.stderr)
    assert.ok(danglingOutput.errors.some((error) => error.field === 'stableReference' && /EP-999/.test(error.message)))

    const traversalLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - ../outside.md'] : [line])
    writeAeArtifact(traversalRoot, 'docs/ae/designs/sample-2026-07-07/design.md', traversalLines)
    writeAeArtifact(traversalRoot, 'docs/ae/designs/outside.md', ['# Outside'])
    const traversal = runDesignContractCheck(traversalRoot)
    assert.notEqual(traversal.status, 0)
    const traversalOutput = JSON.parse(traversal.stderr)
    assert.ok(traversalOutput.errors.some((error) => error.field === 'splitManifest' && /stay inside/i.test(error.message)))

    const missingLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - missing.md'] : [line])
    writeAeArtifact(missingRoot, 'docs/ae/designs/sample-2026-07-07/design.md', missingLines)
    const missing = runDesignContractCheck(missingRoot)
    assert.notEqual(missing.status, 0)
    const missingOutput = JSON.parse(missing.stderr)
    assert.ok(missingOutput.errors.some((error) => error.field === 'splitManifest' && /does not exist/i.test(error.message)))

    const splitLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - api.md'] : [line])
    writeAeArtifact(validSplitRoot, 'docs/ae/designs/sample-2026-07-07/design.md', splitLines)
    writeAeArtifact(validSplitRoot, 'docs/ae/designs/sample-2026-07-07/api.md', ['# API shard', '', '### EP-001 - No public endpoint', ''])
    const validSplit = runDesignContractCheck(validSplitRoot)
    assert.equal(validSplit.status, 0, validSplit.stderr)
  } finally {
    for (const root of [danglingRoot, traversalRoot, missingRoot, validSplitRoot]) {
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test('design contract semantic validation requires root manifest and owning declarations', () => {
  const missingRootEntry = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const fakeDeclaration = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  try {
    const missingRootLines = validDesignContractLines().map((line) => line === '  - design.md' ? '  - api.md' : line)
    writeAeArtifact(missingRootEntry, 'docs/ae/designs/sample-2026-07-07/design.md', missingRootLines)
    writeAeArtifact(missingRootEntry, 'docs/ae/designs/sample-2026-07-07/api.md', ['# API shard', ''])
    const missingRoot = runDesignContractCheck(missingRootEntry)
    assert.notEqual(missingRoot.status, 0)
    const missingRootOutput = JSON.parse(missingRoot.stderr)
    assert.ok(missingRootOutput.errors.some((error) => error.field === 'splitManifest' && /list design\.md/i.test(error.message)))

    const fakeDeclarationLines = validDesignContractLines()
      .filter((line) => line !== '### EP-001 - No public endpoint')
      .flatMap((line) => line === '### api-field-to-database-column-mapping' ? [line, '', '#### EP-001 - Mapping-local fake declaration'] : [line])
    writeAeArtifact(fakeDeclaration, 'docs/ae/designs/sample-2026-07-07/design.md', fakeDeclarationLines)
    const fake = runDesignContractCheck(fakeDeclaration)
    assert.notEqual(fake.status, 0)
    const fakeOutput = JSON.parse(fake.stderr)
    assert.ok(fakeOutput.errors.some((error) => error.field === 'stableReference' && /EP-001/.test(error.message)))
  } finally {
    rmSync(missingRootEntry, { recursive: true, force: true })
    rmSync(fakeDeclaration, { recursive: true, force: true })
  }
})

test('symbolic links are excluded from artifact discovery and design manifests', () => {
  const artifactRoot = mkdtempSync(join(tmpdir(), 'ae-artifact-link-'))
  const designRoot = mkdtempSync(join(tmpdir(), 'ae-design-link-'))
  const artifactOutside = mkdtempSync(join(tmpdir(), 'ae-artifact-outside-'))
  const designOutside = mkdtempSync(join(tmpdir(), 'ae-design-outside-'))
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'
  try {
    writeAeArtifact(artifactOutside, 'escaped.md', [
      '---',
      'type: experience',
      'date: 2026-07-22',
      '---',
      '# Outside artifact',
      '',
    ])
    mkdirSync(join(artifactRoot, 'docs', 'ae'), { recursive: true })
    symlinkSync(artifactOutside, join(artifactRoot, 'docs', 'ae', 'linked'), linkType)
    const artifactResult = runAeArtifactCheck(artifactRoot)
    assert.equal(artifactResult.status, 0, artifactResult.stderr)
    assert.equal(JSON.parse(artifactResult.stdout).checked, 0, 'linked artifacts must not be scanned')

    const linkedDesignLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - docs/ae/designs/sample-2026-07-07/linked/api.md'] : [line])
    writeAeArtifact(designRoot, 'docs/ae/designs/sample-2026-07-07/design.md', linkedDesignLines)
    writeAeArtifact(designOutside, 'api.md', ['# API shard', '', '### EP-001 - External declaration', ''])
    symlinkSync(designOutside, join(designRoot, 'docs', 'ae', 'designs', 'sample-2026-07-07', 'linked'), linkType)
    const designResult = runDesignContractCheck(designRoot)
    assert.notEqual(designResult.status, 0, 'linked manifest shards must be rejected')
    const designOutput = JSON.parse(designResult.stderr)
    assert.ok(designOutput.errors.some((error) => error.field === 'splitManifest' && /symbolic link|real design directory/i.test(error.message)))

    if (process.platform !== 'win32') {
      const directLinkDesignLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - api-link.md'] : [line])
      writeAeArtifact(designRoot, 'docs/ae/designs/direct-link-2026-07-22/design.md', directLinkDesignLines)
      symlinkSync(join(designOutside, 'api.md'), join(designRoot, 'docs', 'ae', 'designs', 'direct-link-2026-07-22', 'api-link.md'), 'file')
      const directLinkResult = runDesignContractCheck(designRoot)
      assert.notEqual(directLinkResult.status, 0, 'direct manifest file links must be rejected')
      const directLinkOutput = JSON.parse(directLinkResult.stderr)
      assert.ok(directLinkOutput.errors.some((error) => error.field === 'splitManifest' && /must not be a symbolic link/i.test(error.message)))
    }
  } finally {
    for (const root of [artifactRoot, designRoot, artifactOutside, designOutside]) {
      rmSync(root, { recursive: true, force: true })
    }
  }
})
