import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { renderYaml, skillMetadata } from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

test('renderYaml emits implementation metadata for ae-web-app', () => {
  const yaml = renderYaml(skillMetadata['ae-web-app'], 'zh-CN')
  assert.match(yaml, /display_name: "AE Web 应用开发"/)
  assert.match(skillMetadata['ae-web-app'].en, /Implement Web app flows selected by ae-web-forge/)
  assert.doesNotMatch(skillMetadata['ae-web-app'].en, /four-question routing/i)
  assert.match(yaml, /default_prompt: "使用 \$ae-web-app 实现这个 Web 应用流程。"/)
})

test('renderYaml emits bilingual metadata for ae-help', () => {
  const yaml = renderYaml(skillMetadata['ae-help'], 'bilingual')
  assert.match(yaml, /display_name: "AE 帮助 \/ AE Help"/)
  assert.match(yaml, /short_description: "查看 Codex 中可用的 AE 工作流能力 \/ List AE workflow capabilities for Codex"/)
})

test('renderYaml supports Computer Use video skills in all language modes', () => {
  const skills = [
    ['ae-computer-use-guard', 'AE Computer Use Guard', 'AE 电脑控制约束'],
    ['ae-imagegen-prompt', 'AE Imagegen Prompt', 'AE 图片生成提示词'],
    ['ae-video-edit-computer', 'AE Video Edit Computer', 'AE 电脑剪辑视频'],
  ]

  for (const [skillName, englishLabel, chineseLabel] of skills) {
    const englishYaml = renderYaml(skillMetadata[skillName], 'en')
    const chineseYaml = renderYaml(skillMetadata[skillName], 'zh-CN')
    const bilingualYaml = renderYaml(skillMetadata[skillName], 'bilingual')

    assert.match(englishYaml, new RegExp(`display_name: "${englishLabel}"`))
    assert.match(chineseYaml, new RegExp(`display_name: "${chineseLabel}"`))
    assert.match(bilingualYaml, new RegExp(`display_name: "${chineseLabel} / ${englishLabel}"`))
  }
})

test('renderYaml supports Claude Code delegation metadata', () => {
  const englishYaml = renderYaml(skillMetadata['ae-claude-code'], 'en')
  const chineseYaml = renderYaml(skillMetadata['ae-claude-code'], 'zh-CN')
  const bilingualYaml = renderYaml(skillMetadata['ae-claude-code'], 'bilingual')

  assert.match(englishYaml, /display_name: "AE Claude Code"/)
  assert.match(englishYaml, /short_description: "Use local Claude Code CLI as a controlled external worker"/)
  assert.match(chineseYaml, /display_name: "AE Claude Code"/)
  assert.match(bilingualYaml, /AE Claude Code/)
})

test('renderYaml supports markitdown and static server metadata', () => {
  const markitdownYaml = renderYaml(skillMetadata['ae-markitdown'], 'en')
  const staticServerYaml = renderYaml(skillMetadata['ae-static-server'], 'en')

  assert.match(markitdownYaml, /display_name: "AE Markitdown"/)
  assert.match(markitdownYaml, /Convert local files to Markdown/)
  assert.match(staticServerYaml, /display_name: "AE Static Server"/)
  assert.match(staticServerYaml, /Serve local static files/)
})

test('check-skill-mirror reports ok', () => {
  const result = runNodeScript('scripts/check-skill-mirror.mjs')
  assert.equal(result.status, 'ok')
  assert.ok(result.fileCount > 0)
})

test('root package and plugin manifest keep synchronized distribution versions', () => {
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))
  const pluginManifest = JSON.parse(readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/.codex-plugin/plugin.json'), 'utf8'))

  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/)
  assert.equal(pluginManifest.version, packageJson.version)
})

test('check-skill-language-metadata reports ok', () => {
  const result = runNodeScript('scripts/check-skill-language-metadata.mjs')
  assert.equal(result.status, 'ok')
  assert.equal(result.skillCount, result.metadataCount)
})

test('check-skill-contract reports ok without external dependencies', () => {
  const result = runNodeScript('scripts/check-skill-contract.mjs')
  assert.equal(result.status, 'ok')
  assert.equal(result.skillCount, result.checkedSkills)
  assert.equal(result.errors.length, 0)
})

test('skill roots contain only ae-* skill directories', () => {
  for (const root of ['plugins/ai-agent-engine-codex/skills', '.agents/skills']) {
    const invalidEntries = readdirSync(resolve(repoRoot, root), { withFileTypes: true })
      .filter((entry) => !entry.isDirectory() || !entry.name.startsWith('ae-'))
      .map((entry) => entry.name)

    assert.deepEqual(invalidEntries, [], `${root} should contain only ae-* skill directories`)
  }
})

test('OfficeCLI skills are removed from active metadata', () => {
  assert.equal(skillMetadata['ae-officecli'], undefined)
  assert.equal(skillMetadata['ae-docx'], undefined)
  assert.equal(skillMetadata['ae-xlsx'], undefined)
  assert.equal(skillMetadata['ae-pptx'], undefined)
})

test('renderYaml supports Spec Kit inspired workflow metadata', () => {
  const constitutionYaml = renderYaml(skillMetadata['ae-constitution'], 'en')
  const tasksYaml = renderYaml(skillMetadata['ae-tasks'], 'en')
  assert.match(constitutionYaml, /display_name: "AE Constitution"/)
  assert.match(constitutionYaml, /project governance/)
  assert.match(tasksYaml, /display_name: "AE Tasks"/)
  assert.match(tasksYaml, /dependency-ordered/)
})

test('Ponytail-inspired minimality guidance is present in source and mirror skills', () => {
  const expectedBySkill = {
    'ae-work': [
      /## Minimality Gate/,
      /Prefer standard library, framework, database, browser, shell, or platform-native capabilities over custom code\./,
      /Do not leave open-ended "later" notes\./,
    ],
    'ae-review': [
      /## Complexity Lane/,
      /`delete`/,
      /`stdlib`/,
      /`native`/,
      /`yagni`/,
      /`shrink`/,
      /expected impact/,
      /Do not flag narrow tests, trust-boundary validation, security controls, accessibility basics, or explicit user requirements as bloat\./,
    ],
    'ae-plan': [
      /simplest viable route/,
      /New dependencies, abstractions, broad refactors, or extra files need a current requirement or repository pattern/,
      /speculative future flexibility/,
    ],
    'ae-task-loop': [
      /smallest plausible change/,
      /Broaden scope only when the latest evidence invalidates the smaller fix\./,
      /Do not remove validation, trust-boundary checks, security controls, or explicit user requirements merely to make the fix smaller\./,
    ],
  }

  for (const [skillName, expectations] of Object.entries(expectedBySkill)) {
    const sourceBody = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirrorBody = readSkillBody('.agents/skills', skillName)
    assert.equal(mirrorBody, sourceBody, `${skillName} mirror should match plugin source`)
    for (const expectation of expectations) {
      assert.match(sourceBody, expectation, `${skillName} should include ${expectation}`)
    }
  }
})

test('task loop dual completion gate requires verification and non-blocking review', () => {
  const source = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-task-loop')
  const mirror = readSkillBody('.agents/skills', 'ae-task-loop')

  assert.equal(mirror, source, 'ae-task-loop mirror should match plugin source')
  for (const expectation of [
    /## Candidate Success Review Gate/,
    /success criteria.*review.*no blocking findings/is,
    /both gates.*independent/is,
    /blocking findings.*next fix hypothesis/is,
    /review.*unavailable.*blocked or unverified/is,
    /review status/,
  ]) {
    assert.match(source, expectation, `ae-task-loop should include ${expectation}`)
  }
  assert.doesNotMatch(source, /mode=autofix/i)
  assert.doesNotMatch(source, /OpenCode/i)
})

test('local runtime smoke gate is shared by execution skills without secret transport claims', () => {
  const referencePaths = [
    'plugins/ai-agent-engine-codex/skills/ae-work/references/local-runtime-smoke-gate.md',
    '.agents/skills/ae-work/references/local-runtime-smoke-gate.md',
  ]
  const sourceReference = readFileSync(resolve(repoRoot, referencePaths[0]), 'utf8')
  const mirrorReference = readFileSync(resolve(repoRoot, referencePaths[1]), 'utf8')

  assert.equal(mirrorReference, sourceReference, 'local runtime smoke gate mirror should match plugin source')
  for (const expectation of [
    /start, execute, automatically run, smoke test, bubble test, or locally integrate/i,
    /restart or hot-reload rule/i,
    /read-only or state-changing/i,
    /user-controlled local secret reference/i,
    /proactively create a token-free request template/i,
    /verified ignored project path or in the operating system temporary directory/i,
    /report its absolute path and wait for the user to populate it locally and confirm readiness/i,
    /must not open, read, write, print, or validate the populated reference/i,
    /pass its absolute path to a client option that consumes the reference without echoing its contents/i,
    /must not be copied into command text, patches, logs, agent-written files, or tool stdin/i,
    /Do not repeatedly ask for a prerequisite that the user already confirmed/i,
    /run the bounded request once by referencing the populated secret path or environment variable/i,
    /4xx, 5xx, transport failure, or business error/i,
    /Archive only this sanitized execution evidence/i,
    /never archive, commit, relocate, or expose a secret reference/i,
    /not a secret manager/i,
  ]) {
    assert.match(sourceReference, expectation, `local runtime smoke gate should include ${expectation}`)
  }
  assert.doesNotMatch(sourceReference, /Read-Host|write_stdin/i)

  for (const skillName of ['ae-work', 'ae-tdd', 'ae-debug', 'ae-task-loop']) {
    const source = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirror = readSkillBody('.agents/skills', skillName)
    assert.equal(mirror, source, `${skillName} mirror should match plugin source`)
    assert.match(source, /local runtime smoke gate/i, `${skillName} should route explicit runtime smoke to the shared gate`)
  }
})

