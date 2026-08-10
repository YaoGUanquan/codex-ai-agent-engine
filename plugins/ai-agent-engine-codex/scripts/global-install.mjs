#!/usr/bin/env node
import { closeSync, cpSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import {
  aeSkillComponents,
  allowedConsumerComponents,
  buildFirstBatchManifest,
  fingerprintPath,
  isInside,
  normalizeManifest,
  operationId,
  pluginName,
  terminalOperationStates,
  userPaths,
} from './global-install-contract.mjs'

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultSourceRoot = resolve(scriptRoot, '..', '..')

export function runGlobalInstall(argv = process.argv.slice(2), { repoRoot = defaultSourceRoot } = {}) {
  const [command = 'preview', ...args] = argv
  const opts = parseOptions(args)
  const home = opts.home || undefined
  const paths = userPaths(home)
  if (command === 'preview') return preview({ opts, repoRoot, paths })
  if (command === 'apply') return apply({ opts, repoRoot, paths })
  if (command === 'recover') return recover({ opts, paths })
  if (command === 'purge') return purge({ opts, paths })
  throw new Error('Usage: global-install <preview|apply|recover|purge> [--manifest <path>] [--home <path>]')
}

function preview({ opts, repoRoot, paths }) {
  const manifest = loadManifest(opts.manifest, repoRoot)
  const normalized = normalizeManifest(manifest, { repoRoot, home: paths.homeRoot, allowCustomConsumers: Boolean(opts.manifest) })
  const operation = operationId()
  return {
    status: 'preview',
    operationId: operation,
    confirmation: confirmationFor(normalized),
    homeRoot: paths.homeRoot,
    runtimeRoot: paths.runtimeRoot,
    projects: normalized.projects.map((project) => ({
      root: project.root,
      role: project.role,
      components: project.role === 'consumer' ? inspectConsumer(project.root, repoRoot) : [],
    })),
    notes: [
      'Preview does not modify files.',
      'Apply requires --apply --operation <preview-id> --confirm <confirmation>; operation IDs are recorded only when apply begins.',
      'Project docs, AGENTS.md, source code, distribution-source, and deferred roots are outside the cleanup set.',
    ],
  }
}

function apply({ opts, repoRoot, paths }) {
  if (opts.apply !== true || !opts.operation || !opts.confirm) {
    throw new Error('apply requires --apply --operation <preview-id> --confirm <preview-confirmation>')
  }
  recoverInterrupted(paths)
  const manifest = loadManifest(opts.manifest, repoRoot)
  const normalized = normalizeManifest(manifest, { repoRoot, home: paths.homeRoot, allowCustomConsumers: Boolean(opts.manifest) })
  if (opts.confirm !== confirmationFor(normalized)) throw new Error('preview confirmation does not match the current manifest and source root')
  const operation = { id: opts.operation, status: 'in-progress', phase: 'preflight', createdAt: new Date().toISOString(), paths, sourceRoot: normalized.sourceRoot, manifest: normalized, changes: [], failAt: opts['fail-at'] || null }
  const journal = journalPath(paths, operation.id)
  if (existsSync(journal)) throw new Error(`operation journal already exists: ${operation.id}`)
  operation.journal = journal
  try {
    ensureUserTargetsAreSafe(paths, repoRoot)
    preflightConsumers(normalized, repoRoot)
    operation.protectedProjectState = captureProtectedProjectState(normalized.projects)
    writeJournal(journal, operation)
    operation.phase = 'stage-runtime'
    stageRuntime(operation, repoRoot)
    writeJournal(journal, operation)
    injectFailure(operation, 'stage-runtime')
    operation.phase = 'backup-user-skills'
    backupExistingUserSkills(operation)
    writeJournal(journal, operation)
    injectFailure(operation, 'backup-user-skills')
    operation.phase = 'cleanup-consumers'
    for (const project of normalized.projects.filter((item) => item.role === 'consumer')) cleanConsumer(operation, project.root, repoRoot)
    verifyProtectedProjectState(operation.protectedProjectState)
    writeJournal(journal, operation)
    injectFailure(operation, 'cleanup-consumers')
    operation.phase = 'activate-global-skills'
    activateGlobalRuntime(operation, repoRoot)
    verifyProtectedProjectState(operation.protectedProjectState)
    removeStage(operation)
    injectFailure(operation, 'activate-global-skills')
    operation.status = 'completed'
    operation.phase = 'completed'
    writeJournal(journal, operation)
    return report(operation)
  } catch (error) {
    operation.error = error instanceof Error ? error.message : String(error)
    operation.phase = 'rolling-back'
    writeJournal(journal, operation)
    try {
      rollback(operation)
      operation.status = 'rolled-back'
      operation.phase = 'rolled-back'
    } catch (rollbackError) {
      operation.status = 'recovery-failed'
      operation.phase = 'recovery-failed'
      operation.recoveryError = rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
    }
    writeJournal(journal, operation)
    const failure = new Error(`${operation.status}: ${operation.error}`)
    failure.operation = report(operation)
    throw failure
  }
}

function recover({ opts, paths }) {
  if (!opts.operation) throw new Error('recover requires --operation <id>')
  const journal = journalPath(paths, opts.operation)
  if (!existsSync(journal)) throw new Error(`operation journal not found: ${opts.operation}`)
  const operation = readJson(journal)
  if (terminalOperationStates.has(operation.status)) return report(operation)
  rollback(operation)
  operation.status = 'rolled-back'
  operation.phase = 'rolled-back'
  writeJournal(journal, operation)
  return report(operation)
}

function purge({ opts, paths }) {
  if (!opts.operation) throw new Error('purge requires --operation <id>')
  const journal = journalPath(paths, opts.operation)
  if (!existsSync(journal)) throw new Error(`operation journal not found: ${opts.operation}`)
  const operation = readJson(journal)
  if (!terminalOperationStates.has(operation.status)) throw new Error(`cannot purge non-terminal operation: ${operation.status}`)
  const backupRoot = backupPath(paths, opts.operation)
  if (opts.apply !== true) return { status: 'purge-preview', operationId: opts.operation, journal, backupRoot, operationStatus: operation.status }
  if (existsSync(backupRoot)) rmSync(backupRoot, { recursive: true, force: false })
  rmSync(journal, { force: false })
  return { status: 'purged', operationId: opts.operation }
}

function recoverInterrupted(paths) {
  if (!existsSync(paths.operationsRoot)) return
  for (const name of readDirectory(paths.operationsRoot)) {
    if (!name.endsWith('.json')) continue
    const operation = readJson(resolve(paths.operationsRoot, name))
    if (operation.status === 'in-progress' || operation.status === 'rolling-back' || operation.status === 'interrupted') {
      rollback(operation)
      operation.status = 'rolled-back'
      operation.phase = 'rolled-back'
      writeJournal(resolve(paths.operationsRoot, name), operation)
    }
  }
}

function ensureUserTargetsAreSafe(paths, repoRoot) {
  if (!isInside(paths.homeRoot, paths.agentsRoot) || !isInside(paths.homeRoot, paths.runtimeRoot)) throw new Error('global paths escape the current user home')
  if (resolve(repoRoot) === paths.runtimeRoot || isInside(paths.runtimeRoot, resolve(repoRoot))) throw new Error('distribution source must not overlap the user runtime root')
  const unexpectedRuntimeEntries = existsSync(paths.runtimeRoot)
    ? readDirectory(paths.runtimeRoot).filter((name) => name !== 'operations' && name !== 'backups' && name !== 'staging')
    : []
  if (readDirectory(resolve(paths.runtimeRoot, 'staging')).length > 0) unexpectedRuntimeEntries.push('staging')
  if (unexpectedRuntimeEntries.length > 0) {
    throw new Error('existing global runtime is protected; recovery or explicit future update support is required')
  }
  const sourceSkills = resolve(repoRoot, 'plugins', pluginName, 'skills')
  for (const target of aeSkillComponents(paths.skillsRoot)) {
    const source = resolve(sourceSkills, basename(target))
    if (!existsSync(source) || fingerprintPath(target).sha256 !== fingerprintPath(source).sha256) {
      throw new Error(`existing user skill is unknown or modified: ${target}`)
    }
  }
}

function preflightConsumers(manifest, repoRoot) {
  for (const project of manifest.projects) {
    if (project.role !== 'consumer') continue
    if (project.root === manifest.sourceRoot || !existsSync(project.root)) throw new Error(`consumer root is invalid: ${project.root}`)
    for (const component of inspectConsumer(project.root, repoRoot)) {
      if (!component.owned) throw new Error(`consumer component is unknown or modified: ${component.path}`)
    }
  }
}

function inspectConsumer(root, repoRoot) {
  const sourcePlugin = resolve(repoRoot, 'plugins', pluginName)
  const results = []
  for (const component of allowedConsumerComponents(root)) {
    if (!existsSync(component)) continue
    const rel = relative(root, component).replace(/\\/g, '/')
    const source = rel === `plugins/${pluginName}` ? sourcePlugin : null
    const owned = source ? fingerprintPath(component).sha256 === fingerprintPath(source).sha256 : isKnownWrapper(component)
    results.push({ path: rel, owned, fingerprint: fingerprintPath(component) })
  }
  const skillsRoot = resolve(root, '.agents', 'skills')
  const sourceSkills = resolve(repoRoot, 'plugins', pluginName, 'skills')
  for (const component of aeSkillComponents(skillsRoot)) {
    const source = resolve(sourceSkills, basename(component))
    results.push({ path: relative(root, component).replace(/\\/g, '/'), owned: existsSync(source) && fingerprintPath(component).sha256 === fingerprintPath(source).sha256, fingerprint: fingerprintPath(component) })
  }
  return results
}

function isKnownWrapper(path) {
  if (!path.endsWith('.mjs')) return false
  return readFileSync(path, 'utf8').includes('ai-agent-engine-codex/scripts/')
}

function stageRuntime(operation, repoRoot) {
  const stage = resolve(operation.paths.runtimeRoot, 'staging', operation.id)
  const source = resolve(repoRoot, 'plugins', pluginName)
  mkdirSync(stage, { recursive: true })
  const stagedPlugin = resolve(stage, 'plugin')
  cpSync(source, stagedPlugin, { recursive: true, errorOnExist: true })
  if (fingerprintPath(stagedPlugin).sha256 !== fingerprintPath(source).sha256) throw new Error('staged runtime fingerprint mismatch')
  operation.stage = stage
}

function cleanConsumer(operation, root, repoRoot) {
  for (const component of inspectConsumer(root, repoRoot)) moveToBackup(operation, resolve(root, component.path), `consumers/${hashPath(root)}/${component.path}`)
  cleanMarketplace(operation, root)
}

function backupExistingUserSkills(operation) {
  for (const skill of aeSkillComponents(operation.paths.skillsRoot)) {
    moveToBackup(operation, skill, `user-skills/${basename(skill)}`)
  }
}

function cleanMarketplace(operation, root) {
  const target = resolve(root, '.agents', 'plugins', 'marketplace.json')
  if (!existsSync(target)) return
  const marketplace = readJson(target)
  if (!Array.isArray(marketplace.plugins)) throw new Error(`marketplace has no plugins array: ${target}`)
  const entries = marketplace.plugins.filter((entry) => entry?.name === pluginName)
  if (entries.length === 0) return
  if (entries.length !== 1 || entries[0]?.source?.path !== `./plugins/${pluginName}`) throw new Error(`marketplace AE entry is unknown or modified: ${target}`)
  const backup = resolve(backupPath(operation.paths, operation.id), `consumers/${hashPath(root)}/.agents/plugins/marketplace.json`)
  mkdirSync(dirname(backup), { recursive: true })
  cpSync(target, backup, { errorOnExist: true })
  const fingerprint = fingerprintPath(target)
  if (fingerprintPath(backup).sha256 !== fingerprint.sha256) throw new Error(`marketplace backup fingerprint mismatch: ${target}`)
  operation.changes.push({ source: target, target, backup, fingerprint, kind: 'replaced' })
  writeJournal(operation.journal, operation)
  writeFileSync(target, `${JSON.stringify({ ...marketplace, plugins: marketplace.plugins.filter((entry) => entry?.name !== pluginName) }, null, 2)}\n`, 'utf8')
}

function activateGlobalRuntime(operation, repoRoot) {
  const runtimePlugin = resolve(operation.paths.runtimeRoot, 'runtime', 'plugin')
  const stagedPlugin = resolve(operation.stage, 'plugin')
  mkdirSync(dirname(runtimePlugin), { recursive: true })
  operation.changes.push({ source: null, target: runtimePlugin, backup: null, kind: 'created' })
  writeJournal(operation.journal, operation)
  cpSync(stagedPlugin, runtimePlugin, { recursive: true, errorOnExist: true })
  if (fingerprintPath(runtimePlugin).sha256 !== fingerprintPath(stagedPlugin).sha256) throw new Error('runtime fingerprint mismatch')
  const bin = resolve(operation.paths.runtimeRoot, 'bin', 'ae.mjs')
  mkdirSync(dirname(bin), { recursive: true })
  operation.changes.push({ source: null, target: bin, backup: null, kind: 'created' })
  writeJournal(operation.journal, operation)
  writeFileSync(bin, '#!/usr/bin/env node\nimport { fileURLToPath } from \'node:url\'\nprocess.env.AE_RUNTIME_ROOT = fileURLToPath(new URL(\'../\', import.meta.url))\nawait import(\'../runtime/plugin/scripts/ae-tools.mjs\')\n', 'utf8')
  for (const name of readDirectory(resolve(runtimePlugin, 'skills'))) {
    const source = resolve(runtimePlugin, 'skills', name)
    if (!existsSync(source) || !basename(name).startsWith('ae-')) continue
    const target = resolve(operation.paths.skillsRoot, name)
    mkdirSync(dirname(target), { recursive: true })
    operation.changes.push({ source: null, target, backup: null, kind: 'created' })
    writeJournal(operation.journal, operation)
    cpSync(source, target, { recursive: true, errorOnExist: true })
  }
}

function moveToBackup(operation, source, backupRelative) {
  if (!existsSync(source)) return
  const before = fingerprintPath(source)
  const backup = resolve(backupPath(operation.paths, operation.id), backupRelative)
  mkdirSync(dirname(backup), { recursive: true })
  cpSync(source, backup, { recursive: true, errorOnExist: true })
  if (fingerprintPath(backup).sha256 !== before.sha256) throw new Error(`backup fingerprint mismatch: ${source}`)
  operation.changes.push({ source, target: source, backup, fingerprint: before, kind: 'moved' })
  writeJournal(operation.journal, operation)
  rmSync(source, { recursive: before.kind === 'directory', force: false })
  if (existsSync(source)) throw new Error(`failed to remove backed up component: ${source}`)
}

function rollback(operation) {
  for (const change of [...(operation.changes || [])].reverse()) {
    if (change.kind === 'created') {
      if (existsSync(change.target)) rmSync(change.target, { recursive: fingerprintPath(change.target)?.kind === 'directory', force: false })
      continue
    }
    if (!change.backup || !existsSync(change.backup)) throw new Error(`backup is missing: ${change.backup}`)
    if (change.kind === 'replaced' && existsSync(change.target)) rmSync(change.target, { force: false })
    else if (existsSync(change.target)) throw new Error(`refusing to overwrite unexpected restore target: ${change.target}`)
    mkdirSync(dirname(change.target), { recursive: true })
    cpSync(change.backup, change.target, { recursive: true, errorOnExist: true })
    if (fingerprintPath(change.target).sha256 !== change.fingerprint.sha256) throw new Error(`restore fingerprint mismatch: ${change.target}`)
  }
  removeStage(operation)
}

function removeStage(operation) {
  if (operation.stage && existsSync(operation.stage)) rmSync(operation.stage, { recursive: true, force: false })
}

function captureProtectedProjectState(projects) {
  return projects.map((project) => ({
    root: project.root,
    docs: fingerprintPath(resolve(project.root, 'docs')),
    agents: fingerprintPath(resolve(project.root, 'AGENTS.md')),
  }))
}

function verifyProtectedProjectState(states) {
  for (const state of states || []) {
    if (JSON.stringify(fingerprintPath(resolve(state.root, 'docs'))) !== JSON.stringify(state.docs)) throw new Error(`protected docs changed during migration: ${state.root}`)
    if (JSON.stringify(fingerprintPath(resolve(state.root, 'AGENTS.md'))) !== JSON.stringify(state.agents)) throw new Error(`protected AGENTS.md changed during migration: ${state.root}`)
  }
}

function loadManifest(path, repoRoot) {
  return path ? readJson(resolve(path)) : buildFirstBatchManifest(repoRoot)
}

function confirmationFor(manifest) {
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex')
}

function injectFailure(operation, phase) {
  if (operation.failAt === phase) throw new Error(`injected failure at ${phase}`)
}

function journalPath(paths, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('operation id must be a UUID')
  return resolve(paths.operationsRoot, `${id}.json`)
}

function backupPath(paths, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('operation id must be a UUID')
  return resolve(paths.runtimeRoot, 'backups', id)
}

function writeJournal(path, operation) {
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.tmp`
  writeFileSync(temp, `${JSON.stringify(serializable(operation), null, 2)}\n`, 'utf8')
  const descriptor = openSync(temp, 'r+')
  try { fsyncSync(descriptor) } finally { closeSync(descriptor) }
  renameSync(temp, path)
}

function serializable(operation) {
  return JSON.parse(JSON.stringify(operation))
}

function report(operation) {
  return { status: operation.status, operationId: operation.id, phase: operation.phase, journal: journalPath(operation.paths, operation.id), backupRoot: backupPath(operation.paths, operation.id), changes: operation.changes?.length || 0, error: operation.error || null }
}

function parseOptions(args) {
  const opts = {}
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (!arg.startsWith('--')) throw new Error(`unknown argument: ${arg}`)
    const key = arg.slice(2)
    if (['apply'].includes(key)) { opts[key] = true; continue }
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`)
    opts[key] = value
    index++
  }
  return opts
}

function hashPath(path) {
  return createHash('sha256').update(path).digest('hex').slice(0, 16)
}

function readDirectory(path) {
  return existsSync(path) ? readdirSync(path) : []
}

function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')) }

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(runGlobalInstall(), null, 2)) } catch (error) { console.error(error instanceof Error ? `ERROR: ${error.message}` : `ERROR: ${String(error)}`); process.exitCode = 1 }
}
