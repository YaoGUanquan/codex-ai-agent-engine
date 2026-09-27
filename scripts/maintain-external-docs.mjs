#!/usr/bin/env node
// Explicit batch maintenance for schemaVersion 2 external document contexts.
import { closeSync, fsyncSync, lstatSync, openSync, renameSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertDirectory, command, docsLocation, hash, options, readBounded, writeExclusive } from '../plugins/ai-agent-engine-codex/scripts/bounded-documents.mjs'
import { docsMaintain, documentKind, isDocumentPage, listDocuments } from '../plugins/ai-agent-engine-codex/scripts/docs-lifecycle.mjs'

export function maintainExternalDocs(args) {
  return command('maintain-external-docs', () => {
    const opts = options(args, ['home', 'expect-plan-sha256', 'report'], ['apply', 'check'])
    if (!opts.home || !isAbsolute(opts.home)) throw new Error('--home must be the absolute registered external docs home')
    if (opts.apply && opts.check) throw new Error('--apply and --check are mutually exclusive')
    if (opts['expect-plan-sha256'] && !opts.apply) throw new Error('--expect-plan-sha256 requires --apply')
    const home = resolve(opts.home)
    assertDirectory(home)
    const plan = buildPlan(home)
    const planSha256 = hash(JSON.stringify(plan))
    if (opts.apply && opts['expect-plan-sha256'] !== planSha256) throw new Error('plan changed or --expect-plan-sha256 missing; preview the current registered contexts again')
    if (opts.apply && !opts.report) throw new Error('--apply requires --report for durable per-file recovery evidence')
    let reportPath
    if (opts.report) {
      reportPath = resolve(opts.report)
      inside(home, reportPath)
      assertDirectory(dirname(reportPath))
      try {
        lstatSync(reportPath)
        throw new Error('report already exists; choose a new evidence filename')
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    const result = {
      status: opts.check && plan.candidates.length ? 'invalid' : 'ok',
      mode: opts.apply ? 'applied' : opts.check ? 'check' : 'preview', home, planSha256,
      contexts: plan.contexts, candidates: plan.candidates, applied: [], failure: null,
      protectedLargeCount: plan.protectedLargeCount,
      notes: [
        'Only explicitly registered context docs roots are eligible; shared, legacy imports, migrations and unregistered paths are not rewritten.',
        'Formal documents, archived evidence, SQL, registry JSON and test data are preserved; protectedLargeCount covers Markdown only.',
        'Each source replacement is verified independently, not a multi-file transaction. Failed batches retain completed writes and original pages.',
        'No Git checkout, commit, push, installation, scheduling or deletion is performed.',
      ],
    }
    if (opts.apply) return applyPlan(home, plan, reportPath, result)
    if (reportPath) writeExclusive(reportPath, JSON.stringify(result, null, 2) + '\n')
    return result
  })
}

function applyPlan(home, plan, reportPath, result) {
  const reporting = { path: reportPath, journal: `${reportPath}.journal.jsonl`, complete: false }
  result.reporting = reporting
  let fd
  function record(event) {
    writeFileSync(fd, JSON.stringify(event) + '\n')
    fsyncSync(fd)
  }
  try {
    fd = openSync(reporting.journal, 'wx')
    record({ phase: 'prepared', planSha256: result.planSha256, bindings: plan.bindings })
    writeExclusive(reportPath, JSON.stringify({ ...result, status: 'in-progress', mode: 'applying' }, null, 2) + '\n')
    for (const item of plan.candidates) {
      for (const binding of plan.bindings) {
        if (hash(readBounded({ root: home }, binding.path, 1024 * 1024).bytes) !== binding.sha256) throw new Error('registry/context binding changed during maintenance')
      }
      // Persist intent before mutation; an interrupted apply can be reconciled by source hash and original pages.
      record({ phase: 'applying', candidate: item })
      result.pending = item
      try {
        const applied = docsMaintain(home, ['--docs-root', item.docsRoot, '--path', item.path, '--compact', '--apply', '--expect-sha256', item.sha256])
        if (applied.status !== 'ok' || applied.mode !== 'applied') throw new Error(applied.diagnostics?.join('; ') || 'document was not applied')
        result.applied.push({ projectId: item.projectId, contextKey: item.contextKey, ...applied })
      } catch (error) {
        result.failure = { projectId: item.projectId, contextKey: item.contextKey, path: item.path, error: error.message }
        break
      }
      record({ phase: 'applied', result: result.applied.at(-1) })
      const verify = docsMaintain(home, ['--docs-root', item.docsRoot, '--path', item.path, '--verify'])
      if (verify.status !== 'ok') {
        result.failure = { projectId: item.projectId, contextKey: item.contextKey, path: item.path, error: verify.diagnostics.join('; ') }
        break
      }
      result.applied.at(-1).verified = true
      record({ phase: 'verified', projectId: item.projectId, contextKey: item.contextKey, path: item.path })
      result.pending = null
    }
    result.status = result.failure ? 'partial' : 'ok'
    record({ phase: result.failure ? 'partial' : 'completed', appliedCount: result.applied.length, failure: result.failure })
    closeSync(fd)
    fd = undefined
    reporting.complete = true
    reporting.stagedReport = `${reportPath}.${randomUUID()}.tmp`
    writeExclusive(reporting.stagedReport, JSON.stringify(result, null, 2) + '\n')
    renameSync(reporting.stagedReport, reportPath)
  } catch (error) {
    reporting.complete = false
    reporting.error = error.message
    result.status = result.applied.length || result.pending ? 'partial' : 'invalid'
    result.diagnostics = ['Maintenance stopped; reconcile the returned applied/pending state with the durable report and journal before retrying.']
  } finally {
    if (fd !== undefined) {
      try { closeSync(fd) } catch (error) {
        reporting.complete = false
        reporting.error = [reporting.error, error.message].filter(Boolean).join('; ')
        result.status = result.applied.length || result.pending ? 'partial' : 'invalid'
      }
    }
  }
  return result
}

function buildPlan(home) {
  const bindings = []
  function json(file) {
    const path = relative(home, file).replaceAll('\\', '/')
    const bytes = readBounded({ root: home }, path, 1024 * 1024).bytes
    bindings.push({ path, sha256: hash(bytes) })
    return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''))
  }
  const registry = json(join(home, 'registry.json'))
  if (registry.schemaVersion !== 2 || !registry.projects || Array.isArray(registry.projects)) throw new Error('expected keyed schemaVersion 2 registry')
  const contexts = []
  const candidates = []
  let protectedLargeCount = 0
  const roots = new Set()
  for (const [projectId, record] of Object.entries(registry.projects).sort()) {
    if (record.projectId !== projectId) throw new Error('registry project identity mismatch')
    inside(join(home, 'projects'), record.projectRoot)
    assertDirectory(record.projectRoot)
    inside(record.projectRoot, record.manifest)
    const project = json(record.manifest)
    if (project.schemaVersion !== 2 || project.projectId !== projectId ||
        !['git-common-directory', 'workspace-directory'].includes(project.identity?.type) || !isAbsolute(project.identity.path)) throw new Error('invalid project manifest')
    for (const [contextKey, context] of Object.entries(project.contexts || {}).sort()) {
      if (context.contextKey !== contextKey || !/^[a-zA-Z0-9_-]+$/.test(contextKey) ||
          !['branch', 'workspace'].includes(context.contextType) || typeof context.contextName !== 'string' || !context.contextName) throw new Error('invalid context record')
      if ((project.identity.type === 'git-common-directory') !== (context.contextType === 'branch')) throw new Error('project/context identity type mismatch')
      inside(record.projectRoot, context.manifest)
      inside(dirname(context.manifest), context.docsRoot)
      const manifest = json(context.manifest)
      for (const [key, value] of Object.entries({ schemaVersion: 2, projectId, contextKey, contextType: context.contextType, contextName: context.contextName })) {
        if (manifest[key] !== value) throw new Error(`context manifest mismatch: ${key}`)
      }
      if (normalize(manifest.docsRoot) !== normalize(context.docsRoot)) throw new Error('context docs root mismatch')
      const location = docsLocation(home, context.docsRoot)
      const rootKey = normalize(location.docsRoot)
      if (roots.has(rootKey)) throw new Error('multiple contexts claim the same docs root')
      roots.add(rootKey)
      const summary = { projectId, contextKey, contextName: context.contextName, files: 0, candidates: 0 }
      for (const path of listDocuments(location)) {
        summary.files++
        if (isDocumentPage(path)) continue
        const kind = documentKind(path)
        if (kind === 'protected') {
          if (lstatSync(join(location.root, path)).size > 15360) protectedLargeCount++
          continue
        }
        const audit = docsMaintain(home, ['--docs-root', location.docsRoot, '--path', path, '--check'])
        if (audit.status === 'invalid' && !audit.oversizedCount) throw new Error(audit.diagnostics.join('; '))
        if (!audit.oversizedCount) continue
        const preview = docsMaintain(home, ['--docs-root', location.docsRoot, '--path', path, '--compact'])
        if (preview.status !== 'ok' || preview.mode !== 'preview') throw new Error(preview.diagnostics?.join('; ') || 'oversized document is not compactable')
        summary.candidates++
        candidates.push({ projectId, contextKey, docsRoot: location.docsRoot, path, kind, bytes: preview.source.bytes, sha256: preview.source.sha256, routerBytes: preview.replacement.bytes, pages: preview.pages, recovery: preview.recovery })
      }
      contexts.push(summary)
    }
  }
  return { bindings, contexts, candidates, protectedLargeCount }
}

function normalize(path) {
  const absolute = resolve(path)
  return process.platform === 'win32' ? absolute.toLowerCase() : absolute
}

function inside(parent, child) {
  if (!isAbsolute(child)) throw new Error('registry paths must be absolute')
  const rel = relative(normalize(parent), normalize(child))
  if (!rel || rel === '..' || rel.startsWith(`..\\`) || rel.startsWith('../') || isAbsolute(rel)) throw new Error('external context path escapes its declared boundary')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = maintainExternalDocs(process.argv.slice(2))
  console.log(JSON.stringify(result, null, 2))
  if (result.status !== 'ok') process.exitCode = 1
}
