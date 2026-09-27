import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { scanFiles } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/utils.mjs'
import { buildShallowGraph, graphBuild } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/graph.mjs'
import { taskAnalyze } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/tasks.mjs'
import { gate } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/gate.mjs'
import { recovery } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/recovery.mjs'
import { issueCommand } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/issues.mjs'
import { parseSimpleYaml } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/yaml.mjs'
import { withLocalOperationLock } from '../plugins/ai-agent-engine-codex/scripts/local-operation-lock.mjs'
import { markitdown } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/markitdown.mjs'
import { fingerprintManagedPath } from '../plugins/ai-agent-engine-codex/scripts/path-fingerprint.mjs'
import { createHash } from 'node:crypto'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ae-scale-runtime-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

test('source traversal bounds directory entries before materializing an entire large directory', (t) => {
  const root = fixture(t)
  for (let index = 0; index < 400; index++) writeFileSync(join(root, `file-${String(index).padStart(4, '0')}.js`), 'export const n = 1')
  const result = scanFiles(root, { maxFiles: 3, maxEntries: 10, readText: true })
  assert.equal(result.files.length, 3)
  assert.equal(result.diagnostics.entriesVisited, 10)
  assert.equal(result.completeness.complete, false)
  assert.ok(result.completeness.reasons.includes('entry-limit'))
  assert.ok(result.completeness.reasons.includes('file-limit'))
  assert.ok(result.diagnostics.bytesRead < 100)
})

test('scan limits distinguish file size, total bytes, depth, unreadable roots and invalid text', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'a.js'), 'x'.repeat(200))
  writeFileSync(join(root, 'b.js'), 'y'.repeat(30))
  writeFileSync(join(root, 'c.js'), 'z'.repeat(30))
  mkdirSync(join(root, 'deep', 'nested'), { recursive: true })
  writeFileSync(join(root, 'deep', 'nested', 'x.js'), 'x')
  const small = scanFiles(root, { maxFileBytes: 100, maxTotalBytes: 40, readText: true })
  assert.ok(small.completeness.reasons.includes('file-byte-limit'))
  assert.ok(small.completeness.reasons.includes('total-byte-limit'))
  assert.equal(small.diagnostics.bytesRead, 30)
  assert.ok(scanFiles(root, { maxDepth: 0 }).completeness.reasons.includes('depth-limit'))
  const missing = scanFiles(join(root, 'missing'))
  assert.equal(missing.completeness.complete, false)
  assert.equal(missing.diagnostics.errorCount, 1)
  writeFileSync(join(root, 'bad.txt'), Buffer.from([0xff, 0xfe]))
  assert.ok(scanFiles(root, { readText: true }).diagnostics.errorCount > 0)
})

test('graph fingerprints include content and partial graphs never claim complete fresh evidence', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'a.js'), 'export const n = 1')
  writeFileSync(join(root, 'b.js'), "import './a.js'")
  const before = graphBuild(root, [])
  writeFileSync(join(root, 'a.js'), 'export const n = 2')
  const after = graphBuild(root, [])
  assert.notEqual(before.freshness.fingerprint, after.freshness.fingerprint)
  assert.equal(after.freshness.canUseAsEvidence, true)
  const partial = graphBuild(root, ['--limit', '1'])
  assert.equal(partial.freshness.status, 'partial')
  assert.equal(partial.freshness.canUseAsEvidence, false)
  assert.equal(partial.limits.files.eligibleIsExact, false)
  assert.throws(() => graphBuild(root, ['--max-file-bytes']), /requires an integer/)
})

test('graph discloses the previously silent internal edge and external dependency caps', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'a.js'), "export const n = 1")
  writeFileSync(join(root, 'b.js'), "export const n = 1")
  writeFileSync(join(root, 'main.js'), "import './a.js'\nimport './b.js'\n" + Array.from({ length: 210 }, (_, index) => `import 'dependency-${index}'`).join('\n'))
  const result = graphBuild(root, ['--edge-limit', '1'])
  assert.equal(result.edges.length, 1)
  assert.equal(result.externalDependencies.length, 200)
  assert.deepEqual(new Set(result.completeness.reasons), new Set(['edge-limit', 'external-limit']))
})

