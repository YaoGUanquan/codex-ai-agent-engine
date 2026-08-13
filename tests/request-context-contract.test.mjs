import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canUseSingleRequestFallback,
  classifySmokeOutcome,
  evaluateCredentialReadiness,
  resolveSmokeCarrier,
  validateRequestContextManifest,
} from '../plugins/ai-agent-engine-codex/scripts/request-context-contract.mjs'

const readyManifest = {
  inputs: [
    { name: 'authorization', location: 'header', required: true, source: 'auth contract', classification: 'user-controlled-opaque-secret', provider: 'credential reference', validation: 'opaque reference is present', lifetime: 'request', redaction: 'never record value', headerCategory: 'authentication' },
    { name: 'content-type', location: 'header', required: true, source: 'endpoint contract', classification: 'static-non-secret-fixture', provider: 'runner', validation: 'application/json', lifetime: 'static', redaction: 'record category only', headerCategory: 'media-type' },
  ],
  headerCategories: Object.fromEntries([
    'authentication', 'scope', 'media-type', 'locale', 'version-concurrency', 'idempotency',
    'signature-timestamp-nonce', 'csrf-session', 'gateway-context',
  ].map((name) => [name, name === 'authentication' || name === 'media-type'
    ? { status: 'applicable', source: 'target contract' }
    : { status: 'omitted', source: 'target contract', reason: 'not required' }])),
}

test('request context requires source, provider, validation, and redaction metadata', () => {
  assert.equal(validateRequestContextManifest(readyManifest).status, 'ready')
  const result = validateRequestContextManifest({ inputs: [{ name: 'tenant', location: 'header', required: true, classification: 'static-non-secret-fixture', provider: 'unresolved', source: '', validation: '', lifetime: '', redaction: '' }] })
  assert.equal(result.category, 'request-context')
  assert.ok(result.errors.length >= 4)
})

test('project runner takes precedence and unsafe generic fallback is blocked', () => {
  const result = resolveSmokeCarrier({ operation: { stateChanging: true, requiresReadBack: true }, manifest: readyManifest, projectRunner: { validated: true, coversContext: true, source: 'scripts/smoke.ps1', method: 'PUT', pathTemplate: '/api/items/{id}', assertionSource: 'tests/api-items.tests.ps1' }, fallback: { validated: true } })
  assert.equal(result.carrier, 'project-runner')
  assert.equal(canUseSingleRequestFallback({ stateChanging: true }).eligible, false)
})

test('single bounded read can use validated curl fallback', () => {
  const result = resolveSmokeCarrier({ operation: { method: 'GET' }, manifest: readyManifest, fallback: { validated: true, source: 'temp request config' } })
  assert.equal(result.carrier, 'single-request-curl')
})

test('dynamic and prior-response inputs require a project runner', () => {
  const manifest = structuredClone(readyManifest)
  manifest.inputs.push({ name: 'revision', location: 'prior-response', required: true, source: 'response contract', classification: 'prior-response-derived', provider: 'runner', validation: 'non-empty current revision', lifetime: 'step', redaction: 'record presence only' })
  const result = resolveSmokeCarrier({ operation: { method: 'GET' }, manifest, fallback: { validated: true } })
  assert.equal(result.status, 'blocked')
})

test('outcomes classify context, client, transport, auth, and business failures', () => {
  assert.equal(classifySmokeOutcome({ clientError: 'request-context' }).category, 'request-context')
  assert.equal(classifySmokeOutcome({ clientError: 'parse' }).category, 'client-config')
  assert.equal(classifySmokeOutcome({ clientError: 'transport' }).category, 'transport')
  assert.equal(classifySmokeOutcome({ statusCode: 401 }).category, 'auth')
  assert.equal(classifySmokeOutcome({ statusCode: 422 }).category, 'business')
})

test('success and server errors stay distinct from business-contract failures', () => {
  assert.equal(classifySmokeOutcome({ statusCode: 200 }).category, 'passed')
  assert.equal(classifySmokeOutcome({ statusCode: 204 }).category, 'passed')
  assert.equal(classifySmokeOutcome({ statusCode: 500 }).category, 'transport')
  assert.equal(classifySmokeOutcome({ statusCode: 503 }).category, 'transport')
})

