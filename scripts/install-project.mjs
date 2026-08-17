#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = realpathSync(resolve(dirname(__filename), '..'))
const args = process.argv.slice(2)
const targetArg = readRequiredArg('--target')
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
const priorState = loadState(paths.state)
const replaceModified = args.includes('--replace-modified')
const components = sourceComponents(paths)
const marketplace = prepareMarketplace(paths.marketplace)
const removals = priorOwnedRetirements(paths, priorState)

try {
  preflight(components, marketplace, removals, priorState, replaceModified)
  const operation = stageOperation(paths, components, marketplace, removals)
  try {
    applyComponents(components)
    writeJson(paths.marketplace, marketplace.value)
    for (const target of removals) rmSync(target, { recursive: true, force: true })
    runLanguageSetter(lang, targetRoot)
    writeState(paths.state, {
      schemaVersion: 1,
      pluginVersion: readPluginVersion(),
      components: Object.fromEntries(components.map((component) => [component.rel, fingerprintPath(component.target)]).concat([[marketplace.rel, fingerprintPath(marketplace.target)]])),
      installedAt: new Date().toISOString(),
    })
  } catch (error) {
    restoreOperation(operation)
    throw error
  }
  cleanupOperation(operation)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}

console.log(JSON.stringify({
  status: 'installed',
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
  const value = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : { name: 'local-codex-plugins', interface: { displayName: 'Local Codex Plugins' }, plugins: [] }
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
  const stage = resolve(paths.stageRoot, randomUUID())
  const targets = [...components.map((component) => component.target), marketplace.target, paths.state, ...removals]
  const changes = []
  for (const target of [...new Set(targets)]) {
    if (!existsSync(target)) { changes.push({ target, existed: false }); continue }
    assertNotLink(target)
    const backup = resolve(stage, String(changes.length))
    mkdirSync(dirname(backup), { recursive: true })
    cpSync(target, backup, { recursive: true, errorOnExist: true })
    changes.push({ target, existed: true, backup })
  }
  return { stage, changes }
}

function applyComponents(components) {
  for (const component of components) {
    mkdirSync(dirname(component.target), { recursive: true })
    rmSync(component.target, { recursive: true, force: true })
    if (component.source) cpSync(component.source, component.target, { recursive: true })
    else writeFileSync(component.target, component.text, 'utf8')
  }
}

function restoreOperation(operation) {
  for (const change of [...operation.changes].reverse()) {
    rmSync(change.target, { recursive: true, force: true })
    if (change.existed) { mkdirSync(dirname(change.target), { recursive: true }); cpSync(change.backup, change.target, { recursive: true, errorOnExist: true }) }
  }
  cleanupOperation(operation)
}

function cleanupOperation(operation) { if (existsSync(operation.stage)) rmSync(operation.stage, { recursive: true, force: true }) }

function loadState(path) {
  if (!existsSync(path)) return null
  assertNotLink(path)
  const state = JSON.parse(readFileSync(path, 'utf8'))
  if (state?.schemaVersion !== 1 || !state.components || typeof state.components !== 'object') throw new Error(`invalid project installer state: ${path}`)
  return state
}

function writeState(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  const temp = `${path}.${process.pid}.tmp`
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  renameSync(temp, path)
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
  const hash = createHash('sha256')
  visit(path, path, hash)
  return hash.digest('hex')
}
function visit(root, target, hash) {
  assertNotLink(target)
  const stat = statSync(target)
  const rel = toPosix(relative(root, target)) || '.'
  hash.update(`${stat.isDirectory() ? 'd' : 'f'}:${rel}:`)
  if (stat.isDirectory()) for (const name of readdirSync(target).sort()) visit(root, resolve(target, name), hash)
  else hash.update(readFileSync(target))
}
function assertNotLink(path) { if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error(`symbolic link or junction is not allowed in managed path: ${path}`) }
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
  const result = spawnSync(process.execPath, [script, '--target', targetRoot, '--lang', language], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`language setter failed with status ${result.status ?? 1}`)
}
function writeJson(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8') }
function toPosix(path) { return path.replace(/\\/g, '/') }
function fail(message) { console.error(message); process.exit(1) }
