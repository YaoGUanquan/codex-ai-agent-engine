import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  DEFAULT_IMPLICIT_TIER,
  allowImplicitInvocation,
  coreImplicitSkills,
  cursorShouldDisableModelInvocation,
  renderYaml,
  skillMetadata,
  supportedImplicitTiers,
} from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const pluginSetLanguage = resolve(repoRoot, 'plugins/ai-agent-engine-codex/scripts/set-language.mjs')
const rootSetLanguage = resolve(repoRoot, 'scripts/set-language.mjs')
const skillsSource = resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills')

function makeTempDir(prefix) {
  return mkdtempSync(join(realpathSync.native(tmpdir()), prefix))
}

function countTrue(yamlMap) {
  return Object.values(yamlMap).filter((text) => /^ {2}allow_implicit_invocation:\s*true\s*$/m.test(text)).length
}

function trueSkillNames(yamlMap) {
  return Object.entries(yamlMap)
    .filter(([, text]) => /^ {2}allow_implicit_invocation:\s*true\s*$/m.test(text))
    .map(([name]) => name)
    .sort()
}

function renderAll(lang, tier) {
  const out = {}
  for (const [name, item] of Object.entries(skillMetadata)) {
    out[name] = renderYaml(item, lang, { implicitTier: tier })
  }
  return out
}

function readSkillYamls(skillsRoot) {
  const out = {}
  for (const name of Object.keys(skillMetadata)) {
    const file = join(skillsRoot, name, 'agents', 'openai.yaml')
    if (existsSync(file)) out[name] = readFileSync(file, 'utf8')
  }
  return out
}

test('skillMetadata has exactly 40 entries and core five implicit markers', () => {
  const names = Object.keys(skillMetadata).sort()
  assert.equal(names.length, 40)
  assert.deepEqual([...coreImplicitSkills].sort(), ['ae-debug', 'ae-help', 'ae-plan', 'ae-review', 'ae-work'])
  const markedCore = names.filter((name) => skillMetadata[name].implicitTier === 'core')
  assert.deepEqual(markedCore, [...coreImplicitSkills].sort())
  for (const name of names) {
    if (coreImplicitSkills.includes(name)) continue
    assert.notEqual(skillMetadata[name].implicitTier, 'core', name)
  }
  assert.equal(DEFAULT_IMPLICIT_TIER, 'none')
  assert.deepEqual([...supportedImplicitTiers].sort(), ['all', 'core', 'none'])
})

test('renderYaml implicit tiers yield true-counts 5/40/0 with exact core names', () => {
  const coreYaml = renderAll('bilingual', 'core')
  const allYaml = renderAll('bilingual', 'all')
  const noneYaml = renderAll('bilingual', 'none')

  assert.equal(countTrue(coreYaml), 5)
  assert.deepEqual(trueSkillNames(coreYaml), [...coreImplicitSkills].sort())
  assert.equal(countTrue(allYaml), 40)
  assert.equal(countTrue(noneYaml), 0)

  assert.equal(Object.keys(skillMetadata).filter((name) => allowImplicitInvocation(skillMetadata[name], 'core')).length, 5)
  assert.equal(Object.keys(skillMetadata).filter((name) => allowImplicitInvocation(skillMetadata[name], 'all')).length, 40)
  assert.equal(Object.keys(skillMetadata).filter((name) => allowImplicitInvocation(skillMetadata[name], 'none')).length, 0)
})

test('default renderYaml tier is none (matches committed allow_implicit false for all skills)', () => {
  let trueCount = 0
  for (const name of Object.keys(skillMetadata)) {
    const yaml = renderYaml(skillMetadata[name], 'bilingual')
    const allow = /^ {2}allow_implicit_invocation: true$/m.test(yaml)
    if (allow) trueCount += 1
    assert.equal(allow, false, `${name} default allow_implicit should be false`)
    const committed = readFileSync(join(skillsSource, name, 'agents', 'openai.yaml'), 'utf8')
    assert.equal(yaml, committed, `${name} default bilingual render must match committed yaml`)
  }
  assert.equal(trueCount, 0)
})

