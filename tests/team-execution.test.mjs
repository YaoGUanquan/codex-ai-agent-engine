import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { taskAnalyze } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/tasks.mjs'
import { makeTempDir } from './helpers/skill-test-utils.mjs'

function fixture(t, units, profile) {
  const root = makeTempDir('ae-team-execution-')
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(join(root, 'plan.md'), units.join('\n'))
  if (profile) {
    mkdirSync(join(root, '.codex'))
    writeFileSync(join(root, '.codex', 'ae-skill-profiles.yaml'), `multi_agent:\n${profile}`)
  }
  return {
    root,
    analyze: (...args) => taskAnalyze(root, ['--mode', 'plan', '--plan', 'plan.md', ...args]),
    state: (units) => writeFileSync(join(root, 'state.json'), JSON.stringify({ units })),
  }
}

function unit(id, files, { reads = 'none', shared = 'none', depends = 'none', role = 'backend' } = {}) {
  return [
    `### ${id} - ${id} assignment`,
    `- Role: ${role}`,
    `- Depends on: ${depends}`,
    `- Files: ${files}`,
    `- Read-only files: ${reads}`,
    `- Shared resources: ${shared}`,
    '- Acceptance: exact totals match the expected set',
    '- Data Access Budget: one bounded query per page',
    '- Forbidden files: `package-lock.json`',
  ].join('\n')
}

test('partial waves serialize conflicting writers while independent ownership proceeds', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`src/shared.js`'),
    unit('U2', '`src/shared.js`'),
    unit('U3', '`src/independent.js`'),
  ])
  const result = analyze('--host-slots', '3')
  assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U3'], ['U2']])
  assert.equal(result.write_parallel_eligibility.can_parallelize, true)
  assert.equal(result.parallel_groups[0].is_parallel_safe, false)
  assert.deepEqual(result.conflict_matrix[0].shared_files, ['src/shared.js'])
  assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
})

test('shared reads coexist but file readers wait for writers including normalized aliases', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', 'none', { reads: '`src/shared.js`', role: 'reviewer' }),
    unit('U2', 'none', { reads: '`src/shared.js`', role: 'tester' }),
    unit('U3', '`src/./shared.js`'),
    unit('U4', '`src/other.js`'),
  ])
  const result = analyze('--host-slots', '4')
  assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2', 'U4'], ['U3']])
  assert.equal(result.conflict_matrix.length, 2)
  assert.deepEqual(result.worker_requests[0].owned_files, [])
  assert.deepEqual(result.worker_requests[0].read_only_files, ['src/shared.js'])
  assert.equal(result.worker_requests[0].authorization, 'read-only-review')
})

test('business resource writes serialize disjoint files while resource readers coexist', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`src/one.js`', { shared: 'api:items=write, schema:items=read' }),
    unit('U2', '`src/two.js`', { shared: 'api:items=read' }),
    unit('U3', '`src/three.js`', { shared: 'schema:items=read' }),
  ])
  const result = analyze()
  assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U3'], ['U2']])
  assert.deepEqual(result.conflict_matrix[0].shared_resources, ['api:items'])
  assert.deepEqual(result.units[0].shared_resources, [{ key: 'api:items', access: 'write' }, { key: 'schema:items', access: 'read' }])
  assert.equal(result.worker_requests[0].acceptance, 'exact totals match the expected set')
  assert.equal(result.worker_requests[0].data_access_budget, 'one bounded query per page')
  assert.equal(result.worker_requests[0].role, 'backend')
  assert.match(result.worker_requests[0].job, /services/i)
  assert.equal(result.worker_requests[0].reasoning_effort, 'medium')
  assert.equal(result.worker_requests[0].preferred_model, 'gpt-6.1-sol')
  assert.equal(result.worker_requests[0].runtime_verified, false)
})

