import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const sourceRoot = resolve(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills')
const mirrorRoot = resolve(repoRoot, '.ae-source', 'skills')

const mirroredPaths = [
  'ae-help/references/test-side-effect-boundary.md',
  'ae-test-api/SKILL.md',
  'ae-tdd/SKILL.md',
  'ae-debug/SKILL.md',
  'ae-test-browser/SKILL.md',
  'ae-backend/SKILL.md',
  'ae-backend/references/mybatis-plus-data-access.md',
  'ae-backend/references/read-model-design.md',
  'ae-backend/references/data-access-contract.md',
  'ae-sql/SKILL.md',
  'ae-sql/references/sql-safety-checklist.md',
  'ae-work/references/local-runtime-smoke-gate.md',
]

test('test validation has a mirrored no-live-datasource boundary', () => {
  for (const relativePath of mirroredPaths) {
    const source = readFileSync(resolve(sourceRoot, relativePath), 'utf8')
    const mirror = readFileSync(resolve(mirrorRoot, relativePath), 'utf8')
    assert.equal(mirror, source, `${relativePath} mirror should match plugin source`)
  }

  const boundary = readFileSync(resolve(sourceRoot, 'ae-help/references/test-side-effect-boundary.md'), 'utf8')
  assert.match(boundary, /Never open a direct connection to a user-managed MySQL/i)
  assert.match(boundary, /Read-only access is still a connection/i)
  assert.match(boundary, /Do not .*probe a configured datasource/i)
  assert.match(boundary, /stop as `blocked`/i)
  assert.match(boundary, /disposable, test-only data source/i)
  assert.match(boundary, /Load, benchmark, recovery, and production-like tests require explicit authorization/i)
})

test('database reference contracts fail closed without datasource isolation', () => {
  const referencePaths = [
    'ae-backend/references/mybatis-plus-data-access.md',
    'ae-backend/references/read-model-design.md',
    'ae-backend/references/data-access-contract.md',
    'ae-sql/references/sql-safety-checklist.md',
  ]

  for (const relativePath of referencePaths) {
    const source = readFileSync(resolve(sourceRoot, relativePath), 'utf8')
    assert.match(source, /test-side-effect-boundary\.md/, `${relativePath} should load the boundary`)
    assert.match(source, /disposable.*test-only|isolated (?:fixtures|profile)/i, `${relativePath} should require isolated runtime evidence`)
    assert.match(source, /blocked/i, `${relativePath} should preserve a blocked result when isolation is missing`)
  }

  const mybatis = readFileSync(resolve(sourceRoot, referencePaths[0]), 'utf8')
  const readModel = readFileSync(resolve(sourceRoot, referencePaths[1]), 'utf8')
  const dataAccess = readFileSync(resolve(sourceRoot, referencePaths[2]), 'utf8')
  const sql = readFileSync(resolve(sourceRoot, referencePaths[3]), 'utf8')
  assert.doesNotMatch(mybatis, /with the target database\/driver/i)
  assert.doesNotMatch(readModel, /on the target engine/i)
  assert.doesNotMatch(dataAccess, /inspect the actual database\/version/i)
  assert.doesNotMatch(sql, /EXPLAIN.*safe by default/i)
  assert.match(sql, /semantically non-mutating, not connection-safe/i)
})

test('test-facing skills route runtime validation through the boundary', () => {
  const skillPaths = [
    'ae-test-api/SKILL.md',
    'ae-tdd/SKILL.md',
    'ae-debug/SKILL.md',
    'ae-test-browser/SKILL.md',
    'ae-backend/SKILL.md',
    'ae-sql/SKILL.md',
    'ae-work/references/local-runtime-smoke-gate.md',
  ]

  for (const relativePath of skillPaths) {
    const source = readFileSync(resolve(sourceRoot, relativePath), 'utf8')
    assert.match(source, /test-side-effect-boundary\.md/, `${relativePath} should load the boundary`)
    assert.match(source, /blocked/i, `${relativePath} should preserve a blocked result when isolation is missing`)
  }
})
