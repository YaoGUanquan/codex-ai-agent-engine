<!-- ae-codex:experience -->
# Knowledge-Base Governance Experience (Batch One, 0.3.22)

## Context

The 2026-08-11 knowledge-base review found four decay patterns: diverged requirements-capture templates (184 lines between `ae-brainstorm` and `ae-prd`), init permanently seeding a legacy `docs/ai-memory` pointer, unregistered `docs/external-samples/` corpus, and review evidence growing without retention rules (one review-package artifact at 219KB with a full diff body).

User-confirmed dispositions: canonical requirements in `docs/ae/prds/`; stop creating `docs/ai-memory` on new inits; fingerprint review packages; three-month gate/evidence retention policy; register external samples instead of deleting them.

## What shipped (0.3.22)

| Requirement | Delivery |
| --- | --- |
| R1–R3 | `ae-brainstorm` writes durable requirements to `docs/ae/prds/` via `../ae-prd/references/requirements-capture.md`; duplicate brainstorm capture template removed; `recovery` scans prds; init provisions `docs/ae/prds`. |
| R4–R5 | Init no longer creates `docs/ai-memory/`; `memoryReadme` templates removed; contract docs and decision log updated; existing projects untouched. |
| R6–R7 | `review-package` emits fingerprint artifacts (commits, diffstat, inventory, base/head SHA, reproduce command); archive rules document three-month gate/evidence retention. |
| R8 | `docs/external-samples/README.md` registers purpose, source, consumers, and retention. |
| Follow-up | `capability-catalog.json` `artifactPaths.requirements` corrected to `docs/ae/prds`. |

Commits: `53c94aa`, `f36e58e` on `main`.

## Validation

- `npm test` — 116 pass (includes recovery prds scan, init scaffold, fingerprint review-package, brainstorm→prd contract).
- `npm run check` — mirror 126 files, release-notes 0.3.22, memory registry fresh.
- `npm run check:smoke` — `verifiedPluginVersion: 0.3.22`.

Proof boundary: CLI, skill docs, and distribution contracts only—not target-project init runtime or archival automation.

## Reusable lessons

- When two skills own the same artifact shape, delete the duplicate template and point the orchestrator skill at the canonical owner's reference file instead of maintaining parallel copies.
- Review evidence should default to reconstructible fingerprints; full diff bodies belong in ephemeral git queries, not long-lived artifact files.
- Retention policy belongs in archive rules before building tidy automation—otherwise operators have no contract to implement against.
- Parallel sessions sharing a worktree need zero-overlap file sets; shared files (`package.json`, README) accept only field-level or append edits.

## Deferred (not batch one)

- `ae.mjs tidy` archival command (A1).
- Memory volume budget and distillation (A3).
- Collision-insight template home (S2), review lightweight tier (S3), evidence vocabulary convergence (S4), handoff normalization (S5).
