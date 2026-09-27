// Workspace artifact recovery scan.
import { existsSync, lstatSync } from 'node:fs'
import { join, relative } from 'node:path'
import { docsLocation, options } from '../bounded-documents.mjs'
import { documentKind, isDocumentPage } from '../docs-lifecycle.mjs'
import { assertCanonicalContained, boundedInteger, scanFiles, scanOptions, toPosix } from './utils.mjs'

export function recovery(worktree, args = []) {
  const opts = options(args, ['docs-root', 'type', 'limit', 'file-limit', 'entry-limit', 'max-depth', 'max-file-bytes', 'max-total-bytes', 'max-errors', 'max-ms'], [])
  const limit = boundedInteger(opts.limit, 100, '--limit', 1, 10000)
  const budgets = scanOptions({ ...opts, limit: undefined }, { maxFiles: 1000 })
  const scans = []
  const started = Date.now()
  const explicitRoot = opts['docs-root'] !== undefined
  const localDocs = join(worktree, 'docs')
  const docsRoot = explicitRoot || lstatSync(localDocs, { throwIfNoEntry: false })
    ? docsLocation(worktree, opts['docs-root']).docsRoot
    : localDocs
  const docsAe = join(docsRoot, 'ae')
  const docsProcess = join(docsRoot, '00-process')
  const result = {
    worktree,
    docsRoot,
    pathBase: explicitRoot ? 'docs-root' : 'worktree',
    contextVerified: false,
    scope: { artifactType: opts.type || 'all', documentPages: 'excluded', navigation: 'excluded' },
    exists: existsSync(docsAe) || existsSync(docsProcess),
    candidates: [],
    recommendation: 'no_artifacts_found',
    limitations: [
      'One docs root only; explicit location does not verify project/branch identity. Resolve the registered context before calling.',
      'Metadata-only recovery candidates; navigation and immutable pages are not resumable tasks. Use owner-aware memory/docs search for paged content.',
    ],
  }
  const specs = [
    ['requirements', join(docsAe, 'prds'), /\.md$/],
    ['requirements', join(docsAe, 'brainstorms'), /requirements\.md$/],
    ['plan', join(docsAe, 'plans'), /plan\.md$/],
    ['review', join(docsAe, 'reviews'), /.*/],
    ['gate', join(docsAe, 'gates'), /\.json$/],
    ['handoff', join(docsAe, 'handoffs'), /\.md$/],
    ['process-note', join(docsProcess, 'active'), /\.md$/],
  ]
  if (opts.type && !specs.some(([type]) => type === opts.type)) throw new Error('--type must be requirements, plan, review, gate, handoff, or process-note')
  for (const [type, dir, pattern] of specs) {
    if (opts.type && type !== opts.type) continue
    if (!existsSync(dir)) continue
    assertCanonicalContained(docsRoot, dir, 'recovery root')
    const consumed = scans.reduce((sum, item) => ({
      entries: sum.entries + item.diagnostics.entriesVisited,
      bytes: sum.bytes + item.diagnostics.bytesSelected,
      errors: sum.errors + (item.diagnostics.errorCount || 0),
    }), { entries: 0, bytes: 0, errors: 0 })
    if (result.candidates.length >= budgets.maxFiles || consumed.entries >= budgets.maxEntries || consumed.bytes >= budgets.maxTotalBytes || consumed.errors >= budgets.maxErrors || Date.now() - started >= budgets.maxMs) {
      scans.push({ completeness: { complete: false, reasons: ['aggregate-budget'] }, diagnostics: { entriesVisited: 0, bytesSelected: 0 } })
      break
    }
    const scan = scanFiles(dir, {
      ...budgets,
      maxFiles: budgets.maxFiles - result.candidates.length,
      maxEntries: budgets.maxEntries - consumed.entries,
      maxTotalBytes: budgets.maxTotalBytes - consumed.bytes,
      maxErrors: budgets.maxErrors - consumed.errors,
      maxMs: Math.max(1, budgets.maxMs - (Date.now() - started)),
      include: (name) => pattern.test(name),
      excludeFile: (name, path) => isDocumentPage(name) || documentKind(toPosix(relative(docsRoot, join(dir, path)))) === 'router',
    })
    scans.push(scan)
    for (const file of scan.files) {
      result.candidates.push({ type, path: toPosix(relative(explicitRoot ? docsRoot : worktree, file.path)), docsPath: toPosix(relative(docsRoot, file.path)), mtime: new Date(file.mtimeMs).toISOString(), size: file.sizeBytes })
    }
  }
  result.candidates.sort((a, b) => b.mtime.localeCompare(a.mtime) || a.path.localeCompare(b.path))
  const observed = result.candidates.length
  result.candidates = result.candidates.slice(0, limit)
  result.completeness = { complete: scans.every((scan) => scan.completeness.complete) && observed <= limit, reasons: [...new Set(scans.flatMap((scan) => scan.completeness.reasons).concat(observed > limit ? ['result-limit'] : []))] }
  result.limits = { ...budgets, returned: result.candidates.length, observed, limit }
  result.diagnostics = scans.map((scan) => scan.diagnostics)
  result.latestScope = result.completeness.complete ? 'all eligible artifacts in the selected docs root and type' : 'observed subset only; narrow scope or raise budgets before claiming the global latest'
  if (!result.completeness.complete && result.candidates.length === 0) result.recommendation = 'incomplete_scan_requires_scope_review'
  if (result.candidates.length > 0) {
    const latest = result.candidates[0]
    result.recommendation = latest.type === 'process-note'
      ? 'resume_with_process_note'
      : latest.type === 'plan'
      ? 'resume_with_ae-work_or_review_plan'
      : latest.type === 'requirements'
        ? 'resume_with_ae-plan'
        : latest.type === 'gate'
          ? 'inspect_gate_then_continue_or_close'
          : 'inspect_latest_artifact'
    result.latest = latest
  }
  return result
}
