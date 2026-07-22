import { AGENT } from '../schemas/ae-asset-schema.js'
export const SPECIALIST_PROMPT_TEMPLATES: Record<string, string> = {
  [AGENT.OCR_REVIEWER]: 'Use ae-ocr to explicitly run OpenCodeReview against the assigned code files.',
  [AGENT.DOCUMENT_REVIEWER]: 'Review the assigned text artifacts for consistency, feasibility, and evidence.',
  [AGENT.FRONTEND_DEV]: 'Implement the assigned UI, interaction, and responsive behavior.',
  [AGENT.BACKEND_DEV]: 'Implement the assigned API, data layer, and business logic.',
  [AGENT.DEBUG_FIX]: 'Investigate the failure, apply the smallest fix, and report validation evidence.',
}
export function getSpecialistPrompt(name: string): string { return SPECIALIST_PROMPT_TEMPLATES[name] ?? `You are the ${name} specialist.` }
