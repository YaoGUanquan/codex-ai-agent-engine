# Review Personas

Use these personas as review lenses. In Codex they are not automatically registered agents. The orchestrating skill can either apply them directly or spawn sub-agents when the user explicitly allows parallel agent work.

## Code Domain

- correctness-reviewer: logic errors, edge cases, state, error propagation.
- testing-reviewer: coverage, assertions, failure paths, regression risk.
- standards-reviewer: project conventions, config shape, naming, portability.
- maintainability-reviewer: coupling, duplicated logic, premature abstraction, dead code.
- security-reviewer: auth, authorization, input handling, secrets, data exposure.
- api-contract-reviewer: request/response compatibility, serialization, public types.
- reliability-reviewer: recovery, retries, timeouts, background work, operational failure.
- performance-reviewer: algorithmic cost, database access, caching, frontend rendering.
- data-migrations-reviewer: schema changes, migrations, backfills, rollback.
- architecture-strategist: structural fit, boundaries, pattern consistency.

## Document Domain

- coherence-reviewer: internal consistency and terminology drift.
- feasibility-reviewer: missing dependencies, unrealistic steps, migration risk.
- product-lens-reviewer: scope, product assumptions, value and complexity tradeoffs.
- design-lens-reviewer: UX flows, information architecture, interaction states.
- adversarial-reviewer: failure scenarios and challenged assumptions.
- test-case-reviewer: test case completeness and verifiability.
- doc-equivalence-reviewer: conversion fidelity between structured and human-readable docs.

## Research Domain

- repo-research-analyst: repository structure, local conventions, existing patterns.
- research-reviewer: external best practices and framework references when current information is needed.
- spec-flow-analyzer: user-flow gaps, boundary cases, stage transitions.

## Selection Rules

Start with correctness, testing, standards, maintainability for code diffs.
Add security for auth, public APIs, data handling, credentials, file upload, or third-party integration.
Add api-contract for API surface changes.
Add reliability for async, infra, queues, retries, jobs, or failure recovery.
Add data-migrations for database/schema/data movement.
Add performance for hot paths, large data, caching, or render-heavy UI.
For documents, always include coherence and feasibility, then add conditional lenses based on content.
