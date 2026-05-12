#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const sourceRoot = resolve(repoRoot, 'plugins', 'ai-agent-engine-codex', 'skills')
const mirrorRoot = resolve(repoRoot, '.agents', 'skills')

const sourceFiles = listFiles(sourceRoot)
const mirrorFiles = listFiles(mirrorRoot)

const missingInMirror = sourceFiles.filter((file) => !mirrorFiles.includes(file))
const extraInMirror = mirrorFiles.filter((file) => !sourceFiles.includes(file))
const mismatched = []

for (const relPath of sourceFiles) {
  if (!mirrorFiles.includes(relPath)) continue
  const sourceContent = normalize(readFileSync(resolve(sourceRoot, relPath), 'utf8'))
  const mirrorContent = normalize(readFileSync(resolve(mirrorRoot, relPath), 'utf8'))
  if (sourceContent !== mirrorContent) mismatched.push(relPath)
}

if (missingInMirror.length === 0 && extraInMirror.length === 0 && mismatched.length === 0) {
  console.log(JSON.stringify({
    status: 'ok',
    sourceRoot: relative(repoRoot, sourceRoot),
    mirrorRoot: relative(repoRoot, mirrorRoot),
    fileCount: sourceFiles.length,
  }, null, 2))
  process.exit(0)
}

console.error(JSON.stringify({
  status: 'mismatch',
  sourceRoot: relative(repoRoot, sourceRoot),
  mirrorRoot: relative(repoRoot, mirrorRoot),
  missingInMirror,
  extraInMirror,
  mismatched,
}, null, 2))
process.exit(1)

function listFiles(root) {
  return walk(root).map((file) => relative(root, file).replace(/\\/g, '/')).sort()
}

function walk(root) {
  const results = []
  for (const entry of readdirSync(root)) {
    const full = resolve(root, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...walk(full))
      continue
    }
    results.push(full)
  }
  return results
}

function normalize(content) {
  return content.replace(/\r\n/g, '\n')
}
