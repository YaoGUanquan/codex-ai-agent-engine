// Git helpers shared by evidence, graph, and review command modules.
import { spawnSync } from 'node:child_process'
import { stableHash } from './utils.mjs'

export function gitFingerprint(worktree) {
  const head = runGitOptional(worktree, ['rev-parse', 'HEAD'])
  const branch = runGitOptional(worktree, ['branch', '--show-current'])
  const status = runGitOptional(worktree, ['status', '--porcelain'])
  return {
    available: Boolean(head),
    head: head || null,
    branch: branch || null,
    statusHash: status ? stableHash(status) : null,
    dirty: Boolean(status),
  }
}

export function runGitOptional(worktree, args) {
  const result = spawnSync('git', args, { cwd: worktree, encoding: 'utf8', stdio: 'pipe', timeout: 10000 })
  return result.status === 0 ? result.stdout.trim() : ''
}

export function runGitRequired(worktree, args, message = null) {
  const result = spawnSync('git', args, {
    cwd: worktree,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 10000,
  })
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new Error(message || output || `git ${args.join(' ')} failed with exit code ${result.status}`)
  }
  return result.stdout.trimEnd()
}

export function verifyGitRef(worktree, ref, label) {
  runGitRequired(worktree, ['rev-parse', '--verify', '--quiet', ref], `${label} ref is invalid: ${ref}`)
}
