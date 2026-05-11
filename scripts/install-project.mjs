#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(__filename), '..')
const args = process.argv.slice(2)
const targetArg = readArg('--target') || process.cwd()
const targetRoot = resolve(targetArg)
const pluginName = 'ai-agent-engine-codex'
const sourcePlugin = resolve(repoRoot, 'plugins', pluginName)
const targetPlugin = resolve(targetRoot, 'plugins', pluginName)
const targetAgentsSkills = resolve(targetRoot, '.agents', 'skills')
const targetMarketplace = resolve(targetRoot, '.agents', 'plugins', 'marketplace.json')
const targetScripts = resolve(targetRoot, 'scripts')
const targetWrapper = resolve(targetScripts, 'ae-tools.mjs')
const targetUpdater = resolve(targetScripts, 'update-ae-codex.mjs')
const targetLanguageSetter = resolve(targetScripts, 'set-ae-language.mjs')
const lang = readArg('--lang') || readInstalledLang(targetRoot) || 'en'
const supportedLangs = new Set(['en', 'zh-CN', 'bilingual'])

if (!supportedLangs.has(lang)) {
  fail('Usage: node scripts/install-project.mjs --target <project> [--lang en|zh-CN|bilingual]')
}

if (!existsSync(sourcePlugin)) {
  fail(`source plugin not found: ${sourcePlugin}`)
}

mkdirSync(dirname(targetPlugin), { recursive: true })
if (existsSync(targetPlugin)) rmSync(targetPlugin, { recursive: true, force: true })
cpSync(sourcePlugin, targetPlugin, { recursive: true })

mkdirSync(targetAgentsSkills, { recursive: true })
const sourceSkills = resolve(sourcePlugin, 'skills')
for (const name of listDirs(sourceSkills)) {
  const dst = resolve(targetAgentsSkills, name)
  if (existsSync(dst)) rmSync(dst, { recursive: true, force: true })
  cpSync(resolve(sourceSkills, name), dst, { recursive: true })
}

mkdirSync(dirname(targetMarketplace), { recursive: true })
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
writeJson(targetMarketplace, marketplace)

mkdirSync(targetScripts, { recursive: true })
writeFileSync(targetWrapper, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/ae-tools.mjs'\n", 'utf8')
writeFileSync(targetUpdater, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/update-project.mjs'\n", 'utf8')
writeFileSync(targetLanguageSetter, "#!/usr/bin/env node\nimport '../plugins/ai-agent-engine-codex/scripts/set-language.mjs'\n", 'utf8')

runLanguageSetter(lang)

console.log(JSON.stringify({
  status: 'installed',
  targetRoot,
  plugin: toPosix(relative(targetRoot, targetPlugin)),
  marketplace: toPosix(relative(targetRoot, targetMarketplace)),
  skills: toPosix(relative(targetRoot, targetAgentsSkills)),
  wrapper: toPosix(relative(targetRoot, targetWrapper)),
  updater: toPosix(relative(targetRoot, targetUpdater)),
  languageSetter: toPosix(relative(targetRoot, targetLanguageSetter)),
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
  if (!existsSync(file)) return null
  const content = readFileSync(file, 'utf8')
  if (content.includes('查看 Codex 中可用的 AE 工作流能力 / List AE workflow capabilities for Codex')) return 'bilingual'
  if (content.includes('查看 Codex 中可用的 AE 工作流能力')) return 'zh-CN'
  if (content.includes('List AE workflow capabilities for Codex')) return 'en'
  return null
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function runLanguageSetter(lang) {
  const script = resolve(targetPlugin, 'scripts', 'set-language.mjs')
  const result = spawnSync(process.execPath, [script, '--target', targetRoot, '--lang', lang], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function toPosix(path) {
  return path.replace(/\\/g, '/')
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
