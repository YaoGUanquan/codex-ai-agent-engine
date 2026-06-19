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

When reviewer selection is non-trivial, generate a deterministic contract before dispatching lanes:

```powershell
node scripts/ae-tools.mjs review-contract --kind code --mode report-only --targets code,document --write-evidence
```

Use the returned reviewers and target coverage as the review routing baseline. The command writes lightweight evidence under `docs/ae/evidence` only when `--write-evidence` is present.

If `.codex/ae-skill-profiles.yaml` has `multi_agent.enabled: auto` or `multi_agent.enabled: true`, and `multi_agent.review_lanes_parallel: true`, read-only reviewer lanes may run in parallel when the scope is large enough and each lane has a distinct lens. When `task-analyze` is available, use `read_parallel_eligibility` and `parallel_waves` for read-only lane planning; do not treat write-worker blockers as blockers for read-only review. This does not authorize write workers. Keep reviewer outputs evidence-backed and merge them under the strictest verdict. `multi_agent.enabled: false` disables parallel reviewer lanes.

For significant code or plan reviews, apply two lanes even when you are not spawning sub-agents:

- reviewer lane: correctness, testing, security, contracts, reliability, and concrete regression risk,
- architect lane: boundary fit, coupling, long-term maintainability, alternatives, rollback, and whether the chosen shape matches the stated decision drivers.

The lanes may be evaluated by one agent, but their conclusions must stay distinguishable in the review notes or final summary when they disagree.

## Complexity Lane

When the user asks for over-engineering, minimality, deletion, bloat, dependency, or simplification review, or when a significant implementation appears structurally larger than the requirement, add a complexity lane. This lane is secondary to correctness, security, data-loss, contract, and validation findings unless the user explicitly requested a complexity-only report.

Use these tags for concrete findings:

- `delete`: dead code, speculative feature, placeholder flexibility, or unreachable branch; replacement is removal.
- `stdlib`: custom code duplicates standard library or framework behavior; name the standard replacement.
- `native`: code or dependency duplicates a platform, browser, database, shell, or framework-native capability; name the native capability.
- `yagni`: abstraction, interface, factory, flag, configuration point, or wrapper has no current second use or explicit requirement.
- `shrink`: same behavior can be expressed materially smaller without losing clarity, validation, or edge-case correctness.

Complexity findings must include location, evidence, what to cut or replace, the concrete replacement, and expected impact. Do not flag narrow tests, trust-boundary validation, security controls, accessibility basics, or explicit user requirements as bloat. Suppress stylistic preferences that do not reduce owned behavior or maintenance risk.

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
- hidden product assumptions masquerading as implementation detail,
- cross-artifact consistency across requirements, constitution, plan, tasks, and validation evidence when those artifacts exist.

Serious findings should block downstream execution until resolved or explicitly accepted by the user.

## Evidence

When a review is used as a delivery gate, preserve enough proof for later checks:

- include worktree, branch, and current Git status summary in the review output when available;
- cite validation commands exactly;
- when `review-contract --write-evidence` was used, mention the returned evidence path;
- use `node scripts/ae-tools.mjs evidence read` to inspect existing evidence records before relying on them.

## Cross-Artifact Review

When reviewing S4 workflow documents, compare available artifacts in this order:

1. `AGENTS.md` and `docs/ae/constitution.md` for governing rules.
2. Requirements or PRD for WHAT/WHY and acceptance criteria.
3. Plan for HOW, files, risks, validation, and rollback.
4. Tasks for dependency order, file ownership, and parallel markers.
5. Gate or validation evidence for actual proof.

Flag contradictions, missing coverage, orphan tasks, and tasks that introduce behavior not present in the approved requirements or plan.

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
