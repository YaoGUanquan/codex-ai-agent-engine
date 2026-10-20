import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { repoRoot } from './helpers/skill-test-utils.mjs'

const skillsRoot = resolve(repoRoot, 'plugins/ai-agent-engine-codex/skills')
const entrypoints = ['ae-work', 'ae-plan', 'ae-tasks', 'ae-lfg', 'ae-review', 'ae-agent-creator']
const readSkill = (name, relativePath = 'SKILL.md') => readFileSync(resolve(skillsRoot, name, relativePath), 'utf8')
const catalog = JSON.parse(readSkill('ae-help', 'references/team-roles.json'))

test('team workflow entrypoints link to the shared contract without loading it for every small task', () => {
  for (const name of entrypoints) {
    const body = readSkill(name)
    const links = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    const teamLink = links.find((match) => match[1].endsWith('ae-help/references/team-execution.md'))
    assert.ok(teamLink, `${name} must route team work to the canonical contract`)
    assert.ok(existsSync(resolve(skillsRoot, name, teamLink[1])), `${name} team contract must ship`)
    assert.ok(Buffer.byteLength(body, 'utf8') < 4096, `${name} entry must stay compact`)
    assert.match(body, /(?:complex|multi-unit|delegat|team|parallel)/i)
    assert.doesNotMatch(body, /Delegation is serial by default|Never spawn agents without explicit\s+user authorization/i)
  }
})

test('plan unit template carries analyzer fields and retains legacy ownership fields', () => {
  const template = readSkill('ae-plan', 'references/plan-template.md')
  const unit = template.split('### U1 - <unit name>')[1]?.split('## Consistency Check')[0]
  assert.ok(unit, 'template needs a stable implementation unit')
  for (const field of ['Role', 'Depends on', 'Files', 'Read-only files', 'Shared resources', 'Acceptance', 'Data Access Budget', 'Forbidden files', 'Validation', 'Rollback signals']) {
    assert.match(unit, new RegExp(`^- ${field}:`, 'm'), `unit must declare ${field}`)
  }
  assert.match(template, /key=read.*key=write|key=write.*key=read/)
  assert.match(template, /legacy/i)
})

test('worker prompt uses canonical roles and returns independently checkable unfinished work', () => {
  const path = resolve(skillsRoot, 'ae-agent-creator/references/team-role-template.md')
  assert.ok(existsSync(path), 'role prompt template must be distributed')
  const template = readFileSync(path, 'utf8')
  const catalogLink = [...template.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .find((match) => match[1].endsWith('team-roles.json'))
  assert.ok(catalogLink, 'prompt must reference the central role catalog')
  assert.equal(resolve(dirname(path), catalogLink[1]), resolve(skillsRoot, 'ae-help/references/team-roles.json'))
  const examples = [...template.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]))
  const assignment = examples.find((value) => value.role && value.instance_id)
  const result = examples.find((value) => Array.isArray(value.unfinished_work))
  assert.ok(assignment, 'prompt needs a bounded role assignment')
  assert.ok(catalog.roles[assignment.role], 'sample role must exist in the canonical catalog')
  for (const field of ['owned_files', 'read_only_files', 'forbidden_files', 'dependencies', 'shared_resources', 'acceptance', 'data_access_budget', 'allowed_checks']) {
    assert.ok(Object.hasOwn(assignment, field), `assignment must carry ${field}`)
  }
  assert.ok(Array.isArray(assignment.shared_resources), 'resource access must use the analyzer array shape')
  assert.equal(typeof assignment.acceptance, 'string', 'acceptance must preserve the analyzer text shape')
  const resources = examples.find((value) => Array.isArray(value) && value.length > 0)
  assert.ok(resources, 'prompt must demonstrate a populated resource access array')
  for (const resource of resources) {
    assert.deepEqual(Object.keys(resource).sort(), ['access', 'key'])
    assert.equal(typeof resource.key, 'string')
    assert.ok(resource.key.length > 0)
    assert.ok(['read', 'write'].includes(resource.access))
  }
  assert.ok(result, 'return must preserve unfinished work')
  for (const field of ['changed_files', 'tests', 'risks', 'conflicts', 'unfinished_work']) {
    assert.ok(Array.isArray(result[field]), `return must include ${field}`)
  }
  for (const field of ['command', 'result', 'evidence']) {
    assert.ok(Object.hasOwn(result.tests[0], field), `check evidence must include ${field}`)
  }
  assert.match(readSkill('ae-work', 'references/work-subagent-template.md'), /team-role-template\.md/)
})

test('delegation instructions remove repository-wide clean-state gates and retain explicit controls', () => {
  const delegation = readSkill('ae-work', 'references/task-delegation.md')
  assert.doesNotMatch(delegation, /clean safe branch|only when the user explicitly allowed parallel agent work/i)
  for (const control of ['read_parallel_eligibility', 'write_parallel_eligibility', 'multi_agent.enabled: false', 'review_only', 'host-slots', 'execution-state']) {
    assert.ok(delegation.includes(control), `delegation must preserve ${control}`)
  }
  const work = readSkill('ae-work', 'references/task-execution.md')
  assert.doesNotMatch(work, /Execute one implementation unit or one small checkpoint at a time/)
  assert.match(work, /acceptance evidence/i)
})
