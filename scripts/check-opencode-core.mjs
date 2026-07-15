#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const targetRoot = resolve(readArg('--target') || process.cwd())
const requiredCommands = [
  'ae-help',
  'ae-brainstorm',
  'ae-prd',
  'ae-design',
  'ae-plan',
  'ae-tasks',
  'ae-work',
  'ae-review',
  'ae-lfg',
]

const configPath = resolve(targetRoot, 'opencode.json')
const commandRoot = resolve(targetRoot, '.opencode', 'commands')
const agentPath = resolve(targetRoot, '.opencode', 'agents', 'ae-review.md')
const skillRoot = resolve(targetRoot, '.agents', 'skills')

assertFile(configPath, 'opencode.json')
const config = parseJson(configPath)
if (config.$schema !== 'https://opencode.ai/config.json') {
  fail('opencode.json must use the OpenCode config schema')
}
validateSkillPermission(config)

for (const name of requiredCommands) {
  const path = resolve(commandRoot, `${name}.md`)
  assertFile(path, `.opencode/commands/${name}.md`)
  validateMarkdownFrontmatter(path, ['description', 'agent'])
}
assertFile(agentPath, '.opencode/agents/ae-review.md')
const reviewerFrontmatter = validateMarkdownFrontmatter(agentPath, ['description', 'mode'])
validateReviewerContract(agentPath, reviewerFrontmatter)

const skills = listDirectories(skillRoot)
if (skills.length === 0) fail('No OpenCode-compatible skills found under .agents/skills')
for (const name of skills) {
  const skillPath = resolve(skillRoot, name, 'SKILL.md')
  assertFile(skillPath, `.agents/skills/${name}/SKILL.md`)
  const frontmatter = validateMarkdownFrontmatter(skillPath, ['name', 'description'])
  if (frontmatter.name !== name) fail(`Skill name does not match directory: ${name}`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name)) {
    fail(`Invalid OpenCode skill name: ${frontmatter.name}`)
  }
  if (frontmatter.name.length > 64) fail(`OpenCode skill name is too long: ${frontmatter.name}`)
  if (frontmatter.description.length > 1024) fail(`OpenCode skill description is too long: ${name}`)
}

console.log(JSON.stringify({
  status: 'ok',
  targetRoot,
  commandCount: requiredCommands.length,
  skillCount: skills.length,
  readOnlyAgent: 'ae-review',
  skillPermission: config.permission?.skill ? 'explicit' : 'default',
}, null, 2))

function validateSkillPermission(config) {
  const skill = config.permission?.skill
  if (skill === undefined) return
  if (skill === 'deny') fail('opencode.json denies all skills')
  if (typeof skill === 'string') return
  if (typeof skill !== 'object' || skill === null) fail('opencode.json has an invalid skill permission')
  if (skill['ae-*'] === 'deny' || skill['*'] === 'deny' && skill['ae-*'] !== 'allow') {
    fail('opencode.json denies the ae-* skill namespace')
  }
}

function validateReviewerContract(path, frontmatter) {
  if (frontmatter.mode !== 'subagent') fail('ae-review must be a subagent')
  if (frontmatter.steps !== '15') fail('ae-review must cap the subagent at 15 steps')
  const content = readFileSync(path, 'utf8')
  const requiredRules = [
    /^  "\*": deny$/m,
    /^  read: allow$/m,
    /^  glob: allow$/m,
    /^  grep: allow$/m,
    /^  list: allow$/m,
    /^  skill: allow$/m,
    /^  edit: deny$/m,
    /^  task: deny$/m,
    /^  external_directory: deny$/m,
  ]
  for (const rule of requiredRules) {
    if (!rule.test(content)) fail(`ae-review permission contract is incomplete: ${path}`)
  }
}

function listDirectories(path) {
  return existsSync(path)
    ? readdirSync(path).filter((name) => statSync(resolve(path, name)).isDirectory()).sort()
    : []
}

function validateMarkdownFrontmatter(path, required) {
  const content = readFileSync(path, 'utf8')
  if (!content.startsWith('---\n')) fail(`Missing YAML frontmatter: ${path}`)
  const end = content.indexOf('\n---', 4)
  if (end < 0) fail(`Unclosed YAML frontmatter: ${path}`)
  const values = {}
  for (const line of content.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (match) values[match[1]] = stripQuotes(match[2].trim())
  }
  for (const key of required) {
    if (!values[key]) fail(`Missing frontmatter field ${key}: ${path}`)
  }
  return values
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, '')
}

function parseJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`Invalid JSON in ${path}: ${error.message}`)
  }
}

function assertFile(path, label) {
  if (!existsSync(path)) fail(`Missing OpenCode integration file: ${label}`)
}

function readArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
