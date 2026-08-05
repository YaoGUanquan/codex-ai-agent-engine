---
type: prd
status: drafted
date: 2026-08-04
topic: authorized-reverse-engineering-skill
format: human-readable-requirements
sharded: false
---

# Authorized Reverse Engineering Skill

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The AE plugin has skills for debugging, review, security-aware SQL, external-skill audits, and experience capture, but no dedicated workflow for analyzing a user-owned or explicitly authorized binary, mobile package, malware sample, compatibility artifact, or local CTF sample. A generic debugger does not establish authorization, artifact provenance, analysis safety, or reverse-engineering evidence requirements.

The desired outcome is a Codex-native skill that guides only authorized, defensive reverse-engineering work. The workflow must provide useful, reproducible analysis structure without importing `reverse-skill`, installing tooling, registering MCP servers, modifying global configuration, or enabling offensive behavior.

## Requirements

**Scope And Authorization**

- R1. The skill must require an explicit authorization and target-context gate before non-local or dynamic analysis.
  Acceptance: The skill distinguishes user-owned artifacts, explicitly authorized assessments, local CTF/training samples, and defensive malware forensics; it instructs the agent to stop and request direction when authorization or permitted network scope is unclear.
- R2. The skill must be limited to defensive or compatibility-oriented reverse engineering.
  Acceptance: Its non-goals explicitly exclude license bypass, credential theft, persistence, detection evasion, active exploitation, target scanning, and work against unauthorized systems.

**Analysis And Evidence**

- R3. The workflow must establish a reproducible local-artifact baseline before drawing conclusions.
  Acceptance: It requires recording the artifact source, hash where practical, format, architecture, tool version or availability, and a static-first analysis path.
- R4. The workflow must separate observations, high-confidence inferences, and unverified hypotheses in its output.
  Acceptance: A completion report template requires evidence references such as command, file offset, function/symbol, or sanitized screenshot, plus confidence and remaining validation gaps.
- R5. Dynamic execution or traffic observation must stay inside the user's explicitly authorized isolation and network boundary.
  Acceptance: The workflow marks external connectivity, a new sandbox, credentials, target mutation, or replay as blocked until the user confirms the applicable boundary.

**Tooling And Distribution**

- R6. The skill must not automatically install a tool, download a sample, register an MCP server, or modify global Codex/client configuration.
  Acceptance: Missing tooling produces a bounded recommendation with a supply-chain and explicit-approval requirement, not an installation command executed by the skill.
- R7. The distributable change must preserve plugin source, project mirror, discovery metadata, help catalog, and release-version consistency.
  Acceptance: The implementation passes mirror, language metadata, skill contract, install smoke, release-note, package, and focused regression checks.

## Non-Functional Requirements

- NFR1. The skill must remain concise and use references only for a reusable case-report template and authorization/evidence checklist.
  Acceptance: The implementation adds no external dependency, runtime service, background process, tool bootstrapper, or specialist-skill catalog.
- NFR2. External source material must be treated only as provenance for rewritten workflow ideas.
  Acceptance: No upstream code, prompts, scripts, or templates are copied verbatim, and the external source/ref is cited as audit evidence.
- NFR3. Validation claims must be bounded to what local checks prove.
  Acceptance: Documentation and the review record distinguish static skill/distribution validation from real tool execution, authenticated target access, and analyst-quality acceptance.

## Must-Haves

- Requirement ID: R1
  Must-have completion condition: The skill cannot proceed from an unclear authorization statement to dynamic or remote target interaction.
- Requirement ID: R2
  Must-have completion condition: Prohibited offensive and credential/license-bypass activities are explicit rather than inferred from general project policy.
- Requirement ID: R7
  Must-have completion condition: Both distributable skill roots and their discovery/distribution metadata validate after implementation.

## Success Criteria

- A Codex user can invoke one clearly scoped skill for authorized reverse-engineering analysis rather than stretching `ae-debug` beyond its trigger.
- The skill produces a credible evidence boundary without claiming that a static inspection proves execution, network, or deployment behavior.
- A maintainer can ship the skill through the existing source/mirror and versioned plugin workflow without a new runtime dependency.

## Scope Boundary

### In Scope

- A new `ae-reverse-engineering` Codex skill, a small reference set, metadata, help-catalog entry, focused tests, and the required release documentation/version update.
- User-owned, explicitly authorized, local CTF/training, defensive malware-forensics, and compatibility-analysis workflow guidance.

### Out Of Scope

