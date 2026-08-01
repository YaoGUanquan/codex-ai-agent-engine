#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..')
const args = process.argv.slice(2)
const targetArg = readArg('--target') || process.cwd()
const targetRoot = validateTargetRoot(resolve(targetArg))
const pluginName = 'ai-agent-engine-codex'
const sourcePlugin = resolve(repoRoot, 'plugins', pluginName)
const targetPlugin = resolve(targetRoot, 'plugins', pluginName)
const targetAgentsSkills = resolve(targetRoot, '.agents', 'skills')
const targetMarketplace = resolve(targetRoot, '.agents', 'plugins', 'marketplace.json')
const targetScripts = resolve(targetRoot, 'scripts')
const targetWrapper = resolve(targetScripts, 'ae-tools.mjs')
const targetUpdater = resolve(targetScripts, 'update-ae-codex.mjs')
const targetLanguageSetter = resolve(targetScripts, 'set-ae-language.mjs')
const targetArtifactChecker = resolve(targetScripts, 'check-ae-artifacts.mjs')
const targetDesignContractChecker = resolve(targetScripts, 'check-design-contract.mjs')
const sourceTemplates = resolve(repoRoot, 'docs', 'ae', 'templates')
const targetTemplates = resolve(targetRoot, 'docs', 'ae', 'templates')
const removedSkillNames = ['ae-officecli', 'ae-docx', 'ae-xlsx', 'ae-pptx']
const removedScriptNames = ['check-officecli-available.mjs', 'check-officecli-smoke.mjs']
const lang = readArg('--lang') || readInstalledLang(targetRoot) || 'bilingual'
const supportedLangs = new Set(['en', 'zh-CN', 'bilingual'])

if (!supportedLangs.has(lang)) {
  fail('Usage: node scripts/install-project.mjs --target <project> [--lang en|zh-CN|bilingual]')
}

if (!existsSync(sourcePlugin)) {
  fail(`source plugin not found: ${sourcePlugin}`)
}

safeMkdir(targetRoot, dirname(targetPlugin), 'plugin parent')
if (existsSync(targetPlugin)) safeRemove(targetRoot, targetPlugin, 'installed plugin')
safeCopy(targetRoot, sourcePlugin, targetPlugin, 'installed plugin')

safeMkdir(targetRoot, targetAgentsSkills, 'agent skills')
for (const name of removedSkillNames) {
  const dst = resolve(targetAgentsSkills, name)
  if (existsSync(dst)) safeRemove(targetRoot, dst, `removed skill ${name}`)
}
const sourceSkills = resolve(sourcePlugin, 'skills')
for (const name of listDirs(sourceSkills)) {
  const dst = resolve(targetAgentsSkills, name)
  if (existsSync(dst)) safeRemove(targetRoot, dst, `skill ${name}`)
  safeCopy(targetRoot, resolve(sourceSkills, name), dst, `skill ${name}`)
}

safeMkdir(targetRoot, dirname(targetMarketplace), 'marketplace parent')
assertTargetPath(targetRoot, targetMarketplace, 'marketplace read')
const marketplace = loadMarketplace(targetMarketplace)
const entry = {
  name: pluginName,
  source: { source: 'local', path: `./plugins/${pluginName}` },
  policy: { installation: 'INSTALLED_BY_DEFAULT', authentication: 'ON_INSTALL' },
  category: 'Coding',
}
const idx = marketplace.plugins.findIndex((plugin) => plugin.name === pluginName)
if (idx >= 0) marketplace.plugins[idx] = entry
else marketplace.plugins.push(entry)
safeWrite(targetRoot, targetMarketplace, `${JSON.stringify(marketplace, null, 2)}\n`, 'marketplace')