test('default set-language regenerate keeps empty diff vs committed yaml', () => {
  const tempRoot = makeTempDir('ae-implicit-default-')
  try {
    const pluginRoot = join(tempRoot, 'plugins', 'ai-agent-engine-codex')
    cpSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex'), pluginRoot, { recursive: true })
    const result = spawnSync(process.execPath, [join(pluginRoot, 'scripts', 'set-language.mjs'), '--target', tempRoot, '--lang', 'bilingual'], {
      encoding: 'utf8',
      cwd: tempRoot,
    })
    assert.equal(result.status, 0, result.stderr || result.stdout)
    const payload = JSON.parse(result.stdout)
    assert.equal(payload.implicitTier, 'none')
    for (const name of Object.keys(skillMetadata)) {
      const rendered = readFileSync(join(pluginRoot, 'skills', name, 'agents', 'openai.yaml'), 'utf8')
      const committed = readFileSync(join(skillsSource, name, 'agents', 'openai.yaml'), 'utf8')
      assert.equal(rendered, committed, name)
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('set-language --implicit retention survives language switch', () => {
  const tempRoot = makeTempDir('ae-implicit-retain-')
  try {
    const pluginRoot = join(tempRoot, 'plugins', 'ai-agent-engine-codex')
    cpSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex'), pluginRoot, { recursive: true })
    const script = join(pluginRoot, 'scripts', 'set-language.mjs')

    const noneResult = spawnSync(process.execPath, [script, '--target', tempRoot, '--lang', 'bilingual', '--implicit', 'none'], {
      encoding: 'utf8',
      cwd: tempRoot,
    })
    assert.equal(noneResult.status, 0, noneResult.stderr || noneResult.stdout)
    assert.equal(JSON.parse(noneResult.stdout).implicitTier, 'none')
    assert.equal(countTrue(readSkillYamls(join(pluginRoot, 'skills'))), 0)

    const switchResult = spawnSync(process.execPath, [script, '--target', tempRoot, '--lang', 'en'], {
      encoding: 'utf8',
      cwd: tempRoot,
    })
    assert.equal(switchResult.status, 0, switchResult.stderr || switchResult.stdout)
    assert.equal(JSON.parse(switchResult.stdout).implicitTier, 'none')
    const after = readSkillYamls(join(pluginRoot, 'skills'))
    assert.equal(countTrue(after), 0)
    assert.match(after['ae-help'], /display_name: "AE Help"/)

    const coreResult = spawnSync(process.execPath, [script, '--target', tempRoot, '--lang', 'zh-CN', '--implicit', 'core'], {
      encoding: 'utf8',
      cwd: tempRoot,
    })
    assert.equal(coreResult.status, 0, coreResult.stderr || coreResult.stdout)
    const coreYamls = readSkillYamls(join(pluginRoot, 'skills'))
    assert.equal(countTrue(coreYamls), 5)
    assert.deepEqual(trueSkillNames(coreYamls), [...coreImplicitSkills].sort())

    const keepCore = spawnSync(process.execPath, [script, '--target', tempRoot, '--lang', 'en'], {
      encoding: 'utf8',
      cwd: tempRoot,
    })
    assert.equal(keepCore.status, 0, keepCore.stderr || keepCore.stdout)
    assert.equal(JSON.parse(keepCore.stdout).implicitTier, 'core')
    assert.equal(countTrue(readSkillYamls(join(pluginRoot, 'skills'))), 5)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('root set-language.mjs accepts --implicit and keeps existing language tests green path', () => {
  const helpEn = renderYaml(skillMetadata['ae-help'], 'en', { implicitTier: 'all' })
  assert.match(helpEn, /display_name: "AE Help"/)
  assert.match(helpEn, /allow_implicit_invocation: true/)
  const helpCore = renderYaml(skillMetadata['ae-brainstorm'], 'en', { implicitTier: 'core' })
  assert.match(helpCore, /allow_implicit_invocation: false/)
  assert.ok(existsSync(rootSetLanguage))
  assert.ok(existsSync(pluginSetLanguage))
})

test('cursorShouldDisableModelInvocation: none disables all, core keeps five, all disables none', () => {
  for (const name of Object.keys(skillMetadata)) {
    assert.equal(cursorShouldDisableModelInvocation(name, 'none'), true, name)
    assert.equal(cursorShouldDisableModelInvocation(name, 'all'), false, name)
    assert.equal(
      cursorShouldDisableModelInvocation(name, 'core'),
      !coreImplicitSkills.includes(name),
      name,
    )
  }
  assert.equal(cursorShouldDisableModelInvocation('ae-help', 'none'), true)
  assert.equal(cursorShouldDisableModelInvocation('ae-help', 'core'), false)
})
