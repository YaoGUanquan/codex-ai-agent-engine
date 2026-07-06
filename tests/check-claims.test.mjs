import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const scriptPath = resolve(repoRoot, 'scripts', 'check-claims.mjs')

test('check-claims accepts valid path evidence claim blocks', () => {
  withTempRepo((tempRoot) => {
    writeFixture(tempRoot, 'docs/proof.md', '# proof\n')
    writeFixture(tempRoot, 'docs/claims.md', [
      '# Claims',
      '',
      '```ae-claim',
      'id: CLAIM-PATH-1',
      'claim: Path evidence can be verified.',
      'source: docs/claims.md',
      'layer: Guardrail',
      'status: active',
      'evidenceType: path',
      'evidence: docs/proof.md',
      '```',
      '',
    ].join('\n'))

    const result = runCheck(['--dry-run', '--target', tempRoot, '--include', 'docs/claims.md'])

    assert.equal(result.exitCode, 0)
    assert.equal(result.json.status, 'ok')
    assert.equal(result.json.dryRun, true)
    assert.equal(result.json.claimsChecked, 1)
    assert.deepEqual(result.json.claimFiles, ['docs/claims.md'])
    assert.deepEqual(result.json.errors, [])
    assert.deepEqual(result.json.warnings, [])
    assert.deepEqual(result.json.unverifiable, [])
  })
})

test('check-claims ignores markdown files without claim blocks', () => {
  withTempRepo((tempRoot) => {
    writeFixture(tempRoot, 'docs/legacy.md', [
      '# Legacy notes',
      '',
      'This file contains ordinary prose and no machine-readable claim block.',
      '',
    ].join('\n'))

    const result = runCheck(['--dry-run', '--target', tempRoot, '--include', 'docs/legacy.md'])

    assert.equal(result.exitCode, 0)
    assert.equal(result.json.status, 'ok')
    assert.equal(result.json.claimsChecked, 0)
    assert.deepEqual(result.json.claimFiles, [])
    assert.deepEqual(result.json.errors, [])
  })
})

test('check-claims reports schema and missing path evidence errors', () => {
  withTempRepo((tempRoot) => {
    writeFixture(tempRoot, 'docs/bad.md', [
      '# Bad claim',
      '',
      '```ae-claim',
      'id: bad id',
      'claim: Missing path evidence fails.',
      'source: docs/bad.md',
      'layer: Unknown',
      'status: active',
      'evidenceType: path',
      'evidence: docs/missing.md',
      '```',
      '',
    ].join('\n'))

    const result = runCheck(['--dry-run', '--target', tempRoot, '--include', 'docs/bad.md'])

    assert.equal(result.exitCode, 1)
    assert.equal(result.json.status, 'failed')
    assert.equal(result.json.claimsChecked, 1)
    assert.ok(result.json.errors.some((error) => error.field === 'id'))
    assert.ok(result.json.errors.some((error) => error.field === 'layer'))
    assert.ok(result.json.errors.some((error) => error.field === 'evidence'))
    assert.ok(result.json.errors.every((error) => error.file === 'docs/bad.md'))
    assert.ok(result.json.errors.every((error) => Number.isInteger(error.line) && error.line > 0))
  })
})

test('check-claims classifies command assumption and deferred evidence as unverifiable in dry-run', () => {
  withTempRepo((tempRoot) => {
    writeFixture(tempRoot, 'docs/mixed.md', [
      '# Mixed claims',
      '',
      '```ae-claim',
      'id: CLAIM-COMMAND-1',
      'claim: Command evidence is recorded but not executed.',
      'source: docs/mixed.md',
      'layer: Guardrail',
      'status: active',
      'evidenceType: command',
      'evidence: npm test',
      '```',
      '',
      '```ae-claim',
      'id: CLAIM-ASSUMPTION-1',
      'claim: Assumptions remain explicitly unverified.',
      'source: docs/mixed.md',
      'layer: Knowledge',
      'status: assumption',
      'evidenceType: assumption',
      'evidence: user supplied claim',
      'reason: external fact not checked in dry-run',
      '```',
      '',
      '```ae-claim',
      'id: CLAIM-DEFERRED-1',
      'claim: Deferred evidence remains visible.',
      'source: docs/mixed.md',
      'layer: Memory',
      'status: deferred',
      'evidenceType: deferred',
      'evidence: future schema adoption',
      'reason: waiting for repeated production claim blocks',
      '```',
      '',
    ].join('\n'))

    const result = runCheck(['--dry-run', '--target', tempRoot, '--include', 'docs/mixed.md'])

    assert.equal(result.exitCode, 0)
    assert.equal(result.json.status, 'warning')
    assert.equal(result.json.claimsChecked, 3)
    assert.deepEqual(result.json.errors, [])
    assert.deepEqual(result.json.unverifiable.map((entry) => entry.evidenceType), ['command', 'assumption', 'deferred'])
    assert.ok(result.json.warnings.some((warning) => warning.claimId === 'CLAIM-COMMAND-1'))
    assert.ok(result.json.warnings.some((warning) => warning.claimId === 'CLAIM-ASSUMPTION-1'))
    assert.ok(result.json.warnings.some((warning) => warning.claimId === 'CLAIM-DEFERRED-1'))
  })
})

function withTempRepo(callback) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-check-claims-'))
  try {
    callback(tempRoot)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}

function writeFixture(root, relativePath, content) {
  const fullPath = join(root, relativePath)
  mkdirSync(resolve(fullPath, '..'), { recursive: true })
  writeFileSync(fullPath, content, 'utf8')
}

function runCheck(args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })
  const output = result.stdout.trim() || result.stderr.trim()
  let json
  try {
    json = JSON.parse(output)
  } catch {
    json = { status: 'non-json-output', raw: output }
  }

  return {
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    json,
  }
}
