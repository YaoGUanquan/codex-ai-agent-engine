import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { TOOL } from '../schemas/ae-asset-schema.js'
import { parseOcrJson, runOcr } from '../services/ocr-service.js'

export const aeOcrTool = tool({
  description: 'Explicitly runs the OpenCodeReview CLI for code review. It never runs during installation or background catalog discovery.',
  args: { command: z.string().default('review'), args: z.array(z.string()).default([]), repo: z.string().optional(), format: z.enum(['text', 'json']).default('json') },
  execute: async (args, ctx) => {
    ctx.metadata({ title: `ocr ${args.command}`, metadata: { tool: TOOL.AE_OCR } })
    try {
      const cliArgs = [args.command, ...args.args]
      if ((args.command === 'review' || args.command === 'scan') && !cliArgs.includes('--format')) cliArgs.push('--format', args.format)
      const result = await runOcr(cliArgs, args.repo ?? ctx.directory)
      if (args.format === 'json' && result.stdout.trim()) {
        const parsed = parseOcrJson(result.stdout)
        return JSON.stringify({ ...parsed, exitCode: result.exitCode, stderr: result.stderr }, null, 2)
      }
      return result.stdout.trim() || result.stderr.trim() || `ocr exited with ${result.exitCode}`
    } catch (error) { return `ae-ocr execution failed: ${error instanceof Error ? error.message : String(error)}` }
  },
})