test('shallow dependency extraction preserves static, multiline, re-export and literal call forms', () => {
  const text = [
    "import './side.js';",
    "import main from './default.js';",
    "import {\n  named\n} from './named.js';",
    "export { value } from './export.js';",
    "export * from './star.js';",
    "const lazy = import ('./lazy.js');",
    "const common = require ('./common.js');",
    "import 'external-package';",
  ].join('\n')
  const targets = ['side', 'default', 'named', 'export', 'star', 'lazy', 'common'].map((name) => `${name}.js`)
  const files = [{ relativePath: 'main.js', text }, ...targets.map((relativePath) => ({ relativePath, text: '' }))]
  const result = buildShallowGraph('.', files)
  assert.deepEqual(new Set(result.edges.map((edge) => edge.to)), new Set(targets))
  assert.deepEqual(result.externalDependencies, [{ from: 'main.js', dependency: 'external-package' }])
})

test('shallow graph does not repeatedly rescan malformed large import and export clauses', () => {
  const moduleUrl = new URL('../plugins/ai-agent-engine-codex/scripts/ae-tools/graph.mjs', import.meta.url).href
  const source = `
    import { buildShallowGraph } from ${JSON.stringify(moduleUrl)};
    const files = ['import ', 'export '].map((token, index) => ({
      relativePath: index + '.js',
      text: token.repeat(131072) + ";import './target.js';"
    }));
    files.push({ relativePath: 'target.js', text: '' });
    const graph = buildShallowGraph('.', files);
    console.log(JSON.stringify(graph.edges));
  `
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    encoding: 'utf8', timeout: 5000, windowsHide: true, maxBuffer: 65536,
  })
  assert.equal(child.error, undefined, child.error?.message)
  assert.equal(child.status, 0, child.stderr)
  assert.deepEqual(JSON.parse(child.stdout).map((edge) => edge.to), ['target.js', 'target.js'])
})

test('task scan finds content matches and reports candidate provenance without returning contents', (t) => {
  const root = fixture(t)
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src', 'plain.js'), 'export function reconcileInvoice() {}')
  const result = taskAnalyze(root, ['--task', 'fix reconcileInvoice'])
  assert.equal(result.units[0].files[0].path, 'src/plain.js')
  assert.ok(result.units[0].files[0].match.content.includes('reconcileinvoice'))
  assert.equal(result.manual_scope_review_required, true)
  assert.equal(result.units[0].files[0].text, undefined)
})

test('invalid explicit multi-agent configuration fails closed instead of enabling defaults', (t) => {
  const root = fixture(t)
  mkdirSync(join(root, '.codex'))
  for (const text of ['multi_agent: [broken', 'multi_agent:\n  enabled: perhaps', 'multi_agent:\n  allow_write_agents: "true"', 'multi_agent: true']) {
    writeFileSync(join(root, '.codex', 'ae-skill-profiles.yaml'), text)
    const result = taskAnalyze(root, ['--task', 'change api'])
    assert.equal(result.multi_agent_config.source, 'invalid')
    assert.equal(result.multi_agent_config.effective.enabled, false)
    assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
    assert.ok(result.warnings.some((warning) => warning.includes('Invalid')))
  }
})

test('cyclic plan dependencies do not produce auto-parallel-ready even with explicit write configuration', (t) => {
  const root = fixture(t)
  mkdirSync(join(root, '.codex'))
  writeFileSync(join(root, '.codex', 'ae-skill-profiles.yaml'), 'multi_agent:\n  enabled: true\n  mode: auto\n  allow_write_agents: true\n')
  writeFileSync(join(root, 'plan.md'), '### U1 - First\n- Depends on: U2\n- Files: `src/a.js`\n### U2 - Second\n- Depends on: U1\n- Files: `src/b.js`\n')
  const result = taskAnalyze(root, ['--mode', 'plan', '--plan', 'plan.md'])
  assert.equal(result.write_parallel_eligibility.can_parallelize, false)
  assert.ok(result.write_parallel_eligibility.blockers.some((blocker) => blocker.includes('cyclic')))
})