- Vendoring or installing `zhaoxuya520/reverse-skill` or any of its submodules, scripts, MCP servers, toolchain bootstrap manifests, field-journal automation, or global rules.
- Implementing a decompiler, debugger, sandbox, scanner, packet-replay system, MCP server, global configuration hook, or automatic skill/memory evolution.
- License bypass, cracking, credential extraction, persistence, evasion, active exploitation, remote scanning, or target mutation.

### Constraints

- `AGENTS.md`, the GPL-2.0-only distribution boundary, and the existing Codex-native runtime boundary remain authoritative.
- The external source is research provenance only: `https://github.com/zhaoxuya520/reverse-skill` at observed commit `79cdde737e0bf3ce7000eb3a084d47e124d70504`.
- A user-controlled artifact and explicit authorization are prerequisites for analysis beyond safe local metadata inspection.

## Validation Evidence

| Acceptance criterion | Applicable tier | Expected signal and bounded claim | Preconditions / owner | Status | Recovery or rollback signal |
| --- | --- | --- | --- | --- | --- |
| R1-R6, NFR1-NFR2 | Static inspection and focused automated test | Skill text, references, metadata, and focused assertions preserve authorization, safety, evidence, and no-auto-install boundaries. | Maintainer; local Node test runtime. | unverified | Remove the new skill and metadata; no artifact analysis state is owned by the plugin. |
| R7, NFR3 | Integration or build | Mirror, metadata, contract, install-smoke, package, and release checks pass. | Maintainer; repository dependencies. | unverified | Do not release or version-bump until every distribution check passes. |
| R3-R5 | Runtime health / authenticated service / browser acceptance | A separately authorized analyst exercises a named local artifact and confirms the report is useful. | User-owned sample, selected toolchain, authorized isolation. | unverified | Keep the feature documented as workflow guidance only; revise from real feedback through the candidate-evaluation gate. |

## Key Decisions

- D1. Create a dedicated skill instead of extending `ae-debug`.
  Reason: reverse engineering has a distinct trigger, authorization gate, evidence shape, and safety boundary that a generic failure-diagnosis workflow should not own.
- D2. Ship guidance and a report template before any helper script.
  Reason: tool ecosystems vary by platform and artifact type; a bootstrapper would add supply-chain, licensing, and external-state ownership without demonstrated reuse.
- D3. Retain `ae-save-experience` as the only route for durable lessons.
  Reason: journal, memory, or community contribution must remain explicit user-authorized actions rather than an automatic completion side effect.
- D4. Treat the external repository as a method reference, not a distribution dependency.
  Reason: its broad CTF/offensive catalog and GPLv3 subcomponent are outside this plugin's scope and license/runtime boundary.

## Dependencies And Assumptions

### Dependencies

- Existing source/mirror validators and installation smoke tests.
- `ae-skill-creator` candidate-evaluation guidance for the new entrypoint.
- Current repository version/release-note policy in `AGENTS.md`.

### Assumptions

- The user has authorized implementation of this bounded skill, but has not authorized any analysis of a real artifact or any tool installation.
- The first release needs no artifact-specific integration test because no reverse-engineering tool is bundled or invoked.

## Open Questions

### Deferred To Planning

- Q1. [Affects R4][technical] Whether the report template belongs in the skill reference directory only or also needs a `docs/ae` example fixture for focused validation.
- Q2. [Affects R6][technical] Which existing checks need direct test assertions beyond generic mirror, metadata, and installation validators.

## Evidence Notes

- External method provenance -> `https://github.com/zhaoxuya520/reverse-skill` at `79cdde737e0bf3ce7000eb3a084d47e124d70504`; inspected `README.md`, `RULES.md`, `skills/SKILL.md`, `skills/reverse-engineering/SKILL.md`, `skills/ops/scope-contract.md`, and `skills/ops/evidence-finding-path.md`.
- Existing owner boundaries -> `.agents/skills/ae-debug/SKILL.md`, `.agents/skills/ae-save-experience/SKILL.md`, `.agents/skills/ae-skill-audit/SKILL.md`, and `.agents/skills/ae-skill-creator/SKILL.md`.
- Distribution policy -> `AGENTS.md`, `scripts/check-skill-mirror.mjs`, `scripts/check-skill-language-metadata.mjs`, `scripts/check-skill-contract.mjs`, and `scripts/check-install-smoke.mjs`.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 3
- decisionsCount: 4
- openQuestionsCount: 2

## Self-Review

- Requirements describe the intended behavior and safety boundary without prescribing a decompiler, toolchain, or source implementation.
- Every requirement and non-functional requirement has a concrete acceptance signal.
- External-source claims are provenance-bound and do not imply its runtime behavior is available locally.
- No unresolved question changes the skill's safety posture, scope, or implementation ownership.