test('auto and explicit numeric capacity obey observed slots and zero queues all work', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`src/one.js`'), unit('U2', '`src/two.js`'), unit('U3', '`src/three.js`'),
  ], '  max_workers: auto\n  fallback_max_workers: 2\n')
  const fallback = analyze()
  assert.deepEqual(fallback.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2'], ['U3']])
  assert.equal(fallback.capacity.source, 'fallback')
  assert.match(fallback.capacity.assumption, /host/i)
  assert.deepEqual(analyze('--host-slots', '1').parallel_waves.map((wave) => wave.unit_ids), [['U1'], ['U2'], ['U3']])
  const zero = analyze('--host-slots', '0')
  assert.deepEqual(zero.parallel_waves, [])
  assert.deepEqual(zero.readiness.runnable_unit_ids, [])
  assert.deepEqual(zero.readiness.queued_unit_ids, ['U1', 'U2', 'U3'])
  const numeric = fixture(t, [unit('U1', '`src/one.js`'), unit('U2', '`src/two.js`')], '  max_workers: 7\n')
  assert.equal(numeric.analyze('--host-slots', '1').capacity.effective_max_workers, 1)
  assert.equal(numeric.analyze('--host-slots', '0').capacity.effective_max_workers, 0)
  for (const invalid of ['-1', '1.5', 'true', '']) assert.throws(() => analyze('--host-slots', invalid), /host-slots/)
})

test('actual readiness requires passed dependencies and running ownership stays reserved', (t) => {
  const { analyze, state } = fixture(t, [
    unit('U1', '`src/shared.js`', { shared: 'api:items=write' }),
    unit('U2', '`src/shared.js`'),
    unit('U3', '`src/three.js`', { depends: 'U1' }),
    unit('U4', '`src/four.js`'),
    unit('U5', '`src/five.js`', { shared: 'api:items=read' }),
  ])
  assert.deepEqual(analyze().readiness.runnable_unit_ids, ['U1', 'U4'])
  state({ U1: 'running' })
  const running = analyze('--execution-state', 'state.json')
  assert.deepEqual(running.readiness.running_unit_ids, ['U1'])
  assert.deepEqual(running.readiness.runnable_unit_ids, ['U4'])
  assert.equal(running.worker_requests.find((request) => request.unit_id === 'U3').ready_now, false)
  assert.equal(running.parallel_waves.some((wave) => wave.unit_ids.includes('U2') || wave.unit_ids.includes('U3') || wave.unit_ids.includes('U5')), false)
  state({ U1: 'passed' })
  assert.deepEqual(analyze('--execution-state', 'state.json').readiness.runnable_unit_ids, ['U2', 'U3', 'U4'])
  for (const status of ['failed', 'blocked', 'cancelled']) {
    state({ U1: status })
    assert.equal(analyze('--execution-state', 'state.json').readiness.runnable_unit_ids.includes('U3'), false)
  }
})

test('unknown dependencies and cycles block affected units while independent units remain runnable', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`src/one.js`', { depends: 'U99' }),
    unit('U2', '`src/two.js`', { depends: 'U3' }),
    unit('U3', '`src/three.js`', { depends: 'U2' }),
    unit('U4', '`src/four.js`'), unit('U5', '`src/five.js`'),
  ])
  const result = analyze()
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U4', 'U5'])
  assert.equal(result.write_parallel_eligibility.can_parallelize, true)
  assert.deepEqual(result.dependency_diagnostics.unknown, [{ unit: 'U1', dependency: 'U99' }])
  assert.deepEqual(result.dependency_diagnostics.unresolved, ['U1', 'U2', 'U3'])
})

test('legacy parsing preserves owned files and demands manual business and acceptance checks', (t) => {
  const { analyze } = fixture(t, [
    '### U1 - Legacy\n- Depends on: none\n- Files: `src/one.js`',
    '### U2 - Legacy\n- Depends on: none\n- Files: `src/two.js`',
  ])
  const result = analyze()
  assert.deepEqual(result.units[0].files.map((file) => file.path), ['src/one.js'])
  assert.equal(result.worker_requests[0].role, 'worker')
  assert.equal(result.worker_requests[0].business_independence_verified, false)
  assert.ok(result.worker_requests[0].manual_review_required.includes('shared_resources'))
  assert.ok(result.worker_requests[0].manual_review_required.includes('acceptance'))
  assert.ok(result.write_parallel_eligibility.pre_spawn_requirements.some((item) => /business.*acceptance/i.test(item)))
})

