<!-- ae-codex:init managed -->
# Governance Batch Four — Archive Summary

- **Status:** done
- **PRD:** `docs/ae/prds/2026-08-11-governance-batch-four-prd.md`
- **Plan:** `docs/ae/plans/2026-08-11-006-governance-batch-four-plan.md`
- **Experience:** `docs/ae/experience/2026-08-11-governance-batch-four.md`
- **Version:** unchanged 0.3.24 (repository-side only; no distributable content touched)

## Delivered

| Unit | Outcome |
| --- | --- |
| U1/U2 | `check-release-notes` new contract (current entry in four files, 5-entry README window, changelog link, README-subset-of-changelog); TDD red-to-green in `tests/contracts.test.mjs` |
| U3 | `CHANGELOG.md`/`CHANGELOG.en.md` hold the full history (18 entries, 0.3.7-0.3.24); each README keeps the latest five; AGENTS.md release rule, `docs/release-checklist.md`, and both working-rule paragraphs updated |
| U4 | Four directories merged into `docs/00-process/archive/2026-08/` (api-smoke-fillable-request-config, personal-marketplace-global-plugin, and the two archived-pointers); `active/` reflects in-flight work only |
| U5 | Decision-log entry records the on-demand legacy-stack policy and the deferred frontend-contract mapping with revisit triggers; registry +2 decision-log relations |
| U6 | Batch artifacts completed and archived; roadmap items 7-10 rewritten in both READMEs |

## Validation (2026-08-11)

- `node --test --test-name-pattern "release-note" tests/contracts.test.mjs` — red against the old checker, green after the rewrite
- `node scripts/check-release-notes.mjs` — ok at 0.3.24 with the split layout
- `npm run check` — pass; `npm test` — 125/125
- `node scripts/check-memory-knowledge-contract.mjs --root .` (40 relations) and `node scripts/check-ae-artifacts.mjs` (111 artifacts) — ok
- `node scripts/ae-tools.mjs tidy` (dry-run) — only this batch remained active before closeout; memory-budget oversize items are pre-existing batch-three findings
- Review: reviewer, architect, and claim-integrity lanes all APPROVE with no blocking findings

## Boundaries

- Static checks and unit tests only; GitHub rendering of the changelogs and consumer-project effects are unverified (no plugin change, none expected).
- Git commit/push intentionally left to the user.

## Archive note

Former active checkpoint: `docs/00-process/archive/2026-08/governance-batch-four/progress.md`.
