#!/usr/bin/env node
import { closeSync, cpSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import {
  aeSkillComponents,
  allowedConsumerComponents,
  assertCursorLinkTargetAllowed,
  buildFirstBatchManifest,
  classifyCursorSkills,
  currentSkillNames,
  cursorLinkType,
  expectedCursorSkillTarget,
  fingerprintPath,
  inspectCursorSkillEntry,
  isInside,
  isLinkEntry,
  isOwnedCursorSkillCopy,
  normalizeManifest,
  operationId,
  pluginName,
  userPaths,
} from './global-install-contract.mjs'

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultSourceRoot = resolve(scriptRoot, '..', '..')

export function runGlobalInstall(argv = process.argv.slice(2), { repoRoot = defaultSourceRoot, commandRunner = defaultCommandRunner } = {}) {
  const [command = 'preview', ...args] = argv
  const opts = parseOptions(args)
  const home = opts.home || undefined
  const paths = userPaths(home)
  if (command === 'preview') return preview({ opts, repoRoot, paths })
  if (command === 'apply') return apply({ opts, repoRoot, paths, commandRunner })
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
    confirmation: confirmationFor(normalized, opts, paths, repoRoot),
    homeRoot: paths.homeRoot,
    runtimeRoot: paths.runtimeRoot,
    personalPluginRoot: paths.personalPluginRoot,
    personalMarketplace: paths.personalMarketplace,
    cursorSkillsRoot: paths.cursorSkillsRoot,
    cursorSkills: classifyCursorSkills(paths, repoRoot),
    projects: normalized.projects.map((project) => ({
      root: project.root,
      role: project.role,
      components: project.role === 'consumer' ? inspectConsumer(project.root, repoRoot) : [],
    })),
    notes: [
      'Preview does not modify files.',
      'Apply requires --apply --operation <preview-id> --confirm <confirmation>; operation IDs are recorded only when apply begins.',
      'Project docs, AGENTS.md, source code, distribution-source, and deferred roots are outside the cleanup set.',
      'Modified or unknown components require the additional --retire-modified authorization and are always backed up before retirement.',
      'Cursor skill discovery uses ~/.cursor/skills/ae-* copies; a new Cursor chat is required to observe /ae after apply.',
    ],
  }
}

