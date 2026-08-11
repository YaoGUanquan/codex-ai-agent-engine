<!-- ae-codex:experience -->
# Governance Batch Two Experience (tidy, 0.3.23)

## Context

Batch one (0.3.22) established the retention policy on paper. Batch two made it executable: a `tidy` command, the `gate --validation` accumulation fix, four skill refinements (collision landing, review light path, evidence-tier pointer, handoff routing), and memory size budgets. Both this repository and the work reference project were actually tidied.

## Reusable lessons

- Conservative defaults make archive automation safe: dry-run as default, explicit `--apply`, `--archive-stale` as a separate opt-in, and skip-on-existing-target turned a destructive-feeling operation into a reviewable one. The two skipped tasks (here: `structural-debt-refactor`; work: `class-create-drawer-backend`) were exactly the cases where another session had already created a same-name archive; the skip surfaced them instead of clobbering.
- Status markers in process notes are inconsistent across sessions (`状态：\`done\``, `**状态：** archived`, `Status: active`, no marker at all). Stripping markdown emphasis before matching and combining explicit markers with mtime-based staleness covered all observed forms.
- `--stale-days` needs judgment per run: the default 30 keeps recent work safe, while a governance pass over known-finished July tasks needed 11 days here. Tuning the threshold per invocation beats encoding one global answer.
- Repeated-flag accumulation in `parseOptions` was a two-line fix, but the gate proof quality depended on it; check evidence shape early when adding CLI-driven governance records.
- Cross-repository writes (work project) should go through an explicit approval step even when the user authorized them in chat; the dry-run listing doubles as the review artifact for that approval.

## Calibration signals (Light Path and collision triggers)

Collect these while using 0.3.23+; revisit the thresholds after roughly ten real reviews or two weeks, whichever comes first.

- Light Path too loose: a review taken on the light path later surfaces a boundary defect (public API, persisted data, security, dependency) or a P0/P1 that the full flow's inventory or contract would have caught. One occurrence = tighten (lower the file cap or add a trigger).
- Light Path too tight: repeated small doc-only or test-only diffs still route through review-package/review-contract without producing extra findings. Three consecutive occurrences = widen the light path definition.
- Collision overtrigger: a perspective collision pass runs on an S1-S2 task with a single viable direction and produces no insight that changes scope, assumptions, or validation. Two occurrences = sharpen the skip rule.
- Collision undertrigger: a chosen direction gets reversed after planning because a value/assumption disagreement surfaced late. One occurrence = add the missed shape to the trigger list.

## Verification

- `npm test` 121/121, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs` all green at 0.3.23.
- Tidy runs evidenced by command JSON output recorded in `docs/00-process/archive/2026-08/governance-batch-two/progress.md`.
