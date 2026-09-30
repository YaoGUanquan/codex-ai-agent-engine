import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderYaml, skillMetadata } from '../plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs'

const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8')
const source = 'plugins/ai-agent-engine-codex/skills'

test('audit source roles exclude consumer layouts and generated skills', () => {
  const agents = read('AGENTS.md')
  for (const path of ['plugins/ai-agent-engine-codex/skills', '.ae-source/skills', '.agents/skills', 'dist/', 'node_modules/']) {
    assert.ok(agents.includes(path), path)
  }
  for (const file of ['README.md', 'README.en.md']) {
    const text = read(file)
    assert.match(text, /\.ae-source\/skills/)
    assert.match(text, /\[CHANGELOG(?:\.en)?\.md\]\(CHANGELOG(?:\.en)?\.md\)/)
    assert.doesNotMatch(text, /当前仓库自用的项目级安装示例|Project-local self-install for this repo/)
    assert.doesNotMatch(text, /^####\s+0\.3\.(28|26)\b/m)
  }
})

test('AE invocation is explicit and opt-in at project instruction boundaries', () => {
  const agents = read('AGENTS.md')
  const readme = read('README.md')
  const readmeEn = read('README.en.md')

  for (const [name, text] of [
    ['AGENTS.md', agents],
    ['README.md', readme],
    ['README.en.md', readmeEn],
  ]) {
    assert.match(text, /explicit|显式/i, `${name} should require explicit AE invocation`)
    assert.match(text, /not.*automatic|不要自动|不会自动|does not activate.*automatically|opt-in/i, `${name} should forbid automatic AE activation`)
  }
  assert.match(agents, /默认不要加载、调用、委派或套用/i)
  assert.match(agents, /普通语义匹配.*不构成 AE 显式调用/i)
})

test('frontend entry metadata has positive and negative ownership boundaries', () => {
  const expected = {
    'ae-frontend-design': [/focused visual-only/, /Not the owner for API/],
    'ae-web-app': [/API integration/, /Not the owner for visual-only/],
    'ae-web-forge': [/broad or mixed frontend\/Web work/, /explicitly requested/],
  }
  for (const [name, patterns] of Object.entries(expected)) {
    const body = read(`${source}/${name}/SKILL.md`)
    const description = body.match(/^description: (.+)$/m)?.[1]
    assert.ok(description)
    for (const pattern of patterns) assert.match(description, pattern)
    assert.ok(description.includes(`$${name}`))
    assert.equal(read(`.ae-source/skills/${name}/SKILL.md`), body)
    const yaml = renderYaml(skillMetadata[name], 'bilingual')
    assert.equal(read(`${source}/${name}/agents/openai.yaml`), yaml)
    assert.equal(read(`.ae-source/skills/${name}/agents/openai.yaml`), yaml)
  }
})

test('routing fixtures preserve positive and negative cases without claiming model execution', () => {
  const text = read(`${source}/ae-web-forge/references/routing-examples.md`)
  const cases = [
    ['visual-only', 'ae-frontend-design', 'ae-web-app'],
    ['api-flow', 'ae-web-app', 'ae-frontend-design'],
    ['existing-route', 'ae-web-app', 'ae-web-forge'],
    ['mixed-intake', 'ae-web-forge', 'ae-frontend-design'],
    ['browser-only', 'ae-test-browser', 'ae-web-app'],
    ['explicit-owner', 'ae-frontend-design', 'ae-web-forge'],
  ]
  for (const [id, owner, excluded] of cases) {
    const row = text.split('\n').find((line) => line.startsWith(`| ${id} |`))
    assert.ok(row, id)
    const cells = row.split('|').map((cell) => cell.trim())
    assert.equal(cells[3], owner, id)
    assert.equal(cells[4], excluded, id)
  }
  assert.match(text, /do not execute a model router/)
  assert.equal(read('.ae-source/skills/ae-web-forge/references/routing-examples.md'), text)
  assert.match(read(`${source}/ae-web-forge/SKILL.md`), /preserve existing targets/)
  assert.match(read(`${source}/ae-web-app/SKILL.md`), /Reuse an existing routing decision/)
  assert.match(read(`${source}/ae-frontend-design/SKILL.md`), /Do not reload an unchanged contract/)
})
