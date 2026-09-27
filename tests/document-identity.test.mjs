import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative } from 'node:path'
import test from 'node:test'
import { docsAppend, docsMaintain, docsSearch, isDocumentPage, pagePath, parseRouter } from '../plugins/ai-agent-engine-codex/scripts/docs-lifecycle.mjs'
import { hash } from '../plugins/ai-agent-engine-codex/scripts/bounded-documents.mjs'
import { memoryIndex, memorySearch } from '../plugins/ai-agent-engine-codex/scripts/memory-navigation.mjs'

function fixture(t) {
  const base = realpathSync.native(tmpdir())
  const root = mkdtempSync(join(base, 'ae-document-identity-'))
  const docs = join(root, 'docs')
  mkdirSync(docs)
  t.after(() => {
    const rel = relative(base, root)
    assert.ok(rel.startsWith('ae-document-identity-') && !rel.includes('/') && !rel.includes('\\') && !isAbsolute(rel))
    rmSync(root, { recursive: true, force: true })
  })
  return {
    root, docs,
    write(path, text) {
      mkdirSync(dirname(join(docs, path)), { recursive: true })
      writeFileSync(join(docs, path), text)
    },
  }
}

function compact(root, path) {
  const preview = docsMaintain(root, ['--path', path, '--compact'])
  assert.equal(preview.status, 'ok', JSON.stringify(preview))
  const result = docsMaintain(root, ['--path', path, '--compact', '--apply', '--expect-sha256', preview.source.sha256])
  assert.equal(result.mode, 'applied', JSON.stringify(result))
  return result
}

function appendArgs(root, path, entry) {
  const preview = docsAppend(root, ['--path', path, '--entry', entry])
  assert.equal(preview.status, 'ok', JSON.stringify(preview))
  return ['--path', path, '--entry', entry, '--apply', '--expect-sha256', preview.sourceSha256, '--expect-entry-sha256', preview.entrySha256]
}

// Reproduce the v1 bytes/page names produced by the pre-canonicalization writer.
function legacyAliasRouter(docs, path, alias) {
  const snapshot = readFileSync(join(docs, path), 'utf8')
  const metadata = parseRouter(Buffer.from(snapshot), path)
  const oldPrefix = hash(path).slice(0, 16)
  const aliasPrefix = hash(alias).slice(0, 16)
  for (let n = 1; n <= metadata.pages; n++) {
    const source = join(docs, pagePath(path, metadata, n))
    const target = join(dirname(source), basename(source).replace(oldPrefix, aliasPrefix))
    renameSync(source, target)
  }
  const legacy = snapshot.replaceAll(path, alias).replaceAll(oldPrefix, aliasPrefix)
  assert.equal(parseRouter(Buffer.from(legacy), alias).path, alias)
  writeFileSync(join(docs, path), legacy)
  return legacy
}

test('Windows uppercase page aliases remain immutable without case-folding POSIX names', () => {
  for (const page of [
    `08-ai-memory/ae-doc-${'a'.repeat(16)}-${'b'.repeat(64)}-000001.md`,
    `08-ai-memory/00-index-history-${'c'.repeat(64)}-0001.md`,
  ]) {
    assert.equal(isDocumentPage(page), true)
    assert.equal(isDocumentPage(page.toUpperCase()), process.platform === 'win32')
  }
})

test('Windows document aliases share preview identity, including root and filename casing', { skip: process.platform !== 'win32' }, (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  write(path, '# History\noriginal needle\n')
  const canonical = docsMaintain(root, ['--path', path, '--compact'])
  for (const alias of ['01-HISTORY/history.md', '01-HISTORY/HISTORY.MD', '01-HISTORY\\history.md']) {
    const preview = docsMaintain(root, ['--docs-root', docs.toUpperCase(), '--path', alias, '--compact'])
    assert.equal(preview.status, 'ok', JSON.stringify(preview))
    assert.equal(preview.path, canonical.path)
    assert.deepEqual(preview.recovery, canonical.recovery)
    assert.deepEqual(preview.source, canonical.source)
  }
  const result = compact(root, '01-HISTORY/HISTORY.MD')
  assert.equal(result.path, path)
  assert.equal(docsMaintain(root, ['--path', path, '--verify']).status, 'ok')
  assert.equal(docsSearch(root, ['--path', '01-HISTORY/HISTORY.MD', '--query', 'needle']).results.length, 1)
})

