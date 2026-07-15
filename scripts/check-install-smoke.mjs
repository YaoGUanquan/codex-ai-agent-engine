#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const targetRoot = mkdtempSync(resolve(tmpdir(), 'ae-opencode-install-'))
const installer = resolve(repoRoot, 'scripts', 'install-project.mjs')
const runtimeRoot = resolve(targetRoot, '.opencode', 'ai-agent-engine')
const bridgePath = resolve(targetRoot, '.opencode', 'plugins', 'ae-server.js')
const excluded = ['ae-pdf', 'ae-docx', 'ae-xlsx', 'ae-pptx', 'ae-officecli']
const parityManifest = JSON.parse(readFileSync(resolve(repoRoot, 'docs', 'ae', 'parity', 'opencode-upstream-a144f785-manifest.json'), 'utf8'))
const sourceSentinel = resolve(repoRoot, `.install-secret-sentinel-${randomUUID()}`)

try {
  writeFileSync(sourceSentinel, 'must not be distributed', 'utf8')
  mkdirSync(resolve(targetRoot, '.opencode', 'plugins'), { recursive: true })
  writeFileSync(bridgePath, 'export default "foreign bridge"\n', 'utf8')
  const refused = runInstall({}, false)
  if (refused.status === 0) throw new Error('Installer overwrote an unrecognized bridge')
  if (readFileSync(bridgePath, 'utf8') !== 'export default "foreign bridge"\n') {
    throw new Error('Installer changed an unrecognized bridge')
  }
  rmSync(bridgePath, { force: true })

  mkdirSync(runtimeRoot, { recursive: true })
  const foreignRuntimeMarker = resolve(runtimeRoot, 'foreign-runtime.txt')
  writeFileSync(foreignRuntimeMarker, 'must not be replaced', 'utf8')
  const foreignRuntimeRefused = runInstall({}, false)
  if (foreignRuntimeRefused.status === 0) throw new Error('Installer replaced an unrecognized runtime directory')
  if (!existsSync(foreignRuntimeMarker)) throw new Error('Installer changed an unrecognized runtime directory')
  rmSync(runtimeRoot, { recursive: true, force: true })

  runInstall()

  const entryPath = resolve(runtimeRoot, 'dist', 'src', 'index.js')
  if (!existsSync(entryPath)) throw new Error('Installed runtime entry is missing')
  if (!existsSync(bridgePath)) throw new Error('Installed OpenCode bridge is missing')
  if (!readFileSync(bridgePath, 'utf8').includes("../ai-agent-engine/dist/src/index.js")) {
    throw new Error('Installed bridge does not target the project-local runtime')
  }

  const packageJson = readFileSync(resolve(runtimeRoot, 'package.json'), 'utf8')
  if (existsSync(resolve(runtimeRoot, sourceSentinel.split(/[\\/]/).at(-1)))) {
    throw new Error('Installer copied a non-distribution source file')
  }
  for (const name of excluded) {
    if (existsSync(resolve(runtimeRoot, 'src', 'assets', 'skills', name))) {
      throw new Error(`Installed runtime contains excluded skill: ${name}`)
    }
    if (packageJson.includes(name)) throw new Error(`Installed package advertises excluded capability: ${name}`)
  }
  for (const dependency of ['@officecli/sdk', 'pdf-lib', 'pdf-parse', 'pdfjs-dist', '@napi-rs/canvas']) {
    if (packageJson.includes(dependency)) throw new Error(`Installed package contains excluded dependency: ${dependency}`)
  }
  const installedPaths = collectPaths(runtimeRoot)
  for (const fragment of parityManifest.excludedPathFragments) {
    if (installedPaths.some((path) => path.includes(fragment.toLowerCase()))) {
      throw new Error(`Installed runtime path contains excluded fragment: ${fragment}`)
    }
  }
  for (const toolName of parityManifest.expectedTools) {
    const toolPath = resolve(runtimeRoot, 'src', 'tools', `${toolName}.tool.ts`)
    if (!existsSync(toolPath)) throw new Error(`Installed runtime is missing manifest tool: ${toolName}`)
  }

  const markerPath = resolve(runtimeRoot, 'rollback-marker.txt')
  const originalBridge = readFileSync(bridgePath, 'utf8')
  writeFileSync(markerPath, 'previous runtime', 'utf8')
  const invalidEntry = runInstall({ AE_INSTALL_CORRUPT_STAGED_ENTRY: '1' }, false)
  if (invalidEntry.status === 0) throw new Error('Installer activated a plugin entry that fails to load')
  if (!existsSync(markerPath)) throw new Error('Plugin load validation failure did not preserve the previous runtime')
  if (readFileSync(bridgePath, 'utf8') !== originalBridge) {
    throw new Error('Plugin load validation failure changed the previous bridge')
  }

  const failed = runInstall({ AE_INSTALL_FAIL_AFTER_ACTIVATION: '1' }, false)
  if (failed.status === 0) throw new Error('Injected activation failure unexpectedly succeeded')
  if (!existsSync(markerPath)) throw new Error('Failed update did not restore the previous runtime')
  if (readFileSync(bridgePath, 'utf8') !== originalBridge) {
    throw new Error('Failed update changed the previous bridge')
  }

  const uninstallScript = resolve(runtimeRoot, 'scripts', 'uninstall.js')
  const detected = run(process.execPath, [uninstallScript, '--detect'], { cwd: targetRoot })
  const detection = JSON.parse(detected.stdout)
  if (detection.project?.installed !== true) throw new Error('Uninstall detection missed the project runtime')
  writeFileSync(bridgePath, 'export default "foreign bridge"\n', 'utf8')
  const foreignUninstall = run(process.execPath, [uninstallScript, '--scope', 'project', '--yes'], { cwd: targetRoot }, false)
  if (foreignUninstall.status === 0) throw new Error('Uninstaller removed an unrecognized bridge')
  if (!existsSync(runtimeRoot)) throw new Error('Uninstaller removed the owned runtime while refusing a foreign bridge')
  if (readFileSync(bridgePath, 'utf8') !== 'export default "foreign bridge"\n') {
    throw new Error('Uninstaller changed an unrecognized bridge')
  }
  writeFileSync(bridgePath, originalBridge, 'utf8')
  const failedUninstall = run(
    process.execPath,
    [uninstallScript, '--scope', 'project', '--yes'],
    { cwd: targetRoot, env: { ...process.env, AE_UNINSTALL_FAIL_BRIDGE_REMOVE: '1' } },
    false,
  )
  if (failedUninstall.status === 0) throw new Error('Injected bridge removal failure unexpectedly succeeded')
  if (!existsSync(runtimeRoot)) throw new Error('Failed uninstall did not restore the owned runtime')
  if (readFileSync(bridgePath, 'utf8') !== originalBridge) {
    throw new Error('Failed uninstall did not restore the owned bridge')
  }
  const pendingCleanup = run(
    process.execPath,
    [uninstallScript, '--scope', 'project', '--yes'],
    { cwd: targetRoot, env: { ...process.env, AE_UNINSTALL_FAIL_RUNTIME_REMOVE: '1' } },
  )
  const pendingResult = JSON.parse(pendingCleanup.stdout)
  if (!pendingResult.cleanupPending || !existsSync(pendingResult.cleanupPending)) {
    throw new Error('Runtime cleanup failure did not report the pending removal directory')
  }
  if (existsSync(runtimeRoot) || existsSync(bridgePath)) {
    throw new Error('Committed uninstall left active runtime files behind')
  }
  renameSync(pendingResult.cleanupPending, runtimeRoot)
  writeFileSync(bridgePath, originalBridge, 'utf8')
  run(process.execPath, [uninstallScript, '--scope', 'project', '--yes'], { cwd: targetRoot })
  if (existsSync(runtimeRoot) || existsSync(bridgePath)) throw new Error('Project uninstall left runtime files behind')

  console.log(JSON.stringify({
    status: 'ok',
    verified: ['distribution-allowlist', 'manifest-tool-surface', 'excluded-path-fragments', 'foreign-bridge-refusal', 'foreign-runtime-refusal', 'foreign-uninstall-refusal', 'uninstall-rollback', 'uninstall-cleanup-reporting', 'staged-plugin-load', 'project-local-build', 'bridge-activation', 'office-pdf-exclusion', 'activation-rollback', 'project-uninstall'],
  }, null, 2))
} finally {
  rmSync(sourceSentinel, { force: true })
  rmSync(targetRoot, { recursive: true, force: true })
}

function runInstall(extraEnv = {}, requireSuccess = true) {
  const result = spawnSync(process.execPath, [installer, '--target', targetRoot], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, AE_TALK_NORMAL_OFFLINE: '1', ...extraEnv },
  })
  if (requireSuccess && result.status !== 0) {
    throw new Error([result.stdout, result.stderr].filter(Boolean).join('\n'))
  }
  return result
}

function run(command, args, options = {}, requireSuccess = true) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    env: options.env || process.env,
  })
  if (requireSuccess && result.status !== 0) throw new Error([result.stdout, result.stderr].filter(Boolean).join('\n'))
  return result
}

function collectPaths(root, base = root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name)
    const relativePath = path.slice(base.length + 1).replaceAll('\\', '/').toLowerCase()
    return entry.isDirectory() && statSync(path).isDirectory()
      ? [relativePath, ...collectPaths(path, base)]
      : [relativePath]
  })
}
