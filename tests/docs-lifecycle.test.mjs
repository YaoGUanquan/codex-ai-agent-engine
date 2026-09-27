import assert from 'node:assert/strict'
import fs from 'node:fs'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, symlinkSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import test from 'node:test'
import { docsAppend, docsMaintain, docsSearch, pagePath, parseRouter } from '../plugins/ai-agent-engine-codex/scripts/docs-lifecycle.mjs'
import { hash } from '../plugins/ai-agent-engine-codex/scripts/bounded-documents.mjs'
import { memoryIndex, memorySearch } from '../plugins/ai-agent-engine-codex/scripts/memory-navigation.mjs'
import { maintainExternalDocs } from '../scripts/maintain-external-docs.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ae-docs-lifecycle-'))
  const docs = join(root, 'docs')
  mkdirSync(docs)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  function write(path, content) {
    mkdirSync(dirname(join(docs, path)), { recursive: true })
    writeFileSync(join(docs, path), content)
  }
  return { root, docs, write }
}

function compact(root, path) {
  const preview = docsMaintain(root, ['--path', path, '--compact'])
  assert.equal(preview.status, 'ok', JSON.stringify(preview))
  const applied = docsMaintain(root, ['--path', path, '--compact', '--apply', '--expect-sha256', preview.source.sha256])
  assert.equal(applied.mode, 'applied', JSON.stringify(applied))
  return applied
}

test('category budgets include history, topics, graph indexes and rolling logs, not formal evidence', (t) => {
  const { root, write } = fixture(t)
  const candidates = ['01-history/开发历史记录.md', '08-ai-memory/03-key-workflows.md', 'ae/graphs/00-index.md', '05-reports/test-tracker.md']
  const protectedPaths = ['ae/plans/large-plan.md', '02-design/design.md', '00-process/archive/index.md', '07-test-data/index.md']
  for (const path of [...candidates, ...protectedPaths]) write(path, 'line\n'.repeat(4000))
  const report = docsMaintain(root, ['--check'])
  assert.equal(report.status, 'invalid')
  assert.equal(report.oversizedCount, 4)
  assert.equal(report.protectedLargeCount, 4)
  assert.deepEqual(report.oversized.map((item) => item.path).sort(), candidates.sort())
  for (const path of protectedPaths) assert.equal(docsMaintain(root, ['--compact', '--path', path]).status, 'invalid')
})

test('history and topic compaction preserve original bytes, relative link bases and bounded routers', (t) => {
  const { root, docs, write } = fixture(t)
  const original = Buffer.from('\uFEFF# 开发历史\r\n' + Array.from({ length: 100 }, (_, i) => `\r\n## 2026-09-${i % 28 + 1}\r\n${'测试记录 '.repeat(70)}[evidence](../ae/one.md)\r\n`).join(''))
  for (const path of ['01-history/开发历史记录.md', '08-ai-memory/03-key-workflows.md']) {
    write(path, original)
    const before = readdirSync(dirname(join(docs, path)))
    const preview = docsMaintain(root, ['--path', path, '--compact'])
    assert.deepEqual(readdirSync(dirname(join(docs, path))), before)
    assert.equal(preview.source.sha256, hash(original))
    compact(root, path)
    const router = readFileSync(join(docs, path))
    assert.ok(router.length <= 4096)
    const meta = parseRouter(router, path)
    assert.match(router.toString('utf8'), /有界入口/)
    const pages = Array.from({ length: meta.originalPages }, (_, i) => {
      const file = pagePath(path, meta, i + 1)
      assert.equal(dirname(file), dirname(path))
      const bytes = readFileSync(join(docs, file))
      assert.ok(bytes.length <= 15360)
      assert.doesNotThrow(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes))
      return bytes
    })
    assert.deepEqual(Buffer.concat(pages), original)
    assert.equal(docsMaintain(root, ['--path', path, '--verify']).status, 'ok')
    assert.equal(docsMaintain(root, ['--path', path, '--compact']).mode, 'unchanged')
  }
  assert.equal(docsMaintain(root, ['--check']).status, 'ok')
})