test('YAML subset rejects unsupported structures, duplicate keys and prototype mutation', () => {
  for (const text of ['key: [unfinished', 'key: &anchor value', 'key: |\n  text', 'key: 1\nkey: 2', '__proto__:\n  polluted: true', 'key: value\n  nested: wrong', 'key:\n\tchild: true']) {
    assert.throws(() => parseSimpleYaml(text))
  }
  assert.equal({}.polluted, undefined)
  assert.deepEqual(parseSimpleYaml('labels: ["a,b", c]\nurl: https://example.test/v1'), { labels: ['a,b', 'c'], url: 'https://example.test/v1' })
  assert.deepEqual(parseSimpleYaml('items:\n  - schema:\n      type: string\n    name: sample'), { items: [{ schema: { type: 'string' }, name: 'sample' }] })
})

test('gate does not promote declarations or incomplete execution records to successful evidence', (t) => {
  const root = fixture(t)
  const result = gate(root, ['--checkpoint', 'final', '--validation', 'npm test'])
  assert.equal(result.status, 'block')
  assert.equal(result.evidence_status, 'unverified')
  assert.equal(result.evidence[0].status, 'declared')
  assert.throws(() => gate(root, ['--validation-result', JSON.stringify({ command: 'npm test', status: 'successful', exitCode: 0 })]), /timestamps/)
})

test('gate hashes supplied artifacts, preserves failure, and retains unverified declared commands', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'validation.txt'), 'local fixture: 2 passed')
  const record = { command: 'npm test', status: 'successful', exitCode: 0, startedAt: '2026-01-01T01:00:00Z', finishedAt: '2026-01-01T01:00:01Z', evidence: 'validation.txt', tier: 'static' }
  const successful = gate(root, ['--validation-result', JSON.stringify(record)])
  assert.equal(successful.status, 'pass')
  assert.equal(successful.evidence[0].artifact.sha256.length, 64)
  const incomplete = gate(root, ['--validation', 'npm run check', '--validation-result', JSON.stringify(record)])
  assert.equal(incomplete.status, 'block')
  const failed = gate(root, ['--validation-result', JSON.stringify({ ...record, status: 'failed', exitCode: 1 })])
  assert.equal(failed.evidence_status, 'failed')
  assert.equal(failed.status, 'block')
})

test('recovery returns bounded candidates and only calls the observed subset latest', (t) => {
  const root = fixture(t)
  const plans = join(root, 'docs', 'ae', 'plans')
  mkdirSync(plans, { recursive: true })
  for (let index = 0; index < 5; index++) writeFileSync(join(plans, `${index}-plan.md`), '# plan')
  const result = recovery(root, ['--limit', '2', '--file-limit', '3'])
  assert.equal(result.candidates.length, 2)
  assert.equal(result.completeness.complete, false)
  assert.match(result.latestScope, /observed subset/)
})

test('issue list pages results and creation does not parse unrelated historical records', (t) => {
  const root = fixture(t)
  issueCommand(root, ['create', '--title', 'First'])
  issueCommand(root, ['create', '--title', 'Second'])
  const first = issueCommand(root, ['list', '--limit', '1'])
  assert.equal(first.issues.length, 1)
  assert.equal(first.pagination.nextOffset, 1)
  assert.equal(first.completeness.complete, false)
  const second = issueCommand(root, ['list', '--limit', '1', '--offset', '1'])
  assert.notEqual(first.issues[0].id, second.issues[0].id)
  const storage = join(root, 'docs', 'ae', 'issues')
  writeFileSync(join(storage, 'AEI-20000101-001.md'), 'damaged historical file')
  assert.equal(issueCommand(root, ['create', '--title', 'Third']).status, 'ok')
  assert.throws(() => issueCommand(root, ['list']), /ID does not match/)
})

