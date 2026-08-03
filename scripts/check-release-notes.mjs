#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const targetRoot = resolve(readArg('--target') || repoRoot)
const errors = []
const packagePath = resolve(targetRoot, 'package.json')
const manifestPath = resolve(targetRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json')
const readmePaths = ['README.md', 'README.en.md']

const packageJson = readJson(packagePath, 'package.json')
const manifest = readJson(manifestPath, 'plugin manifest')
const version = packageJson?.version

if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
  errors.push(`package version must be SemVer: ${version}`)
}

if (version && manifest?.version && manifest.version !== version) {
  errors.push(`plugin manifest version must match package version: expected ${version}, got ${manifest.version}`)
}

if (version) {
  for (const readmePath of readmePaths) {
    validateReleaseNote(resolve(targetRoot, readmePath), readmePath, version)
  }
}

const result = {
  status: errors.length === 0 ? 'ok' : 'failed',
  targetRoot,
  version: version || null,
  readmes: readmePaths,
  errors,
}

if (errors.length > 0) {
  console.error(JSON.stringify(result, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(result, null, 2))

function readArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

function readJson(path, label) {
  if (!existsSync(path)) {
    errors.push(`missing ${label}: ${path}`)
    return null
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    errors.push(`invalid ${label}: ${error.message}`)
    return null
  }
}

function validateReleaseNote(path, label, version) {
  if (!existsSync(path)) {
    errors.push(`missing release notes file: ${label}`)
    return
  }

  const content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
  const heading = new RegExp(`^###\\s+${escapeRegex(version)}\\s*[（(](\\d{4}-\\d{2}-\\d{2})[）)]\\s*$`, 'm')
  const match = heading.exec(content)
  if (!match) {
    errors.push(`${label} must contain a level-three ${version} entry with an ISO date`)
    return
  }

  if (Number.isNaN(Date.parse(`${match[1]}T00:00:00Z`))) {
    errors.push(`${label} release-note date is invalid: ${match[1]}`)
    return
  }

  const entryStart = match.index + match[0].length
  const nextHeading = content.indexOf('\n### ', entryStart)
  const entry = content.slice(entryStart, nextHeading >= 0 ? nextHeading : undefined)
  if (!/^\s*-\s+\S/m.test(entry)) {
    errors.push(`${label} ${version} entry must include at least one change-summary bullet`)
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
