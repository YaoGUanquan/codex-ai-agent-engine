#!/usr/bin/env node
/**
 * Fail the public repo if tracked private docs leak back in, or if file
 * contents look like personal machine paths.
 *
 * Generic rules only (no real names/projects). Extra private keywords can live
 * in a gitignored local file: .ae-public-content.local.patterns (one regex per line).
 *
 * Usage:
 *   node scripts/check-public-content.mjs [--root <dir>] [--json]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const scriptPath = fileURLToPath(import.meta.url)
const defaultRoot = resolve(scriptPath, '..', '..')
const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const rootArg = readArg('--root')
const targetRoot = resolve(rootArg || defaultRoot)

const PRIVATE_DIR_PREFIXES = [
  'docs/00-process/',
  'docs/08-ai-memory/',
  'docs/99-archive/',
  'docs/ai-memory/',
  'docs/superpowers/',
  'docs/external-samples/',
]

const PRIVATE_FILE_NAMES = [
  'docs/codex-port-analysis.md',
]

function isPrivateTrackedPath(posixPath) {
  const path = posixPath.replace(/\\/g, '/')
  if (PRIVATE_FILE_NAMES.includes(path)) return true
  for (const prefix of PRIVATE_DIR_PREFIXES) {
    if (path === prefix.slice(0, -1) || path.startsWith(prefix)) return true
  }
  if (path === 'docs/ae' || path.startsWith('docs/ae/')) {
    if (path.startsWith('docs/ae/templates/') || path === 'docs/ae/templates') return false
    if (path.startsWith('docs/ae/references/') || path === 'docs/ae/references') return false
    return true
  }
  return false
}

const drive = String.raw`[A-Za-z]:[\\/]+`
const pathTailClass = String.raw`[^\s"'` + '`' + String.raw`)\]}{,;:]+`
const contentRules = [
  {
    id: 'unix-home',
    re: /(?:^|[^A-Za-z0-9_])\/Users\/(?!<|[A-Z]{2,}_)([A-Za-z0-9._-]+)\b/g,
    allowMatch: (m) => isPlaceholderSegment(m[1]),
  },
  {
    id: 'windows-users',
    re: new RegExp(
      String.raw`(?:^|[^A-Za-z0-9_])` + drive + String.raw`Users[\\/]+(?!<|[A-Z]{2,}_)([A-Za-z0-9._-]+)\b`,
      'gi',
    ),
    allowMatch: (m) => isPlaceholderSegment(m[1]) || /^(Public|Default|Default User|All Users)$/i.test(m[1]),
  },
  {
    id: 'windows-personal-root',
    re: new RegExp(
      String.raw`(?:^|[^A-Za-z0-9_])` + drive + String.raw`(codes|Downloads|AE-Docs|claudeCode)[\\/]+(` + pathTailClass + ')',
      'gi',
    ),
    allowMatch: (m) => {
      const rest = m[2] || ''
      const first = rest.split(/[\\/]/)[0] || ''
      return isPlaceholderSegment(first) || isTempSegment(first)
    },
  },
]

const PLACEHOLDER_SEGMENTS = new Set([
  'your-project',
  'your_project',
  'yourproject',
  'example',
  'examples',
  'placeholder',
  'sample',
  'demo',
  'tmp',
  'temp',
  'user',
  'username',
  'name',
])

function isPlaceholderSegment(seg) {
  if (!seg) return true
  const s = seg.replace(/^<|>$/g, '')
  if (PLACEHOLDER_SEGMENTS.has(s.toLowerCase())) return true
  if (/^your[-_]?/i.test(s)) return true
  if (/^<.*>$/.test(seg)) return true
  if (/^[A-Z][A-Z0-9_]+$/.test(s) && s.includes('_')) return true
  return false
}

function isTempSegment(seg) {
  return /^(temp|tmp)$/i.test(seg)
}

const SKIP_DIR_NAMES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.ae',
  '.opencode',
])

const TEXT_EXT = new Set([
  '.md', '.mjs', '.js', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.yml', '.yaml',
  '.toml', '.txt', '.sh', '.ps1', '.cmd', '.bat', '.css', '.html', '.svg',
  '.gitignore', '.gitattributes', '.cursorrules', '.npmrc', '.editorconfig',
])

const errors = []
const scannedFiles = []

ensureInside(targetRoot)
scanPrivatePaths()
scanFileContents()
loadLocalExtraPatterns()

const result = {
  status: errors.length > 0 ? 'failed' : 'ok',
  targetRoot,
  filesScanned: scannedFiles.length,
  errorCount: errors.length,
  errors,
}

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2))
} else if (errors.length > 0) {
  for (const err of errors) {
    const loc = err.line != null ? `:${err.line}` : ''
    console.error(`${err.file || '<repo>'}${loc}: ${err.message}`)
  }
  console.error(`check-public-content: ${errors.length} issue(s)`)
} else {
  console.log(`check-public-content: ok (${scannedFiles.length} files)`)
}

process.exit(errors.length > 0 ? 1 : 0)

function readArg(flag) {
  const i = args.indexOf(flag)
  if (i === -1) return null
  return args[i + 1] || null
}

function ensureInside(root) {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    errors.push({ file: null, line: null, rule: 'root', message: `root is not a directory: ${root}` })
  }
}

function toPosix(p) {
  return p.split(sep).join('/')
}

function scanPrivatePaths() {
  const tracked = listTrackedOrWalkedFiles()
  for (const rel of tracked) {
    const posix = toPosix(rel)
    if (isPrivateTrackedPath(posix)) {
      errors.push({
        file: posix,
        line: null,
        rule: 'private-path',
        message: `private docs path must not be tracked in the public repo: ${posix}`,
      })
    }
  }
}

function listTrackedOrWalkedFiles() {
  const gitDir = join(targetRoot, '.git')
  if (existsSync(gitDir)) {
    const out = spawnSync('git', ['-C', targetRoot, 'ls-files', '-z'], {
      encoding: 'buffer',
      maxBuffer: 32 * 1024 * 1024,
    })
    if (out.status === 0) {
      return Buffer.from(out.stdout).toString('utf8').split('\0').filter(Boolean)
    }
  }
  return walkFiles(targetRoot).map((abs) => toPosix(relative(targetRoot, abs)))
}

function scanFileContents() {
  const files = listTrackedOrWalkedFiles()
  for (const rel of files) {
    const posix = toPosix(rel)
    if (shouldSkipContentScan(posix)) continue
    const abs = resolve(targetRoot, rel)
    if (!existsSync(abs) || !statSync(abs).isFile()) continue
    if (!looksText(posix, abs)) continue
    let text
    try {
      text = readFileSync(abs, 'utf8')
    } catch {
      continue
    }
    scannedFiles.push(posix)
    if (isAllowlistedPath(posix)) continue
    for (const rule of contentRules) {
      rule.re.lastIndex = 0
      let match
      while ((match = rule.re.exec(text)) !== null) {
        if (rule.allowMatch && rule.allowMatch(match)) continue
        const line = lineNumberAt(text, match.index)
        errors.push({
          file: posix,
          line,
          rule: rule.id,
          message: `personal path pattern (${rule.id}): ${truncate(match[0].trim())}`,
        })
      }
    }
  }
}

function loadLocalExtraPatterns() {
  const localPath = join(targetRoot, '.ae-public-content.local.patterns')
  if (!existsSync(localPath)) return
  const lines = readFileSync(localPath, 'utf8').split(/\r?\n/)
  const files = listTrackedOrWalkedFiles().filter(
    (rel) => !shouldSkipContentScan(toPosix(rel)) && !isAllowlistedPath(toPosix(rel)),
  )
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    let re
    try {
      re = new RegExp(trimmed, 'gi')
    } catch (err) {
      errors.push({
        file: '.ae-public-content.local.patterns',
        line: null,
        rule: 'local-pattern',
        message: `invalid regex: ${err.message}`,
      })
      continue
    }
    for (const rel of files) {
      const posix = toPosix(rel)
      const abs = resolve(targetRoot, rel)
      if (!existsSync(abs) || !statSync(abs).isFile() || !looksText(posix, abs)) continue
      let text
      try {
        text = readFileSync(abs, 'utf8')
      } catch {
        continue
      }
      re.lastIndex = 0
      let match
      while ((match = re.exec(text)) !== null) {
        errors.push({
          file: posix,
          line: lineNumberAt(text, match.index),
          rule: 'local-pattern',
          message: `local pattern hit: ${truncate(match[0].trim())}`,
        })
      }
    }
  }
}

function shouldSkipContentScan(posix) {
  return posix.startsWith('node_modules/') || posix.startsWith('.git/')
}

function isAllowlistedPath(posix) {
  return posix.startsWith('tests/')
}

function looksText(posix, abs) {
  const base = posix.split('/').pop() || ''
  if (base === 'AGENTS.md' || base === '.cursorrules' || base === 'LICENSE' || base === 'NOTICE.md') return true
  if (base.startsWith('.') && TEXT_EXT.has(base)) return true
  const dot = base.lastIndexOf('.')
  if (dot === -1) {
    try {
      return statSync(abs).size <= 256 * 1024
    } catch {
      return false
    }
  }
  const ext = base.slice(dot).toLowerCase()
  if (!TEXT_EXT.has(ext)) return false
  try {
    return statSync(abs).size <= 2 * 1024 * 1024
  } catch {
    return false
  }
}

function walkFiles(dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(abs))
    else if (entry.isFile()) out.push(abs)
  }
  return out
}

function lineNumberAt(text, index) {
  let line = 1
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) line++
  }
  return line
}

function truncate(s) {
  return s.length > 80 ? `${s.slice(0, 77)}...` : s
}
