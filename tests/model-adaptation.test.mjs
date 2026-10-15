import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderYaml, skillMetadata, supportedLanguages } from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'
import { parseSimpleYaml } from '../plugins/ai-agent-engine-codex/scripts/ae-tools/yaml.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const skills = 'plugins/ai-agent-engine-codex/skills'
const read = (path) => readFileSync(resolve(root, path), 'utf8')

test('every distributed skill and language regeneration requires explicit invocation', () => {
  const names = readdirSync(resolve(root, skills), { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
  assert.deepEqual(names, Object.keys(skillMetadata).sort())
  for (const name of names) {
    for (const lang of supportedLanguages) {
      assert.equal(parseSimpleYaml(renderYaml(skillMetadata[name], lang)).policy.allow_implicit_invocation, true, `${name}: ${lang}`)
    }
    assert.equal(parseSimpleYaml(read(`${skills}/${name}/agents/openai.yaml`)).policy.allow_implicit_invocation, true, name)
    const entry = read(`${skills}/${name}/SKILL.md`)
    const frontmatter = parseSimpleYaml(entry.split('---')[1])
    assert.match(frontmatter.description, /explicit|明确/i, name)
  }
})

test('execution, debug, TDD, review and shipping resolve the same validation contract', () => {
  const callers = [
    'ae-work/SKILL.md', 'ae-debug/SKILL.md', 'ae-tdd/SKILL.md',
    'ae-review/SKILL.md', 'ae-task-loop/SKILL.md',
    'ae-work/references/task-execution.md', 'ae-work/references/shipping-workflow.md',
    'ae-tdd/references/tdd-workflow.md', 'ae-debug/references/debugging-workflow.md',
    'ae-lfg/references/pipeline.md', 'ae-review/references/review-delivery.md',
  ]
  for (const caller of callers) {
    const text = read(`${skills}/${caller}`)
    const link = text.match(/\]\(([^)]+validation-contract\.md)\)/)?.[1]
    assert.ok(link, `${caller} must route to shared validation rules`)
    const target = resolve(root, skills, caller, '..', link)
    assert.equal(target, resolve(root, skills, 'ae-help/references/validation-contract.md'))
    assert.ok(readFileSync(target, 'utf8').length > 0)
    assert.doesNotMatch(text, /broader validation (?:when practical|if appropriate)/i, caller)
  }
})

test('shared validation policy covers reuse, invalidation, full-suite escalation and honest evidence', () => {
  const contract = read(`${skills}/ae-help/references/validation-contract.md`)
  for (const requirement of [
    /failed (?:test|case).*test class/i,
    /cross-module shared behavior/i,
    /Explain.*before.*full suite/i,
    /phase changes.*review.*shipping.*compaction/i,
    /Only.*affected.*results.*invalid/i,
    /documentation.*config.*fixture.*input/is,
    /different.*(?:code )?states.*full-suite pass/is,
    /flaky.*concurrency.*environment/is,
    /command.*scope.*result.*state/is,
  ]) assert.match(contract, requirement)
})

test('autonomy rules do not stop safe work for dirty trees or invented iteration limits', () => {
  const execution = read(`${skills}/ae-work/references/task-execution.md`)
  assert.doesNotMatch(execution, /default branch or dirty worktree:.*ask/)
  assert.match(execution, /unrelated.*changes.*continue/i)
  const contract = read(`${skills}/ae-help/references/model-adaptation-contract.md`)
  assert.doesNotMatch(contract, /one inspection pass|single targeted retry|Set a bounded work budget/)
  assert.match(contract, /user.*explicit.*budget/i)
  const loop = read(`${skills}/ae-task-loop/SKILL.md`)
  assert.doesNotMatch(loop, /three consecutive no-progress|Bound iterations|agreed iteration limit/)
  assert.doesNotMatch(read(`${skills}/ae-web-forge/SKILL.md`), /at most three loops/)
})

test('behavior evaluation manifest preserves the requested comparison without claiming execution', () => {
  const suite = JSON.parse(read(`${skills}/ae-help/references/model-evaluation.json`))
  assert.equal(suite.primaryTarget, 'GPT-6.1')
  assert.equal(suite.status, 'not-run')
  assert.equal(suite.repetitions, 2)
  assert.deepEqual(suite.variants, ['disabled', 'baseline-0.3.54', 'candidate'])
  assert.equal(suite.cases.length, 8)
  assert.equal(new Set(suite.cases.map((item) => item.id)).size, 8)
  for (const item of suite.cases) {
    assert.ok(item.prompt && item.setup && item.acceptance.length, item.id)
  }
  assert.match(read(`${skills}/ae-help/references/model-evaluation.md`), /not model execution|not.*behavioral proof/i)
})
