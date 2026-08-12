# Validation Evidence Profile

Use this reference only when the planned behavior crosses a public API, persisted data, external service, deployment, or browser boundary. Select the smallest set of tiers that proves the relevant acceptance criteria. Do not turn the profile into a mandatory full-stack checklist for scoped work.

## Selection Rules

1. Start with the changed boundary and its acceptance criterion, not with a preferred test command.
2. Record each applicable tier's expected signal, preconditions, owner, status, and bounded claim.
3. Mark a tier `not-applicable` with a reason when the boundary does not require it. Mark it `blocked` or `unverified` when the required proof cannot run.
4. A lower tier never proves a higher tier. Static inspection, a focused test, or a build does not prove runtime health, authenticated service behavior, browser acceptance, or deployment readiness.
5. Keep credentials, signed URLs, private responses, production hosts, and real identifiers out of the profile and delivery evidence.

## Evidence Tiers

| Tier | Use when | Expected signal | Typical preconditions |
| --- | --- | --- | --- |
| Static inspection | Source, configuration, or document contract can be checked without execution. | Target file or parser check confirms the stated invariant. | Current source tree. |
| Focused automated test | A narrow behavior has deterministic automated coverage. | Named test passes and states the behavior it covers. | Test dependencies and fixtures. |
| Integration or build | Module wiring, packaging, or cross-component compatibility matters. | Build, contract, or integration check passes. | Required local services or build inputs. |
| Runtime health | A running process must initialize and report healthy. | Health/readiness signal reaches the expected state. | Local runtime and safe configuration. |
| Authenticated service smoke | A real protected service boundary must be exercised. | Authorized request returns the expected bounded result. | Running service and user-controlled credential reference. |
| Browser acceptance | A user-visible browser flow or browser-only integration matters. | Intended interaction, network result, and visible state are observed. | Running UI, test account, and browser tooling. |
| Deployment or operations | Release topology, operational behavior, or production-like rollout matters. | Deployment/operations signal confirms the stated release condition. | Authorized target environment and rollback access. |

## Status And Claim Boundary

Each selected tier must use exactly one status:

- `passed`: the named signal was observed under its recorded preconditions.
- `failed`: the named signal did not meet its expected condition.
- `blocked`: a known prerequisite prevents the proof from running.
- `not-applicable`: the changed boundary does not require this tier; state why.
- `unverified`: the tier is relevant but has not been credibly exercised; state the residual risk.

Do not replace `blocked` or `unverified` with an inferred pass. A focused test may support only the behavior it executes; it cannot promote a claim to browser or deployment acceptance.

## Contract Value Classification

When the change has a persisted data, public API, security, or external-service boundary, identify:

- canonical persisted value: the durable source of truth;
- derived or ephemeral representation: generated, cached, signed, transformed, or temporary output;
- caller-controlled input: the value supplied by an actor before trust-boundary validation;
- compatibility fallback or source precedence: any intentional alternate source and its selection rule;
- trust boundary: where ownership, authorization, path, identifier, or integrity checks occur.

Omit this section for work without those boundaries. Do not mistake a cache, fixture, generated URL, or caller input for a canonical value without an explicit contract decision.

## Evidence Matrix

Use this compact matrix for high-risk acceptance criteria. A blocked or deferred row does not change the acceptance criterion; it records what remains unverified and who owns recovery.

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| <criterion> | <tier> | <signal and only what it proves> | <environment or actor> | <status> | <safe stop or recovery signal> |

## Delivery Evidence

Keep command output and local review notes separate from durable records. Promote only sanitized, useful outcome evidence to a process archive or memory artifact when the task or user explicitly requires it; do not automate promotion.
