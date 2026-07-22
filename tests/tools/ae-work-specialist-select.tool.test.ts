import { describe, expect, it } from 'vitest'
import { aeWorkSpecialistSelectTool } from '../../src/tools/ae-work-specialist-select.tool.js'

describe('ae-work-specialist-select', () => {
  it('selects a frontend specialist for UI work', async () => {
    const output = await aeWorkSpecialistSelectTool.execute({ intent: 'build UI', constraints: [], has_ui: true, has_api: false, has_database: false }, { metadata: () => undefined } as never)
    expect(output).toContain('frontend-dev')
  })
})