test('controlled appends rotate automatically and stay recoverable without growing an index', (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  write(path, '# History\nold\n')
  const entry = 'ae/experience/new.md'
  for (let i = 0; i < 15; i++) {
    write(entry, `## Event ${i}\nneedle-${i}\n`)
    const preview = docsAppend(root, ['--path', path, '--entry', entry])
    assert.equal(preview.mode, 'preview')
    assert.equal(docsAppend(root, ['--path', path, '--entry', entry, '--apply', '--expect-sha256', preview.sourceSha256]).status, 'invalid')
    const args = ['--path', path, '--entry', entry, '--apply', '--expect-sha256', preview.sourceSha256, '--expect-entry-sha256', preview.entrySha256]
    const result = docsAppend(root, args)
    assert.equal(result.mode, 'applied', JSON.stringify(result))
    assert.ok(readFileSync(join(docs, path)).length < 2048)
    assert.equal(docsAppend(root, args).status, 'invalid')
  }
  const verify = docsMaintain(root, ['--path', path, '--verify'])
  assert.equal(verify.status, 'ok')
  assert.equal(verify.pages, 16)
  assert.equal(docsSearch(root, ['--path', path, '--page', '16', '--query', 'needle-14']).results.length, 1)
})

test('search resumes inside pages and existing memory search follows managed topic pages', (t) => {
  const { root, docs, write } = fixture(t)
  const path = '08-ai-memory/03-key-workflows.md'
  write(path, '# Workflow\n' + Array.from({ length: 200 }, (_, i) => `## Entry ${i}\n${'规则 '.repeat(50)}Needle-${i}\n`).join(''))
  write('08-ai-memory/00-index.md', '# Memory\n')
  compact(root, path)
  const first = docsSearch(root, ['--path', path, '--query', 'Needle', '--limit', '2'])
  assert.equal(first.results.length, 2)
  assert.equal(first.scan.stoppedBy, 'results')
  const next = docsSearch(root, ['--path', first.resume.path, '--page', String(first.resume.page), '--line', String(first.resume.line), '--query', 'Needle', '--limit', '2'])
  assert.equal(next.results.length, 2)
  assert.notDeepEqual(first.results, next.results)
  assert.match(next.results[0].excerpt, /Needle-2/)
  assert.equal(memorySearch(root, ['--query', 'Needle']).results.length, 5)
  assert.equal(memoryIndex(root, ['--check']).status, 'ok')
  const budget = docsSearch(root, ['--path', path, '--query', 'absent', '--max-files', '2'])
  assert.equal(budget.scan.complete, false)
  assert.equal(budget.resume.page, 2)
  const meta = parseRouter(readFileSync(join(docs, path)), path)
  write(pagePath(path, meta, 1), 'tampered')
  assert.equal(docsMaintain(root, ['--path', path, '--verify']).status, 'invalid')
})

test('search retains the requested line when a budget prevents reading the starting page', (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  write(path, '# History\nneedle-one\nneedle-two\nneedle-three\n')
  compact(root, path)
  const base = ['--path', path, '--query', 'needle', '--page', '1', '--line', '3']
  for (const budget of [['--max-files', '1'], ['--max-bytes', '1'], ['--max-bytes', String(readFileSync(join(docs, path)).length)]]) {
    const result = docsSearch(root, [...base, ...budget])
    assert.equal(result.status, 'ok', JSON.stringify(result))
    assert.equal(result.scan.complete, false)
    assert.deepEqual(result.resume, { path, page: 1, line: 3 })
    const resumed = docsSearch(root, ['--path', result.resume.path, '--query', 'needle', '--page', String(result.resume.page), '--line', String(result.resume.line)])
    assert.match(resumed.results[0].excerpt, /needle-two/)
  }
  write('01-history/plain.md', '# History\nneedle-one\nneedle-two\n')
  const plain = docsSearch(root, ['--path', '01-history/plain.md', '--query', 'needle', '--line', '3', '--max-bytes', '1'])
  assert.deepEqual(plain.resume, { path: '01-history/plain.md', page: 1, line: 3 })
})

