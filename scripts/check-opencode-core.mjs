#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const targetRoot = resolve(readArg('--target') || process.cwd())
const nestedRuntime = resolve(targetRoot, '.opencode', 'ai-agent-engine')
const runtimeRoot = existsSync(resolve(nestedRuntime, 'package.json')) ? nestedRuntime : targetRoot
const sourceRoot = resolve(runtimeRoot, 'src')
const assetsRoot = resolve(sourceRoot, 'assets')
const bridgePath = resolve(targetRoot, '.opencode', 'plugins', 'ae-server.js')
const expectedSkills = ['ae-design', 'ae-work', 'ae-review', 'ae-playwright', 'ae-ocr', 'ae-image', 'ae-audio', 'ae-video', 'ae-graph-build', 'ae-graph-query']
const expectedTools = ['ae-help.tool.ts', 'ae-ocr.tool.ts', 'ae-image.tool.ts', 'ae-audio.tool.ts', 'ae-video.tool.ts', 'ae-graph-build.tool.ts', 'ae-graph-query.tool.ts']
const excluded = ['ae-pdf', 'ae-docx', 'ae-xlsx', 'ae-pptx', 'ae-officecli']

assertFile(resolve(runtimeRoot, 'package.json'), 'runtime package.json')
assertFile(resolve(sourceRoot, 'index.ts'), 'runtime src/index.ts')
assertFile(resolve(runtimeRoot, 'dist', 'src', 'index.js'), 'built plugin entry')
assertFile(bridgePath, '.opencode/plugins/ae-server.js')

const packageJson = JSON.parse(readFileSync(resolve(runtimeRoot, 'package.json'), 'utf8'))
if (packageJson.name !== 'ai-agent-engine-opencode') fail('Unexpected OpenCode runtime package name')
for (const dependency of ['@officecli/sdk', 'pdf-lib', 'pdf-parse', 'pdfjs-dist', '@napi-rs/canvas']) {
  if (packageJson.dependencies?.[dependency]) fail(`Excluded dependency is installed: ${dependency}`)
}

const skillRoot = resolve(assetsRoot, 'skills')
const skills = listDirectories(skillRoot)
for (const name of expectedSkills) assertFile(resolve(skillRoot, name, 'SKILL.md'), `skill ${name}`)
for (const name of excluded) {
  if (existsSync(resolve(skillRoot, name))) fail(`Excluded skill is present: ${name}`)
}
for (const name of expectedTools) assertFile(resolve(sourceRoot, 'tools', name), `tool ${name}`)

const toolIndex = readFileSync(resolve(sourceRoot, 'tools', 'index.ts'), 'utf8')
for (const name of excluded) {
  if (toolIndex.includes(name)) fail(`Excluded tool is registered: ${name}`)
}

console.log(JSON.stringify({
  status: 'ok',
  targetRoot,
  runtimeRoot,
  skillCount: skills.length,
  commandCount: listMarkdownFiles(resolve(assetsRoot, 'commands')).length,
  toolCount: listTypeScriptTools(resolve(sourceRoot, 'tools')).length,
  bridge: '.opencode/plugins/ae-server.js',
  excludedCapabilities: excluded,
}, null, 2))

function listDirectories(path) {
  return readdirSync(path).filter((name) => statSync(resolve(path, name)).isDirectory()).sort()
}

function listMarkdownFiles(path) {
  return readdirSync(path).filter((name) => name.endsWith('.md'))
}

function listTypeScriptTools(path) {
  return readdirSync(path).filter((name) => name.endsWith('.tool.ts'))
}

function assertFile(path, label) {
  if (!existsSync(path)) fail(`Missing OpenCode runtime file: ${label}`)
}

function readArg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] || null : null
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
