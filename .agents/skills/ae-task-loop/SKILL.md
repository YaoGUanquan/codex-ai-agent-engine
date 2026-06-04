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
5. Apply the smallest change likely to satisfy failing criteria.
6. Re-run verification and update loop state.
7. Continue until pass, blocked, or iteration limit.

## Loop State

Track:

- iteration number,
- success criteria status,
- validation command and result,
- changed files,
- no-progress count,
- blocker or next fix hypothesis.

For long loops, write progress under `docs/00-process/active/<task>/progress.md`.

## Boundaries

- Do not change success criteria mid-loop to match the implementation.
- Do not hide unverifiable criteria; mark them explicitly.
- Do not perform Git write operations unless separately requested and authorized.
