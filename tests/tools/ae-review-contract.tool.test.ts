import { describe, it, expect } from 'vitest'

import { AGENT } from '../../src/schemas/ae-asset-schema.js'

interface ReviewContractResult {
  kind: string
  normalizedKind?: string
  documentType?: string
  targetCoverage?: Record<string, { status: string; reviewers: string[] }>
  mode: string
  reviewers: string[]
  nonSelectionInputs: string[]
  gate: string
}

async function callTool(args: {
  kind: 'document' | 'test' | 'general' | 'code' | 'design' | 'prototype' | 'mixed' | 'hybrid'
  mode?: string
  targets?: string
  targetTypes?: string
  scenes?: string
  reviewScenes?: string
  has_architecture_decision?: boolean
  has_new_abstraction?: boolean
  has_product_claim?: boolean
  has_cli?: boolean
  has_ui?: boolean
  has_tooling?: boolean
  has_agent_config?: boolean
  has_config?: boolean
  has_evidence_claim?: boolean
  has_security?: boolean
  has_design_contract?: boolean
}) {
  const { aeReviewContractTool: tool } = await import('../../src/tools/ae-review-contract.tool.js')
  const definition = tool as unknown as {
    execute: (args: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<string>
  }

  const mockCtx = {
    metadata: () => undefined,
    directory: '/test',
    sessionID: 'test-session',
    worktree: '/test',
    abort: new AbortController().signal,
  }

  const result = await definition.execute({ mode: 'report-only', ...args }, mockCtx)
  return JSON.parse(result) as ReviewContractResult
}

async function getToolDefinition() {
  const { aeReviewContractTool: tool } = await import('../../src/tools/ae-review-contract.tool.js')
  return tool as unknown as {
    args: Record<string, unknown>
    execute: (args: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<string>
  }
}

describe('ae-review-contract 工具', () => {
  it('test 类型使用当前文档审查器', async () => {
    const result = await callTool({ kind: 'test' })

    expect(result.kind).toBe('test')
    expect(result.documentType).toBe('test')
    expect(result.reviewers).toEqual([AGENT.DOCUMENT_REVIEWER])
  })

  it('document 类型默认使用文档审查器', async () => {
    const result = await callTool({ kind: 'document' })

    expect(result.kind).toBe('document')
    expect(result.documentType).toBe('requirements')
    expect(result.reviewers).toEqual([AGENT.DOCUMENT_REVIEWER])
  })

  it('design 类型在没有设计契约时使用默认文档审查器', async () => {
    const result = await callTool({ kind: 'design' })

    expect(result.documentType).toBe('design')
    expect(result.reviewers).toEqual([AGENT.DOCUMENT_REVIEWER])
  })

  it('general 类型包含跨域的当前默认审查器', async () => {
    const result = await callTool({ kind: 'general' })

    expect(result.documentType).toBe('general')
    expect(result.reviewers).toEqual([AGENT.OCR_REVIEWER, AGENT.DOCUMENT_REVIEWER, AGENT.TRACEABILITY_REVIEWER])
  })

  it('document 类型 security 信号激活安全设计审查器', async () => {
    const result = await callTool({ kind: 'document', has_security: true })

    expect(result.reviewers).toContain(AGENT.SECURITY_DESIGN_REVIEWER)
  })

  it('design contract 激活当前设计专用审查器', async () => {
    const result = await callTool({ kind: 'design', has_design_contract: true })

    expect(result.reviewers).toContain(AGENT.ARCHITECTURE_DESIGN_REVIEWER)
    expect(result.reviewers).toContain(AGENT.TEST_CASES_DESIGN_REVIEWER)
    expect(result.reviewers).toContain(AGENT.DESIGN_INTEGRITY_REVIEWER)
  })

  it('has_config remains a non-selection field', async () => {
    const result = await callTool({ kind: 'code', has_config: true })

    expect(result.nonSelectionInputs).toEqual(['has_typescript', 'has_config', 'has_script'])
    expect(result.reviewers).toEqual([AGENT.OCR_REVIEWER, AGENT.DOCUMENT_REVIEWER])
  })

  it('应暴露新增选择参数给真实工具调用方', async () => {
    const definition = await getToolDefinition()

    expect(definition.args).toHaveProperty('has_tooling')
    expect(definition.args).toHaveProperty('has_agent_config')
      expect(definition.args).toHaveProperty('has_product_claim')
      expect(definition.args).toHaveProperty('reviewScenes')
      expect(definition.args).toHaveProperty('targetTypes')
  })

  it('general targets report coverage from the installed review matrix', async () => {
    const result = await callTool({ kind: 'general', targets: 'requirements,design,asset' })

    expect(result.normalizedKind).toBe('general')
    expect(result.reviewers).toContain(AGENT.DESIGN_INTEGRITY_REVIEWER)
    expect(result.reviewers).toContain(AGENT.TRACEABILITY_REVIEWER)
    expect(result.targetCoverage?.requirements.status).toBe('uncovered')
    expect(result.targetCoverage?.design.status).toBe('uncovered')
    expect(result.targetCoverage?.asset.status).toBe('uncovered')
  })

  it('accepts reviewScenes and targetTypes aliases', async () => {
    const result = await callTool({ kind: 'mixed', reviewScenes: 'design', targetTypes: 'design' })

    expect(result.normalizedKind).toBe('general')
    expect(result.reviewers).toContain(AGENT.DESIGN_INTEGRITY_REVIEWER)
    expect(result.targetCoverage?.design.status).toBe('uncovered')
  })

  it('hybrid targets activate traceability without retired evidence reviewers', async () => {
    const result = await callTool({
      kind: 'hybrid',
      targetTypes: 'requirements,design,document',
      has_evidence_claim: true,
    })

    expect(result.normalizedKind).toBe('general')
    expect(result.reviewers).toContain(AGENT.TRACEABILITY_REVIEWER)
    expect(result.reviewers).not.toContain(AGENT.EVIDENCE_REVIEWER)
    expect(result.targetCoverage?.requirements.status).toBe('uncovered')
    expect(result.targetCoverage?.design.status).toBe('uncovered')
    expect(result.targetCoverage?.document.status).toBe('uncovered')
  })
})

describe('ae-review-contract 工具 — 远程写边界', () => {
  it('description 不得引导 GitHub 远程写操作', async () => {
    const definition = await getToolDefinition()
    const description = (definition as unknown as { description?: string }).description ?? ''
    const forbiddenPatterns = [
      /创建\s*Issue/i,
      /创建\s*Pull\s*Request/i,
      /创建\s*PR/i,
      /创建\s*Release/i,
      /push\s+remote/i,
      /git\s+push/i,
      /gh\s+pr\s+create/i,
      /gh\s+issue\s+create/i,
    ]
    for (const pattern of forbiddenPatterns) {
      expect(description).not.toMatch(pattern)
    }
  })
})
