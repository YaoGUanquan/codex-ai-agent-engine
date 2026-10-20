# Validation Contract

Use the repository's actual test commands and applicable project requirements. Select checks by the changed behavior and dependencies, not by workflow stage.

## Select And Escalate

- For a single failure, start with the failed test case or test class. After a fix, run that target; include directly affected tests when shared implementation changed.
- Run a full suite only for cross-module shared behavior, build or dependency configuration changes, an impact boundary that cannot be reliably narrowed, or an explicit user/applicable project requirement. Explain the concrete reason before running the full suite.
- If a full suite exposes a single failure, isolate it and fix with targeted runs. When final full-suite confirmation is required, run it once after the relevant fixes; stop when it passes and no related changes follow.
- Repeat unchanged checks only to investigate flaky tests, concurrency or environment failures, with a stated purpose and an end condition. A new failure needs diagnosis, not another identical broad run.

## Reuse And Invalidate

- Keep a short in-session record: command, scope, result, relevant code/test/config/environment state, and any remaining gap. Ordinary tasks need no new evidence file. For a handoff, carry this compact record using an already authorized handoff surface.
- Reuse passing evidence while those relevant inputs remain unchanged. Workflow phase changes into review or shipping, and interruption or compaction, are not reasons to rerun. On recovery, verify the recorded state still matches; if it cannot be established, mark the evidence unverified and run the smallest necessary check.
- Only the affected validation results become invalid after a relevant edit. An unrelated documentation edit does not invalidate tests; documentation used as a config, fixture or input does. Apply the same dependency-based rule to test, build, configuration and environment changes.
- Review assesses existing evidence and requests only missing or invalid checks. Shipping reports that evidence; it does not automatically execute tests again.

## Report The Actual Boundary

Never combine passing subsets from different code states into a claimed final full-suite pass. State the exact scopes and states actually checked. A prior full-suite pass followed by a targeted pass after a fix is not a full-suite pass on the final state.

Once applicable acceptance checks have valid passing evidence, stop testing. Report failures, skipped checks and remaining proof gaps honestly. Static checks, authenticated API tests, browser acceptance and deployment proof remain separate. Test side effects still follow the [isolation boundary](test-side-effect-boundary.md).
