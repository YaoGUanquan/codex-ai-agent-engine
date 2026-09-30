# Planning Decisions

## Plan Readiness Gate

Before writing a plan, verify that these inputs are clear enough:

- goal and user-visible outcome,
- acceptance criteria or success signal,
- known non-goals or scope boundary,
- affected system area and likely file ownership,
- validation surface.

If any item is materially unclear, ask one focused question or route to `ae-brainstorm`. Do not fill gaps with invented product behavior.

When the plan crosses a public API, persisted data, external service, deployment, or browser boundary, load `validation-evidence-profile.md`. Select only the tiers that apply, record their preconditions and bounded claims, and make blocked or `unverified` proof visible. Do not infer a higher-tier result from a lower-tier check. Do not load this profile for a lightweight lane that stays within source-level validation.

For database-backed query/list/count or bulk/async write work, load the [data-access and scale contract](../../ae-backend/references/data-access-contract.md) and carry the applicable Data Access Budget into owned units and acceptance checks. Resolve logical row/total, freshness, batch/commit and recovery decisions before coding. Include auxiliary-table backfill/reconciliation/cutover and durable-job failure tests when chosen; do not reduce a structural data-access problem to a loop rewrite.

For tasks with multiple plausible designs in the standard/deep lane, compare 2-3 approaches before selecting one. Keep the comparison short: fit, trade-off, risk, and why the recommended approach wins. In the lightweight lane, state the single viable route and continue.

For implementation-heavy standard/deep plans, include the simplest viable route in that comparison: standard library, framework/native platform capability, existing dependency, deletion/configuration-only change, or the smallest new code path. New dependencies, abstractions, broad refactors, or extra files need a current requirement or repository pattern that justifies owning them now.

For high-risk plans, add a deliberate planning pass before implementation units:

- list the top 3 decision drivers,
- name 3 pre-mortem failure scenarios,
- include validation across the relevant levels: unit, integration, user flow, data/ops, or observability,
- record rollback or recovery signals that would prove the plan is unsafe to continue.

High-risk includes auth, permissions, public API contracts, migrations, data deletion, billing, concurrency, background jobs, security-sensitive flows, cross-module refactors, or broad behavior changes.

## Five-Layer Ownership

For cross-cutting AE skill, plugin, installation, documentation, or governance work, identify whether each implementation unit touches Memory, Knowledge, Guardrail, Delegation, or Distribution. Use `docs/ae/references/codex-five-layer-architecture.md` as the placement map.

When a unit changes docs, README content, installation behavior, capability claims, benchmark claims, or runtime-support claims, include a claim-evidence note: the evidence path, validation command, or explicit assumption that will prove the changed claim. Do not claim hooks, global config, slash commands, MCP auto-loading, or automatic agents unless the current Codex runtime or local scripts actually provide that behavior.

## Optional Cross-Model Lane

Use a second-model planning lane only when risk, ambiguity, or external-repository comparison justifies the extra review. The lane is optional; Codex remains the orchestrator and owns the final plan.

Before delegation, write a prompt contract that names:

- scope and target files;
- forbidden files and forbidden behavior;
- expected output shape;
- validation expectations;
- assumptions and open questions.

Treat the second model's output as untrusted advice until Codex checks it against repository facts, user requirements, validation commands, and local AE boundaries. Do not let second-model advice add scope, dependencies, runtime assumptions, or user decisions without recording and reviewing them in the plan.

## Plan Self-Review

Before finalizing, check and fix the plan inline:

- no `TBD`, `TODO`, placeholder sections, or vague verbs such as "wire up" without file-level detail,
- no contradiction between scope, decisions, implementation units, and validation,
- assumptions are explicit and do not masquerade as requirements,
- alternatives and decision records explain why the selected approach is preferable,
- every acceptance criterion maps to at least one implementation unit or validation step,
- every source requirement ID maps to at least one implementation unit or is explicitly deferred,
- high-risk plans include pre-mortem failures and layered validation,
- rollback and recovery signals are credible for the changed area,
- proposed dependencies, abstractions, wrappers, and files are justified by current requirements rather than speculative future flexibility,
- claim-evidence notes exist for changed public or workflow claims,
- the plan is still focused enough for one execution pass; otherwise split it.
