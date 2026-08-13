import { createHash, randomUUID } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, isAbsolute, relative, resolve, sep } from 'node:path'

export const pluginName = 'ai-agent-engine-codex'
export const terminalOperationStates = new Set(['completed', 'rolled-back'])
export const consumerComponentPaths = [
  `plugins/${pluginName}`,
  'scripts/ae-tools.mjs',
  'scripts/update-ae-codex.mjs',
  'scripts/set-ae-language.mjs',
  'scripts/check-ae-artifacts.mjs',
  'scripts/check-design-contract.mjs',
  'scripts/check-memory-knowledge-contract.mjs',
]

export function userPaths(home = homedir()) {
  const homeRoot = verifiedDirectory(home, 'home directory')
  const agentsRoot = resolve(homeRoot, '.agents')
  return {
    homeRoot,
    agentsRoot,
    skillsRoot: resolve(agentsRoot, 'skills'),
    runtimeRoot: resolve(agentsRoot, pluginName),
    operationsRoot: resolve(agentsRoot, pluginName, 'operations'),
    personalPluginsRoot: resolve(homeRoot, 'plugins'),
    personalPluginRoot: resolve(homeRoot, 'plugins', pluginName),
    personalMarketplace: resolve(agentsRoot, 'plugins', 'marketplace.json'),
    cursorSkillsRoot: resolve(homeRoot, '.cursor', 'skills'),
    cursorReservedSkillsRoot: resolve(homeRoot, '.cursor', 'skills-cursor'),
  }
}

export function buildFirstBatchManifest(repoRoot) {
  const sourceRoot = verifiedDirectory(repoRoot, 'distribution source root')
  return {
    schemaVersion: 1,
    previewOnly: true,
    sourceRoot,
    projects: [
      { root: sourceRoot, role: 'distribution-source' },
    ],
  }
}

export function normalizeManifest(manifest, { repoRoot, home = homedir(), allowCustomConsumers = false } = {}) {
  const paths = userPaths(home)
  const sourceRoot = verifiedDirectory(repoRoot, 'distribution source root')
  const projects = []
  for (const item of manifest?.projects || []) {
    if (!item || typeof item.root !== 'string') throw new Error('manifest projects must contain root strings')
    const root = canonicalExistingOrAbsolute(item.root)
    const role = deriveRole(root, { sourceRoot, requestedRole: item.role, allowCustomConsumers })
    if (projects.some((project) => project.root === root)) throw new Error(`manifest contains duplicate root: ${root}`)
    if ([paths.homeRoot, paths.agentsRoot, paths.runtimeRoot, paths.personalPluginsRoot, paths.personalPluginRoot, paths.cursorSkillsRoot, paths.cursorReservedSkillsRoot].includes(root)) throw new Error(`protected path cannot be a project root: ${root}`)
    if (isForeignHomePath(root, paths.homeRoot)) throw new Error(`project root belongs to another user home: ${root}`)
    projects.push({ root, role })
  }
  if (projects.length === 0) throw new Error('manifest must contain at least one project')
  return { schemaVersion: 1, sourceRoot, homeRoot: paths.homeRoot, projects }
}

export function deriveRole(root, { sourceRoot, requestedRole, allowCustomConsumers = false }) {
  if (overlaps(root, sourceRoot)) return 'distribution-source'
  if (requestedRole === 'deferred') return 'deferred'
  if (allowCustomConsumers && requestedRole === 'consumer') return 'consumer'
  throw new Error(`root is not an approved consumer: ${root}`)
}

export function allowedConsumerComponents(root) {
  const canonicalRoot = verifiedDirectory(root, 'consumer root')
  return consumerComponentPaths.map((path) => guardedChild(canonicalRoot, path))
}

export function guardedChild(root, relativePath) {
  if (!relativePath || relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
    throw new Error(`unsafe relative component path: ${relativePath}`)
  }
  const target = resolve(root, relativePath)
  if (!isInside(root, target) || target === root) throw new Error(`component path escapes root: ${relativePath}`)
  return target
}

export function aeSkillComponents(skillsRoot) {
  if (!existsSync(skillsRoot)) return []
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => (entry.isDirectory() || entry.isSymbolicLink()) && entry.name.startsWith('ae-'))
    .map((entry) => guardedChild(skillsRoot, entry.name))
}

export function cursorLinkType() {
  return process.platform === 'win32' ? 'junction' : 'dir'
}

export function expectedCursorSkillTarget(personalPluginRoot, skillName) {
  return guardedChild(guardedChild(personalPluginRoot, 'skills'), skillName)
}

export function currentSkillNames(repoRoot) {
  return aeSkillComponents(resolve(repoRoot, 'plugins', pluginName, 'skills')).map((path) => basename(path)).sort()
}

