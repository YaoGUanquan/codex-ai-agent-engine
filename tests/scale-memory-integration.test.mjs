import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { graphBuild, graphQuery, collectSourceFiles } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/graph.mjs'
import { taskAnalyze } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/tasks.mjs'
import { recovery } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/recovery.mjs'
import { docsMaintain, docsSearch, isDocumentPage } from '../plugins/ai-agent-engine-codex/scripts/docs-lifecycle.mjs'
import { memoryIndex, memorySearch } from '../plugins/ai-agent-engine-codex/scripts/memory-navigation.mjs'
import { reviewPackage } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/review.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ae-scale-memory-'))
  const docs = join(root, 'docs')
  mkdirSync(docs)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return { root, docs }
}

function write(root, path, text) {
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, text)
  return target
}

test('recovery honors an explicit external docs root without mixing local artifacts', (t) => {
  const local = fixture(t)
  const external = fixture(t)
  write(local.docs, 'ae/plans/local-plan.md', '# Local')
  write(external.docs, 'ae/plans/external-plan.md', '# External')
  const result = recovery(local.root, ['--docs-root', external.docs])
  assert.equal(result.docsRoot, external.docs)
  assert.equal(result.pathBase, 'docs-root')
  assert.deepEqual(result.candidates.map((item) => item.path), ['ae/plans/external-plan.md'])
  assert.deepEqual(result.candidates.map((item) => item.docsPath), ['ae/plans/external-plan.md'])
  assert.equal(result.completeness.complete, true)
  assert.equal(result.contextVerified, false)
})