test('non-GET operations cannot use generic fallback unless marked read-only by contract', () => {
  assert.equal(canUseSingleRequestFallback({ method: 'POST' }).eligible, false)
  assert.equal(canUseSingleRequestFallback({ method: 'PUT' }).eligible, false)
  assert.equal(canUseSingleRequestFallback({ method: 'POST', readOnlyByContract: true }).eligible, true)
})

test('applicable header categories require a matching input provider', () => {
  const manifest = structuredClone(readyManifest)
  manifest.headerCategories.scope = { status: 'applicable', source: 'gateway contract' }
  const result = validateRequestContextManifest(manifest)
  assert.equal(result.status, 'blocked')
  assert.equal(result.category, 'request-context')
  assert.ok(result.errors.some((error) => /headerCategories\.scope/.test(error)))
})

test('derived values cannot be classified with a static lifetime', () => {
  const manifest = structuredClone(readyManifest)
  manifest.inputs.push({
    name: 'revision',
    location: 'prior-response',
    required: true,
    source: 'response contract',
    classification: 'prior-response-derived',
    provider: 'runner',
    validation: 'non-empty current revision',
    lifetime: 'static',
    redaction: 'record presence only',
  })
  const result = validateRequestContextManifest(manifest)
  assert.equal(result.status, 'blocked')
  assert.ok(result.errors.some((error) => /lifetime/.test(error)))
})

test('path header and body context aliases must match before live execution', () => {
  const manifest = structuredClone(readyManifest)
  manifest.inputs.push(
    { name: 'pathSchool', location: 'path', required: true, source: 'route contract', classification: 'environment-non-secret-context', provider: 'fixture', validation: 'school scope present', lifetime: 'request', redaction: 'record category only', relationKey: 'school-a' },
    { name: 'scopeHeader', location: 'header', required: true, source: 'gateway contract', classification: 'environment-non-secret-context', provider: 'fixture', validation: 'school scope present', lifetime: 'request', redaction: 'record category only', headerCategory: 'scope', relationKey: 'school-b' },
    { name: 'bodySchool', location: 'body', required: true, source: 'dto contract', classification: 'environment-non-secret-context', provider: 'fixture', validation: 'school scope present', lifetime: 'request', redaction: 'record category only', relationKey: 'school-a' },
  )
  manifest.headerCategories.scope = { status: 'applicable', source: 'gateway contract' }
  manifest.relationships = [{ names: ['pathSchool', 'scopeHeader', 'bodySchool'], rule: 'same-context' }]
  const result = validateRequestContextManifest(manifest)
  assert.equal(result.status, 'blocked')
  assert.equal(result.category, 'request-context')
  assert.ok(result.errors.some((error) => /same-context|relationship/i.test(error)))
})

test('a discovered but unvalidated project runner cannot fall through to curl', () => {
  const result = resolveSmokeCarrier({
    operation: { method: 'GET' },
    manifest: readyManifest,
    projectRunner: { validated: false, coversContext: false, source: 'scripts/smoke.ps1' },
    fallback: { validated: true, source: 'temp request config' },
  })
  assert.equal(result.status, 'blocked')
  assert.equal(result.carrier, null)
})

test('project runner selection requires method path and assertion coverage evidence', () => {
  const missingCoverage = resolveSmokeCarrier({
    operation: { method: 'GET' },
    manifest: readyManifest,
    projectRunner: { validated: true, coversContext: true, source: 'scripts/smoke.ps1' },
  })
  assert.equal(missingCoverage.status, 'blocked')
  const covered = resolveSmokeCarrier({
    operation: { method: 'GET' },
    manifest: readyManifest,
    projectRunner: {
      validated: true,
      coversContext: true,
      source: 'scripts/smoke.ps1',
      method: 'GET',
      pathTemplate: '/api/items/{id}',
      assertionSource: 'tests/api-items.tests.ps1',
    },
  })
  assert.equal(covered.carrier, 'project-runner')
})

test('an environment variable from another process is not a ready credential', () => {
  const otherShell = evaluateCredentialReadiness({ envName: 'AE_SMOKE_TOKEN', envVisible: false })
  assert.equal(otherShell.ready, false)
  assert.match(otherShell.reason, /same-process|visible/i)
  const sameProcess = evaluateCredentialReadiness({ envName: 'AE_SMOKE_TOKEN', envVisible: true })
  assert.equal(sameProcess.ready, true)
  const fileRef = evaluateCredentialReadiness({ fileReferenceReady: true })
  assert.equal(fileRef.ready, true)
})
