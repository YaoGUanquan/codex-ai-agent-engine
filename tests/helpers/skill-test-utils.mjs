import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

export function writeMemoryFixture(root) {
  mkdirSync(join(root, 'docs', '08-ai-memory'), { recursive: true })
  mkdirSync(join(root, 'docs', 'ae', 'references'), { recursive: true })
  writeFileSync(join(root, 'docs', '08-ai-memory', '01-memory.md'), '# Graph memory\nA declared graph record.\n', 'utf8')
  writeFileSync(join(root, 'docs', '08-ai-memory', '02-release.md'), '# Release memory\nA declared release record.\n', 'utf8')
  writeFileSync(join(root, 'docs', 'ae', 'references', 'graph.md'), '# Graph artifact\n', 'utf8')
  writeFileSync(join(root, 'AGENTS.md'), '# Guidance\n', 'utf8')
  writeFileSync(join(root, 'docs', '08-ai-memory', '00-registry.json'), JSON.stringify({
    schemaVersion: 1,
    documents: [
      {
        id: 'graph-memory',
        path: 'docs/08-ai-memory/01-memory.md',
        kind: 'memory',
        role: 'graph fixture',
        topics: ['graph', 'fixture'],
        reviewStatus: 'current',
      },
      {
        id: 'release-memory',
        path: 'docs/08-ai-memory/02-release.md',
        kind: 'memory',
        role: 'release fixture',
        topics: ['release'],
        reviewStatus: 'reviewed',
      },
    ],
    relations: [
      {
        from: 'graph-memory',
        to: 'docs/ae/references/graph.md',
        type: 'supports',
        evidence: { path: 'docs/08-ai-memory/01-memory.md', note: 'Fixture relation is declared in canonical memory.' },
      },
      {
        from: 'release-memory',
        to: 'AGENTS.md',
        type: 'documents',
        evidence: { path: 'docs/08-ai-memory/02-release.md', note: 'Fixture relation documents project guidance.' },
      },
    ],
  }, null, 2), 'utf8')
}

export function runNodeScript(relativePath) {
  const scriptPath = resolve(repoRoot, relativePath)
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })

  assert.equal(
    result.status,
    0,
    [
      `Command failed: node ${relativePath}`,
      result.stdout?.trim() || '',
      result.stderr?.trim() || '',
    ].filter(Boolean).join('\n'),
  )

  return JSON.parse(result.stdout)
}

export function runNodeScriptJson(args, cwd = repoRoot, env = {}) {
  const result = spawnSync(process.execPath, args.map((arg, index) => index === 0 ? resolve(repoRoot, arg) : arg), {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  })

  assert.equal(
    result.status,
    0,
    [
      `Command failed: node ${args.join(' ')}`,
      result.stdout?.trim() || '',
      result.stderr?.trim() || '',
    ].filter(Boolean).join('\n'),
  )

  return JSON.parse(result.stdout)
}

export function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  })

  assert.equal(
    result.status,
    0,
    [
      `Command failed: git ${args.join(' ')}`,
      result.stdout?.trim() || '',
      result.stderr?.trim() || '',
    ].filter(Boolean).join('\n'),
  )

  return result
}

export function runNodeScriptRaw(command) {
  const result = spawnSync(command, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  })

  assert.equal(
    result.status,
    0,
    [result.stdout?.trim() || '', result.stderr?.trim() || ''].filter(Boolean).join('\n'),
  )

  return result.stdout
}

export function runAeArtifactCheck(tempRoot, extraArgs = []) {
  return spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-ae-artifacts.mjs'), '--target', tempRoot, ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

export function runDesignContractCheck(tempRoot, extraArgs = []) {
  return spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-design-contract.mjs'), '--target', tempRoot, ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

export function writeAeArtifact(tempRoot, relativePath, lines) {
  const fullPath = join(tempRoot, relativePath)
  mkdirSync(resolve(fullPath, '..'), { recursive: true })
  writeFileSync(fullPath, lines.join('\n'), 'utf8')
}

export function readSkillBody(root, skillName) {
  return readFileSync(resolve(repoRoot, root, skillName, 'SKILL.md'), 'utf8')
}

export function validDesignContractLines() {
  return [
    '---',
    'type: design',
    'status: drafted',
    'date: 2026-07-07',
    'title: sample design',
    'format: human-readable-design',
    'sharded: false',
    '---',
    '',
    '# Design: sample design',
    '',
    '## Source',
    '',
    '## AI Parse Contract',
    '',
    '- canonicalKind: design',
    '- humanEquivalent: true',
    '- stableIdsRequired: true',
    '- noImplicitScope: true',
    '',
    '## Split Manifest',
    '',
    '- mode: unified',
    '- root: docs/ae/designs/sample-2026-07-07',
    '- files:',
    '  - design.md',
    '',
    '## Overview',
    '',
    '- Goal: sample',
    '- Required dimensions: overview, architecture, test-cases',
    '- Explicit omitted dimensions: api: explicitly-omitted - no public API change; database: explicitly-omitted - no persistence change',
    '',
    '## Implementation Constraints',
    '',
    '- Repository paths: scripts/check-design-contract.mjs',
    '- Runtime/build commands: node scripts/check-design-contract.mjs',
    '',
    '## Decisions',
    '',
    '### ADR-001 - Keep validation local',
    '',
    '- Decision: Use a local script.',
    '- Drivers: No external dependency.',
    '',
    '## Mapping Tables',
    '',
    '### api-field-to-database-column-mapping',
    '',
    '| EP ID | API field | T ID | Data field | Notes |',
    '| --- | --- | --- | --- | --- |',
    '| EP-001 | n/a | T-001 | n/a | No API/database mapping. |',
    '',
    '### api-error-to-ui-state-mapping',
    '',
    '| EP ID | Error/status | ST ID | UI state | User-visible behavior |',
    '| --- | --- | --- | --- | --- |',
    '| EP-001 | n/a | ST-001 | n/a | No UI error state. |',
    '',
    '### test-case-to-contract-coverage',
    '',
    '| TC ID | Scenario | Covered IDs | Verification signal |',
    '| --- | --- | --- | --- |',
    '| TC-001 | Valid contract | ADR-001 | checker exits 0 |',
    '',
    '### ui-component-to-api-endpoint-mapping',
    '',
    '| Component/route | ST ID | EP ID | Data dependency |',
    '| --- | --- | --- | --- |',
    '| n/a | ST-001 | EP-001 | none |',
    '',
    '## Architecture',
    '',
    '## API',
    '',
    '### EP-001 - No public endpoint',
    '',
    '## Database',
    '',
    '### T-001 - No persistent data',
    '',
    '## UI/UX',
    '',
    '### ST-001 - No UI state',
    '',
    '## Test Cases',
    '',
    '### TC-001 - Valid contract passes',
    '',
    '- Priority: P1',
    '- Covered IDs: ADR-001, EP-001, T-001, ST-001',
    '',
    '## Security',
    '',
    '## Observability',
    '',
    '## Non-Functional',
    '',
    '## Consistency Check',
    '',
    '- requiredDimensionsCovered: true',
    '- omittedDimensionsJustified: true',
    '- stableIdsUnique: true',
    '- mappingTablesComplete: true',
    '- sourceScopePreserved: true',
    '- reviewStatus: not-run',
    '',
  ]
}
