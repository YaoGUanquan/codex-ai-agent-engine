<!-- ae-codex:memory -->
# Persistence Contract Governance

## Stable Decision

New durable tables require an explicit lifecycle and primary-key decision, including whether the identifier is externally exposed. Do not silently choose auto-increment or UUID. For repositories using MyBatis-Plus, apply optimistic versioning, logical deletion, audit fields, fill policies, indexes, stable enum codes, and unified exception translation only when table lifecycle and existing project conventions require them.

## Delivery And Proof

- Delivered in `0.3.40` through `docs/ae/prds/2026-09-03-persistence-contract-governance-prd.md`, `docs/ae/plans/2026-09-03-001-persistence-contract-governance-plan.md`, and the backend shared reference.
- Experience: `docs/ae/experience/2026-09-03-persistence-contract-governance.md`.
- Proof is limited to source/mirror, document, release, and installation checks; target database, API, browser, and deployment behavior remain target-project responsibilities.
