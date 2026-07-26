<!-- ae-codex:experience -->
# SkillOpt Audit Filter Experience

## Context

The project evaluated Microsoft SkillOpt as a reference for self-evolving agent skills. The selected short-term scope was to improve AE audit judgment only: strengthen `ae-skill-audit` so it can review SkillOpt-like frameworks without installing SkillOpt, importing its runtime, or enabling automatic live skill mutation.

## Decision

Adapt the optimization-loop discipline as an audit filter, not as a runtime. Skill optimization frameworks must be checked for trajectory source, bounded edit shape, validation gate, rejected-update handling, staging/adoption policy, and AE validation mapping before any local skill change is recommended.

## Implementation

- PRD: `docs/ae/prds/2026-07-07-001-skillopt-audit-filter-prd.md`
- Plan: `docs/ae/plans/2026-07-07-005-skillopt-audit-filter-plan.md`
- Skill updated: `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md`
- Mirror updated: `.agents/skills/ae-skill-audit/SKILL.md`
- Template updated: `plugins/ai-agent-engine-codex/skills/ae-skill-audit/references/audit-template.md`
- Mirror template updated: `.agents/skills/ae-skill-audit/references/audit-template.md`
- Regression coverage: `tests/skill-scripts.test.mjs`

## Validation

```powershell
node --test --test-name-pattern "SkillOpt audit filter guidance" tests/skill-scripts.test.mjs
node --test tests/skill-scripts.test.mjs
npm test
node scripts/check-skill-mirror.mjs
node scripts/check-skill-contract.mjs
node scripts/check-ae-artifacts.mjs
npm run check
git diff --check
```

All listed commands passed on 2026-07-07 before commit.

## Reusable Lesson

For external skill optimization frameworks, first ask whether the optimizer has a credible held-out gate and staged adoption boundary. If not, adapt only the process vocabulary into audit guidance or templates. Do not create an auto-evolution skill or import a sleep/replay runtime until AE has a local replay suite and a validation contract strong enough to reject harmful skill edits.