function apply({ opts, repoRoot, paths, commandRunner }) {
  if (opts.apply !== true || !opts.operation || !opts.confirm) {
    throw new Error('apply requires --apply --operation <preview-id> --confirm <preview-confirmation>')
  }
  recoverInterrupted(paths)
  const manifest = loadManifest(opts.manifest, repoRoot)
  const normalized = normalizeManifest(manifest, { repoRoot, home: paths.homeRoot, allowCustomConsumers: Boolean(opts.manifest) })
  if (opts.confirm !== confirmationFor(normalized, opts, paths, repoRoot)) throw new Error('preview confirmation does not match the current manifest, source root, or retirement authorization')
  const operation = { id: opts.operation, status: 'in-progress', phase: 'preflight', createdAt: new Date().toISOString(), paths, sourceRoot: normalized.sourceRoot, manifest: normalized, changes: [], failAt: opts['fail-at'] || null }
  const journal = journalPath(paths, operation.id)
  if (existsSync(journal)) throw new Error(`operation journal already exists: ${operation.id}`)
  operation.journal = journal
  try {
    ensureUserTargetsAreSafe(paths, repoRoot, opts)
    preflightConsumers(normalized, repoRoot, opts)
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
    operation.phase = 'backup-global-runtime'
    backupExistingGlobalRuntime(operation, repoRoot)
    writeJournal(journal, operation)
    injectFailure(operation, 'backup-global-runtime')
    operation.phase = 'cleanup-consumers'
    for (const project of normalized.projects.filter((item) => item.role === 'consumer')) cleanConsumer(operation, project.root, repoRoot)
    verifyProtectedProjectState(operation.protectedProjectState)
    writeJournal(journal, operation)
    injectFailure(operation, 'cleanup-consumers')
    operation.phase = 'activate-global-runtime'
    activateGlobalRuntime(operation, repoRoot)
    verifyProtectedProjectState(operation.protectedProjectState)
    operation.phase = 'publish-cursor-skills'
    publishCursorSkills(operation, repoRoot)
    writeJournal(journal, operation)
    injectFailure(operation, 'publish-cursor-skills')
    operation.phase = 'register-codex-plugin'
    registerCodexPlugin(operation, commandRunner)
    removeStage(operation)
    injectFailure(operation, 'register-codex-plugin')
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
  if (operation.status === 'completed' || operation.status === 'rolled-back') return report(operation)
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
  if (!['completed', 'rolled-back'].includes(operation.status)) throw new Error(`cannot purge operation before recovery completes: ${operation.status}`)
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

function ensureUserTargetsAreSafe(paths, repoRoot, opts) {
  if (!isInside(paths.homeRoot, paths.agentsRoot) || !isInside(paths.homeRoot, paths.runtimeRoot) || !isInside(paths.homeRoot, paths.personalPluginsRoot) || !isInside(paths.homeRoot, paths.personalPluginRoot) || !isInside(paths.homeRoot, paths.personalMarketplace) || !isInside(paths.homeRoot, paths.cursorSkillsRoot) || !isInside(paths.homeRoot, paths.cursorReservedSkillsRoot)) throw new Error('global paths escape the current user home')
  if (resolve(repoRoot) === paths.runtimeRoot || isInside(paths.runtimeRoot, resolve(repoRoot)) || resolve(repoRoot) === paths.personalPluginRoot || isInside(paths.personalPluginRoot, resolve(repoRoot))) throw new Error('distribution source must not overlap a user runtime or plugin root')
  const expectedRuntimeEntries = new Set(['operations', 'backups', 'staging', 'runtime', 'bin'])
  const unexpectedRuntimeEntries = existsSync(paths.runtimeRoot)
    ? readDirectory(paths.runtimeRoot).filter((name) => !expectedRuntimeEntries.has(name))
    : []
  if (readDirectory(resolve(paths.runtimeRoot, 'staging')).length > 0) unexpectedRuntimeEntries.push('staging')
  if (unexpectedRuntimeEntries.length > 0 || !knownGlobalRuntime(paths, repoRoot)) {
    if (opts['retire-modified'] === true) return
    throw new Error('existing global runtime is protected; recovery or explicit future update support is required')
  }
  if (!knownPersonalPlugin(paths, repoRoot) || !knownPersonalMarketplace(paths)) {
    if (opts['retire-modified'] === true) return
    throw new Error('existing personal Codex plugin source or marketplace entry is protected; use --retire-modified only after reviewing its backup')
  }
  const sourceSkills = resolve(repoRoot, 'plugins', pluginName, 'skills')
  for (const target of aeSkillComponents(paths.skillsRoot)) {
    const source = resolve(sourceSkills, basename(target))
    if (!existsSync(source) || fingerprintPath(target).sha256 !== fingerprintPath(source).sha256) {
      if (opts['retire-modified'] === true) continue
      throw new Error(`existing user skill is unknown or modified: ${target}`)
    }
  }
  for (const item of classifyCursorSkills(paths, repoRoot)) {
    if (item.status === 'missing' || item.status === 'current-release verified' || item.status === 'historical-release verified') continue
    const dest = resolve(paths.cursorSkillsRoot, item.name)
    if (item.kind === 'directory' && wasCreatedByCompletedOperation(paths, dest)) continue
    if (opts['retire-modified'] === true) continue
    throw new Error(`existing user skill is unknown or modified: ${dest}`)
  }
}

function knownPersonalPlugin(paths, repoRoot) {
  if (!existsSync(paths.personalPluginRoot)) return true
  const source = resolve(repoRoot, 'plugins', pluginName)
  if (fingerprintPath(paths.personalPluginRoot).sha256 === fingerprintPath(source).sha256) return true
  return wasCreatedByCompletedOperation(paths, paths.personalPluginRoot)
}

function knownPersonalMarketplace(paths) {
  if (!existsSync(paths.personalMarketplace)) return true
  const marketplace = readJson(paths.personalMarketplace)
  if (marketplace?.name !== 'personal' || !Array.isArray(marketplace.plugins)) return false
  const entries = marketplace.plugins.filter((entry) => entry?.name === pluginName)
  return entries.length <= 1 && (entries.length === 0 || isExpectedPersonalEntry(entries[0]))
}

function wasCreatedByCompletedOperation(paths, target) {
  return readDirectory(paths.operationsRoot)
    .filter((name) => name.endsWith('.json'))
    .some((name) => {
      const operation = readJson(resolve(paths.operationsRoot, name))
      return operation.status === 'completed' && (operation.changes || []).some((change) => change.target === target && change.kind === 'created')
    })
}

function preflightConsumers(manifest, repoRoot, opts) {
  for (const project of manifest.projects) {
    if (project.role !== 'consumer') continue
    if (project.root === manifest.sourceRoot || !existsSync(project.root)) throw new Error(`consumer root is invalid: ${project.root}`)
    for (const component of inspectConsumer(project.root, repoRoot)) {
      if (!component.owned && opts['retire-modified'] !== true) throw new Error(`consumer component is unknown or modified: ${component.path}`)
    }
  }
}

function knownGlobalRuntime(paths, repoRoot) {
  if (!existsSync(paths.runtimeRoot)) return true
  const runtime = resolve(paths.runtimeRoot, 'runtime')
  const bin = resolve(paths.runtimeRoot, 'bin', 'ae.mjs')
  if (!existsSync(runtime) && !existsSync(bin)) return true
  const plugin = resolve(runtime, 'plugin')
  const source = resolve(repoRoot, 'plugins', pluginName)
  if (!existsSync(plugin) || !existsSync(bin) || !readFileSync(bin, 'utf8').includes("await import('../runtime/plugin/scripts/ae-tools.mjs')")) return false
  if (fingerprintPath(plugin).sha256 === fingerprintPath(source).sha256) return true
  return wasCreatedByCompletedOperation(paths, plugin)
}

function backupExistingGlobalRuntime(operation, repoRoot) {
  const runtime = resolve(operation.paths.runtimeRoot, 'runtime')
  const bin = resolve(operation.paths.runtimeRoot, 'bin')
  if (existsSync(runtime)) moveToBackup(operation, runtime, 'global-runtime/runtime')
  if (existsSync(bin)) moveToBackup(operation, bin, 'global-runtime/bin')
  if (existsSync(operation.paths.personalPluginRoot)) moveToBackup(operation, operation.paths.personalPluginRoot, 'personal-plugin-source')
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
  const personalPlugin = operation.paths.personalPluginRoot
  mkdirSync(dirname(personalPlugin), { recursive: true })
  operation.changes.push({ source: null, target: personalPlugin, backup: null, kind: 'created' })
  writeJournal(operation.journal, operation)
  cpSync(stagedPlugin, personalPlugin, { recursive: true, errorOnExist: true })
  if (fingerprintPath(personalPlugin).sha256 !== fingerprintPath(stagedPlugin).sha256) throw new Error('personal plugin fingerprint mismatch')
  writePersonalMarketplace(operation)
}

function writePersonalMarketplace(operation) {
  const target = operation.paths.personalMarketplace
  const existing = existsSync(target) ? readJson(target) : { name: 'personal', interface: { displayName: 'Personal' }, plugins: [] }
  if (existing?.name !== 'personal' || !Array.isArray(existing.plugins)) throw new Error(`personal marketplace is invalid: ${target}`)
  const entries = existing.plugins.filter((entry) => entry?.name === pluginName)
  if (entries.length > 1 || (entries.length === 1 && !isExpectedPersonalEntry(entries[0]))) throw new Error(`personal marketplace AE entry is unknown or modified: ${target}`)
  const next = {
    ...existing,
    plugins: [...existing.plugins.filter((entry) => entry?.name !== pluginName), personalMarketplaceEntry()],
  }
  replaceFileWithBackup(operation, target, `${JSON.stringify(next, null, 2)}\n`, 'personal-marketplace.json')
}

function publishCursorSkills(operation, repoRoot) {
  const names = currentSkillNames(repoRoot)
  mkdirSync(operation.paths.cursorSkillsRoot, { recursive: true })
  for (const dest of aeSkillComponents(operation.paths.cursorSkillsRoot)) {
    const name = basename(dest)
    const source = expectedCursorSkillTarget(operation.paths.personalPluginRoot, name)
    const entry = inspectCursorSkillEntry(dest)
    if (names.includes(name) && isOwnedCursorSkillCopy(entry, source)) continue
    backupCursorSkillEntry(operation, dest, entry)
  }
  for (const name of names) {
    const dest = resolve(operation.paths.cursorSkillsRoot, name)
    const source = expectedCursorSkillTarget(operation.paths.personalPluginRoot, name)
    const entry = inspectCursorSkillEntry(dest)
    if (isOwnedCursorSkillCopy(entry, source)) continue
    if (entry.kind !== 'missing') backupCursorSkillEntry(operation, dest, entry)
    createCursorSkillCopy(operation, dest, source)
  }
}

function backupCursorSkillEntry(operation, dest, entry) {
  if (entry.kind === 'link' || isLinkEntry(dest)) {
    const backup = resolve(backupPath(operation.paths, operation.id), `cursor-skills/${basename(dest)}.link.json`)
    mkdirSync(dirname(backup), { recursive: true })
    const record = { kind: 'link', target: entry.target, linkType: cursorLinkType() }
    writeFileSync(backup, `${JSON.stringify(record)}\n`, 'utf8')
    operation.changes.push({
      source: dest,
      target: dest,
      backup,
      fingerprint: { sha256: createHash('sha256').update(String(entry.target || '')).digest('hex'), kind: 'link' },
      kind: 'link-replaced',
      linkTarget: entry.target,
      linkType: cursorLinkType(),
    })
    writeJournal(operation.journal, operation)
    unlinkCursorSkill(dest)
    return
  }
  moveToBackup(operation, dest, `cursor-skills/${basename(dest)}`)
}

function createCursorSkillCopy(operation, dest, source) {
  assertCursorLinkTargetAllowed(operation.paths.personalPluginRoot, source)
  if (!existsSync(source)) throw new Error(`cursor skill copy source is missing: ${source}`)
  mkdirSync(dirname(dest), { recursive: true })
  operation.changes.push({ source: null, target: dest, backup: null, kind: 'created' })
  writeJournal(operation.journal, operation)
  cpSync(source, dest, { recursive: true, errorOnExist: true })
  if (fingerprintPath(dest).sha256 !== fingerprintPath(source).sha256) throw new Error(`cursor skill copy fingerprint mismatch: ${dest}`)
}

function unlinkCursorSkill(path) {
  if (!existsSync(path)) return
  if (isLinkEntry(path)) {
    unlinkSync(path)
    if (existsSync(path)) throw new Error(`failed to remove cursor skill link: ${path}`)
    return
  }
  rmSync(path, { recursive: true, force: false })
  if (existsSync(path)) throw new Error(`failed to remove cursor skill path: ${path}`)
}

function personalMarketplaceEntry() {
  return {
    name: pluginName,
    source: { source: 'local', path: `./plugins/${pluginName}` },
    policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
    category: 'Coding',
  }
}

function isExpectedPersonalEntry(entry) {
  return entry?.source?.source === 'local' && entry?.source?.path === `./plugins/${pluginName}`
}

function replaceFileWithBackup(operation, target, content, backupRelative) {
  if (!existsSync(target)) {
    mkdirSync(dirname(target), { recursive: true })
    operation.changes.push({ source: null, target, backup: null, kind: 'created' })
    writeJournal(operation.journal, operation)
    writeFileSync(target, content, 'utf8')
    return
  }
  const fingerprint = fingerprintPath(target)
  const backup = resolve(backupPath(operation.paths, operation.id), backupRelative)
  mkdirSync(dirname(backup), { recursive: true })
  cpSync(target, backup, { errorOnExist: true })
  if (fingerprintPath(backup).sha256 !== fingerprint.sha256) throw new Error(`marketplace backup fingerprint mismatch: ${target}`)
  operation.changes.push({ source: target, target, backup, fingerprint, kind: 'replaced' })
  writeJournal(operation.journal, operation)
  writeFileSync(target, content, 'utf8')
}

function registerCodexPlugin(operation, commandRunner) {
  if (resolve(operation.paths.homeRoot) !== resolve(homedir()) && commandRunner === defaultCommandRunner) {
    throw new Error('a non-current --home requires an injected Codex command runner')
  }
  const marketplaceRequest = {
    command: 'codex',
    args: ['plugin', 'marketplace', 'add', operation.paths.homeRoot, '--json'],
    homeRoot: operation.paths.homeRoot,
  }
  const marketplaceResult = commandRunner(marketplaceRequest)
  operation.codexPluginRegistration = {
    marketplace: { command: marketplaceRequest.command, args: marketplaceRequest.args, status: marketplaceResult?.status ?? null },
  }
  writeJournal(operation.journal, operation)
  if (!marketplaceResult || marketplaceResult.status !== 0) {
    throw new Error(`Codex marketplace registration failed: ${String(marketplaceResult?.stderr || marketplaceResult?.stdout || 'unknown runner failure').trim()}`)
  }
  const pluginRequest = { command: 'codex', args: ['plugin', 'add', `${pluginName}@personal`, '--json'], homeRoot: operation.paths.homeRoot }
  const pluginResult = commandRunner(pluginRequest)
  operation.codexPluginRegistration.plugin = { command: pluginRequest.command, args: pluginRequest.args, status: pluginResult?.status ?? null }
  writeJournal(operation.journal, operation)
  if (!pluginResult || pluginResult.status !== 0) throw new Error(`Codex plugin registration failed: ${String(pluginResult?.stderr || pluginResult?.stdout || 'unknown runner failure').trim()}`)
}

function defaultCommandRunner({ command, args }) {
  if (process.platform === 'win32') {
    const commandLine = [command, ...args].map((value) => quoteWindowsArg(value)).join(' ')
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], { encoding: 'utf8', stdio: 'pipe', windowsHide: true })
  }
  return spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' })
}

