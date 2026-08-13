const CLASSIFICATIONS = new Set([
  'static-non-secret-fixture',
  'user-controlled-opaque-secret',
  'environment-non-secret-context',
  'runtime-derived',
  'prior-response-derived',
])

const DERIVED_CLASSIFICATIONS = new Set(['runtime-derived', 'prior-response-derived'])
const LOCATIONS = new Set(['header', 'cookie', 'path', 'query', 'body', 'prior-response'])
const LIFETIMES = new Set(['static', 'request', 'step', 'one-time'])
const HEADER_CATEGORIES = [
  'authentication',
  'scope',
  'media-type',
  'locale',
  'version-concurrency',
  'idempotency',
  'signature-timestamp-nonce',
  'csrf-session',
  'gateway-context',
]
const FAILURE_CATEGORIES = new Set(['request-context', 'client-config', 'transport', 'auth', 'business'])
const SAFE_READ_METHODS = new Set(['GET', 'HEAD'])

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export function validateRequestContextManifest(manifest = {}) {
  const inputs = Array.isArray(manifest.inputs) ? manifest.inputs : []
  const errors = []

  if (inputs.length === 0) errors.push('manifest must declare at least one request input')
  inputs.forEach((input, index) => {
    const label = `inputs[${index}]`
    if (!input || typeof input !== 'object') {
      errors.push(`${label} must be an object`)
      return
    }
    for (const field of ['name', 'source', 'provider', 'validation', 'redaction']) {
      if (!isNonEmptyString(input[field])) errors.push(`${label}.${field} is required`)
    }
    if (!LOCATIONS.has(input.location)) errors.push(`${label}.location is invalid`)
    if (!CLASSIFICATIONS.has(input.classification)) errors.push(`${label}.classification is invalid`)
    if (!LIFETIMES.has(input.lifetime)) errors.push(`${label}.lifetime is invalid`)
    if (input.required !== true && input.required !== false) errors.push(`${label}.required must be boolean`)
    if (input.freshness === 'stale-reusable') errors.push(`${label} cannot use stale reusable values`)
    if (input.required === true && input.provider === 'unresolved') errors.push(`${label} has unresolved provider`)
    if (DERIVED_CLASSIFICATIONS.has(input.classification) && input.lifetime === 'static') {
      errors.push(`${label}.lifetime cannot be static for derived values`)
    }
    if (input.headerCategory != null && !HEADER_CATEGORIES.includes(input.headerCategory)) {
      errors.push(`${label}.headerCategory is invalid`)
    }
  })

  const duplicateNames = inputs
    .map((input) => input?.name)
    .filter((name, index, names) => name && names.indexOf(name) !== index)
  if (duplicateNames.length > 0) errors.push(`duplicate input names: ${[...new Set(duplicateNames)].join(', ')}`)

  const headerCategories = manifest.headerCategories && typeof manifest.headerCategories === 'object'
    ? manifest.headerCategories
    : {}
  for (const category of HEADER_CATEGORIES) {
    const decision = headerCategories[category]
    if (!decision || !['applicable', 'omitted'].includes(decision.status) || !isNonEmptyString(decision.source)) {
      errors.push(`headerCategories.${category} must be applicable or omitted with a source`)
      continue
    }
    if (decision.status === 'omitted' && !isNonEmptyString(decision.reason)) {
      errors.push(`headerCategories.${category}.reason is required when omitted`)
    }
    if (decision.status === 'applicable') {
      const provided = inputs.some((input) => input && input.headerCategory === category && isNonEmptyString(input.provider) && input.provider !== 'unresolved')
      if (!provided) errors.push(`headerCategories.${category} is applicable but has no matching input provider`)
    }
  }

  const relationships = Array.isArray(manifest.relationships) ? manifest.relationships : []
  const inputsByName = new Map(inputs.filter((input) => input && isNonEmptyString(input.name)).map((input) => [input.name, input]))
  for (const [index, relationship] of relationships.entries()) {
    const names = Array.isArray(relationship?.names) ? relationship.names : []
    if (relationship?.rule !== 'same-context' || names.length < 2) {
      errors.push(`relationships[${index}] must declare same-context names`)
      continue
    }
    const keys = names.map((name) => inputsByName.get(name)?.relationKey)
    if (keys.some((key) => !isNonEmptyString(key)) || new Set(keys).size > 1) {
      errors.push(`relationships[${index}] same-context aliases do not match`)
    }
  }

  return errors.length === 0
    ? { status: 'ready', category: null, errors: [] }
    : { status: 'blocked', category: 'request-context', errors }
}

