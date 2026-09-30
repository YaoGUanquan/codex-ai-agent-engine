# Review Delivery

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## Findings Standard

Read `review-output-template.md`.

Findings must include severity, file/line when applicable, evidence, impact, and fix. Suppress vague style advice unless it creates a concrete risk. Pre-existing unrelated issues must be labeled as such and separated from regressions.

For task-scoped implementation reviews, return the task gate in a deterministic shape that `ae-work` can act on without reinterpretation:

- `specVerdict`: whether the scoped task satisfies the required behavior from the brief or plan unit,
- `qualityVerdict`: whether the scoped implementation quality is acceptable for the touched code,
- `cannotVerifyFromDiff[]`: requirements or claims that need controller-side verification outside the diff,
- `blockingFindings[]`: blocking defects that must be fixed before the task is treated as complete.

Review order:

- Check correctness and requirement alignment first.
- Check validation adequacy, rollback safety, and missing edge cases next.
- Check maintainability and local convention fit last.

For plan and requirements reviews, verify:

- scope clarity,
- file ownership and touched modules,
- validation sufficiency,
- rollback or recovery path,
- hidden product assumptions masquerading as implementation detail,
- cross-artifact consistency across requirements, constitution, plan, tasks, and validation evidence when those artifacts exist.

Serious findings should block downstream execution until resolved or explicitly accepted by the user.

## Evidence

When a review is used as a delivery gate, preserve enough proof for later checks:

- include worktree, branch, and current Git status summary in the review output when available;
- include the changed-file inventory, explicit exclusions, and whether advisory impact context was used for range/commit reviews;
- cite validation commands exactly;
- when `review-contract --write-evidence` was used, mention the returned evidence path;
- use `node "$aeEntry" evidence read` to inspect existing evidence records before relying on them.

## Verdict Rules

Use deterministic verdicts:

- `APPROVE`: no blocking findings and residual risk is acceptable for the requested scope.
- `COMMENT`: findings are informational or low-risk and do not block execution.
- `REQUEST_CHANGES`: correctness, validation, maintainability, contract, or rollback gaps must be fixed before delivery.
- `BLOCK`: the review found a P0/P1 issue, unsafe missing requirement, invalid plan, or unreviewable state.

Final result is the strictest lane verdict. Architect `BLOCK` or reviewer `REQUEST_CHANGES` means the overall review is not approved. If a serious finding is accepted by the user instead of fixed, record that acceptance as residual risk rather than silently approving it.

## Autofix Rules

Only apply fixes when:

- the fix is deterministic,
- the target files are in scope,
- the change does not require product judgment,
- existing user changes are preserved.

After autofix, run relevant validation or state why not.

## Final Response

Findings first, ordered by severity. If no findings, state that explicitly and list residual risks or testing gaps.
