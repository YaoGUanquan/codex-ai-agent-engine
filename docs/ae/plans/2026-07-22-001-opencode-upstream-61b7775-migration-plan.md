---
type: plan
status: drafted
date: 2026-07-22
title: opencode-upstream-61b7775-migration
depth: deep
format: human-readable-plan
sharded: false
---

# Plan: OpenCode Upstream 61b7775 Migration

## Source

- User-confirmed outcome: update `codex/opencode-mode` to upstream `61b777542fb00d2e082af126d17b070318281933`, including SDK v2, the Playwright browser runtime, and OCR/review refactoring.
- Upstream: `https://gitee.com/jiangqiang1996/ai-agent-engine`, range `a144f785579698190635305fe10784b7deca9e03..61b777542fb00d2e082af126d17b070318281933`.
- Existing non-negotiable boundary: PDF, DOCX, XLSX, PPTX, and OfficeCLI remain absent from source, assets, tests, packages, help, and installed distribution.
- Previous baseline evidence: `docs/ae/parity/opencode-upstream-a144f785-manifest.json` and `docs/ae/prds/2026-07-15-001-opencode-runtime-parity-without-office-prd.md`.

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

### Goal

Produce a project-local OpenCode runtime that adopts the selected upstream behavior at `61b7775` while preserving the branch's no-document/no-Office distribution contract and transactional installer guarantees.

### Acceptance Criteria

- AC1: The runtime uses the OpenCode SDK v2 client model and is verified against OpenCode `1.18.4` through plugin-registration E2E tests.
- AC2: Browser automation is provided through upstream Playwright CLI assets and tools; legacy Chrome DevTools MCP runtime assets and registrations are removed without unsupported browser-availability claims.
- AC3: Upstream OCR is registered in the default runtime and executes only through an explicit OCR tool or command invocation; its review/specialist routing changes are present only after their tool, package, prompt, schema, and test boundaries are consistent.
- AC4: Selected independent upstream correctness and security fixes are ported: FilePart dedupe normalization, directory media handling, graph resolver null safety, graph symlink safety, and review-proof validation fixes.
- AC5: The project remains free of all excluded document/Office capability paths, imports, package dependencies, registrations, tests, and installer-distributed files.
- AC6: The project-local installer continues staged installation, plugin-load validation, rollback, and foreign-runtime/bridge refusal under the upgraded dependency graph.
- AC7: The parity manifest, public documentation, license/third-party notices, and source baseline accurately describe the shipped runtime and have command evidence.

### Non-Goals

- Do not update `main`, `codebuddy`, global OpenCode configuration, or remote Git state.
- Do not restore PDF, document conversion, OfficeCLI, or document editing features merely because upstream retains them.
- Do not copy upstream files that have no matching non-document runtime boundary in this branch.
- Do not perform a blind merge, `git reset`, `git clean`, or automated overwrite of local branch adaptations.

### Affected Areas

