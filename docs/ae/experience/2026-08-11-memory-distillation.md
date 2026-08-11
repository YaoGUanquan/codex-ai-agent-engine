<!-- ae-codex:experience -->
# Memory Distillation Experience (2026-08-11)

## Context

Batch three's first `tidy memoryBudget` scan flagged this repository's own `05-decision-log.md` (31.5KB) and `03-key-workflows.md` (20.1KB) against the 15KB budget. This session executed the registered TODO per `06-agent-maintenance-rules.md`: distill or split, rotate the decision log, move-never-delete, sync index and registry.

## What shipped (repository-side)

| File | Before | After | Method |
| --- | --- | --- | --- |
| `05-decision-log.md` | 31.5KB | 14.5KB | 20 entries (2026-05..07) rotated verbatim to the archive shard; 10 entries (2026-08) kept; date+title index left in place |
| `03-key-workflows.md` | 20.1KB | 12.8KB | 6 adaptation-era workflows archived verbatim; pointer map to authoritative homes (`08/09/10/11` memory files, skill bodies, the generic external-research section) |
| Shards | — | — | `docs/99-archive/2026-08/memory-distillation/` with a README recording conservation checks |

## Reusable lessons

- **Move bytes with an asserting script.** The one-shot migration asserted heading-set conservation (20+10=30 decisions; 6 sections), no cross-period leakage, and shard byte-containment before writing; the script was deleted after use.
- **Registry relations have a deliberate target boundary.** `check-memory-knowledge-contract` rejects relation targets outside `AGENTS.md` and `docs/ae/**`; archive-shard pointers belong in the canonical Markdown itself (index sections, `00-index.md`), not in `00-registry.json`.
- **Do not re-grow the decision log with non-decisions.** The distillation record lives in `03-key-workflows.md` (rotation workflow) and `04-known-pitfalls.md` (registry boundary), keeping `05` at 14.5KB for future real decisions.
- **Size the keep-window by budget, not by a fixed period.** The work-project handoff suggested "about two months"; here two months would still exceed 15KB, so the kept window is 2026-08 only.

## Verification

- `node scripts/ae-tools.mjs tidy`: `memoryBudget.oversized = []` after distillation.
- `node scripts/check-memory-knowledge-contract.mjs --root .`, `npm run check`, `npm test` (125/125) all green; registry relations remained grounded because every relation-backing decision/workflow stayed in the live files.
