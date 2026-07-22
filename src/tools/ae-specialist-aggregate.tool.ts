import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { aggregateResults } from '../services/domain-dispatch-service.js'
export const aeSpecialistAggregateTool = tool({
  description: 'Aggregate results from explicitly selected specialists.',
  args: { strategy: z.enum(['union', 'merge', 'best-of', 'reduce']), results: z.array(z.object({ status: z.enum(['success', 'partial', 'failed']), output: z.string(), evidence: z.array(z.string()), findings: z.array(z.object({ severity: z.string(), title: z.string(), evidence: z.string().optional() })).optional() })).min(1), dispatchedAgents: z.array(z.string()), skippedAgents: z.array(z.string()).default([]), skipReasons: z.record(z.string(), z.string()).default({}) },
  execute: async (args) => JSON.stringify({ ...aggregateResults(args.strategy, args.results, args.results.map((result) => result.findings ?? [])), dispatchManifest: { dispatched: args.dispatchedAgents, skipped: args.skippedAgents, skipReasons: args.skipReasons } }, null, 2),
})
