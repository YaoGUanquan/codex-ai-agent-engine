import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { makeTempDir } from './helpers/skill-test-utils.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const plugin = 'plugins/ai-agent-engine-codex'
const references = 'skills/ae-help/references'

function fixture(t) {
  const path = makeTempDir('ae-team-distribution-')
  t.after(() => rmSync(path, { recursive: true, force: true }))
  return path
}

function write(root, path, text) {
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, text)
}

function run(script, args = [], cwd = root) {
  return spawnSync(process.execPath, [join(root, script), ...args], {
    cwd, encoding: 'utf8', timeout: 60000, windowsHide: true, maxBuffer: 1024 * 1024,
  })
}

function releaseFixture(t, version, extraVersions = []) {
  const target = fixture(t)
  write(target, 'package.json', JSON.stringify({ version }))
  write(target, `${plugin}/.codex-plugin/plugin.json`, JSON.stringify({ version }))
  const entries = [version, ...extraVersions]
    .map((item) => `### ${item} (2026-10-15)\n- A bounded trial change.\n`).join('\n')
  for (const suffix of ['', '.en']) {
    write(target, `README${suffix}.md`, `[History](CHANGELOG${suffix}.md)\n\n${entries}`)
    write(target, `CHANGELOG${suffix}.md`, entries)
  }
  return target
}

test('release checker accepts SemVer prereleases and includes them in the five-entry window', (t) => {
  const target = releaseFixture(t, '0.4.0-beta.1')
  const accepted = run('scripts/check-release-notes.mjs', ['--target', target])
  assert.equal(accepted.status, 0, accepted.stderr)
  assert.equal(JSON.parse(accepted.stdout).version, '0.4.0-beta.1')
  const crowded = releaseFixture(t, '0.4.0-beta.1', [
    '0.3.55', '0.3.54', '0.3.53', '0.3.52', '0.3.51',
  ])
  const rejected = run('scripts/check-release-notes.mjs', ['--target', crowded])
  assert.equal(rejected.status, 1)
  assert.match(rejected.stderr, /at most 5/)
})

test('release checker rejects malformed SemVer identifiers', (t) => {
  for (const version of ['0.4.0-', '0.4.0-beta..1', '0.4.0-01', '01.4.0', '0.4.0+']) {
    const result = run('scripts/check-release-notes.mjs', ['--target', releaseFixture(t, version)])
    assert.equal(result.status, 1, version)
    assert.match(result.stderr, /SemVer/, version)
  }
})

test('isolated installation distributes team contracts and preserves explicit consumer policy on update', (t) => {
  const target = fixture(t)
  const config = '[agents]\ndefault_subagent_model = "consumer-model"\n'
  const profilePath = '.codex/ae-skill-profiles.yaml'
  const customDoc = 'consumer-owned guidance\n'
  write(target, '.codex/config.toml', config)
  write(target, 'docs/ae/templates/consumer.md', customDoc)
  for (const policy of [
    'multi_agent:\n  enabled: false\n',
    'multi_agent:\n  mode: suggest\n  allow_write_agents: false\n',
    'multi_agent:\n  mode: review_only\n  preferred_model: inherit\n',
  ]) {
    write(target, profilePath, policy)
    const result = run('scripts/install-project.mjs', ['--target', target, '--lang', 'en'])
    assert.equal(result.status, 0, result.stderr)
    assert.equal(readFileSync(join(target, profilePath), 'utf8'), policy)
    assert.equal(readFileSync(join(target, '.codex/config.toml'), 'utf8'), config)
    assert.equal(readFileSync(join(target, 'docs/ae/templates/consumer.md'), 'utf8'), customDoc)
  }
  for (const path of [
    `${references}/team-execution.md`, `${references}/team-roles.json`,
    'skills/ae-agent-creator/references/team-role-template.md',
  ]) {
    const source = readFileSync(join(root, plugin, path), 'utf8')
    assert.equal(readFileSync(join(target, plugin, path), 'utf8'), source)
    assert.equal(readFileSync(join(target, '.agents', path), 'utf8'), source)
  }
  const candidate = JSON.parse(readFileSync(join(root, plugin, `${references}/team-roles.json`), 'utf8'))
  assert.equal(candidate.preferred_model, 'gpt-6.1-sol')
  assert.ok(candidate.roles.architect.job && candidate.roles.reviewer.job)
  write(target, 'plan.md', [
    '### U1 - Review consumer', '- Role: reviewer', '- Depends on: none',
    '- Files: none', '- Read-only files: `src/consumer.js`',
    '- Shared resources: none', '- Acceptance: inspect consumer behavior',
    '- Data Access Budget: not applicable to static review',
    '### U2 - Review producer', '- Role: reviewer', '- Depends on: none',
    '- Files: none', '- Read-only files: `src/producer.js`',
    '- Shared resources: none', '- Acceptance: inspect producer behavior',
    '- Data Access Budget: not applicable to static review',
  ].join('\n'))
  const analyzed = spawnSync(process.execPath, [join(target, 'scripts/ae-tools.mjs'),
    'task-analyze', '--project-root', target, '--mode', 'plan', '--plan', 'plan.md'], {
    cwd: target, encoding: 'utf8', timeout: 10000, windowsHide: true,
  })
  assert.equal(analyzed.status, 0, analyzed.stderr)
  const result = JSON.parse(analyzed.stdout)
  assert.equal(result.execution_strategy, 'parallel_review_only')
  assert.equal(result.worker_requests[0].role, 'reviewer')
  assert.equal(result.worker_requests[0].preferred_model, 'inherit')
  assert.deepEqual(result.worker_requests[0].owned_files, [])
})

test('trial comparison manifest separates real model execution from installation proof', () => {
  const manifest = JSON.parse(readFileSync(join(root, plugin, `${references}/team-evaluation.json`), 'utf8'))
  assert.equal(manifest.status, 'not-run')
  assert.equal(manifest.repetitions, 2)
  assert.deepEqual(manifest.variants, ['baseline-0.3.55', 'candidate'])
  assert.equal(new Set(manifest.cases.map((item) => item.id)).size, 5)
  for (const item of manifest.cases) {
    assert.ok(item.setup && item.prompt && item.acceptance.length)
  }
})
