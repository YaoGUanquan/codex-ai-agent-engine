import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { runGlobalInstall } from '../plugins/ai-agent-engine-codex/scripts/global-install.mjs'
import { fingerprintPath, normalizeManifest, userPaths } from '../plugins/ai-agent-engine-codex/scripts/global-install-contract.mjs'
import { resolveProjectRoot } from '../plugins/ai-agent-engine-codex/scripts/project-root.mjs'
import { runNodeScript } from './helpers/skill-test-utils.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const currentSkillNames = readdirSync(join(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('ae-'))
  .map((entry) => entry.name)
  .sort()

function fakeCodexRunner() {
  return { status: 0, stdout: '{"status":"installed"}', stderr: '' }
}

function applyPreview(home, extraArgs = [], commandRunner = fakeCodexRunner) {
  const preview = runGlobalInstall(['preview', '--home', home, ...extraArgs], { repoRoot })
  return runGlobalInstall(['apply', '--home', home, ...extraArgs, '--apply', '--operation', preview.operationId, '--confirm', preview.confirmation], { repoRoot, commandRunner })
}

test('global dispatcher resolves the nearest project marker and requires an explicit root for unmarked init', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-project-root-'))
  try {
    const project = join(tempRoot, 'project')
    const nested = join(project, 'packages', 'nested')
    mkdirSync(join(project, '.git'), { recursive: true })
    mkdirSync(nested, { recursive: true })
    assert.equal(resolveProjectRoot({ cwd: nested, command: 'recovery' }).root, project)
    assert.throws(() => resolveProjectRoot({ cwd: tempRoot, command: 'init' }), /AE_PROJECT_ROOT_REQUIRED/)
    assert.equal(resolveProjectRoot({ cwd: tempRoot, explicitRoot: tempRoot, command: 'init' }).root, tempRoot)
    assert.throws(() => resolveProjectRoot({ cwd: tempRoot, explicitRoot: tempRoot, command: 'recovery' }), /AE_PROJECT_ROOT_REQUIRED/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global manifest rejects another Windows user home', { skip: process.platform !== 'win32' }, () => {
  assert.throws(() => normalizeManifest({ projects: [{ root: 'C:\\Users\\another-user\\project', role: 'consumer' }] }, { repoRoot, home: 'C:\\Users\\yaogu', allowCustomConsumers: true }), /another user home/)
})

test('global install apply preserves project docs and retains operation backup until explicit purge', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-global-install-'))
  try {
    const home = join(tempRoot, 'home')
    const project = join(tempRoot, 'consumer')
    const manifestPath = join(tempRoot, 'manifest.json')
    const registrationCalls = []
    const commandRunner = (request) => {
      registrationCalls.push(request)
      return { status: 0, stdout: '{"status":"installed"}', stderr: '' }
    }
    mkdirSync(home, { recursive: true })
    mkdirSync(join(home, '.agents', 'plugins'), { recursive: true })
    writeFileSync(join(home, '.agents', 'plugins', 'marketplace.json'), JSON.stringify({
      name: 'personal',
      interface: { displayName: 'Personal' },
      plugins: [{ name: 'third-party', source: { source: 'local', path: './plugins/third-party' } }],
    }), 'utf8')
    cpSync(join(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills', 'ae-help'), join(home, '.agents', 'skills', 'ae-help'), { recursive: true })
    mkdirSync(join(project, 'docs', '08-ai-memory'), { recursive: true })
    writeFileSync(join(project, 'docs', '08-ai-memory', 'history.md'), 'project history stays here\n', 'utf8')
    const docsBefore = readFileSync(join(project, 'docs', '08-ai-memory', 'history.md'), 'utf8')
    cpSync(join(repoRoot, 'plugins', 'ai-agent-engine-codex'), join(project, 'plugins', 'ai-agent-engine-codex'), { recursive: true })
    cpSync(join(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills', 'ae-help'), join(project, '.agents', 'skills', 'ae-help'), { recursive: true })
    mkdirSync(join(project, 'scripts'), { recursive: true })
    writeFileSync(join(project, 'scripts', 'ae-tools.mjs'), "import '../plugins/ai-agent-engine-codex/scripts/ae-tools.mjs'\n", 'utf8')
    mkdirSync(join(project, '.agents', 'plugins'), { recursive: true })
    writeFileSync(join(project, '.agents', 'plugins', 'marketplace.json'), JSON.stringify({ plugins: [
      { name: 'third-party', source: { source: 'local', path: './plugins/third-party' } },
      { name: 'ai-agent-engine-codex', source: { source: 'local', path: './plugins/ai-agent-engine-codex' } },
    ] }), 'utf8')
    writeFileSync(manifestPath, JSON.stringify({ projects: [{ root: project, role: 'consumer' }] }), 'utf8')

    const preview = runGlobalInstall(['preview', '--home', home, '--manifest', manifestPath], { repoRoot })
    assert.equal(preview.status, 'preview')
    assert.equal(preview.projects[0].role, 'consumer')
    let injectedFailure
    try {
      runGlobalInstall(['apply', '--home', home, '--manifest', manifestPath, '--apply', '--operation', preview.operationId, '--confirm', preview.confirmation, '--fail-at', 'cleanup-consumers'], { repoRoot, commandRunner })
    } catch (error) {
      injectedFailure = error
    }
    assert.equal(injectedFailure?.operation?.status, 'rolled-back')
    assert.equal(readFileSync(join(project, 'docs', '08-ai-memory', 'history.md'), 'utf8'), docsBefore)
    assert.equal(existsSync(join(project, 'plugins', 'ai-agent-engine-codex')), true)
    assert.equal(existsSync(join(home, '.agents', 'skills', 'ae-help')), true)
    assert.equal(existsSync(join(home, '.agents', 'ai-agent-engine-codex', 'staging', preview.operationId)), false)

    const successPreview = runGlobalInstall(['preview', '--home', home, '--manifest', manifestPath], { repoRoot })
    const applied = runGlobalInstall(['apply', '--home', home, '--manifest', manifestPath, '--apply', '--operation', successPreview.operationId, '--confirm', successPreview.confirmation], { repoRoot, commandRunner })
    assert.equal(applied.status, 'completed')
    assert.equal(readFileSync(join(project, 'docs', '08-ai-memory', 'history.md'), 'utf8'), docsBefore)
    assert.equal(existsSync(join(project, 'plugins', 'ai-agent-engine-codex')), false)
    assert.equal(existsSync(join(project, '.agents', 'skills', 'ae-help')), false)
    assert.equal(existsSync(join(home, '.agents', 'skills', 'ae-help')), false)
    assert.equal(existsSync(join(home, 'plugins', 'ai-agent-engine-codex')), true)
    assert.equal(readFileSync(join(home, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json'), 'utf8'), readFileSync(join(repoRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json'), 'utf8'))
    const personalMarketplace = JSON.parse(readFileSync(join(home, '.agents', 'plugins', 'marketplace.json'), 'utf8'))
    assert.equal(personalMarketplace.name, 'personal')
    assert.deepEqual(personalMarketplace.plugins.map((entry) => entry.name), ['third-party', 'ai-agent-engine-codex'])
    assert.deepEqual(registrationCalls, [
      { command: 'codex', args: ['plugin', 'marketplace', 'add', home, '--json'], homeRoot: home },
      { command: 'codex', args: ['plugin', 'add', 'ai-agent-engine-codex@personal', '--json'], homeRoot: home },
    ])
    assert.equal(existsSync(applied.journal), true)
    assert.equal(existsSync(applied.backupRoot), true)
    assert.equal(existsSync(join(applied.backupRoot, 'user-skills', 'ae-help')), true)
    assert.equal(existsSync(join(home, '.agents', 'ai-agent-engine-codex', 'staging', successPreview.operationId)), false)
    const dispatcher = spawnSync(process.execPath, [join(home, '.agents', 'ai-agent-engine-codex', 'bin', 'ae.mjs'), 'init', '--dry-run', '--project-root', project], {
      cwd: project,
      encoding: 'utf8',
    })
    assert.equal(dispatcher.status, 0, dispatcher.stderr)
    assert.equal(JSON.parse(dispatcher.stdout).status, 'dry-run')
    const marketplace = JSON.parse(readFileSync(join(project, '.agents', 'plugins', 'marketplace.json'), 'utf8'))
    assert.deepEqual(marketplace.plugins.map((entry) => entry.name), ['third-party'])
    const purgePreview = runGlobalInstall(['purge', '--home', home, '--operation', successPreview.operationId], { repoRoot })
    assert.equal(purgePreview.status, 'purge-preview')
    assert.equal(existsSync(applied.backupRoot), true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global install rolls back personal plugin publication when Codex registration fails', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-global-plugin-failure-'))
  try {
    const home = join(tempRoot, 'home')
    mkdirSync(home, { recursive: true })
    mkdirSync(join(home, '.agents', 'skills', 'ae-local-modified'), { recursive: true })
    writeFileSync(join(home, '.agents', 'skills', 'ae-local-modified', 'SKILL.md'), 'local modification\n', 'utf8')
    const preview = runGlobalInstall(['preview', '--home', home], { repoRoot })
    assert.throws(() => runGlobalInstall(['apply', '--home', home, '--retire-modified', '--apply', '--operation', preview.operationId, '--confirm', preview.confirmation], {
      repoRoot,
      commandRunner: () => ({ status: 0, stdout: '', stderr: '' }),
    }), /retirement authorization/)
    const authorizedPreview = runGlobalInstall(['preview', '--home', home, '--retire-modified'], { repoRoot })
    let failure
    try {
      runGlobalInstall(['apply', '--home', home, '--retire-modified', '--apply', '--operation', authorizedPreview.operationId, '--confirm', authorizedPreview.confirmation], {
        repoRoot,
        commandRunner: () => ({ status: 1, stdout: '', stderr: 'simulated Codex failure' }),
      })
    } catch (error) {
      failure = error
    }
    assert.equal(failure?.operation?.status, 'rolled-back')
    assert.equal(existsSync(join(home, 'plugins', 'ai-agent-engine-codex')), false)
    assert.equal(existsSync(join(home, '.agents', 'plugins', 'marketplace.json')), false)
    assert.equal(existsSync(join(home, '.agents', 'ai-agent-engine-codex', 'runtime', 'plugin')), false)
    assert.equal(existsSync(join(home, '.agents', 'ai-agent-engine-codex', 'bin', 'ae.mjs')), false)
    assert.equal(existsSync(join(home, '.agents', 'skills', 'ae-local-modified', 'SKILL.md')), true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global install rolls back when marketplace registration fails before plugin add', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-global-marketplace-failure-'))
  try {
    const home = join(tempRoot, 'home')
    mkdirSync(home, { recursive: true })
    const preview = runGlobalInstall(['preview', '--home', home, '--retire-modified'], { repoRoot })
    const calls = []
    let failure
    try {
      runGlobalInstall(['apply', '--home', home, '--retire-modified', '--apply', '--operation', preview.operationId, '--confirm', preview.confirmation], {
        repoRoot,
        commandRunner: (request) => {
          calls.push(request)
          return { status: 1, stdout: '', stderr: 'simulated marketplace failure' }
        },
      })
    } catch (error) {
      failure = error
    }
    assert.equal(failure?.operation?.status, 'rolled-back')
    assert.match(failure?.message || '', /marketplace registration failed/)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].args[0], 'plugin')
    assert.equal(calls[0].args[1], 'marketplace')
    assert.equal(existsSync(join(home, 'plugins', 'ai-agent-engine-codex')), false)
    assert.equal(existsSync(join(home, '.agents', 'plugins', 'marketplace.json')), false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global install does not purge a recovery-failed operation', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-global-recovery-purge-'))
  try {
    const home = join(tempRoot, 'home')
    const operation = '11111111-1111-4111-8111-111111111111'
    const journal = join(home, '.agents', 'ai-agent-engine-codex', 'operations', `${operation}.json`)
    mkdirSync(join(home, '.agents', 'ai-agent-engine-codex', 'operations'), { recursive: true })
    writeFileSync(journal, JSON.stringify({ id: operation, status: 'recovery-failed' }), 'utf8')
    assert.throws(() => runGlobalInstall(['purge', '--home', home, '--operation', operation], { repoRoot }), /before recovery completes/)
    assert.equal(existsSync(journal), true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global install publishes Cursor skill copies for slash discovery', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-cursor-skills-'))
  try {
    const home = join(tempRoot, 'home')
    mkdirSync(home, { recursive: true })
    const foreign = join(home, '.cursor', 'skills', 'other-skill')
    mkdirSync(foreign, { recursive: true })
    writeFileSync(join(foreign, 'SKILL.md'), 'keep this personal cursor skill\n', 'utf8')
    const reserved = join(home, '.cursor', 'skills-cursor', 'builtin')
    mkdirSync(reserved, { recursive: true })
    writeFileSync(join(reserved, 'SKILL.md'), 'reserved cursor skills stay untouched\n', 'utf8')
    const foreignBefore = readFileSync(join(foreign, 'SKILL.md'), 'utf8')
    const reservedBefore = readFileSync(join(reserved, 'SKILL.md'), 'utf8')

    const preview = runGlobalInstall(['preview', '--home', home], { repoRoot })
    assert.equal(preview.status, 'preview')
    assert.equal(preview.cursorSkillsRoot, userPaths(home).cursorSkillsRoot)
    assert.ok(Array.isArray(preview.cursorSkills))
    assert.equal(preview.cursorSkills.length, currentSkillNames.length)
    assert.equal(preview.cursorSkills.every((item) => item.status === 'missing'), true)
    assert.equal(existsSync(join(home, 'plugins', 'ai-agent-engine-codex')), false)

    const applied = applyPreview(home)
    assert.equal(applied.status, 'completed')
    for (const name of currentSkillNames) {
      const copyPath = join(home, '.cursor', 'skills', name)
      const expected = join(home, 'plugins', 'ai-agent-engine-codex', 'skills', name)
      assert.equal(existsSync(copyPath), true, name)
      assert.equal(lstatSync(copyPath).isSymbolicLink(), false, name)
      assert.equal(lstatSync(copyPath).isDirectory(), true, name)
      assert.equal(fingerprintPath(copyPath).sha256, fingerprintPath(expected).sha256, name)
    }
    assert.equal(readFileSync(join(foreign, 'SKILL.md'), 'utf8'), foreignBefore)
    assert.equal(readFileSync(join(reserved, 'SKILL.md'), 'utf8'), reservedBefore)
    assert.equal(existsSync(join(home, '.agents', 'skills', 'ae-help')), false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global install blocks a modified Cursor ae skill without retire-modified', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-cursor-modified-'))
  try {
    const home = join(tempRoot, 'home')
    mkdirSync(join(home, '.cursor', 'skills', 'ae-help'), { recursive: true })
    writeFileSync(join(home, '.cursor', 'skills', 'ae-help', 'SKILL.md'), 'user edited cursor skill\n', 'utf8')
    const preview = runGlobalInstall(['preview', '--home', home], { repoRoot })
    const modified = preview.cursorSkills.find((item) => item.name === 'ae-help')
    assert.equal(modified?.status, 'modified')
    assert.throws(() => applyPreview(home), /unknown or modified/)
    assert.equal(readFileSync(join(home, '.cursor', 'skills', 'ae-help', 'SKILL.md'), 'utf8'), 'user edited cursor skill\n')
    assert.equal(existsSync(join(home, 'plugins', 'ai-agent-engine-codex')), false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global install replaces legacy Cursor skill links with copies without retire-modified', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-cursor-legacy-link-'))
  try {
    const home = join(tempRoot, 'home')
    mkdirSync(home, { recursive: true })
    const applied = applyPreview(home)
    assert.equal(applied.status, 'completed')
    const linkType = process.platform === 'win32' ? 'junction' : 'dir'
    for (const name of currentSkillNames) {
      const dest = join(home, '.cursor', 'skills', name)
      const expected = join(home, 'plugins', 'ai-agent-engine-codex', 'skills', name)
      rmSync(dest, { recursive: true, force: false })
      symlinkSync(expected, dest, linkType)
      assert.equal(lstatSync(dest).isSymbolicLink(), true, name)
    }
    const preview = runGlobalInstall(['preview', '--home', home], { repoRoot })
    assert.equal(preview.cursorSkills.every((item) => item.status === 'historical-release verified'), true)
    const upgraded = applyPreview(home)
    assert.equal(upgraded.status, 'completed')
    for (const name of currentSkillNames) {
      const dest = join(home, '.cursor', 'skills', name)
      const expected = join(home, 'plugins', 'ai-agent-engine-codex', 'skills', name)
      assert.equal(lstatSync(dest).isSymbolicLink(), false, name)
      assert.equal(lstatSync(dest).isDirectory(), true, name)
      assert.equal(fingerprintPath(dest).sha256, fingerprintPath(expected).sha256, name)
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('global install rolls back Cursor skill copies with the installer-owned batch', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-cursor-rollback-'))
  try {
    const home = join(tempRoot, 'home')
    mkdirSync(home, { recursive: true })
    const preview = runGlobalInstall(['preview', '--home', home], { repoRoot })
    let injectedFailure
    try {
      runGlobalInstall(['apply', '--home', home, '--apply', '--operation', preview.operationId, '--confirm', preview.confirmation, '--fail-at', 'publish-cursor-skills'], {
        repoRoot,
        commandRunner: fakeCodexRunner,
      })
    } catch (error) {
      injectedFailure = error
    }
    assert.equal(injectedFailure?.operation?.status, 'rolled-back')
    assert.equal(existsSync(join(home, '.cursor', 'skills', 'ae-help')), false)
    assert.equal(existsSync(join(home, 'plugins', 'ai-agent-engine-codex')), false)

    const authorizedPreview = runGlobalInstall(['preview', '--home', home], { repoRoot })
    let cliFailure
    try {
      runGlobalInstall(['apply', '--home', home, '--apply', '--operation', authorizedPreview.operationId, '--confirm', authorizedPreview.confirmation], {
        repoRoot,
        commandRunner: () => ({ status: 1, stdout: '', stderr: 'simulated Codex failure' }),
      })
    } catch (error) {
      cliFailure = error
    }
    assert.equal(cliFailure?.operation?.status, 'rolled-back')
    assert.equal(existsSync(join(home, '.cursor', 'skills', 'ae-help')), false)
    assert.equal(existsSync(join(home, 'plugins', 'ai-agent-engine-codex')), false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-install-smoke reports ok and verifies new skills', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.ok(result.verifiedCommands.includes('recovery'))
  assert.ok(result.verifiedCommands.includes('claude-delegate'))
  assert.ok(result.verifiedCommands.includes('check-ae-artifacts'))
  assert.ok(result.verifiedCommands.includes('check-design-contract'))
  assert.ok(result.verifiedCommands.includes('check-memory-knowledge-contract'))
  assert.ok(result.verifiedCommands.includes('ae-memory-query'))
  assert.deepEqual(result.verifiedSkills, [
    'ae-prd',
    'ae-work-report',
    'ae-task-loop',
    'ae-constitution',
    'ae-tasks',
    'ae-design',
    'ae-web-app',
    'ae-web-forge',
    'ae-backend',
    'ae-debug',
    'ae-reverse-engineering',
    'ae-tdd',
    'ae-test-api',
    'ae-claude-code',
    'ae-markitdown',
    'ae-static-server',
    'ae-imagegen-prompt',
  ])
})

test('installed language switching updates active skills for all supported modes', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.deepEqual(result.verifiedLanguageModes, ['bilingual', 'en', 'zh-CN'])
  assert.equal(result.verifiedMultiAgentPolicy, 'multi_agent_auto_analysis_by_default')
  assert.equal(result.verifiedSkillGovernancePolicy, 'source_mirror_metadata_and_path_safety')
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))
  assert.equal(result.verifiedPluginVersion, packageJson.version)
})
