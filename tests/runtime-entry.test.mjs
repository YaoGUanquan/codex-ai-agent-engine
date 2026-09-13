import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolveRuntimeEntry } from '../plugins/ai-agent-engine-codex/skills/ae-help/scripts/resolve-runtime-entry.mjs'
import { runGlobalInstall } from '../plugins/ai-agent-engine-codex/scripts/global-install.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const skills = join(root, 'plugins/ai-agent-engine-codex/skills')
const resolver = join(skills, 'ae-help/scripts/resolve-runtime-entry.mjs')
const read = (path) => readFileSync(path, 'utf8')
const run = (entry, args = [], options = {}) => spawnSync(process.execPath, [entry, ...args], { encoding: 'utf8', ...options })
const shellEnv = (extra = {}) => ({ ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH || ''}`, ...extra })
const posixShell = process.env.AE_TEST_POSIX_SHELL || 'sh'
const hasPosix = spawnSync(posixShell, ['-c', 'exit 0']).status === 0
const hasPowerShell = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', 'exit 0']).status === 0

function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'ae-entry-'))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  const projectRoot = join(base, "project space $value 'quote [test]")
  const homeRoot = join(base, 'isolated home')
  mkdirSync(projectRoot)
  mkdirSync(homeRoot)
  return {
    base, projectRoot, homeRoot,
    local: join(projectRoot, 'scripts/ae-tools.mjs'),
    global: join(homeRoot, '.agents/ai-agent-engine-codex/bin/ae.mjs'),
  }
}

function write(path, content = 'console.log(JSON.stringify(process.argv.slice(2)))\n') {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

test('runtime entry prefers project wrapper and keeps cwd and spaced arguments', (t) => {
  const f = fixture(t)
  write(f.local)
  write(f.global, 'process.exit(99)\n')
  const cwd = process.cwd()
  assert.equal(resolveRuntimeEntry(f), f.local)
  assert.equal(process.cwd(), cwd)
  const args = ['report', '--input', 'a path with spaces.json', '$literal', "one'quote"]
  const result = run(resolveRuntimeEntry(f), args, { cwd: f.projectRoot })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), args)
  const cli = run(resolver, ['--project-root', f.projectRoot])
  assert.equal(cli.status, 0, cli.stderr)
  assert.equal(cli.stdout.trim(), f.local)
})

test('runtime entry uses global only when local is absent and reports neither', (t) => {
  const f = fixture(t)
  assert.throws(() => resolveRuntimeEntry(f), /AE_RUNTIME_ENTRY_NOT_FOUND/)
  write(f.global)
  assert.equal(resolveRuntimeEntry(f), f.global)
  assert.equal(run(resolveRuntimeEntry(f), ['help']).status, 0)
})

test('runtime entry fails closed on invalid local or global paths', (t) => {
  const f = fixture(t)
  mkdirSync(f.local, { recursive: true })
  write(f.global)
  assert.throws(() => resolveRuntimeEntry(f), /AE_RUNTIME_ENTRY_INVALID/)
  rmSync(f.local, { recursive: true })
  rmSync(f.global)
  mkdirSync(f.global)
  assert.throws(() => resolveRuntimeEntry(f), /AE_RUNTIME_ENTRY_INVALID/)
  rmSync(join(f.projectRoot, 'scripts'), { recursive: true })
  write(join(f.projectRoot, 'scripts'), 'not a directory')
  assert.throws(() => resolveRuntimeEntry(f))
})

test('runtime entry rejects invalid project root and CLI options without stdout', (t) => {
  const f = fixture(t)
  write(f.global)
  assert.throws(() => resolveRuntimeEntry({ ...f, projectRoot: join(f.base, 'missing') }), /ENOENT/)
  for (const args of [['--unknown'], ['--project-root'], ['--project-root', f.projectRoot, '--unknown']]) {
    const result = run(resolver, args)
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /Usage:/)
  }
})

test('runtime entry does not treat a dangling directory link as an absent local install', (t) => {
  const f = fixture(t)
  const target = join(f.base, 'removed scripts')
  mkdirSync(target)
  symlinkSync(target, join(f.projectRoot, 'scripts'), process.platform === 'win32' ? 'junction' : 'dir')
  rmSync(target, { recursive: true })
  write(f.global)
  assert.throws(() => resolveRuntimeEntry(f), /ENOENT/)
})

test('a selected broken wrapper is not executed by resolution or retried globally', (t) => {
  const f = fixture(t)
  const sentinel = join(f.base, 'global-ran')
  write(f.local, "console.error('fixture local failure'); process.exit(23)\n")
  write(f.global, `import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(sentinel)}, 'bad')\n`)
  assert.equal(resolveRuntimeEntry(f), f.local)
  assert.equal(existsSync(sentinel), false)
  const result = run(resolveRuntimeEntry(f), ['help'])
  assert.equal(result.status, 23)
  assert.match(result.stderr, /fixture local failure/)
  assert.equal(existsSync(sentinel), false)
})

test('all active AE command examples use the shared bootstrap and catalog template', () => {
  const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
  const files = walk(skills).filter((file) => file.endsWith('.md'))
  let commandFiles = 0
  for (const file of files) {
    const text = read(file)
    assert.doesNotMatch(text, /node\s+["']?\$HOME[^\r\n]*\/bin\/ae\.mjs|node scripts\/ae-tools\.mjs/, file)
    if (!text.includes('node "$aeEntry"') || file.endsWith('runtime-entry.md')) continue
    commandFiles++
    assert.match(text, /\[[^\]]+\]\([^)]*runtime-entry\.md\)/, file)
  }
  assert.ok(commandFiles >= 13)
  const catalog = JSON.parse(read(join(skills, 'ae-help/references/capability-catalog.json')))
  for (const item of [...catalog.skills, ...catalog.commands]) {
    if (item.script) assert.ok(item.script.startsWith('node "$aeEntry" '), item.name)
  }
  assert.match(catalog.codexPort.runtimeEntry, /runtime-entry\.md/)
  assert.match(read(join(skills, 'ae-help/references/runtime-entry.md')), /do not persist across separate tool calls/)
})

test('consumer installation ships a standalone resolver and usable help', (t) => {
  const f = fixture(t)
  const install = run(join(root, 'scripts/install-project.mjs'), ['--target', f.projectRoot])
  assert.equal(install.status, 0, install.stderr)
  const installedResolver = join(f.projectRoot, '.agents/skills/ae-help/scripts/resolve-runtime-entry.mjs')
  assert.equal(read(installedResolver), read(resolver))
  const resolved = run(installedResolver, [], { cwd: f.projectRoot })
  assert.equal(resolved.status, 0, resolved.stderr)
  assert.equal(resolved.stdout.trim(), f.local)
  const help = run(resolved.stdout.trim(), ['help', 'markitdown'], { cwd: f.projectRoot })
  assert.equal(help.status, 0, help.stderr)
  assert.match(help.stdout, /node "\$aeEntry" markitdown/)
  assert.ok(help.stdout.includes(f.local.replaceAll("'", "''")))
})

test('isolated global installation ships resolver and dispatcher without project wrapper', (t) => {
  const f = fixture(t)
  write(join(f.projectRoot, 'package.json'), '{}')
  const preview = runGlobalInstall(['preview', '--home', f.homeRoot], { repoRoot: root })
  const applied = runGlobalInstall(['apply', '--home', f.homeRoot, '--apply', '--operation', preview.operationId, '--confirm', preview.confirmation], {
    repoRoot: root, commandRunner: () => ({ status: 0, stdout: '{}', stderr: '' }),
  })
  assert.equal(applied.status, 'completed')
  const copied = join(f.homeRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/scripts/resolve-runtime-entry.mjs')
  assert.equal(read(copied), read(resolver))
  const cli = run(copied, [], { cwd: f.projectRoot, env: shellEnv({ HOME: f.homeRoot, USERPROFILE: f.homeRoot }) })
  assert.equal(cli.status, 0, cli.stderr)
  assert.equal(cli.stdout.trim(), f.global)
  assert.equal(resolveRuntimeEntry(f), f.global)
  assert.equal(existsSync(f.local), false)
  const help = run(f.global, ['help', 'markitdown'], { cwd: f.projectRoot })
  assert.equal(help.status, 0, help.stderr)
  assert.match(help.stdout, /node "\$aeEntry" markitdown/)
  assert.ok(help.stdout.includes(f.global))
})

for (const shell of [
  { name: 'PowerShell', available: hasPowerShell, command: 'pwsh', args: ['-NoProfile', '-NonInteractive', '-Command'], fence: 'powershell', setup: '$aeResolver = $env:AE_TEST_RESOLVER\n' },
  { name: 'POSIX', available: hasPosix, command: posixShell, args: ['-c'], fence: 'sh', setup: 'aeResolver="$AE_TEST_RESOLVER"\n' },
]) {
  test(`${shell.name} executes documented bootstrap and stops on resolution or command failure`, { skip: !shell.available }, (t) => {
    const f = fixture(t)
    const copiedResolver = join(f.projectRoot, "resolver $value 'quote.mjs")
    cpSync(resolver, copiedResolver)
    const snippet = read(join(skills, 'ae-help/references/runtime-entry.md')).match(new RegExp('```' + shell.fence + '\\r?\\n([\\s\\S]*?)```'))[1]
    const invoke = () => spawnSync(shell.command, [...shell.args, shell.setup + snippet], {
      cwd: f.projectRoot, encoding: 'utf8', env: shellEnv({ AE_TEST_RESOLVER: copiedResolver, HOME: f.homeRoot, USERPROFILE: f.homeRoot }),
    })
    write(f.local)
    const success = invoke()
    assert.equal(success.status, 0, success.stderr)
    assert.deepEqual(JSON.parse(success.stdout), ['help'])
    write(f.local, "console.error('fixture failed'); process.exit(23)\n")
    const failure = invoke()
    assert.notEqual(failure.status, 0)
    assert.match(failure.stderr, /fixture failed/)
    rmSync(f.local)
    const absent = invoke()
    assert.notEqual(absent.status, 0)
    assert.equal(absent.stdout, '')
    assert.match(absent.stderr, /AE_RUNTIME_ENTRY_NOT_FOUND/)
  })

  test(`${shell.name} help assignment preserves literal path characters`, { skip: !shell.available }, (t) => {
    const f = fixture(t)
    write(f.local, `import ${JSON.stringify(pathToFileURL(join(root, 'plugins/ai-agent-engine-codex/scripts/ae-tools.mjs')).href)}\n`)
    const help = run(f.local, ['help', 'markitdown'], { cwd: f.projectRoot })
    assert.equal(help.status, 0, help.stderr)
    const assignment = help.stdout.match(new RegExp('```' + shell.fence + '\\r?\\n([\\s\\S]*?)```'))[1]
    const result = spawnSync(shell.command, [...shell.args, assignment + '\nnode "$aeEntry" help markitdown'], {
      cwd: f.projectRoot, encoding: 'utf8', env: shellEnv(),
    })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /node "\$aeEntry" markitdown/)
  })
}
