---
type: prd
status: completed
date: 2026-07-15
topic: opencode-runtime-parity-without-office
format: human-readable-requirements
sharded: false
---

# OpenCode Runtime Parity Without Office Document Features

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

`codex/opencode-mode` currently exposes shared AE skills and a small static OpenCode command layer, but it does not provide the upstream OpenCode plugin runtime. Consequently, image, audio, video, persistent graph, dynamic MCP, model routing, session, native tool, rule, and command-registration behavior is absent.

The outcome is a project-local OpenCode plugin runtime on `codex/opencode-mode` that tracks upstream commit `a144f785579698190635305fe10784b7deca9e03`, while intentionally excluding PDF, DOCX, XLSX, PPTX, and OfficeCLI capabilities.

## Requirements

**R1. Ship the upstream OpenCode plugin lifecycle.**

Acceptance: a project installed from this branch has a generated `.opencode/plugins/ae-server.js` bridge that loads the built plugin and OpenCode receives its config, event, command, tool, and rule hooks.

**R2. Provide all selected upstream runtime assets.**

Acceptance: image, audio, video, graph build/query, API tester, browser DevTools MCP, dynamic MCP registration, model scenario routing, sessions, handoff, native agents, commands, rules, and supported tools are present and registered according to the upstream baseline.

**R3. Preserve project-level isolation.**

Acceptance: installation writes only inside the selected target project's `.opencode/ai-agent-engine`, `.opencode/plugins`, `.opencode/ae.jsonc`, and, when required for OpenCode discovery, its root `opencode.json`; it does not modify global OpenCode configuration or another Git branch.

**R4. Exclude document and Office features.**

Acceptance: no `ae-pdf`, `ae-docx`, `ae-xlsx`, `ae-pptx`, or `ae-officecli` skill, tool, service, test fixture, package dependency, or help/command registration is shipped by this branch.

**R5. Retain security and explicit-operation boundaries.**

Acceptance: upstream network, MCP, media, graph-write, database, and session behavior retains its upstream validation and confirmation boundaries; installation does not perform destructive `reset` or `clean` operations.

**R6. Make parity verifiable.**

Acceptance: TypeScript build, unit tests, typecheck, E2E plugin registration tests, local installer smoke tests, and the existing OpenCode integration check pass. Automated checks confirm excluded document/Office capabilities are absent.

**R7. Make the import set explicit.**

Acceptance: a committed parity manifest lists every retained upstream path, every excluded path family, and every plugin hook/tool registration expected at runtime; automated validation compares the installed source and registered plugin surface with that manifest.

## Non-Functional Requirements

**NFR1. Branch containment.**

Acceptance: all repository changes occur while `HEAD` is `codex/opencode-mode`; no checkout, merge, reset, or modification targets `main`, `codebuddy`, or another local branch.

**NFR2. Traceability.**

Acceptance: public documentation records the frozen upstream source commit, the intentional exclusions, and the project-install procedure.

## Scope Boundary

### In Scope

- Upstream runtime source, tests, build configuration, supported assets, and installer behavior from commit `a144f785579698190635305fe10784b7deca9e03`.
- Project-local distribution of a built OpenCode plugin.
- Reconciliation with existing branch checks and documentation.

### Out Of Scope

- PDF, DOCX, XLSX, PPTX, and OfficeCLI behavior, including their skills, tools, services, native runtime, dependencies, fixtures, and tests.
- Changes to `main`, `codebuddy`, global OpenCode configuration, or remote Git operations.
- A new capability beyond the selected upstream baseline.

## Key Decisions

### D1. Use upstream runtime source as the parity baseline

Reason: the selected functionality depends on OpenCode plugin hooks and cannot be faithfully reproduced by static Markdown skill files or the current Node helper script.

### D2. Package the runtime per project

Reason: project-local installation matches the branch purpose and prevents global configuration changes.

### D3. Remove document/Office capability end-to-end

Reason: leaving a skill or help entry without its runtime would advertise unusable behavior.

## Assumptions

- The user's "其余" instruction means all upstream capabilities other than the five explicitly excluded document/Office feature families.
- The target environment supplies Node.js and OpenCode `1.18.1`, matching the project-local `@opencode-ai/plugin` and `@opencode-ai/sdk` compatibility dependencies.
- The imported upstream `package-lock.json` is the reviewed dependency lock; project installation uses `npm ci` and does not activate a bridge until the locked dependency install and build pass.

## Open Questions

- None blocking implementation.

## Delivery Evidence

- Completed on `codex/opencode-mode` against upstream commit `a144f785579698190635305fe10784b7deca9e03`.
- `npm test`: 91 files and 1,103 tests passed.
- `npm run test:e2e`: 2 files and 8 tests passed against OpenCode `1.18.1`.
- `npm run test:slow`: 2 files and 23 tests passed.
- `npm run check`: passed, including the project-local install, staged plugin-load, rollback, uninstall, manifest-tool-surface, and Office/PDF exclusion checks.
- A fixed upstream-tree comparison found no remaining non-excluded capability gap after restoring configuration-file scan and review routing.
