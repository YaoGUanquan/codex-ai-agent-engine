---
name: ae-task-loop
description: Use when the user asks for AE task loop, /ae-task-loop, iterative repair, keep trying until verified, exploratory fix, environment setup loop, or legacy issue cleanup without a prewritten plan.
---

# AE Task Loop

Iterate on an exploratory task until fixed, verified, or clearly blocked.

## Operating Principles

- Lock success criteria before the loop starts.
- Reproduce or inspect current state before changing anything.
- Each loop runs: verify, decide, fix or rebuild, verify again.
- Each fix hypothesis should be the smallest plausible change that can satisfy the current failing criterion; broaden only after evidence rules out smaller fixes.
- Do not ask new scope questions during the loop unless the original goal is invalid or unsafe.
- Stop after a clear pass, three consecutive no-progress rounds, or an agreed iteration limit.

## Workflow

1. Parse the goal and identify whether another skill is a better fit:
   - unclear requirement: use `ae-prd` or `ae-brainstorm`,
   - written plan: use `ae-work`,
   - focused failure investigation: use `ae-debug`,
   - test-first behavior change: use `ae-tdd`.
2. Establish objective success criteria and validation commands.
3. Run initial verification to capture the current state.
4. If already passing, report evidence and stop.
5. State the smallest plausible fix hypothesis, then apply only the change needed to test that hypothesis.
6. Re-run verification and update loop state.
7. Broaden scope only when the latest evidence invalidates the smaller fix.
8. When all success criteria pass after file changes, run the Candidate Success Review Gate before declaring success.
9. Continue until both completion gates pass, the task is blocked, or the iteration limit is reached.

## Candidate Success Review Gate

Apply this gate only when the loop changed files and objective verification reports that every success criterion passes.

1. Run `ae-review mode:report-only` on the files changed by this loop, using `domain:code` for code or mixed changes and `domain:document` for document-only changes.
2. Require the success criteria to pass and the review to report no blocking findings. Treat both gates as independent: review cannot imply that verification passed, and passing commands cannot imply that review passed.
3. If review returns blocking findings inside the original goal, make the smallest supported finding the next fix hypothesis, apply the fix, and re-run objective verification before reviewing another candidate success state.
4. If review is unavailable or its required scope cannot be inspected, exit as blocked or unverified instead of reporting success.
5. Findings outside the locked goal remain residual risks and do not expand loop scope unless they invalidate the original goal or make the requested change unsafe.

## Loop State

Track:

- iteration number,
- success criteria status,
- validation command and result,
- changed files,
- review status and blocking findings for the latest candidate success state,
- no-progress count,
- blocker or next fix hypothesis.

For long loops, write progress under `docs/00-process/active/<task>/progress.md`.

## Boundaries

- Do not change success criteria mid-loop to match the implementation.
- Do not hide unverifiable criteria; mark them explicitly.
- Do not use review as a substitute for objective success-criteria verification.
- Do not remove validation, trust-boundary checks, security controls, or explicit user requirements merely to make the fix smaller.
- Do not perform Git write operations unless separately requested and authorized.
