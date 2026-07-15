#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const targetRoot = resolve(readArg('--target') || process.cwd())
const opencodeRoot = resolve(targetRoot, '.opencode')
const runtimeRoot = resolve(opencodeRoot, 'ai-agent-engine')
const stagingRoot = `${runtimeRoot}.staging-${Date.now()}`
const backupRoot = `${runtimeRoot}.backup-${Date.now()}`
const bridgePath = resolve(opencodeRoot, 'plugins', 'ae-server.js')
const bridgeContent = "export { default } from '../ai-agent-engine/dist/src/index.js'\n"
const ownershipFileName = '.ae-install-owner.json'
const ownership = { schemaVersion: 1, product: 'ai-agent-engine-opencode', scope: 'project' }
const distributionPaths = [
  'LICENSE',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'src',
  'scripts/postbuild.mjs',
  'scripts/install-project.mjs',
  'scripts/install.js',
  'scripts/uninstall.js',
  'docs/talk-normal-fallback.md',
]

const targetFromSource = relative(repoRoot, targetRoot)
if (targetFromSource === '' || (!targetFromSource.startsWith('..') && !isAbsolute(targetFromSource))) {
  fail('The installation target must not be this source checkout.')
}
assertSafeTargetPath(targetRoot)
if (existsSync(bridgePath) && readFileSync(bridgePath, 'utf8') !== bridgeContent) {
  fail(`Refusing to overwrite an unrecognized OpenCode bridge: ${bridgePath}`)
}
if (existsSync(runtimeRoot) && !isOwnedRuntime(runtimeRoot)) {
  fail(`Refusing to replace an unrecognized OpenCode runtime: ${runtimeRoot}`)
}

try {
  mkdirSync(opencodeRoot, { recursive: true })
  mkdirSync(stagingRoot, { recursive: true })
  for (const path of distributionPaths) {
    const source = resolve(repoRoot, path)
    if (!existsSync(source)) throw new Error(`Distribution source is missing: ${path}`)
    const target = resolve(stagingRoot, path)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(source, target, { recursive: true })
  }
  run('npm', ['ci', '--ignore-scripts'], stagingRoot)
  run('npm', ['run', 'build'], stagingRoot)

  const entry = resolve(stagingRoot, 'dist', 'src', 'index.js')
  if (!existsSync(entry)) throw new Error(`Build did not create plugin entry: ${entry}`)
  if (process.env.AE_INSTALL_CORRUPT_STAGED_ENTRY === '1') {
    writeFileSync(entry, 'throw new Error("Injected staged plugin load failure")\n', 'utf8')
  }
  validatePluginEntry(entry, stagingRoot)
  writeFileSync(resolve(stagingRoot, ownershipFileName), `${JSON.stringify(ownership, null, 2)}\n`, 'utf8')

  let previousBridge = null
  if (existsSync(bridgePath)) previousBridge = readFileSync(bridgePath, 'utf8')
  try {
    if (existsSync(runtimeRoot)) renameWithRetry(runtimeRoot, backupRoot)
    renameWithRetry(stagingRoot, runtimeRoot)
    if (process.env.AE_INSTALL_FAIL_AFTER_ACTIVATION === '1') {
      throw new Error('Injected failure after runtime activation')
    }
    mkdirSync(dirname(bridgePath), { recursive: true })
    writeFileSync(bridgePath, bridgeContent, 'utf8')
    if (existsSync(backupRoot)) rmSync(backupRoot, { recursive: true, force: true })
  } catch (error) {
    if (existsSync(runtimeRoot)) rmSync(runtimeRoot, { recursive: true, force: true })
    if (existsSync(backupRoot)) renameWithRetry(backupRoot, runtimeRoot)
    if (previousBridge === null) rmSync(bridgePath, { force: true })
    else writeFileSync(bridgePath, previousBridge, 'utf8')
    throw error
  }

  console.log(JSON.stringify({ status: 'installed', targetRoot, runtime: '.opencode/ai-agent-engine', bridge: '.opencode/plugins/ae-server.js' }, null, 2))
} catch (error) {
  if (existsSync(stagingRoot)) rmSync(stagingRoot, { recursive: true, force: true })
  console.error(`OpenCode runtime installation failed: ${error.message}`)
  process.exit(1)
}

function readArg(name) {
  const index = args.indexOf(name)
  return index < 0 ? null : args[index + 1] || null
}

function assertSafeTargetPath(root) {
  for (const path of [root, resolve(root, '.opencode'), resolve(root, '.opencode', 'plugins'), bridgePath, runtimeRoot]) {
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
      fail(`Refusing to install through a symbolic link or junction: ${path}`)
    }
  }
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32' && command === 'npm',
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(' ')} failed with exit ${result.status}`)
}

function validatePluginEntry(entry, cwd) {
  const script = [
    "import { createRequire } from 'node:module'",
    'globalThis.require = createRequire(import.meta.url)',
    `const pluginModule = await import(${JSON.stringify(pathToFileURL(entry).href)})`,
    "if (typeof pluginModule.default !== 'function') throw new Error('Plugin entry must export a default function')",
  ].join('\n')
  run(process.execPath, ['--input-type=module', '--eval', script], cwd)
}

function isOwnedRuntime(root) {
  try {
    const value = JSON.parse(readFileSync(resolve(root, ownershipFileName), 'utf8'))
    return value?.schemaVersion === ownership.schemaVersion
      && value?.product === ownership.product
      && value?.scope === ownership.scope
  } catch {
    return false
  }
}

function renameWithRetry(source, target) {
  const retryableCodes = new Set(['EBUSY', 'ENOTEMPTY', 'EPERM'])
  let lastError
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      renameSync(source, target)
      return
    } catch (error) {
      lastError = error
      if (!retryableCodes.has(error?.code) || attempt === 7) throw error
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
    }
  }
  throw lastError
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
