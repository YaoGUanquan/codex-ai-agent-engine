import { describe, it, expect } from 'vitest'
import { selectReviewers } from '../../src/services/review-selector.js'
import { AGENT } from '../../src/schemas/ae-asset-schema.js'

describe('selectReviewers', () => {
  it('selects the current always-on reviewers by domain', () => {
    expect(selectReviewers({ kind: 'code' })).toEqual([AGENT.OCR_REVIEWER, AGENT.DOCUMENT_REVIEWER])
    expect(selectReviewers({ kind: 'document' })).toEqual([AGENT.DOCUMENT_REVIEWER])
  })

  it('activates security design review from an explicit security signal', () => {
    expect(selectReviewers({ kind: 'document', hasSecurity: true })).toEqual([
      AGENT.DOCUMENT_REVIEWER,
      AGENT.SECURITY_DESIGN_REVIEWER,
    ])
  })

  it('activates the design-contract specialists', () => {
    expect(selectReviewers({ kind: 'document', hasDesignContract: true })).toEqual([
      AGENT.DOCUMENT_REVIEWER,
      AGENT.ARCHITECTURE_DESIGN_REVIEWER,
      AGENT.TEST_CASES_DESIGN_REVIEWER,
      AGENT.DESIGN_INTEGRITY_REVIEWER,
    ])
  })

  it('uses target types and mixed scope for design integrity and traceability', () => {
    expect(selectReviewers({ kind: 'general', targetTypes: ['design'] })).toEqual([
      AGENT.OCR_REVIEWER,
      AGENT.DOCUMENT_REVIEWER,
      AGENT.DESIGN_INTEGRITY_REVIEWER,
      AGENT.TRACEABILITY_REVIEWER,
    ])
  })
})
