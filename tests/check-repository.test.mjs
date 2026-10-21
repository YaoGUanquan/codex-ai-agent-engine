import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { makeTempDir } from './helpers.mjs'
import { checkRepository } from '../tools/check-repository.mjs'

function seedMinimalPackage(root) {
  writeFileSync(join(root, 'package.json'), JSON.stringify({
    name: 'fixture',
    version: '0.5.0',
    license: 'GPL-2.0-only',
    files: ['skills/', 'LICENSE', 'NOTICE.md'],
    scripts: { test: 'node tools/run-tests.mjs' },
  }, null, 2), 'utf8')
  writeFileSync(join(root, 'LICENSE'), 'GPL-2.0-only\n', 'utf8')
  writeFileSync(join(root, 'NOTICE.md'), 'notice\n', 'utf8')
  writeFileSync(join(root, 'README.md'), '# fixture\n', 'utf8')
  writeFileSync(join(root, 'README.en.md'), '# fixture\n', 'utf8')
  writeFileSync(join(root, 'README.zh-CN.md'), '# fixture\n', 'utf8')
  writeFileSync(join(root, 'INSTALL.md'), '# install\n', 'utf8')
  writeFileSync(join(root, 'INSTALL.zh-CN.md'), '# install\n', 'utf8')
  writeFileSync(join(root, 'AGENTS.md'), '# agents\n', 'utf8')
  writeFileSync(join(root, '.cursorrules'), '# rules\n', 'utf8')
  mkdirSync(join(root, 'docs'), { recursive: true })
  writeFileSync(join(root, 'docs', 'release-checklist.md'), '# checklist\n', 'utf8')
}

test('checkRepository ignores empty retired directory trees', () => {
  const temp = makeTempDir('ae-repo-empty-retired-')
  try {
    seedMinimalPackage(temp)
    mkdirSync(join(temp, 'plugins', 'ai-agent-engine-codex', 'skills', 'ae-prd', 'references'), { recursive: true })
    mkdirSync(join(temp, 'scripts'), { recursive: true })
    mkdirSync(join(temp, 'docs', 'ae', 'references'), { recursive: true })
    mkdirSync(join(temp, 'docs', 'ae', 'templates'), { recursive: true })
    const result = checkRepository(temp)
    assert.equal(result.status, 'ok', result.errors.join('\n'))
    assert.ok(!result.errors.some((error) => /Retired source root/.test(error)))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test('checkRepository flags a real residual file under plugins', () => {
  const temp = makeTempDir('ae-repo-residual-file-')
  try {
    seedMinimalPackage(temp)
    const residual = join(temp, 'plugins', 'ai-agent-engine-codex', 'skills', 'ae-prd', 'references')
    mkdirSync(residual, { recursive: true })
    writeFileSync(join(residual, 'prd-artifact.md'), '# leftover\n', 'utf8')
    const result = checkRepository(temp)
    assert.equal(result.status, 'failed')
    assert.ok(result.errors.some((error) => /Retired source root still contains files: plugins/.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test('checkRepository flags retired executable install examples', () => {
  const temp = makeTempDir('ae-repo-stale-cmd-')
  try {
    seedMinimalPackage(temp)
    writeFileSync(join(temp, 'README.md'), 'run `node scripts/install-project.mjs`\n', 'utf8')
    const result = checkRepository(temp)
    assert.equal(result.status, 'failed')
    assert.ok(result.errors.some((error) => /Retired executable example: README.md/.test(error)), result.errors.join('\n'))
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})