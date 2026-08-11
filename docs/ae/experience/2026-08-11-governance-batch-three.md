<!-- ae-codex:experience -->
# Governance Batch Three Experience (auto-maintenance, 0.3.24)

## Context

Batch two (0.3.23) made retention policy executable via `tidy`, but archive targets with the same name were skipped. Batch three closes the loop for consumer projects: lossless merge-on-conflict, report-only memory budgets, and automatic post-update maintenance through `update-project`.

## What shipped (0.3.24)

| Requirement | Delivery |
| --- | --- |
| Archive merge | Missing files move in; identical deduplicate; conflicts get `.from-active-<date>` suffix |
| Memory budget | `tidy` reports oversized `docs/08-ai-memory/*.md`; never moves them |
| Auto maintenance | After install, `update-project` runs `tidy --apply`; summary in `maintenance`; `--no-tidy` skips |
| Work closeout | Two conflict dirs merged; distillation handoff left for that project's session |
| Calibration | Light Path / collision signals documented in batch-two experience note |

## Reusable lessons

- **Update hook is the right place for consumer automation.** Projects already run `update-ae-codex.mjs`; piggybacking `tidy --apply` there means every upgrade self-heals done notes and empty dirs without a separate runbook. Degrade-to-skipped keeps updates resilient.
- **Merge beats skip for archive conflicts.** The two work-project cases were small active `progress.md` files landing on large existing archives; suffix merge preserved both without overwriting.
- **Memory distillation must respect live sessions.** work project's `08-ai-memory` files had mtime at check minute — concurrent rewrite risk. Handoff artifact beats forced distillation from a foreign session.
- **Self-dogfooding surfaces debt immediately.** First `tidy` after shipping flagged this repo's own `05-decision-log.md` (30KB) and `03-key-workflows.md` (18KB) over budget — expected after three governance batches writing decisions/workflows inline.

## Verification

- `npm test` 125/125, `npm run check`, `npm run check:smoke`, `check-release-notes` at 0.3.24.
- Published: commit `6721ce3` on `main`.