test('Windows pre-existing alias metadata and immutable page identities survive verification and append', { skip: process.platform !== 'win32' }, (t) => {
  const { root, docs, write } = fixture(t)
  const path = '08-ai-memory/03-workflows.md'
  const alias = '08-AI-MEMORY/03-workflows.md'
  write(path, '# Workflow\noriginal needle\n')
  write('08-ai-memory/00-index.md', '# Index\n')
  write('ae/entry.md', 'appended needle\n')
  compact(root, path)
  const legacy = legacyAliasRouter(docs, path, alias)
  const metadata = parseRouter(Buffer.from(legacy), alias)
  const originalPage = join(docs, pagePath(alias, metadata, 1))
  const pageSnapshot = readFileSync(originalPage)
  const names = readdirSync(dirname(originalPage))
  assert.equal(docsMaintain(root, ['--path', path, '--verify']).status, 'ok')
  assert.equal(docsMaintain(root, ['--path', path, '--compact']).mode, 'unchanged')
  const found = memorySearch(root, ['--path', '03-WORKFLOWS.MD', '--query', 'needle'])
  assert.equal(found.status, 'ok', JSON.stringify(found))
  assert.equal(found.results.length, 1)
  assert.equal(readFileSync(join(docs, path), 'utf8'), legacy)
  assert.deepEqual(readdirSync(dirname(originalPage)), names)
  const result = docsAppend(root, appendArgs(root, alias, 'ae/entry.md'))
  assert.equal(result.mode, 'applied', JSON.stringify(result))
  const updated = parseRouter(readFileSync(join(docs, path)), alias)
  assert.equal(updated.path, alias)
  assert.equal(updated.sourceSha256, metadata.sourceSha256)
  assert.deepEqual(readFileSync(originalPage), pageSnapshot)
  assert.ok(existsSync(join(docs, pagePath(alias, updated, 2))))
  assert.equal(docsSearch(root, ['--path', path, '--query', 'needle']).results.length, 2)
  assert.equal(docsMaintain(root, ['--path', path, '--verify']).status, 'ok')
})

test('Windows legacy metadata remains usable through both index entrypoints and memory history scope', { skip: process.platform !== 'win32' }, (t) => {
  const { root, docs, write } = fixture(t)
  const path = '08-ai-memory/00-index.md'
  write(path, '# Index\nhistorical needle\n')
  compact(root, path)
  const legacy = legacyAliasRouter(docs, path, '08-AI-MEMORY/00-index.md')
  assert.equal(memoryIndex(root, ['--docs-root', docs.toUpperCase(), '--check']).status, 'ok')
  assert.equal(memoryIndex(root, ['--compact']).mode, 'unchanged')
  const found = memorySearch(root, ['--history', '--path', '00-INDEX.MD', '--query', 'needle'])
  assert.equal(found.status, 'ok', JSON.stringify(found))
  assert.equal(found.results[0].historical, true)
  assert.equal(readFileSync(join(docs, path), 'utf8'), legacy)
})

test('router identity never binds to another existing file with identical bytes', (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  write(path, '# History\nneedle\n')
  compact(root, path)
  write('01-history/copied.md', readFileSync(join(docs, path)))
  const result = docsMaintain(root, ['--path', '01-history/copied.md', '--verify'])
  assert.equal(result.status, 'invalid')
  assert.match(result.diagnostics.join(), /invalid router metadata/)
})

test('case-sensitive POSIX filenames retain separate document and page identities', {
  skip: process.platform === 'win32' ? 'POSIX case-sensitive filesystem behavior is not exercised on Windows' : false,
}, (t) => {
  const { root, docs, write } = fixture(t)
  write('01-history/history.md', '# History\nneedle\n')
  write('01-history/History.md', '# History\nneedle\n')
  if (statSync(join(docs, '01-history/history.md')).ino === statSync(join(docs, '01-history/History.md')).ino) {
    return t.skip('fixture filesystem is case-insensitive; distinct POSIX files were not exercised')
  }
  const first = compact(root, '01-history/history.md')
  const second = compact(root, '01-history/History.md')
  assert.notEqual(first.path, second.path)
  assert.notEqual(first.recovery.pattern, second.recovery.pattern)
  assert.equal(docsMaintain(root, ['--path', first.path, '--verify']).status, 'ok')
  assert.equal(docsMaintain(root, ['--path', second.path, '--verify']).status, 'ok')
})

const childProgram = `
  import fs from 'node:fs';
  import { basename } from 'node:path';
  import { syncBuiltinESMExports } from 'node:module';
  const config = JSON.parse(process.argv[1]);
  const originalOpen = fs.openSync;
  let paused = false;
  if (config.release) {
    fs.openSync = function(path, flags, ...rest) {
      const fd = originalOpen(path, flags, ...rest);
      if (!paused && flags === 'wx' && /^\\.ae-doc-.*\\.lock$/.test(basename(String(path)))) {
        paused = true;
        process.send({ event: 'locked', pid: process.pid, path: String(path) });
        const deadline = Date.now() + 15000;
        const cell = new Int32Array(new SharedArrayBuffer(4));
        while (!fs.existsSync(config.release)) {
          if (Date.now() > deadline) throw new Error('fixture lock barrier timed out');
          Atomics.wait(cell, 0, 0, 10);
        }
      }
      return fd;
    };
    syncBuiltinESMExports();
  }
  const docs = await import(config.docsModule);
  const memory = await import(config.memoryModule);
  const commands = { docsMaintain: docs.docsMaintain, docsAppend: docs.docsAppend, memoryIndex: memory.memoryIndex };
  console.log(JSON.stringify(commands[config.command](config.root, config.args)));
  if (process.connected) process.disconnect();
`

