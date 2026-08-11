#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const targetRoot = resolve(readArg('--target') || repoRoot)
const errors = []
const packagePath = resolve(targetRoot, 'package.json')
const manifestPath = resolve(targetRoot, 'plugins', 'ai-agent-engine-codex', '.codex-plugin', 'plugin.json')
// Each README keeps only a recent window of release notes and links to its
// changelog, which holds the complete history including the current version.
const releaseNotePairs = [
  { readme: 'README.md', changelog: 'CHANGELOG.md' },
  { readme: 'README.en.md', changelog: 'CHANGELOG.en.md' },
]
const MAX_README_ENTRIES = 5

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
  for (const pair of releaseNotePairs) {
    const readmeContent = readReleaseNotes(pair.readme)
    const changelogContent = readReleaseNotes(pair.changelog)

    if (changelogContent !== null) {
      validateReleaseNote(changelogContent, pair.changelog, version)
    }

    if (readmeContent === null) continue
    validateReleaseNote(readmeContent, pair.readme, version)

    const readmeVersions = listVersionEntries(readmeContent)
    if (readmeVersions.length > MAX_README_ENTRIES) {
      errors.push(`${pair.readme} keeps at most ${MAX_README_ENTRIES} version entries; move older entries to ${pair.changelog}`)
    }
    if (!readmeContent.includes(pair.changelog)) {
      errors.push(`${pair.readme} must link to ${pair.changelog} for the full release history`)
    }
    if (changelogContent !== null) {
      const changelogVersions = new Set(listVersionEntries(changelogContent))
      for (const entryVersion of readmeVersions) {
        if (!changelogVersions.has(entryVersion)) {
          errors.push(`${pair.readme} version ${entryVersion} is missing from ${pair.changelog}`)
        }
      }
    }
  }
}

const result = {
  status: errors.length === 0 ? 'ok' : 'failed',
  targetRoot,
  version: version || null,
  readmes: releaseNotePairs.map((pair) => pair.readme),
  changelogs: releaseNotePairs.map((pair) => pair.changelog),
  maxReadmeEntries: MAX_README_ENTRIES,
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

function readReleaseNotes(label) {
  const path = resolve(targetRoot, label)
  if (!existsSync(path)) {
    errors.push(`missing release notes file: ${label}`)
    return null
  }
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
}

function listVersionEntries(content) {
  const matches = content.matchAll(/^###\s+(\d+\.\d+\.\d+)\s*[（(]/gm)
  return Array.from(matches, (match) => match[1])
}

function validateReleaseNote(content, label, version) {
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
