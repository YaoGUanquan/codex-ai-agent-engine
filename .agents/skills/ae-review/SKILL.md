---
name: ae-review
description: Use when the user asks for AE review, /ae-review, layered review, report-only review, autofix review, domain:code, domain:document, review a plan, review requirements, review current changes, or inspect risks before delivery. Findings must be primary.
---

# AE Review

Perform AE-style layered review of code or documents.

## Scope First

Read `references/scope-detection.md`. Determine exactly one scope and one domain before reviewing.

Supported domain markers:

- `domain:code` for diffs, files, session changes, or full code scans.
- `domain:document` for requirements, plans, test docs, or general docs.

Supported mode markers:

- `mode:report-only`: read-only findings, no fixes.
- `mode:autofix`: apply only deterministic fixes after reporting internally.
- `mode:headless`: concise pipeline review.

## Persona Selection

Read `references/review-personas.md`. Use the smallest useful reviewer set. Do not spawn sub-agents unless the user explicitly requested/allowed parallel agent work. If sub-agents are allowed, each reviewer is read-only and must return evidence-backed findings.

If `.codex/ae-skill-profiles.yaml` has `multi_agent.enabled: auto` or `multi_agent.enabled: true`, and `multi_agent.review_lanes_parallel: true`, read-only reviewer lanes may run in parallel when the scope is large enough and each lane has a distinct lens. This does not authorize write workers. Keep reviewer outputs evidence-backed and merge them under the strictest verdict. `multi_agent.enabled: false` disables parallel reviewer lanes.

For significant code or plan reviews, apply two lanes even when you are not spawning sub-agents:

- reviewer lane: correctness, testing, security, contracts, reliability, and concrete regression risk,
- architect lane: boundary fit, coupling, long-term maintainability, alternatives, rollback, and whether the chosen shape matches the stated decision drivers.

The lanes may be evaluated by one agent, but their conclusions must stay distinguishable in the review notes or final summary when they disagree.

## Findings Standard

Read `references/review-output-template.md`.

Findings must include severity, file/line when applicable, evidence, impact, and fix. Suppress vague style advice unless it creates a concrete risk. Pre-existing unrelated issues must be labeled as such and separated from regressions.

Review order:

- Check correctness and requirement alignment first.
- Check validation adequacy, rollback safety, and missing edge cases next.
- Check maintainability and local convention fit last.

For plan and requirements reviews, verify:

- scope clarity,
- file ownership and touched modules,
- validation sufficiency,
- rollback or recovery path,
- hidden product assumptions masquerading as implementation detail.

Serious findings should block downstream execution until resolved or explicitly accepted by the user.

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