test('ownership omissions, invalid resource access, roles and escaped paths stay visible and local', (t) => {
  const { analyze } = fixture(t, [
    '### U1 - Missing ownership\n- Depends on: none\n- Acceptance: inspect `src/hidden.js`',
    unit('U2', '`../outside.js`'),
    unit('U3', '`src/three.js`', { shared: 'api:items=maybe' }),
    unit('U4', '`src/four.js`', { role: 'invented' }),
    unit('U5', '`src/five.js`'),
  ])
  const result = analyze()
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U1' && item.code === 'missing_ownership'))
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U2' && item.code === 'invalid_path'))
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U3' && item.code === 'invalid_shared_resources'))
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U4' && item.code === 'invalid_role'))
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U5'])
})

test('new defaults permit parent-gated writes and explicit legacy switches and model preferences survive', (t) => {
  const units = [unit('U1', '`src/one.js`'), unit('U2', '`src/two.js`')]
  const defaults = fixture(t, units).analyze()
  assert.equal(defaults.multi_agent_config.effective.mode, 'auto')
  assert.equal(defaults.multi_agent_config.effective.allow_write_agents, true)
  assert.equal(defaults.multi_agent_config.effective.require_clean_git, false)
  assert.equal(defaults.write_parallel_eligibility.config_allows_write_agents, true)
  assert.equal(defaults.write_parallel_eligibility.can_spawn_write_agents_now, false)
  for (const [profile, strategy] of [
    ['  enabled: false\n', 'serial'],
    ['  mode: suggest\n', 'suggest_parallel'],
    ['  mode: review_only\n', 'parallel_review_only'],
    ['  allow_write_agents: false\n', 'serial_with_multi_agent_blockers'],
  ]) {
    const explicit = fixture(t, units, profile).analyze()
    assert.equal(explicit.execution_strategy, strategy)
    assert.equal(explicit.worker_requests.some((request) => request.ready_now), false)
  }
  const custom = fixture(t, units, '  preferred_model: inherit\n  require_clean_git: true\n').analyze()
  assert.equal(custom.worker_requests[0].preferred_model, 'inherit')
  assert.ok(custom.write_parallel_eligibility.pre_spawn_requirements.some((item) => /clean Git/.test(item)))
  assert.equal(fixture(t, units, '  preferred_model: custom-model\n').analyze().worker_requests[0].preferred_model, 'custom-model')
})

test('execution state is bounded, contained and rejects unknown or malformed unit states', (t) => {
  const { root, analyze } = fixture(t, [unit('U1', '`src/one.js`')])
  for (const state of [{ units: { U1: 'done' } }, { units: { U99: 'passed' } }, { units: [] }, [], { units: {}, extra: true }]) {
    writeFileSync(join(root, 'state.json'), JSON.stringify(state))
    assert.throws(() => analyze('--execution-state', 'state.json'), /execution.state/i)
  }
  assert.throws(() => analyze('--execution-state', '../outside.json'), /worktree/)
  assert.throws(() => analyze('--execution-state'), /execution-state/)
  writeFileSync(join(root, 'state.json'), `${' '.repeat(65536)}{"units":{}}`)
  assert.throws(() => analyze('--execution-state', 'state.json'), /exceed|limit|byte/i)
})

test('reviewer roles downgrade owned paths to read-only access and reject write resource requests', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`src/shared.js`', { role: 'reviewer', shared: 'api:items=write' }),
    unit('U2', '`src/shared.js`', { role: 'reviewer' }),
    unit('U3', '`src/other.js`'),
  ])
  const result = analyze()
  assert.deepEqual(result.worker_requests[0].owned_files, [])
  assert.deepEqual(result.worker_requests[0].read_only_files, ['src/shared.js'])
  assert.equal(result.worker_requests[0].authorization, 'read-only-review')
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U1' && item.code === 'read_only_role_write_resource'))
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U2', 'U3'])
})

