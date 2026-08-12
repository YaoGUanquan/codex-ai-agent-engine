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

## Existing-Project Evidence

When the design applies to an existing repository, perform a lightweight, read-only evidence pass before choosing architecture, paths, dependencies, or reusable components. Skip this pass only when the user explicitly requests a greenfield design or asks not to use repository context; record that bypass and its reason in the design contract.

Inspect only the material needed for the design:

- dependency manifests, build/test configuration, and repository instructions for the established stack and commands;
- relevant source, tests, and public contracts for module boundaries, naming, error handling, and existing reusable assets;
- only repository-relative paths and sanitized summaries in the resulting design artifact.

Do not read or record likely secret-bearing paths such as `.env*`, credential stores, private keys, or local authentication files. This is not a repository-wide audit: mark a conclusion `verified`, `inferred`, or `assumed`, preserve unverified gaps, and record a reuse decision or reason not to reuse the inspected asset. When the evidence conflicts with a requested direction, surface it as an explicit design decision instead of silently replacing the local convention.

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
- conditional existing-project evidence, reuse decisions, and bypass reason when repository context informs the design;
- acceptance and test-case contracts that downstream `ae-plan`, `ae-work`, and `ae-review` can verify;
- explicit deferred decisions and explicit omitted dimensions rather than silent defaults.

Keep the contract compact. Include only dimensions that affect implementation, review, or validation. If the artifact becomes too large to scan, keep `design.md` as the overview and split dimension details into sibling Markdown files listed in the Split Manifest.

## Risk-Scaled Test Design

When `test-cases` is required, select the smallest set of methods that exposes the design's actual risks and record that choice in the Test Coverage Matrix:

- use equivalence classes and boundary values for constrained inputs, ranges, lengths, collections, or pagination;
- use decision tables for multi-condition business rules;
- use state transitions for declared UI or workflow states;
- use error guessing for failure, timeout, concurrency, encoding, and hostile-input risks that the other methods do not cover.

For each critical scenario, record the selected design method, covered stable IDs, and an automatable verification signal. Use each coverage category only when its triggering structure exists: API errors, database constraints, authorization decisions, and UI interactions. For an absent category, use `N/A` with the explicit-omission reason. Do not require fixed scenario counts or invent coverage metrics that the design artifact cannot measure.

## Test-Case Quality Guards

For every designed test case, retain a stable `TC-XXX` ID, link it to the requirement or contract IDs it proves, and state an observable expected result. Do not treat "succeeds", "works", or an implementation detail as a sufficient assertion.

Merge or remove semantically duplicate cases: changed fixture values alone do not justify a separate case when the input condition, expected behavior, and covered IDs are materially the same. Keep separate cases only when they cover a distinct risk, boundary, failure behavior, or contract element. These guards improve test-case signal; they do not impose scenario counts, measured coverage claims, or categories whose trigger is absent.

## Review Closure

Before treating a design as ready, run or request `ae-review domain:document` for the design artifact.

The design is ready for `ae-plan` only when:

- required dimensions are present or explicitly justified as omitted;
- stable IDs are unique and referenced by the mapping tables;
- every stable ID used by a mapping table is declared by a canonical `### ADR|EP|T|TC|ST-XXX` heading in `design.md` or a listed sibling Markdown shard;
- every Split Manifest file is an existing Markdown file inside the current design directory;
- cross-dimension mapping does not contradict the dimension sections;
- no P0/P1 document review finding remains unresolved.

## Boundaries

- Do not write implementation code, tests, migrations, CSS, or runtime configuration.
- Do not decompose implementation steps beyond the design constraints needed by `ae-plan`.
- Do not claim OpenCode slash command behavior, dynamic MCP registration, or automatic agent routing.
- Do not use upstream `ae/designs`; this Codex port stores design artifacts in `docs/ae/designs`.
