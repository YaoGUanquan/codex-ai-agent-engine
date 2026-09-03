<!-- ae-codex:memory -->
# Frontend Component And Data-Access Governance

## Stable Decision

Frontend work first inspects and reuses the target repository's tokens, primitives, semantic components, transport client, service, query, and mutation owners. Dialogs/drawers, lists/tables, forms, feedback states, and request-state handling should share stable semantic contracts while feature code retains domain fields, permissions, validation, and sequencing. A third equivalent implementation triggers extraction review. No cross-framework AE component runtime or default HTTP dependency is imposed.

## Delivery And Proof

- Delivered in `0.3.41` through `docs/ae/prds/2026-09-03-frontend-component-data-access-governance-prd.md`, `docs/ae/plans/2026-09-03-002-frontend-component-data-access-governance-plan.md`, and the frontend shared reference.
- Experience: `docs/ae/experience/2026-09-03-frontend-component-data-access-governance.md`.
- Proof is limited to source/mirror, document, release, and installation checks; target UI, API, browser, and deployment behavior remain target-project responsibilities.
