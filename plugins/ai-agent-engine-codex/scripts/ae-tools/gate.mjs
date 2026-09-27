// Workflow gate checks and proof records.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join, relative } from 'node:path'
import { arrayOpt, assertCanonicalContained, isPlainObject, parseOptions, readBoundedText, safeResolve, timestamp, toPosix, truthy } from './utils.mjs'

export function gate(worktree, args) {
  const opts = parseOptions(args)
  const workflow = opts.workflow || 'work'
  const checkpoint = opts.checkpoint || 'final'
  const validation = arrayOpt(opts.validation)
  const gitOps = arrayOpt(opts.git)
  const blockers = []
  const warnings = []
  const evidence = parseValidationResults(worktree, opts['validation-result'])
  if (validation.length > 32 || validation.some((command) => typeof command !== 'string' || command.length > 4096)) throw new Error('at most 32 bounded validation commands are accepted')
  for (const command of validation) {
    if (!evidence.some((result) => result.command === command)) evidence.push({ command, status: 'declared', provenance: 'caller-supplied', tier: 'unverified' })
  }

  if (!['lfg', 'work'].includes(workflow)) blockers.push('workflow must be lfg or work')
  if (!['start', 'before_plan', 'before_work', 'before_review', 'final'].includes(checkpoint)) blockers.push('checkpoint is not recognized')

  if (['before_work', 'before_review', 'final'].includes(checkpoint) && opts.plan) {
    const planPath = safeResolve(worktree, opts.plan)
    if (!existsSync(planPath)) blockers.push(`plan file does not exist: ${opts.plan}`)
  } else if (['before_work', 'before_review', 'final'].includes(checkpoint) && !opts.plan) {
    warnings.push('plan path not provided')
  }

  if (['before_review', 'final'].includes(checkpoint)) {
    if (evidence.length === 0) blockers.push('validation execution results are required before review/final gate')
    if (evidence.some((result) => result.status !== 'successful')) blockers.push('validation is failed or unverified; command declarations are not execution evidence')
  }

  if (checkpoint === 'final') {
    if (!opts['review-status']) warnings.push('review status not provided')
    if (!opts['worktree-decision']) warnings.push('worktree decision not provided')
    if (gitOps.length > 0 && !opts['git-auth']) blockers.push('git operations were reported but --git-auth evidence was not provided')
  }

  const result = {
    workflow,
    checkpoint,
    status: blockers.length > 0 ? 'block' : 'pass',
    worktree,
    plan_path: opts.plan || null,
    validation_commands: validation,
    evidence,
    evidence_status: evidence.some((result) => result.status === 'failed') ? 'failed'
      : evidence.length > 0 && evidence.every((result) => result.status === 'successful') ? 'successful'
        : 'unverified',
    evidence_boundary: 'Caller-supplied execution records and local artifact hashes only; no command is executed and no higher validation tier is inferred.',
    review_status: opts['review-status'] || null,
    worktree_decision: opts['worktree-decision'] || null,
    git_operations: gitOps,
    blockers,
    warnings,
    notes: opts.notes || null,
    generated_at: new Date().toISOString(),
  }

  if (truthy(opts['write-proof'])) {
    const dir = join(worktree, 'docs', 'ae', 'gates')
    assertCanonicalContained(worktree, dir, 'gate proof')
    mkdirSync(dir, { recursive: true })
    const file = `${timestamp()}-${randomUUID()}.json`
    const proofPath = join(dir, file)
    writeFileSync(proofPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' })
    result.proof_path = toPosix(relative(worktree, proofPath))
  }

  return result
}

function parseValidationResults(worktree, input) {
  if (input === undefined) return []
  const values = Array.isArray(input) ? input : [input]
  if (values.length > 32) throw new Error('at most 32 validation results are accepted')
  const results = []
  const commands = new Set()
  for (const value of values) {
    if (typeof value !== 'string' || Buffer.byteLength(value) > 16 * 1024) throw new Error('--validation-result requires bounded JSON')
    let record
    try { record = JSON.parse(value) } catch { throw new Error('--validation-result must be a JSON object') }
    if (!isPlainObject(record) || typeof record.command !== 'string' || !record.command.trim() || record.command.length > 4096) throw new Error('validation result requires command')
    if (commands.has(record.command)) throw new Error(`duplicate validation result: ${record.command}`)
    commands.add(record.command)
    const status = record.status
    if (!['declared', 'executed', 'successful', 'failed', 'unverified'].includes(status)) throw new Error('validation result status must be declared, executed, successful, failed, or unverified')
    const result = { command: record.command, status, provenance: 'caller-supplied', tier: record.tier || 'local-command' }
    if (!['local-command', 'static', 'build', 'api', 'browser', 'deployment', 'unverified'].includes(result.tier)) throw new Error('unsupported validation tier')
    if (['executed', 'successful', 'failed'].includes(status)) {
      const started = Date.parse(record.startedAt)
      const finished = Date.parse(record.finishedAt)
      if (!Number.isFinite(started) || !Number.isFinite(finished) || finished < started || finished > Date.now() + 60000) throw new Error('execution result requires valid startedAt and finishedAt timestamps')
      if (!Number.isInteger(record.exitCode) || record.exitCode < 0 || record.exitCode > 255) throw new Error('execution result requires exitCode from 0 to 255')
      if (status === 'successful' && record.exitCode !== 0) throw new Error('successful validation requires exitCode 0')
      if (status === 'failed' && record.exitCode === 0) throw new Error('failed validation requires a nonzero exitCode')
      if (typeof record.evidence !== 'string' || !record.evidence) throw new Error('execution result requires a local evidence artifact path')
      const path = safeResolve(worktree, record.evidence)
      assertCanonicalContained(worktree, path, 'validation evidence')
      const artifact = readBoundedText(path)
      if (!artifact.text.trim()) throw new Error('validation evidence artifact is empty')
      Object.assign(result, { startedAt: record.startedAt, finishedAt: record.finishedAt, exitCode: record.exitCode, artifact: { path: record.evidence, sha256: artifact.sha256, bytes: artifact.bytes } })
      if (record.exitCode !== 0) result.status = 'failed'
    }
    results.push(result)
  }
  return results
}