safeMkdir(targetRoot, targetScripts, 'scripts')
for (const name of removedScriptNames) {
  const dst = resolve(targetScripts, name)
  if (existsSync(dst)) safeRemove(targetRoot, dst, `removed script ${name}`)
}
safeWrite(targetRoot, targetWrapper, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/ae-tools.mjs'\n", 'wrapper')
safeWrite(targetRoot, targetUpdater, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/update-project.mjs'\n", 'updater')
safeWrite(targetRoot, targetLanguageSetter, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/set-language.mjs'\n", 'language setter')
safeWrite(targetRoot, targetArtifactChecker, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs'\n", 'artifact checker')
safeWrite(targetRoot, targetDesignContractChecker, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/check-design-contract.mjs'\n", 'design contract checker')

runLanguageSetter(lang)

if (existsSync(sourceTemplates)) {
  safeMkdir(targetRoot, dirname(targetTemplates), 'AE templates parent')
  safeCopy(targetRoot, sourceTemplates, targetTemplates, 'AE templates')
}

console.log(JSON.stringify({
  status: 'installed',
  targetRoot,
  plugin: toPosix(relative(targetRoot, targetPlugin)),
  marketplace: toPosix(relative(targetRoot, targetMarketplace)),
  skills: toPosix(relative(targetRoot, targetAgentsSkills)),
  wrapper: toPosix(relative(targetRoot, targetWrapper)),
  updater: toPosix(relative(targetRoot, targetUpdater)),
  languageSetter: toPosix(relative(targetRoot, targetLanguageSetter)),
  artifactChecker: toPosix(relative(targetRoot, targetArtifactChecker)),
  designContractChecker: toPosix(relative(targetRoot, targetDesignContractChecker)),
  lang,
}, null, 2))

function readArg(name) {
  const idx = args.indexOf(name)
  if (idx < 0) return null
  return args[idx + 1] || null
}

function listDirs(path) {
  return existsSync(path)
    ? readdirSync(path).filter((name) => statSync(resolve(path, name)).isDirectory())
    : []
}

function loadMarketplace(path) {
  if (!existsSync(path)) {
    return {
      name: 'local-codex-plugins',
      interface: { displayName: 'Local Codex Plugins' },
      plugins: [],
    }
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readInstalledLang(targetRoot) {
  const file = resolve(targetRoot, '.agents', 'skills', 'ae-help', 'agents', 'openai.yaml')
  assertTargetPath(targetRoot, file, 'installed language')
  if (!existsSync(file)) return null
  const content = readFileSync(file, 'utf8')
  if (content.includes('查看 Codex 中可用的 AE 工作流能力 / List AE workflow capabilities for Codex')) return 'bilingual'
  if (content.includes('查看 Codex 中可用的 AE 工作流能力')) return 'zh-CN'
  if (content.includes('List AE workflow capabilities for Codex')) return 'en'
  return null
}

function runLanguageSetter(lang) {
  const script = resolve(targetPlugin, 'scripts', 'set-language.mjs')
  assertTargetPath(targetRoot, script, 'language setter')
  const result = spawnSync(process.execPath, [script, '--target', targetRoot, '--lang', lang], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function validateTargetRoot(path) {
  if (!existsSync(path)) fail(`target project not found: ${path}`)
  const targetStat = lstatSync(path)
  if (targetStat.isSymbolicLink() || !targetStat.isDirectory()) fail(`target project must be a regular directory without a symlink: ${path}`)
  return realpathSync(path)
}

function assertTargetPath(root, targetPath, label) {
  const rootAbs = resolve(root)
  const targetAbs = resolve(targetPath)
  const rel = relative(rootAbs, targetAbs)
  if (rel.startsWith('..') || isAbsolute(rel)) fail(`${label} escapes target project: ${targetPath}`)
  const rootStat = lstatSync(rootAbs)
  if (rootStat.isSymbolicLink()) fail(`${label} target project root is a symlink: ${rootAbs}`)
  const rootReal = realpathSync(rootAbs)
  let current = rootAbs
  for (const part of rel ? rel.split(/[\\/]+/) : []) {
    current = resolve(current, part)
    let currentStat
    try {
      currentStat = lstatSync(current)
    } catch {
      continue
    }
    if (currentStat.isSymbolicLink()) fail(`${label} contains a symlink or junction: ${current}`)
    const currentReal = realpathSync(current)
    const currentRel = relative(rootReal, currentReal)
    if (currentRel.startsWith('..') || isAbsolute(currentRel)) fail(`${label} escapes target project: ${current}`)
  }
}

function safeMkdir(root, path, label) {
  assertTargetPath(root, path, label)
  mkdirSync(path, { recursive: true })
  assertTargetPath(root, path, label)
}

function safeRemove(root, path, label) {
  assertTargetPath(root, path, label)
  rmSync(path, { recursive: true, force: true })
}

function safeCopy(root, source, destination, label) {
  assertTargetPath(root, destination, label)
  cpSync(source, destination, { recursive: true, force: true })
  assertTargetPath(root, destination, label)
}

function safeWrite(root, path, content, label) {
  assertTargetPath(root, path, label)
  writeFileSync(path, content, 'utf8')
  assertTargetPath(root, path, label)
}

function toPosix(path) {
  return path.replace(/\\/g, '/')
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
