import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeTempDir } from './helpers.mjs'
import { validateCollection, validateSkill } from '../tools/validate.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const skillsRoot = resolve(repoRoot, 'skills')

function writeSkill(root, name, skillBody, extraFiles = {}) {
  const skillRoot = join(root, name)
  mkdirSync(skillRoot, { recursive: true })
  writeFileSync(join(skillRoot, 'SKILL.md'), skillBody, 'utf8')
  for (const [rel, content] of Object.entries(extraFiles)) {
    const absolute = join(skillRoot, rel)
    mkdirSync(join(absolute, '..'), { recursive: true })
    writeFileSync(absolute, content, 'utf8')
  }
  return skillRoot
}

const bilingualFrontmatter = (name) => `---
name: ${name}
description: 用户明确要求 ${name} 或 AE sample 时执行该技能。Use when explicitly asked for ${name} or AE sample workflow.
license: GPL-2.0-only
compatibility: Markdown only; no bundled runtime.
---

# Sample

Do the requested work with local references only.
`

test('validateCollection accepts the repository seven-skill layout', () => {
  const result = validateCollection(skillsRoot)
  assert.equal(result.status, 'ok', result.errors.join('\n'))
  assert.deepEqual(result.skills.slice().sort(), [
    'ae-backend',
    'ae-e2e-suite',
    'ae-e2e-test',
    'ae-frontend',
    'ae-grill',
    'ae-integration-test',
    'ae-unit-test',
  ])
})

test('validateSkill rejects a dangling markdown reference', () => {
  const temp = makeTempDir('ae-validate-dangling-')
  try {
    const skillRoot = writeSkill(temp, 'ae-grill', `${bilingualFrontmatter('ae-grill')}
See [missing](references/missing.md).
`)
    const result = validateSkill(skillRoot)
    assert.ok(result.errors.some((error) => /Missing resource|dangling|missing\.md/i.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test('validateSkill rejects cross-skill name references', () => {
  const temp = makeTempDir('ae-validate-cross-')
  try {
    const skillRoot = writeSkill(temp, 'ae-grill', `${bilingualFrontmatter('ae-grill')}
Do not call ae-backend from this skill.
`)
    const result = validateSkill(skillRoot)
    assert.ok(result.errors.some((error) => /cross-skill reference: ae-backend/.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test('validateSkill rejects path escape outside the skill root', () => {
  const temp = makeTempDir('ae-validate-escape-')
  try {
    writeFileSync(join(temp, 'secret.md'), 'secret\n', 'utf8')
    const skillRoot = writeSkill(temp, 'ae-grill', `${bilingualFrontmatter('ae-grill')}
See [escape](../secret.md).
`)
    const result = validateSkill(skillRoot)
    assert.ok(result.errors.some((error) => /escapes skill|Absolute resource/i.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test('validateSkill rejects linked resources when the platform allows symlinks', () => {
  const temp = makeTempDir('ae-validate-link-')
  try {
    const skillRoot = writeSkill(temp, 'ae-grill', bilingualFrontmatter('ae-grill'), {
      'references/real.md': '# real\n',
    })
    const linkPath = join(skillRoot, 'references', 'alias.md')
    try {
      symlinkSync(join(skillRoot, 'references', 'real.md'), linkPath)
    } catch (error) {
      if (error && (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOTSUP')) {
        // Windows without symlink privilege: skip without false failure.
        return
      }
      throw error
    }
    const result = validateSkill(skillRoot)
    assert.ok(result.errors.some((error) => /Linked resource/i.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test('validateSkill rejects retired runtime residue in skill text', () => {
  const temp = makeTempDir('ae-validate-legacy-')
  try {
    const skillRoot = writeSkill(temp, 'ae-grill', `${bilingualFrontmatter('ae-grill')}
Never load plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md again.
`)
    const result = validateSkill(skillRoot)
    assert.ok(result.errors.some((error) => /retired runtime dependency/i.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test('validateCollection rejects an incomplete or extra skill set', () => {
  const temp = makeTempDir('ae-validate-collection-')
  try {
    cpSync(join(skillsRoot, 'ae-grill'), join(temp, 'ae-grill'), { recursive: true })
    const result = validateCollection(temp)
    assert.equal(result.status, 'failed')
    assert.ok(result.errors.some((error) => /exactly the seven approved skills/i.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})
test('validateSkill accepts a skill under a symlinked temp parent', () => {
  const base = makeTempDir('ae-validate-symtmp-')
  try {
    const realRoot = join(base, 'real')
    const linkRoot = join(base, 'via-link')
    mkdirSync(realRoot, { recursive: true })
    try {
      symlinkSync(realRoot, linkRoot, 'dir')
    } catch (error) {
      if (error && (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOTSUP')) {
        return
      }
      throw error
    }
    const skillRoot = writeSkill(linkRoot, 'ae-grill', bilingualFrontmatter('ae-grill'), {
      'references/note.md': '# note\n',
    })
    const result = validateSkill(skillRoot)
    assert.equal(result.errors.length, 0, result.errors.join('\n'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})

test('validateSkill rejects when the skill root itself is a symlink', () => {
  const base = makeTempDir('ae-validate-rootlink-')
  try {
    const realSkill = writeSkill(base, 'ae-grill', bilingualFrontmatter('ae-grill'))
    const linkedSkill = join(base, 'ae-grill-link')
    try {
      symlinkSync(realSkill, linkedSkill, 'dir')
    } catch (error) {
      if (error && (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'ENOTSUP')) {
        return
      }
      throw error
    }
    const result = validateSkill(linkedSkill)
    assert.ok(result.errors.some((error) => /Linked root is not allowed/i.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})

