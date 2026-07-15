#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const targetRoot = process.cwd()
const runtimeRoot = resolve(targetRoot, '.opencode', 'ai-agent-engine')
const bridgePath = resolve(targetRoot, '.opencode', 'plugins', 'ae-server.js')
const bridgeContent = "export { default } from '../ai-agent-engine/dist/src/index.js'\n"
const ownershipPath = resolve(runtimeRoot, '.ae-install-owner.json')
const removalRoot = `${runtimeRoot}.removing-${process.pid}`

if (process.argv.includes('--detect')) {
  console.log(JSON.stringify({
    project: {
      installed: existsSync(runtimeRoot) || existsSync(bridgePath),
      bridgeExists: existsSync(bridgePath),
      repoExists: existsSync(runtimeRoot),
      bridgeFile: bridgePath,
      repoDir: runtimeRoot,
    },
  }, null, 2))
  process.exit(0)
}

const scopes = process.argv.filter((arg) => arg === 'global' || arg === 'project')
if (scopes.includes('global')) {
  console.error('This branch supports project-level uninstallation only.')
  process.exit(1)
}
if (!process.argv.includes('--yes')) {
  console.error('Project uninstall requires explicit --yes authorization.')
  process.exit(1)
}

for (const path of [resolve(targetRoot, '.opencode'), resolve(targetRoot, '.opencode', 'plugins'), bridgePath, runtimeRoot]) {
  if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
    console.error(`Refusing to uninstall through a symbolic link or junction: ${path}`)
    process.exit(1)
  }
}
if (existsSync(runtimeRoot) && !isOwnedRuntime()) {
  console.error(`Refusing to remove an unrecognized OpenCode runtime: ${runtimeRoot}`)
  process.exit(1)
}
if (existsSync(bridgePath) && readFileSync(bridgePath, 'utf8') !== bridgeContent) {
  console.error(`Refusing to remove an unrecognized OpenCode bridge: ${bridgePath}`)
  process.exit(1)
}

let runtimeMoved = false
try {
  if (existsSync(runtimeRoot)) {
    renameSync(runtimeRoot, removalRoot)
    runtimeMoved = true
  }
  if (process.env.AE_UNINSTALL_FAIL_BRIDGE_REMOVE === '1') {
    throw new Error('Injected bridge removal failure')
  }
  rmSync(bridgePath, { force: true })
} catch (error) {
  if (runtimeMoved && existsSync(removalRoot) && !existsSync(runtimeRoot)) {
    renameSync(removalRoot, runtimeRoot)
  }
  console.error(`Project uninstall failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

let cleanupPending = null
if (runtimeMoved) {
  try {
    if (process.env.AE_UNINSTALL_FAIL_RUNTIME_REMOVE === '1') {
      throw new Error('Injected runtime removal failure')
    }
    rmSync(removalRoot, { recursive: true, force: true })
  } catch (error) {
    cleanupPending = removalRoot
    console.warn(`Runtime cleanup remains pending at ${removalRoot}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
console.log(JSON.stringify({ status: 'uninstalled', scope: 'project', targetRoot, cleanupPending }, null, 2))

function isOwnedRuntime() {
  try {
    const value = JSON.parse(readFileSync(ownershipPath, 'utf8'))
    return value?.schemaVersion === 1
      && value?.product === 'ai-agent-engine-opencode'
      && value?.scope === 'project'
  } catch {
    return false
  }
}
