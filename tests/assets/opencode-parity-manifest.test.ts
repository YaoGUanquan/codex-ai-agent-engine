import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import plugin from '../../src/index.js'
import { createToolRegistry } from '../../src/tools/index.js'

interface ParityManifest {
  retainedRoots: string[]
  excludedPathFragments: string[]
  expectedPluginHooks: string[]
  expectedTools: string[]
}

const repoRoot = resolve(import.meta.dirname, '..', '..')
const manifest = JSON.parse(readFileSync(
  resolve(repoRoot, 'docs', 'ae', 'parity', 'opencode-upstream-a144f785-manifest.json'),
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
    const runtime = await plugin({ worktree: repoRoot, client: {} } as never)

    expect(Object.keys(runtime).sort()).toEqual([...manifest.expectedPluginHooks].sort())
    expect(Object.keys(createToolRegistry()).sort()).toEqual([...manifest.expectedTools].sort())
  })

  it('应该保留清单声明的运行时根目录', () => {
    for (const path of manifest.retainedRoots) {
      expect(existsSync(resolve(repoRoot, path)), `missing retained root: ${path}`).toBe(true)
    }
  })

  it('运行时源码路径不应该重新引入清单排除片段', () => {
    const runtimeFiles = ['src', 'scripts'].flatMap((path) => collectFiles(resolve(repoRoot, path)))
    const relativePaths = runtimeFiles.map((path) => path.slice(repoRoot.length + 1).replaceAll('\\', '/').toLowerCase())

    for (const fragment of manifest.excludedPathFragments) {
      expect(
        relativePaths.filter((path) => path.includes(fragment.toLowerCase())),
        `excluded path fragment found: ${fragment}`,
      ).toEqual([])
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
