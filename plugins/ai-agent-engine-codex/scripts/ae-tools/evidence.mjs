// Evidence ledger commands and record helpers.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { gitFingerprint } from './git.mjs'
import { parseOptions, readText, redactOptions, safeName, safeResolve, stableHash } from './utils.mjs'

export function evidenceCommand(worktree, args) {
  const [subcommand = 'read', ...rest] = args
  if (subcommand === 'read') return readEvidenceLedger(worktree)
  if (subcommand === 'write') {
    const opts = parseOptions(rest)
    const kind = String(opts.kind || 'manual')
    const payload = opts.payload ? JSON.parse(String(opts.payload)) : redactOptions(opts)
    return { status: 'ok', evidence: writeEvidenceRecord(worktree, kind, payload) }
  }
  throw new Error('evidence supports: read, write')
}

export function writeEvidenceRecord(worktree, kind, payload) {
  const safeKind = safeName(kind)
  const id = `${new Date().toISOString().replace(/[-:.]/g, '').replace('Z', 'Z')}-${stableHash(payload).slice(0, 12)}`
  const relPath = `docs/ae/evidence/artifacts/${safeKind}/${id}.json`
  const target = safeResolve(worktree, relPath)
  mkdirSync(dirname(target), { recursive: true })
  const previous = readLastEvidenceEvent(worktree)
  const record = {
    schemaVersion: 1,
    id,
    evidenceKind: safeKind,
    payload,
    timestamps: {
      writtenAt: new Date().toISOString(),
    },
    git: gitFingerprint(worktree),
    hashes: {
      previousRecordHash: previous?.recordHash || null,
      payloadHash: stableHash(payload),
      recordHash: null,
    },
  }
  record.hashes.recordHash = stableHash({ ...record, hashes: { ...record.hashes, recordHash: null } })
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
  appendEvidenceEvent(worktree, {
    id,
    evidenceKind: safeKind,
    artifactPath: relPath,
    artifactHash: stableHash(readText(target)),
    recordHash: record.hashes.recordHash,
    previousRecordHash: record.hashes.previousRecordHash,
    writtenAt: record.timestamps.writtenAt,
  })
  return {
    kind: safeKind,
    id,
    path: relPath,
    recordHash: record.hashes.recordHash,
  }
}

export function readEvidenceLedger(worktree) {
  const ledgerPath = safeResolve(worktree, 'docs/ae/evidence/ledger.jsonl')
  if (!existsSync(ledgerPath)) {
    return { status: 'ok', state: 'missing', records: [], diagnostics: ['ledger.jsonl does not exist'] }
  }
  const diagnostics = []
  const records = []
  let previousRecordHash = null
  const lines = readText(ledgerPath).split(/\r?\n/).filter(Boolean)
  for (const [index, line] of lines.entries()) {
    let event
    try {
      event = JSON.parse(line)
    } catch {
      diagnostics.push(`ledger line ${index + 1} is not valid JSON`)
      continue
    }
    if (event.previousRecordHash !== previousRecordHash) diagnostics.push(`ledger chain mismatch: ${event.id}`)
    previousRecordHash = event.recordHash
    const artifactPath = safeResolve(worktree, event.artifactPath)
    if (!existsSync(artifactPath)) {
      diagnostics.push(`artifact missing: ${event.artifactPath}`)
      continue
    }
    const content = readText(artifactPath)
    if (stableHash(content) !== event.artifactHash) diagnostics.push(`artifact hash mismatch: ${event.id}`)
    const record = JSON.parse(content)
    if (record.hashes?.recordHash !== event.recordHash) diagnostics.push(`record hash mismatch: ${event.id}`)
    records.push(record)
  }
  return {
    status: 'ok',
    state: diagnostics.length > 0 ? 'unverifiable' : records.length > 0 ? 'passed' : 'missing',
    records,
    diagnostics,
  }
}

function appendEvidenceEvent(worktree, event) {
  const ledgerPath = safeResolve(worktree, 'docs/ae/evidence/ledger.jsonl')
  mkdirSync(dirname(ledgerPath), { recursive: true })
  const existing = existsSync(ledgerPath) ? readText(ledgerPath) : ''
  writeFileSync(ledgerPath, `${existing}${JSON.stringify(event)}\n`, 'utf8')
}

function readLastEvidenceEvent(worktree) {
  const ledgerPath = safeResolve(worktree, 'docs/ae/evidence/ledger.jsonl')
  if (!existsSync(ledgerPath)) return null
  const last = readText(ledgerPath).split(/\r?\n/).filter(Boolean).at(-1)
  return last ? JSON.parse(last) : null
}
