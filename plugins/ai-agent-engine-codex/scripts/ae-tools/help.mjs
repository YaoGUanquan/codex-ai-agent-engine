// Capability catalog help output.
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readJson } from './utils.mjs'

const pluginRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const catalogPath = join(pluginRoot, 'skills', 'ae-help', 'references', 'capability-catalog.json')

export function printHelp(query) {
  const catalog = readJson(catalogPath)
  const tiers = [
    { id: 'core', label: '核心工程流程' },
    { id: 'docs', label: '文档处理' },
    { id: 'tools', label: '辅助工具' },
    { id: 'meta', label: '维护与配置' },
  ]
  const supportedTiers = new Set(tiers.map((tier) => tier.id))
  const invalidSkill = catalog.skills.find((skill) => !supportedTiers.has(skill.tier))
  if (invalidSkill) throw new Error(`capability catalog skill ${invalidSkill.name} has unsupported tier: ${invalidSkill.tier || '<missing>'}`)
  const q = query.toLowerCase()
  const skills = catalog.skills.filter((skill) => {
    if (!q) return true
    return [skill.name, skill.entry, skill.target, skill.purpose, skill.script, skill.artifactPath].filter(Boolean).join(' ').toLowerCase().includes(q)
  })
  const commands = (catalog.commands || []).filter((command) => {
    if (!q) return true
    return [command.name, command.purpose, command.script].filter(Boolean).join(' ').toLowerCase().includes(q)
  })

  const lines = []
  lines.push('# AI Agent Engine for Codex')
  lines.push('')
  lines.push(`来源参考: ${catalog.source.name} (${catalog.source.observedCommit.slice(0, 7)})`)
  lines.push(`运行边界: ${catalog.codexPort.runtimeBoundary}`)
  if (skills.length > 0) {
    lines.push('')
    lines.push('## 入口')
    for (const tier of tiers) {
      const tierSkills = skills.filter((skill) => skill.tier === tier.id)
      if (tierSkills.length === 0) continue
      lines.push('')
      lines.push(`### ${tier.label} (${tier.id})`)
      lines.push('')
      for (const skill of tierSkills) {
        const entry = skill.entry || `/${skill.name}`
        const target = skill.target ? `${skill.target}: ` : ''
        lines.push(`- ${target}${entry} (${skill.name})`)
        lines.push(`  说明: ${skill.purpose}`)
        if (skill.script) lines.push(`  脚本: ${skill.script}`)
        if (skill.artifactPath) lines.push(`  产物路径: ${skill.artifactPath}`)
      }
    }
  }
  if (skills.length === 0 && commands.length === 0) {
    lines.push(`没有匹配的 AE 能力: ${query}`)
  }
  lines.push('')
  lines.push('## 产物路径')
  for (const [key, value] of Object.entries(catalog.artifactPaths)) {
    lines.push(`- ${key}: ${value}`)
  }
  if (commands.length > 0) {
    lines.push('')
    lines.push('## CLI Commands')
    for (const command of commands) {
      lines.push(`- ${command.name}`)
      lines.push(`  Purpose: ${command.purpose}`)
      if (command.script) lines.push(`  Script: ${command.script}`)
    }
  }
  lines.push('')
  lines.push('## 说明')
  for (const item of catalog.notes || []) {
    lines.push(`- ${item}`)
  }
  console.log(lines.join('\n'))
}