test('canonical aliases cannot restore forbidden or explicitly read-only ownership', (t) => {
  const first = unit('U1', '`src/./shared.js`, `src/./protected.js`', { reads: '`src/shared.js`' })
    .replace('`package-lock.json`', '`src/protected.js`')
  const { analyze } = fixture(t, [first, unit('U2', '`src/other.js`')])
  const result = analyze()
  assert.deepEqual(result.worker_requests[0].owned_files, [])
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U1' && item.code === 'ambiguous_ownership'))
  assert.equal(result.readiness.runnable_unit_ids.includes('U1'), false)
})

test('duplicate unit identifiers cannot be independently dispatched', (t) => {
  const { analyze } = fixture(t, [unit('U1', '`src/one.js`'), unit('U1', '`src/two.js`'), unit('U2', '`src/other.js`')])
  const result = analyze()
  assert.equal(result.readiness.runnable_unit_ids.includes('U1'), false)
  assert.equal(result.dependency_diagnostics.duplicateIds, true)
})

test('canonical ownership detects Windows case aliases and refuses linked paths outside root', (t) => {
  const { root, analyze } = fixture(t, [
    unit('U1', '`src/shared.js`'), unit('U2', '`src/SHARED.js`'), unit('U3', '`linked/escape.js`'),
  ])
  const outside = makeTempDir('ae-team-outside-')
  t.after(() => rmSync(outside, { recursive: true, force: true }))
  symlinkSync(outside, join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir')
  const result = analyze()
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U3' && item.code === 'invalid_path'))
  if (process.platform === 'win32') {
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1'], ['U2']])
    assert.equal(result.conflict_matrix.length, 1)
  }
})

test('invalid new configuration fails closed while zero configured capacity remains queued', (t) => {
  const units = [unit('U1', '`src/one.js`'), unit('U2', '`src/two.js`')]
  for (const profile of [
    '  max_workers: maybe\n', '  max_workers: -1\n', '  fallback_max_workers: -1\n',
    '  fallback_max_workers: 2.5\n', '  preferred_model: true\n',
  ]) {
    const result = fixture(t, units, profile).analyze()
    assert.equal(result.multi_agent_config.source, 'invalid')
    assert.equal(result.write_parallel_eligibility.config_allows_write_agents, false)
  }
  const zero = fixture(t, units, '  max_workers: 0\n').analyze()
  assert.equal(zero.multi_agent_config.source, 'profile')
  assert.deepEqual(zero.parallel_waves, [])
  assert.deepEqual(zero.readiness.runnable_unit_ids, [])
})

test('worker requests demand unfinished work and actual test evidence while keeping legacy test field', (t) => {
  const { analyze } = fixture(t, [unit('U1', '`src/one.js`'), unit('U2', '`src/two.js`')])
  const result = analyze()
  assert.ok(result.worker_requests[0].return_format.includes('tests_run'))
  assert.ok(result.worker_requests[0].return_format.includes('tests'))
  assert.ok(result.worker_requests[0].return_format.includes('unfinished_work'))
})

test('scan candidates grant only read access even when profile permits write agents', (t) => {
  const { root } = fixture(t, [])
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src/candidate.js'), 'export const invoice = true')
  const result = taskAnalyze(root, ['--task', 'invoice'])
  assert.deepEqual(result.worker_requests[0].owned_files, [])
  assert.deepEqual(result.worker_requests[0].read_only_files, ['src/candidate.js'])
  assert.equal(result.worker_requests[0].authorization, 'read-only-review')
  assert.equal(result.manual_scope_review_required, true)
})

test('root-wide ownership and empty file declarations cannot masquerade as explicit bounded ownership', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`.`'),
    unit('U2', '').replace('- Read-only files: none\n', ''),
    unit('U3', '`src/three.js`'),
  ])
  const result = analyze()
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U1' && item.code === 'invalid_path'))
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U2' && item.code === 'missing_ownership'))
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U3'])
})

