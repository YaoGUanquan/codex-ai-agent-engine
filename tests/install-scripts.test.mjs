import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { repoRoot, runGit } from './helpers/skill-test-utils.mjs'

function makeTempDir(prefix) {
  return mkdtempSync(join(realpathSync.native(tmpdir()), prefix))
}

function runScript(relativePath, args, cwd) {
  return spawnSync(process.execPath, [resolve(repoRoot, relativePath), ...args], {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

// install-project inherits stdio from its language setter, so stdout can hold
// several JSON documents; the installer's own summary is the last one.
function parseLastJson(stdout) {
  const blocks = stdout.trim().split(/\r?\n(?=\{)/)
  return JSON.parse(blocks[blocks.length - 1])
}

function writeSetRepositoryFixture(root) {
  const placeholderDoc = [
    '# Fixture',
    '',
    'Clone: https://github.com/<owner>/<repo>.git',
    'Home: https://github.com/<owner>/<repo>',
    'Install: https://raw.githubusercontent.com/<owner>/<repo>/main/INSTALL.md',
    'Owner: https://github.com/<owner>',
    '',
  ].join('\n')
  for (const file of ['README.md', 'README.zh-CN.md', 'INSTALL.md', 'INSTALL.zh-CN.md', 'NOTICE.md']) {
    writeFileSync(join(root, file), placeholderDoc, 'utf8')
  }
  mkdirSync(join(root, 'plugins', 'ai-agent-engine-codex', '.codex-plugin'), { recursive: true })
  writeFileSync(join(root, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json'), JSON.stringify({
    name: 'ai-agent-engine-codex',
    repository: 'https://github.com/<owner>/<repo>.git',
    homepage: 'https://github.com/<owner>/<repo>',
    author: { name: 'Fixture', url: 'https://github.com/<owner>' },
    interface: { websiteURL: 'https://github.com/<owner>/<repo>' },
  }, null, 2), 'utf8')
}

test('set-repository rewrites placeholder URLs across docs and plugin manifest', () => {
  const tempRoot = makeTempDir('ae-set-repo-')
  try {
    writeSetRepositoryFixture(tempRoot)
    const result = runScript('scripts/set-repository.mjs', ['--repo', 'https://github.com/acme/widgets.git'], tempRoot)
    assert.equal(result.status, 0, result.stderr)
    const output = JSON.parse(result.stdout)
    assert.equal(output.status, 'updated')
    assert.equal(output.repository, 'https://github.com/acme/widgets.git')
    assert.equal(output.rawInstall, 'https://raw.githubusercontent.com/acme/widgets/main/INSTALL.md')

    const readme = readFileSync(join(tempRoot, 'README.md'), 'utf8')
    assert.ok(!readme.includes('<owner>'), 'README must not keep placeholder owner')
    assert.ok(readme.includes('https://github.com/acme/widgets.git'))
    assert.ok(readme.includes('https://raw.githubusercontent.com/acme/widgets/main/INSTALL.md'))

    const manifest = JSON.parse(readFileSync(join(tempRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json'), 'utf8'))
    assert.equal(manifest.repository, 'https://github.com/acme/widgets.git')
    assert.equal(manifest.homepage, 'https://github.com/acme/widgets')
    assert.equal(manifest.author.url, 'https://github.com/acme')
    assert.equal(manifest.interface.websiteURL, 'https://github.com/acme/widgets')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('set-repository rejects non-GitHub repository URLs', () => {
  const tempRoot = makeTempDir('ae-set-repo-bad-')
  try {
    writeSetRepositoryFixture(tempRoot)
    const result = runScript('scripts/set-repository.mjs', ['--repo', 'https://gitlab.com/acme/widgets.git'], tempRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Only https:\/\/github\.com/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('distribution source keeps plugin skills as the only skill root', () => {
  assert.ok(existsSync(join(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills', 'ae-help', 'SKILL.md')))
  assert.equal(existsSync(join(repoRoot, '.ae-source')), false)
  assert.equal(existsSync(join(repoRoot, '.agents', 'skills')), false)
  assert.equal(existsSync(join(repoRoot, '.agents', 'plugins', 'marketplace.json')), false)
})

test('install-project rejects the distribution source as a target', () => {
  const result = runScript('scripts/install-project.mjs', ['--target', repoRoot], repoRoot)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /refusing to install into the distribution source/)
})

test('install-project installs plugin, skills, marketplace entry, and wrappers into a target project without deleting unowned retired skills', () => {
  const targetRoot = makeTempDir('ae-install-target-')
  try {
    // Pre-create a retired skill so the installer's cleanup path is exercised.
    mkdirSync(join(targetRoot, '.agents', 'skills', 'ae-officecli'), { recursive: true })
    writeFileSync(join(targetRoot, '.agents', 'skills', 'ae-officecli', 'SKILL.md'), '# retired\n', 'utf8')

    const result = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(result.status, 0, result.stderr)
    const output = parseLastJson(result.stdout)
    assert.equal(output.status, 'installed')
    assert.equal(output.lang, 'en')
    assert.equal(output.plugin, 'plugins/ai-agent-engine-codex')

    assert.ok(existsSync(join(targetRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json')))
    assert.ok(existsSync(join(targetRoot, '.agents', 'skills', 'ae-help', 'SKILL.md')))
    assert.ok(existsSync(join(targetRoot, '.agents', 'skills', 'ae-officecli')), 'unowned retired skill must be preserved')

    const marketplace = JSON.parse(readFileSync(join(targetRoot, '.agents', 'plugins', 'marketplace.json'), 'utf8'))
    const entry = marketplace.plugins.find((plugin) => plugin.name === 'ai-agent-engine-codex')
    assert.ok(entry, 'marketplace must register the plugin')
    assert.equal(entry.source.path, './plugins/ai-agent-engine-codex')

    const wrapper = readFileSync(join(targetRoot, 'scripts', 'ae-tools.mjs'), 'utf8')
    assert.match(wrapper, /import '\.\.\/plugins\/ai-agent-engine-codex\/scripts\/ae-tools\.mjs'/)
    for (const script of ['update-ae-codex.mjs', 'set-ae-language.mjs', 'check-ae-artifacts.mjs', 'check-design-contract.mjs', 'check-memory-knowledge-contract.mjs']) {
      assert.ok(existsSync(join(targetRoot, 'scripts', script)), `wrapper ${script} must exist`)
    }
    assert.ok(existsSync(join(targetRoot, '.agents', 'ai-agent-engine-codex', 'project-install.json')), 'installer ownership state must exist')
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('install-project requires an explicit target and protects modified managed components by default', () => {
  const targetRoot = makeTempDir('ae-install-ownership-')
  try {
    const missingTarget = runScript('scripts/install-project.mjs', [], repoRoot)
    assert.equal(missingTarget.status, 1)
    assert.match(missingTarget.stderr, /--target <project>/)

    const first = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(first.status, 0, first.stderr)
    const second = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(second.status, 0, second.stderr, 'unchanged installer-owned files should update normally')

    const wrapperPath = join(targetRoot, 'scripts', 'ae-tools.mjs')
    writeFileSync(wrapperPath, '// consumer change\n', 'utf8')
    const protectedResult = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(protectedResult.status, 1)
    assert.match(protectedResult.stderr, /unowned or modified managed component: scripts\/ae-tools\.mjs/)
    assert.equal(readFileSync(wrapperPath, 'utf8'), '// consumer change\n')

    const replacement = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en', '--replace-modified'], repoRoot)
    assert.equal(replacement.status, 0, replacement.stderr)
    assert.match(readFileSync(wrapperPath, 'utf8'), /plugins\/ai-agent-engine-codex\/scripts\/ae-tools\.mjs/)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('install-project rejects unsupported languages', () => {
  const targetRoot = makeTempDir('ae-install-lang-')
  try {
    const result = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'fr'], repoRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /--lang en\|zh-CN\|bilingual/)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('invalid recovery and failure-injection arguments do not leave installation locks or journals', () => {
  const targetRoot = makeTempDir('ae-install-invalid-args-')
  try {
    for (const args of [['--recover'], ['--recover', '--lang', 'en'], ['--fail-at']]) {
      const result = runScript('scripts/install-project.mjs', ['--target', targetRoot, ...args], repoRoot)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /requires a value/)
      const operationRoot = join(targetRoot, '.agents', 'ai-agent-engine-codex')
      assert.equal(existsSync(join(operationRoot, 'project-install.lock')), false)
      assert.equal(existsSync(join(operationRoot, 'active-operation.json')), false)
      assert.equal(existsSync(join(operationRoot, 'project-install-operations')), false)
    }
    const retry = runScript('scripts/install-project.mjs', ['--target', targetRoot], repoRoot)
    assert.equal(retry.status, 0, retry.stderr)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('project installation stages and validates before activation and rolls back a failed swap', () => {
  const targetRoot = makeTempDir('ae-project-rollback-')
  try {
    const first = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(first.status, 0, first.stderr)
    const installed = parseLastJson(first.stdout)
    assert.equal(installed.source_fingerprint.length, 64)
    assert.match(installed.source_revision, /^[a-f0-9]{40,64}$/)
    const statePath = join(targetRoot, '.agents', 'ai-agent-engine-codex', 'project-install.json')
    const before = readFileSync(statePath, 'utf8')
    const failure = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'zh-CN', '--fail-at', 'moved-old:0'], repoRoot)
    assert.equal(failure.status, 1)
    assert.match(failure.stderr, /injected failure/)
    assert.match(failure.stderr, /rollback completed \(rolled-back\); operation [a-f0-9-]{36}; journal/)
    assert.equal(readFileSync(statePath, 'utf8'), before)
    const help = runScript('scripts/ae-tools.mjs', ['help'], targetRoot)
    assert.equal(help.status, 0, help.stderr)
    const operationRoot = join(targetRoot, '.agents', 'ai-agent-engine-codex')
    const journals = readdirSync(join(operationRoot, 'project-install-operations')).map((name) => JSON.parse(readFileSync(join(operationRoot, 'project-install-operations', name), 'utf8')))
    assert.ok(journals.some((journal) => journal.phase === 'rolled-back'))
    assert.equal(existsSync(join(operationRoot, 'active-operation.json')), false)
    assert.equal(existsSync(join(operationRoot, 'project-install.lock')), false)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('project recovery restores an interrupted rename and is idempotent without overwriting later changes', () => {
  const targetRoot = makeTempDir('ae-project-recover-')
  try {
    const installed = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(installed.status, 0, installed.stderr)
    const operationRoot = join(targetRoot, '.agents', 'ai-agent-engine-codex')
    const state = JSON.parse(readFileSync(join(operationRoot, 'project-install.json'), 'utf8'))
    const id = randomUUID()
    const stage = resolve(operationRoot, 'project-install-staging', id)
    const journal = resolve(operationRoot, 'project-install-operations', `${id}.json`)
    const target = resolve(targetRoot, 'scripts', 'ae-tools.mjs')
    const original = readFileSync(target, 'utf8')
    const backup = resolve(stage, 'old', '0')
    mkdirSync(join(stage, 'old'), { recursive: true })
    renameSync(target, backup)
    writeFileSync(journal, JSON.stringify({
      schemaVersion: 1, id, stage, journal, targetRoot, phase: 'activating',
      changes: [{ rel: 'scripts/ae-tools.mjs', before: state.components['scripts/ae-tools.mjs'], after: state.components['scripts/ae-tools.mjs'], backup, staged: resolve(stage, 'new', 'scripts', 'ae-tools.mjs'), phase: 'moving-old' }],
    }))
    writeFileSync(join(operationRoot, 'active-operation.json'), JSON.stringify({ id }))
    const blocked = runScript('scripts/install-project.mjs', ['--target', targetRoot], repoRoot)
    assert.equal(blocked.status, 1)
    assert.match(blocked.stderr, /unfinished project install/)
    const recovered = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--recover', id], repoRoot)
    assert.equal(recovered.status, 0, recovered.stderr)
    assert.equal(parseLastJson(recovered.stdout).status, 'rolled-back')
    assert.equal(readFileSync(target, 'utf8'), original)
    writeFileSync(target, '// later user edit\n')
    const repeated = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--recover', id], repoRoot)
    assert.equal(repeated.status, 0, repeated.stderr)
    assert.equal(readFileSync(target, 'utf8'), '// later user edit\n')
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('update-project clones a local repository and delegates to its installer', () => {
  const remoteRoot = makeTempDir('ae-update-remote-')
  const targetRoot = makeTempDir('ae-update-target-')
  try {
    // Local git repository standing in for the published plugin repository.
    mkdirSync(join(remoteRoot, 'scripts'), { recursive: true })
    writeFileSync(join(remoteRoot, 'scripts', 'install-project.mjs'), [
      '#!/usr/bin/env node',
      "import { writeFileSync } from 'node:fs'",
      "import { join } from 'node:path'",
      'const args = process.argv.slice(2)',
      "const target = args[args.indexOf('--target') + 1]",
      "const lang = args[args.indexOf('--lang') + 1]",
      "writeFileSync(join(target, 'install-args.json'), JSON.stringify({ target, lang }), 'utf8')",
      '',
    ].join('\n'), 'utf8')
    runGit(['init', '-b', 'main'], remoteRoot)
    runGit(['add', '.'], remoteRoot)
    runGit(['-c', 'user.email=fixture@example.com', '-c', 'user.name=Fixture', 'commit', '-m', 'fixture installer'], remoteRoot)

    const result = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /"status": "updated"/)
    assert.match(result.stdout, /"lang": "en"/)

    const summary = parseLastJson(result.stdout)
    assert.match(summary.source_revision, /^[a-f0-9]{40,64}$/)
    assert.equal(summary.installer_fingerprint.length, 64)
    assert.equal(summary.maintenance.status, 'skipped', 'maintenance should degrade gracefully when the target has no ae-tools CLI')

    const marker = JSON.parse(readFileSync(join(targetRoot, 'install-args.json'), 'utf8'))
    assert.equal(marker.target, targetRoot)
    assert.equal(marker.lang, 'en')
  } finally {
    rmSync(remoteRoot, { recursive: true, force: true })
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('update-project distinguishes committed installation from failed maintenance', () => {
  const remoteRoot = makeTempDir('ae-update-maintenance-failure-')
  const targetRoot = makeTempDir('ae-update-maintenance-target-')
  try {
    mkdirSync(join(remoteRoot, 'scripts'))
    writeFileSync(join(remoteRoot, 'scripts', 'install-project.mjs'), [
      "import { mkdirSync, writeFileSync } from 'node:fs'",
      "import { join } from 'node:path'",
      "const target = process.argv[process.argv.indexOf('--target') + 1]",
      "mkdirSync(join(target, 'scripts'), { recursive: true })",
      "writeFileSync(join(target, 'scripts', 'ae-tools.mjs'), 'process.exit(2)')",
      "writeFileSync(join(target, 'installed.txt'), 'yes')",
    ].join('\n'))
    runGit(['init', '-b', 'main'], remoteRoot)
    runGit(['add', '.'], remoteRoot)
    runGit(['-c', 'user.email=fixture@example.com', '-c', 'user.name=Fixture', 'commit', '-m', 'fixture'], remoteRoot)
    const result = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot], repoRoot)
    assert.equal(result.status, 1)
    const summary = parseLastJson(result.stdout)
    assert.equal(summary.status, 'updated-maintenance-failed')
    assert.equal(summary.installation, 'updated')
    assert.equal(summary.maintenance.status, 'failed')
    assert.equal(readFileSync(join(targetRoot, 'installed.txt'), 'utf8'), 'yes')
    const mismatch = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot, '--revision', 'not-the-cloned-revision'], repoRoot)
    assert.equal(mismatch.status, 1)
    assert.match(mismatch.stderr, /revision does not match/)
  } finally {
    rmSync(remoteRoot, { recursive: true, force: true })
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('update-project preserves bounded recovery diagnostics and redacts credentials on installer failure', () => {
  const remoteRoot = makeTempDir('ae-update-diagnostics-')
  const targetRoot = makeTempDir('ae-update-diagnostics-target-')
  try {
    const id = randomUUID()
    mkdirSync(join(remoteRoot, 'scripts'))
    writeFileSync(join(remoteRoot, 'scripts', 'install-project.mjs'), [
      `console.log('source https://fixture-user:fixture-password@example.test/repo?token=fixture-query#fixture-fragment')`,
      `console.log('Authorization: Bearer fixture-bearer')`,
      `console.log('api_key=fixture-api-key')`,
      `console.log('x'.repeat(20000))`,
      `console.error(${JSON.stringify(`recovery-failed: rollback failed; inspect target/operations/${id}.json; use --recover ${id}`)})`,
      'process.exitCode = 1',
    ].join('\n'))
    runGit(['init', '-b', 'main'], remoteRoot)
    runGit(['add', '.'], remoteRoot)
    runGit(['-c', 'user.email=fixture@example.com', '-c', 'user.name=Fixture', 'commit', '-m', 'fixture failure diagnostics'], remoteRoot)
    const result = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot], repoRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /recovery-failed: rollback failed/)
    assert.ok(result.stderr.includes(`target/operations/${id}.json`))
    assert.ok(result.stderr.includes(`--recover ${id}`))
    assert.match(result.stderr, /truncated/)
    assert.ok(Buffer.byteLength(result.stderr) < 18000)
    assert.doesNotMatch(result.stderr + result.stdout, /fixture-(?:user|password|query|fragment|bearer|api-key)/)
  } finally {
    rmSync(remoteRoot, { recursive: true, force: true })
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('update-project runs post-update tidy maintenance through the installed CLI', () => {
  const remoteRoot = makeTempDir('ae-update-tidy-remote-')
  const targetRoot = makeTempDir('ae-update-tidy-target-')
  try {
    mkdirSync(join(remoteRoot, 'scripts'), { recursive: true })
    // Fixture installer drops a stub ae-tools CLI into the target so the
    // post-update maintenance hook has something real to invoke.
    writeFileSync(join(remoteRoot, 'scripts', 'install-project.mjs'), [
      '#!/usr/bin/env node',
      "import { mkdirSync, writeFileSync } from 'node:fs'",
      "import { join } from 'node:path'",
      'const args = process.argv.slice(2)',
      "const target = args[args.indexOf('--target') + 1]",
      "mkdirSync(join(target, 'scripts'), { recursive: true })",
      'const stub = [',
      "  '#!/usr/bin/env node',",
      "  \"import { writeFileSync } from 'node:fs'\",",
      "  \"writeFileSync('tidy-args.json', JSON.stringify(process.argv.slice(2)), 'utf8')\",",
      "  \"console.log(JSON.stringify({ status: 'applied', applied: { archivedTasks: ['fixture-task'], removedEmptyDirs: [], movedEvidence: [], ledgerRewrites: 0 }, memoryBudget: { budgetKb: 15, oversized: [] } }))\",",
      "  '',",
      "].join('\\n')",
      "writeFileSync(join(target, 'scripts', 'ae-tools.mjs'), stub, 'utf8')",
      '',
    ].join('\n'), 'utf8')
    runGit(['init', '-b', 'main'], remoteRoot)
    runGit(['add', '.'], remoteRoot)
    runGit(['-c', 'user.email=fixture@example.com', '-c', 'user.name=Fixture', 'commit', '-m', 'fixture installer with cli stub'], remoteRoot)

    const result = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(result.status, 0, result.stderr)
    const summary = parseLastJson(result.stdout)
    assert.equal(summary.maintenance.status, 'applied')
    assert.deepEqual(summary.maintenance.archivedTasks, ['fixture-task'])
    assert.equal(summary.maintenance.memoryBudget.budgetKb, 15)

    const tidyArgs = JSON.parse(readFileSync(join(targetRoot, 'tidy-args.json'), 'utf8'))
    assert.deepEqual(tidyArgs, ['tidy', '--apply'], 'maintenance must run tidy --apply without --archive-stale')
  } finally {
    rmSync(remoteRoot, { recursive: true, force: true })
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('update-project skips post-update maintenance when --no-tidy is set', () => {
  const remoteRoot = makeTempDir('ae-update-notidy-remote-')
  const targetRoot = makeTempDir('ae-update-notidy-target-')
  try {
    mkdirSync(join(remoteRoot, 'scripts'), { recursive: true })
    writeFileSync(join(remoteRoot, 'scripts', 'install-project.mjs'), [
      '#!/usr/bin/env node',
      "import { mkdirSync, writeFileSync } from 'node:fs'",
      "import { join } from 'node:path'",
      'const args = process.argv.slice(2)',
      "const target = args[args.indexOf('--target') + 1]",
      "mkdirSync(join(target, 'scripts'), { recursive: true })",
      "writeFileSync(join(target, 'scripts', 'ae-tools.mjs'), '#!/usr/bin/env node\\nthrow new Error(\"must not run\")\\n', 'utf8')",
      '',
    ].join('\n'), 'utf8')
    runGit(['init', '-b', 'main'], remoteRoot)
    runGit(['add', '.'], remoteRoot)
    runGit(['-c', 'user.email=fixture@example.com', '-c', 'user.name=Fixture', 'commit', '-m', 'fixture installer'], remoteRoot)

    const result = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot, '--lang', 'en', '--no-tidy'], repoRoot)
    assert.equal(result.status, 0, result.stderr)
    const summary = parseLastJson(result.stdout)
    assert.equal(summary.maintenance.status, 'skipped')
    assert.match(summary.maintenance.reason, /--no-tidy/)
  } finally {
    rmSync(remoteRoot, { recursive: true, force: true })
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('update-project rejects placeholder repository URLs', () => {
  const targetRoot = makeTempDir('ae-update-placeholder-')
  try {
    const result = runScript('scripts/update-project.mjs', ['--repo', 'https://github.com/<owner>/<repo>.git', '--target', targetRoot], repoRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Repository URL is not configured/)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

function countAllowImplicitTrue(skillsRoot) {
  if (!existsSync(skillsRoot)) return 0
  let count = 0
  for (const name of readdirSync(skillsRoot)) {
    const yaml = join(skillsRoot, name, 'agents', 'openai.yaml')
    if (!existsSync(yaml)) continue
    if (/^ {2}allow_implicit_invocation:\s*true\s*$/m.test(readFileSync(yaml, 'utf8'))) count += 1
  }
  return count
}

function readProjectInstallState(targetRoot) {
  return JSON.parse(readFileSync(join(targetRoot, '.agents', 'ai-agent-engine-codex', 'project-install.json'), 'utf8'))
}

test('install-project rejects unsupported --implicit values with usage', () => {
  const targetRoot = makeTempDir('ae-install-implicit-bad-')
  try {
    const result = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--implicit', 'partial'], repoRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /--implicit core\|all\|none/)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('install-project --implicit core|all|none writes project-install.json and openai.yaml counts', () => {
  const cases = [
    ['all', 40],
    ['core', 5],
    ['none', 0],
  ]
  for (const [tier, expectedTrue] of cases) {
    const targetRoot = makeTempDir(`ae-install-implicit-${tier}-`)
    try {
      const result = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en', '--implicit', tier], repoRoot)
      assert.equal(result.status, 0, `${tier}: ${result.stderr}`)
      const summary = parseLastJson(result.stdout)
      assert.equal(summary.implicitTier, tier)
      const state = readProjectInstallState(targetRoot)
      assert.equal(state.implicitTier, tier)
      const settings = JSON.parse(readFileSync(join(targetRoot, '.agents', 'ai-agent-engine-codex', 'display-settings.json'), 'utf8'))
      assert.equal(settings.implicitTier, tier)
      assert.equal(countAllowImplicitTrue(join(targetRoot, '.agents', 'skills')), expectedTrue, tier)
      assert.equal(countAllowImplicitTrue(join(targetRoot, 'plugins', 'ai-agent-engine-codex', 'skills')), expectedTrue, `${tier} plugin copy`)
      // Codex plugin / project SKILL.md must never get Cursor-only disable-model-invocation.
      for (const root of [join(targetRoot, '.agents', 'skills'), join(targetRoot, 'plugins', 'ai-agent-engine-codex', 'skills')]) {
        for (const name of readdirSync(root)) {
          const skillMd = join(root, name, 'SKILL.md')
          if (!existsSync(skillMd)) continue
          assert.equal(
            /disable-model-invocation\s*:/.test(readFileSync(skillMd, 'utf8')),
            false,
            `${tier} ${root}/${name}/SKILL.md must not inject disable-model-invocation`,
          )
        }
      }
    } finally {
      rmSync(targetRoot, { recursive: true, force: true })
    }
  }
})

test('install-project default implicit tier remains all', () => {
  const targetRoot = makeTempDir('ae-install-implicit-default-')
  try {
    const result = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'bilingual'], repoRoot)
    assert.equal(result.status, 0, result.stderr)
    const summary = parseLastJson(result.stdout)
    assert.equal(summary.implicitTier, 'all')
    assert.equal(readProjectInstallState(targetRoot).implicitTier, 'all')
    assert.equal(countAllowImplicitTrue(join(targetRoot, '.agents', 'skills')), 40)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('install-project retains --implicit none across update without re-passing the flag', () => {
  const targetRoot = makeTempDir('ae-install-implicit-retain-')
  try {
    const first = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en', '--implicit', 'none'], repoRoot)
    assert.equal(first.status, 0, first.stderr)
    assert.equal(countAllowImplicitTrue(join(targetRoot, '.agents', 'skills')), 0)
    const second = runScript('scripts/install-project.mjs', ['--target', targetRoot, '--lang', 'en'], repoRoot)
    assert.equal(second.status, 0, second.stderr)
    const summary = parseLastJson(second.stdout)
    assert.equal(summary.implicitTier, 'none')
    assert.equal(readProjectInstallState(targetRoot).implicitTier, 'none')
    assert.equal(countAllowImplicitTrue(join(targetRoot, '.agents', 'skills')), 0)
  } finally {
    rmSync(targetRoot, { recursive: true, force: true })
  }
})

test('update-project rejects unsupported --implicit and forwards retained tier', () => {
  const targetRoot = makeTempDir('ae-update-implicit-')
  const remoteRoot = makeTempDir('ae-update-implicit-remote-')
  try {
    const bad = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot, '--implicit', 'partial'], repoRoot)
    assert.equal(bad.status, 1)
    assert.match(bad.stderr, /--implicit core\|all\|none/)

    mkdirSync(join(targetRoot, '.agents', 'ai-agent-engine-codex'), { recursive: true })
    writeFileSync(join(targetRoot, '.agents', 'ai-agent-engine-codex', 'project-install.json'), `${JSON.stringify({
      schemaVersion: 1,
      implicitTier: 'none',
    }, null, 2)}\n`, 'utf8')
    writeFileSync(join(targetRoot, '.agents', 'ai-agent-engine-codex', 'display-settings.json'), `${JSON.stringify({
      schemaVersion: 1,
      implicitTier: 'none',
    }, null, 2)}\n`, 'utf8')

    runGit(['init'], remoteRoot)
    runGit(['config', 'user.email', 'test@example.com'], remoteRoot)
    runGit(['config', 'user.name', 'test'], remoteRoot)
    mkdirSync(join(remoteRoot, 'scripts'), { recursive: true })
    writeFileSync(join(remoteRoot, 'scripts', 'install-project.mjs'), [
      '#!/usr/bin/env node',
      "import { writeFileSync, mkdirSync } from 'node:fs'",
      "import { resolve } from 'node:path'",
      'const args = process.argv.slice(2)',
      "const target = args[args.indexOf('--target') + 1]",
      "const implicit = args.includes('--implicit') ? args[args.indexOf('--implicit') + 1] : null",
      "const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null",
      "mkdirSync(resolve(target, '.agents', 'ai-agent-engine-codex'), { recursive: true })",
      "writeFileSync(resolve(target, '.agents', 'ai-agent-engine-codex', 'project-install.json'), JSON.stringify({ schemaVersion: 1, operationId: 'stub', implicitTier: implicit, sourceFingerprint: { sha256: 'stub' } }, null, 2))",
      "console.log(JSON.stringify({ status: 'installed', implicitTier: implicit, lang }, null, 2))",
    ].join('\n'), 'utf8')
    runGit(['add', '.'], remoteRoot)
    runGit(['commit', '-m', 'stub'], remoteRoot)
    try { runGit(['branch', '-M', 'main'], remoteRoot) } catch { /* already main */ }

    const result = runScript('scripts/update-project.mjs', ['--repo', remoteRoot, '--target', targetRoot, '--no-tidy'], repoRoot)
    assert.equal(result.status, 0, result.stderr)
    const summary = parseLastJson(result.stdout)
    assert.equal(summary.implicitTier, 'none')
    assert.equal(readProjectInstallState(targetRoot).implicitTier, 'none')
  } finally {
    rmSync(remoteRoot, { recursive: true, force: true })
    rmSync(targetRoot, { recursive: true, force: true })
  }
})
