import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderYaml, skillMetadata } from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'
import { readSkillBody } from './helpers/skill-test-utils.mjs'

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

test('renderYaml supports image-generation metadata in all language modes', () => {
  const skills = [
    ['ae-imagegen-prompt', 'AE Imagegen Prompt', 'AE 图片生成提示词'],
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

test('authorized reverse engineering skill is discoverable and keeps defensive boundaries', () => {
  const source = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-reverse-engineering')
  const mirror = readSkillBody('.ae-source/skills', 'ae-reverse-engineering')
  const templateSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-reverse-engineering/references/analysis-report-template.md'), 'utf8')
  const templateMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-reverse-engineering/references/analysis-report-template.md'), 'utf8')
  const metadata = skillMetadata['ae-reverse-engineering']
  const catalogSource = JSON.parse(readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json'), 'utf8'))
  const catalogMirror = JSON.parse(readFileSync(resolve(repoRoot, '.ae-source/skills/ae-help/references/capability-catalog.json'), 'utf8'))

  assert.equal(mirror, source, 'ae-reverse-engineering mirror should match plugin source')
  assert.equal(templateMirror, templateSource, 'analysis report template mirror should match plugin source')
  for (const expectation of [
    /Authorization Gate/,
    /license bypass/i,
    /credential theft/i,
    /detection evasion/i,
    /active exploitation/i,
    /target scanning/i,
    /Do not install tools/i,
    /register MCP servers/i,
    /observed.*inferred.*unverified/is,
    /Do not execute an untrusted artifact/i,
  ]) {
    assert.match(source, expectation, `ae-reverse-engineering should include ${expectation}`)
  }
  assert.match(templateSource, /Scope And Authorization/)
  assert.match(templateSource, /SHA-256/)
  assert.match(templateSource, /observed \/ inferred \/ unverified/)
  assert.match(renderYaml(metadata, 'en'), /AE Authorized Reverse Engineering/)
  assert.match(renderYaml(metadata, 'bilingual'), /AE 授权逆向工程 \/ AE Authorized Reverse Engineering/)
  assert.ok(catalogSource.skills.some((skill) => skill.name === 'ae-reverse-engineering'))
  assert.ok(catalogMirror.skills.some((skill) => skill.name === 'ae-reverse-engineering'))

  const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
  const readmeEn = readFileSync(resolve(repoRoot, 'README.en.md'), 'utf8')
  assert.match(readme, /`ae-reverse-engineering`：对已授权工件执行防御性逆向分析/)
  assert.match(readmeEn, /`ae-reverse-engineering`: analyze authorized artifacts defensively/i)
})

test('API bubble testing skill keeps contract, evidence, and live-call boundaries explicit', () => {
  const source = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-test-api')
  const mirror = readSkillBody('.ae-source/skills', 'ae-test-api')
  const referenceSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-test-api/references/api-verification-record.md'), 'utf8')
  const referenceMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-test-api/references/api-verification-record.md'), 'utf8')
  const metadata = skillMetadata['ae-test-api']
  const catalogSource = JSON.parse(readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json'), 'utf8'))
  const catalogMirror = JSON.parse(readFileSync(resolve(repoRoot, '.ae-source/skills/ae-help/references/capability-catalog.json'), 'utf8'))

  assert.equal(mirror, source, 'ae-test-api mirror should match plugin source')
  assert.equal(referenceMirror, referenceSource, 'API verification record reference mirror should match plugin source')
  for (const expectation of [
    /API\/interface\/bubble testing/i,
    /local runtime smoke gate/i,
    /request config template/i,
    /request-context manifest/i,
    /project runner/i,
    /single-request curl fallback/i,
    /request-context.*client-config.*transport.*auth.*business/is,
    /plugins\/ai-agent-engine-codex\/scripts\/request-context-contract\.mjs/,
    /REPLACE_WITH_LOCAL_TOKEN/,
    /exactly one sanitized API Verification Record/i,
    /Do not automatically update/i,
    /OpenCode agents/i,
  ]) {
    assert.match(source, expectation, `ae-test-api should include ${expectation}`)
  }
  for (const expectation of [
    /Contract Source Precedence/,
    /Request Context Manifest/,
    /requiredness/,
    /classification/,
    /provider/,
    /lifetime/,
    /redaction/,
    /tenant\/organization\/school\/workspace/i,
    /dynamic revisions/i,
    /## Request Context/,
    /## Carrier/,
    /## Outcome/,
    /Coverage:/,
    /Failure category/,
    /A passing lower tier cannot satisfy a higher-tier claim/,
    /\.\.\/\.\.\/ae-work\/references\/local-runtime-smoke-gate\.md/,
    /\.\.\/\.\.\/ae-work\/references\/request-config-template\.md/,
    /REPLACE_WITH_LOCAL_TOKEN/,
    /Forbidden record content/,
    /Knowledge Curation/,
    /The user explicitly requests durable API knowledge/,
  ]) {
    assert.match(referenceSource, expectation, `API verification reference should include ${expectation}`)
  }
  assert.match(renderYaml(metadata, 'en'), /AE API Test/)
  assert.match(renderYaml(metadata, 'zh-CN'), /AE 接口测试/)
  const catalogEntry = catalogSource.skills.find((skill) => skill.name === 'ae-test-api')
  assert.deepEqual(catalogMirror, catalogSource, 'capability catalog mirror should match plugin source')
  assert.equal(catalogEntry?.tier, 'core')
  assert.equal(catalogEntry?.artifactPath, 'docs/ae/evidence/api')

  const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf8')
  const readmeEn = readFileSync(resolve(repoRoot, 'README.en.md'), 'utf8')
  assert.match(readme, /`ae-test-api`：在后端改动后执行接口冒泡测试/)
  assert.match(readmeEn, /`ae-test-api`: verify post-change backend API contracts/i)
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

test('mattpocock-adapted guidance is present in source and mirror skills', () => {
  const expectedBySkill = {
    'ae-debug': [
      /red-capable feedback loop/,
      /3-5 ranked concrete hypotheses/,
      /If no red-capable loop can be built/,
    ],
    'ae-tdd': [
      /independent oracle/,
      /public seam/,
      /vertical tracer-bullet slices/,
    ],
    'ae-review': [
      /\*\*Standards\*\*/,
      /\*\*Spec\*\*/,
      /Pin the base and head/,
    ],
    'ae-refactor': [
      /deep-module vocabulary/,
      /deletion test/,
    ],
    'ae-tasks': [
      /tracer-bullet slice/,
      /blocking edges explicit/,
    ],
  }

  for (const [skillName, expectations] of Object.entries(expectedBySkill)) {
    const sourceBody = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirrorBody = readSkillBody('.ae-source/skills', skillName)
    assert.equal(mirrorBody, sourceBody, `${skillName} mirror should match plugin source`)
    for (const expectation of expectations) {
      assert.match(sourceBody, expectation, `${skillName} should include ${expectation}`)
    }
    if (skillName === 'ae-debug') {
      const sourceWorkflow = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-debug/references/debugging-workflow.md'), 'utf8')
      const mirrorWorkflow = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-debug/references/debugging-workflow.md'), 'utf8')
      assert.equal(mirrorWorkflow, sourceWorkflow, 'ae-debug workflow mirror should match plugin source')
      assert.match(sourceWorkflow, /red-capable loop/)
      assert.match(sourceWorkflow, /3-5 ranked, falsifiable hypotheses/)
      assert.match(sourceWorkflow, /\[DEBUG-<id>\]/)
    }
    if (skillName === 'ae-tdd') {
      const sourceWorkflow = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-tdd/references/tdd-workflow.md'), 'utf8')
      const mirrorWorkflow = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-tdd/references/tdd-workflow.md'), 'utf8')
      assert.equal(mirrorWorkflow, sourceWorkflow, 'ae-tdd workflow mirror should match plugin source')
      assert.match(sourceWorkflow, /independent oracle/)
      assert.match(sourceWorkflow, /Work vertically/)
    }
  }
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
      /behavior baseline/,
      /relevant call path, import, entrypoint, or consumer/,
      /design reason for the current shape/,
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
    const mirrorBody = readSkillBody('.ae-source/skills', skillName)
    assert.equal(mirrorBody, sourceBody, `${skillName} mirror should match plugin source`)
    for (const expectation of expectations) {
      assert.match(sourceBody, expectation, `${skillName} should include ${expectation}`)
    }
  }
})

test('task loop dual completion gate requires verification and non-blocking review', () => {
  const source = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-task-loop')
  const mirror = readSkillBody('.ae-source/skills', 'ae-task-loop')

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
    '.ae-source/skills/ae-work/references/local-runtime-smoke-gate.md',
  ]
  const templatePaths = [
    'plugins/ai-agent-engine-codex/skills/ae-work/references/request-config-template.md',
    '.ae-source/skills/ae-work/references/request-config-template.md',
  ]
  const sourceReference = readFileSync(resolve(repoRoot, referencePaths[0]), 'utf8')
  const mirrorReference = readFileSync(resolve(repoRoot, referencePaths[1]), 'utf8')
  const sourceTemplate = readFileSync(resolve(repoRoot, templatePaths[0]), 'utf8')
  const mirrorTemplate = readFileSync(resolve(repoRoot, templatePaths[1]), 'utf8')

  assert.equal(mirrorReference, sourceReference, 'local runtime smoke gate mirror should match plugin source')
  assert.equal(mirrorTemplate, sourceTemplate, 'request config template mirror should match plugin source')
  for (const expectation of [
    /start, execute, automatically run, smoke test, bubble test, or locally integrate/i,
    /restart or hot-reload rule/i,
    /read-only or state-changing/i,
    /source-backed request-context manifest/i,
    /project runner.*single-request curl fallback.*blocked/is,
    /request-context.*client-config.*transport.*auth.*business/is,
    /plugins\/ai-agent-engine-codex\/scripts\/request-context-contract\.mjs/,
    /same-process environment/i,
    /dynamic values/i,
    /user-controlled local secret reference/i,
    /proactively create a token-free request template/i,
    /request-config-template\.md/,
    /UTF-8 without BOM/i,
    /never create an empty or comments-only file/i,
    /REPLACE_WITH_LOCAL_TOKEN/,
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
  for (const expectation of [
    /UTF-8 without BOM/i,
    /REPLACE_WITH_LOCAL_TOKEN/,
    /Fill steps/i,
    /填写步骤/,
    /header = "Authorization: Bearer REPLACE_WITH_LOCAL_TOKEN"/,
    /Never create an empty file/i,
    /PowerShell `Out-File`/,
  ]) {
    assert.match(sourceTemplate, expectation, `request config template should include ${expectation}`)
  }
  assert.doesNotMatch(sourceReference, /Read-Host|write_stdin/i)

  for (const skillName of ['ae-work', 'ae-tdd', 'ae-debug', 'ae-task-loop', 'ae-test-api']) {
    const source = readSkillBody('plugins/ai-agent-engine-codex/skills', skillName)
    const mirror = readSkillBody('.ae-source/skills', skillName)
    assert.equal(mirror, source, `${skillName} mirror should match plugin source`)
    assert.match(source, /local runtime smoke gate/i, `${skillName} should route explicit runtime smoke to the shared gate`)
  }
})

test('OCR-inspired review guidance is present in source and mirror skills', () => {
  const reviewSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-review')
  const reviewMirror = readSkillBody('.ae-source/skills', 'ae-review')
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
  const profileMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-review/references/code-review-rule-profiles.md'), 'utf8')
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
  const auditMirror = readSkillBody('.ae-source/skills', 'ae-skill-audit')
  assert.equal(auditMirror, auditSource, 'ae-skill-audit mirror should match plugin source')
  assert.match(auditSource, /Deterministic Engineering/i)
  assert.match(auditSource, /license compatibility/i)

  const auditTemplateSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md'), 'utf8')
  const auditTemplateMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-skill-audit/references/audit-template.md'), 'utf8')
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
    const mirrorBody = readSkillBody('.ae-source/skills', skillName)
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
    const mirrorBody = readSkillBody('.ae-source/skills', skillName)
    assert.equal(mirrorBody, sourceBody, `${skillName} mirror should match plugin source`)
    for (const expectation of expectations) {
      assert.match(sourceBody, expectation, `${skillName} should include ${expectation}`)
    }
  }
})

test('SkillOpt audit filter guidance is present in source and mirror skills', () => {
  const auditSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-skill-audit')
  const auditMirror = readSkillBody('.ae-source/skills', 'ae-skill-audit')
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
  const auditTemplateMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-skill-audit/references/audit-template.md'), 'utf8')
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

test('skill candidate governance is present in source and mirror skills', () => {
  const creatorSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-skill-creator')
  const creatorMirror = readSkillBody('.ae-source/skills', 'ae-skill-creator')
  assert.equal(creatorMirror, creatorSource, 'ae-skill-creator mirror should match plugin source')

  for (const expectation of [
    /Candidate Evaluation Gate/i,
    /source evidence/i,
    /overlap check/i,
    /Create.*Improve.*Absorb.*Drop/is,
    /staged proposal/i,
    /explicit user authorization/i,
  ]) {
    assert.match(creatorSource, expectation, `ae-skill-creator should include ${expectation}`)
  }

  const candidateReferenceSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-skill-creator/references/candidate-evaluation.md'), 'utf8')
  const candidateReferenceMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-skill-creator/references/candidate-evaluation.md'), 'utf8')
  assert.equal(candidateReferenceMirror, candidateReferenceSource, 'candidate evaluation reference mirror should match plugin source')

  for (const expectation of [
    /## Candidate Record/,
    /## Required Checks/,
    /## Verdicts/,
    /## Adoption Boundary/,
    /\| Create \| A distinct repeatable workflow/,
    /\| Improve \| An existing skill owns the workflow/,
    /\| Absorb \| The candidate overlaps an existing skill/,
    /\| Drop \| The evidence is one-off/,
  ]) {
    assert.match(candidateReferenceSource, expectation, `candidate evaluation reference should include ${expectation}`)
  }

  const experienceSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-save-experience')
  const experienceMirror = readSkillBody('.ae-source/skills', 'ae-save-experience')
  assert.equal(experienceMirror, experienceSource, 'ae-save-experience mirror should match plugin source')
  assert.match(experienceSource, /candidate evidence, not authorization/i)
  assert.match(experienceSource, /ae-skill-creator/i)
})

test('PRD and plan artifact contracts are present in source and mirror skills', () => {
  const expectationsByFile = [
    ['plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md', '.ae-source/skills/ae-prd/SKILL.md', [
      /format: human-readable-requirements/,
      /sharded: false/,
      /AI Parse Contract/,
      /stable requirement IDs/i,
      /originFingerprint/,
      /Consistency Check/i,
    ]],
    ['plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md', '.ae-source/skills/ae-plan/SKILL.md', [
      /format: human-readable-plan/,
      /sharded: false/,
      /canonicalKind: plan/,
      /originFingerprint/,
      /source requirement ID/i,
      /forbidden files/i,
    ]],
    [
      'plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md',
      '.ae-source/skills/ae-plan/references/plan-template.md',
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

test('brainstorm delegates durable requirements capture to the ae-prd contract', () => {
  for (const legacyPath of [
    'plugins/ai-agent-engine-codex/skills/ae-brainstorm/references/requirements-capture.md',
    '.ae-source/skills/ae-brainstorm/references/requirements-capture.md',
  ]) {
    assert.ok(!existsSync(resolve(repoRoot, legacyPath)), `${legacyPath} should be removed; ae-prd owns the requirements capture contract`)
  }

  const source = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-brainstorm')
  const mirror = readSkillBody('.ae-source/skills', 'ae-brainstorm')
  assert.equal(mirror, source, 'ae-brainstorm mirror should match plugin source')
  assert.match(source, /\.\.\/ae-prd\/references\/requirements-capture\.md/, 'brainstorm should reuse the ae-prd capture contract')
  assert.match(source, /docs\/ae\/prds/, 'brainstorm should name the canonical prds location')

  for (const catalogPath of [
    'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json',
    '.ae-source/skills/ae-help/references/capability-catalog.json',
  ]) {
    const catalog = JSON.parse(readFileSync(resolve(repoRoot, catalogPath), 'utf8'))
    const entry = catalog.skills.find((skill) => skill.name === 'ae-brainstorm')
    assert.equal(entry?.artifactPath, 'docs/ae/prds', `${catalogPath} ae-brainstorm artifactPath should be the canonical prds channel`)
    assert.equal(catalog.artifactPaths.requirements, 'docs/ae/prds', `${catalogPath} should keep requirements mapped to prds`)
    assert.equal(catalog.artifactPaths.ideas, 'docs/ae/brainstorms', `${catalogPath} should keep ideas mapped to brainstorms`)
  }

  for (const contractPath of [
    'plugins/ai-agent-engine-codex/skills/ae-help/references/artifact-contract.md',
    '.ae-source/skills/ae-help/references/artifact-contract.md',
  ]) {
    const contract = readFileSync(resolve(repoRoot, contractPath), 'utf8')
    assert.match(contract, /\| Requirements \| docs\/ae\/prds\//, `${contractPath} should declare prds as the requirements path`)
    assert.match(contract, /type: prd/, `${contractPath} requirements frontmatter example should use the ae-prd capture shape`)
    assert.doesNotMatch(contract, /origin: docs\/ae\/brainstorms/, `${contractPath} plan origin example should not point at brainstorms`)
  }

  for (const scopePath of [
    'plugins/ai-agent-engine-codex/skills/ae-review/references/scope-detection.md',
    '.ae-source/skills/ae-review/references/scope-detection.md',
  ]) {
    const scope = readFileSync(resolve(repoRoot, scopePath), 'utf8')
    assert.match(scope, /docs\/ae\/prds/, `${scopePath} document review search should include the prds channel`)
  }
})

test('governance batch two refinements are present and mirrored', () => {
  const expectationsByFile = [
    ['plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md', '.ae-source/skills/ae-prd/references/requirements-capture.md', [
      /## Perspective Collision \(Conditional\)/,
    ]],
    ['plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md', '.ae-source/skills/ae-brainstorm/SKILL.md', [
      /Skip it for S1-S2 tasks with a single viable direction/,
      /at most four perspectives/,
      /## Perspective Collision \(Conditional\)/,
      /validation-evidence-profile\.md/,
    ]],
    ['plugins/ai-agent-engine-codex/skills/ae-ideate/SKILL.md', '.ae-source/skills/ae-ideate/SKILL.md', [
      /Perspective Collision Pass/,
    ]],
    ['plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md', '.ae-source/skills/ae-review/SKILL.md', [
      /## Light Path/,
      /at most 3 files/,
      /Fall back to the full flow/,
      /validation-evidence-profile\.md/,
    ]],
    ['plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md', '.ae-source/skills/ae-prd/SKILL.md', [
      /validation-evidence-profile\.md/,
    ]],
    ['plugins/ai-agent-engine-codex/skills/ae-handoff/SKILL.md', '.ae-source/skills/ae-handoff/SKILL.md', [
      /docs\/00-process\/active\/<task>\/handoff\.md/,
      /docs\/ae\/handoffs\//,
    ]],
    ['plugins/ai-agent-engine-codex/skills/ae-lfg/SKILL.md', '.ae-source/skills/ae-lfg/SKILL.md', [
      /standalone cross-session handoffs without a task directory go to `docs\/ae\/handoffs\/`/,
    ]],
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

test('validation evidence governance is present in source and mirror skills', () => {
  const profilePaths = [
    'plugins/ai-agent-engine-codex/skills/ae-plan/references/validation-evidence-profile.md',
    '.ae-source/skills/ae-plan/references/validation-evidence-profile.md',
  ]
  const profileSource = readFileSync(resolve(repoRoot, profilePaths[0]), 'utf8')
  const profileMirror = readFileSync(resolve(repoRoot, profilePaths[1]), 'utf8')

  assert.equal(profileMirror, profileSource, 'validation evidence profile mirror should match plugin source')
  for (const expectation of [
    /Select the smallest set of tiers/,
    /A lower tier never proves a higher tier/,
    /`passed`/, /`failed`/, /`blocked`/, /`not-applicable`/, /`unverified`/,
    /canonical persisted value/,
    /derived or ephemeral representation/,
    /caller-controlled input/,
    /Acceptance criterion \| Applicable tier \| Expected signal and bounded claim/,
  ]) {
    assert.match(profileSource, expectation, `validation evidence profile should include ${expectation}`)
  }

  const mirroredFiles = [
    ['plugins/ai-agent-engine-codex/skills/ae-brainstorm/SKILL.md', '.ae-source/skills/ae-brainstorm/SKILL.md', /smallest applicable validation-evidence tiers/],
    ['plugins/ai-agent-engine-codex/skills/ae-prd/SKILL.md', '.ae-source/skills/ae-prd/SKILL.md', /A lower tier must not imply runtime, browser, or deployment acceptance/],
    ['plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md', '.ae-source/skills/ae-prd/references/requirements-capture.md', /## Validation Evidence \(Conditional\)/],
    ['plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md', '.ae-source/skills/ae-plan/SKILL.md', /validation-evidence-profile\.md/],
    ['plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md', '.ae-source/skills/ae-plan/references/plan-template.md', /## Contract Value Classification \(Conditional\)/],
    ['plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md', '.ae-source/skills/ae-review/SKILL.md', /Flag an invalid promotion/],
    ['plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md', '.ae-source/skills/ae-review/references/review-output-template.md', /## Known Unrelated Failures/],
  ]

  for (const [sourcePath, mirrorPath, expectation] of mirroredFiles) {
    const source = readFileSync(resolve(repoRoot, sourcePath), 'utf8')
    const mirror = readFileSync(resolve(repoRoot, mirrorPath), 'utf8')
    assert.equal(mirror, source, `${mirrorPath} should match ${sourcePath}`)
    assert.match(source, expectation, `${sourcePath} should include ${expectation}`)
  }
})

test('upstream PRD reference sync keeps required references and source freshness current', () => {
  const expectedUpstreamCommit = '76d832c96a1c810410982bf28b425a3aedb461ab'
  const referencePaths = [
    'plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md',
    '.ae-source/skills/ae-prd/references/requirements-capture.md',
    'plugins/ai-agent-engine-codex/skills/ae-prd/references/handoff.md',
    '.ae-source/skills/ae-prd/references/handoff.md',
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
    '.ae-source/skills/ae-help/references/capability-catalog.json',
  ]) {
    const catalog = JSON.parse(readFileSync(resolve(repoRoot, catalogPath), 'utf8'))
    assert.equal(catalog.source.observedCommit, expectedUpstreamCommit, `${catalogPath} should record observed upstream HEAD`)
  }
})

test('upstream brainstorm and web workflow modernization is reflected in source and mirror skills', () => {
  const brainstormSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-brainstorm')
  const brainstormMirror = readSkillBody('.ae-source/skills', 'ae-brainstorm')
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
  const frontendMirror = readSkillBody('.ae-source/skills', 'ae-frontend-design')
  assert.equal(frontendMirror, frontendSource, 'ae-frontend-design mirror should match plugin source')
  assert.match(frontendSource, /Frontend Design And UI Implementation/i)
  assert.match(frontendSource, /design input/i)
  assert.match(frontendSource, /visual baseline/i)
  assert.doesNotMatch(frontendSource, /Build the first usable frontend version\./)

  const webSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-web-app')
  const webMirror = readSkillBody('.ae-source/skills', 'ae-web-app')
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
    '.ae-source/skills/ae-help/references/capability-catalog.json',
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

test('frontend motion governance is reflected in source and mirror skills', () => {
  const frontendSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-frontend-design')
  const frontendMirror = readSkillBody('.ae-source/skills', 'ae-frontend-design')
  assert.equal(frontendMirror, frontendSource, 'ae-frontend-design mirror should match plugin source')
  assert.match(frontendSource, /Motion Decision Gate/i)
  assert.match(frontendSource, /Default to static UI or minimal CSS state feedback/i)
  assert.match(frontendSource, /Do not prescribe, install, or promote a motion runtime/i)

  const qualitySource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/web-ui-quality.md'), 'utf8')
  const qualityMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-frontend-design/references/web-ui-quality.md'), 'utf8')
  assert.equal(qualityMirror, qualitySource, 'web UI quality reference mirror should match plugin source')
  assert.match(qualitySource, /prefers-reduced-motion/i)
  assert.match(qualitySource, /usable completion state/i)
  assert.match(qualitySource, /decorative particle backgrounds/i)

  const browserSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-test-browser')
  const browserMirror = readSkillBody('.ae-source/skills', 'ae-test-browser')
  assert.equal(browserMirror, browserSource, 'ae-test-browser mirror should match plugin source')
  const acceptanceSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-test-browser/references/browser-acceptance.md'), 'utf8')
  const acceptanceMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-test-browser/references/browser-acceptance.md'), 'utf8')
  assert.equal(acceptanceMirror, acceptanceSource, 'browser acceptance reference mirror should match plugin source')
  assert.match(acceptanceSource, /material motion/i)
  assert.match(acceptanceSource, /reduced-motion/i)
  assert.match(acceptanceSource, /completion state/i)
  assert.match(acceptanceSource, /unverified/i)
  assert.match(browserSource, /Reconnoiter before acting/)
  assert.match(browserSource, /`networkidle`/)
  assert.match(browserSource, /black box/)
  assert.match(acceptanceSource, /Reconnaissance And Stability/)
  assert.match(acceptanceSource, /`networkidle`/)
  assert.match(acceptanceSource, /black box/)

  const forgeSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-web-forge')
  const forgeMirror = readSkillBody('.ae-source/skills', 'ae-web-forge')
  assert.equal(forgeMirror, forgeSource, 'ae-web-forge mirror should match plugin source')
  assert.match(forgeSource, /Motion decision/)
  assert.match(forgeSource, /Reduced-motion evidence/)
})

test('design and web forge skill contracts are present in source, mirror, metadata, and docs', () => {
  const designSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-design')
  const designMirror = readSkillBody('.ae-source/skills', 'ae-design')
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
  const designTemplateMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-design/references/design-contract-template.md'), 'utf8')
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
  const forgeMirror = readSkillBody('.ae-source/skills', 'ae-web-forge')
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
    '.ae-source/skills/ae-help/references/capability-catalog.json',
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
    const mirrorSkill = readSkillBody('.ae-source/skills', skillName)

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
  const helpMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-help/SKILL.md'), 'utf8')
  const catalogSource = JSON.parse(readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json'), 'utf8'))
  const catalogMirror = JSON.parse(readFileSync(resolve(repoRoot, '.ae-source/skills/ae-help/references/capability-catalog.json'), 'utf8'))

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

test('risk-scaled test design guidance is present in source and mirror skills', () => {
  const source = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-design')
  const mirror = readSkillBody('.ae-source/skills', 'ae-design')
  const templateSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-design/references/design-contract-template.md'), 'utf8')
  const templateMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-design/references/design-contract-template.md'), 'utf8')

  assert.equal(mirror, source, 'ae-design mirror should match plugin source')
  assert.equal(templateMirror, templateSource, 'ae-design template mirror should match plugin source')
  for (const expectation of [
    /Risk-Scaled Test Design/,
    /Existing-Project Evidence/,
    /repository-wide audit/i,
    /greenfield design/i,
    /Test-Case Quality Guards/,
    /observable expected result/i,
    /semantically duplicate cases/i,
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
    /Existing Project Evidence \(Conditional\)/,
    /mode: inspected \| bypassed/,
    /Sanitized conclusion/,
    /Test Coverage Matrix/,
    /Test-Case Quality Rules/,
    /semantically duplicate cases/i,
    /observable response, state, record, or event/i,
    /Design method/,
    /Automatable verification signal/,
    /N\/A when the related dimension is explicitly omitted/,
  ]) {
    assert.match(templateSource, expectation, `design template should include ${expectation}`)
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

test('backend language guidance and fullstack contract alignment are present in source and mirror skills', () => {
  const guidanceFiles = [
    'java-guidance.md',
    'go-guidance.md',
    'python-guidance.md',
    'c-guidance.md',
    'cpp-guidance.md',
    'csharp-guidance.md',
  ]
  for (const fileName of guidanceFiles) {
    const sourcePath = `plugins/ai-agent-engine-codex/skills/ae-backend/references/${fileName}`
    const mirrorPath = `.ae-source/skills/ae-backend/references/${fileName}`
    const source = readFileSync(resolve(repoRoot, sourcePath), 'utf8')
    const mirror = readFileSync(resolve(repoRoot, mirrorPath), 'utf8')
    assert.equal(mirror, source, `${mirrorPath} should match ${sourcePath}`)
    assert.match(source, /Apply this guidance only when the repository uses/, `${fileName} should stay stack-conditional`)
    assert.match(source, /## Common Defect Traps/, `${fileName} should keep the defect-trap section`)
    assert.match(source, /## Error And Response Contract/, `${fileName} should keep the error contract section`)
  }

  const backendSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-backend')
  const backendMirror = readSkillBody('.ae-source/skills', 'ae-backend')
  assert.equal(backendMirror, backendSource, 'ae-backend mirror should match plugin source')
  for (const expectation of [
    /java-guidance\.md/,
    /go-guidance\.md/,
    /python-guidance\.md/,
    /c-guidance\.md/,
    /cpp-guidance\.md/,
    /csharp-guidance\.md/,
    /For other backend languages, follow the repository's existing conventions/,
    /Frontend-Backend Alignment/,
  ]) {
    assert.match(backendSource, expectation, `ae-backend should include ${expectation}`)
  }

  const checklistSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-backend/references/api-contract-checklist.md'), 'utf8')
  const checklistMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-backend/references/api-contract-checklist.md'), 'utf8')
  assert.equal(checklistMirror, checklistSource, 'api contract checklist mirror should match plugin source')
  for (const expectation of [
    /## Frontend-Backend Alignment/,
    /camelCase versus snake_case/,
    /UTC ISO 8601/,
    /ae-swagger-parser/,
    /ae-test-api/,
  ]) {
    assert.match(checklistSource, expectation, `api contract checklist should include ${expectation}`)
  }

  const webAppSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-web-app')
  assert.match(webAppSource, /\.\.\/ae-backend\/references\/api-contract-checklist\.md/, 'ae-web-app should route the API seam to the shared contract checklist')
  const forgeSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-web-forge')
  assert.match(forgeSource, /API contract checklist in `ae-backend`/, 'ae-web-forge should hold both sides to the shared contract checklist')

  const debugWorkflowSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-debug/references/debugging-workflow.md'), 'utf8')
  const debugWorkflowMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-debug/references/debugging-workflow.md'), 'utf8')
  assert.equal(debugWorkflowMirror, debugWorkflowSource, 'debugging workflow mirror should match plugin source')
  assert.match(debugWorkflowSource, /## Backend Failure Quick Map/)
  assert.match(debugWorkflowSource, /## Frontend-Backend Boundary Quick Map/)

  const sqlSource = readSkillBody('plugins/ai-agent-engine-codex/skills', 'ae-sql')
  const sqlMirror = readSkillBody('.ae-source/skills', 'ae-sql')
  assert.equal(sqlMirror, sqlSource, 'ae-sql mirror should match plugin source')
  assert.match(sqlSource, /sql-safety-checklist\.md/)
  const sqlChecklistSource = readFileSync(resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills/ae-sql/references/sql-safety-checklist.md'), 'utf8')
  const sqlChecklistMirror = readFileSync(resolve(repoRoot, '.ae-source/skills/ae-sql/references/sql-safety-checklist.md'), 'utf8')
  assert.equal(sqlChecklistMirror, sqlChecklistSource, 'sql safety checklist mirror should match plugin source')
  assert.match(sqlChecklistSource, /## Operation Risk Tiers/)
  assert.match(sqlChecklistSource, /## Migration Safety/)
})

test('legacy frontend stack counterparts are present in source and mirror skills', () => {
  const counterpartFiles = [
    ['svelte-guidance.md', /## Svelte 4 Counterparts/, [/`derived` stores/, /createEventDispatcher/, /do not exist in Svelte 4/]],
    ['angular-guidance.md', /## NgModule-Era Counterparts/, [/takeUntil\(destroy\$\)/, /trackBy/, /loadChildren/]],
    ['vue-guidance.md', /## Options API Counterparts/, [/`computed:` options/, /Vue\.set/, /`<script setup>` blocks/]],
  ]
  for (const [fileName, sectionHeading, expectations] of counterpartFiles) {
    const sourcePath = `plugins/ai-agent-engine-codex/skills/ae-web-app/references/${fileName}`
    const mirrorPath = `.ae-source/skills/ae-web-app/references/${fileName}`
    const source = readFileSync(resolve(repoRoot, sourcePath), 'utf8')
    const mirror = readFileSync(resolve(repoRoot, mirrorPath), 'utf8')
    assert.equal(mirror, source, `${mirrorPath} should match ${sourcePath}`)
    assert.match(source, /Apply this guidance only when the repository uses/, `${fileName} should stay stack-conditional`)
    assert.match(source, /## Common Defect Traps/, `${fileName} should keep the defect-trap section`)
    assert.match(source, sectionHeading, `${fileName} should include its legacy counterpart section`)
    for (const expectation of expectations) {
      assert.match(source, expectation, `${fileName} should include ${expectation}`)
    }
  }
})

test('cross-artifact verification vocabulary is conditional and mirrored', () => {
  const vocabularyFiles = [
    [
      'plugins/ai-agent-engine-codex/skills/ae-prd/references/requirements-capture.md',
      '.ae-source/skills/ae-prd/references/requirements-capture.md',
      [
        /## Must-Haves \(Conditional\)/,
        /Requirement ID: <R1 or NFR1>/,
        /Must-have completion condition:/,
        /Omit it when ordinary requirements and acceptance conditions are sufficient\./,
      ],
    ],
    [
      'plugins/ai-agent-engine-codex/skills/ae-plan/references/plan-template.md',
      '.ae-source/skills/ae-plan/references/plan-template.md',
      [
        /## Deviations \(Conditional\)/,
        /Authority or decision source:/,
        /Recovery or explicit deferral:/,
        /## Verification Gaps \(Conditional\)/,
        /Required proof and missing check:/,
        /A gap does not pass the requirement and does not approve a deviation\./,
      ],
    ],
    [
      'plugins/ai-agent-engine-codex/skills/ae-review/references/review-output-template.md',
      '.ae-source/skills/ae-review/references/review-output-template.md',
      [
        /## Deviations \(Conditional\)/,
        /Related requirement ID:/,
        /Impact:/,
        /## Verification Gaps \(Conditional\)/,
        /Status: <blocked \| unverified \| failed \| not-applicable>/,
        /Owner and next action:/,
      ],
    ],
  ]

  for (const [sourcePath, mirrorPath, expectations] of vocabularyFiles) {
    const source = readFileSync(resolve(repoRoot, sourcePath), 'utf8')
    const mirror = readFileSync(resolve(repoRoot, mirrorPath), 'utf8')
    assert.equal(mirror, source, `${mirrorPath} should match ${sourcePath}`)
    for (const expectation of expectations) {
      assert.match(source, expectation, `${sourcePath} should include ${expectation}`)
    }
  }
})