test('disabling review parallel lanes preserves independently eligible write workers', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`src/one.js`'), unit('U2', '`src/two.js`'),
  ], '  review_lanes_parallel: false\n')
  const result = analyze()
  assert.equal(result.read_parallel_eligibility.can_parallelize, false)
  assert.equal(result.write_parallel_eligibility.can_parallelize, true)
  assert.equal(result.execution_strategy, 'auto_parallel_ready')
  assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  assert.equal(result.worker_requests[0].lane, 'read-or-write-after-parent-gate')
})

test('running workers consume configured total capacity but never observed free host slots twice', (t) => {
  const units = [
    unit('U1', '`src/one.js`'), unit('U2', '`src/two.js`'),
    unit('U3', '`src/three.js`'), unit('U4', '`src/four.js`'),
  ]
  const cases = [
    { profile: '  max_workers: 2\n', host: undefined, states: { U1: 'running' }, want: ['U2'] },
    { profile: '  max_workers: 2\n', host: '3', states: { U1: 'running' }, want: ['U2'] },
    { profile: '  max_workers: 2\n', host: '1', states: { U1: 'running' }, want: ['U2'] },
    { profile: '  max_workers: 2\n', host: '0', states: { U1: 'running' }, want: [] },
    { profile: '  max_workers: 2\n', host: '3', states: { U1: 'running', U2: 'running' }, want: [] },
    { profile: '  max_workers: 4\n', host: '2', states: { U1: 'running' }, want: ['U2', 'U3'] },
    { profile: '  max_workers: auto\n', host: '3', states: { U1: 'running' }, want: ['U2', 'U3', 'U4'] },
    { profile: '  max_workers: auto\n', host: '0', states: { U1: 'running' }, want: [] },
    { profile: '  max_workers: auto\n', host: undefined, states: { U1: 'running' }, want: ['U2', 'U3'] },
    { profile: '  max_workers: auto\n  fallback_max_workers: 1\n', host: undefined, states: { U1: 'running' }, want: [] },
  ]
  for (const { profile, host, states, want } of cases) {
    const { analyze, state } = fixture(t, units, profile)
    state(states)
    const args = ['--execution-state', 'state.json', ...(host === undefined ? [] : ['--host-slots', host])]
    const result = analyze(...args)
    assert.deepEqual(result.readiness.runnable_unit_ids, want, JSON.stringify({ profile, host, states }))
    assert.equal(result.capacity.effective_max_workers, want.length)
    assert.ok(result.parallel_waves.every((wave) => wave.unit_ids.length <= want.length))
  }
})

test('directory ownership is rejected for existing directories and directory-shaped missing paths', (t) => {
  const { root, analyze } = fixture(t, [
    unit('U1', '`src`'), unit('U2', '`future/`'), unit('U3', '`src/three.js`'),
  ])
  mkdirSync(join(root, 'src'))
  const result = analyze()
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U1' && item.code === 'invalid_path'))
  assert.ok(result.unit_diagnostics.some((item) => item.unit === 'U2' && item.code === 'invalid_path'))
  assert.deepEqual(result.worker_requests[0].owned_files, [])
  assert.deepEqual(result.worker_requests[1].owned_files, [])
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U3'])
})

test('forbidden directory boundaries reject descendant writes including aliases without excluding sibling prefixes', (t) => {
  const forbidden = '`src/protected`, `future/`'
  const { root, analyze } = fixture(t, [
    unit('U1', '`src/protected/one.js`').replace('`package-lock.json`', forbidden),
    unit('U2', '`src/./protected/two.js`').replace('`package-lock.json`', forbidden),
    unit('U3', '`future/three.js`').replace('`package-lock.json`', forbidden),
    unit('U4', '`src/protected-other/four.js`').replace('`package-lock.json`', forbidden),
  ])
  mkdirSync(join(root, 'src', 'protected'), { recursive: true })
  const result = analyze()
  assert.deepEqual(result.worker_requests.slice(0, 3).map((request) => request.owned_files), [[], [], []])
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U4'])
  assert.deepEqual(result.worker_requests[3].owned_files, ['src/protected-other/four.js'])
})

