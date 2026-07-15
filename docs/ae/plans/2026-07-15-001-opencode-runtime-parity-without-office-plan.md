---
type: plan
status: completed
date: 2026-07-15
title: opencode-runtime-parity-without-office
origin: docs/ae/prds/2026-07-15-001-opencode-runtime-parity-without-office-prd.md
originFingerprint: 2026-07-15-opencode-runtime-parity-without-office
depth: deep
format: human-readable-plan
sharded: false
---

# OpenCode Runtime Parity Without Office Implementation Plan

**Goal:** Ship the selected upstream OpenCode runtime in the dedicated branch while omitting all PDF and Office document capabilities.

**Source baseline:** `https://gitee.com/jiangqiang1996/ai-agent-engine`, commit `a144f785579698190635305fe10784b7deca9e03`.

## Readiness

- Requirements: `docs/ae/prds/2026-07-15-001-opencode-runtime-parity-without-office-prd.md`
- Design: `docs/superpowers/specs/2026-07-15-opencode-runtime-parity-without-office-design.md`
- Branch: `codex/opencode-mode`
- Open decisions: none.
- Pre-import validation: `node scripts/check-opencode.mjs`, `npm test`, and `npm run check`.
- Post-import validation: `npm ci`, `npm run build`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `node scripts/check-opencode.mjs`, installer smoke test with failure injection, parity-manifest scan, exclusion scan, and `git diff --check`.

## Implementation Units

### U1 - Import the selected upstream runtime baseline

- Copy upstream TypeScript source, static assets, test configuration, and tests required for non-document capabilities.
- Preserve source provenance in documentation and keep the imported layout expected by the plugin manifest.
- Exclude PDF and Office source, skills, tests, fixtures, build assets, and package dependencies during import.
- Add a committed parity manifest containing retained roots, exclusion globs, plugin hooks, and tool names from the frozen baseline.
- Acceptance: TypeScript source includes plugin entrypoint, selected tools/services/hooks, and all required runtime assets; manifest validation passes and excluded paths do not exist.

### U2 - Reconcile package and build configuration

- Adopt the upstream TypeScript build/test toolchain and dependencies required by selected capabilities.
- Retain local OpenCode validation scripts where they remain applicable.
- Remove document/Office dependencies such as `@officecli/sdk`, PDF libraries, canvas solely used for PDF rendering, and their type declarations.
- Import the upstream `package-lock.json` after removing excluded packages with the package manager, then use `npm ci` for every installer and CI dependency install.
- Acceptance: build and typecheck resolve all selected imports without an excluded dependency; `npm ci` reproduces the selected dependency graph.

### U3 - Implement project-local runtime installation

- Update the installer to stage the runtime beneath `.opencode/ai-agent-engine`, run locked dependency installation and build, atomically activate it, and write `.opencode/plugins/ae-server.js` last.
- Merge target configuration without global writes or destructive Git commands.
- Acceptance: a temporary target project starts with a bridge that resolves to its own installed runtime; injected install/build/activation failures preserve the prior bridge and runtime.

### U4 - Reconcile OpenCode-facing assets

- Replace duplicate static command/agent registration with the runtime-owned source where necessary.
- Add all selected upstream commands, agents, skills, rules, and config assets.
- Remove document/Office help, commands, skill files, and references.
- Acceptance: plugin registration and asset health tests enumerate selected capabilities and reject exclusions.

### U5 - Verify and document

- Run selected upstream tests, local integration checks, installer smoke checks, and the exclusion scan.
- Update OpenCode installation and capability documentation to describe the runtime, source version, exclusions, and project-only behavior.
- Record review and final-gate evidence.

## Constraints

- Make edits only on `codex/opencode-mode`.
- Do not modify other branches, global OpenCode configuration, or remote state.
- Do not ship PDF, DOCX, XLSX, PPTX, or OfficeCLI assets in any form.
- Do not claim successful compatibility without a build and plugin-registration smoke test.

## Completion Evidence

- U1-U5 completed on `codex/opencode-mode`.
- The committed parity manifest is exercised by unit and installed-runtime smoke checks for retained roots, 8 hooks, 22 tools, and all excluded path fragments.
- Installer coverage includes foreign runtime and bridge refusal, staged entry import validation, activation rollback, uninstall rollback, and post-commit cleanup reporting.
- Final commands: `npm test`, `npm run test:e2e`, `npm run test:slow`, `npm run check`, `npm run opencode:upstream-check -- --source <upstream-checkout> --since a144f785579698190635305fe10784b7deca9e03`, and `git diff --check`.
