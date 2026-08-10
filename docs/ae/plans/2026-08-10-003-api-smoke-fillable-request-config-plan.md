---
type: plan
status: completed
date: 2026-08-10
title: api-smoke-fillable-request-config
origin: docs/ae/prds/2026-08-10-api-smoke-fillable-request-config-prd.md
originFingerprint: 2026-08-10-api-smoke-fillable-request-config
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: API Smoke Fillable Request Config

## Source

- Requirements: `docs/ae/prds/2026-08-10-api-smoke-fillable-request-config-prd.md`.
- Prior contract: `docs/ae/prds/2026-07-24-002-local-runtime-smoke-secret-handoff-prd.md`.
- Prior plan: `docs/ae/plans/2026-07-24-002-local-runtime-smoke-secret-handoff-plan.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Harden the authenticated local-smoke handoff so agents create a non-empty UTF-8 fillable request-config template with `REPLACE_WITH_LOCAL_TOKEN`, and route `ae-test-api` to that shared shape without forking the smoke gate.

## Implementation Units

### U1 - Shared fillable template reference

- Files: `plugins/ai-agent-engine-codex/skills/ae-work/references/request-config-template.md`, `.agents/skills/ae-work/references/request-config-template.md`.
- Approach: define required properties, curl `-K` shape, UTF-8 without BOM write rule, and no-inspection handoff rules.

### U2 - Gate and ae-test-api routing

- Files: `local-runtime-smoke-gate.md`, `ae-test-api/SKILL.md`, `ae-test-api/references/api-verification-record.md` in source and mirror.
- Approach: require non-empty fillable templates, cite the shared reference, and forbid empty handoff files.

### U3 - Regression, release, memory, and declared graph

- Files: `tests/skill-scripts.test.mjs`, `package.json`, plugin manifest, README release notes, experience note, AI memory, and `docs/08-ai-memory/00-registry.json`.
- Approach: assert source/mirror wording, bump distributable version to `0.3.17`, and record durable decisions plus declared knowledge relations.

## Completion Record

- U1-U3 completed on 2026-08-10.
- Validation: `node --test --test-name-pattern "API bubble testing|local runtime smoke gate" tests/skill-scripts.test.mjs`, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-release-notes.mjs`.
- Residual risk: future agents must still choose an ignored or temporary path and a client that does not echo config contents; this repository check does not prove a target-project authenticated smoke.
