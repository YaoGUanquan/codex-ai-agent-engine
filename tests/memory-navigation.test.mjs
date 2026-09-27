import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { memoryIndex, memorySearch } from '../plugins/ai-agent-engine-codex/scripts/memory-navigation.mjs'
import { initProject } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/init.mjs'
import { docsMaintain, pagePath, parseRouter } from '../plugins/ai-agent-engine-codex/scripts/docs-lifecycle.mjs'

function fixture(t, index = '# Index\n') {
  const root = mkdtempSync(join(tmpdir(), 'ae-memory-navigation-'))
  const memory = join(root, 'docs', '08-ai-memory')
  mkdirSync(memory, { recursive: true })
  mkdirSync(join(root, 'docs', 'ae'), { recursive: true })
  writeFileSync(join(memory, '00-index.md'), index)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return { root, memory, docs: join(root, 'docs') }
}

function sha(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

test('index budgets fail closed on bytes, lines and oversized topics', (t) => {
  const { root, memory } = fixture(t, '# Index\n' + 'x'.repeat(5000))
  assert.equal(memoryIndex(root).index.withinBudget, false)
  assert.equal(memoryIndex(root, ['--check']).status, 'invalid')
  writeFileSync(join(memory, '00-index.md'), '# Index\n' + '\n'.repeat(80))
  assert.equal(memoryIndex(root, ['--check']).status, 'invalid')
  writeFileSync(join(memory, '00-index.md'), '# Index\n')
  writeFileSync(join(memory, '03-key-workflows.md'), 'x'.repeat(16000))
  assert.deepEqual(memoryIndex(root, ['--check']).oversized.map((item) => item.path), ['03-key-workflows.md'])
})

test('compaction is preview-first, byte-exact, bounded and idempotent', (t) => {
  const original = Buffer.from('\uFEFF# AI 记忆索引\r\n' + Array.from({ length: 140 }, (_, i) => `\r\n## Topic ${i}\r\n- 中文 ${'rule '.repeat(40)}[evidence](../ae/experience/one.md)\r\n`).join(''))
  const { root, memory } = fixture(t, original)
  const before = readdirSync(memory)
  const preview = memoryIndex(root, ['--compact'])
  assert.equal(preview.mode, 'preview')
  assert.deepEqual(readdirSync(memory), before)
  assert.ok(preview.history.length > 1)
  assert.equal(preview.index.sha256, sha(original))
  assert.equal(memoryIndex(root, ['--compact', '--apply']).status, 'invalid')
  const applied = memoryIndex(root, ['--compact', '--apply', '--expect-sha256', preview.index.sha256])
  assert.equal(applied.mode, 'applied', JSON.stringify(applied))
  assert.ok(applied.replacement.bytes <= 4096)
  assert.ok(applied.replacement.lines <= 80)
  const recovered = Buffer.concat(applied.history.map((page) => {
    assert.ok(page.bytes <= 15360)
    const bytes = readFileSync(join(memory, page.path))
    assert.equal(sha(bytes), page.sha256)
    assert.doesNotThrow(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    return bytes
  }))
  assert.deepEqual(recovered, original)
  assert.match(recovered.toString('utf8'), /\.\.\/ae\/experience\/one\.md/)
  const names = readdirSync(memory)
  assert.equal(memoryIndex(root, ['--compact']).mode, 'unchanged')
  assert.deepEqual(readdirSync(memory), names)
  assert.equal(memoryIndex(root, ['--check']).status, 'ok')
})

test('compaction refuses stale hashes, conflicts and a concurrent writer lock', (t) => {
  const { root, memory } = fixture(t, '# Index\n' + 'rule\n'.repeat(3000))
  const preview = memoryIndex(root, ['--compact'])
  const args = ['--compact', '--apply', '--expect-sha256', preview.index.sha256]
  const indexPath = join(memory, '00-index.md')
  const original = readFileSync(indexPath)
  writeFileSync(indexPath, '# Changed\n')
  assert.match(memoryIndex(root, args).diagnostics.join(), /matching the current index/)
  writeFileSync(indexPath, original)
  const collision = join(memory, preview.history[0].path)
  writeFileSync(collision, 'do not overwrite')
  assert.match(memoryIndex(root, args).diagnostics.join(), /history page conflict/)
  assert.equal(readFileSync(collision, 'utf8'), 'do not overwrite')
  assert.deepEqual(readFileSync(indexPath), original)
  rmSync(collision)
  writeFileSync(join(memory, '.ae-memory-index.lock'), 'another writer')
  assert.equal(memoryIndex(root, args).status, 'invalid')
  assert.deepEqual(readFileSync(indexPath), original)
})

test('legacy and generic index writers honor the same document lock', (t) => {
  const { root, memory } = fixture(t, '# Index\nold\n')
  const original = readFileSync(join(memory, '00-index.md'))
  const sourceHash = sha(original)
  const lock = join(memory, `.ae-doc-${sha('08-ai-memory/00-index.md').slice(0, 16)}.lock`)
  writeFileSync(lock, 'another document writer')
  assert.equal(memoryIndex(root, ['--compact', '--apply', '--expect-sha256', sourceHash]).status, 'invalid')
  assert.equal(docsMaintain(root, ['--path', '08-ai-memory/00-index.md', '--compact', '--apply', '--expect-sha256', sourceHash]).status, 'invalid')
  assert.deepEqual(readFileSync(join(memory, '00-index.md')), original)
  assert.equal(readFileSync(lock, 'utf8'), 'another document writer')
  assert.equal(readdirSync(memory).some((name) => name.startsWith('00-index-history-')), false)
  rmSync(lock)
  assert.equal(memoryIndex(root, ['--compact', '--apply', '--expect-sha256', sourceHash]).mode, 'applied')
  assert.equal(readdirSync(memory).some((name) => name.endsWith('.lock')), false)
})

test('compaction rejects huge lines, invalid UTF-8 and oversized inputs without writes', (t) => {
  const { root, memory } = fixture(t)
  for (const input of [Buffer.alloc(20000, 65), Buffer.from([0xc3, 0x28]), Buffer.alloc(1024 * 1024 + 1)]) {
    writeFileSync(join(memory, '00-index.md'), input)
    assert.equal(memoryIndex(root, ['--compact']).status, 'invalid')
    assert.deepEqual(readdirSync(memory), ['00-index.md'])
  }
})

test('search returns bounded Unicode snippets and literal path/line evidence', (t) => {
  const { root, memory } = fixture(t)
  writeFileSync(join(memory, '03-key-workflows.md'), '# Workflow\n## 中文主题\n' + Array.from({ length: 20 }, () => `${'前'.repeat(500)}恢复 [a+b] ${'后'.repeat(500)}`).join('\n'))
  const before = readdirSync(memory)
  const found = memorySearch(root, ['--query', '[a+b]', '--limit', '2', '--excerpt', '80'])
  assert.equal(found.status, 'ok')
  assert.equal(found.results.length, 2)
  assert.equal(found.results[0].line, 3)
  assert.equal(found.results[0].heading, '中文主题')
  assert.ok(found.results.every((item) => [...item.excerpt].length <= 80 && item.excerpt.includes('[a+b]')))
  assert.equal(found.scan.stoppedBy, 'results')
  assert.equal(found.limits.truncated, true)
  assert.deepEqual(readdirSync(memory), before)
  assert.ok(Buffer.byteLength(JSON.stringify(found)) < 4096)
})

test('search distinguishes complete absence from byte and file budget exhaustion', (t) => {
  const { root, memory } = fixture(t)
  writeFileSync(join(memory, '01-first.md'), 'unrelated')
  writeFileSync(join(memory, '02-second.md'), 'needle')
  assert.equal(memorySearch(root, ['--query', 'needle', '--max-files', '1']).scan.stoppedBy, 'max-files')
  const bounded = memorySearch(root, ['--query', 'needle', '--max-bytes', '2'])
  assert.equal(bounded.scan.complete, false)
  assert.doesNotMatch(bounded.diagnostics.join(), /no text match/)
  const missing = memorySearch(root, ['--query', 'absent'])
  assert.equal(missing.scan.complete, true)
  assert.deepEqual(missing.diagnostics, ['no text match'])
  const scoped = memorySearch(root, ['--query', 'needle', '--path', '02-second.md', '--max-files', '1'])
  assert.equal(scoped.results.length, 1)
  assert.equal(scoped.scan.files, 1)
})

test('history is opt-in and old content remains searchable after compaction', (t) => {
  const { root } = fixture(t, '# Index\n## Old decision\nHistoricalNeedle\n')
  const preview = memoryIndex(root, ['--compact'])
  assert.equal(memoryIndex(root, ['--compact', '--apply', '--expect-sha256', preview.index.sha256]).mode, 'applied')
  assert.equal(memorySearch(root, ['--query', 'HistoricalNeedle']).results.length, 0)
  const found = memorySearch(root, ['--query', 'historicalneedle', '--history'])
  assert.equal(found.results.length, 1)
  assert.equal(found.results[0].historical, true)
})

test('history search follows the generic paged index and its resumable cursor', (t) => {
  const { root } = fixture(t, '# Index\nHistoricalNeedle-one\nHistoricalNeedle-two\nHistoricalNeedle-three\n')
  const preview = docsMaintain(root, ['--path', '08-ai-memory/00-index.md', '--compact'])
  assert.equal(docsMaintain(root, ['--path', '08-ai-memory/00-index.md', '--compact', '--apply', '--expect-sha256', preview.source.sha256]).mode, 'applied')
  assert.equal(memorySearch(root, ['--query', 'HistoricalNeedle']).results.length, 0)
  const first = memorySearch(root, ['--history', '--query', 'HistoricalNeedle', '--limit', '1'])
  assert.equal(first.results.length, 1)
  assert.equal(first.results[0].historical, true)
  assert.equal(first.results[0].document, '08-ai-memory/00-index.md')
  assert.equal(first.scan.files, 2)
  assert.equal(first.resume.path, '00-index.md')
  const next = memorySearch(root, ['--history', '--path', first.resume.path, '--page', String(first.resume.page), '--line', String(first.resume.line), '--query', 'HistoricalNeedle', '--limit', '1'])
  assert.equal(next.status, 'ok', JSON.stringify(next))
  assert.match(next.results[0].excerpt, /HistoricalNeedle-two/)
  const bounded = memorySearch(root, ['--history', '--query', 'HistoricalNeedle', '--max-bytes', '1'])
  assert.equal(bounded.scan.complete, false)
  assert.equal(bounded.scan.bytes, 0)
})

test('history search does not label current unpaged index text as historical', (t) => {
  const { root } = fixture(t, '# Index\nCurrentNeedle\n')
  for (const pathArgs of [[], ['--path', '00-index.md']]) {
    const result = memorySearch(root, ['--history', '--query', 'CurrentNeedle', ...pathArgs])
    assert.equal(result.status, 'ok', JSON.stringify(result))
    assert.deepEqual(result.results, [])
    assert.equal(result.scan.complete, true)
  }
})

test('explicit memory paths are normalized before comparing managed router identities', (t) => {
  const { root, memory } = fixture(t)
  mkdirSync(join(memory, 'domain'))
  writeFileSync(join(memory, 'domain', 'workflow.md'), '# Workflow\nNeedle\n')
  const path = '08-ai-memory/domain/workflow.md'
  const preview = docsMaintain(root, ['--path', path, '--compact'])
  assert.equal(docsMaintain(root, ['--path', path, '--compact', '--apply', '--expect-sha256', preview.source.sha256]).mode, 'applied')
  for (const input of ['domain/workflow.md', 'domain\\workflow.md', ' domain/workflow.md']) {
    const found = memorySearch(root, ['--path', input, '--query', 'Needle'])
    assert.equal(found.status, 'ok', JSON.stringify(found))
    assert.equal(found.results.length, 1)
    assert.equal(found.results[0].document, path)
  }
  assert.equal(memorySearch(root, ['--path', './domain/workflow.md', '--query', 'Needle']).status, 'invalid')
})

test('explicit external docs root never merges in local memory', (t) => {
  const local = fixture(t)
  const external = fixture(t)
  writeFileSync(join(local.memory, '01-local.md'), 'needle local')
  writeFileSync(join(external.memory, '01-external.md'), 'needle external')
  const found = memorySearch(local.root, ['--docs-root', external.docs, '--query', 'needle'])
  assert.deepEqual(found.results.map((item) => item.path), ['08-ai-memory/01-external.md'])
  assert.equal(memoryIndex(local.root, ['--docs-root', 'relative']).status, 'invalid')
})

test('path traversal and junctions are refused before memory reads', (t) => {
  const local = fixture(t)
  const outside = fixture(t, '# private\n')
  assert.equal(memorySearch(local.root, ['--query', 'private', '--path', '../00-index.md']).status, 'invalid')
  assert.equal(memorySearch(local.root, ['--query', 'private', '--path', '.secret.md']).status, 'invalid')
  const type = process.platform === 'win32' ? 'junction' : 'dir'
  symlinkSync(outside.root, join(local.root, 'linked'), type)
  const result = memoryIndex(local.root, ['--docs-root', join(local.root, 'linked', 'docs')])
  assert.equal(result.status, 'invalid')
  assert.match(result.diagnostics.join(), /non-link/)
  symlinkSync(outside.memory, join(local.memory, 'linked'), type)
  assert.equal(memorySearch(local.root, ['--query', 'private', '--path', 'linked/00-index.md']).status, 'invalid')
})

test('CLI returns nonzero structured diagnostics for budget and option failures', (t) => {
  const { root } = fixture(t, 'x'.repeat(5000))
  const cli = resolve('scripts/ae-tools.mjs')
  for (const args of [['ae-memory-index', '--check'], ['ae-memory-index', '--apply'], ['ae-memory-search', '--query'], ['ae-memory-search', '--query', 'a', '--limit', '999'], ['ae-memory-search', '--query', 'a', '--typo']]) {
    const run = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' })
    assert.equal(run.status, 1, run.stderr)
    assert.equal(JSON.parse(run.stdout || assert.fail(run.stderr)).status, 'invalid')
  }
})

test('English, Chinese and bilingual scaffold routers fit the hard budget', (t) => {
  for (const lang of ['en', 'zh-CN', 'bilingual']) {
    const { root, memory } = fixture(t)
    rmSync(join(memory, '00-index.md'))
    initProject(root, ['--lang', lang])
    const checked = memoryIndex(root, ['--check'])
    assert.equal(checked.status, 'ok', JSON.stringify(checked))
    const prompt = readFileSync(join(memory, '99-prompt-template.md'), 'utf8')
    assert.match(prompt, /ae-memory-search/)
    assert.match(prompt, /ae-memory-index --check/)
    assert.match(readFileSync(join(memory, '00-index.md'), 'utf8'), /4096/)
  }
})

test('router regrowth is rejected instead of recursively snapshotting previous routers', (t) => {
  const { root, memory } = fixture(t)
  const preview = memoryIndex(root, ['--compact'])
  memoryIndex(root, ['--compact', '--apply', '--expect-sha256', preview.index.sha256])
  const path = join(memory, '00-index.md')
  writeFileSync(path, '\uFEFF' + readFileSync(path, 'utf8').replaceAll('\n', '\r\n'))
  assert.equal(memoryIndex(root, ['--compact']).mode, 'unchanged')
  writeFileSync(path, readFileSync(path, 'utf8') + '\nmore events\n'.repeat(500))
  assert.match(memoryIndex(root, ['--compact']).diagnostics.join(), /managed router grew/)
})

test('explicit paths cannot mislabel current documents as historical', (t) => {
  const { root, memory } = fixture(t)
  writeFileSync(join(memory, '01-current.md'), 'current needle')
  assert.equal(memorySearch(root, ['--history', '--path', '01-current.md', '--query', 'needle']).status, 'invalid')
})

test('case-insensitive Unicode matching preserves original snippet offsets', (t) => {
  const { root, memory } = fixture(t)
  writeFileSync(join(memory, '01-unicode.md'), '\u0130'.repeat(500) + 'Needle [a+b]' + 'tail'.repeat(200))
  const result = memorySearch(root, ['--query', 'needle [A+B]', '--excerpt', '40'])
  assert.equal(result.results.length, 1)
  assert.match(result.results[0].excerpt, /Needle \[a\+b\]/)
})

test('audit reports and per-file search reads are bounded', (t) => {
  const { root, memory } = fixture(t)
  for (let index = 0; index < 30; index++) writeFileSync(join(memory, `topic-${index}.md`), 'a'.repeat(16000))
  const audit = memoryIndex(root, ['--check'])
  assert.equal(audit.status, 'invalid')
  assert.equal(audit.oversizedCount, 30)
  assert.equal(audit.oversized.length, 20)
  assert.equal(audit.reportTruncated, true)
  writeFileSync(join(memory, 'large.md'), 'x'.repeat(512 * 1024 + 1))
  const search = memorySearch(root, ['--query', 'x', '--path', 'large.md'])
  assert.equal(search.scan.stoppedBy, 'file-bytes')
  assert.equal(search.scan.bytes, 0)
})

test('directory budgets stop broad memory scans while explicit paths remain searchable', (t) => {
  const { root, memory } = fixture(t)
  writeFileSync(join(memory, '01-topic.md'), 'needle\n')
  for (let i = 0; i < 4095; i++) writeFileSync(join(memory, `entry-${i}.txt`), '')
  const broad = memorySearch(root, ['--query', 'needle'])
  assert.equal(broad.status, 'invalid')
  assert.match(broad.diagnostics.join(), /exceeds 4096 entries/)
  const scoped = memorySearch(root, ['--path', '01-topic.md', '--query', 'needle'])
  assert.equal(scoped.results.length, 1)
  assert.equal(scoped.scan.files, 1)
})

test('recovery temp conflicts preserve the source and verified pages', (t) => {
  const { root, memory } = fixture(t, '# Old\nentry\n'.repeat(2000))
  const preview = memoryIndex(root, ['--compact'])
  const temporary = join(memory, `.ae-memory-index-${preview.index.sha256}.tmp`)
  writeFileSync(temporary, 'earlier interrupted attempt')
  const apply = memoryIndex(root, ['--compact', '--apply', '--expect-sha256', preview.index.sha256])
  assert.equal(apply.status, 'invalid')
  assert.equal(sha(readFileSync(join(memory, '00-index.md'))), preview.index.sha256)
  assert.equal(readFileSync(temporary, 'utf8'), 'earlier interrupted attempt')
  assert.equal(sha(Buffer.concat(preview.history.map((page) => readFileSync(join(memory, page.path))))), preview.index.sha256)
})

test('optional real index sample compacts losslessly without writing its original', (t) => {
  const sample = process.env.AE_MEMORY_SAMPLE_INDEX
  if (!sample) return t.skip('set AE_MEMORY_SAMPLE_INDEX to run a read-only real-index fixture')
  const snapshot = readFileSync(sample)
  const managed = parseRouter(snapshot, '08-ai-memory/00-index.md')
  const original = managed ? Buffer.concat(Array.from({ length: managed.originalPages }, (_, i) => readFileSync(join(dirname(sample), basename(pagePath(managed.path, managed, i + 1)))))) : snapshot
  if (managed) assert.equal(sha(original), managed.sourceSha256)
  const { root, memory } = fixture(t, original)
  const preview = memoryIndex(root, ['--compact'])
  const applied = memoryIndex(root, ['--compact', '--apply', '--expect-sha256', preview.index.sha256])
  assert.equal(applied.mode, 'applied', JSON.stringify(applied))
  const recovered = Buffer.concat(applied.history.map((page) => readFileSync(join(memory, page.path))))
  assert.deepEqual(recovered, original)
  assert.deepEqual(readFileSync(sample), snapshot)
  const search = memorySearch(root, ['--history', '--query', '超时'])
  assert.equal(search.status, 'ok')
  assert.ok(search.results.length > 0)
  assert.ok(Buffer.byteLength(JSON.stringify(search)) < 8192)
  console.log(JSON.stringify({
    sampleBytes: original.length,
    routerBytes: applied.replacement.bytes,
    historyPages: applied.history.length,
    maximumPageBytes: Math.max(...applied.history.map((page) => page.bytes)),
    queryResults: search.results.length,
    queryOutputBytes: Buffer.byteLength(JSON.stringify(search)),
    queryReadBytes: search.scan.bytes,
    lossless: true,
    originalUnchanged: true,
  }))
})