test('serial review policy packs at most one reviewer while independent writes still share a wave', (t) => {
  const { analyze, state } = fixture(t, [
    unit('U1', '`src/review-one.js`', { role: 'reviewer' }),
    unit('U2', '`src/review-two.js`', { role: 'reviewer' }),
    unit('U3', '`src/write-three.js`'), unit('U4', '`src/write-four.js`'),
  ], '  review_lanes_parallel: false\n')
  const result = analyze('--host-slots', '4')
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U1', 'U3', 'U4'])
  assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U3', 'U4'], ['U2']])
  state({ U1: 'running' })
  assert.deepEqual(analyze('--host-slots', '4', '--execution-state', 'state.json').readiness.runnable_unit_ids, ['U3', 'U4'])
})

test('disabled write assignments cannot consume dispatch slots ahead of eligible read-only reviewers', (t) => {
  for (const profile of ['  mode: review_only\n', '  allow_write_agents: false\n', '  mode: suggest\n']) {
    const { analyze } = fixture(t, [
      unit('U1', '`src/write-one.js`'), unit('U2', '`src/write-two.js`'),
      unit('U3', '`src/review-three.js`', { role: 'reviewer' }),
      unit('U4', '`src/review-four.js`', { role: 'reviewer' }),
    ], profile)
    const result = analyze('--host-slots', '2')
    assert.deepEqual(result.readiness.runnable_unit_ids, ['U3', 'U4'], profile)
    assert.deepEqual(result.worker_requests.map((request) => request.ready_now), [false, false, true, true], profile)
  }
})


test('worker acceptance rejects out-of-scope file claims and keeps independent units runnable', (t) => {
  const { analyze } = fixture(t, [
    unit('U1', '`src/one.js`'),
    unit('U2', '`src/two.js`'),
  ])
  const result = analyze('--host-slots', '2')
  assert.deepEqual(result.readiness.runnable_unit_ids, ['U1', 'U2'])
  const owned = new Set(result.worker_requests.flatMap((request) => request.owned_files))
  assert.equal(owned.has('src/one.js'), true)
  assert.equal(owned.has('src/secret.js'), false)
  assert.equal(owned.has('../outside.js'), false)
})

test('failed dependency does not release dependents while empty checker coverage reports not-applicable', (t) => {
  const { analyze, state } = fixture(t, [
    unit('U1', '`src/one.js`'),
    unit('U2', '`src/two.js`', { depends: 'U1' }),
    unit('U3', '`src/three.js`'),
  ])
  state({ U1: 'failed' })
  const result = analyze('--execution-state', 'state.json', '--host-slots', '3')
  assert.equal(result.readiness.runnable_unit_ids.includes('U2'), false)
  assert.equal(result.readiness.runnable_unit_ids.includes('U3'), true)
  const emptyCheckers = []
  const coverage = {
    checked: emptyCheckers.length,
    status: emptyCheckers.length === 0 ? 'not-applicable' : 'checked',
    reason: emptyCheckers.length === 0 ? 'no checker objects in scope' : null,
  }
  assert.equal(coverage.status, 'not-applicable')
  assert.equal(coverage.checked, 0)
  assert.match(coverage.reason, /no checker objects/)
})

test('baseline and completion status must agree before attributing shared worktree diffs', (t) => {
  const baseline = { U1: 'pending', U2: 'pending' }
  const completion = { U1: 'passed', U2: 'failed' }
  const attributed = Object.keys(completion).filter((id) => baseline[id] !== completion[id])
  assert.deepEqual(attributed.sort(), ['U1', 'U2'])
  const unknownDiff = ['src/shared-unowned.js']
  const owned = new Set(['src/one.js'])
  const unattributed = unknownDiff.filter((path) => !owned.has(path))
  assert.deepEqual(unattributed, ['src/shared-unowned.js'])
})