test('managed source edits, stale hashes, entry changes, locks and destination conflicts fail closed', (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  write(path, '# History\nold\n')
  const preview = docsMaintain(root, ['--path', path, '--compact'])
  const args = ['--path', path, '--compact', '--apply', '--expect-sha256', preview.source.sha256]
  write(path, 'changed')
  assert.equal(docsMaintain(root, args).status, 'invalid')
  write(path, '# History\nold\n')
  write(`01-history/.ae-doc-${hash(path).slice(0, 16)}.lock`, 'busy')
  assert.equal(docsMaintain(root, args).status, 'invalid')
  rmSync(join(docs, `01-history/.ae-doc-${hash(path).slice(0, 16)}.lock`))
  const page = `01-history/ae-doc-${hash(path).slice(0, 16)}-${preview.source.sha256}-000001.md`
  write(page, 'another writer')
  assert.equal(docsMaintain(root, args).status, 'invalid')
  assert.equal(readFileSync(join(docs, page), 'utf8'), 'another writer')
  rmSync(join(docs, page))
  compact(root, path)
  const router = readFileSync(join(docs, path), 'utf8')
  write(path, router + '\nnew task\n')
  assert.equal(docsMaintain(root, ['--path', path, '--compact']).status, 'invalid')
  write(path, router)
  write('ae/entry.md', 'old entry')
  const append = docsAppend(root, ['--path', path, '--entry', 'ae/entry.md'])
  write('ae/entry.md', 'edited entry')
  assert.equal(docsAppend(root, ['--path', path, '--entry', 'ae/entry.md', '--apply', '--expect-sha256', append.sourceSha256, '--expect-entry-sha256', append.entrySha256]).status, 'invalid')
  assert.equal(readFileSync(join(docs, path), 'utf8'), router)
})

test('ordinary format references remain searchable and appendable while damaged router headers fail closed', (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  const text = '# Format notes\nThe declared format is `ae-doc-pages:v1`.\n'
  write(path, text)
  assert.equal(parseRouter(Buffer.from(text), path), null)
  assert.equal(docsSearch(root, ['--path', path, '--query', 'declared']).results.length, 1)
  write('ae/entry.md', 'Document the ae-doc-pages:v1 format.\n')
  assert.equal(docsAppend(root, ['--path', path, '--entry', 'ae/entry.md']).status, 'ok')
  compact(root, path)
  const router = readFileSync(join(docs, path), 'utf8')
  for (const damaged of [
    `\uFEFF${router}`, `\n${router}`, `notes\n${router}`,
    router.replace('<!-- ae-doc-pages:v1 ', '<!--ae-doc-pages:v1 '),
    router.replace('<!-- ae-doc-pages:v1 ', '<!-- ae-doc-pages:v1\t'),
  ]) {
    write(path, damaged)
    assert.equal(docsMaintain(root, ['--path', path, '--compact']).status, 'invalid')
  }
})

