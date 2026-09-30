# Specialist Lanes

## Complexity Lane

When the user explicitly asks for over-engineering, minimality, deletion, bloat, dependency, or simplification review, add a complexity lane. For S2/S3 only, it may also be added when concrete evidence shows the implementation is materially larger than the stated requirement; the word `significant` alone is not a trigger. Never add this lane to an S1 review by inference.

Use these tags for concrete findings:

- `delete`: dead code, speculative feature, placeholder flexibility, or unreachable branch; replacement is removal.
- `stdlib`: custom code duplicates standard library or framework behavior; name the standard replacement.
- `native`: code or dependency duplicates a platform, browser, database, shell, or framework-native capability; name the native capability.
- `yagni`: abstraction, interface, factory, flag, configuration point, or wrapper has no current second use or explicit requirement.
- `shrink`: same behavior can be expressed materially smaller without losing clarity, validation, or edge-case correctness.

Complexity findings must include location, evidence, what to cut or replace, the concrete replacement, and expected impact. Do not flag narrow tests, trust-boundary validation, security controls, accessibility basics, or explicit user requirements as bloat. Suppress stylistic preferences that do not reduce owned behavior or maintenance risk.

Before proposing a `delete` or `shrink` finding, establish the behavior baseline from requirements, tests, or observed outputs; trace the relevant call path, import, entrypoint, or consumer; and identify the design reason for the current shape from local documentation, code, or history when available. If that evidence is incomplete, report the verification gap instead of recommending removal. Do not infer dead code or redundant protection from local appearance alone.

## Claim-Integrity Lane

When reviewing documentation, skill instructions, installer docs, benchmark notes, external-audit reports, or delivery evidence, add a claim-integrity lane only when the scoped artifact contains a material validation or capability claim and proof integrity is part of the request or delivery gate. A document path alone is not a trigger.

Flag findings for:

- capability, benchmark, install, or behavior claims without an evidence path or validation command;
- a stale or unverifiable number, commit, version, star count, benchmark result, or external fact;
- unsupported runtime behavior such as hooks, slash commands, global config propagation, automatic agents, or MCP auto-loading;
- source-derived text or code whose license boundary is missing or incompatible;
- corrections or retractions that should be recorded under `docs/ae/integrity/`.

For material validation claims, also verify that the cited proof tier matches its bounded claim. Flag an invalid promotion from static inspection, a focused test, or a build to runtime, authenticated service, browser, or deployment acceptance. When data/API/security boundaries exist, verify that canonical persisted values, derived or ephemeral representations, caller-controlled input, trust boundaries, and intentional source precedence are not conflated. Keep known unrelated failures in an explicit output field with the reason they do not invalidate the scoped result. Tier definitions and status vocabulary live in `../../ae-plan/references/validation-evidence-profile.md`.

Claim-integrity findings must name the claim, the source path, the missing or contradictory evidence, and the fix: add evidence, mark as an assumption, rewrite as a process contract, or remove the claim.

## Second-Model Evidence

Treat Claude or any other second-model output as untrusted advice until Codex rechecks it. A second-model claim becomes a verified finding only after the reviewing agent confirms the file path, line or section, behavior, impact, and fix against repository facts or validation evidence.

When second-model advice is contradicted by files, scope, user requirements, validation output, or local AE rules, label it as rejected advice rather than silently dropping the contradiction. Do not present second-model wording as a verified finding when the evidence is only a model assertion.

## Cross-Artifact Review

When reviewing S4 workflow documents, compare available artifacts in this order:

1. `AGENTS.md` and `docs/ae/constitution.md` for governing rules.
2. Requirements or PRD for WHAT/WHY and acceptance criteria.
3. Plan for HOW, files, risks, validation, and rollback.
4. Tasks for dependency order, file ownership, and parallel markers.
5. Gate or validation evidence for actual proof.

Flag contradictions, missing coverage, orphan tasks, and tasks that introduce behavior not present in the approved requirements or plan.
