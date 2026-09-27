import { closeSync, existsSync, openSync, rmSync, writeFileSync } from 'node:fs'
import { hostname } from 'node:os'
import { randomUUID } from 'node:crypto'
import { readBoundedText } from './ae-tools/utils.mjs'

// Local exclusive-create coordination only. Expiry never authorizes lock stealing.
export function withLocalOperationLock(path, action, { owner, timeoutMs = 5000, leaseMs = 60000 } = {}) {
  const started = Date.now()
  const token = randomUUID()
  const metadata = {
    schemaVersion: 1,
    owner: owner || 'ae-local-operation',
    host: hostname(),
    pid: process.pid,
    token,
    createdAt: new Date(started).toISOString(),
    expiresAt: new Date(started + leaseMs).toISOString(),
    leaseMs,
    scope: 'local-cooperative-writers-only',
  }
  const waitCell = new Int32Array(new SharedArrayBuffer(4))
  while (true) {
    let fd
    try {
      fd = openSync(path, 'wx')
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      let current
      try { current = JSON.parse(readBoundedText(path, 16 * 1024).text) } catch { current = null }
      const expired = current?.expiresAt && Date.parse(current.expiresAt) < Date.now()
      if (expired || Date.now() - started >= timeoutMs) {
        throw new Error(`${owner || 'operation'} is busy${expired ? ' (expired lease)' : ''}; lock owner=${current?.owner || 'unknown'}, pid=${current?.pid || 'unknown'}, createdAt=${current?.createdAt || 'unknown'}, expiresAt=${current?.expiresAt || 'unknown'}; verify the owner has stopped before manual recovery; lock was not removed`)
      }
      Atomics.wait(waitCell, 0, 0, Math.min(50, Math.max(1, timeoutMs - (Date.now() - started))))
      continue
    }
    try {
      writeFileSync(fd, `${JSON.stringify(metadata)}\n`, 'utf8')
    } catch (error) {
      closeSync(fd)
      rmSync(path, { force: true })
      throw error
    }
    closeSync(fd)
    break
  }
  try {
    return action(metadata)
  } finally {
    if (existsSync(path)) {
      const current = JSON.parse(readBoundedText(path, 16 * 1024).text)
      if (current.token !== token) throw new Error('operation lock ownership changed; replacement lock preserved')
      rmSync(path)
    }
  }
}