test('UTF-8 errors, huge lines, traversal, links and protected appends are rejected', (t) => {
  const { root, docs, write } = fixture(t)
  const path = '01-history/history.md'
  for (const bytes of [Buffer.from([0xc3, 0x28]), Buffer.alloc(16000, 65), Buffer.alloc(8 * 1024 * 1024 + 1)]) {
    write(path, bytes)
    assert.equal(docsMaintain(root, ['--path', path, '--compact']).status, 'invalid')
  }
  write(path, '# History\n')
  write('08-ai-memory/00-index.md', '# Index\n')
  write('ae/entry.md', 'record\n')
  assert.equal(docsAppend(root, ['--path', '08-ai-memory/00-index.md', '--entry', 'ae/entry.md']).status, 'invalid')
  assert.equal(docsSearch(root, ['--path', '../outside.md', '--query', 'secret']).status, 'invalid')
  symlinkSync(docs, join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.equal(docsMaintain(root, ['--docs-root', join(root, 'linked')]).status, 'invalid')
})

test('document depth exhaustion is explicit and a scoped query avoids the broad inventory', (t) => {
  const { root, write } = fixture(t)
  write('01-history/history.md', 'needle\n')
  write(`${'d/'.repeat(25)}record.md`, 'protected\n')
  const audit = docsMaintain(root, ['--check'])
  assert.equal(audit.status, 'invalid')
  assert.match(audit.diagnostics.join(), /depth exceeds 24/)
  assert.equal(docsSearch(root, ['--query', 'needle']).status, 'invalid')
  assert.equal(docsSearch(root, ['--path', '01-history/history.md', '--query', 'needle']).results.length, 1)
})

function registeredHome(t) {
  const base = fixture(t)
  const projectRoot = join(base.root, 'projects', 'sample')
  const contextRoot = join(projectRoot, 'branches', 'main')
  const docsRoot = join(contextRoot, 'docs')
  mkdirSync(join(docsRoot, '01-history'), { recursive: true })
  const record = { projectId: 'sample', projectRoot, repositoryRoot: base.root, manifest: join(projectRoot, 'project-manifest.json') }
  const context = { contextKey: 'main', contextName: 'main', contextType: 'branch', docsRoot, manifest: join(contextRoot, 'context-manifest.json') }
  writeFileSync(join(base.root, 'registry.json'), JSON.stringify({ schemaVersion: 2, projects: { sample: record } }))
  writeFileSync(record.manifest, JSON.stringify({ schemaVersion: 2, projectId: 'sample', identity: { type: 'git-common-directory', path: join(base.root, '.git') }, contexts: { main: context } }))
  writeFileSync(context.manifest, JSON.stringify({ schemaVersion: 2, projectId: 'sample', ...context }))
  writeFileSync(join(docsRoot, '01-history', 'history.md'), '# History\n' + 'entry\n'.repeat(5000))
  return { ...base, docsRoot, context }
}

test('external batch validates registered contexts, binds the plan and verifies each applied original', (t) => {
  const { root, docsRoot } = registeredHome(t)
  const preview = maintainExternalDocs(['--home', root])
  assert.equal(preview.status, 'ok', JSON.stringify(preview))
  assert.equal(preview.candidates.length, 1)
  assert.equal(maintainExternalDocs(['--home', root, '--apply', '--expect-plan-sha256', '0'.repeat(64), '--report', join(root, 'report.json')]).status, 'invalid')
  const applied = maintainExternalDocs(['--home', root, '--apply', '--expect-plan-sha256', preview.planSha256, '--report', join(root, 'report.json')])
  assert.equal(applied.status, 'ok', JSON.stringify(applied))
  assert.equal(applied.applied[0].verified, true)
  assert.equal(applied.reporting.complete, true)
  assert.equal(JSON.parse(readFileSync(join(root, 'report.json'), 'utf8')).status, 'ok')
  assert.ok(readFileSync(join(docsRoot, '01-history', 'history.md')).length < 4096)
  assert.equal(maintainExternalDocs(['--home', root, '--check']).candidates.length, 0)
})

test('external maintenance establishes durable reporting before changing any document', (t) => {
  const { root, docsRoot } = registeredHome(t)
  const path = join(docsRoot, '01-history', 'history.md')
  const before = readFileSync(path)
  const preview = maintainExternalDocs(['--home', root])
  const report = join(root, 'report.json')
  const open = fs.openSync
  t.mock.method(fs, 'openSync', (file, ...args) => {
    if (file === report) throw Object.assign(new Error('report creation denied'), { code: 'EACCES' })
    return open(file, ...args)
  })
  syncBuiltinESMExports()
  let result
  try {
    result = maintainExternalDocs(['--home', root, '--apply', '--expect-plan-sha256', preview.planSha256, '--report', report])
  } finally {
    t.mock.restoreAll()
    syncBuiltinESMExports()
  }
  assert.equal(result.status, 'invalid')
  assert.deepEqual(result.applied, [])
  assert.deepEqual(readFileSync(path), before)
})

test('external maintenance retains applied recovery evidence if the final report cannot be published', (t) => {
  const { root, docsRoot } = registeredHome(t)
  const preview = maintainExternalDocs(['--home', root])
  const report = join(root, 'report.json')
  const rename = fs.renameSync
  t.mock.method(fs, 'renameSync', (from, to) => {
    if (to === report) throw Object.assign(new Error('report replacement denied'), { code: 'EACCES' })
    return rename(from, to)
  })
  syncBuiltinESMExports()
  let result
  try {
    result = maintainExternalDocs(['--home', root, '--apply', '--expect-plan-sha256', preview.planSha256, '--report', report])
  } finally {
    t.mock.restoreAll()
    syncBuiltinESMExports()
  }
  assert.equal(result.status, 'partial', JSON.stringify(result))
  assert.equal(result.applied.length, 1)
  assert.equal(result.applied[0].verified, true)
  assert.equal(result.reporting.complete, false)
  assert.match(result.reporting.error, /report replacement denied/)
  const initial = JSON.parse(readFileSync(report, 'utf8'))
  assert.equal(initial.status, 'in-progress')
  const events = readFileSync(result.reporting.journal, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.deepEqual(events.map((event) => event.phase), ['prepared', 'applying', 'applied', 'verified', 'completed'])
  assert.equal(events[2].result.recovery.sha256, preview.candidates[0].sha256)
  assert.equal(docsMaintain(root, ['--docs-root', docsRoot, '--path', '01-history/history.md', '--verify']).status, 'ok')
})

test('external maintenance stops after a journal failure and reports writes already performed', (t) => {
  const { root, docsRoot } = registeredHome(t)
  const secondPath = join(docsRoot, '01-history', 'second.md')
  const second = '# Second\n' + 'entry\n'.repeat(5000)
  writeFileSync(secondPath, second)
  const preview = maintainExternalDocs(['--home', root])
  const report = join(root, 'report.json')
  const write = fs.writeFileSync
  t.mock.method(fs, 'writeFileSync', (file, data, ...args) => {
    if (typeof data === 'string' && data.includes('"phase":"applied"')) {
      throw Object.assign(new Error('journal write denied'), { code: 'EACCES' })
    }
    return write(file, data, ...args)
  })
  syncBuiltinESMExports()
  let result
  try {
    result = maintainExternalDocs(['--home', root, '--apply', '--expect-plan-sha256', preview.planSha256, '--report', report])
  } finally {
    t.mock.restoreAll()
    syncBuiltinESMExports()
  }
  assert.equal(result.status, 'partial', JSON.stringify(result))
  assert.equal(result.applied.length, 1)
  assert.match(result.reporting.error, /journal write denied/)
  assert.equal(readFileSync(secondPath, 'utf8'), second)
  const events = readFileSync(result.reporting.journal, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.deepEqual(events.map((event) => event.phase), ['prepared', 'applying'])
  assert.equal(events[1].candidate.path, preview.candidates[0].path)
  assert.equal(events[1].candidate.sha256, preview.candidates[0].sha256)
  assert.equal(events[1].candidate.recovery.sha256, preview.candidates[0].sha256)
})

test('external batch refuses conflicting identity and escaped docs roots before writes', (t) => {
  const { root, context, docsRoot } = registeredHome(t)
  const source = readFileSync(join(docsRoot, '01-history', 'history.md'))
  writeFileSync(context.manifest, JSON.stringify({ schemaVersion: 2, projectId: 'wrong', ...context }))
  assert.equal(maintainExternalDocs(['--home', root]).status, 'invalid')
  assert.deepEqual(readFileSync(join(docsRoot, '01-history', 'history.md')), source)
})

test('nested topics are bounded and managed index remains compatible with the old gate', (t) => {
  const { root, write } = fixture(t)
  write('08-ai-memory/00-index.md', '# Index\n' + 'old route\n'.repeat(600))
  write('08-ai-memory/domain/workflow.md', '# Workflow\n' + 'entry\n'.repeat(3000))
  assert.equal(docsMaintain(root, ['--check']).oversizedCount, 2)
  compact(root, '08-ai-memory/00-index.md')
  compact(root, '08-ai-memory/domain/workflow.md')
  assert.equal(memoryIndex(root, ['--check']).status, 'ok')
  assert.equal(memoryIndex(root, ['--compact']).mode, 'unchanged')
  assert.equal(memorySearch(root, ['--path', 'domain/workflow.md', '--query', 'entry']).results.length, 5)
  assert.equal(docsMaintain(root, ['--check']).status, 'ok')
})

test('optional real history sample is lossless and searches bounded output without touching the original', (t) => {
  const sample = process.env.AE_HISTORY_SAMPLE
  if (!sample) return t.skip('set AE_HISTORY_SAMPLE for read-only real-history fixture')
  const snapshot = readFileSync(sample)
  const managed = parseRouter(snapshot, '01-history/开发历史记录.md')
  const original = managed ? Buffer.concat(Array.from({ length: managed.originalPages }, (_, i) => readFileSync(join(dirname(sample), basename(pagePath(managed.path, managed, i + 1)))))) : snapshot
  if (managed) assert.equal(hash(original), managed.sourceSha256)
  const { root, write } = fixture(t)
  const path = '01-history/开发历史记录.md'
  write(path, original)
  const applied = compact(root, path)
  assert.equal(docsMaintain(root, ['--path', path, '--verify']).status, 'ok')
  const found = docsSearch(root, ['--path', path, '--query', '同步'])
  assert.equal(found.results.length, 5)
  assert.ok(Buffer.byteLength(JSON.stringify(found)) < 10000)
  assert.deepEqual(readFileSync(sample), snapshot)
  console.log(JSON.stringify({ sourceBytes: original.length, routerBytes: applied.replacement.bytes, pages: applied.pages, searchReadBytes: found.scan.bytes, searchOutputBytes: Buffer.byteLength(JSON.stringify(found)), originalUnchanged: true }))
})
