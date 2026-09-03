---
type: prd
status: completed
date: 2026-09-03
topic: persistence-contract-governance
format: human-readable-requirements
sharded: false
---

# Persistence Contract Governance

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

AE checks schemas and migrations but does not consistently require a primary-key choice, table lifecycle, entity governance, persisted enum representation, or exception translation contract. Add a conditional, stack-aware rule without imposing MyBatis-Plus on unrelated tables or frameworks.

## Requirements

- R1. A new durable table requires an explicit primary-key decision before implementation: auto-increment numeric ID or UUID, and whether the ID is externally exposed.
  Acceptance: when repository/user evidence does not decide it, guidance asks `本次新增持久化表的主键策略选择自增 BIGINT，还是 UUID？是否需要对外暴露该 ID？` and never invents a default.
- R2. The workflow classifies table lifecycle before prescribing fields: mutable aggregate, association table, append-only audit/event/outbox table, or reference/dictionary table.
  Acceptance: version, logical deletion, and audit fields are explicitly conditional.
- R3. Java repositories already using MyBatis-Plus receive conditional guidance for `version`, `deleted`, `create_by`, `create_time`, `update_by`, and `update_time`.
  Acceptance: guidance contains the supplied annotations, fill ownership, soft-delete query/index implications, and optimistic-conflict handling; it does not apply to other stacks by default.
- R4. Persisted enums and exception handling have stable code and translation rules.
  Acceptance: Java ordinal persistence is prohibited; unknown/retired values and API codes are covered; validation, not-found, conflict, authorization, and infrastructure failures use the existing handler/envelope.
- R5. Ideate, brainstorm, PRD, design, backend, SQL, review, and LFG consume the same shared contract when durable data is in scope.
  Acceptance: each affected skill links to the canonical reference without duplicating stack-specific implementation policy.
- R6. Source, maintenance mirror, tests, metadata, and bilingual release notes stay synchronized.
  Acceptance: focused tests and distribution checks pass.

## Non-Functional Requirements

- NFR1. Guidance remains dependency-free, conservative, and subordinate to the target repository's conventions.
  Acceptance: no new ORM, base entity, runtime hook, generated DDL, or default key strategy is introduced.

## Scope Boundary

### In Scope

- Skill guidance, shared reference, design template, SQL/review checks, tests, version, release notes, and process evidence.

### Out Of Scope

- Target application migrations, a global base entity, dependencies, and `ae-reverse-engineering` changes.

## Validation Evidence

- Applicable: static inspection, focused Node tests, repository contracts, install smoke, release-note validation.
- Not applicable: application database, authenticated API, browser, and deployment proof.

## Perspective Collision

- Critic: universal entity templates create invalid ORM coupling and table semantics.
- Pragmatist: mutable MyBatis-Plus aggregates benefit from a shared standard.
- Systems: identifiers, constraints, API errors, and migration safety must agree across workflow stages.
- Decision: require the persistence decision while making each concrete field conditional.
- Thinking preservation zone: teams choose key format, audit actor type, retention, and database-specific indexes.

## Key Decisions

- D1. Put the canonical reference under `ae-backend`; other skills link to it.
- D2. Treat unconfirmed new-table primary-key choice as a clarification blocker.
- D3. Keep the supplied MyBatis-Plus pattern conditional on detected framework and table lifecycle.

## Dependencies And Assumptions

- Dependencies: existing mirror, release-note, install-smoke, and skill-document checks.
- Assumption: target repository conventions remain authoritative for each application.

## Open Questions

- None. R1 is intentionally asked per future table-creation request.

## Evidence Notes

- Existing migration/concurrency/error guidance: `plugins/ai-agent-engine-codex/skills/ae-backend/references/java-guidance.md`.
- Existing migration safety: `plugins/ai-agent-engine-codex/skills/ae-sql/references/sql-safety-checklist.md`.

## Consistency Check

- requirementsCount: 6
- nonFunctionalRequirementsCount: 1
- decisionsCount: 3
- openQuestionsCount: 0
