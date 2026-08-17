// Evidence ledger commands and record helpers.
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
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
  const id = `${new Date().toISOString().replace(/[-:.]/g, '').replace('Z', 'Z')}-${stableHash(payload).slice(0, 12)}-${randomUUID()}`
  const relPath = `docs/ae/evidence/artifacts/${safeKind}/${id}.json`
  const target = safeResolve(worktree, relPath)
  return withEvidenceLock(worktree, () => {
    mkdirSync(dirname(target), { recursive: true })
    const previous = readLastEvidenceEvent(worktree)
    const record = {
      schemaVersion: 1,
      id,
      evidenceKind: safeKind,
      payload,
      timestamps: { writtenAt: new Date().toISOString() },
      git: gitFingerprint(worktree),
      hashes: { previousRecordHash: previous?.recordHash || null, payloadHash: stableHash(payload), recordHash: null },
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
    return { kind: safeKind, id, path: relPath, recordHash: record.hashes.recordHash }
  })
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
  const temp = `${ledgerPath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(temp, `${existing}${JSON.stringify(event)}\n`, 'utf8')
  const descriptor = openSync(temp, 'r+')
  try { fsyncSync(descriptor) } finally { closeSync(descriptor) }
  renameSync(temp, ledgerPath)
}

function withEvidenceLock(worktree, action) {
  const lockPath = safeResolve(worktree, 'docs/ae/evidence/ledger.lock')
  mkdirSync(dirname(lockPath), { recursive: true })
  const deadline = Date.now() + 5_000
  while (true) {
    try {
      const descriptor = openSync(lockPath, 'wx')
      closeSync(descriptor)
      break
    } catch (error) {
      if (error?.code !== 'EEXIST' || Date.now() >= deadline) throw new Error('evidence ledger is busy; retry after the active writer finishes')
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
    }
  }
  try { return action() } finally { rmSync(lockPath, { force: true }) }
}

function readLastEvidenceEvent(worktree) {
  const ledgerPath = safeResolve(worktree, 'docs/ae/evidence/ledger.jsonl')
  if (!existsSync(ledgerPath)) return null
  const last = readText(ledgerPath).split(/\r?\n/).filter(Boolean).at(-1)
  return last ? JSON.parse(last) : null
}
