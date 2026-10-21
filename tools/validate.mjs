import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { parseDocument } from 'yaml'
import { isMain, isWithin, repoRoot, walkFiles } from './files.mjs'

export const requiredSkills = [
  'ae-grill', 'ae-frontend', 'ae-backend', 'ae-unit-test',
  'ae-integration-test', 'ae-e2e-test', 'ae-e2e-suite',
]
const allowedFields = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'])
const textExtensions = new Set(['.md', '.mjs', '.js', '.cjs', '.json', '.yaml', '.yml', '.py', '.sh', '.ps1'])
const scriptExtensions = new Set(['.mjs', '.js', '.cjs'])
const legacy = /plugins[\\/]ai-agent-engine-codex|\.codex-plugin|\.mcp\.json|\.ae-source|(?:scripts[\\/])?ae-tools\.mjs|AE_RUNTIME_ROOT|resolve-runtime-entry|docs[\\/]08-ai-memory|docs[\\/]ae[\\/](?:gates|plans|evidence)|(?:install|update)-(?:project|global)\.mjs/i
const hostSyntax = /\$ARGUMENTS\b|\bsubagent_type\b|\bAskUserQuestion\b|\bspawn_agent\b|\brequest_user_input\b|\bmodel:\s*\S+|[.]codex[\\/]|[.]claude[\\/]|\b(?:gpt-\d|claude-\d|gemini-\d)|(?:[A-Za-z]:[\\/]|~\/|\/Users\/|\/home\/)/

function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  if (!match) throw new Error('Missing YAML frontmatter')
  const document = parseDocument(match[1], { uniqueKeys: true })
  if (document.errors.length) throw new Error(document.errors.map((error) => error.message).join('; '))
  const data = document.toJS({ maxAliasCount: 0 })
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Frontmatter must be a mapping')
  return { data, body: text.slice(match[0].length) }
}

