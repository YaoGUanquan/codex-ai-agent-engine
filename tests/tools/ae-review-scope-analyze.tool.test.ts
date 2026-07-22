import { describe, expect, it } from 'vitest'
import { aeReviewScopeAnalyzeTool } from '../../src/tools/ae-review-scope-analyze.tool.js'

describe('ae-review-scope-analyze', () => {
  it('selects registered OCR and document reviewers while excluding Office files', async () => {
    const output = await aeReviewScopeAnalyzeTool.execute({ files: ['src/a.ts', 'docs/guide.md', 'report.docx'], reviewMode: 'changes' }, { metadata: () => undefined } as never)
    const result = JSON.parse(output)

    expect(result.agents).toEqual(expect.arrayContaining(['ocr-reviewer', 'document-reviewer']))
    expect(result.excludedFiles).toEqual(['report.docx'])
  })
})
