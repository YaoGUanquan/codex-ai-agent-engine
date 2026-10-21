import {
  createHash,
  randomUUID,
} from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const args = process.argv.slice(2)
const command = args[0] || 'help'

const ALLOWED_STATUS = new Set(['not-run', 'blocked', 'partial', 'completed', 'failed'])
const MODEL_MANIFEST = resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/model-evaluation.json')
const TEAM_MANIFEST = resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/team-evaluation.json')

function fail(message) {
  console.error(message)
  process.exit(1)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function sha256Text(text) {
  return createHash('sha256').update(text).digest('hex')
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function prepareFixtures({ outDir, suite = 'model' }) {
  const root = outDir || mkdtempSync(join(realpathSync.native(tmpdir()), `ae-${suite}-eval-`))
  mkdirSync(root, { recursive: true })
  const casesRoot = join(root, 'cases')
  mkdirSync(casesRoot, { recursive: true })

  const failing = join(casesRoot, 'single-test-class')
  mkdirSync(join(failing, 'src'), { recursive: true })
  mkdirSync(join(failing, 'tests'), { recursive: true })
  writeFileSync(join(failing, 'src', 'parse.js'), 'export function parseBoundary(n) {\n  return n >= 11\n}\n', 'utf8')
  writeFileSync(join(failing, 'src', 'other.js'), 'export function ok() { return true }\n', 'utf8')
  writeFileSync(
    join(failing, 'tests', 'parse.test.mjs'),
    [
      "import test from 'node:test'",
      "import assert from 'node:assert/strict'",
      "import { parseBoundary } from '../src/parse.js'",
      "test('boundary includes 10', () => {",
      "  assert.equal(parseBoundary(10), true)",
      "})",
      '',
    ].join('\n'),
    'utf8',
  )
  writeFileSync(
    join(failing, 'tests', 'other.test.mjs'),
    `import test from 'node:test'\nimport assert from 'node:assert/strict'\nimport { ok } from '../src/other.js'\ntest('other passes', () => {\n  assert.equal(ok(), true)\n})\n`,
    'utf8',
  )
  writeFileSync(
    join(failing, 'package.json'),
    `${JSON.stringify({ name: 'ae-eval-single-test-class', type: 'module', scripts: { test: 'node --test tests/parse.test.mjs', 'test:all': 'node --test tests/**/*.mjs' } }, null, 2)}\n`,
    'utf8',
  )

  // Verify initial failure without nested `node --test` (inherits parent harness and can exit 0).
  const probe = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import assert from 'node:assert/strict'; import { parseBoundary } from './src/parse.js'; assert.equal(parseBoundary(10), true)",
    ],
    {
      cwd: failing,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '', NODE_TEST_CONTEXT: undefined },
    },
  )
  if (probe.status === 0) fail('fixture single-test-class must initially fail the targeted assertion')
  if (probe.status == null) fail(`fixture probe failed to start: ${probe.error || 'unknown'}`)

  const fingerprint = sha256Text([
    readFileSync(join(failing, 'src/parse.js'), 'utf8'),
    readFileSync(join(failing, 'tests/parse.test.mjs'), 'utf8'),
  ].join('\n'))

  const manifest = suite === 'team' ? readJson(TEAM_MANIFEST) : readJson(MODEL_MANIFEST)
  const meta = {
    schemaVersion: 1,
    suite,
    preparedAt: new Date().toISOString(),
    fixtureRoot: root,
    fixtureFingerprint: fingerprint,
    casesMaterialized: ['single-test-class'],
    initialFailureVerified: true,
    expectedIndependentJudgment: {
      'single-test-class': {
        failingCommand: 'node --test tests/parse.test.mjs',
        expectedAfterFix: 'parseBoundary(10) === true and targeted test passes',
      },
    },
    sourceManifest: {
      path: suite === 'team' ? 'plugins/ai-agent-engine-codex/skills/ae-help/references/team-evaluation.json' : 'plugins/ai-agent-engine-codex/skills/ae-help/references/model-evaluation.json',
      status: manifest.status,
      caseCount: manifest.cases.length,
    },
    notes: [
      'Offline preparation only. Does not execute host/model acceptance.',
      'Grok Bot self-run is not GPT acceptance evidence.',
      'Separate GPT-6.1 Sol and GPT-6 Astra reports; keep host/tools/effort/initial state aligned for same-model controls.',
    ],
  }
  writeJson(join(root, 'fixture-manifest.json'), meta)
  return meta
}

