// tidy command: classify lingering process notes and expired evidence, optionally archive them.
// Retention policy contract lives in docs/00-process/templates/archive-rules.md.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { clampInteger, listFiles, parseOptions, readText, toPosix, truthy } from './utils.mjs'

export function tidy(worktree, args) {
  const opts = parseOptions(args)
  const apply = truthy(opts.apply)
  const archiveStale = truthy(opts['archive-stale'])
  const staleDays = clampInteger(Number(opts['stale-days'] ?? 30), 30, 1, 3650)
  const retentionMonths = clampInteger(Number(opts['retention-months'] ?? 3), 3, 1, 120)
  const memoryBudgetKb = clampInteger(Number(opts['memory-budget-kb'] ?? 15), 15, 1, 10240)
  const now = new Date()
  const staleCutoffMs = now.getTime() - staleDays * 24 * 60 * 60 * 1000
  const retentionCutoff = new Date(now.getFullYear(), now.getMonth() - retentionMonths, now.getDate())

  const processNotes = classifyProcessNotes(worktree, staleCutoffMs)
  const expiredEvidence = collectExpiredEvidence(worktree, retentionCutoff)
  const memoryBudget = reportMemoryBudget(worktree, memoryBudgetKb)

  const applied = { archivedTasks: [], removedEmptyDirs: [], movedEvidence: [], ledgerRewrites: 0 }
  if (apply) {
    for (const note of processNotes) {
      if (note.state === 'done' || (archiveStale && note.state === 'stale')) {
        const sourceAbs = join(worktree, note.path)
        const targetAbs = join(worktree, note.archiveTarget)
        if (existsSync(targetAbs)) {
          note.action = 'merged'
          note.merge = mergeDirectoryIntoArchive(sourceAbs, targetAbs)
          applied.archivedTasks.push(note.task)
          continue
        }
        mkdirSync(dirname(targetAbs), { recursive: true })
        renameSync(sourceAbs, targetAbs)
        note.action = 'archived'
        applied.archivedTasks.push(note.task)
      } else if (note.state === 'empty') {
        rmSync(join(worktree, note.path), { recursive: true, force: true })
        note.action = 'removed'
        applied.removedEmptyDirs.push(note.task)
      }
    }
    const moves = []
    for (const item of expiredEvidence) {
      const targetAbs = join(worktree, item.archiveTarget)
      if (existsSync(targetAbs)) {
        item.action = 'skipped-target-exists'
        continue
      }
      mkdirSync(dirname(targetAbs), { recursive: true })
      renameSync(join(worktree, item.path), targetAbs)
      item.action = 'moved'
      moves.push([item.path, item.archiveTarget])
      applied.movedEvidence.push(item.path)
    }
    applied.ledgerRewrites = rewriteLedgerPaths(worktree, moves)
  }

  return {
    status: apply ? 'applied' : 'dry-run',
    worktree,
    staleDays,
    retentionMonths,
    archiveStale,
    processNotes,
    expiredEvidence,
    memoryBudget,
    ...(apply ? { applied } : {}),
    notes: [
      'Default mode is dry-run; pass --apply to execute.',
      'Stale notes are archived only with --archive-stale; archived-pointer directories are always kept.',
      'Existing archive targets are merged file by file: missing files move, identical files deduplicate, conflicting files arrive with a .from-active-<date> suffix.',
      'Evidence retention follows docs/00-process/templates/archive-rules.md; ledger references are rewritten when artifacts move.',
      'The memory budget is report-only; distill or split oversized files by hand.',
    ],
  }
}

// Lossless merge for archive targets that already exist: nothing in the archive
// is overwritten, and conflicting active files keep their content under a dated name.
function mergeDirectoryIntoArchive(sourceAbs, targetAbs) {
  const moved = []
  const deduplicated = []
  const renamed = []
  for (const file of listFiles(sourceAbs)) {
    const fromAbs = join(sourceAbs, file)
    const toAbs = join(targetAbs, file)
    if (!existsSync(toAbs)) {
      mkdirSync(dirname(toAbs), { recursive: true })
      renameSync(fromAbs, toAbs)
      moved.push(toPosix(file))
      continue
    }
    if (readFileSync(fromAbs).equals(readFileSync(toAbs))) {
      rmSync(fromAbs)
      deduplicated.push(toPosix(file))
      continue
    }
    const suffixedAbs = suffixedArchivePath(toAbs)
    renameSync(fromAbs, suffixedAbs)
    renamed.push(toPosix(join(dirname(file), basename(suffixedAbs))))
  }
  rmSync(sourceAbs, { recursive: true, force: true })
  return { moved, deduplicated, renamed }
}

