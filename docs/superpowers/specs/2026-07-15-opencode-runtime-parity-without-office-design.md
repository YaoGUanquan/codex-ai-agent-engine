---
type: design
status: validated
date: 2026-07-15
title: opencode-runtime-parity-without-office
origin: docs/ae/prds/2026-07-15-001-opencode-runtime-parity-without-office-prd.md
originFingerprint: 2026-07-15-opencode-runtime-parity-without-office
---

# OpenCode Runtime Parity Design

## Overview

The dedicated OpenCode branch becomes a project-local plugin distribution. It carries upstream runtime TypeScript source and assets, compiles them to `dist/`, and installs the compiled runtime and bridge into a target project's `.opencode` directory.

## Architecture

```text
target project
  .opencode/plugins/ae-server.js
    -> .opencode/ai-agent-engine/dist/src/index.js
      -> OpenCode plugin lifecycle hooks
      -> selected tools, commands, agents, skills, rules, and config
```

The source baseline is upstream commit `a144f785579698190635305fe10784b7deca9e03`. Existing static branch files remain only where they are compatible with the native runtime; runtime-owned registrations are sourced from the imported plugin assets.

## Capability Mapping

| Capability | Delivery mechanism |
| --- | --- |
| Image, audio, video | Native OpenCode tools plus media services and fallback hooks |
| Full graph | Native graph tools, storage, freshness, query, preview assets, and parsers |
| Commands and agents | Runtime config registration from source assets |
| Dynamic MCP and model routing | Plugin config lifecycle and model capability services |
| Browser and sessions | Native client-backed tools and event dispatch |
| API testing and SQL | Upstream skills and selected tool/runtime contracts |
| PDF/Office/document editing | Removed before build and omitted from all distribution manifests |

## Data And Side Effects

- Project graph state and tool outputs follow upstream storage rules under the target project.
- Dynamic MCP and model calls retain upstream input validation and OpenCode client boundaries.
- The installer writes only target-local `.opencode/**` paths and, when required by OpenCode discovery, root `opencode.json`. It must never use `git reset --hard` or `git clean`.

## Installation Transaction

1. Copy the runtime into a target-local staging directory under `.opencode/ai-agent-engine/.staging-<nonce>`.
2. Run `npm ci --ignore-scripts`, then the explicitly approved build lifecycle inside staging.
3. Run a plugin-load validation against staging.
4. Mark the staged runtime as installer-owned, rename the current owned runtime to a rollback directory, rename staging into the active runtime path, then write the bridge last.
5. On any failure before bridge activation, delete staging and retain the prior runtime and bridge. On activation failure, restore the prior runtime and bridge contents. Uninstall verifies both ownership marker and bridge content, moves runtime aside before removing the bridge, and reports deferred cleanup rather than restoring a partially deleted runtime.

The imported `package-lock.json` pins the dependency closure. Installation uses `npm ci --ignore-scripts`, reports the target-local runtime and bridge paths, and refuses foreign runtime or bridge ownership.

## Compatibility

- The branch targets OpenCode only. It does not promise Codex runtime compatibility.
- Package versions are locked by `package-lock.json`; `@opencode-ai/plugin` and `@opencode-ai/sdk` are updated to `1.18.1` for the installed OpenCode runtime. OpenCode `1.18.1` is verified by the plugin-registration E2E test; any broader compatibility claim requires a separate matrix.
- Existing target `opencode.json` must be merged rather than overwritten.

## Test Design

- Import upstream unit and E2E tests except document/Office/PDF suites.
- Add exclusion tests for assets, source imports, package dependencies, and help registration.
- Add parity-manifest tests for retained paths, excluded paths, expected plugin hooks, and selected tool registry names.
- Keep local `check-opencode`, installer smoke, and upstream comparison checks.
- Verify a temporary target project receives a bridge pointing only to a target-local runtime, including failure injection before activation.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Upstream source assumes its original repository layout | Preserve required asset layout in the runtime package and adapt only distribution paths. |
| A deleted Office/PDF module leaves imports or catalog entries | Compile, typecheck, asset-health test, and add explicit exclusion checks. |
| Installing runtime dependencies is slow or platform-specific | Keep dependency install explicit in the project installer and report failures without partial bridge activation. |
| Static branch integration conflicts with runtime registration | Runtime source owns native OpenCode registration; remove duplicate wrapper registrations. |
| A target project contains a foreign runtime or bridge | Require an ownership marker and exact managed bridge content before replacement or deletion. |
| Staged bundle imports but later activation fails | Validate its default plugin export before activation and restore the prior runtime and bridge on activation failure. |

## Delivery Evidence

- Completed on 2026-07-15 with `npm test` (91 files, 1,103 tests), `npm run test:e2e` (8 tests), `npm run test:slow` (23 tests), and `npm run check`.
- The fixed upstream source tree at `a144f785579698190635305fe10784b7deca9e03` was compared with the local runtime; remaining differences are the approved PDF/Office exclusions and project-local distribution adaptations.