function validateResult(resultPath) {
  if (!existsSync(resultPath)) fail(`result file missing: ${resultPath}`)
  const result = readJson(resultPath)
  const errors = []
  if (!ALLOWED_STATUS.has(result.status)) errors.push(`status must be one of ${[...ALLOWED_STATUS].join('|')}`)
  if (!result.modelIdentifier || typeof result.modelIdentifier !== 'string') errors.push('modelIdentifier required')
  if (!result.hostOrPluginVersion) errors.push('hostOrPluginVersion required')
  if (!result.fixtureFingerprint) errors.push('fixtureFingerprint required')
  if (!result.configuration || typeof result.configuration !== 'object') errors.push('configuration object required')
  if (typeof result.correctness !== 'boolean' && result.status === 'completed') errors.push('completed results require boolean correctness')
  if (result.elapsedMs != null && !(Number.isFinite(result.elapsedMs) && result.elapsedMs >= 0)) errors.push('elapsedMs must be non-negative when present')
  if (result.confirmationCount != null && !(Number.isInteger(result.confirmationCount) && result.confirmationCount >= 0)) {
    errors.push('confirmationCount must be a non-negative integer when present')
  }
  if (!Array.isArray(result.regressions)) errors.push('regressions array required')
  if (!Array.isArray(result.evidenceGaps)) errors.push('evidenceGaps array required')
  if (result.tokenUsage != null && typeof result.tokenUsage !== 'object') errors.push('tokenUsage must be object when present')
  if (result.modelFamily && !['gpt-6.1-sol', 'gpt-6-astra', 'other'].includes(result.modelFamily)) {
    errors.push('modelFamily must be gpt-6.1-sol|gpt-6-astra|other when present')
  }
  if (errors.length) {
    console.error(JSON.stringify({ status: 'invalid', errors }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ status: 'valid', resultStatus: result.status, modelIdentifier: result.modelIdentifier }, null, 2))
  return result
}

function validateManifestContract(path) {
  const suite = readJson(path)
  if (!ALLOWED_STATUS.has(suite.status)) fail(`${basename(path)} status invalid: ${suite.status}`)
  if (!Array.isArray(suite.cases) || suite.cases.length === 0) fail(`${basename(path)} must declare cases`)
  for (const item of suite.cases) {
    if (!item.id || !item.setup || !item.prompt || !Array.isArray(item.acceptance) || item.acceptance.length === 0) {
      fail(`${basename(path)} case incomplete: ${item.id || '<missing id>'}`)
    }
  }
  return suite
}

if (command === 'help' || command === '--help') {
  console.log(JSON.stringify({
    usage: [
      'node scripts/model-evaluation-check.mjs prepare [--suite model|team] [--out <dir>]',
      'node scripts/model-evaluation-check.mjs validate-result --result <path>',
      'node scripts/model-evaluation-check.mjs validate-manifests',
      'node scripts/model-evaluation-check.mjs sample-result --out <path>',
    ],
    notes: [
      'Offline prepare/validate only; does not purchase quota or run live models.',
      'Real runs require authorized host/model access; otherwise record not-run/blocked.',
    ],
  }, null, 2))
  process.exit(0)
}

if (command === 'prepare') {
  const suiteIdx = args.indexOf('--suite')
  const outIdx = args.indexOf('--out')
  const suite = suiteIdx >= 0 ? args[suiteIdx + 1] : 'model'
  const outDir = outIdx >= 0 ? resolve(args[outIdx + 1]) : null
  if (!['model', 'team'].includes(suite)) fail('--suite must be model|team')
  const meta = prepareFixtures({ outDir, suite })
  console.log(JSON.stringify({ status: 'prepared', ...meta }, null, 2))
  process.exit(0)
}

if (command === 'validate-result') {
  const idx = args.indexOf('--result')
  if (idx < 0 || !args[idx + 1]) fail('validate-result requires --result <path>')
  validateResult(resolve(args[idx + 1]))
  process.exit(0)
}

if (command === 'validate-manifests') {
  const model = validateManifestContract(MODEL_MANIFEST)
  const team = validateManifestContract(TEAM_MANIFEST)
  console.log(JSON.stringify({
    status: 'ok',
    model: { status: model.status, cases: model.cases.length },
    team: { status: team.status, cases: team.cases.length },
  }, null, 2))
  process.exit(0)
}

if (command === 'sample-result') {
  const outIdx = args.indexOf('--out')
  const out = outIdx >= 0 ? resolve(args[outIdx + 1]) : resolve(repoRoot, '.tmp-model-eval-sample-result.json')
  const sample = {
    status: 'not-run',
    modelIdentifier: 'unspecified',
    modelFamily: 'gpt-6.1-sol',
    hostOrPluginVersion: '0.4.0-beta.3',
    fixtureFingerprint: 'pending',
    configuration: {
      host: 'codex',
      tools: 'default',
      effort: 'medium',
      initialStateAligned: true,
    },
    correctness: null,
    elapsedMs: null,
    confirmationCount: null,
    regressions: [],
    evidenceGaps: ['authorized host/model run not executed in this environment'],
    tokenUsage: null,
    notes: ['Sample record for schema validation only'],
  }
  writeJson(out, sample)
  console.log(JSON.stringify({ status: 'wrote-sample', path: out }, null, 2))
  process.exit(0)
}

fail(`unknown command: ${command}`)