function writer(config) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', childProgram, JSON.stringify({
    ...config,
    docsModule: new URL('../plugins/ai-agent-engine-codex/scripts/docs-lifecycle.mjs', import.meta.url).href,
    memoryModule: new URL('../plugins/ai-agent-engine-codex/scripts/memory-navigation.mjs', import.meta.url).href,
  })], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (data) => { stdout += data })
  child.stderr.on('data', (data) => { stderr += data })
  const finished = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code) => {
      try {
        assert.equal(code, 0, stderr)
        resolve(JSON.parse(stdout))
      } catch (error) { reject(error) }
    })
  })
  const locked = config.release ? Promise.race([
    once(child, 'message').then(([message]) => {
      assert.equal(message.event, 'locked')
      return message
    }),
    finished.then(() => { throw new Error('writer exited before acquiring its lock') }),
  ]) : null
  finished.catch(() => {})
  return { child, finished, locked }
}

async function contend(firstConfig, secondConfig, release) {
  const first = writer({ ...firstConfig, release })
  let second
  try {
    const lock = await first.locked
    second = writer(secondConfig)
    assert.notEqual(first.child.pid, second.child.pid)
    const blocked = await second.finished
    assert.equal(blocked.status, 'invalid', JSON.stringify(blocked))
    assert.match(blocked.diagnostics.join(), /EEXIST/)
    assert.ok(existsSync(lock.path))
    writeFileSync(release, 'release')
    const applied = await first.finished
    assert.equal(applied.mode, 'applied', JSON.stringify(applied))
    assert.equal(existsSync(lock.path), false)
  } finally {
    for (const process of [first, second].filter(Boolean)) {
      if (process.child.exitCode === null && process.child.signalCode === null) process.child.kill()
    }
    await Promise.allSettled([first.finished, second?.finished].filter(Boolean))
  }
}

test('two real append processes share the lock and preserve records after a fresh retry', { timeout: 25000 }, async (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  const alias = process.platform === 'win32' ? '01-HISTORY/history.md' : path
  write(path, '# History\noriginal\n')
  write('ae/first.md', 'first needle\n')
  write('ae/second.md', 'second needle\n')
  const firstArgs = appendArgs(root, path, 'ae/first.md')
  const secondArgs = appendArgs(root, alias, 'ae/second.md')
  await contend(
    { root, command: 'docsAppend', args: firstArgs },
    { root, command: 'docsAppend', args: secondArgs },
    join(root, 'release'),
  )
  const stale = await writer({ root, command: 'docsAppend', args: secondArgs }).finished
  assert.equal(stale.status, 'invalid')
  assert.match(stale.diagnostics.join(), /matching the current source/)
  const retry = await writer({ root, command: 'docsAppend', args: appendArgs(root, alias, 'ae/second.md') }).finished
  assert.equal(retry.mode, 'applied', JSON.stringify(retry))
  assert.deepEqual(docsSearch(root, ['--path', path, '--query', 'needle']).results.map((item) => item.excerpt), ['first needle', 'second needle'])
  assert.equal(docsMaintain(root, ['--path', path, '--verify']).originalSha256, hash('# History\noriginal\n'))
  assert.equal(readdirSync(join(docs, '01-history')).some((name) => name.endsWith('.lock')), false)
})

test('generic and legacy index processes share the lock across path aliases', { timeout: 25000 }, async (t) => {
  const { root, write } = fixture(t)
  const path = '08-ai-memory/00-index.md'
  const alias = process.platform === 'win32' ? '08-AI-MEMORY/00-index.md' : path
  write(path, '# Index\nhistorical needle\n')
  const preview = docsMaintain(root, ['--path', alias, '--compact'])
  assert.equal(preview.mode, 'preview')
  await contend(
    { root, command: 'docsMaintain', args: ['--path', alias, '--compact', '--apply', '--expect-sha256', preview.source.sha256] },
    { root, command: 'memoryIndex', args: ['--compact', '--apply', '--expect-sha256', preview.source.sha256] },
    join(root, 'release'),
  )
  assert.equal(memoryIndex(root, ['--compact']).mode, 'unchanged')
  assert.equal(memorySearch(root, ['--history', '--query', 'needle']).results.length, 1)
  assert.equal(docsMaintain(root, ['--path', path, '--verify']).originalSha256, preview.source.sha256)
})
