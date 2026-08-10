---
type: plan
status: completed
date: 2026-08-05
title: api-bubble-testing-skill
origin: docs/ae/prds/2026-08-05-001-api-bubble-testing-skill-prd.md
originFingerprint: 2026-08-05-api-bubble-testing
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: API Bubble Testing Skill

## Source

- Requirements: `docs/ae/prds/2026-08-05-001-api-bubble-testing-skill-prd.md` (R1-R11, NFR1-NFR5).
- Design: `docs/ae/designs/api-bubble-testing-skill-2026-08-05/design.md`.
- Provenance: `docs/ae/solutions/2026-08-05-api-bubble-testing-skill-audit.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Create a Codex-native `ae-test-api` skill for post-backend API verification. It selects endpoint-scoped evidence, reuses the existing local-runtime smoke gate for live calls, writes one sanitized API Verification Record per completed verification, and keeps long-term graph curation explicit. Integrate the skill into both distribution roots, metadata, help/catalog, installer smoke, focused tests, release notes, and synchronized version metadata.

## Readiness

- Goal: make API/interface/bubble testing independently discoverable after backend work without creating a runtime test framework.
- Acceptance criteria: R1-R11 and NFR1-NFR5.
- Non-goals: no default HTTP client, script generation, service lifecycle manager, secret manager, test-data reset engine, external API call, target-project modification, automatic graph write, or external runtime.
- Affected areas: paired skill folders, static language metadata, help catalog, install smoke, semantic tests, release documentation, plugin manifests.
- Validation surface: source/mirror, metadata, skill contract, help output, installation/language switching, artifact/design contracts, release-note/version consistency, full test and static-check suites.
- Open questions: Q1-Q3 are resolved in this plan through a compact Markdown reference, existing metadata/catalog files, and existing installer coverage.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1-R7, R11, NFR1-NFR4 | Static inspection and focused automated test | Source/mirror skill text, metadata, help catalog, and focused tests prove the local workflow contract and no external runtime assumption. | Maintainer; Node test runtime. | planned | Remove the new skill and integration entries; existing owners remain unchanged. |
| R8-R10, NFR3, NFR5 | Static inspection and focused automated test | Record template and semantic tests prove source precedence, field retention exclusions, evidence tiers, and opt-in graph curation wording. | Maintainer; Node test runtime. | planned | Remove the template and record guidance; no automatic durable graph state exists. |
| R11 | Integration or build | Mirror, language, skill-contract, install-smoke, release-note, package, and full suite checks pass. | Maintainer; repository dependencies. | planned | Do not claim release or retain version bump if distribution checks fail. |
| R2-R6 | Local runtime and authenticated service smoke | A future authorized target project demonstrates endpoint selection and safe record output. | Target-project owner; shared-gate prerequisites. | unverified | Keep the skill's runtime claim bounded and revise from controlled feedback. |
| R1, R7 | Browser acceptance and deployment | Not applicable to this API-only skill unless a consuming target has a separate UI or release objective. | Target-project owner. | not-applicable | Route such work to `ae-test-browser` or the target deployment workflow. |

## Contract Value Classification

- Canonical persisted value: the Markdown API Verification Record under `docs/ae/evidence/api/` for one completed verification.
- Derived or ephemeral representation: terminal output, target test logs, HTTP responses, test fixtures, and source graph edges.
- Caller-controlled input: the requested endpoint scope, test fixture choice, and any user-controlled secret reference.
- Source precedence: authoritative OpenAPI/Swagger, then controller/DTO/handler contract; fixtures and observed responses support but cannot redefine the contract.
- Trust boundary: the shared local-runtime smoke gate owns live-call authorization, secret-reference handling, and state-changing classification.

## Alternatives Considered

- Recommended: one small `ae-test-api` entrypoint with a reference contract and existing safety/distribution owners.
- Alternative: extend `ae-backend` or `ae-test-browser`.
- Rejected because: neither provides independent post-change API verification without conflating implementation or browser acceptance responsibilities.

## Decision Drivers

- Driver 1: preserve clear ownership between implementation, live safety, browser acceptance, and API evidence.
- Driver 2: retain traceable contract evidence without secrets, payloads, or automatic long-term graph writes.
- Driver 3: preserve Codex-native, stack-neutral distribution with no external runtime or dependency.

## Decisions

### ADR-1 - Compact Skill And Reference Contract

- Decision: add concise workflow guidance in `SKILL.md` and one detailed `references/api-verification-record.md` contract.
- Drivers: R1-R10, NFR1-NFR5.
- Alternatives: generated test scripts, Postman collections, or a global API test runner.
- Why chosen: the reference supplies reusable decisions while each target keeps its own test harness and client.
- Consequences: target runtime proof stays opt-in and cannot be simulated by the skill package.
- Follow-ups: validate against a separately authorized target project after release.

### ADR-2 - Existing Distribution Owners

- Decision: update the existing metadata, catalog, installation smoke, semantic test, README, and version mechanisms rather than adding registries or generators.
- Drivers: R11, NFR3.
- Alternatives: dynamic discovery or a separate installer pathway.
- Why chosen: the existing source/mirror distribution already validates core entrypoints and language modes.
- Consequences: changes are serial because these shared files must remain synchronized.
- Follow-ups: none.

## Risks

- A broad trigger could hijack implementation or browser requests.
- A record template could accidentally normalize sensitive command or payload retention.
- Metadata/catalog/installer drift could make the skill discoverable in one mode but unavailable after installation.

## Pre-Mortem

- Failure scenario 1: a future skill starts services or sends writes by default. Mitigation: link to the shared gate as sole live-call owner and assert this wording in tests.
- Failure scenario 2: an API record contains secrets or concrete identifiers. Mitigation: template has explicit prohibited categories and focused assertions cover them.
- Failure scenario 3: install or language switching omits the skill. Mitigation: include it in source metadata and all install-smoke language expectations.

## Global Constraints

- Do not copy GPL-3.0 source text, OpenCode prompts, scripts, runtime assumptions, or output roots.
- Do not add a dependency, service, global configuration, network call, target-project code change, or automatic graph mutation.
- Keep source and mirror byte-equivalent after line-ending normalization and synchronize the two SemVer manifests.

## Implementation Units

### U1 - Create API Verification Skill And Record Contract

- Goal: add the API verification entrypoint and its compact, sanitized record reference in both skill roots.
- Requirements covered: R1-R10, NFR1-NFR5.
- Acceptance criteria covered: endpoint selection, evidence tiers, routing, shared live-call safety, source precedence, record schema, retention exclusions, and opt-in graph relations are explicit.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-test-api/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-test-api/agents/openai.yaml`, `plugins/ai-agent-engine-codex/skills/ae-test-api/references/api-verification-record.md`, `.agents/skills/ae-test-api/SKILL.md`, `.agents/skills/ae-test-api/agents/openai.yaml`, `.agents/skills/ae-test-api/references/api-verification-record.md`.
- Forbidden files: `docs/08-ai-memory/00-registry.json`, target-project files, external runtime configuration.
- Approach: independently author stack-neutral workflow and reference content; the skill reads the shared smoke gate for live requests instead of restating its safety protocol.
- Tests: focused semantic assertions added in U3.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`.
- Rollback signals: deleting only the paired new directories restores the previous catalog behavior.
- Deferred to implementation: no runtime API call is made.

### U2 - Wire Discovery, Language, And Installation

- Goal: make the skill available in all current discovery and language-switch paths.
- Requirements covered: R1, R7, R11, NFR3.
- Acceptance criteria covered: skill metadata, help catalog, installed copy, and bilingual/English/Chinese metadata are present.
- Depends on: U1.
- Files: `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`, `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json`, `.agents/skills/ae-help/references/capability-catalog.json`, `scripts/check-install-smoke.mjs`.
- Forbidden files: installer implementation, global Codex configuration, external tool configuration.
- Approach: add the entry to existing static maps and test every already-supported language/install mode.
- Tests: extend the existing install-smoke assertions rather than add a second installer test harness.
- Validation: `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-install-smoke.mjs`, `node scripts/ae-tools.mjs help`.
- Rollback signals: remove only the new static entries and paired skill directories.
- Deferred to implementation: no dynamic command registration is claimed.

### U3 - Add Regression Coverage And User-Facing Release Integration

- Goal: prevent contract drift and declare the distributable versioned change.
- Requirements covered: R1-R11, NFR1-NFR5.
- Acceptance criteria covered: source/mirror semantics, metadata/catalog visibility, installation, release metadata, and documentation claims have executable coverage.
- Depends on: U1, U2.
- Files: `tests/skill-scripts.test.mjs`, `README.md`, `README.en.md`, `package.json`, `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`.
- Forbidden files: `README.zh-CN.md`, package lockfiles, external dependencies, release archives.
- Approach: add a narrow skill contract test, update the capability lists and release notes, and increment the existing `0.3.9` manifests to `0.3.10` together.
- Tests: `npm.cmd test`, focused `node --test tests/skill-scripts.test.mjs`, `node scripts/check-release-notes.mjs`.
- Validation: full repository check and final review gate.
- Rollback signals: restore one coherent release version and remove only the new skill integration entries.
- Deferred to implementation: target-project authenticated/runtime proof remains unverified.

## Consistency Check

- implementationUnitCount: 3
- sourceRequirementsCovered: R1-R11, NFR1-NFR5
- sourceRequirementsDeferred: none; target-project runtime proof is an explicit verification gap, not a deferred requirement.
- openQuestionsCount: 0

## Validation Plan

- Unit: source/mirror, metadata, skill-contract, help catalog, and focused semantic tests.
- Integration: install smoke, language switch, package/static checks, and release-note checker.
- User flow: local `ae-tools help` output shows the API verification entrypoint.
- Data / operations: no API, graph, deployment, or persistent test-data operation runs in this repository.
- Observability: API record contract retains only sanitized tiers, sources, and assertions.

## Rollback / Recovery

If any distribution check fails, do not release. Remove the new paired skill directories and all matching metadata/catalog/test/README entries, then synchronize both manifests with the retained release notes. No external state exists to clean up.

## Plan Self-Review

- Placeholder scan: passed; all units have named files and checks.
- Consistency check: R1-R11 and NFR1-NFR5 map to U1-U3.
- Scope check: no target-project runtime, dependency, external service, or graph implementation is included.
- Acceptance coverage: the record, safety, routing, distribution, and evidence boundaries each have a unit and validation signal.
- Validation gaps: target-project local/authenticated runtime evidence remains explicit and unverified.
- Alternatives and ADR check: retained a small static skill/reference design over runtime/tooling expansion.
- High-risk pre-mortem check: live-call, retention, and distribution drift scenarios have concrete mitigations.

## Handoff

Execute U1-U3 serially on the confirmed `main` worktree. Run a final `ae-review domain:code mode:report-only` after validations; do not commit or push unless later explicitly requested.

## Follow-up (2026-08-10)

- Authenticated smoke handoff usability was hardened in `docs/ae/plans/2026-08-10-003-api-smoke-fillable-request-config-plan.md`.
- `ae-test-api` now requires the shared fillable request-config template instead of an empty credential file.
- Distributable version for that follow-up: `0.3.17`.
