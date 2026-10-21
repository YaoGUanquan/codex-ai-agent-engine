import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { isMain, repoRoot, walkFiles } from './files.mjs'

const retiredRoots = ['plugins', 'scripts', '.ae-source', '.agents/skills']
const staleCommand = /(?:node\s+|node\s+["'])scripts[\\/](?:ae-tools|install-project|install-global|update-ae-codex|set-ae-language)\.mjs/

function hasResidualFiles(directory) {
  if (!existsSync(directory)) return false
  // Empty directories (including nested empty trees) are not distributed runtime.
  return walkFiles(directory).length > 0
}

export function checkRepository(root = repoRoot) {
  const errors = []
  for (const directory of retiredRoots) {
    const path = resolve(root, directory)
    if (hasResidualFiles(path)) errors.push(`Retired source root still contains files: ${directory}`)
  }
  const publicDocs = [
    'README.md', 'README.en.md', 'README.zh-CN.md',
    'INSTALL.md', 'INSTALL.zh-CN.md', 'AGENTS.md', '.cursorrules', 'docs/release-checklist.md',
  ]
  for (const path of publicDocs) {
    const absolute = resolve(root, path)
    if (!existsSync(absolute)) {
      errors.push(`Missing public document: ${path}`)
      continue
    }
    const text = readFileSync(absolute, 'utf8')
    // Old names in prose and migration tables are valid; executable examples are not.
    if (staleCommand.test(text)) errors.push(`Retired executable example: ${path}`)
    for (const match of text.matchAll(/!?\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
      const target = match[1]
      if (/^(?:https?:|mailto:|#)/i.test(target)) continue
      const filePart = decodeURIComponent(target.split(/[?#]/)[0])
      if (!existsSync(resolve(absolute, '..', filePart))) errors.push(`Broken document link in ${path}: ${target}`)
    }
  }
  const docs = resolve(root, 'docs')
  if (existsSync(docs)) {
    for (const file of walkFiles(docs)) {
      if (relative(docs, file) !== 'release-checklist.md') errors.push(`Retired workflow document: ${relative(docs, file)}`)
    }
  }
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
  if (JSON.stringify(pkg.files) !== JSON.stringify(['skills/', 'LICENSE', 'NOTICE.md'])) errors.push('Package must distribute skills and license/notice, not repository tools')
  if (pkg.license !== 'GPL-2.0-only') errors.push('Repository license must remain GPL-2.0-only')
  for (const [name, command] of Object.entries(pkg.scripts)) {
    if (/\bscripts[\\/]/.test(command)) errors.push(`Retired package command: ${name}`)
  }
  return { status: errors.length ? 'failed' : 'ok', errors }
}

if (isMain(import.meta.url)) {
  try {
    const result = checkRepository()
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.errors.length ? 1 : 0
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}