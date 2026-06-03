---
name: ae-computer-use-guard
description: Use when the user asks to use Codex Computer Use, @Computer, desktop control, Windows app control, GUI automation, or local editing software control, especially when screenshot size, context growth, relay servers, or upstream risk must be constrained.
---

# AE Computer Use Guard

Constrain Codex `Computer Use` so desktop GUI tasks stay small, staged, and recoverable. When the user is silent or no valid profile exists, default to the beginner-safe `2G/4-core relay` low-resource assumption.

## Workflow

1. Read `references/shared-profile-contract.md`.
2. Read `references/profiles.md`.
3. Determine the effective profile: if the user did not explicitly request another profile and `.codex/ae-skill-profiles.yaml` has no valid safe override, use `user_mode: beginner` and `server_profile: low_resource` as the `2G/4-core relay` default.
4. Read `references/hooks-gate.md` and verify the hooks-ready gate before any `Computer Use` action.
5. If hooks are missing or untrusted, ask the user before installing or enabling hook templates. If the user refuses, do not use `Computer Use`.
6. Before any approved `Computer Use` action, write a compact execution contract using `references/execution-contract.md`.
7. Use `Computer Use` only for GUI-required work. Route file inspection, media analysis, logs, scripting, and validation to local tools when available.
8. Work one stage at a time: observe, act, verify, summarize, then discard old visual context.
9. Stop on budget exhaustion, missing hooks, repeated failure, wrong window, login/payment/security prompts, permission dialogs, unclear UI state, or user-goal drift.
10. Report completed stage, current state summary, hooks status, effective limits, remaining risk, and whether old screenshots were discarded.

## Hard Rules

- Do not carry old screenshots forward. Convert observations to short state summaries.
- Do not include more than one image in a request.
- Do not upload raw video or large media through conversation context.
- Do not use `Computer Use` when required hooks are missing, untrusted, or declined by the user.
- Do not continue after repeated failures; summarize and ask for user direction.
- Do not use expert settings to bypass global hard limits.
- Do not claim runtime screenshot compression is enforced by this skill alone; note that hooks or server middleware are needed for hard request-body enforcement.
