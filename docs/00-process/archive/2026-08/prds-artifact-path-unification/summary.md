<!-- ae-codex:init managed -->
# PRDs Artifact Path Unification — Archive Summary

- **Status:** done
- **Plan:** `docs/ae/plans/2026-08-11-007-prds-artifact-path-unification-plan.md`
- **Version:** 0.3.25
- **Source:** user P2 finding (capability catalog still labeled `ae-brainstorm` with `docs/ae/brainstorms`; work project `docs/ae/README.md` line 8 kept the pre-0.3.22 wording)

## Finding adjudication

| Claimed stale surface | Verdict |
| --- | --- |
| Capability catalog `ae-brainstorm.artifactPath` | Confirmed stale; fixed to `docs/ae/prds` (source + mirror) |
| Work project `docs/ae/README.md` line 8 | Confirmed stale (init-managed legacy file); fixed in place |
| Also found in verification: `ae-help` artifact-contract Requirements row / frontmatter example / plan origin example; `ae-review` scope-detection document search | Same drift class; fixed in 0.3.25 |
| init templates, top-level `artifactPaths`, this repo's `docs/ae/README.md` | Already correct since 0.3.22; unchanged |
| recovery legacy brainstorms scan, `artifactPaths.ideas`, historical artifacts | Intentionally kept |

## Validation (2026-08-11)

- Regression assertions red before the fix, green after (`node --test --test-name-pattern "brainstorm delegates" tests/skills-docs.test.mjs`)
- `node scripts/check-skill-mirror.mjs` (126 files), `node scripts/check-release-notes.mjs` (0.3.25; first live use of the five-entry README window migration)
- `npm run check` exit 0, `npm test` 125/125, `npm run check:smoke` exit 0
- Review: reviewer/architect/claim-integrity lanes APPROVE, no blocking findings

## Notes

- `check-ae-artifacts` only accepts plan status drafted/ready/active/completed; `approved` was rejected during validation and corrected.
- Work project edit is a single doc file; its Git state is left to the user in that repository.

## Archive note

Former active checkpoint: `docs/00-process/archive/2026-08/prds-artifact-path-unification/progress.md`.