function localTarget(root, source, specifier) {
  const pathPart = decodeURIComponent(specifier.split(/[?#]/)[0]).replace(/\\/g, '/')
  if (!pathPart) return
  if (/^(?:[A-Za-z]:|\/|~)/.test(pathPart)) throw new Error(`Absolute resource: ${specifier}`)
  const target = resolve(dirname(source), pathPart)
  if (!isWithin(root, target)) throw new Error(`Resource escapes skill: ${specifier}`)
  if (!existsSync(target)) throw new Error(`Missing resource: ${specifier}`)
  if (lstatSync(target).isSymbolicLink() || !isWithin(realpathSync(root), realpathSync(target))) {
    throw new Error(`Linked resource: ${specifier}`)
  }
}

export function validateSkill(root) {
  const errors = []
  const skillRoot = resolve(root)
  const name = basename(skillRoot)
  try {
    const files = walkFiles(skillRoot)
    const entry = resolve(skillRoot, 'SKILL.md')
    if (!files.includes(entry)) throw new Error('Missing SKILL.md')
    const { data, body } = parseFrontmatter(readFileSync(entry, 'utf8'))
    if (data.name !== name || !/^ae-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
      throw new Error('Frontmatter name must match a valid ae- directory name')
    }
    for (const key of Object.keys(data)) {
      if (!allowedFields.has(key)) errors.push(`Unsupported frontmatter field: ${key}`)
    }
    for (const [key, limit, required] of [['description', 1024, true], ['compatibility', 500, false], ['license', Infinity, false], ['allowed-tools', Infinity, false]]) {
      if (data[key] === undefined && !required) continue
      if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > limit) {
        errors.push(`Invalid frontmatter ${key}`)
      }
    }
    if (typeof data.description === 'string' && (!/[\u3400-\u9fff]/.test(data.description) || !/[A-Za-z]{3}/.test(data.description))) {
      errors.push('Description must cover Chinese and English')
    }
    if (data.metadata !== undefined && (!data.metadata || typeof data.metadata !== 'object' || Array.isArray(data.metadata) || Object.values(data.metadata).some((value) => typeof value !== 'string'))) {
      errors.push('Metadata values must be strings')
    }
    if (body.split(/\r?\n/).length > 500) errors.push('Move conditional detail out of the entrypoint (500-line limit)')
    for (const file of files) {
      if (!textExtensions.has(extname(file))) {
        if (!relative(skillRoot, file).startsWith(`assets`)) errors.push(`Unsupported resource type: ${relative(skillRoot, file)}`)
        continue
      }
      if (lstatSync(file).size > 1024 * 1024) {
        errors.push(`Text resource exceeds 1 MiB: ${relative(skillRoot, file)}`)
        continue
      }
      const text = readFileSync(file, 'utf8')
      const label = relative(skillRoot, file)
      if (text.includes('\ufffd') || text.charCodeAt(0) === 0xfeff) errors.push(`${label}: invalid UTF-8 or BOM`)
      if (legacy.test(text)) errors.push(`${label}: retired runtime dependency`)
      if (hostSyntax.test(text)) errors.push(`${label}: host-specific syntax or absolute machine path`)
      const otherNames = [...text.matchAll(/\bae-[a-z0-9]+(?:-[a-z0-9]+)*\b/g)].map((match) => match[0]).filter((value) => value !== name)
      if (otherNames.length) errors.push(`${label}: cross-skill reference: ${[...new Set(otherNames)].join(', ')}`)
      try {
        if (extname(file) === '.md') {
          const checkMarkdownTarget = (target) => {
            if (/^(?:https?:|mailto:|#)/i.test(target)) return
            if (/^[a-z][a-z0-9+.-]*:/i.test(target)) throw new Error(`Unsupported resource URL: ${target}`)
            localTarget(skillRoot, file, target)
          }
          // Inline links / images: [text](url) or ![alt](url)
          for (const match of text.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)(?:\s+["'][^)\n]*)?\s*\)/g)) {
            checkMarkdownTarget(match[1].replace(/^<|>$/g, ''))
          }
          // Reference definitions: [label]: destination (optional title ignored)
          const refs = new Map()
          for (const match of text.matchAll(/^[ \t]{0,3}\[([^\]\n]+)\]:[ \t]+(<[^>\n]+>|\S+)/gm)) {
            const label = match[1].trim().toLowerCase().replace(/\s+/g, ' ')
            const target = match[2].replace(/^<|>$/g, '')
            refs.set(label, target)
            checkMarkdownTarget(target)
          }
          // Reference-style links: [text][label] or [text][]
          for (const match of text.matchAll(/!?\[([^\]\n]*)\]\[([^\]]*)\]/g)) {
            const label = (match[2] || match[1]).trim().toLowerCase().replace(/\s+/g, ' ')
            if (!label || !refs.has(label)) continue
            checkMarkdownTarget(refs.get(label))
          }
          for (const match of text.matchAll(/`((?:\.\.?[\\/]|references[\\/]|scripts[\\/]|assets[\\/])[^\s`]+)`/g)) {
            localTarget(skillRoot, file, match[1])
          }
        }
        if (scriptExtensions.has(extname(file))) {
          for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*|\bnew\s+URL\s*\(\s*)['"]([^'"]+)['"]/g)) {
            const target = match[1]
            if (target.startsWith('.')) localTarget(skillRoot, file, target)
            else if (!builtinModules.includes(target.replace(/^node:/, ''))) throw new Error(`Non-local script dependency: ${target}`)
          }
          if (/\b(?:import|require)\s*\(\s*[^'"\s]/.test(text)) throw new Error('Dynamic script dependencies cannot be verified')
        }
      } catch (error) {
        errors.push(`${label}: ${error.message}`)
      }
    }
  } catch (error) {
    errors.push(error.message)
  }
  return { name, errors }
}

export function validateCollection(root = resolve(repoRoot, 'skills')) {
  const errors = []
  let results = []
  try {
    // Walking first rejects directory links even when they look like named skills.
    const files = walkFiles(root)
    const names = [...new Set(files.map((file) => relative(root, file).split(/[\\/]/)[0]))].sort()
    if (JSON.stringify(names) !== JSON.stringify([...requiredSkills].sort())) errors.push('Collection must contain exactly the seven approved skills')
    results = names.map((name) => validateSkill(resolve(root, name)))
    errors.push(...results.flatMap((result) => result.errors.map((error) => `${result.name}: ${error}`)))
    // Empty unexpected directories are also invalid.
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || !requiredSkills.includes(entry.name)) errors.push(`Unexpected skills entry: ${entry.name}`)
    }
  } catch (error) {
    errors.push(error.message)
  }
  return { status: errors.length ? 'failed' : 'ok', skills: results.map((result) => result.name), errors }
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2)
  let result
  if (args.length === 0) result = validateCollection()
  else if (args.length === 2 && args[0] === '--skill') {
    const skill = validateSkill(args[1])
    result = { status: skill.errors.length ? 'failed' : 'ok', ...skill }
  } else result = { status: 'failed', errors: ['Usage: node tools/validate.mjs [--skill <directory>]'] }
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.status === 'ok' ? 0 : 1
}