function quoteWindowsArg(value) {
  const text = String(value)
  if (!/[\s"]/.test(text)) return text
  return `"${text.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1')}"`
}

function moveToBackup(operation, source, backupRelative) {
  if (!existsSync(source)) return
  if (isLinkEntry(source)) throw new Error(`refusing to recursively back up a link: ${source}`)
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
    if (change.kind === 'created-link') {
      if (existsSync(change.target)) unlinkCursorSkill(change.target)
      continue
    }
    if (change.kind === 'created') {
      if (existsSync(change.target)) {
        if (isLinkEntry(change.target)) unlinkCursorSkill(change.target)
        else rmSync(change.target, { recursive: fingerprintPath(change.target)?.kind === 'directory', force: false })
      }
      continue
    }
    if (change.kind === 'link-replaced') {
      if (existsSync(change.target)) unlinkCursorSkill(change.target)
      mkdirSync(dirname(change.target), { recursive: true })
      symlinkSync(change.linkTarget, change.target, change.linkType || cursorLinkType())
      continue
    }
    if (!change.backup || !existsSync(change.backup)) throw new Error(`backup is missing: ${change.backup}`)
    if (change.kind === 'replaced' && existsSync(change.target)) rmSync(change.target, { force: false })
    else if (existsSync(change.target)) {
      if (isLinkEntry(change.target)) throw new Error(`refusing to overwrite unexpected restore target: ${change.target}`)
      if (fingerprintPath(change.target)?.kind === 'directory' && readDirectory(change.target).length === 0) rmSync(change.target, { recursive: true, force: false })
      else throw new Error(`refusing to overwrite unexpected restore target: ${change.target}`)
    }
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

function confirmationFor(manifest, opts = {}, paths = null, repoRoot = null) {
  return createHash('sha256').update(JSON.stringify({
    manifest,
    retireModified: opts['retire-modified'] === true,
    cursorSkills: paths && repoRoot ? classifyCursorSkills(paths, repoRoot) : [],
  })).digest('hex')
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
    if (['apply', 'retire-modified'].includes(key)) { opts[key] = true; continue }
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
