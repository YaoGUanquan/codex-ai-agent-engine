import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import plugin from '../../src/index.js'
import { createToolRegistry } from '../../src/tools/index.js'

interface ParityManifest {
  upstream: { commit: string; opencodeVersion: string }
  license: string
  retainedRoots: string[]
  distributionPaths: string[]
  excludedDistributionPathFragments: string[]
  expectedPluginHooks: string[]
  expectedTools: string[]
  expectedSkills: string[]
  absentSkillOrToolNames: string[]
}

const repoRoot = resolve(import.meta.dirname, '..', '..')
const manifest = JSON.parse(readFileSync(
  resolve(repoRoot, 'docs', 'ae', 'parity', 'opencode-upstream-61b7775-manifest.json'),
  'utf8',
)) as ParityManifest

function collectFiles(root: string): string[] {
  if (!existsSync(root)) return []
  if (!statSync(root).isDirectory()) return [root]
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name)
    return entry.isDirectory() ? collectFiles(path) : [path]
  })
}

describe('OpenCode 上游对齐清单', () => {
  it('应该完整注册清单声明的插件 hooks 和工具', async () => {
    const runtime = await plugin({ worktree: repoRoot, directory: repoRoot, serverUrl: new URL('http://localhost:4096'), client: {} } as never)

    expect(Object.keys(runtime).sort()).toEqual([...manifest.expectedPluginHooks].sort())
    expect(Object.keys(createToolRegistry()).sort()).toEqual([...manifest.expectedTools].sort())
  })

  it('应该保留清单声明的运行时根目录', () => {
    for (const path of manifest.retainedRoots) {
      expect(existsSync(resolve(repoRoot, path)), `missing retained root: ${path}`).toBe(true)
    }
  })

  it('可注册的运行时资产不应该重新引入清单排除片段', () => {
    const runtimeFiles = ['src', 'scripts'].flatMap((path) => collectFiles(resolve(repoRoot, path)))
    const relativePaths = runtimeFiles.map((path) => path.slice(repoRoot.length + 1).replaceAll('\\', '/').toLowerCase())

    for (const fragment of manifest.excludedDistributionPathFragments) {
      expect(
        relativePaths.filter((path) => path.includes(fragment.toLowerCase())),
        `excluded path fragment found: ${fragment}`,
      ).toEqual([])
    }
  })

  it('应该声明 61b7775、OpenCode 1.18.4、GPL-3.0-or-later 和新的浏览器/OCR 边界', () => {
    expect(manifest.upstream).toMatchObject({
      commit: '61b777542fb00d2e082af126d17b070318281933',
      opencodeVersion: '1.18.4',
    })
    expect(manifest.license).toBe('GPL-3.0-or-later')
    expect(readFileSync(resolve(repoRoot, 'LICENSE'), 'utf8')).toContain('GNU GENERAL PUBLIC LICENSE')
    expect(readFileSync(resolve(repoRoot, 'LICENSE-NOTICE'), 'utf8')).toMatch(/either version 3 of the License, or \(at your\s+option\) any later version/)
    expect(manifest.expectedSkills).toEqual(expect.arrayContaining(['ae-playwright', 'ae-ocr']))
    expect(manifest.absentSkillOrToolNames).toEqual(expect.arrayContaining(['ae-chrome-devtools', 'ae-web-forge']))
    expect(manifest.distributionPaths).toEqual(expect.arrayContaining(['THIRD-PARTY-NOTICES', 'scripts/ensure-playwright.mjs']))
  })

  it('workflow agents should route browser testing to the registered Playwright workflow', () => {
    for (const agent of ['logic-weaver', 'ui-architect', 'ui-design-spec', 'ui-ux-designer']) {
      const content = readFileSync(resolve(repoRoot, 'src', 'assets', 'agents', 'workflow', `${agent}.md`), 'utf8')
      expect(content).not.toContain('@browser-inspector')
      expect(content).toContain('@e2e-tester')
      expect(content).toContain('ae:playwright')
    }
  })

  it('review 路由不应该全局排除 JSON 和 YAML 配置', () => {
    const routingTable = readFileSync(
      resolve(repoRoot, 'src', 'assets', 'skills', 'ae-review', 'references', 'file-routing-table.md'),
      'utf8',
    )
    const globalExclusions = routingTable.slice(
      routingTable.indexOf('## 全局排除'),
      routingTable.indexOf('## 全局审查者'),
    )

    const dataExclusion = globalExclusions.split(/\r?\n/).find((line) => line.startsWith('- 数据：')) ?? ''
    expect(dataExclusion).toBe('- 数据：.csv')
    expect(routingTable).toMatch(/### 配置路由[\s\S]*\.json \.yaml \.yml/)
  })
})