export function isLinkEntry(path) {
  if (!existsSync(path)) return false
  if (lstatSync(path).isSymbolicLink()) return true
  try {
    readlinkSync(path)
    return true
  } catch {
    return false
  }
}

export function inspectCursorSkillEntry(path) {
  if (!existsSync(path)) return { kind: 'missing' }
  if (isLinkEntry(path)) return { kind: 'link', target: realpathSync(path) }
  return { kind: 'directory', fingerprint: fingerprintPath(path) }
}

export function isOwnedCursorSkillCopy(entry, sourceSkillPath) {
  if (entry?.kind !== 'directory' || !entry.fingerprint || !existsSync(sourceSkillPath)) return false
  return entry.fingerprint.sha256 === fingerprintPath(sourceSkillPath).sha256
}

export function isLegacyCursorSkillLink(entry, expectedTarget) {
  return entry?.kind === 'link' && resolve(entry.target) === resolve(expectedTarget)
}

export function assertCursorLinkTargetAllowed(personalPluginRoot, target) {
  const skillsRoot = guardedChild(personalPluginRoot, 'skills')
  if (!isInside(skillsRoot, target) || resolve(target) === resolve(skillsRoot)) {
    throw new Error(`cursor skill copy source escapes personal plugin skills: ${target}`)
  }
}

export function classifyCursorSkills(paths, repoRoot) {
  const names = currentSkillNames(repoRoot)
  const extras = aeSkillComponents(paths.cursorSkillsRoot)
    .map((path) => basename(path))
    .filter((name) => !names.includes(name))
  return [...names, ...extras].map((name) => classifyCursorSkill(paths, repoRoot, name, names.includes(name)))
}

function classifyCursorSkill(paths, repoRoot, name, inRelease) {
  const dest = resolve(paths.cursorSkillsRoot, name)
  const entry = inspectCursorSkillEntry(dest)
  if (!inRelease) return { name, status: 'modified', kind: entry.kind, target: entry.target || null }
  if (entry.kind === 'missing') return { name, status: 'missing', kind: 'missing' }
  const source = cursorSkillSource(paths, repoRoot, name)
  const expected = resolve(paths.personalPluginRoot, 'skills', name)
  if (isOwnedCursorSkillCopy(entry, source)) return { name, status: 'current-release verified', kind: 'directory' }
  if (isLegacyCursorSkillLink(entry, expected)) return { name, status: 'historical-release verified', kind: 'link', target: entry.target }
  return { name, status: 'modified', kind: entry.kind, target: entry.target || null }
}

function cursorSkillSource(paths, repoRoot, name) {
  const published = resolve(paths.personalPluginRoot, 'skills', name)
  if (existsSync(published)) return published
  return resolve(repoRoot, 'plugins', pluginName, 'skills', name)
}

export function fingerprintPath(path) {
  const target = resolve(path)
  if (!existsSync(target)) return null
  const hash = createHash('sha256')
  visit(target, target, hash)
  return { sha256: hash.digest('hex'), kind: statSync(target).isDirectory() ? 'directory' : 'file' }
}

export function operationId() {
  return randomUUID()
}

export function isInside(root, target) {
  const rel = relative(root, target)
  return rel === '' || (!isAbsolute(rel) && !rel.startsWith('..') && !rel.includes(`..${sep}`))
}

export function overlaps(left, right) {
  return isInside(left, right) || isInside(right, left)
}

function visit(root, target, hash) {
  const stat = lstatSync(target)
  if (stat.isSymbolicLink()) throw new Error(`symbolic link is not allowed in managed component: ${target}`)
  const rel = relative(root, target).replace(/\\/g, '/') || '.'
  hash.update(`${stat.isDirectory() ? 'd' : 'f'}:${rel}:`)
  if (stat.isDirectory()) {
    for (const entry of readdirSync(target).sort()) visit(root, resolve(target, entry), hash)
  } else {
    hash.update(readFileSync(target))
  }
}

function verifiedDirectory(path, label) {
  const absolute = resolve(path)
  if (!existsSync(absolute) || !statSync(absolute).isDirectory()) throw new Error(`${label} does not exist or is not a directory: ${absolute}`)
  if (lstatSync(absolute).isSymbolicLink()) throw new Error(`${label} must not be a symbolic link: ${absolute}`)
  return realpathSync(absolute)
}

function canonicalExistingOrAbsolute(path) {
  const absolute = resolve(path)
  return existsSync(absolute) ? realpathSync(absolute) : absolute
}

function isForeignHomePath(root, homeRoot) {
  const homeParent = resolve(homeRoot, '..')
  const conventionalHomeParent = basename(homeParent).toLowerCase()
  return (conventionalHomeParent === 'users' || conventionalHomeParent === 'home')
    && isInside(homeParent, root)
    && !isInside(homeRoot, root)
}
