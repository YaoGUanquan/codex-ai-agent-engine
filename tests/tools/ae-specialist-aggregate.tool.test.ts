import { describe, expect, it } from 'vitest'
import { aeSpecialistAggregateTool } from '../../src/tools/ae-specialist-aggregate.tool.js'

describe('ae-specialist-aggregate', () => {
  it('returns a dispatch manifest', async () => {
    const output = await aeSpecialistAggregateTool.execute({ strategy: 'merge', results: [{ status: 'success', output: 'ok', evidence: [] }], dispatchedAgents: ['frontend-dev'], skippedAgents: [], skipReasons: {} }, { metadata: () => undefined } as never)
    expect(output).toContain('dispatchManifest')
  })
})
