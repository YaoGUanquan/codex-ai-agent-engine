import { describe, it, expect } from 'vitest'
import { REVIEW_MATRIX } from '../../src/services/review-catalog.js'
import { AGENT } from '../../src/schemas/ae-asset-schema.js'

describe('REVIEW_MATRIX', () => {
  it('uses the OCR engine for code and the document reviewer across domains', () => {
    const codeAlwaysOn = REVIEW_MATRIX.filter((r) => r.domain === 'code' && r.alwaysOn)
    const sharedAlwaysOn = REVIEW_MATRIX.filter((r) => r.domain === 'both' && r.alwaysOn)
    expect(codeAlwaysOn.map((r) => r.name)).toEqual([AGENT.OCR_REVIEWER])
    expect(sharedAlwaysOn.map((r) => r.name)).toEqual([AGENT.DOCUMENT_REVIEWER])
  })

  it('defines opt-in design specialists with activation conditions', () => {
    const conditional = REVIEW_MATRIX.filter((r) => !r.alwaysOn)
    expect(conditional.map((r) => r.name)).toEqual([
      AGENT.SECURITY_DESIGN_REVIEWER,
      AGENT.ARCHITECTURE_DESIGN_REVIEWER,
      AGENT.TEST_CASES_DESIGN_REVIEWER,
      AGENT.GOAL_ALIGNMENT_REVIEWER,
      AGENT.DESIGN_INTEGRITY_REVIEWER,
      AGENT.TRACEABILITY_REVIEWER,
    ])
    for (const entry of conditional) {
      expect(entry.conditionGroups).toBeDefined()
      expect(entry.conditionGroups!.length).toBeGreaterThan(0)
    }
  })

  it('keeps unconditional reviewers free of condition groups', () => {
    const alwaysOn = REVIEW_MATRIX.filter((r) => r.alwaysOn)
    for (const entry of alwaysOn) {
      expect(entry.conditionGroups).toBeUndefined()
    }
  })
})