- Distribution: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.test.json`, `scripts/postbuild.mjs`, `scripts/install-project.mjs`, `scripts/ensure-playwright*.mjs`.
- Runtime: `src/index.ts`, `src/schemas/ae-asset-schema.ts`, `src/services/**`, `src/tools/**`, `src/hooks/**`.
- Assets: `src/assets/agents/**`, `src/assets/commands/**`, `src/assets/skills/**`, `src/assets/rules/**`.
- Guardrails and evidence: `docs/ae/parity/**`, `tests/**`, `scripts/check-opencode*.mjs`, `README.opencode.md`, `docs/builtin-config.md`.

### Validation Surface

- Static: `git diff --check`, TypeScript typecheck, excluded-path/dependency scans, manifest inspection.
- Unit: focused Vitest suites for changed services, tools, schemas, assets, and installer behavior.
- Integration: runtime tool registry, asset catalog, review proof, and project installer smoke tests.
- User flow: temporary target project installation plus OpenCode plugin registration and browser/OCR availability contracts.
- Operations: staged installation failure injection, cleanup reporting, package lock reproducibility, no global config write.

### Open Questions

- OQ1 (blocking): The upstream range changes its license to GPL-3.0-or-later while this branch declares GPL-2.0-only. A copyright owner or legal reviewer must approve the target license and required attribution/notices before upstream code is copied.
- OQ2 (blocking): Upstream's Playwright CLI bootstrap may install or invoke a global CLI. The maintainer must explicitly accept that machine-level executable side effect, or approve a project-local replacement with equivalent browser behavior. No implementation starts on the browser migration without this choice.

## Assumptions

- The target branch remains `codex/opencode-mode` for all implementation work.
- The target OpenCode runtime supports plugin and SDK version `1.18.4`; compatibility outside that version is not claimed.
- User intent includes the upstream browser, OCR, and review changes, but does not override the PDF/Office exclusion boundary.
- Existing local installer atomicity and ownership protections remain required even if upstream installer code differs.

## Alternatives Considered

1. **Recommended: staged selective rebase to the upstream head.** Import upstream changes by capability boundary, update parity data at each boundary, and retain local exclusions and installer protections. It is more work than a merge but creates an auditable no-Office runtime and isolates failures.
2. **Directly merge or replace the branch from upstream.** This has the lowest apparent effort but imports excluded document code, breaks the current manifest and installer adaptations, and bypasses the GPL decision. Rejected.
3. **Only cherry-pick the five independent bug fixes.** This is low risk but fails the stated requirement for SDK v2, browser, and OCR parity. Rejected as the final outcome; retained as U6 within the staged migration.

## Decision Drivers

- Preserve the branch's end-to-end exclusion and project-local installation contract.
- Upgrade the SDK and tool boundary as one tested compatibility surface rather than mixing old client types with new tool implementations.
- Make license and machine-level installation side effects explicit before copying source or activating new behavior.

## Decisions

### ADR-1 - Treat the upstream head as a source range, not a merge target

- Decision: Port reviewed upstream changes into the current branch in dependency order and record `61b7775` as the new parity baseline only after all selected behavior passes validation.
- Drivers: local distribution adaptations, excluded capability families, and no shared Git ancestry guarantee.
- Alternatives: direct merge; patch only individual fixes.
- Why chosen: it preserves the current branch's explicit runtime boundary while satisfying the requested functional parity.
- Consequences: every copied runtime change needs a corresponding manifest, test, and exclusion review; implementation is serial around shared registry and package files.
- Follow-ups: run `node scripts/check-opencode-upstream.mjs --source <upstream-checkout> --since a144f785...` again at final review and archive its classification output as evidence.

### ADR-2 - Gate the migration on license and Playwright side-effect decisions

- Decision: U1 must obtain and record decisions for OQ1 and OQ2 before source import begins.
- Drivers: GPL-2.0-only/GPL-3.0 compatibility and global executable installation are legal/operational boundaries, not refactor details.
- Alternatives: silently retain GPL-2.0-only; silently accept global install; replace the CLI without validating feature parity.
- Why chosen: either alternative can invalidate redistribution rights or violate project-local expectations.
- Consequences: U2 through U8 are blocked until these decisions are accepted in the execution record.
- Follow-ups: update `LICENSE`, `NOTICE.md`, and third-party notices only according to the approved legal decision.

### ADR-3 - Maintain a single no-Office parity manifest

- Decision: Replace the old frozen manifest with a new manifest that lists selected `61b7775` hooks, tools, retained roots, and exclusions; test it against source and installed runtime.
- Drivers: the SDK v2, browser, OCR, and review refactors alter registry and asset surfaces.
- Alternatives: leave the old manifest and relax its assertions; remove manifest validation.
- Why chosen: weakening the contract would allow excluded paths and unregistered assets to drift unnoticed.
- Consequences: all registry changes remain serial with manifest/test updates.
- Follow-ups: document the source commit and intentional exclusions in the OpenCode guide.

### ADR-4 - Register OCR by default and require explicit execution

- Decision: Mirror upstream by registering `ae-ocr` in the installed runtime; OCR runs only when a user or workflow explicitly invokes its tool or command.
- Drivers: the user requested upstream OCR parity, while automatic binary execution or background scanning would add an unrequested operational side effect.
- Alternatives: omit OCR from default distribution; start OCR automatically during installation or review.
- Why chosen: default registration delivers the selected capability and preserves the existing explicit-operation boundary.
- Consequences: manifest, help/catalog, asset, tool, and E2E tests must contain `ae-ocr`; installer and postbuild must not invoke OCR.
- Follow-ups: U4 validates explicit invocation and U7 verifies that no installer-distributed hook executes OCR automatically.

## Risks

- SDK v2 response and client method shape changes can compile only after broad service/tool updates, while runtime paths still fail under an actual OpenCode server.
- The upstream browser migration replaces dynamic Chrome DevTools MCP registration with Playwright CLI behavior; copying only assets or only tools leaves unusable commands.
- OCR's package and binary behavior may be platform-specific and conflicts with `npm ci --ignore-scripts` during staged installation.
- Upstream review architecture deletes domain dispatch files that current asset catalogs and tests reference.
- Upstream continues to contain document services, so a broad source copy can reintroduce forbidden imports or dependencies.

## Pre-Mortem

- Failure scenario: SDK v2 compiles but authenticated OpenCode requests fail because the derived client omits or incorrectly formats server credentials. Mitigation: E2E both unauthenticated and password-configured fixture paths before manifest baseline changes.
- Failure scenario: postbuild or installer attempts a global Playwright installation and leaves a partially activated target runtime. Mitigation: test installer failure injection before and after bootstrap, verify bridge/runtime rollback, and stop on OQ2 rejection.
- Failure scenario: OCR/review refactor leaves stale schema constants, prompt references, or expected-tool assertions. Mitigation: change registry, schema, assets, and their tests in one serial unit and compare catalog output with the new manifest.
- Continue-stop signals: any excluded fragment or excluded dependency appears; E2E plugin registration fails at `1.18.4`; a foreign bridge/runtime is modified; a license decision remains unrecorded.

## Global Constraints

- Work only while `HEAD` is `codex/opencode-mode`; do not modify any other branch or remote.
- Preserve project-local `.opencode/**` installation and never write OpenCode global configuration.
- Preserve the full PDF/Office exclusion list from the existing parity manifest, expanding it for any newly discovered transitive document asset.
- Keep `package-lock.json`, registry/schema files, the parity manifest, and generated distribution path lists serially owned.
- Do not claim browser, OCR, hook, MCP, or automatic registration behavior without a passing local runtime check.

## Implementation Units

### U1 - Record migration decisions and freeze the import boundary

- Goal: Establish an approved legal/operational baseline and an exact upstream checkout before code changes.
- Requirements covered: AC5, AC7.
- Acceptance criteria covered: OQ1 and OQ2 have written decisions; source SHA, exclusion families, target OpenCode version, and branch are recorded in a new execution ledger.
- Depends on: none.
- Five-layer ownership: Memory, Guardrail, Distribution.
- Files: `docs/00-process/active/opencode-upstream-61b7775-migration/progress.md`, `docs/00-process/active/opencode-upstream-61b7775-migration/ledger.jsonl`, `docs/ae/parity/opencode-upstream-a144f785-manifest.json`.
- Forbidden files: `package.json`, `package-lock.json`, `src/**`, `tests/**`, `LICENSE`.
- Approach: verify clean worktree and branch; clone or refresh upstream outside the repository; capture the `a144f785..61b7775` diff; enumerate every direct and transitive Office/PDF path and dependency to omit. Mark the old manifest as superseded only when the replacement manifest is ready in U7.
- Tests: none; this is a decision and evidence gate.
- Validation: `git status --short`; `git branch --show-current`; `git -C <upstream-checkout> rev-parse HEAD`; `node scripts/check-opencode-upstream.mjs --source <upstream-checkout> --since a144f785579698190635305fe10784b7deca9e03`.
- Rollback signals: missing OQ1/OQ2 decision, upstream SHA mismatch, dirty unrelated worktree, or any proposed copy set containing excluded files stops the migration before code modification.
- Deferred to implementation: legal conclusion and approved Playwright installation policy must be supplied by the maintainer, not inferred.

### U2 - Upgrade dependency, compiler, and SDK v2 client boundary

- Goal: Move the runtime to upstream-compatible OpenCode `1.18.4` and SDK v2 without changing document exclusions.
- Requirements covered: AC1, AC5, AC6.
- Acceptance criteria covered: `src/index.ts` creates the SDK v2 client from OpenCode server URL/directory and authorized requests work; all client consumers typecheck; lockfile is reproducible.
- Depends on: U1.
- Five-layer ownership: Guardrail, Distribution.
- Files: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.test.json`, `src/index.ts`, `src/services/client-holder.ts`, every compiler-identified non-document `src/services/**`, `src/tools/**`, `src/hooks/**` SDK v1 consumer, `tests/index.test.ts`, `tests/e2e/lib/e2e-fixture.ts`, `tests/e2e/plugin-registration.test.ts`.
- Forbidden files: `LICENSE`, `THIRD-PARTY-NOTICES`, `src/assets/**`, all document/Office source paths.
- Approach: import only the upstream SDK-v2 changes needed by retained code; pin the approved versions rather than range-copying package metadata; use `npm install --package-lock-only` only after the selected dependency list is approved; migrate compiler failures at their actual call sites. Add fixture coverage for `OPENCODE_SERVER_PASSWORD` and default username handling before relying on the new client.
- Tests: client holder/service tests, index/plugin tests, E2E plugin registration updated to `1.18.4`.
- Validation: `npm ci`; `npm run typecheck`; `npm test -- --run tests/index.test.ts tests/services`; `npm run test:e2e`.
- Rollback signals: SDK types require document dependencies, authenticated fixture requests fail, or a lockfile install requires an unapproved Node/toolchain version. Revert this unit as one commit before altering registry assets.
- Deferred to implementation: exact client call-site edits are determined by TypeScript diagnostics, not bulk text replacement.

### U3 - Replace the browser runtime with Playwright CLI

- Goal: Adopt upstream browser capability while removing legacy Chrome DevTools MCP registration and ensuring installation behavior matches the approved OQ2 policy.
- Requirements covered: AC2, AC5, AC6, AC7.
- Acceptance criteria covered: legacy browser tool/service/assets are absent; Playwright assets and commands resolve through the runtime catalog; no browser-availability claim is emitted without an explicit CLI/runtime result.
- Depends on: U1, U2.
- Five-layer ownership: Knowledge, Guardrail, Distribution.
- Files: `package.json`, `package-lock.json`, `scripts/ensure-playwright-lib.mjs`, `scripts/ensure-playwright.mjs`, `scripts/postbuild.mjs`, `scripts/install-project.mjs`, `src/schemas/ae-asset-schema.ts`, `src/tools/index.ts`, `src/services/browser-detect.ts` (delete), `src/services/browser-environment-gate.ts` (delete), `src/tools/ae-chrome-devtools-mcp.tool.ts` (delete), `src/assets/skills/ae-chrome-devtools/**` (delete), `src/assets/skills/ae-playwright/**` (add), `src/assets/agents/workflow/browser-inspector.md` (delete), `src/assets/agents/workflow/e2e-tester.md` (add), `tests/tools/ae-chrome-devtools-mcp.tool.test.ts` (delete), `tests/assets/asset-health.test.ts`, `tests/assets/prompt-invariants.test.ts`, `tests/e2e/plugin-registration.test.ts`, `scripts/check-install-smoke.mjs`.
- Forbidden files: `src/services/pdf-*.ts`, `src/tools/ae-pdf.tool.ts`, document/Office skills, `LICENSE`.
- Approach: port upstream Playwright bootstrap and skill assets only after adapting installer staging so the approved CLI policy is observable and failures occur before bridge activation. Remove the old browser gate/detector/tool assets only after all schema/catalog references point to the new browser boundary. Preserve the project-local installation transaction; global executable installation must not write OpenCode global configuration.
- Tests: upstream-equivalent Playwright asset tests; installer tests for bootstrap failure; catalog tests asserting legacy Chrome DevTools identifiers are absent and approved new identifiers are present.
- Validation: `npm run build`; focused `vitest run tests/assets/asset-health.test.ts tests/assets/prompt-invariants.test.ts tests/e2e/plugin-registration.test.ts`; `node scripts/check-install-smoke.mjs`; a temporary target project browser command dry run using the approved CLI policy.
- Rollback signals: postbuild performs a global install despite OQ2 rejection, installer activation occurs before bootstrap failure, legacy identifiers remain in catalogs, or target runtime cannot resolve the browser command. Restore U3 before continuing.
- Deferred to implementation: do not provision browsers or invoke external browser downloads unless explicitly approved at execution time.

### U4 - Import OCR and replace review/specialist routing coherently

- Goal: Add upstream OCR capability and its review architecture without stale domain-dispatch references or unsupported automatic-agent claims.
- Requirements covered: AC3, AC5, AC7.
- Acceptance criteria covered: OCR is registered with its service/tool/skill and tests; new review scope analysis, specialist selection, and aggregation are internally consistent; obsolete domain-dispatch and Chrome tool registrations are gone.
- Depends on: U2, U3.
- Five-layer ownership: Knowledge, Guardrail, Delegation.
- Files: `package.json`, `package-lock.json`, `src/schemas/ae-asset-schema.ts`, `src/services/ocr-service.ts` (add), `src/services/review-catalog.ts`, `src/services/review-selector.ts`, `src/services/command-template-service.ts` (add), `src/services/specialist-prompt-templates.ts` (add), `src/services/domain-catalog-service.ts`, `src/services/domain-dispatch-service.ts`, `src/tools/ae-ocr.tool.ts` (add), `src/tools/ae-review-scope-analyze.tool.ts` (add), `src/tools/ae-work-specialist-select.tool.ts` (add), `src/tools/ae-specialist-aggregate.tool.ts` (rename from `src/tools/ae-domain-dispatch-aggregate.tool.ts`), `src/tools/ae-domain-dispatch-prepare.tool.ts` (delete), `src/tools/index.ts`, `src/assets/agents/domains/**` (delete), `src/assets/agents/reviewers/**` (add), `src/assets/agents/developers/**` (add), `src/assets/agents/workflow/**`, `src/assets/skills/ae-ocr/**` (add), `src/assets/skills/ae-review/**`, `src/assets/commands/ae-e2e-tester.md` (add), `src/assets/commands/ae-web-fix.md` (add), `tests/services/domain-dispatch-service.test.ts` (delete), `tests/tools/ae-domain-dispatch-prepare.tool.test.ts` (delete), `tests/tools/ae-domain-dispatch-aggregate.tool.test.ts` (rename), `tests/services/ocr-service.test.ts` (add), `tests/services/review-catalog.test.ts`, `tests/services/review-selector.test.ts`, `tests/tools/ae-review-scope-analyze.tool.test.ts` (add), `tests/tools/ae-work-specialist-select.tool.test.ts` (add), `tests/tools/ae-specialist-aggregate.tool.test.ts` (add), `tests/assets/asset-health.test.ts`, `tests/e2e/plugin-registration.test.ts`.
- Forbidden files: Office/PDF tools and services, `scripts/install-project.mjs`, `LICENSE`, `THIRD-PARTY-NOTICES`.
- Approach: move catalog/schema names, tool registry imports, service implementations, assets, and tests as one serial compatibility change. Use upstream `reviewers/` and `developers/` layouts only where the current asset catalog can discover them. Verify OCR dependency licensing in U7 before final distribution claims. Keep agents as explicitly selected prompt assets, not a claim of automatic external-agent execution.
- Tests: `ocr-service`, `review-catalog`, `review-selector`, command-template, review-scope, specialist-selection/aggregation, asset-health, and plugin-registration suites.
- Validation: `npm run typecheck`; focused `vitest run tests/services/ocr-service.test.ts tests/services/review-catalog.test.ts tests/services/review-selector.test.ts tests/tools/ae-review-scope-analyze.tool.test.ts tests/tools/ae-work-specialist-select.tool.test.ts tests/tools/ae-specialist-aggregate.tool.test.ts`; `npm test`.
- Rollback signals: a removed domain dispatch symbol remains imported, OCR registration works without its service/package test, or a changed prompt claims unavailable runtime automation. Revert the unit and retain the previous review stack.
- Deferred to implementation: OCR binary/network bootstrap execution is not performed until dependency installation approval and platform compatibility are established.

### U5 - Port workflow skill and command changes that have retained runtime boundaries

- Goal: Align PRD/design, prototype-preview, web-fix, command templates, and associated workflow prompts with the selected upstream behavior while rejecting references to excluded or removed capabilities.
- Requirements covered: AC2, AC3, AC5, AC7.
- Acceptance criteria covered: new/updated skill frontmatter, command references, and agent routes pass asset and prompt contract tests; deleted upstream assets are removed only when their replacement has a registered retained boundary.
- Depends on: U3, U4.
- Five-layer ownership: Knowledge, Delegation.
- Files: `src/assets/skills/ae-design/**`, `src/assets/skills/ae-prd/**`, `src/assets/skills/ae-prototype-preview/**`, `src/assets/skills/ae-web-forge/**`, `src/assets/skills/ae-work/**`, `src/assets/skills/ae-prompt-optimize/**`, `src/assets/skills/ae-handoff/**`, `src/assets/skills/ae-task-loop/**`, `src/assets/commands/ae-help.md`, `src/assets/commands/ae-install.md`, `src/assets/commands/ae-review-auto.md`, `src/assets/rules/persistent-resource-rules.md`, `tests/assets/markdown-protocols.test.ts`, `tests/assets/human-readable-doc-contract.test.ts`, `tests/assets/doc-extraction-contract.test.ts`, `tests/assets/prompt-invariants.test.ts`.
- Forbidden files: `package.json`, `package-lock.json`, runtime tool implementations, all document/Office skills.
- Approach: review each upstream Markdown asset for tool references before copying. Replace removed `ae:web-forge` or Chrome DevTools paths only where U3/U4 introduced an actual replacement command/tool. Preserve no-Office wording and Codex/OpenCode runtime distinction in local documentation assets.
- Tests: asset health, Markdown protocol, prompt invariants, documentation contract tests.
- Validation: `vitest run tests/assets/asset-health.test.ts tests/assets/markdown-protocols.test.ts tests/assets/human-readable-doc-contract.test.ts tests/assets/doc-extraction-contract.test.ts tests/assets/prompt-invariants.test.ts`; `node scripts/check-opencode.mjs`.
- Rollback signals: assets reference missing tools, a skill advertises document handling, or no corresponding runtime registration exists. Revert the affected asset set without changing runtime code.
- Deferred to implementation: prompt wording differences without a behavior or contract impact are not copied solely for textual parity.

### U6 - Port isolated correctness and security fixes with regression tests

- Goal: Apply the reviewed, retained-runtime fixes independently of the architecture migrations.
- Requirements covered: AC4, AC5.
- Acceptance criteria covered: directory FileParts remain intact during degradation; logically identical file paths dedupe despite slash/case variants; graph traversal rejects unsafe symlink traversal; resolver and review-proof edge cases have regression coverage.
- Depends on: U2.
- Five-layer ownership: Guardrail.
- Files: `src/services/command-file-argument-dedupe-service.ts`, `src/services/media-degradation-service.ts`, `src/services/graph/cargo-resolver.ts`, `src/services/graph/gradle-resolver.ts`, upstream-changed retained graph traversal service, `src/tools/ae-review-proof.tool.ts`, `tests/services/command-file-argument-dedupe-service.test.ts`, media degradation tests, graph resolver/traversal tests, `tests/tools/ae-review-proof.tool.test.ts`.
- Forbidden files: `package.json`, `package-lock.json`, asset catalogs, `LICENSE`, excluded document/Office files.
- Approach: port each fix with its upstream regression test where it applies to the retained source. For review-proof changes, retain the current project evidence-path schema and only adopt the validated parsing/trust corrections. Verify that Windows path normalization does not collapse distinct non-path URLs unintentionally.
- Tests: named focused test files for each service/tool changed.
- Validation: `vitest run tests/services/command-file-argument-dedupe-service.test.ts tests/services/graph-*.test.ts tests/tools/ae-review-proof.tool.test.ts`; `npm test`.
- Rollback signals: a test proves unrelated URL deduplication, a symlink fixture regresses normal directory traversal, or evidence output loses required current-worktree data. Revert the individual fix commit.
- Deferred to implementation: do not fold unrelated upstream cleanup into this unit.

### U7 - Rebuild no-Office parity, installation distribution, and compliance artifacts

- Goal: Make the upgraded runtime's shipped surface, package closure, installer copies, license state, and public claims explicit and testable.
- Requirements covered: AC5, AC6, AC7.
- Acceptance criteria covered: the new manifest names `61b7775`, selected hooks/tools including `ae-ocr`, all exclusions, and OpenCode `1.18.4`; distribution paths include required non-document runtime assets; docs and notices match approved decisions.
- Depends on: U2, U3, U4, U5, U6.
- Five-layer ownership: Memory, Guardrail, Distribution.
- Files: `docs/ae/parity/opencode-upstream-61b7775-manifest.json`, `tests/assets/opencode-parity-manifest.test.ts`, `scripts/check-opencode-core.mjs`, `scripts/check-opencode-upstream.mjs`, `scripts/check-install-smoke.mjs`, `scripts/install-project.mjs`, `README.opencode.md`, `README.md`, `docs/builtin-config.md`, `docs/opencode-upstream-sync.md`, `LICENSE`, `NOTICE.md`, `THIRD-PARTY-NOTICES`.
- Forbidden files: any excluded document/Office runtime source, tests, assets, and dependencies; unrelated Codex plugin distributions.
- Approach: replace, not relax, the old parity assertions. Ensure `distributionPaths` copies every required new runtime/support script and no Office/PDF file. Assert that `ae-ocr` is registered but no installer or postbuild path invokes OCR. Apply license and third-party notice changes only after OQ1 approval; describe Playwright/OCR behavior only with the validation results produced in U8.
- Tests: manifest source/registry/exclusion checks; installer ownership, staged import, foreign runtime/bridge, activation and uninstall rollback checks; documentation claim scans.
- Validation: `npm run build`; `npm test -- --run tests/assets/opencode-parity-manifest.test.ts`; `node scripts/check-opencode.mjs`; `node scripts/check-install-smoke.mjs`; `node scripts/check-opencode-upstream.mjs --source <upstream-checkout> --since a144f785579698190635305fe10784b7deca9e03`.
- Rollback signals: manifest has missing or stale tool names, installer omits a runtime file, an excluded path/dependency is detected, or license evidence is not approved. Do not tag the new baseline; restore the old manifest and distribution paths.
- Deferred to implementation: repository-wide license conclusion is outside engineering authority and remains the OQ1 decision record.

### U8 - Execute full compatibility validation and publish migration evidence

- Goal: Prove the new baseline works as an installed project-local OpenCode runtime and record outcomes for future upstream comparisons.
- Requirements covered: AC1 through AC7.
- Acceptance criteria covered: all required command evidence is captured; a temporary project installs and loads the runtime; excluded capabilities remain absent; any failed optional environment check is reported without a false capability claim.
- Depends on: U7.
- Five-layer ownership: Guardrail, Distribution.
- Files: `docs/00-process/active/opencode-upstream-61b7775-migration/progress.md`, `docs/00-process/active/opencode-upstream-61b7775-migration/ledger.jsonl`, `docs/ae/gates/<timestamp>-work-final.json`.
- Forbidden files: product source, `package.json`, lockfiles, license files, manifests.
- Approach: run the validation ladder from fastest static checks to installer and E2E tests. Capture exact exit status, version, temporary target location, injection result, and exclusions result in the ledger. Move the process directory to the prescribed archive only after the final review and gate pass.
- Tests: full test suite plus the installed-runtime smoke suite.
- Validation: `npm ci`; `npm run build`; `npm run typecheck`; `npm test`; `npm run test:e2e`; `npm run test:slow`; `npm run check`; `node scripts/check-install-smoke.mjs`; `node scripts/check-opencode-upstream.mjs --source <upstream-checkout> --since a144f785579698190635305fe10784b7deca9e03`; `git diff --check`.
- Rollback signals: any test failure in SDK client, registry/manifest, exclusions, installer rollback, or plugin registration blocks delivery. Revert to the last validated unit boundary rather than patching across units.
- Deferred to implementation: browser download/provisioning, OCR binary installation, and external OpenCode version setup require explicit execution-time approval when the environment lacks them.

## Consistency Check

- implementationUnitCount: 8
- sourceRequirementsCovered: user-confirmed AC1-AC7; prior PRD R3-R7 remain covered where they constrain project isolation, exclusions, security boundaries, parity, and traceability.
- sourceRequirementsDeferred: prior PRD R2's specific Chrome DevTools MCP wording is superseded by the user-confirmed Playwright migration; document/Office features remain explicitly excluded.
- openQuestionsCount: 2, both block implementation.

## Validation Plan

- Unit: focused Vitest tests named in U2-U6 and TypeScript diagnostics for the SDK migration.
- Integration: asset-health, catalog/registry, manifest, review-proof, installer smoke, and source-comparison scripts.
- User flow: build a temporary target project's staged runtime, validate default plugin export, start OpenCode `1.18.4`, and inspect plugin registration for skills, agents, commands, and tools.
- Data / operations: installer failure injection before activation and after activation; foreign bridge/runtime refusal; no global OpenCode configuration mutation; explicit record of any approved global Playwright executable operation.
- Observability: ledger contains commands, exit codes, installed runtime version, temporary target path, exclusion scan outcome, and rollback-injection outcome.

## Rollback / Recovery

- Create one implementation commit per completed unit; keep `package-lock.json`, manifest, installer, and registry changes in their owning serial units.
- If a unit fails, restore only that unit's commit after preserving its command output in the active ledger; do not reset the branch or delete unrelated work.
- The last known-good fallback is the current `a144f785` parity manifest, OpenCode `1.18.1` lockfile, and its documented installer behavior.
- Do not activate an upgraded bridge until staging builds and plugin-load validation pass; the installer must retain the previous owned runtime and bridge on failure.

## Plan Self-Review

- Placeholder scan: passed; no `TODO`, `TBD`, or unbounded implementation verbs remain.
- Consistency check: passed; SDK, browser, OCR/review, independent fixes, distribution, and validation have explicit dependency order.
- Scope check: passed; document/Office capability is forbidden in every applicable runtime/distribution unit.
- Acceptance coverage: passed; AC1-AC7 map to U1-U8 and the final validation ladder, with explicit OCR registration/execution coverage in ADR-4, U4, and U7.
- Validation gaps: OQ1 legal approval and OQ2 global Playwright policy cannot be validated by code and block U2/U3 respectively.
- Alternatives and ADR check: passed; direct merge and bug-fix-only alternatives are explicitly rejected.
- High-risk pre-mortem check: passed; SDK authentication, bootstrap atomicity, and stale registry scenarios have stop signals and validation.

## Handoff

- Review this plan with `ae-review domain:document` before execution.
- `ae-work` may begin only after OQ1 and OQ2 are accepted and entered in the active ledger, with the target branch and upstream SHA revalidated.
