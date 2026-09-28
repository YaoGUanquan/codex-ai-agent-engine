import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { reviewContract } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/review.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const sourceRoot = resolve(root, 'plugins/ai-agent-engine-codex/skills')
const mirrorRoot = resolve(root, '.ae-source/skills')
const contractPath = 'ae-backend/references/data-access-contract.md'
const read = (path) => readFileSync(resolve(sourceRoot, path), 'utf8')

// These are instruction/distribution regressions, not model or database benchmarks.
test('data access contract is reachable from each backend workflow entrypoint', () => {
  const skills = [
    'ae-ideate', 'ae-brainstorm', 'ae-prd', 'ae-design', 'ae-plan',
    'ae-backend', 'ae-sql', 'ae-work', 'ae-review', 'ae-lfg',
    'ae-refactor', 'ae-debug', 'ae-tdd', 'ae-test-api',
  ]
  for (const skill of skills) {
    const path = `${skill}/SKILL.md`
    const body = read(path)
    const targets = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
      .map((match) => resolve(sourceRoot, dirname(path), match[1]))
    assert.ok(targets.includes(resolve(sourceRoot, contractPath)), `${skill} must link to the canonical contract`)
    assert.equal(readFileSync(resolve(mirrorRoot, path), 'utf8'), body, `${skill} mirror`)
  }
})

test('data access references are distributed together without a second source', () => {
  for (const name of ['data-access-contract', 'mybatis-plus-data-access', 'read-model-design', 'async-bulk-write']) {
    const path = `ae-backend/references/${name}.md`
    const body = read(path)
    assert.equal(readFileSync(resolve(mirrorRoot, path), 'utf8'), body, `${name} mirror`)
    if (name !== 'data-access-contract') {
      assert.ok(read(contractPath).includes(`](${name}.md)`), `${name} conditional route`)
    }
  }
})

test('bounded writes and logical pagination retain safety and evidence obligations', () => {
  const body = read(contractPath)
  for (const invariant of [
    /single-row CRUD/i, /statement batch/i, /flush/i, /commit/i,
    /partial completion/i, /all-or-nothing/i, /idempotency/i,
    /logical row/i, /membership.*before.*pagination/i,
    /N\+1/, /unique tie-breaker/i, /keyset/i,
    /tenant.*authorization.*deletion/i,
    /exact.*total/i, /count.*data.*separately/i,
    /batchSize - 1/, /batchSize \+ 1/,
    /not.*prove.*throughput/i,
  ]) assert.match(body, invariant)
})

test('large query designs own derived data lifecycle and comparison costs', () => {
  const body = read('ae-backend/references/read-model-design.md')
  for (const invariant of [
    /composite.*covering/i, /auxiliary.*lookup/i, /extension table/i,
    /materialized/i, /source of truth/i, /write amplification/i,
    /freshness/i, /backfill/i, /watermark/i, /out-of-order/i,
    /reconcil/i, /rebuild/i, /authorization/i, /cutover/i,
    /do not.*default/i,
  ]) assert.match(body, invariant)
})

test('asynchronous saving requires durable acceptance and restart-safe completion', () => {
  const body = read('ae-backend/references/async-bulk-write.md')
  for (const invariant of [
    /durable acceptance/i, /outbox/i, /backpressure/i,
    /bounded.*queue/i, /lease/i, /fencing/i,
    /checkpoint.*same transaction/i, /idempotency/i,
    /commit.*acknowledg/i, /cancellation/i, /dead-letter/i,
    /persisted.*completion/i, /all-or-nothing/i,
    /not.*exactly-once/i,
  ]) assert.match(body, invariant)
})

test('MyBatis-Plus choices preserve count semantics instead of a blanket switch', () => {
  const body = read('ae-backend/references/mybatis-plus-data-access.md')
  for (const invariant of [
    /actual.*version/i, /JSqlParser/, /countId/,
    /setOptimizeJoinOfCountSql\(false\)/, /setOptimizeCountSql\(false\)/,
    /setSearchCount\(false\)/, /not.*globally/i,
    /does not.*make.*count.*cheap/i,
    /tenant.*authorization.*deletion/i, /flush.*commit/i,
    /driver/i, /generated.*SQL/i,
  ]) assert.match(body, invariant)
})

test('data access decisions survive design and plan artifact creation', () => {
  for (const path of [
    'ae-design/references/design-contract-template.md',
    'ae-plan/references/plan-template.md',
  ]) {
    const body = read(path)
    for (const field of [
      'Data Access Budget', 'Cardinality', 'Query and count', 'Read model',
      'Batch and transaction', 'Async acceptance', 'Recovery', 'Evidence',
    ]) assert.ok(body.includes(field), `${path}: ${field}`)
    assert.equal(readFileSync(resolve(mirrorRoot, path), 'utf8'), body)
  }
})

test('scale contract makes token budgets and progressive disclosure executable', () => {
  const path = 'ae-help/references/scale-and-distributed-engineering.md'
  const body = read(path)
  assert.equal(readFileSync(resolve(mirrorRoot, path), 'utf8'), body)
  for (const invariant of [
    /inputTokens/, /outputTokens/, /contextWindow/, /inputBudget/, /outputBudget/, /remainingBudget/,
    /context and output caps/i, /progressive disclosure/i, /complete=false/, /stopReason/,
    /budget.*deadline.*cancel.*complete.*blocked/s,
  ]) assert.match(body, invariant)
})

test('scale contract prevents audit drift and repeated review after compaction', () => {
  const body = read('ae-help/references/scale-and-distributed-engineering.md')
  for (const invariant of [
    /one objective.*owned paths.*acceptance checks.*review budget/is,
    /evidence ledger.*status.*owner.*paths.*commands.*findings.*nextAction.*stopReason/is,
    /context compaction.*reconcile.*worktree/is,
    /do not restart a completed audit/i,
    /stop when acceptance checks pass/i,
    /unverified.*blocked/i,
  ]) assert.match(body, invariant)
})

test('review helper selects requested performance lanes for code and design without forcing CRUD', () => {
  for (const kind of ['code', 'document']) {
    const plain = reviewContract(root, ['--kind', kind])
    assert.ok(!plain.reviewers.includes('performance-reviewer'))
    const result = reviewContract(root, [
      '--kind', kind, '--has-performance', '--has-reliability', '--has-api',
    ])
    for (const reviewer of ['performance-reviewer', 'reliability-reviewer', 'api-contract-reviewer']) {
      assert.ok(result.reviewers.includes(reviewer), `${kind}: ${reviewer}`)
    }
    assert.equal(result.evidence, undefined, 'review selection must not write evidence by default')
  }
  assert.match(read('ae-review/SKILL.md'), /--has-performance/)
})
