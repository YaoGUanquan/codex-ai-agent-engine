<!-- ae-codex:experience -->
# API Smoke Fillable Request Config Experience

## Context

`ae-test-api` authenticated smoke relied on the shared local-runtime smoke gate to create a token-free request template. In practice, agents sometimes wrote empty config files or used Windows PowerShell redirection that corrupted non-ASCII fill instructions, so users did not know how to provide a local token safely.

## Decision

Keep the user-mediated token-free handoff, but require a shared fillable template shape:

1. Create a non-empty UTF-8 without BOM request config.
2. Include method, path/URL, non-secret headers, numbered fill steps, and exactly one `REPLACE_WITH_LOCAL_TOKEN`.
3. Report only the absolute path; never read the populated file.
4. Do not add a default HTTP client or template-generator runtime.

## Implementation

- PRD: `docs/ae/prds/2026-08-10-api-smoke-fillable-request-config-prd.md`
- Plan: `docs/ae/plans/2026-08-10-003-api-smoke-fillable-request-config-plan.md`
- Shared reference: `plugins/ai-agent-engine-codex/skills/ae-work/references/request-config-template.md`
- Gate: `plugins/ai-agent-engine-codex/skills/ae-work/references/local-runtime-smoke-gate.md`
- Skill: `plugins/ai-agent-engine-codex/skills/ae-test-api/SKILL.md`
- Mirror copies under `.agents/skills/`
- Version: `0.3.17`

## Validation

```powershell
node --test --test-name-pattern "API bubble testing|local runtime smoke gate" tests/skill-scripts.test.mjs
node scripts/check-skill-mirror.mjs
node scripts/check-skill-contract.mjs
node scripts/check-skill-language-metadata.mjs
node scripts/check-release-notes.mjs
```

These checks prove skill and distribution contracts only. They do not prove a target-project authenticated API smoke.

## Reusable Lesson

When a workflow asks the user to fill a local secret reference, generate a complete fillable template first. Empty files and encoding-unsafe writers turn a safety handoff into a usability failure.
