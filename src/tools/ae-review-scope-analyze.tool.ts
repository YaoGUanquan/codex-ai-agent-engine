import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { AGENT } from '../schemas/ae-asset-schema.js'
import { getSpecialistPrompt } from '../services/specialist-prompt-templates.js'
const codeExtensions = new Set(['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'java', 'sql', 'sh', 'ps1', 'css', 'vue', 'tf', 'json', 'yaml', 'yml'])
const documentExtensions = new Set(['md', 'txt', 'rst', 'json', 'yaml', 'yml', 'toml', 'ini', 'xml'])
const excludedExtensions = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'zip', 'lock'])
const extension = (file: string) => file.split('.').pop()?.toLowerCase() ?? ''
export const aeReviewScopeAnalyzeTool = tool({
  description: 'Analyze review scope and return explicitly selectable reviewer prompts without executing agents.',
  args: { files: z.array(z.string()).min(1), reviewMode: z.enum(['changes', 'full']), goals: z.string().optional(), contextHint: z.string().optional() },
  execute: async (args) => {
    const codeFiles: string[] = []; const docFiles: string[] = []; const excludedFiles: string[] = []
    for (const file of args.files) { const ext = extension(file); if (excludedExtensions.has(ext)) excludedFiles.push(file); else { if (codeExtensions.has(ext) || ['Dockerfile', 'Makefile'].includes(file.split(/[\\/]/).pop() ?? '')) codeFiles.push(file); if (documentExtensions.has(ext)) docFiles.push(file); if (!codeExtensions.has(ext) && !documentExtensions.has(ext)) { codeFiles.push(file); docFiles.push(file) } } }
    const agents = [...(codeFiles.length ? [AGENT.OCR_REVIEWER] : []), ...(docFiles.length ? [AGENT.DOCUMENT_REVIEWER] : []), AGENT.GOAL_ALIGNMENT_REVIEWER]
    const goals = args.goals?.trim() || `${args.reviewMode === 'full' ? 'Review complete contents.' : 'Review changes and regression risk.'}${args.contextHint ? ` Context: ${args.contextHint}` : ''}`
    return JSON.stringify({ agents, tasks: agents.map((agent) => ({ agent, prompt: getSpecialistPrompt(agent), files: agent === AGENT.OCR_REVIEWER ? codeFiles : agent === AGENT.DOCUMENT_REVIEWER ? docFiles : [...new Set([...codeFiles, ...docFiles])] })), reviewFiles: [...new Set([...codeFiles, ...docFiles])], excludedFiles, goals, stats: { totalFiles: args.files.length, codeFiles: codeFiles.length, docFiles: docFiles.length, excludedFiles: excludedFiles.length, agentCount: agents.length } }, null, 2)
  },
})
