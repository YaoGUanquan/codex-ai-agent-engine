// Workspace artifact recovery scan.
import { existsSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { listFiles, toPosix } from './utils.mjs'

export function recovery(worktree) {
  const docsAe = join(worktree, 'docs', 'ae')
  const docsProcess = join(worktree, 'docs', '00-process')
  const result = {
    worktree,
    exists: existsSync(docsAe) || existsSync(docsProcess),
    candidates: [],
    recommendation: 'no_artifacts_found',
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
  for (const [type, dir, pattern] of specs) {
    for (const file of listFiles(dir).filter((f) => pattern.test(f))) {
      const full = join(dir, file)
      const st = statSync(full)
      result.candidates.push({ type, path: toPosix(relative(worktree, full)), mtime: st.mtime.toISOString(), size: st.size })
    }
  }
  result.candidates.sort((a, b) => b.mtime.localeCompare(a.mtime))
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
