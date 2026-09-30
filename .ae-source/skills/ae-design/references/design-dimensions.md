# Design Dimensions

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

When the database dimension is triggered, read `../../ae-backend/references/persistence-contract.md`. Each affected `T-XXX` must record lifecycle, primary-key decision and external exposure, audit ownership, deletion/retention semantics, concurrency policy, enum representation, constraints/indexes, migration ordering, rollback, and the error outcome for version conflicts. A project-specific convention may answer a decision; otherwise leave it open and ask the user instead of selecting a default.

For database-backed list/query/count or write paths, apply the [data-access and scale contract](../../ae-backend/references/data-access-contract.md) even if the schema is unchanged. Record the applicable Data Access Budget in the design. Large/hot queries require comparison of direct/indexed access and auxiliary/read-model options; large or async writes require batch, transaction, durable completion and recovery decisions. Include architecture, database, non-functional, observability and test dimensions where these decisions cross their boundaries; do not require every dimension for bounded single-row CRUD.

## Contract Requirements

Use `design-contract-template.md` when writing `design.md`.

Every design contract must include:

- stable IDs: `ADR-XXX` for decisions, `EP-XXX` for API endpoints, `T-XXX` for tables or durable data structures, `TC-XXX` for test cases, and `ST-XXX` for UI states;
- cross-dimension mapping covering API fields to data, API errors to UI states, test cases to contract coverage, and UI components to API endpoints;
- implementation constraints such as repository paths, build/runtime assumptions, environment variables, dependency boundaries, and feature flags when relevant;
- conditional existing-project evidence, reuse decisions, and bypass reason when repository context informs the design;
- acceptance and test-case contracts that downstream `ae-plan`, `ae-work`, and `ae-review` can verify;
- explicit deferred decisions and explicit omitted dimensions rather than silent defaults.

When the UI/UX dimension is triggered, read `../../ae-frontend-design/references/ui-direction-contract.md` and `../../ae-frontend-design/references/component-data-access-contract.md`. Include the compact UI Direction Contract and selected component/data-access reuse boundary under UI/UX. Existing project tokens and supplied designs outrank contextual inference; mark material choices `verified`, `inferred`, or `assumed`. A runnable static interaction specification may be design evidence, but it cannot replace requirements, security, concurrency, non-functional, or source-code verification contracts.

Keep the contract compact. Include only dimensions that affect implementation, review, or validation. If the artifact becomes too large to scan, keep `design.md` as the overview and split dimension details into sibling Markdown files listed in the Split Manifest.
