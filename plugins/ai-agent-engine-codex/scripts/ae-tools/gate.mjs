// Workflow gate checks and proof records.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { arrayOpt, parseOptions, safeResolve, timestamp, toPosix, truthy } from './utils.mjs'

export function gate(worktree, args) {
  const opts = parseOptions(args)
  const workflow = opts.workflow || 'work'
  const checkpoint = opts.checkpoint || 'final'
  const validation = arrayOpt(opts.validation)
  const gitOps = arrayOpt(opts.git)
  const blockers = []
  const warnings = []

  if (!['lfg', 'work'].includes(workflow)) blockers.push('workflow must be lfg or work')
  if (!['start', 'before_plan', 'before_work', 'before_review', 'final'].includes(checkpoint)) blockers.push('checkpoint is not recognized')

  if (['before_work', 'before_review', 'final'].includes(checkpoint) && opts.plan) {
    const planPath = safeResolve(worktree, opts.plan)
    if (!existsSync(planPath)) blockers.push(`plan file does not exist: ${opts.plan}`)
  } else if (['before_work', 'before_review', 'final'].includes(checkpoint) && !opts.plan) {
    warnings.push('plan path not provided')
  }

  if (['before_review', 'final'].includes(checkpoint) && validation.length === 0) {
    blockers.push('validation commands are required before review/final gate')
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
    mkdirSync(dir, { recursive: true })
    const file = `${timestamp()}-${workflow}-${checkpoint}.json`
    const proofPath = join(dir, file)
    writeFileSync(proofPath, JSON.stringify(result, null, 2), 'utf8')
    result.proof_path = toPosix(relative(worktree, proofPath))
  }

  return result
}
