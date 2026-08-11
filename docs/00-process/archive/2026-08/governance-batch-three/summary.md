<!-- ae-codex:init managed -->
# Governance Batch Three — Archive Summary

- **Status:** done
- **PRD:** `docs/ae/prds/2026-08-11-governance-batch-three-prd.md`
- **Plan:** `docs/ae/plans/2026-08-11-005-governance-batch-three-plan.md`
- **Experience:** `docs/ae/experience/2026-08-11-governance-batch-three.md`
- **Version:** 0.3.24
- **Commit:** `6721ce3`

## Delivered

| Unit | Outcome |
| --- | --- |
| U1 | `tidy` lossless file-by-file merge into existing archive targets |
| U2 | `memoryBudget` report-only scan (default 15KB) |
| U3 | `update-project` post-install auto `tidy --apply` + `maintenance` summary; `--no-tidy` opt-out |
| U4 | Work project: 2 archive conflicts merged; memory-distillation handoff staged |
| U5 | Calibration signals appended to batch-two experience note |
| U6 | SemVer 0.3.24 + README/INSTALL/ae-update docs; full validation green |

## Validation (2026-08-11)

- `npm test` — 125 pass (includes merge + budget + auto-maintenance cases)
- `npm run check` / `npm run check:smoke` / `check-release-notes` — pass
- Gate: `docs/ae/gates/20260811T043733Z-work-final.json` (local, gitignored)

## Consumer effect

After `node scripts/update-ae-codex.mjs`, target projects automatically receive conservative maintenance (done notes, empty dirs, expired evidence, memory budget report) unless `--no-tidy` is passed.

## Archive note

Former active checkpoint: `docs/00-process/archive/2026-08/governance-batch-three/progress.md`.
