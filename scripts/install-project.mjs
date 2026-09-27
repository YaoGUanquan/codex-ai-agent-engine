#!/usr/bin/env node
import { closeSync, cpSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { withLocalOperationLock } from '../plugins/ai-agent-engine-codex/scripts/local-operation-lock.mjs'
import { assertCanonicalContained, readBoundedText } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/utils.mjs'
import { fingerprintManagedPath } from '../plugins/ai-agent-engine-codex/scripts/path-fingerprint.mjs'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = realpathSync(resolve(dirname(__filename), '..'))
const args = process.argv.slice(2)
const targetArg = readRequiredArg('--target')
const recoverId = readArg('--recover')
const failurePhase = readArg('--fail-at')
const pluginName = 'ai-agent-engine-codex'
const sourcePlugin = resolve(repoRoot, 'plugins', pluginName)
const sourceTemplates = resolve(repoRoot, 'docs', 'ae', 'templates')
const removedSkillNames = ['ae-officecli', 'ae-docx', 'ae-xlsx', 'ae-pptx', 'ae-computer-use-guard', 'ae-video-edit-computer']
const removedScriptNames = ['check-officecli-available.mjs', 'check-officecli-smoke.mjs']
const supportedLangs = new Set(['en', 'zh-CN', 'bilingual'])

if (!existsSync(sourcePlugin)) fail(`source plugin not found: ${sourcePlugin}`)

const targetRoot = prepareTargetRoot(targetArg)
if (targetRoot === repoRoot || overlaps(targetRoot, sourcePlugin)) fail('refusing to install into the distribution source or an overlapping path; choose a consumer project target')
const lang = readArg('--lang') || readInstalledLang(targetRoot) || 'bilingual'
if (!supportedLangs.has(lang)) fail('Usage: node scripts/install-project.mjs --target <project> [--lang en|zh-CN|bilingual] [--replace-modified]')

const paths = targetPaths(targetRoot)
const replaceModified = args.includes('--replace-modified')
let outcome
try {
  assertManagedPath(paths.lock)
  mkdirSync(dirname(paths.lock), { recursive: true })
  outcome = withLocalOperationLock(paths.lock, () => {
    if (recoverId) return recoverOperation(recoverId)
    if (existsSync(paths.active)) {
      const active = JSON.parse(readBoundedText(paths.active, 16384).text)
      throw new Error(`unfinished project install ${active.id}; inspect its journal and use --recover ${active.id} before retrying`)
    }
    const priorState = loadState(paths.state)
    const components = sourceComponents(paths)
    const marketplace = prepareMarketplace(paths.marketplace)
    const removals = priorOwnedRetirements(paths, priorState)
    preflight(components, marketplace, removals, priorState, replaceModified)
    const operation = stageOperation(paths, components, marketplace, removals)
    try {
      prepareOperation(operation, components, marketplace)
      injectFailure('staged')
      applyComponents(operation)
      operation.phase = 'completed'
      saveOperation(operation)
    } catch (error) {
      operation.error = error.message
      try {
        restoreOperation(operation)
      } catch (recoveryError) {
        operation.phase = 'recovery-failed'
        operation.recoveryError = recoveryError.message
        saveOperation(operation)
        throw new Error(`${error.message}; rollback failed (recovery-failed): ${recoveryError.message}; inspect ${operation.journal} and use --recover ${operation.id}`)
      }
      throw new Error(`${error.message}; rollback completed (rolled-back); operation ${operation.id}; journal ${operation.journal}`)
    }
    finishOperation(operation)
    return { status: 'installed', operationId: operation.id, journal: toPosix(relative(targetRoot, operation.journal)), source_revision: operation.sourceRevision, source_fingerprint: operation.sourceFingerprint, activation: 'journaled-component-swap', phase: operation.phase }
  }, { owner: 'project installer', leaseMs: 300000 })
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}

console.log(JSON.stringify({
  ...outcome,
  targetRoot,
  plugin: 'plugins/ai-agent-engine-codex',
  marketplace: '.agents/plugins/marketplace.json',
  skills: '.agents/skills',
  wrapper: 'scripts/ae-tools.mjs',
  updater: 'scripts/update-ae-codex.mjs',
  languageSetter: 'scripts/set-ae-language.mjs',
  artifactChecker: 'scripts/check-ae-artifacts.mjs',
  designContractChecker: 'scripts/check-design-contract.mjs',
  memoryKnowledgeChecker: 'scripts/check-memory-knowledge-contract.mjs',
  state: '.agents/ai-agent-engine-codex/project-install.json',
  lang,
}, null, 2))

function targetPaths(root) {
  const scripts = resolve(root, 'scripts')
  return {
    root,
    plugin: resolve(root, 'plugins', pluginName),
    skills: resolve(root, '.agents', 'skills'),
    marketplace: resolve(root, '.agents', 'plugins', 'marketplace.json'),
    templates: resolve(root, 'docs', 'ae', 'templates'),
    scripts,
    state: resolve(root, '.agents', pluginName, 'project-install.json'),
    stageRoot: resolve(root, '.agents', pluginName, 'project-install-staging'),
    lock: resolve(root, '.agents', pluginName, 'project-install.lock'),
    active: resolve(root, '.agents', pluginName, 'active-operation.json'),
    operations: resolve(root, '.agents', pluginName, 'project-install-operations'),
  }
}

function sourceComponents(paths) {
  const entries = [{ source: sourcePlugin, target: paths.plugin }]
  const sourceSkills = resolve(sourcePlugin, 'skills')
  for (const name of listDirs(sourceSkills)) entries.push({ source: resolve(sourceSkills, name), target: resolve(paths.skills, name) })
  const wrappers = {
    'ae-tools.mjs': "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/ae-tools.mjs'\n",
    'update-ae-codex.mjs': "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/update-project.mjs'\n",
    'set-ae-language.mjs': "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/set-language.mjs'\n",
    'check-ae-artifacts.mjs': "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs'\n",
    'check-design-contract.mjs': "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/check-design-contract.mjs'\n",
    'check-memory-knowledge-contract.mjs': "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/check-memory-knowledge-contract.mjs'\n",
  }
  for (const [name, text] of Object.entries(wrappers)) entries.push({ target: resolve(paths.scripts, name), text })
  if (existsSync(sourceTemplates)) {
    for (const rel of listFiles(sourceTemplates)) entries.push({ source: resolve(sourceTemplates, rel), target: resolve(paths.templates, rel) })
  }
  return entries.map((entry) => ({ ...entry, rel: toPosix(relative(paths.root, entry.target)) }))
}

function prepareMarketplace(target) {
  assertManagedPath(target)
  const value = existsSync(target) ? JSON.parse(readBoundedText(target).text) : { name: 'local-codex-plugins', interface: { displayName: 'Local Codex Plugins' }, plugins: [] }
  if (!Array.isArray(value.plugins)) throw new Error(`marketplace plugins must be an array: ${target}`)
  const entry = { name: pluginName, source: { source: 'local', path: `./plugins/${pluginName}` }, policy: { installation: 'INSTALLED_BY_DEFAULT', authentication: 'ON_INSTALL' }, category: 'Coding' }
  const idx = value.plugins.findIndex((plugin) => plugin?.name === pluginName)
  if (idx >= 0) value.plugins[idx] = entry
  else value.plugins.push(entry)
  return { target, rel: '.agents/plugins/marketplace.json', value }
}

function priorOwnedRetirements(paths, state) {
  if (!state) return []
  return [...removedSkillNames.map((name) => resolve(paths.skills, name)), ...removedScriptNames.map((name) => resolve(paths.scripts, name))].filter((target) => {
    if (!existsSync(target)) return false
    const rel = toPosix(relative(paths.root, target))
    return state.components?.[rel] === fingerprintPath(target)
  })
}

function preflight(components, marketplace, removals, state, allowModified) {
  for (const target of [...components.map((component) => component.target), marketplace.target, paths.state, ...removals]) assertManagedPath(target)
  for (const component of components) verifyReplaceable(component.target, component.rel, state, allowModified)
  const previousMarketplace = state?.components?.[marketplace.rel]
  if (existsSync(marketplace.target) && previousMarketplace && previousMarketplace !== fingerprintPath(marketplace.target) && !allowModified) throw new Error(`refusing to replace modified managed component: ${marketplace.rel}; rerun with --replace-modified after reviewing the target`)
  if (existsSync(marketplace.target) && !previousMarketplace) {
    const current = JSON.parse(readFileSync(marketplace.target, 'utf8'))
    if (Array.isArray(current.plugins) && current.plugins.some((plugin) => plugin?.name === pluginName) && !allowModified) throw new Error(`refusing to replace unowned managed component: ${marketplace.rel}; rerun with --replace-modified after reviewing the target`)
  }
  for (const target of removals) assertNotLink(target)
}

function verifyReplaceable(target, rel, state, allowModified) {
  if (!existsSync(target)) return
  assertNotLink(target)
  if (state?.components?.[rel] === fingerprintPath(target)) return
  if (allowModified) return
  throw new Error(`refusing to replace unowned or modified managed component: ${rel}; rerun with --replace-modified after reviewing the target`)
}

function stageOperation(paths, components, marketplace, removals) {
  const id = randomUUID()
  const stage = resolve(paths.stageRoot, id)
  const journal = resolve(paths.operations, `${id}.json`)
  const operation = {
    schemaVersion: 1, id, stage, journal, targetRoot, phase: 'staging', createdAt: new Date().toISOString(),
    sourceRevision: sourceRevision(), sourceFingerprint: fingerprintPath(sourcePlugin), changes: [],
  }
  const targets = [...components.map((component) => component.target), marketplace.target, ...removals, paths.state]
  operation.changes = [...new Set(targets)].map((target, index) => {
    const rel = toPosix(relative(targetRoot, target))
    return { rel, before: existsSync(target) ? fingerprintPath(target) : null, after: null, backup: resolve(stage, 'old', String(index)), staged: removals.includes(target) ? null : resolve(stage, 'new', rel), phase: 'pending' }
  })
  assertManagedPath(stage)
  mkdirSync(stage, { recursive: true })
  saveOperation(operation)
  writeState(paths.active, { id })
  return operation
}

function prepareOperation(operation, components, marketplace) {
  const stagedRoot = resolve(operation.stage, 'new')
  const sources = new Map()
  for (const component of components) {
    const target = resolve(stagedRoot, component.rel)
    assertManagedPath(target)
    mkdirSync(dirname(target), { recursive: true })
    if (component.source) {
      const expected = fingerprintPath(component.source)
      cpSync(component.source, target, { recursive: true, errorOnExist: true, force: false })
      if (fingerprintPath(target) !== expected) throw new Error(`staged fingerprint mismatch: ${component.rel}`)
      sources.set(component.source, expected)
    } else writeFileSync(target, component.text, { encoding: 'utf8', flag: 'wx' })
  }
  writeState(resolve(stagedRoot, marketplace.rel), marketplace.value)
  runLanguageSetter(lang, stagedRoot)
  const validation = spawnSync(process.execPath, [resolve(stagedRoot, 'scripts', 'ae-tools.mjs'), 'help'], { cwd: stagedRoot, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024, shell: false })
  if (validation.error || validation.status !== 0) throw new Error(`staged CLI validation failed: ${validation.error?.message || validation.stderr}`)
  for (const [source, expected] of sources) if (fingerprintPath(source) !== expected) throw new Error('source changed while staging; retry with a stable source')
  if (fingerprintPath(sourcePlugin) !== operation.sourceFingerprint) throw new Error('source plugin changed while staging')
  const replacements = [...components.map((component) => component.rel), marketplace.rel]
  const state = {
    schemaVersion: 1, pluginVersion: readPluginVersion(), installedAt: new Date().toISOString(),
    operationId: operation.id, sourceRevision: operation.sourceRevision, sourceFingerprint: operation.sourceFingerprint,
    components: Object.fromEntries(replacements.map((rel) => [rel, fingerprintPath(resolve(stagedRoot, rel))])),
  }
  const stateRel = toPosix(relative(targetRoot, paths.state))
  writeState(resolve(stagedRoot, stateRel), state)
  for (const change of operation.changes) change.after = change.staged ? fingerprintPath(change.staged) : null
  operation.phase = 'prepared'
  saveOperation(operation)
}

function applyComponents(operation) {
  operation.phase = 'activating'
  saveOperation(operation)
  for (const [index, change] of operation.changes.entries()) {
    const target = resolve(targetRoot, change.rel)
    assertManagedPath(target)
    const current = existsSync(target) ? fingerprintPath(target) : null
    if (current !== change.before) throw new Error(`target changed after staging: ${change.rel}`)
    if (change.staged && fingerprintPath(change.staged) !== change.after) throw new Error(`staged component changed: ${change.rel}`)
    change.phase = 'moving-old'
    saveOperation(operation)
    if (change.before) moveManaged(target, change.backup)
    injectFailure(`moved-old:${index}`)
    if (change.staged) moveManaged(change.staged, target)
    change.phase = 'activated'
    saveOperation(operation)
    injectFailure(`activated:${index}`)
  }
}

function restoreOperation(operation) {
  operation.phase = 'rolling-back'
  saveOperation(operation)
  for (const change of [...operation.changes].reverse()) {
    if (change.phase === 'pending' || change.phase === 'restored') continue
    const target = resolve(targetRoot, change.rel)
    assertManagedPath(target)
    assertManagedPath(change.backup)
    const current = existsSync(target) ? fingerprintPath(target) : null
    if (current === change.before && !existsSync(change.backup)) {
      change.phase = 'restored'
      saveOperation(operation)
      continue
    }
    if (current !== null && current !== change.after) throw new Error(`recovery conflict; target changed: ${change.rel}`)
    if (change.before && (!existsSync(change.backup) || fingerprintPath(change.backup) !== change.before)) throw new Error(`missing or modified backup: ${change.rel}`)
    if (current !== null) {
      const discard = resolve(operation.stage, 'discard', String(operation.changes.indexOf(change)))
      if (existsSync(discard)) throw new Error(`recovery discard conflict: ${change.rel}`)
      moveManaged(target, discard)
    }
    if (change.before) moveManaged(change.backup, target)
    change.phase = 'restored'
    saveOperation(operation)
  }
  operation.phase = 'rolled-back'
  saveOperation(operation)
  finishOperation(operation)
}

function recoverOperation(id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('--recover requires an operation UUID')
  const journal = resolve(paths.operations, `${id}.json`)
  assertManagedPath(journal)
  const operation = JSON.parse(readBoundedText(journal).text)
  if (operation.id !== id || operation.targetRoot !== targetRoot || operation.journal !== journal || operation.stage !== resolve(paths.stageRoot, id) || !Array.isArray(operation.changes)) throw new Error('invalid recovery journal identity')
  for (const [index, change] of operation.changes.entries()) {
    if (typeof change.rel !== 'string' || !isInside(targetRoot, resolve(targetRoot, change.rel)) || change.backup !== resolve(operation.stage, 'old', String(index))) throw new Error('invalid recovery change path')
    if (change.staged !== null && change.staged !== resolve(operation.stage, 'new', change.rel)) throw new Error('invalid recovery staging path')
  }
  if (['completed', 'rolled-back'].includes(operation.phase)) {
    finishOperation(operation)
    return { status: operation.phase, operationId: id }
  }
  const active = existsSync(paths.active) ? JSON.parse(readBoundedText(paths.active, 16384).text) : null
  if (active?.id !== id) throw new Error('recovery operation is not the active operation; refusing to alter the target')
  restoreOperation(operation)
  return { status: 'rolled-back', operationId: id }
}

function saveOperation(operation) { writeState(operation.journal, operation) }
function finishOperation(operation) {
  assertManagedPath(operation.stage)
  if (existsSync(operation.stage)) rmSync(operation.stage, { recursive: true, force: true })
  assertManagedPath(paths.active)
  if (existsSync(paths.active) && JSON.parse(readBoundedText(paths.active, 16384).text).id === operation.id) rmSync(paths.active)
}
function moveManaged(source, target) {
  assertManagedPath(source)
  assertManagedPath(target)
  mkdirSync(dirname(target), { recursive: true })
  renameSync(source, target)
}
function assertManagedPath(path) {
  if (!isInside(targetRoot, path) || samePath(targetRoot, path)) throw new Error(`managed path escapes target: ${path}`)
  let current = path
  while (!samePath(current, targetRoot)) { assertNotLink(current); current = dirname(current) }
  assertCanonicalContained(targetRoot, path, 'managed path')
}
function injectFailure(phase) {
  if (failurePhase === phase) throw new Error(`injected failure at ${phase}`)
}
function sourceRevision() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', timeout: 10000, maxBuffer: 65536, shell: false })
  return result.status === 0 ? result.stdout.trim() : null
}

