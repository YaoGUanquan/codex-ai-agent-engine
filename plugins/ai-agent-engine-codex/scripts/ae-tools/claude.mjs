// Claude Code delegation with availability checks and Windows shim discovery.
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { arrayOpt, clampInteger, parseOptions, readText, safeResolve, truthy } from './utils.mjs'

export function claudeDelegate(worktree, args) {
  const opts = parseOptions(args)
  const requestedCommand = opts.command || opts.claude || 'claude'
  const availability = checkCommandAvailable(requestedCommand)
  const command = availability.command || requestedCommand
  const base = {
    command,
    cwd: worktree,
    mode: opts.mode || 'patch-proposal',
    write_policy: 'codex-reviewed',
    notes: [
      'Claude output must be reviewed by Codex before applying changes.',
      'Direct writes require explicit user opt-in and an isolated worktree.',
    ],
  }

  if (truthy(opts.check)) {
    return availability.available
      ? { status: 'ok', available: true, ...base, version: availability.version }
      : { status: 'skip', available: false, ...base, reason: availability.reason }
  }

  if (!availability.available) {
    return { status: 'skip', available: false, ...base, reason: availability.reason }
  }

  const prompt = loadClaudePrompt(worktree, opts)
  const invocation = claudeDelegateInvocation(opts, prompt)
  const timeoutMs = clampInteger(Number(opts.timeout_ms || opts.timeout || 120000), 120000, 1000, 600000)
  const result = runExternalCommand(command, invocation.args, {
    cwd: worktree,
    input: invocation.input,
    encoding: 'utf8',
    timeout: timeoutMs,
  })
  const stdout = result.stdout || ''
  const stderr = result.stderr || ''

  const response = {
    status: result.status === 0 ? 'ok' : 'failed',
    available: true,
    ...base,
    version: availability.version,
    args: invocation.args,
    timeout_ms: timeoutMs,
    exit_code: result.status,
    signal: result.signal,
    stdout,
    stderr,
  }
  if (result.status === 0 && !stdout.trim() && !stderr.trim()) {
    response.diagnostics = [
      'Claude exited successfully but produced no output on stdout or stderr.',
      'Retry with a narrower prompt, explicit --claude-arg values, --add-dir for external repositories, and read-only --tools such as "Read,Grep,Glob".',
    ]
  }
  return response
}

function checkCommandAvailable(command) {
  const result = runExternalCommand(command, ['--version'], {
    encoding: 'utf8',
    timeout: 10000,
  })
  if (result.error?.code === 'ENOENT') {
    const windowsShim = resolveWindowsPathCommand(command)
    if (windowsShim) {
      const shimResult = runExternalCommand(windowsShim, ['--version'], {
        encoding: 'utf8',
        timeout: 10000,
      })
      if (!shimResult.error && shimResult.status === 0) {
        return {
          available: true,
          command: windowsShim,
          version: [shimResult.stdout, shimResult.stderr].filter(Boolean).join('\n').trim() || null,
        }
      }
    }
  }
  if (result.error) {
    return {
      available: false,
      reason: result.error.code === 'ENOENT'
        ? `${command} was not found on PATH`
        : result.error.message,
    }
  }
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    return {
      available: false,
      reason: output || `${command} --version exited with ${result.status}`,
    }
  }
  return {
    available: true,
    command,
    version: [result.stdout, result.stderr].filter(Boolean).join('\n').trim() || null,
  }
}

function resolveWindowsPathCommand(command) {
  if (process.platform !== 'win32') return null
  if (command.includes('\\') || command.includes('/') || extname(command)) return null
  const pathDirs = String(process.env.PATH || '').split(';').filter(Boolean)
  const pathExts = String(process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean)
  for (const dir of pathDirs) {
    for (const ext of ['.cmd', '.bat']) {
      if (!pathExts.includes(ext)) continue
      const candidate = join(dir, `${command}${ext}`)
      if (existsSync(candidate)) return `${command}${ext}`
    }
  }
  return null
}

function runExternalCommand(command, args, options = {}) {
  const isWindowsScript = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)
  if (!isWindowsScript) {
    return spawnSync(command, args, {
      ...options,
      stdio: 'pipe',
    })
  }
  return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command, ...args], {
    ...options,
    stdio: 'pipe',
    windowsVerbatimArguments: false,
  })
}

function loadClaudePrompt(worktree, opts) {
  if (opts['prompt-file']) return readText(safeResolve(worktree, opts['prompt-file']))
  if (opts.prompt) return String(opts.prompt)
  throw new Error('claude-delegate requires --check, --prompt, or --prompt-file')
}

function claudeDelegateInvocation(opts, prompt) {
  const configured = arrayOpt(opts['claude-arg'])
  if (configured.length > 0) return { args: configured, input: prompt }
  return {
    args: [
      '-p',
      '--output-format', 'json',
      '--no-session-persistence',
      '--permission-mode', 'plan',
      '--tools', 'Read,Grep,Glob',
      '--allowed-tools', 'Read,Grep,Glob',
      '--disable-slash-commands',
    ],
    input: prompt,
  }
}
