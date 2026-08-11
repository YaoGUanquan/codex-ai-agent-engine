<!-- ae-codex:experience -->
# Governance Batch Four Experience (release-notes split and archive closeout)

## Context

Batches one through three built the retention machinery (tidy, merge-on-conflict, post-update auto-maintenance). Batch four clears the roadmap debt that machinery cannot decide by itself: README release-note growth, finished process directories that tidy deliberately leaves alone, and two frontend items whose correct fix is a recorded disposition rather than code.

## What shipped (repository-side, no version bump)

| Item | Delivery |
| --- | --- |
| Release notes | `CHANGELOG.md`/`CHANGELOG.en.md` hold the full 0.3.7-0.3.24 history (18 entries each); each README keeps the latest five entries plus a changelog link |
| Checker | `check-release-notes` validates four files, the five-entry README window, the changelog link, and the README-subset-of-changelog relation; TDD-covered in `tests/contracts.test.mjs` |
| Process archive | Four directories merged into `docs/00-process/archive/2026-08/` (two finished tasks without done markers, two archived-pointers); `active/` holds only in-flight work |
| Legacy stacks | On-demand policy recorded, no pre-filled entries; trigger = one attributable checklist miss in a real legacy-stack project; action = minimal counterpart entries for that framework plus a version bump |
| Frontend contract mapping | Evaluated and deferred: about five correspondence groups across three files, motion/reduced-motion keywords already test-locked, zero drift since 0.3.18/0.3.19 |

## Reusable lessons

- **Migrate bytes with a script, not by retyping.** The 18 bilingual entries moved through a one-shot extraction script that asserted first-entry-equals-package-version, set equality, and per-block containment before writing. Retyping Chinese text across Windows console encodings is where corruption sneaks in.
- **A window contract needs self-explanatory failure messages.** The oversized-README error names the exact fix ("move older entries to CHANGELOG.md"), so the next release does not need this batch's context to stay compliant.
- **tidy's conservatism is a feature.** archived-pointer retention and refusing to guess about unlabeled finished tasks are correct defaults for arbitrary consumer projects; a one-time repository closeout should stay a manual pass instead of loosening the shared tool.
- **Defer with a trigger, not a vibe.** Both deferred items now name observable re-entry conditions (an attributable legacy-stack miss; a fourth contract file or a real drift defect), so a future session can act without re-deriving the evaluation.

## Verification

- `node --test --test-name-pattern "release-note" tests/contracts.test.mjs`: red against the old checker, green after the rewrite.
- `node scripts/check-release-notes.mjs`: ok at 0.3.24 with the split layout.
- `node scripts/ae-tools.mjs tidy` (dry-run): `active/` contains only the batch-four checkpoint.
- Full `npm run check` and `npm test` results are recorded in `docs/00-process/archive/2026-08/governance-batch-four/summary.md`.