function suffixedArchivePath(toAbs) {
  const dir = dirname(toAbs)
  const name = basename(toAbs)
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  let candidate = join(dir, `${stem}.from-active-${stamp}${ext}`)
  for (let counter = 2; existsSync(candidate); counter++) {
    candidate = join(dir, `${stem}.from-active-${stamp}-${counter}${ext}`)
  }
  return candidate
}

function reportMemoryBudget(worktree, budgetKb) {
  const memoryRoot = join(worktree, 'docs', '08-ai-memory')
  const oversized = []
  if (existsSync(memoryRoot)) {
    for (const entry of readdirSync(memoryRoot, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue
      const size = statSync(join(memoryRoot, entry.name)).size
      if (size > budgetKb * 1024) {
        oversized.push({ path: toPosix(join('docs', '08-ai-memory', entry.name)), kb: Math.round(size / 102.4) / 10 })
      }
    }
  }
  return {
    budgetKb,
    oversized: oversized.sort((left, right) => right.kb - left.kb),
    rule: 'Report-only. Distill or split oversized memory files per the size budget in the memory maintenance rules.',
  }
}

function classifyProcessNotes(worktree, staleCutoffMs) {
  const activeRoot = join(worktree, 'docs', '00-process', 'active')
  if (!existsSync(activeRoot)) return []
  const notes = []
  for (const entry of readdirSync(activeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const task = entry.name
    const dirAbs = join(activeRoot, task)
    const files = listFiles(dirAbs)
    const relPath = toPosix(join('docs', '00-process', 'active', task))
    if (files.length === 0) {
      notes.push({ task, path: relPath, state: 'empty', lastModified: null, action: 'remove-on-apply', archiveTarget: null })
      continue
    }
    let newestMs = 0
    let markdown = ''
    for (const file of files) {
      const fileAbs = join(dirAbs, file)
      const st = statSync(fileAbs)
      if (st.mtimeMs > newestMs) newestMs = st.mtimeMs
      if (file.toLowerCase().endsWith('.md')) markdown += `\n${readText(fileAbs)}`
    }
    // Strip emphasis/backticks so `**状态：** archived` and `状态：\`done\`` classify the same way.
    const plain = markdown.replace(/[*`]/g, '')
    const lastModified = new Date(newestMs).toISOString()
    const monthKey = lastModified.slice(0, 7)
    let state = 'active'
    if (/(状态|status)\s*[:：]\s*archived/i.test(plain)) state = 'archived-pointer'
    else if (/(状态|status)\s*[:：]\s*(done|completed)/i.test(plain)) state = 'done'
    else if (newestMs < staleCutoffMs) state = 'stale'
    const archivable = state === 'done' || state === 'stale'
    notes.push({
      task,
      path: relPath,
      state,
      lastModified,
      action: state === 'done'
        ? 'archive-on-apply'
        : state === 'stale'
          ? 'archive-only-with-archive-stale'
          : 'keep',
      archiveTarget: archivable ? toPosix(join('docs', '00-process', 'archive', monthKey, task)) : null,
    })
  }
  return notes.sort((a, b) => a.task.localeCompare(b.task))
}

function collectExpiredEvidence(worktree, retentionCutoff) {
  const roots = ['docs/ae/gates', 'docs/ae/evidence/artifacts']
  const expired = []
  for (const rootRel of roots) {
    const rootAbs = join(worktree, rootRel)
    for (const file of listFiles(rootAbs)) {
      const fileAbs = join(rootAbs, file)
      const detected = detectEvidenceDate(basename(file), fileAbs)
      if (detected >= retentionCutoff) continue
      const monthKey = `${detected.getFullYear()}-${String(detected.getMonth() + 1).padStart(2, '0')}`
      const relPath = toPosix(join(rootRel, file))
      const dirUnderAe = toPosix(dirname(relPath.replace(/^docs\/ae\//, '')))
      expired.push({
        path: relPath,
        detectedDate: detected.toISOString().slice(0, 10),
        archiveTarget: `docs/ae/archive/${dirUnderAe}/${monthKey}/${basename(file)}`,
        action: 'move-on-apply',
      })
    }
  }
  return expired.sort((a, b) => a.path.localeCompare(b.path))
}

function detectEvidenceDate(name, fileAbs) {
  const match = /^(\d{4})(\d{2})(\d{2})T/.exec(name)
  if (match) {
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return statSync(fileAbs).mtime
}

function rewriteLedgerPaths(worktree, moves) {
  if (moves.length === 0) return 0
  const ledgerAbs = join(worktree, 'docs', 'ae', 'evidence', 'ledger.jsonl')
  if (!existsSync(ledgerAbs)) return 0
  let text = readText(ledgerAbs)
  let rewrites = 0
  for (const [fromRel, toRel] of moves) {
    if (!text.includes(fromRel)) continue
    text = text.split(fromRel).join(toRel)
    rewrites++
  }
  if (rewrites > 0) writeFileSync(ledgerAbs, text, 'utf8')
  return rewrites
}