test('invalid explicit recovery roots and options never fall back to local docs', (t) => {
  const { root, docs } = fixture(t)
  write(docs, 'ae/plans/local-plan.md', '# Local')
  for (const args of [
    ['--docs-root'],
    ['--docs-root', 'relative'],
    ['--docs-root', join(root, 'absent')],
    ['--docs-rooot', docs],
    ['--type', 'unknown'],
  ]) assert.throws(() => recovery(root, args), undefined, JSON.stringify(args))
  const external = fixture(t)
  symlinkSync(external.docs, join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.throws(() => recovery(root, ['--docs-root', join(root, 'linked')]), /non-link/)
})

test('local recovery retains worktree-relative paths and an absent default docs directory is empty', (t) => {
  const { root, docs } = fixture(t)
  write(docs, 'ae/plans/local-plan.md', '# Local')
  const result = recovery(root)
  assert.equal(result.pathBase, 'worktree')
  assert.equal(result.latest.path, 'docs/ae/plans/local-plan.md')
  assert.equal(result.latest.docsPath, 'ae/plans/local-plan.md')
  const empty = join(root, 'empty')
  mkdirSync(empty)
  const missing = recovery(empty)
  assert.equal(missing.exists, false)
  assert.equal(missing.recommendation, 'no_artifacts_found')
  assert.equal(missing.completeness.complete, true)
  assert.equal(existsSync(join(empty, 'docs')), false)
})

test('recovery excludes navigation and generated pages and can scope its budget by artifact type', (t) => {
  const { root, docs } = fixture(t)
  const page = `ae-doc-${'a'.repeat(16)}-${'b'.repeat(64)}-000001.md`
  write(docs, 'ae/prds/first.md', '# Requirements')
  const plan = write(docs, 'ae/plans/current-plan.md', '# Plan')
  const router = write(docs, 'ae/reviews/00-index.md', '# Navigation')
  const fragment = write(docs, `ae/reviews/${page}`, '# Old review fragment')
  utimesSync(plan, 1, 1)
  utimesSync(router, 2, 2)
  utimesSync(fragment, 3, 3)
  const all = recovery(root)
  assert.equal(all.candidates.some((item) => item.path.endsWith(page) || item.path.endsWith('00-index.md')), false)
  assert.ok(all.diagnostics.some((item) => item.skipped?.['excluded-file'] === 2))
  const selected = recovery(root, ['--type', 'plan', '--file-limit', '1'])
  assert.deepEqual(selected.candidates.map((item) => item.path), ['docs/ae/plans/current-plan.md'])
  assert.equal(selected.completeness.complete, true)
  assert.equal(selected.scope.artifactType, 'plan')
})

test('generic scans exclude immutable legacy index history while memory retrieval still finds it', (t) => {
  const { root, docs } = fixture(t)
  write(docs, '08-ai-memory/00-index.md', '# Index\nHistoricalOnlyNeedle\n')
  write(root, 'src/live.js', 'export const live = true')
  const preview = memoryIndex(root, ['--compact'])
  const applied = memoryIndex(root, ['--compact', '--apply', '--expect-sha256', preview.index.sha256])
  assert.equal(applied.status, 'ok')
  const graph = graphBuild(root, [])
  assert.equal(graph.nodes.some((item) => isDocumentPage(item.path)), false)
  assert.equal(graph.scope.documentPages, 'excluded')
  assert.ok(graph.diagnostics.scan.skipped['excluded-file'] > 0)
  const task = taskAnalyze(root, ['--task', 'HistoricalOnlyNeedle'])
  assert.equal(task.units.flatMap((unit) => unit.files).length, 0)
  assert.equal(task.scope.documentPages, 'excluded')
  const history = memorySearch(root, ['--history', '--query', 'HistoricalOnlyNeedle'])
  assert.equal(history.results.length, 1)
  assert.equal(history.results[0].historical, true)
  const selected = applied.history[0].path
  assert.ok(readFileSync(join(docs, '08-ai-memory', selected), 'utf8').includes('HistoricalOnlyNeedle'))
})

test('managed topic fragments remain accessible through bounded owner-aware search and explicit source opt-in', (t) => {
  const { root, docs } = fixture(t)
  const owner = '08-ai-memory/03-workflows.md'
  write(docs, owner, '# Workflow\nManagedTopicNeedle `src/live.js`\n')
  write(root, 'src/live.js', 'export const live = true')
  const preview = docsMaintain(root, ['--path', owner, '--compact'])
  assert.equal(docsMaintain(root, ['--path', owner, '--compact', '--apply', '--expect-sha256', preview.source.sha256]).status, 'ok')
  const scoped = graphBuild(root, ['--limit', '2'])
  assert.equal(scoped.completeness.complete, true)
  assert.equal(scoped.nodes.length, 2)
  assert.equal(scoped.edges.length, 0)
  const included = graphBuild(root, ['--include-document-pages'])
  const page = included.nodes.find((node) => isDocumentPage(node.path))
  assert.ok(page)
  assert.equal(included.scope.documentPages, 'included')
  assert.ok(included.edges.some((edge) => edge.from === page.path && edge.to === 'src/live.js'))
  assert.equal(graphQuery(root, ['--path', page.path, '--include-document-pages']).matchedNodes.length, 1)
  const task = taskAnalyze(root, ['--task', 'ManagedTopicNeedle', '--include-document-pages'])
  assert.deepEqual(task.units.flatMap((unit) => unit.files).map((file) => file.path), [page.path])
  assert.equal(task.scope.documentPages, 'included')
  assert.equal(task.units[0].files[0].read_only, true)
  assert.deepEqual(task.worker_requests[0].owned_files, [])
  assert.deepEqual(task.worker_requests[0].read_only_files, [page.path])
  assert.ok(task.worker_requests[0].forbidden_files.includes(page.path))
  assert.equal(task.worker_requests[0].lane, 'read-only')
  const search = docsSearch(root, ['--path', owner, '--query', 'ManagedTopicNeedle'])
  assert.equal(search.results.length, 1)
  assert.equal(search.results[0].document, owner)
  assert.equal(collectSourceFiles(root).scan.scope.documentPages, 'excluded')
})

test('source inclusion is an explicit flag, not a truthy configuration string', (t) => {
  const { root } = fixture(t)
  assert.throws(() => graphBuild(root, ['--include-document-pages', 'false']), /flag/)
  assert.throws(() => taskAnalyze(root, ['--task', 'read', '--include-document-pages', 'false']), /flag/)
})

test('plan-declared immutable pages cannot become writable worker ownership', (t) => {
  const { root } = fixture(t)
  const page = `docs/08-ai-memory/ae-doc-${'a'.repeat(16)}-${'b'.repeat(64)}-000001.md`
  write(root, '.codex/ae-skill-profiles.yaml', 'multi_agent:\n  enabled: true\n  mode: auto\n  allow_write_agents: true\n')
  write(root, 'plan.md', [
    '### U1 - Evidence only', '- Depends on: none', `- Files: \`${page}\``,
    '### U2 - Source change', '- Depends on: none', '- Files: `src/current.js`',
  ].join('\n'))
  const result = taskAnalyze(root, ['--mode', 'plan', '--plan', 'plan.md'])
  assert.equal(result.units[0].files[0].read_only, true)
  assert.deepEqual(result.worker_requests[0].owned_files, [])
  assert.deepEqual(result.worker_requests[0].read_only_files, [page])
  assert.ok(result.worker_requests[0].forbidden_files.includes(page))
  assert.equal(result.worker_requests[0].authorization, 'read-only-review')
  assert.equal(result.write_parallel_eligibility.can_parallelize, false)
  assert.ok(result.warnings.some((warning) => /immutable document pages/i.test(warning)))
})

test('mixed plan units preserve writable source and explicit prohibitions alongside read-only pages', (t) => {
  const { root } = fixture(t)
  const page = `docs/08-ai-memory/00-index-history-${'a'.repeat(64)}-0001.md`
  write(root, '.codex/ae-skill-profiles.yaml', 'multi_agent:\n  enabled: true\n  mode: auto\n  allow_write_agents: true\n')
  write(root, 'plan.md', [
    '### U1 - Source with evidence', '- Depends on: none', `- Files: \`src/current.js\`, \`${page}\``,
    '- Forbidden files: `src/protected.js`',
    '### U2 - Independent source', '- Depends on: none', '- Files: `src/other.js`',
  ].join('\n'))
  const result = taskAnalyze(root, ['--mode', 'plan', '--plan', 'plan.md'])
  assert.deepEqual(result.worker_requests[0].owned_files, ['src/current.js'])
  assert.deepEqual(result.worker_requests[0].read_only_files, [page])
  assert.deepEqual(result.worker_requests[0].forbidden_files, ['src/protected.js', page])
  assert.equal(result.write_parallel_eligibility.can_parallelize, true)
  assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
})

test('review inventory never drops a changed immutable page when impact scanning excludes it', (t) => {
  const { root } = fixture(t)
  const git = (args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 10000, windowsHide: true })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trim()
  }
  const page = `docs/08-ai-memory/00-index-history-${'a'.repeat(64)}-0001.md`
  git(['init'])
  git(['config', 'user.name', 'Integration Test'])
  git(['config', 'user.email', 'integration@example.test'])
  write(root, page, '# Original fixture\n')
  write(root, 'src/current.js', 'export const current = true')
  git(['add', '.'])
  git(['commit', '-m', 'fixture baseline'])
  const base = git(['rev-parse', 'HEAD'])
  write(root, page, '# Altered fixture\n')
  git(['add', page])
  git(['commit', '-m', 'fixture change'])
  const head = git(['rev-parse', 'HEAD'])
  const args = ['--base', base, '--head', head, '--with-impact']
  const result = reviewPackage(root, args)
  assert.deepEqual(result.inventory.files.map((file) => file.path), [page])
  assert.ok(result.impact.unresolvedChangedFiles.includes(page))
  assert.equal(result.impact.scope.documentPages, 'excluded')
  const included = reviewPackage(root, [...args, '--include-document-pages'])
  assert.ok(included.impact.seedFiles.includes(page))
  assert.equal(included.impact.scope.documentPages, 'included')
})