function hasUnsafeMethod(operation = {}) {
  if (!isNonEmptyString(operation.method)) return false
  const method = operation.method.trim().toUpperCase()
  if (SAFE_READ_METHODS.has(method)) return false
  return operation.readOnlyByContract !== true
}

function hasRunnerCoverageEvidence(projectRunner) {
  return isNonEmptyString(projectRunner?.source)
    && isNonEmptyString(projectRunner?.method)
    && isNonEmptyString(projectRunner?.pathTemplate)
    && isNonEmptyString(projectRunner?.assertionSource)
}

export function canUseSingleRequestFallback(operation = {}) {
  const forbidden = Boolean(
    operation.stateChanging ||
    operation.multiStep ||
    operation.requiresReadBack ||
    operation.requiresRestoration ||
    operation.requiresDynamicValues ||
    operation.requiresCrossFieldValidation ||
    hasUnsafeMethod(operation),
  )
  return {
    eligible: !forbidden,
    reason: forbidden ? 'operation requires a project runner' : 'single bounded request is eligible',
  }
}

export function resolveSmokeCarrier({ operation = {}, manifest = {}, projectRunner = null, fallback = null } = {}) {
  const context = validateRequestContextManifest(manifest)
  if (context.status !== 'ready') return { status: 'blocked', carrier: null, category: context.category, errors: context.errors }
  if (projectRunner?.validated === true && projectRunner.coversContext === true) {
    if (!hasRunnerCoverageEvidence(projectRunner)) {
      return {
        status: 'blocked',
        carrier: null,
        category: 'request-context',
        errors: ['project runner is missing method, path template, or assertion coverage evidence'],
      }
    }
    return { status: 'ready', carrier: 'project-runner', category: null, source: projectRunner.source }
  }
  if (projectRunner) {
    return {
      status: 'blocked',
      carrier: null,
      category: 'request-context',
      errors: ['discovered project runner must be validated and cover the request context before fallback'],
    }
  }
  const hasDynamicContext = (manifest.inputs || []).some((input) => DERIVED_CLASSIFICATIONS.has(input?.classification))
  const fallbackDecision = canUseSingleRequestFallback({ ...operation, requiresDynamicValues: operation.requiresDynamicValues || hasDynamicContext })
  if (fallbackDecision.eligible && fallback?.validated === true) {
    return { status: 'ready', carrier: 'single-request-curl', category: null, source: fallback.source || null }
  }
  return {
    status: 'blocked',
    carrier: null,
    category: 'request-context',
    errors: ['no validated project runner', fallbackDecision.reason],
  }
}

export function classifySmokeOutcome({ clientError = null, statusCode = null } = {}) {
  if (clientError === 'request-context') return { category: 'request-context', retry: 'resolve missing or contradictory request inputs' }
  if (clientError === 'parse') return { category: 'client-config', retry: 'reproduce against the token-free carrier before changing it' }
  if (clientError === 'transport') return { category: 'transport', retry: 'retain the carrier and verify target runtime health' }
  if (statusCode === 401 || statusCode === 403) return { category: 'auth', retry: 'renew the same credential reference' }
  if (typeof statusCode === 'number' && statusCode >= 500) return { category: 'transport', retry: 'retain the carrier and verify target runtime health' }
  if (typeof statusCode === 'number' && statusCode >= 400) return { category: 'business', retry: 'inspect the contract assertion without changing carrier' }
  if (typeof statusCode === 'number' && statusCode >= 200 && statusCode < 300) return { category: 'passed', retry: null }
  return { category: null, retry: null }
}

export function evaluateCredentialReadiness({ fileReferenceReady = false, envName = null, envVisible = false } = {}) {
  if (fileReferenceReady === true) return { ready: true, reason: 'opaque file reference is ready' }
  if (isNonEmptyString(envName) && envVisible === true) return { ready: true, reason: 'environment variable is visible to the executing process' }
  if (isNonEmptyString(envName) && envVisible !== true) {
    return { ready: false, reason: 'environment variable is not visible to the same-process executor' }
  }
  return { ready: false, reason: 'no process-visible credential reference is ready' }
}

export function isFailureCategory(value) {
  return FAILURE_CATEGORIES.has(value)
}
