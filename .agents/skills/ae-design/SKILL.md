---
name: ae-design
description: Use when the user asks for AE design, /ae-design, design contract creation, PRD-to-plan design decisions, architecture/API/data/UI/test/security design, old design revision, or a design artifact before implementation planning.
---

# AE Design

Create a design contract between PRD and implementation plan. This skill defines what must stay consistent across architecture, API, data, UI/UX, tests, security, observability, and non-functional constraints; it does not implement code.

## Input Routing

Identify the source in this order:

1. PRD input: read the supplied PRD path under `docs/ae/prds` or another repository-relative requirements path and carry its goal, scope, acceptance criteria, decisions, assumptions, and open questions.
2. Old design input: read the prior `docs/ae/designs/<topic>-YYYY-MM-DD/design.md` and preserve stable IDs unless a decision is explicitly superseded.
3. Bare-description fallback: if the user only gives a description, ask whether to create a PRD first or proceed with a lightweight design contract based on the description.

Write new design artifacts under `docs/ae/designs/<topic>-YYYY-MM-DD/`. Use repository-relative paths only.

## Dimension Selection

Use risk-based dimension triggers before writing content:

| Trigger | Required dimensions |
| --- | --- |
| API signature, auth model, schema, or public contract change | overview, architecture, api, database, security, test-cases |
| New module, cross-module dependency, shared configuration, or runtime boundary | overview, architecture, test-cases |
| Page, workflow, interaction, visual baseline, or component change | overview, ui-ux, test-cases |
| Table, field, migration, persistence, or data retention change | overview, database, test-cases |
| Production deployment, operations, reliability, or performance sensitivity | overview, observability, non-functional, test-cases |

For dimensions that are not triggered, record explicit omitted dimensions in the overview as `<dimension>: explicitly-omitted` with a short reason. Required dimensions cannot be omitted without returning to the user or PRD for scope clarification.

## Contract Requirements

Use `references/design-contract-template.md` when writing `design.md`.

Every design contract must include:

- stable IDs: `ADR-XXX` for decisions, `EP-XXX` for API endpoints, `T-XXX` for tables or durable data structures, `TC-XXX` for test cases, and `ST-XXX` for UI states;
- cross-dimension mapping covering API fields to data, API errors to UI states, test cases to contract coverage, and UI components to API endpoints;
- implementation constraints such as repository paths, build/runtime assumptions, environment variables, dependency boundaries, and feature flags when relevant;
- acceptance and test-case contracts that downstream `ae-plan`, `ae-work`, and `ae-review` can verify;
- explicit deferred decisions and explicit omitted dimensions rather than silent defaults.

Keep the contract compact. Include only dimensions that affect implementation, review, or validation. If the artifact becomes too large to scan, keep `design.md` as the overview and split dimension details into sibling Markdown files listed in the Split Manifest.

## Review Closure

Before treating a design as ready, run or request `ae-review domain:document` for the design artifact.

The design is ready for `ae-plan` only when:

- required dimensions are present or explicitly justified as omitted;
- stable IDs are unique and referenced by the mapping tables;
- cross-dimension mapping does not contradict the dimension sections;
- no P0/P1 document review finding remains unresolved.

## Boundaries

- Do not write implementation code, tests, migrations, CSS, or runtime configuration.
- Do not decompose implementation steps beyond the design constraints needed by `ae-plan`.
- Do not claim OpenCode slash command behavior, dynamic MCP registration, or automatic agent routing.
- Do not use upstream `ae/designs`; this Codex port stores design artifacts in `docs/ae/designs`.
