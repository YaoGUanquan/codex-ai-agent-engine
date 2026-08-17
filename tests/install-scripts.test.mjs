import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { repoRoot, runGit } from './helpers/skill-test-utils.mjs'

function makeTempDir(prefix) {
  return mkdtempSync(join(tmpdir(), prefix))
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

test('distribution source keeps its mirror outside Codex project discovery paths', () => {
  assert.ok(existsSync(join(repoRoot, '.ae-source', 'skills', 'ae-help', 'SKILL.md')))
  assert.ok(existsSync(join(repoRoot, '.ae-source', 'marketplace.json')))
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
    assert.equal(summary.maintenance.status, 'skipped', 'maintenance should degrade gracefully when the target has no ae-tools CLI')

    const marker = JSON.parse(readFileSync(join(targetRoot, 'install-args.json'), 'utf8'))
    assert.equal(marker.target, targetRoot)
    assert.equal(marker.lang, 'en')
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
