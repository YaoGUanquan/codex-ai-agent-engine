#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const sourceArg = readArg('--source')
const since = readArg('--since')
if (!sourceArg) fail('Usage: node scripts/check-opencode-upstream.mjs --source <upstream-checkout> [--since <git-ref>]')

const sourceRoot = resolve(sourceArg)
if (!existsSync(sourceRoot)) fail(`Upstream checkout does not exist: ${sourceRoot}`)

const head = git(['rev-parse', 'HEAD'])
const subject = git(['log', '-1', '--format=%s'])
const changed = since ? parseChanged(git(['diff', '--name-status', `${since}..HEAD`, '--', 'src/assets', 'src/index.ts', 'src/services', 'src/tools', 'src/hooks'])) : []

console.log(JSON.stringify({
  status: 'ok',
  source: 'https://gitee.com/jiangqiang1996/ai-agent-engine',
  sourceRoot,
  head,
  subject,
  since: since || null,
  changedCount: changed.length,
  changed,
  classification: {
    portableSkillAssets: changed.filter((item) => item.classification === 'portable-skill'),
    portableAgentAssets: changed.filter((item) => item.classification === 'portable-agent'),
    deferredRuntimeAssets: changed.filter((item) => item.classification === 'deferred-runtime'),
    upstreamRuntime: changed.filter((item) => item.classification === 'upstream-runtime'),
    other: changed.filter((item) => item.classification === 'other'),
  },
  policy: {
    copySkillsOnlyAfterFrontmatterAndToolBoundaryReview: true,
    doNotCopyUpstreamRuntimeWithoutOpenCodeCompatibilityCheck: true,
    officeSkillsDeferredUntilOfficeCliRuntimeExists: true,
  },
}, null, 2))

function parseChanged(output) {
  return output.split('\n').filter(Boolean).map((line) => {
    const [status, ...pathParts] = line.split('\t')
    const path = pathParts.join('\t')
    return { status, path, classification: classify(path) }
  })
}

function classify(path) {
  if (/^src\/assets\/skills\/ae-(docx|pptx|xlsx|officecli)\//.test(path)) return 'deferred-runtime'
  if (/^src\/assets\/skills\/ae-[^/]+\/SKILL\.md$/.test(path)) return 'portable-skill'
  if (/^src\/assets\/agents\//.test(path)) return 'portable-agent'
  if (/^src\/(index|services|tools|hooks)\//.test(path) || /^src\/index\.ts$/.test(path)) return 'upstream-runtime'
  return 'other'
}

function git(args) {
  const result = spawnSync('git', ['-C', sourceRoot, ...args], { encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    fail((result.stderr || result.error?.message || `git command failed: ${args.join(' ')}`).trim())
  }
  return result.stdout.trim()
}

function readArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
