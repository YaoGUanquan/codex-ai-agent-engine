import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { makeTempDir } from './helpers.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const script = resolve(repoRoot, 'tools/check-public-content.mjs')

function runChecker(root) {
  return spawnSync(process.execPath, [script, '--root', root, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

test('check-public-content passes on the public repository', () => {
  const result = spawnSync(process.execPath, [script, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  const body = JSON.parse(result.stdout)
  assert.equal(body.status, 'ok')
  assert.equal(body.errorCount, 0)
})

test('check-public-content flags personal path content in a temp tree', () => {
  const tempRoot = makeTempDir('ae-public-content-dirty-path-')
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'templates'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'templates', 'ok.md'), '# ok\n', 'utf8')
    // Fake machine path only — not a real username or project.
    writeFileSync(join(tempRoot, 'note.md'), 'see D:\\codes\\fixture-leak\\secret.md\n', 'utf8')
    const result = runChecker(tempRoot)
    assert.equal(result.status, 1, result.stdout)
    const body = JSON.parse(result.stdout)
    assert.equal(body.status, 'failed')
    assert.ok(body.errors.some((e) => e.rule === 'windows-personal-root'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-public-content flags private docs paths in a temp tree', () => {
  const tempRoot = makeTempDir('ae-public-content-private-dir-')
  try {
    mkdirSync(join(tempRoot, 'docs', '00-process', 'active'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'templates'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'templates', 'ok.md'), '# ok\n', 'utf8')
    writeFileSync(join(tempRoot, 'docs', '00-process', 'active', 'note.md'), 'process note\n', 'utf8')
    const result = runChecker(tempRoot)
    assert.equal(result.status, 1, result.stdout)
    const body = JSON.parse(result.stdout)
    assert.ok(body.errors.some((e) => e.rule === 'private-path' && e.file.includes('docs/00-process/')))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-public-content accepts a clean temp tree with placeholders', () => {
  const tempRoot = makeTempDir('ae-public-content-clean-')
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'templates'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'templates', 'ok.md'), '# ok\n', 'utf8')
    writeFileSync(
      join(tempRoot, 'INSTALL.md'),
      [
        'manifest at C:\\temp\\ae-consumers.json',
        'install into <your-project-root>',
        'home example /Users/<user>/project',
        '',
      ].join('\n'),
      'utf8',
    )
    const result = runChecker(tempRoot)
    assert.equal(result.status, 0, result.stderr || result.stdout)
    const body = JSON.parse(result.stdout)
    assert.equal(body.status, 'ok')
    assert.equal(body.errorCount, 0)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