test('local locks identify owners, reject competing writers and never auto-steal expired locks', (t) => {
  const root = fixture(t)
  const lock = join(root, 'operation.lock')
  withLocalOperationLock(lock, () => {
    const metadata = JSON.parse(readFileSync(lock, 'utf8'))
    assert.equal(metadata.pid, process.pid)
    assert.equal(typeof metadata.token, 'string')
    assert.throws(() => withLocalOperationLock(lock, () => assert.fail(), { timeoutMs: 0 }), /busy/)
  }, { owner: 'test writer' })
  assert.equal(existsSync(lock), false)
  const stale = JSON.stringify({ owner: 'old writer', pid: 1, expiresAt: '2020-01-01T00:00:00Z' })
  writeFileSync(lock, stale)
  assert.throws(() => withLocalOperationLock(lock, () => assert.fail()), /expired lease/)
  assert.equal(readFileSync(lock, 'utf8'), stale)
})

test('independent issue writer processes serialize allocation without lost records', async (t) => {
  const root = fixture(t)
  const moduleUrl = new URL('../plugins/ai-agent-engine-codex/scripts/ae-tools/issues.mjs', import.meta.url).href
  const calls = Array.from({ length: 6 }, (_, index) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', `import { issueCommand } from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(issueCommand(process.argv[1], ['create', '--title', 'Writer ${index}'])));`, root], { timeout: 15000 })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr || `writer exit ${code}`)))
  }))
  const results = await Promise.all(calls)
  assert.equal(new Set(results.map((result) => result.issue.id)).size, 6)
  assert.equal(issueCommand(root, ['list']).issues.length, 6)
  assert.equal(existsSync(join(root, 'docs', 'ae', 'issues', 'issues.lock')), false)
})

test('conversion exposes row, column and UTF-8 output truncation rather than silently dropping data', (t) => {
  const root = fixture(t)
  writeFileSync(join(root, 'sample.csv'), 'a,b,c\n1,2,3\n4,5,6\n7,8,9')
  const converted = markitdown(root, ['sample.csv', '--row-limit', '2', '--column-limit', '2'])
  assert.equal(converted.completeness.complete, false)
  assert.deepEqual(new Set(converted.completeness.reasons), new Set(['column-limit', 'row-limit']))
  assert.equal(converted.diagnostics.rowsTotal, 3)
  assert.equal(converted.diagnostics.rowsReturned, 2)
  writeFileSync(join(root, 'unicode.md'), '\u4e2d\u6587'.repeat(100))
  const bounded = markitdown(root, ['unicode.md', '--max-output-bytes', '7'])
  assert.ok(Buffer.byteLength(bounded.markdown) <= 7)
  assert.equal(bounded.markdown.includes('\ufffd'), false)
  assert.deepEqual(bounded.completeness.reasons, ['output-byte-limit'])
})

test('every distributed skill resolves one canonical scale contract without duplicating the full reference', () => {
  const source = new URL('../plugins/ai-agent-engine-codex/skills/', import.meta.url)
  const skills = readdirSync(source, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith('ae-'))
  assert.equal(skills.length, 40)
  for (const skill of skills) {
    const file = new URL(`${skill.name}/SKILL.md`, source)
    const content = readFileSync(file, 'utf8')
    const links = [...content.matchAll(/\]\(([^)]+scale-and-distributed-engineering\.md)\)/g)]
    assert.equal(links.length, 1, skill.name)
    assert.ok(existsSync(new URL(links[0][1], file)), skill.name)
    assert.equal(content.includes('## Required Decision Record'), false, skill.name)
  }
})

test('shared fingerprinting preserves installed ownership digests while enforcing budgets', (t) => {
  const root = fixture(t)
  mkdirSync(join(root, 'sub'))
  writeFileSync(join(root, 'sub', 'a.txt'), 'payload')
  writeFileSync(join(root, 'z.txt'), 'tail')
  const legacy = createHash('sha256').update('d:.:d:sub:f:sub/a.txt:payloadf:z.txt:tail').digest('hex')
  assert.deepEqual(fingerprintManagedPath(root), { sha256: legacy, kind: 'directory' })
  assert.throws(() => fingerprintManagedPath(root, { maxEntries: 2 }), /budget exceeded/)
  assert.throws(() => fingerprintManagedPath(root, { maxFileBytes: 3 }), /byte budget/)
  assert.throws(() => fingerprintManagedPath(root, { maxTotalBytes: 8 }), /byte budget/)
  assert.throws(() => fingerprintManagedPath(root, { maxDepth: 0 }), /traversal budget/)
})
