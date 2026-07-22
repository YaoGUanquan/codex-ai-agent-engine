import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { selectSpecialists, getCoordinationStrategy } from '../services/domain-dispatch-service.js'
import { getSpecialistPrompt } from '../services/specialist-prompt-templates.js'
export const aeWorkSpecialistSelectTool = tool({
  description: 'Select explicitly invoked development specialists for ae:work.',
  args: { intent: z.string().min(1), constraints: z.array(z.string()).default([]), has_ui: z.boolean().default(false), has_api: z.boolean().default(false), has_database: z.boolean().default(false) },
  execute: async (args) => {
    const task = { stage: 'entry' as const, intent: args.intent, domain: 'development', constraints: args.constraints, rawInput: args.intent, timestamp: new Date().toISOString() }
    const specialists = selectSpecialists('development', task, { hasUi: args.has_ui, hasApi: args.has_api, hasDatabase: args.has_database })
    return JSON.stringify({ domain: 'development', strategy: getCoordinationStrategy('development'), specialistCount: specialists.length, tasks: specialists.map((item) => ({ agent: item.name, prompt: getSpecialistPrompt(item.name), capabilities: item.capabilities })) }, null, 2)
  },
})