function loadState(path) {
  assertManagedPath(path)
  if (!existsSync(path)) return null
  assertNotLink(path)
  const state = JSON.parse(readBoundedText(path).text)
  if (state?.schemaVersion !== 1 || !state.components || typeof state.components !== 'object') throw new Error(`invalid project installer state: ${path}`)
  return state
}

function writeState(path, value) {
  assertManagedPath(path)
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${randomUUID()}.tmp`
  const fd = openSync(temp, 'wx')
  try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); fsyncSync(fd) } finally { closeSync(fd) }
  try { renameSync(temp, path) } finally { if (existsSync(temp)) rmSync(temp) }
}

function prepareTargetRoot(input) {
  const requested = resolve(input)
  if (existsSync(requested)) { assertNotLink(requested); if (!statSync(requested).isDirectory()) fail(`target is not a directory: ${requested}`) }
  else mkdirSync(requested, { recursive: true })
  const canonical = realpathSync(requested)
  if (!samePath(canonical, requested)) fail(`target must not resolve through a symbolic link or junction: ${requested}`)
  return canonical
}

function readRequiredArg(name) {
  const value = readArg(name)
  if (!value) fail('Usage: node scripts/install-project.mjs --target <project> [--lang en|zh-CN|bilingual] [--replace-modified]')
  return value
}

function readArg(name) {
  const idx = args.indexOf(name)
  if (idx < 0) return null
  const value = args[idx + 1]
  if (!value || value.startsWith('--')) fail(`${name} requires a value`)
  return value
}

function listDirs(path) { return existsSync(path) ? readdirSync(path, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [] }
function listFiles(root, prefix = '') {
  const out = []
  for (const entry of readdirSync(resolve(root, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...listFiles(root, rel))
    else if (entry.isFile()) out.push(rel)
  }
  return out
}

function fingerprintPath(path) {
  const fingerprint = fingerprintManagedPath(path)
  if (!fingerprint) throw new Error(`fingerprint source is missing: ${path}`)
  return fingerprint.sha256
}
function assertNotLink(path) {
  let stat
  try { stat = lstatSync(path) } catch (error) { if (error.code === 'ENOENT') return; throw error }
  if (stat.isSymbolicLink()) throw new Error(`symbolic link or junction is not allowed in managed path: ${path}`)
}
function overlaps(left, right) { return isInside(left, right) || isInside(right, left) }
function isInside(root, target) { const rel = relative(root, target); return rel === '' || (!isAbsolute(rel) && !rel.startsWith('..') && !rel.includes(`..${sep}`)) }
function samePath(left, right) { return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right }
function readPluginVersion() { return JSON.parse(readFileSync(resolve(sourcePlugin, '.codex-plugin', 'plugin.json'), 'utf8')).version }
function readInstalledLang(targetRoot) {
  const file = resolve(targetRoot, '.agents', 'skills', 'ae-help', 'agents', 'openai.yaml')
  if (!existsSync(file)) return null
  const content = readFileSync(file, 'utf8')
  if (content.includes('查看 Codex 中可用的 AE 工作流能力 / List AE workflow capabilities for Codex')) return 'bilingual'
  if (content.includes('查看 Codex 中可用的 AE 工作流能力')) return 'zh-CN'
  if (content.includes('List AE workflow capabilities for Codex')) return 'en'
  return null
}
function runLanguageSetter(language, targetRoot) {
  const script = resolve(targetRoot, 'plugins', pluginName, 'scripts', 'set-language.mjs')
  const result = spawnSync(process.execPath, [script, '--target', targetRoot, '--lang', language], { stdio: 'pipe', encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024, shell: false })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`language setter failed with status ${result.status ?? 1}`)
}
function toPosix(path) { return path.replace(/\\/g, '/') }
function fail(message) { console.error(message); process.exit(1) }