test('OCR-inspired review guidance is present in source and mirror skills', () => {
  const reviewSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-review')
  const reviewMirror = readSkillBody('.agents/skills', 'ae-review')
  assert.equal(reviewMirror, reviewSource, 'ae-review mirror should match plugin source')

  for (const expectation of [
    /## Diff Review Discipline/,
    /from:<ref>/,
    /full:<path>/,
    /manual position check/i,
    /contradiction check/i,
    /code-review-rule-profiles\.md/,
  ]) {
    assert.match(reviewSource, expectation, `ae-review should include ${expectation}`)
  }

  const profileSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-review/references/code-review-rule-profiles.md'), 'utf8')
  const profileMirror = readFileSync(resolve(repoRoot, '.agents/skills/ae-review/references/code-review-rule-profiles.md'), 'utf8')
  assert.equal(profileMirror, profileSource, 'ae-review rule profile mirror should match plugin source')

  for (const expectation of [
    /## Java \/ JVM/,
    /## TypeScript \/ JavaScript \/ React/,
    /## package\.json/,
    /## JSON \/ YAML \/ Config/,
  ]) {
    assert.match(profileSource, expectation, `rule profiles should include ${expectation}`)
  }

  const auditSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-skill-audit')
  const auditMirror = readSkillBody('.agents/skills', 'ae-skill-audit')
  assert.equal(auditMirror, auditSource, 'ae-skill-audit mirror should match plugin source')
  assert.match(auditSource, /Deterministic Engineering/i)
  assert.match(auditSource, /license compatibility/i)

  const auditTemplateSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md'), 'utf8')
  const auditTemplateMirror = readFileSync(resolve(repoRoot, '.agents/skills/ae-skill-audit/references/audit-template.md'), 'utf8')
  assert.equal(auditTemplateMirror, auditTemplateSource, 'ae-skill-audit template mirror should match plugin source')
  assert.match(auditTemplateSource, /## Deterministic Engineering Patterns/)
  assert.match(auditTemplateSource, /## License Compatibility/)
  assert.match(auditTemplateSource, /Source URL:/)
  assert.match(auditTemplateSource, /git ls-remote/)
  assert.match(auditTemplateSource, /Observed commit:/)
  assert.match(auditTemplateSource, /Ref source:/)
  assert.match(auditTemplateSource, /Commit status: current \/ commitMismatch \/ unreachable-short-hash/)
  assert.match(auditTemplateSource, /Inspected files:/)
  assert.match(auditTemplateSource, /portable method/)
  assert.match(auditTemplateSource, /local deterministic mechanism/)
  assert.match(auditTemplateSource, /runtime-specific behavior/)
})

test('Claude Code best practice adaptation guidance is present in source and mirror skills', () => {
  const expectedBySkill = {
    'ae-skill-audit': [
      /Runtime Boundary Filter/i,
      /source freshness/i,
      /git ls-remote/,
      /observedCommit/,
      /refSource/,
      /inspected files/i,
      /unreachable-short-hash/,
      /portable method/i,
      /local deterministic mechanism/i,
      /runtime-specific behavior/i,
      /license/i,
    ],
    'ae-skill-creator': [
      /Extension Routing Matrix/i,
      /Codex skill/i,
      /helper script/i,
      /reference\/template/i,
      /reject/i,
    ],
    'ae-agent-creator': [
      /Agent Prompt Routing/i,
      /prompt\/template/i,
      /helper script/i,
      /not an auto-registered/i,
    ],
    'ae-claude-code': [
      /Cross-Directory Read-Only Delegation/i,
      /--add-dir/,
      /--tools "Read,Grep,Glob"/,
      /empty stdout/i,
    ],
    'ae-plan': [
      /Optional Cross-Model Lane/i,
      /untrusted advice/i,
      /Codex remains the orchestrator/i,
    ],
    'ae-review': [
      /Second-Model Evidence/i,
      /verified finding/i,
      /untrusted advice/i,
    ],
    'ae-save-experience': [
      /Memory Placement/i,
      /AGENTS\.md/,
      /docs\/08-ai-memory/,
      /process notes/i,
    ],
  }

  for (const [skillName, expectations] of Object.entries(expectedBySkill)) {
    const sourceBody = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirrorBody = readSkillBody('.agents/skills', skillName)
    assert.equal(mirrorBody, sourceBody, `${skillName} mirror should match plugin source`)
    for (const expectation of expectations) {
      assert.match(sourceBody, expectation, `${skillName} should include ${expectation}`)
    }
  }
})

test('agent skill audit optimization guidance is present in references and mirrored skills', () => {
  const fiveLayerReference = readFileSync(resolve(repoRoot, 'docs/ae/references/codex-five-layer-architecture.md'), 'utf8')
  for (const expectation of [
    /Memory Layer/,
    /Knowledge Layer/,
    /Guardrail Layer/,
    /Delegation Layer/,
    /Distribution Layer/,
    /Unsupported runtime assumptions/,
  ]) {
    assert.match(fiveLayerReference, expectation, `five-layer reference should include ${expectation}`)
  }

  const invariantReference = readFileSync(resolve(repoRoot, 'docs/ae/references/agent-engineering-invariants.md'), 'utf8')
  for (const expectation of [
    /Surface assumptions before editing/,
    /Choose the simplest sufficient route/,
    /Keep edits surgical/,
    /Define verifiable goals/,
    /Claim evidence before confidence/,
  ]) {
    assert.match(invariantReference, expectation, `engineering invariants should include ${expectation}`)
  }

  const integrityReadme = readFileSync(resolve(repoRoot, 'docs/ae/integrity/README.md'), 'utf8')
  assert.match(integrityReadme, /claim corrections/i)
  assert.match(integrityReadme, /retractions/i)
  assert.match(integrityReadme, /methodology fixes/i)

  const expectedBySkill = {
    'ae-skill-audit': [
      /claim provenance/i,
      /evidence ledger/i,
      /unsupported runtime assumptions/i,
    ],
    'ae-prd': [
      /Evidence Expectations/i,
      /capability, benchmark, installation, or behavior claims/i,
      /separate assumptions from evidence/i,
    ],
    'ae-plan': [
      /Five-Layer Ownership/i,
      /Memory, Knowledge, Guardrail, Delegation, or Distribution/i,
      /claim-evidence/i,
    ],
    'ae-work': [
      /Claim-Evidence Mapping/i,
      /docs, README, installation behavior, capability claims, or skill behavior/i,
      /evidence path, validation command, or explicit assumption/i,
    ],
    'ae-review': [
      /Claim-Integrity Lane/i,
      /unsupported runtime behavior/i,
      /stale or unverifiable number/i,
    ],
    'ae-save-experience': [
      /Integrity Ledger Routing/i,
      /docs\/ae\/integrity/i,
      /Do not bury retractions/i,
    ],
  }

  for (const [skillName, expectations] of Object.entries(expectedBySkill)) {
    const sourceBody = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirrorBody = readSkillBody('.agents/skills', skillName)
    assert.equal(mirrorBody, sourceBody, `${skillName} mirror should match plugin source`)
    for (const expectation of expectations) {
      assert.match(sourceBody, expectation, `${skillName} should include ${expectation}`)
    }
  }
})

test('SkillOpt audit filter guidance is present in source and mirror skills', () => {
  const auditSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-skill-audit')
  const auditMirror = readSkillBody('.agents/skills', 'ae-skill-audit')
  assert.equal(auditMirror, auditSource, 'ae-skill-audit mirror should match plugin source')

  for (const expectation of [
    /Skill Optimization Pattern Filter/,
    /trajectory source/i,
    /bounded edit shape/i,
    /validation gate/i,
    /rejected-update handling/i,
    /staging and adoption/i,
    /AE validation mapping/i,
    /ungated live mutation/i,
    /auto-adoption without review/i,
  ]) {
    assert.match(auditSource, expectation, `ae-skill-audit should include ${expectation}`)
  }

  const auditTemplateSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md'), 'utf8')
  const auditTemplateMirror = readFileSync(resolve(repoRoot, '.agents/skills/ae-skill-audit/references/audit-template.md'), 'utf8')
  assert.equal(auditTemplateMirror, auditTemplateSource, 'ae-skill-audit template mirror should match plugin source')

  for (const expectation of [
    /## Skill Optimization Pattern Filter/,
    /Optimization claim:/,
    /Trajectory source: real sessions \/ synthetic tasks \/ benchmark split \/ user task file \/ unverifiable demo/,
    /Held-out validation or gate:/,
    /Gate metric and accept rule:/,
    /Candidate edit shape: add \/ replace \/ delete \/ full rewrite \/ memory append \/ live mutation/,
    /Rejected update handling:/,
    /Staging and adoption policy:/,
    /AE validation mapping: mirror check \/ skill contract check \/ claim check \/ gate proof \/ future replay suite/,
    /Direct adoption blockers:/,
    /Safe AE rewrite:/,
  ]) {
    assert.match(auditTemplateSource, expectation, `audit template should include ${expectation}`)
  }
})

test('PRD and plan artifact contracts are present in source and mirror skills', () => {
  const expectationsByFile = [
    ['plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md', '.agents/skills/ae-prd/SKILL.md', [
      /format: human-readable-requirements/,
      /sharded: false/,
      /AI Parse Contract/,
      /stable requirement IDs/i,
      /originFingerprint/,
      /Consistency Check/i,
    ]],
    [
      'plugins/ai-agent-engine-codex/skills/ae-brainstorm/references/requirements-capture.md',
      '.agents/skills/ae-brainstorm/references/requirements-capture.md',
      [
        /format: human-readable-requirements/,
        /canonicalKind: requirements/,
        /stableIdsRequired: true/,
        /R1/,
        /NFR1/,
        /D1/,
        /requirementsCount/,
      ],
    ],
    ['plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md', '.agents/skills/ae-plan/SKILL.md', [
      /format: human-readable-plan/,
      /sharded: false/,
      /canonicalKind: plan/,
      /originFingerprint/,
      /source requirement ID/i,
      /forbidden files/i,
    ]],
    [
      'plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md',
      '.agents/skills/ae-plan/references/plan-template.md',
      [
        /format: human-readable-plan/,
        /canonicalKind: plan/,
        /stableIdsRequired: true/,
        /implementationUnitCount/,
        /sourceRequirementsCovered/,
        /origin.*originFingerprint/s,
      ],
    ],
  ]

  for (const [sourcePath, mirrorPath, expectations] of expectationsByFile) {
    const source = readFileSync(resolve(repoRoot, sourcePath), 'utf8')
    const mirror = readFileSync(resolve(repoRoot, mirrorPath), 'utf8')
    assert.equal(mirror, source, `${mirrorPath} should match ${sourcePath}`)
    for (const expectation of expectations) {
      assert.match(source, expectation, `${sourcePath} should include ${expectation}`)
    }
  }
})

test('upstream PRD reference sync keeps required references and source freshness current', () => {
  const expectedUpstreamCommit = '76d832c96a1c810410982bf28b425a3aedb461ab'
  const referencePaths = [
    'plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md',
    '.agents/skills/ae-prd/references/requirements-capture.md',
    'plugins/ai-agent-engine-codex/skills/ae-prd/references/handoff.md',
    '.agents/skills/ae-prd/references/handoff.md',
  ]

  for (const referencePath of referencePaths) {
    assert.ok(existsSync(resolve(repoRoot, referencePath)), `${referencePath} should exist`)
  }

  const sourceRequirements = readFileSync(resolve(repoRoot, referencePaths[0]), 'utf8')
  const mirrorRequirements = readFileSync(resolve(repoRoot, referencePaths[1]), 'utf8')
  assert.equal(mirrorRequirements, sourceRequirements, 'ae-prd requirements capture mirror should match plugin source')
  for (const expectation of [
    /canonicalKind: requirements/,
    /format: human-readable-requirements/,
    /stableIdsRequired: true/,
    /requirementsCount/,
    /Do not include implementation details/i,
  ]) {
    assert.match(sourceRequirements, expectation, `requirements capture should include ${expectation}`)
  }

  const sourceHandoff = readFileSync(resolve(repoRoot, referencePaths[2]), 'utf8')
  const mirrorHandoff = readFileSync(resolve(repoRoot, referencePaths[3]), 'utf8')
  assert.equal(mirrorHandoff, sourceHandoff, 'ae-prd handoff mirror should match plugin source')
  assert.match(sourceHandoff, /Codex-native handoff/i)
  assert.match(sourceHandoff, /ae-plan/)
  assert.doesNotMatch(sourceHandoff, /opencode/i)

  for (const catalogPath of [
    'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json',
    '.agents/skills/ae-help/references/capability-catalog.json',
  ]) {
    const catalog = JSON.parse(readFileSync(resolve(repoRoot, catalogPath), 'utf8'))
    assert.equal(catalog.source.observedCommit, expectedUpstreamCommit, `${catalogPath} should record observed upstream HEAD`)
  }
})

test('upstream brainstorm and web workflow modernization is reflected in source and mirror skills', () => {
  const brainstormSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-brainstorm')
  const brainstormMirror = readSkillBody('.agents/skills', 'ae-brainstorm')
  assert.equal(brainstormMirror, brainstormSource, 'ae-brainstorm mirror should match plugin source')
  for (const expectation of [
    /Perspective Collision Pass/i,
    /perspective matrix/i,
    /fact disagreement/i,
    /value disagreement/i,
    /assumption disagreement/i,
    /collision insights/i,
    /blind spots/i,
    /thinking preservation zone/i,
    /deepening directions/i,
  ]) {
    assert.match(brainstormSource, expectation, `ae-brainstorm should include ${expectation}`)
  }

  const frontendSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-frontend-design')
  const frontendMirror = readSkillBody('.agents/skills', 'ae-frontend-design')
  assert.equal(frontendMirror, frontendSource, 'ae-frontend-design mirror should match plugin source')
  assert.match(frontendSource, /Frontend Design And UI Implementation/i)
  assert.match(frontendSource, /design input/i)
  assert.match(frontendSource, /visual baseline/i)
  assert.doesNotMatch(frontendSource, /Build the first usable frontend version\./)

  const webSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-web-app')
  const webMirror = readSkillBody('.agents/skills', 'ae-web-app')
  assert.equal(webMirror, webSource, 'ae-web-app mirror should match plugin source')
  for (const expectation of [
    /implementation skill/i,
    /selected by `ae-web-forge`/i,
    /state, forms, API calls, auth, persistence, or error handling/i,
    /ae-test-browser/,
    /Do not claim OpenCode sub-agent registry/i,
  ]) {
    assert.match(webSource, expectation, `ae-web-app should include ${expectation}`)
  }
  assert.doesNotMatch(webSource, /## Four-Question Web Routing/i)
  assert.doesNotMatch(webSource, /Q1.*second-development/is)
  assert.doesNotMatch(webSource, /Q2.*design input/is)
  assert.doesNotMatch(webSource, /Q3.*interaction.*API/is)
  assert.doesNotMatch(webSource, /Q4.*visual baseline/is)

  const metadata = skillMetadata['ae-frontend-design']
  assert.equal(metadata.display.zh, 'AE 前端设计')
  assert.match(metadata.en, /Design and implement frontend UI/)
  assert.match(metadata.zh, /前端设计与界面实现/)
  assert.doesNotMatch(metadata.zh, /首版|初版/)

  for (const catalogPath of [
    'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json',
    '.agents/skills/ae-help/references/capability-catalog.json',
  ]) {
    const catalogText = readFileSync(resolve(repoRoot, catalogPath), 'utf8')
    assert.match(catalogText, /前端设计与界面实现/)
    assert.match(catalogText, /四问题路由/)
    assert.match(catalogText, /ae-web-forge.*统一前端\/Web 路由/s)
    assert.match(catalogText, /ae-web-app.*Web 应用实现/s)
    assert.doesNotMatch(catalogText, /前端初版/)
  }

  const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
  assert.match(readme, /`ae-frontend-design`：前端设计与界面实现/)
  assert.match(readme, /`ae-web-forge`：统一前端\/Web 路由入口/)
  assert.match(readme, /`ae-web-app`：实现由 `ae-web-forge` 路由后的 Web 应用/)
  assert.doesNotMatch(readme, /`ae-web-app`：基于四问题路由/)
  assert.doesNotMatch(readme, /`ae-frontend-design`：交付可用的前端初版。/)
})

test('design and web forge skill contracts are present in source, mirror, metadata, and docs', () => {
  const designSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-design')
  const designMirror = readSkillBody('.agents/skills', 'ae-design')
  assert.equal(designMirror, designSource, 'ae-design mirror should match plugin source')
  for (const expectation of [
    /docs\/ae\/designs/,
    /PRD input/i,
    /old design input/i,
    /bare-description fallback/i,
    /risk-based dimension triggers/i,
    /explicit omitted dimensions/i,
    /ADR-XXX/,
    /EP-XXX/,
    /T-XXX/,
    /TC-XXX/,
    /ST-XXX/,
    /cross-dimension mapping/i,
    /ae-review domain:document/i,
    /does not implement code/i,
  ]) {
    assert.match(designSource, expectation, `ae-design should include ${expectation}`)
  }

  const designTemplateSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md'), 'utf8')
  const designTemplateMirror = readFileSync(resolve(repoRoot, '.agents/skills/ae-design/references/design-contract-template.md'), 'utf8')
  assert.equal(designTemplateMirror, designTemplateSource, 'ae-design template mirror should match plugin source')
  for (const expectation of [
    /AI Parse Contract/,
    /Split Manifest/,
    /Implementation Constraints/,
    /Mapping Tables/,
    /Consistency Check/,
  ]) {
    assert.match(designTemplateSource, expectation, `ae-design template should include ${expectation}`)
  }

  const forgeSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-web-forge')
  const forgeMirror = readSkillBody('.agents/skills', 'ae-web-forge')
  assert.equal(forgeMirror, forgeSource, 'ae-web-forge mirror should match plugin source')
  for (const expectation of [
    /target existence check/i,
    /Q1.*existing route/is,
    /Q2.*design input/is,
    /Q3.*backend|Q3.*API/is,
    /Q4.*visual baseline/is,
    /ae-frontend-design/,
    /ae-web-app/,
    /ae-test-browser/,
    /max 3 rework loops/i,
    /Do not claim OpenCode sub-agent registry/i,
    /dynamic Chrome MCP/i,
    /slash command behavior/i,
  ]) {
    assert.match(forgeSource, expectation, `ae-web-forge should include ${expectation}`)
  }

  const expectedMetadata = [
    ['ae-design', /Design contract/, /设计契约/],
    ['ae-web-forge', /frontend\/web routing/i, /前端.*Web.*路由/],
  ]
  for (const [skillName, enExpectation, zhExpectation] of expectedMetadata) {
    assert.match(skillMetadata[skillName].en, enExpectation, `${skillName} should have English metadata`)
    assert.match(skillMetadata[skillName].zh, zhExpectation, `${skillName} should have Chinese metadata`)
  }

  for (const catalogPath of [
    'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json',
    '.agents/skills/ae-help/references/capability-catalog.json',
  ]) {
    const catalog = JSON.parse(readFileSync(resolve(repoRoot, catalogPath), 'utf8'))
    const skillNames = catalog.skills.map((skill) => skill.name)
    assert.ok(skillNames.includes('ae-design'), `${catalogPath} should include ae-design`)
    assert.ok(skillNames.includes('ae-web-forge'), `${catalogPath} should include ae-web-forge`)
    assert.equal(catalog.artifactPaths.designs, 'docs/ae/designs')
  }

  const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
  const readmeEn = readFileSync(resolve(repoRoot, 'README.en.md'), 'utf8')
  assert.match(readme, /`ae-design`：.*设计契约/)
  assert.match(readme, /`ae-web-forge`：.*Web.*路由/)
  assert.match(readmeEn, /`ae-design`: .*design contract/i)
  assert.match(readmeEn, /`ae-web-forge`: .*frontend\/web routing/i)
})

test('check-install-smoke reports ok and verifies new skills', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.ok(result.verifiedCommands.includes('recovery'))
  assert.ok(result.verifiedCommands.includes('claude-delegate'))
  assert.ok(result.verifiedCommands.includes('check-ae-artifacts'))
  assert.ok(result.verifiedCommands.includes('check-design-contract'))
  assert.deepEqual(result.verifiedSkills, [
    'ae-prd',
    'ae-work-report',
    'ae-task-loop',
    'ae-constitution',
    'ae-tasks',
    'ae-design',
    'ae-web-app',
    'ae-web-forge',
    'ae-backend',
    'ae-debug',
    'ae-tdd',
    'ae-claude-code',
    'ae-markitdown',
    'ae-static-server',
    'ae-computer-use-guard',
    'ae-imagegen-prompt',
    'ae-video-edit-computer',
  ])
})

test('claude-delegate availability check returns ok or skip', () => {
  const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--check'])
  assert.match(result.status, /^(ok|skip)$/)
  assert.equal(typeof result.available, 'boolean')
  assert.equal(result.write_policy, 'codex-reviewed')
})

test('claude-delegate prompt mode skips safely when Claude is unavailable', () => {
  const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--prompt', 'Summarize the repo.'])
  assert.match(result.status, /^(ok|skip|failed)$/)
  assert.equal(typeof result.available, 'boolean')
  if (!result.available) {
    assert.equal(result.status, 'skip')
    assert.match(result.reason, /claude/)
  }
})

test('claude-delegate supports Windows cmd shims', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-shim-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 test-shim',
      '  exit /b 0',
      ')',
      'echo shim-output:%*',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--check', '--command', shimPath])
    assert.equal(result.status, 'ok')
    assert.equal(result.available, true)
    assert.match(result.version, /9\.9\.9 test-shim/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('claude-delegate discovers Windows cmd shims on PATH', { skip: process.platform !== 'win32' }, () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-path-shim-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 path-shim',
      '  exit /b 0',
      ')',
      'echo path-shim-output:%*',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--check'], repoRoot, {
      PATH: `${tempRoot};${process.env.PATH || ''}`,
    })
    assert.equal(result.status, 'ok')
    assert.equal(result.available, true)
    assert.equal(result.command, 'claude.cmd')
    assert.match(result.version, /9\.9\.9 path-shim/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('claude-delegate sends default prompts through stdin', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-prompt-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 test-shim',
      '  exit /b 0',
      ')',
      'set /p PROMPT=',
      'echo shim-prompt:%PROMPT%',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--prompt', 'AE_CLAUDE_OK', '--command', shimPath])
    assert.equal(result.status, 'ok')
    assert.deepEqual(result.args, ['-p'])
    assert.match(result.stdout, /shim-prompt:AE_CLAUDE_OK/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('claude-delegate reports no-output diagnostics', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-claude-no-output-'))
  try {
    const shimPath = join(tempRoot, 'claude.cmd')
    writeFileSync(shimPath, [
      '@echo off',
      'if "%1"=="--version" (',
      '  echo 9.9.9 no-output-shim',
      '  exit /b 0',
      ')',
      'exit /b 0',
      '',
    ].join('\r\n'), 'utf8')
    chmodSync(shimPath, 0o755)

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'claude-delegate', '--prompt', 'NO_OUTPUT', '--command', shimPath])
    assert.equal(result.status, 'ok')
    assert.equal(result.stdout, '')
    assert.equal(result.stderr, '')
    assert.ok(Array.isArray(result.diagnostics))
    assert.ok(result.diagnostics.some((diagnostic) => /no output/i.test(diagnostic)))
    assert.ok(result.diagnostics.some((diagnostic) => /--add-dir|--tools|--claude-arg/i.test(diagnostic)))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('help can find Claude Code delegation capability', () => {
  const output = runNodeScriptRaw('node scripts/ae-tools.mjs help claude')
  assert.match(output, /ae-claude-code/)
  assert.match(output, /claude-delegate/)
})

test('help can find markitdown and static server capabilities', () => {
  const markitdownOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help markitdown')
  assert.match(markitdownOutput, /ae-markitdown/)
  assert.match(markitdownOutput, /markitdown/)

  const serverOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help static')
  assert.match(serverOutput, /ae-static-server/)
  assert.match(serverOutput, /static-server/)
})

test('tiered capability help groups every skill and preserves filtered output', () => {
  const sourcePath = resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json')
  const mirrorPath = resolve(repoRoot, '.agents/skills/ae-help/references/capability-catalog.json')
  const source = JSON.parse(readFileSync(sourcePath, 'utf8'))
  const mirror = JSON.parse(readFileSync(mirrorPath, 'utf8'))
  const expectedByTier = {
    core: ['ae-ideate', 'ae-brainstorm', 'ae-prd', 'ae-design', 'ae-lfg', 'ae-plan', 'ae-constitution', 'ae-tasks', 'ae-work', 'ae-refactor', 'ae-review', 'ae-frontend-design', 'ae-web-app', 'ae-web-forge', 'ae-backend', 'ae-debug', 'ae-task-loop', 'ae-tdd', 'ae-test-browser', 'ae-handoff'],
    docs: ['ae-doc-humanize', 'ae-doc-structure', 'ae-markitdown', 'ae-work-report'],
    tools: ['ae-claude-code', 'ae-sql', 'ae-swagger-parser', 'ae-static-server', 'ae-prompt-optimize', 'ae-save-experience'],
    meta: ['ae-help', 'ae-init', 'ae-skill-creator', 'ae-skill-audit', 'ae-agent-creator', 'ae-update', 'ae-language'],
  }

  assert.deepEqual(mirror, source, 'capability catalog mirror should match plugin source')
  assert.equal(source.source.observedCommit, '76d832c96a1c810410982bf28b425a3aedb461ab')
  assert.equal(source.source.license, 'GPL-3.0-or-later')
  assert.equal(source.skills.length, Object.values(expectedByTier).flat().length)
  for (const [tier, names] of Object.entries(expectedByTier)) {
    assert.deepEqual(source.skills.filter((skill) => skill.tier === tier).map((skill) => skill.name), names)
  }
  assert.deepEqual([...new Set(source.skills.map((skill) => skill.tier))].sort(), ['core', 'docs', 'meta', 'tools'])

  const fullOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help')
  const headings = ['### 核心工程流程 (core)', '### 文档处理 (docs)', '### 辅助工具 (tools)', '### 维护与配置 (meta)']
  let previousIndex = -1
  for (const heading of headings) {
    const index = fullOutput.indexOf(heading)
    assert.ok(index > previousIndex, `${heading} should appear in deterministic tier order`)
    previousIndex = index
  }

  const filteredOutput = runNodeScriptRaw('node scripts/ae-tools.mjs help design')
  assert.match(filteredOutput, /### 核心工程流程 \(core\)/)
  assert.doesNotMatch(filteredOutput, /### 文档处理 \(docs\)/)
  assert.doesNotMatch(filteredOutput, /### 辅助工具 \(tools\)/)
  assert.doesNotMatch(filteredOutput, /### 维护与配置 \(meta\)/)
})

test('installed language switching updates active skills for all supported modes', () => {
  const result = runNodeScript('scripts/check-install-smoke.mjs')
  assert.equal(result.status, 'ok')
  assert.deepEqual(result.verifiedLanguageModes, ['bilingual', 'en', 'zh-CN'])
  assert.equal(result.verifiedDefaultProfile, 'beginner+low_resource_2g4core_relay')
  assert.equal(result.verifiedHookPolicy, 'computer_use_requires_hooks')
  assert.equal(result.verifiedLocalToolPolicy, 'video_requires_ffmpeg_ffprobe_checks')
  assert.equal(result.verifiedMultiAgentPolicy, 'multi_agent_auto_analysis_by_default')
  assert.equal(result.verifiedSkillGovernancePolicy, 'source_mirror_metadata_and_path_safety')
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))
  assert.equal(result.verifiedPluginVersion, packageJson.version)
})

test('package check script omits OfficeCLI checks', () => {
  const packageJson = JSON.parse(runNodeScriptRaw('node -e "console.log(JSON.stringify(require(\'./package.json\')))"'))
  const checkScript = packageJson.scripts.check
  assert.doesNotMatch(checkScript, /node scripts\/check-officecli-available\.mjs/)
  assert.doesNotMatch(checkScript, /node scripts\/check-officecli-smoke\.mjs/)
  assert.match(checkScript, /node scripts\/check-ae-artifacts\.mjs/)
  assert.match(checkScript, /node scripts\/check-design-contract\.mjs/)
  assert.match(checkScript, /node scripts\/check-skill-contract\.mjs/)
  assert.match(checkScript, /node scripts\/ae-tools\.mjs ae-graph-build --root scripts/)
  assert.match(checkScript, /node scripts\/ae-tools\.mjs ae-graph-query --root scripts --path ae-tools\.mjs/)
})

test('renderYaml supports PRD, work report, and task loop metadata', () => {
  const skills = [
    ['ae-prd', 'AE PRD (ae-prd)'],
    ['ae-work-report', 'AE Work Report'],
    ['ae-task-loop', 'AE Task Loop'],
    ['ae-constitution', 'AE Constitution'],
    ['ae-tasks', 'AE Tasks'],
  ]

  for (const [skillName, englishLabel] of skills) {
    const yaml = renderYaml(skillMetadata[skillName], 'en')
    assert.ok(yaml.includes(`display_name: "${englishLabel}"`))
  }
})

test('core AE workflow metadata carries stable skill trigger signals', () => {
  const coreSkills = [
    'ae-brainstorm',
    'ae-lfg',
    'ae-plan',
    'ae-prd',
    'ae-review',
    'ae-work',
  ]

  for (const skillName of coreSkills) {
    const item = skillMetadata[skillName]
    const englishYaml = renderYaml(item, 'en')
    const bilingualYaml = renderYaml(item, 'bilingual')
    const sourceSkill = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirrorSkill = readSkillBody('.agents/skills', skillName)

    assert.match(englishYaml, new RegExp(`display_name: ".*${skillName}`))
    assert.match(englishYaml, new RegExp(`short_description: ".*${skillName}`))
    assert.match(englishYaml, new RegExp(`default_prompt: "Use \\$${skillName}`))
    assert.match(bilingualYaml, new RegExp(`default_prompt: ".*\\$${skillName}`))
    assert.equal(mirrorSkill, sourceSkill, `${skillName} mirror should match plugin source`)
    assert.match(sourceSkill, new RegExp(`/${skillName}`))
    assert.match(sourceSkill, new RegExp(`\\$${skillName}`))
    assert.match(sourceSkill, new RegExp(`use ${skillName}`, 'i'))
  }
})

test('Codex skill discoverability docs keep slash command boundary explicit', () => {
  const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
  const readmeEn = readFileSync(resolve(repoRoot, 'README.en.md'), 'utf8')
  const releaseChecklist = readFileSync(resolve(repoRoot, 'docs/release-checklist.md'), 'utf8')
  const helpSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md'), 'utf8')
  const helpMirror = readFileSync(resolve(repoRoot, '.agents/skills/ae-help/SKILL.md'), 'utf8')
  const catalogSource = JSON.parse(readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json'), 'utf8'))
  const catalogMirror = JSON.parse(readFileSync(resolve(repoRoot, '.agents/skills/ae-help/references/capability-catalog.json'), 'utf8'))

  assert.equal(helpMirror, helpSource, 'ae-help mirror should match plugin source')
  assert.deepEqual(catalogMirror.codexPort, catalogSource.codexPort, 'capability catalog mirror should match source boundary')
  assert.deepEqual(catalogMirror.notes, catalogSource.notes, 'capability catalog mirror notes should match source')

  for (const content of [readme, readmeEn, releaseChecklist, helpSource, JSON.stringify(catalogSource)]) {
    assert.match(content, /skill-backed discoverability|skill discoverability|skill 搜索|已启用 skills/i)
    assert.match(content, /OpenCode.*config\.command|config\.command.*OpenCode/i)
    assert.doesNotMatch(content, /AE automatically registers Codex slash commands/i)
    assert.doesNotMatch(content, /自动注册 Codex slash command/)
  }

  assert.match(releaseChecklist, /fresh Codex App thread|新 Codex App thread|新 Codex 线程/i)
  assert.match(releaseChecklist, /\$ae-plan/)
  assert.match(releaseChecklist, /\$ae-prd/)
})

test('swagger parses local YAML and resolves local schema refs', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-swagger-'))
  try {
    writeFileSync(join(tempRoot, 'openapi.yaml'), [
      'openapi: 3.0.0',
      'info:',
      '  title: YAML API',
      '  version: 1.0.0',
      'paths:',
      '  /users:',
      '    post:',
      '      tags: [users]',
      '      summary: Create user',
      '      requestBody:',
      '        content:',
      '          application/json:',
      '            schema:',
      '              $ref: "#/components/schemas/UserInput"',
      '      responses:',
      '        "200":',
      '          description: ok',
      'components:',
      '  schemas:',
      '    UserInput:',
      '      type: object',
      '      properties:',
      '        name:',
      '          type: string',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'swagger', 'openapi.yaml', 'method:POST', 'path:/users', 'mode:detail'], tempRoot)
    assert.equal(result.title, 'YAML API')
    assert.equal(result.openapi, '3.0.0')
    assert.equal(result.matched_operations, 1)
    assert.equal(result.operations[0].requestBody.content['application/json'].schema.type, 'object')
    assert.equal(result.operations[0].requestBody.content['application/json'].schema.properties.name.type, 'string')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('swagger parses YAML sequence objects used by parameters', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-swagger-'))
  try {
    writeFileSync(join(tempRoot, 'openapi.yaml'), [
      'openapi: 3.0.0',
      'info:',
      '  title: Common YAML API',
      '  version: 1.0.0',
      'paths:',
      '  /users/{id}:',
      '    get:',
      '      tags:',
      '        - users',
      '      summary: Get user',
      '      parameters:',
      '        - name: id',
      '          in: path',
      '          required: true',
      '          schema:',
      '            type: string',
      '      responses:',
      '        "200":',
      '          description: ok',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'swagger', 'openapi.yaml', 'method:GET', 'path:/users/{id}', 'mode:detail'], tempRoot)
    assert.equal(result.matched_operations, 1)
    assert.deepEqual(result.operations[0].tags, ['users'])
    assert.deepEqual(result.operations[0].parameters, [{
      name: 'id',
      in: 'path',
      required: true,
      description: null,
      schema: {
        type: 'string',
        format: null,
      },
    }])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts rejects invalid managed frontmatter', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'prds'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'prds', 'bad.md'), [
      '---',
      'type: prd',
      'status: active',
      'date: 2026-06-04',
      'topic: missing',
      '---',
      '# Bad PRD',
      '',
    ].join('\n'), 'utf8')

    const result = spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-ae-artifacts.mjs'), '--target', tempRoot], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /status/)
    assert.match(result.stderr, /prd/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts compatibility mode allows legacy pre-contract prd and plan', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/legacy-prd.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: legacy',
      '---',
      '# Legacy PRD',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/legacy-plan.md', [
      '---',
      'type: plan',
      'status: drafted',
      'date: 2026-06-23',
      'title: legacy',
      '---',
      '# Legacy Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /"status": "ok"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts compatibility mode allows historical target-project statuses', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/implemented-prd.md', [
      '---',
      'type: prd',
      'status: implemented',
      'date: 2026-06-30',
      'topic: implemented legacy prd',
      'format: human-readable-requirements',
      'sharded: false',
      '---',
      '# Implemented Legacy PRD',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/paused-plan.md', [
      '---',
      'type: plan',
      'status: archived-paused',
      'date: 2026-06-29',
      'title: paused legacy plan',
      'format: human-readable-plan',
      'sharded: false',
      '---',
      '# Paused Legacy Plan',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/reviewed-plan.md', [
      '---',
      'type: plan',
      'status: reviewed',
      'date: 2026-06-09',
      'title: reviewed legacy plan',
      '---',
      '# Reviewed Legacy Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /"status": "ok"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts compatibility mode rejects new contract artifact missing fields', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/plans/new-plan.md', [
      '---',
      'type: plan',
      'status: drafted',
      'date: 2026-06-24',
      'title: missing contract',
      '---',
      '# New Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /format/)
    assert.match(result.stderr, /sharded/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts strict mode rejects legacy artifact missing contract fields', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/legacy-prd.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: legacy',
      '---',
      '# Legacy PRD',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.notEqual(result.status, 0)
    assert.equal(JSON.parse(result.stderr).strict, true)
    assert.match(result.stderr, /format/)
    assert.match(result.stderr, /sharded/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts compatibility mode allows legacy partial origin lineage', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/partial-origin.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: partial origin',
      'origin: docs/source.md',
      '---',
      '# Partial Origin',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/prds/partial-fingerprint.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-23',
      'topic: partial fingerprint',
      'originFingerprint: legacy-fingerprint',
      '---',
      '# Partial Fingerprint',
      '',
    ])

    const compatibility = runAeArtifactCheck(tempRoot)
    assert.equal(compatibility.status, 0, compatibility.stderr)

    const strict = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.notEqual(strict.status, 0)
    assert.match(strict.stderr, /originFingerprint/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts rejects new partial origin lineage in compatibility and strict modes', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/partial-origin.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-24',
      'topic: partial origin',
      'format: human-readable-requirements',
      'sharded: false',
      'origin: docs/source.md',
      '---',
      '# Partial Origin',
      '',
    ])

    const compatibility = runAeArtifactCheck(tempRoot)
    assert.notEqual(compatibility.status, 0)
    assert.match(compatibility.stderr, /originFingerprint/)

    const strict = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.notEqual(strict.status, 0)
    assert.match(strict.stderr, /originFingerprint/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-ae-artifacts accepts valid new contract prd and plan artifacts', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-artifacts-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/prds/new-prd.md', [
      '---',
      'type: prd',
      'status: drafted',
      'date: 2026-06-24',
      'topic: new prd',
      'format: human-readable-requirements',
      'sharded: false',
      'origin: docs/source.md',
      'originFingerprint: sha256:abc123',
      '---',
      '# New PRD',
      '',
    ])
    writeAeArtifact(tempRoot, 'docs/ae/plans/new-plan.md', [
      '---',
      'type: plan',
      'status: drafted',
      'date: 2026-06-24',
      'title: new plan',
      'format: human-readable-plan',
      'sharded: false',
      'origin: docs/ae/prds/new-prd.md',
      'originFingerprint: sha256:def456',
      '---',
      '# New Plan',
      '',
    ])

    const result = runAeArtifactCheck(tempRoot, ['--strict'])
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /"status": "ok"/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-design-contract passes when no design artifacts exist', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-design-contract-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae'), { recursive: true })
    const result = runDesignContractCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    const output = JSON.parse(result.stdout)
    assert.equal(output.status, 'ok')
    assert.equal(output.checked, 0)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-design-contract accepts a valid design contract', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-design-contract-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/designs/sample-2026-07-07/design.md', validDesignContractLines())
    const result = runDesignContractCheck(tempRoot)
    assert.equal(result.status, 0, result.stderr)
    const output = JSON.parse(result.stdout)
    assert.equal(output.status, 'ok')
    assert.equal(output.checked, 1)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('check-design-contract rejects malformed design contracts with structured errors', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-design-contract-'))
  try {
    writeAeArtifact(tempRoot, 'docs/ae/designs/bad-2026-07-07/design.md', [
      '---',
      'type: design',
      'status: drafted',
      'date: 2026-07-07',
      'title: bad design',
      'format: human-readable-design',
      'sharded: false',
      '---',
      '# Design: bad design',
      '',
      '## Overview',
      '',
      '## Decisions',
      '',
      '### ADR-001 - First decision',
      '',
      '### ADR-001 - Duplicate decision',
      '',
    ])

    const result = runDesignContractCheck(tempRoot)
    assert.notEqual(result.status, 0)
    const output = JSON.parse(result.stderr)
    assert.equal(output.status, 'failed')
    assert.equal(output.checked, 1)
    assert.ok(output.errors.some((error) => error.field === 'section' && /AI Parse Contract/.test(error.message)))
    assert.ok(output.errors.some((error) => error.field === 'stableId' && /ADR-001/.test(error.message)))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('design contract semantic validation resolves mapping IDs and split files', () => {
  const danglingRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const traversalRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const missingRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const validSplitRoot = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  try {
    const danglingLines = validDesignContractLines().map((line) => line.replace('| EP-001 | n/a | T-001 |', '| EP-999 | n/a | T-001 |'))
    writeAeArtifact(danglingRoot, 'docs/ae/designs/sample-2026-07-07/design.md', danglingLines)
    const dangling = runDesignContractCheck(danglingRoot)
    assert.notEqual(dangling.status, 0)
    const danglingOutput = JSON.parse(dangling.stderr)
    assert.ok(danglingOutput.errors.some((error) => error.field === 'stableReference' && /EP-999/.test(error.message)))

    const traversalLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - ../outside.md'] : [line])
    writeAeArtifact(traversalRoot, 'docs/ae/designs/sample-2026-07-07/design.md', traversalLines)
    writeAeArtifact(traversalRoot, 'docs/ae/designs/outside.md', ['# Outside'])
    const traversal = runDesignContractCheck(traversalRoot)
    assert.notEqual(traversal.status, 0)
    const traversalOutput = JSON.parse(traversal.stderr)
    assert.ok(traversalOutput.errors.some((error) => error.field === 'splitManifest' && /stay inside/i.test(error.message)))

    const missingLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - missing.md'] : [line])
    writeAeArtifact(missingRoot, 'docs/ae/designs/sample-2026-07-07/design.md', missingLines)
    const missing = runDesignContractCheck(missingRoot)
    assert.notEqual(missing.status, 0)
    const missingOutput = JSON.parse(missing.stderr)
    assert.ok(missingOutput.errors.some((error) => error.field === 'splitManifest' && /does not exist/i.test(error.message)))

    const splitLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - api.md'] : [line])
    writeAeArtifact(validSplitRoot, 'docs/ae/designs/sample-2026-07-07/design.md', splitLines)
    writeAeArtifact(validSplitRoot, 'docs/ae/designs/sample-2026-07-07/api.md', ['# API shard', '', '### EP-001 - No public endpoint', ''])
    const validSplit = runDesignContractCheck(validSplitRoot)
    assert.equal(validSplit.status, 0, validSplit.stderr)
  } finally {
    for (const root of [danglingRoot, traversalRoot, missingRoot, validSplitRoot]) {
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test('design contract semantic validation requires root manifest and owning declarations', () => {
  const missingRootEntry = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  const fakeDeclaration = mkdtempSync(join(tmpdir(), 'ae-design-semantic-'))
  try {
    const missingRootLines = validDesignContractLines().map((line) => line === '  - design.md' ? '  - api.md' : line)
    writeAeArtifact(missingRootEntry, 'docs/ae/designs/sample-2026-07-07/design.md', missingRootLines)
    writeAeArtifact(missingRootEntry, 'docs/ae/designs/sample-2026-07-07/api.md', ['# API shard', ''])
    const missingRoot = runDesignContractCheck(missingRootEntry)
    assert.notEqual(missingRoot.status, 0)
    const missingRootOutput = JSON.parse(missingRoot.stderr)
    assert.ok(missingRootOutput.errors.some((error) => error.field === 'splitManifest' && /list design\.md/i.test(error.message)))

    const fakeDeclarationLines = validDesignContractLines()
      .filter((line) => line !== '### EP-001 - No public endpoint')
      .flatMap((line) => line === '### api-field-to-database-column-mapping' ? [line, '', '#### EP-001 - Mapping-local fake declaration'] : [line])
    writeAeArtifact(fakeDeclaration, 'docs/ae/designs/sample-2026-07-07/design.md', fakeDeclarationLines)
    const fake = runDesignContractCheck(fakeDeclaration)
    assert.notEqual(fake.status, 0)
    const fakeOutput = JSON.parse(fake.stderr)
    assert.ok(fakeOutput.errors.some((error) => error.field === 'stableReference' && /EP-001/.test(error.message)))
  } finally {
    rmSync(missingRootEntry, { recursive: true, force: true })
    rmSync(fakeDeclaration, { recursive: true, force: true })
  }
})

test('symbolic links are excluded from artifact discovery and design manifests', () => {
  const artifactRoot = mkdtempSync(join(tmpdir(), 'ae-artifact-link-'))
  const designRoot = mkdtempSync(join(tmpdir(), 'ae-design-link-'))
  const artifactOutside = mkdtempSync(join(tmpdir(), 'ae-artifact-outside-'))
  const designOutside = mkdtempSync(join(tmpdir(), 'ae-design-outside-'))
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'
  try {
    writeAeArtifact(artifactOutside, 'escaped.md', [
      '---',
      'type: experience',
      'date: 2026-07-22',
      '---',
      '# Outside artifact',
      '',
    ])
    mkdirSync(join(artifactRoot, 'docs', 'ae'), { recursive: true })
    symlinkSync(artifactOutside, join(artifactRoot, 'docs', 'ae', 'linked'), linkType)
    const artifactResult = runAeArtifactCheck(artifactRoot)
    assert.equal(artifactResult.status, 0, artifactResult.stderr)
    assert.equal(JSON.parse(artifactResult.stdout).checked, 0, 'linked artifacts must not be scanned')

    const linkedDesignLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - docs/ae/designs/sample-2026-07-07/linked/api.md'] : [line])
    writeAeArtifact(designRoot, 'docs/ae/designs/sample-2026-07-07/design.md', linkedDesignLines)
    writeAeArtifact(designOutside, 'api.md', ['# API shard', '', '### EP-001 - External declaration', ''])
    symlinkSync(designOutside, join(designRoot, 'docs', 'ae', 'designs', 'sample-2026-07-07', 'linked'), linkType)
    const designResult = runDesignContractCheck(designRoot)
    assert.notEqual(designResult.status, 0, 'linked manifest shards must be rejected')
    const designOutput = JSON.parse(designResult.stderr)
    assert.ok(designOutput.errors.some((error) => error.field === 'splitManifest' && /symbolic link|real design directory/i.test(error.message)))

    if (process.platform !== 'win32') {
      const directLinkDesignLines = validDesignContractLines().flatMap((line) => line === '  - design.md' ? [line, '  - api-link.md'] : [line])
      writeAeArtifact(designRoot, 'docs/ae/designs/direct-link-2026-07-22/design.md', directLinkDesignLines)
      symlinkSync(join(designOutside, 'api.md'), join(designRoot, 'docs', 'ae', 'designs', 'direct-link-2026-07-22', 'api-link.md'), 'file')
      const directLinkResult = runDesignContractCheck(designRoot)
      assert.notEqual(directLinkResult.status, 0, 'direct manifest file links must be rejected')
      const directLinkOutput = JSON.parse(directLinkResult.stderr)
      assert.ok(directLinkOutput.errors.some((error) => error.field === 'splitManifest' && /must not be a symbolic link/i.test(error.message)))
    }
  } finally {
    for (const root of [artifactRoot, designRoot, artifactOutside, designOutside]) {
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test('risk-scaled test design guidance is present in source and mirror skills', () => {
  const source = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-design')
  const mirror = readSkillBody('.agents/skills', 'ae-design')
  const templateSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md'), 'utf8')
  const templateMirror = readFileSync(resolve(repoRoot, '.agents/skills/ae-design/references/design-contract-template.md'), 'utf8')

  assert.equal(mirror, source, 'ae-design mirror should match plugin source')
  assert.equal(templateMirror, templateSource, 'ae-design template mirror should match plugin source')
  for (const expectation of [
    /Risk-Scaled Test Design/,
    /equivalence classes/i,
    /boundary values/i,
    /decision tables/i,
    /state transitions/i,
    /error guessing/i,
    /only when its triggering structure exists/i,
    /do not require fixed scenario counts/i,
  ]) {
    assert.match(source, expectation, `ae-design should include ${expectation}`)
  }
  for (const expectation of [
    /Test Coverage Matrix/,
    /Design method/,
    /Automatable verification signal/,
    /N\/A when the related dimension is explicitly omitted/,
  ]) {
    assert.match(templateSource, expectation, `design template should include ${expectation}`)
  }
})

test('graph-build reports shallow local dependencies', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-graph-'))
  try {
    mkdirSync(join(tempRoot, 'src'), { recursive: true })
    writeFileSync(join(tempRoot, 'src', 'main.js'), [
      "import { helper } from './helper.js'",
      "import fs from 'node:fs'",
      'helper()',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'src', 'helper.js'), [
      'export function helper() {',
      "  return 'ok'",
      '}',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-graph-build', '--root', '.'], tempRoot)
    assert.equal(result.status, 'ok')
    assert.equal(result.mode, 'shallow-dependency-graph')
    assert.equal(result.freshness.status, 'fresh')
    assert.equal(result.freshness.canUseAsEvidence, true)
    assert.equal(typeof result.freshness.fingerprint, 'string')
    assert.equal(result.store.path, 'docs/ae/graphs/graph.json')
    assert.equal(result.store.schemaVersion, 1)
    assert.equal(result.store.written, false)
    assert.equal(existsSync(join(tempRoot, 'docs', 'ae', 'graphs', 'graph.json')), false)
    assert.ok(result.nodes.some((node) => node.path === 'src/main.js'))
    assert.ok(result.edges.some((edge) => edge.from === 'src/main.js' && edge.to === 'src/helper.js' && edge.type === 'imports'))
    assert.ok(result.externalDependencies.some((dep) => dep.from === 'src/main.js' && dep.dependency === 'node:fs'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('graph-query filters shallow graph by path', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-graph-'))
  try {
    mkdirSync(join(tempRoot, 'src'), { recursive: true })
    writeFileSync(join(tempRoot, 'src', 'main.js'), "import './helper.js'\n", 'utf8')
    writeFileSync(join(tempRoot, 'src', 'helper.js'), 'export const value = 1\n', 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'ae-graph-query', '--root', '.', '--path', 'src/main.js'], tempRoot)
    assert.equal(result.status, 'ok')
    assert.equal(result.freshness.status, 'fresh')
    assert.equal(result.store.path, 'docs/ae/graphs/graph.json')
    assert.equal(result.store.schemaVersion, 1)
    assert.equal(result.store.written, false)
    assert.equal(existsSync(join(tempRoot, 'docs', 'ae', 'graphs', 'graph.json')), false)
    assert.deepEqual(result.matchedNodes.map((node) => node.path), ['src/main.js'])
    assert.ok(result.relatedEdges.some((edge) => edge.to === 'src/helper.js'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('graph helper documentation states that graph snapshots are not persisted', () => {
  const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
  const readmeEn = readFileSync(resolve(repoRoot, 'README.en.md'), 'utf8')

  assert.match(readme, /不会写入 `docs\/ae\/graphs\/graph\.json`/)
  assert.match(readmeEn, /do not write `docs\/ae\/graphs\/graph\.json`/i)
})

test('review-contract selects reviewers and writes evidence ledger records', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-review-contract-'))
  try {
    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'review-contract',
      '--kind',
      'code',
      '--mode',
      'report-only',
      '--targets',
      'code,document',
      '--has-security',
      '--write-evidence',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.kind, 'code')
    assert.ok(result.reviewers.includes('correctness-reviewer'))
    assert.ok(result.reviewers.includes('security-reviewer'))
    assert.equal(result.targetCoverage.code.status, 'covered')
    assert.equal(result.evidence.kind, 'review-contract')
    assert.match(result.evidence.path, /^docs\/ae\/evidence\/artifacts\/review-contract\//)

    const ledger = runNodeScriptJson(['scripts/ae-tools.mjs', 'evidence', 'read'], tempRoot)
    assert.equal(ledger.status, 'ok')
    assert.equal(ledger.state, 'passed')
    assert.equal(ledger.records.length, 1)
    assert.equal(ledger.records[0].evidenceKind, 'review-contract')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-brief extracts a single AE implementation unit into an evidence artifact', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-brief-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '## Implementation Units',
      '',
      '### U1 - First unit',
      '',
      '- Goal: first',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Goal: second',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'task-brief',
      '--plan',
      'docs/ae/plans/plan.md',
      '--unit',
      'U2',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.unit, 'U2')
    assert.equal(result.plan, 'docs/ae/plans/plan.md')
    assert.match(result.artifact.path, /^docs\/ae\/evidence\/artifacts\/task-brief\//)
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, /### U2 - Second unit/)
    assert.doesNotMatch(artifactBody, /### U1 - First unit/)
    assert.match(artifactBody, /`src\/two\.js`/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-brief accepts Unit-style headings that task-analyze already supports', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-brief-unit-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '## Implementation Units',
      '',
      '### Unit 1: First unit',
      '',
      '- Goal: first',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### Unit 2: Second unit',
      '',
      '- Goal: second',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'task-brief',
      '--plan',
      'docs/ae/plans/plan.md',
      '--unit',
      'U2',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.unit, 'U2')
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, /### Unit 2: Second unit/)
    assert.doesNotMatch(artifactBody, /### Unit 1: First unit/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-brief accepts localized 单元 headings that task-analyze already supports', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-brief-cn-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '## Implementation Units',
      '',
      '### 单元 1：第一项',
      '',
      '- Goal: first',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### 单元 2：第二项',
      '',
      '- Goal: second',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'task-brief',
      '--plan',
      'docs/ae/plans/plan.md',
      '--unit',
      'U2',
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.unit, 'U2')
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, /### 单元 2：第二项/)
    assert.doesNotMatch(artifactBody, /### 单元 1：第一项/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('review-package writes commit list stat summary and diff into an evidence artifact', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-review-package-'))
  try {
    runGit(['init'], tempRoot)
    runGit(['config', 'user.name', 'Codex Test'], tempRoot)
    runGit(['config', 'user.email', 'codex@example.com'], tempRoot)

    writeFileSync(join(tempRoot, 'sample.txt'), 'one\n', 'utf8')
    runGit(['add', 'sample.txt'], tempRoot)
    runGit(['commit', '-m', 'initial'], tempRoot)
    const base = runGit(['rev-parse', 'HEAD'], tempRoot).stdout.trim()

    writeFileSync(join(tempRoot, 'sample.txt'), 'one\ntwo\n', 'utf8')
    runGit(['add', 'sample.txt'], tempRoot)
    runGit(['commit', '-m', 'update sample'], tempRoot)
    const head = runGit(['rev-parse', 'HEAD'], tempRoot).stdout.trim()

    const result = runNodeScriptJson([
      'scripts/ae-tools.mjs',
      'review-package',
      '--base',
      base,
      '--head',
      head,
    ], tempRoot)

    assert.equal(result.status, 'ok')
    assert.equal(result.base, base)
    assert.equal(result.head, head)
    assert.match(result.artifact.path, /^docs\/ae\/evidence\/artifacts\/review-package\//)
    const artifactBody = readFileSync(join(tempRoot, result.artifact.path), 'utf8')
    assert.match(artifactBody, new RegExp(`# Review package: ${base}\\.\\.${head}`))
    assert.match(artifactBody, /## Commits/)
    assert.match(artifactBody, /update sample/)
    assert.match(artifactBody, /## Files changed/)
    assert.match(artifactBody, /sample\.txt/)
    assert.match(artifactBody, /## Diff/)
    assert.match(artifactBody, /\+two/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('markitdown converts JSON arrays and CSV files to Markdown tables', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-markitdown-'))
  try {
    writeFileSync(join(tempRoot, 'items.json'), JSON.stringify([{ name: 'Ada', score: 2 }, { name: 'Lin', score: 3 }]), 'utf8')
    writeFileSync(join(tempRoot, 'items.csv'), 'name,score\nAda,2\nLin,3\n', 'utf8')

    const jsonResult = runNodeScriptJson(['scripts/ae-tools.mjs', 'markitdown', 'items.json'], tempRoot)
    assert.equal(jsonResult.status, 'ok')
    assert.equal(jsonResult.format, 'json')
    assert.match(jsonResult.markdown, /\| name \| score \|/)
    assert.match(jsonResult.markdown, /\| Ada \| 2 \|/)

    const csvResult = runNodeScriptJson(['scripts/ae-tools.mjs', 'markitdown', 'items.csv'], tempRoot)
    assert.equal(csvResult.status, 'ok')
    assert.equal(csvResult.format, 'csv')
    assert.match(csvResult.markdown, /\| name \| score \|/)
    assert.match(csvResult.markdown, /\| Lin \| 3 \|/)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('static-server dry run returns a local preview URL without starting a process', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-static-server-'))
  try {
    writeFileSync(join(tempRoot, 'index.html'), '<!doctype html><title>AE</title>', 'utf8')
    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'static-server', 'index.html', '--port', '43123', '--dry-run'], tempRoot)
    assert.equal(result.status, 'ok')
    assert.equal(result.serving.path, 'index.html')
    assert.equal(result.url, 'http://127.0.0.1:43123/index.html')
    assert.equal(result.dryRun, true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze reports multi-agent defaults as auto suggest', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.source, 'default')
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.multi_agent_config.effective.mode, 'suggest')
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze keeps multi-agent disabled when enabled is false', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: false',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: false',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: true',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.source, 'profile')
    assert.equal(result.multi_agent_config.effective.enabled, false)
    assert.equal(result.multi_agent_config.effective.mode, 'auto')
    assert.equal(result.execution_strategy, 'serial')
    assert.equal(result.parallel_eligibility.can_parallelize, false)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, ['multi_agent.enabled is false'])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1'], ['U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze treats enabled auto as automatic safe suggestion', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: auto',
      '  mode: suggest',
      '  max_workers: 2',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: false',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze warns and falls back to auto for unknown multi-agent enabled values', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: maybe',
      '  mode: suggest',
      '  max_workers: 2',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: false',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.ok(result.warnings.includes('Ignoring unknown multi_agent.enabled: maybe'))
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze uses opt-in multi-agent suggest config for dependency waves', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: true',
      '  mode: suggest',
      '  max_workers: 2',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: false',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - Script analysis',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `scripts/a.mjs`',
      '',
      '### U2 - Skill docs',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `docs/skill.md`',
      '',
      '### U3 - Tests',
      '',
      '- Depends on: U1',
      '- Files:',
      '  - `tests/a.test.mjs`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.source, 'profile')
    assert.equal(result.multi_agent_config.path, '.codex/ae-skill-profiles.yaml')
    assert.equal(result.multi_agent_config.effective.enabled, true)
    assert.equal(result.multi_agent_config.effective.max_workers, 2)
    assert.equal(result.execution_strategy, 'suggest_parallel')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2'], ['U3']])
    assert.deepEqual(result.units.map((unit) => unit.depends_on), [[], [], ['U1']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze blocks auto write agents unless allow_write_agents is true', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: auto',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: false',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.effective.enabled, 'auto')
    assert.equal(result.multi_agent_config.effective.mode, 'auto')
    assert.equal(result.execution_strategy, 'serial_with_multi_agent_blockers')
    assert.equal(result.read_parallel_eligibility.can_parallelize, true)
    assert.deepEqual(result.read_parallel_eligibility.blockers, [])
    assert.equal(result.write_parallel_eligibility.can_parallelize, false)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.write_parallel_eligibility.blockers, ['multi_agent.allow_write_agents is false'])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze reports auto parallel readiness only with write-agent opt-in', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: true',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: true',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
      '### U3 - Third unit',
      '',
      '- Depends on: U1',
      '- Files:',
      '  - `tests/one.test.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.multi_agent_config.effective.enabled, true)
    assert.equal(result.multi_agent_config.effective.mode, 'auto')
    assert.equal(result.multi_agent_config.effective.allow_write_agents, true)
    assert.equal(result.execution_strategy, 'auto_parallel_ready')
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.equal(result.write_parallel_eligibility.config_allows_write_agents, true)
    assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
    assert.deepEqual(result.parallel_eligibility.blockers, [])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2'], ['U3']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze keeps review_only as read-only parallel strategy without write agents', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: auto',
      '  mode: review_only',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: true',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.execution_strategy, 'parallel_review_only')
    assert.equal(result.read_parallel_eligibility.can_parallelize, true)
    assert.deepEqual(result.read_parallel_eligibility.blockers, [])
    assert.equal(result.write_parallel_eligibility.can_parallelize, false)
    assert.equal(result.write_parallel_eligibility.config_allows_write_agents, false)
    assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
    assert.deepEqual(result.write_parallel_eligibility.blockers, ['multi_agent.mode is review_only; write workers remain disabled'])
    assert.equal(result.parallel_eligibility.can_parallelize, true)
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze separates write config readiness from pre-edit spawn readiness', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, '.codex'), { recursive: true })
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, '.codex', 'ae-skill-profiles.yaml'), [
      'multi_agent:',
      '  enabled: true',
      '  mode: auto',
      '  max_workers: 3',
      '  min_parallel_units: 2',
      '  require_clean_git: true',
      '  require_plan_dependencies: true',
      '  require_disjoint_files: true',
      '  allow_write_agents: true',
      '  review_lanes_parallel: true',
      '',
    ].join('\n'), 'utf8')
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/two.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.equal(result.execution_strategy, 'auto_parallel_ready')
    assert.equal(result.write_parallel_eligibility.can_parallelize, true)
    assert.equal(result.write_parallel_eligibility.config_allows_write_agents, true)
    assert.equal(result.write_parallel_eligibility.can_spawn_write_agents_now, false)
    assert.deepEqual(result.write_parallel_eligibility.pre_spawn_requirements, ['ae-work pre-edit gate must confirm a clean Git state before write delegation'])
    assert.equal(result.parallel_eligibility.can_spawn_write_agents, false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze parses forbidden files separately from owned files', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - Script unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `src/one.js`',
      '- Forbidden files:',
      '  - `package-lock.json`',
      '  - `src/shared.js`',
      '',
      '### U2 - Docs unit',
      '',
      '- Depends on: none',
      '- Files:',
      '  - `docs/guide.md`',
      '- Forbidden files: none',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.deepEqual(result.units[0].files.map((file) => file.path), ['src/one.js'])
    assert.deepEqual(result.units[0].forbidden_files, ['package-lock.json', 'src/shared.js'])
    assert.deepEqual(result.units[1].forbidden_files, [])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('task-analyze keeps comma-separated dependency ids with trailing punctuation', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'ae-task-'))
  try {
    mkdirSync(join(tempRoot, 'docs', 'ae', 'plans'), { recursive: true })
    writeFileSync(join(tempRoot, 'docs', 'ae', 'plans', 'plan.md'), [
      '### U1 - First unit',
      '',
      '- Depends on: none.',
      '- Files:',
      '  - `src/one.js`',
      '',
      '### U2 - Second unit',
      '',
      '- Depends on: none.',
      '- Files:',
      '  - `src/two.js`',
      '',
      '### U3 - Third unit',
      '',
      '- Depends on: U1, U2.',
      '- Files:',
      '  - `tests/one.test.js`',
      '',
    ].join('\n'), 'utf8')

    const result = runNodeScriptJson(['scripts/ae-tools.mjs', 'task-analyze', '--mode', 'plan', '--plan', 'docs/ae/plans/plan.md'], tempRoot)
    assert.deepEqual(result.units.map((unit) => unit.depends_on), [[], [], ['U1', 'U2']])
    assert.deepEqual(result.parallel_waves.map((wave) => wave.unit_ids), [['U1', 'U2'], ['U3']])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('AE plan template includes Global Constraints while keeping implementation units', () => {
  const template = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md'), 'utf8')
  assert.match(template, /## Global Constraints/)
  assert.match(template, /## Implementation Units/)
  assert.match(template, /### U1 - <unit name>/)
})

test('AE review output template defines task review verdict fields', () => {
  const template = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md'), 'utf8')
  assert.match(template, /specVerdict/i)
  assert.match(template, /qualityVerdict/i)
  assert.match(template, /cannotVerifyFromDiff/i)
  assert.match(template, /blockingFindings/i)
})

function runNodeScript(relativePath) {
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

function runNodeScriptJson(args, cwd = repoRoot, env = {}) {
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

function runGit(args, cwd) {
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

function runNodeScriptRaw(command) {
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

function runAeArtifactCheck(tempRoot, extraArgs = []) {
  return spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-ae-artifacts.mjs'), '--target', tempRoot, ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

function runDesignContractCheck(tempRoot, extraArgs = []) {
  return spawnSync(process.execPath, [resolve(repoRoot, 'scripts', 'check-design-contract.mjs'), '--target', tempRoot, ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

function writeAeArtifact(tempRoot, relativePath, lines) {
  const fullPath = join(tempRoot, relativePath)
  mkdirSync(resolve(fullPath, '..'), { recursive: true })
  writeFileSync(fullPath, lines.join('\n'), 'utf8')
}

function readSkillBody(root, skillName) {
  return readFileSync(resolve(repoRoot, root, skillName, 'SKILL.md'), 'utf8')
}

function validDesignContractLines() {
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
