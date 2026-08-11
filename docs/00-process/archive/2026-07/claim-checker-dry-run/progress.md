# claim-checker-dry-run progress

## 2026-07-06

- Started after user approved moving from manual claim-integrity review toward `scripts/check-claims.mjs --dry-run`.
- Scope fixed to explicit `ae-claim` blocks, schema/path validation, and dry-run JSON output.
- Non-goals recorded: no NLP extraction, no command execution, no `npm run check` wiring, no new skill.
- PRD written: `docs/ae/prds/2026-07-06-002-claim-checker-dry-run-prd.md`.
- Plan written: `docs/ae/plans/2026-07-06-002-claim-checker-dry-run-plan.md`.
- TDD red run: `node --test tests/check-claims.test.mjs` failed because `scripts/check-claims.mjs` did not yet satisfy the JSON contract.
- TDD green run: `node --test tests/check-claims.test.mjs` passed after adding `scripts/check-claims.mjs`.
- Repository dry-run: `node scripts/check-claims.mjs --dry-run` reported `status: ok`, `claimsChecked: 1`, and `claimFiles: ["docs/ae/integrity/README.md"]`.
- Full validation run started after marking PRD and plan completed so artifact lifecycle state is checked in the final gate.
- Added copied work-doc samples under `docs/external-samples/work-docs/` so this repository can validate real PRD/plan/gate/smoke claim patterns without modifying `D:/codes/work`.
- Added `docs/ae/integrity/work-docs-sample-claims.md` with path, command, assumption, and deferred claim examples.
- Expanded copied samples to all `D:/codes/work/docs/ae/prds`, `D:/codes/work/docs/ae/plans`, and `D:/codes/work/docs/ae/gates`.
- Added `docs/ae/integrity/work-docs-expanded-claims.md` with 37 additional `ae-claim` blocks covering PRD, plan, gate, command, assumption, and deferred evidence.
- Expanded dry-run result: `node scripts/check-claims.mjs --dry-run` checked 45 total claims across local integrity manifests with no errors and expected dry-run warnings for command, assumption, and deferred evidence.
