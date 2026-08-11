# Changelog

This file is the complete release history of AI Agent Engine for Codex (since 0.3.7; earlier versions shipped without release notes). The `README.en.md` version section keeps only the latest five versions; every release appends the current entry to both files, README entries beyond the window move here, and `node scripts/check-release-notes.mjs` enforces the mapping.

中文版本: [CHANGELOG.md](CHANGELOG.md)

### 0.3.25 (2026-08-11)
- Unify the requirements-artifact directory declarations: the capability catalog's `ae-brainstorm` `artifactPath` moves from `docs/ae/brainstorms` to `docs/ae/prds`; the `ae-help` artifact contract's Requirements row and requirements frontmatter example now use `docs/ae/prds` with the `ae-prd` capture shape (`type: prd`), the plan `origin` example follows, and legacy requirements may remain under brainstorms; the `ae-review` document-review default search now includes `docs/ae/prds`. The top-level `artifactPaths` map and the init templates have been correct since 0.3.22 and are unchanged; `docs/ae/brainstorms` remains the exploratory-notes directory (`artifactPaths.ideas`).
- Add regression assertions locking the directory declarations (catalog, artifact contract, and scope detection in source and mirror); the stale directory note in the work reference project's existing `docs/ae/README.md` was fixed alongside (an init-managed legacy file that plugin updates do not rewrite).
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These checks prove skill docs, mirror, and distribution contracts only, not runtime acceptance in any target project.

### 0.3.24 (2026-08-11)
- Upgrade `tidy` archive conflicts from skip to lossless file-by-file merge: when the target exists, missing files move in, identical files deduplicate, and same-name different-content files arrive with a `.from-active-<date>` suffix; the emptied source directory is removed. Add a `memoryBudget` report (default 15KB, `--memory-budget-kb`; report-only, memory files are never moved).
- Post-update auto maintenance: after installing files, `update-project` runs `tidy --apply` through the target's `scripts/ae-tools.mjs` (done notes, empty dirs, expired evidence; never stale archiving) and reports the summary under `maintenance` in the update output; `--no-tidy` skips it; a missing CLI or failed pass degrades to skipped without blocking the update. INSTALL (both languages), the README update section, and the `ae-update` skill document the behavior.
- Governance execution: the two same-name archive conflicts in the work reference project were merged clean, a memory-distillation handoff now waits in that project for its own sessions, and Light Path / collision calibration signals were added to the 0.3.23 experience note.
- Verification: `npm test` (five new cases covering merge, memory budget, and auto maintenance), `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These prove CLI behavior and distribution contracts; auto maintenance is evidenced by local git-repository simulation and does not represent end-to-end updates against real remotes.

### 0.3.23 (2026-08-11)
- Add the `tidy` maintenance command: classifies `docs/00-process/active/` notes (done/empty/stale/archived-pointer/active) and detects expired evidence under `docs/ae/gates/` and `docs/ae/evidence/artifacts/` against the retention window (default 3 months); dry-run by default, `--apply` archives done notes, removes empty dirs, and moves expired evidence while rewriting ledger references; `--archive-stale`, `--stale-days`, and `--retention-months` tune the policy; existing archive targets are skipped safely.
- Fix `parseOptions`: repeated `--key value` flags accumulate into arrays, so `gate --validation` records every validation command separately.
- Four skill refinements: the `ae-prd` capture template gains a `## Perspective Collision (Conditional)` landing section and `ae-brainstorm` gains deterministic collision triggers (skip S1-S2 single-direction tasks, four perspectives by default) with an explicit landing rule; `ae-review` gains a Light Path (at most 3 files, no public API/data/security/dependency boundary, not a delivery gate -> single lane without review-package/review-contract) plus persona quick selection; `ae-brainstorm`/`ae-prd`/`ae-review` point their evidence-tier wording at the single definition in `ae-plan/references/validation-evidence-profile.md`; `ae-handoff` and `ae-lfg` share one handoff routing rule (task-scoped handoffs in the process directory, standalone cross-session handoffs in `docs/ae/handoffs/`).
- Memory maintenance rule templates (en/zh-CN) and this repository's rules gain a size-and-distillation budget (about 15KB per file, yearly decision-log rotation, quarterly reviewStatus pass, archive retired topics).
- Verification: `npm test` (new gate accumulation and tidy cases, 121 total), `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`. These prove CLI behavior, skill docs, and distribution contracts stay consistent; the tidy runs on this repository and the work reference project are evidenced by command JSON output and do not represent runtime acceptance of other projects.

### 0.3.22 (2026-08-11)
- Knowledge-base governance batch one: `docs/ae/prds/` is the canonical requirements directory; `ae-brainstorm` reuses the `ae-prd` capture contract and writes durable requirements to `docs/ae/prds/`, removing the duplicate `requirements-capture.md`; `recovery` scans PRD artifacts; init provisions `docs/ae/prds` and no longer creates the legacy `docs/ai-memory` compatibility pointer (existing projects are unchanged).
- `review-package` now emits fingerprint artifacts (commit list, diffstat, inventory, base/head SHA, and a `git diff -U10` rebuild command) instead of embedding the full diff body; init/archive templates and `docs/00-process/templates/archive-rules.md` add a three-month gate/evidence retention policy.
- Added `docs/external-samples/README.md` to register sample corpus purpose and retention rules.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-release-notes.mjs`, `npm test`, `npm run check`, and `npm run check:smoke`. These checks prove CLI, skill docs, and distribution contracts only, not target-project init or review workflow runtime acceptance.

### 0.3.21 (2026-08-11)
- Fullstack skill symmetry: `ae-backend` adds six language guidance files (Java, Go, Python, C, C++, C#), the workflow now selects guidance by repository stack, and other backend languages still fall back to existing repository conventions.
- Contracts and boundaries: `api-contract-checklist.md` expands with a Frontend-Backend Alignment section; `ae-web-app` and `ae-web-forge` route to the shared contract checklist; `ae-debug` adds Backend Failure Quick Map and Frontend-Backend Boundary Quick Map.
- `ae-sql` adds `sql-safety-checklist.md` (operation risk tiers and safety constraints), and the skill workflow mounts that checklist.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-install-smoke.mjs`, and `npm test`. These checks prove skill docs, mirror, and distribution contracts only, not API, database, or deployment acceptance in any target project.

### 0.3.20 (2026-08-11)
- Structural refactor: the plugin's `scripts/ae-tools.mjs` (a ~2860-line monolith) is split into 15 command modules under `scripts/ae-tools/` (utils, yaml, git, evidence, graph, help, recovery, gate, tasks, review, swagger, claude, markitdown, static-server, init); the entry file keeps only command dispatch and global argument parsing, and the thin root wrapper `scripts/ae-tools.mjs` import path in target projects is unchanged.
- The trilingual init templates are externalized to UTF-8 files under `scripts/ae-tools/init-templates/{en,zh-CN}/*.md` with `{{placeholder}}` substitution; bilingual output is composed from the two languages, and CRLF is normalized at render time so checkout line endings cannot leak into generated files.
- Added the shared in-plugin module `scripts/artifact-check-utils.mjs`; `check-ae-artifacts.mjs` and `check-design-contract.mjs` now reuse readArg / isRepositoryRelativePath / toPosix / parseFrontmatter and related helpers instead of keeping duplicate copies.
- Added a module-dependency regression guard: `tests/ae-tools.test.mjs` statically builds the local-import graph of `scripts/ae-tools/*.mjs`, DFS-checks it for cycles, and asserts `utils.mjs` stays a zero-local-import foundation layer; introducing a circular import now fails `npm test` with the printed cycle chain.
- Validation: `node scripts/check-syntax.mjs`, before/after golden-output comparison of key commands (help/recovery/graph-build/graph-query/review-contract/evidence/gate/claude-delegate, differing only in timestamps and git fingerprints), byte-identical trilingual init output against the pre-split baseline (48 baseline files), `npm test` (112 tests), `npm run check`, `node scripts/check-install-smoke.mjs`, and `node scripts/check-global-install-smoke.mjs`. These checks prove the CLI behavior and install contract are unchanged after the split; they do not prove runtime acceptance in any target project.

### 0.3.19 (2026-08-11)
- Completed frontend stack coverage: `ae-web-app` adds `svelte-guidance.md` (Svelte 5 runes/SvelteKit: `$derived` first, `$effect` cleanup, keyed each blocks, load functions, `$lib/server` boundary) and `angular-guidance.md` (standalone/signals: async pipe or `takeUntilDestroyed` subscription hygiene, OnPush visibility, `@for` track, typed forms, `switchMap` race cancellation, SSR guards); the skill workflow now selects among React/Vue/Svelte/Angular guidance, with other stacks falling back to existing repository conventions.
- Frontend adaptation of non-frontend skills: the `ae-review` rule profiles add a "Frontend Components / Styles" lens (Vue/Svelte/Angular reactivity mistakes, list keys/track expressions, click handlers without keyboard equivalents, diff-weakened accessibility, style leakage, `innerHTML`-style sinks) with a framework-anchored suppression rule; the `ae-tdd` workflow adds frontend test-harness guidance (reuse the existing runner and component-testing library, assert user-visible behavior, jsdom does not prove real-browser behavior and routes to `ae-test-browser`).
- Evaluated and intentionally unchanged: the local-runtime smoke gate already covers UI surfaces; browser acceptance for plans stays owned by the `ae-lfg`/`ae-web-forge` pipeline instead of being duplicated inline.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-install-smoke.mjs`, and `npm test`. These checks prove skill docs, mirror, and distribution contracts only, not runtime or browser acceptance in any target frontend project.

### 0.3.18 (2026-08-11)
- Strengthened the frontend-facing skill references: `ae-web-app` React guidance now covers structure conventions, common defect traps (derived state, effect discipline, list keys, async races, controlled inputs, measured memoization), Next.js/SSR boundaries, and user-facing states, plus a new parallel `vue-guidance.md` (Vue 3/Nuxt: reactivity loss, computed-first, `v-for` keys, one-way props flow, SSR boundaries); the skill workflow now selects the guidance matching the repository stack.
- `ae-frontend-design` quality checklist and design rules add an accessibility baseline (semantic structure, labeled controls, keyboard reachability with visible focus, contrast, alt text), responsive breakpoint verification, and async-loading layout stability; `ae-web-app` deployment readiness adds a frontend-performance non-regression item; `ae-debug` adds a frontend failure quick map (blank page, hydration, CORS/auth, cache, styles, environment differences); `ae-test-browser` minimum acceptance evidence adds keyboard operability of the primary control.
- Validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-install-smoke.mjs`, and `npm test`. These checks prove skill docs, mirror, and distribution contracts only, not runtime, browser, or deployment acceptance in any target frontend project.

### 0.3.17 (2026-08-10)
- Hardened `ae-test-api` and the shared local-runtime smoke gate credential handoff: agents must create a non-empty UTF-8 (no BOM) fillable request-config template with method, path, fill steps, and `REPLACE_WITH_LOCAL_TOKEN`, and must not leave empty files or write non-ASCII configs through unsafe PowerShell redirection.
- Added the `request-config-template` reference as the canonical template shape; agents hand off only the absolute path and never read the user-populated token. Validation: `node --test --test-name-pattern "API bubble testing|local runtime smoke gate" tests/skill-scripts.test.mjs`, `node scripts/check-skill-mirror.mjs`, and `node scripts/check-release-notes.mjs`. These checks prove skill and distribution contracts only, not target-project authenticated API acceptance.

### 0.3.16 (2026-08-10)
- A `recovery-failed` operation cannot be purged until `recover --operation <id>` reaches `rolled-back`, preventing deletion of the only backup before recovery succeeds. Validation adds this recovery-lifecycle regression case.

### 0.3.15 (2026-08-10)
- On Windows, global apply invokes the Codex CLI through `cmd.exe`, explicitly registers the user marketplace with `codex plugin marketplace add $HOME --json`, then installs the plugin. Both CLI steps are journaled and installer-owned files roll back if either step fails.

### 0.3.14 (2026-08-10)

- Global apply now publishes `ai-agent-engine-codex` through the current user's personal marketplace and calls `codex plugin add ai-agent-engine-codex@personal --json`; it does not patch the Codex cache or client registry.
- The installer backs up legacy user-level AE skill copies rather than reactivating duplicate skills, and its confirmation digest now binds `--retire-modified`. Validation covers successful personal publication, retained marketplace entries, and installer-owned file rollback after a CLI-registration failure; real client visibility is verified separately with `codex plugin list`.

### 0.3.13 (2026-08-10)

- Global migration now uses an explicit manifest instead of deriving consumers from local paths or project names; project components are backed up and retired only after fingerprint verification by default.
- Added `--retire-modified`, a separate authorization in addition to apply operation ID and confirmation for full-backup retirement of modified or unknown AE components. A global runtime created by an installer journal can upgrade transactionally.

### 0.3.12 (2026-08-10)

- Added per-user global AE distribution with a deterministic dispatcher while keeping project docs, memory, graph, and archives in their original project roots.
- Validation uses `npm.cmd test`, `npm.cmd run check`, a global preview smoke, and an isolated apply fixture. These prove the local distribution contract only; they neither authorize nor prove an actual consumer apply.
- Verified `$HOME/.agents/skills` discovery and probe invocation in a fresh `codex-cli 0.146.1` session. An already-open Codex desktop task does not hot-reload its startup skill catalog.

### 0.3.11 (2026-08-06)

- Hardened `ae-claude-code` after installing OpenAI's `codex@openai-codex` Claude Code plugin: its default delegated child now emits JSON without session persistence, runs in `plan` mode with `Read,Grep,Glob` only, and disables slash commands.
- Documented the directional boundary: the official plugin lets an interactive Claude Code session invoke Codex through `/codex:*`; it does not let Codex control Claude Code. Claude-to-Codex transfer and review use the official plugin, while Codex-to-Claude delegation remains a separate read-only second-opinion lane.
- Distribution validation uses `npm.cmd test`, `npm.cmd run check`, `node scripts/check-install-smoke.mjs`, `node scripts/check-release-notes.mjs`, and `git diff --check`. These checks prove local skill and distribution contracts only; they do not prove a future Claude/Codex interactive run, authentication state, quota, or target-project acceptance.

### 0.3.10 (2026-08-05)

- Added `ae-test-api` for post-change backend API bubble testing. It selects endpoints, success/error paths, and conditional contract risks, while keeping static tests, runtime health, authenticated API smoke, browser acceptance, and deployment evidence distinct.
- Each completed verification writes one sanitized API Verification Record with field provenance, assertion summaries, and unverified boundaries. It excludes bodies, tokens, cookies, private command material, and concrete resource identifiers; long-term knowledge relations require an explicit user request.
- The skill reuses the existing local-runtime smoke gate as the sole owner of local-call safety. It adds no default HTTP client, generated scripts, lifecycle manager, MCP runtime, external runner, or automatic repair. Distribution validation uses `npm.cmd test`, `npm.cmd run check`, `node scripts/check-install-smoke.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check`; these checks prove local skill and distribution contracts only, not target-project authenticated API, browser, or deployment acceptance.

### 0.3.9 (2026-08-04)

- Added `ae-reverse-engineering` for user-owned or explicitly authorized binary, mobile, forensic, compatibility, and local training artifacts. It requires authorization, provenance, a static baseline, and evidence boundaries; it excludes license bypass, credential theft, evasion, active exploitation, scanning, and unauthorized target interaction.
- The skill does not install tools, register MCP servers, change global configuration, or automatically retain experience. Missing tools or isolation are controlled recommendations that require explicit authorization, and the report template separates observed, inferred, and unverified conclusions.
- Distribution validation uses `npm.cmd test`, `npm.cmd run check`, `node scripts/check-install-smoke.mjs`, `node scripts/check-release-notes.mjs`, `node scripts/check-ae-artifacts.mjs`, and `git diff --check`. These checks prove local skill and distribution contracts only, not real-artifact, toolchain, authorized-environment, or future-model-adherence acceptance.

### 0.3.8 (2026-08-04)

- Added the declared `docs/08-ai-memory/00-registry.json` contract, path-safe validator, `ae-memory-query`, `ae-knowledge-map`, and `ae-knowledge-query`. Markdown memory remains canonical; commands return only registered metadata and evidence-backed declared relations.
- `ae-graph-build` and `ae-graph-query` now expose additive `limits` metadata while retaining the default 500-file scan and uncapped edge behavior. Edge truncation requires explicit `--edge-limit`.
- The installer now ships the memory-contract checker, and install smoke verifies that an absent registry produces a structured non-zero diagnostic without creating state. This adds no CodeGraph, MCP auto-registration, network request, database, or background service.

### 0.3.7 (2026-08-03)

- Retired `ae-computer-use-guard` and `ae-video-edit-computer`, including their active mirrors, language metadata, installation expectations, and Computer Use hook templates. The installer removes these stale skill directories from target projects; this change adds neither compatibility aliases nor a desktop or video runtime.
- `ae-test-browser` now requires reconnaissance before action, `networkidle` when applicable, and black-box treatment for helper scripts. `ae-review` now requires a behavior baseline, call-path evidence, and a local design reason before recommending `delete` or `shrink`.
- `ae-prd`, `ae-plan`, and `ae-review` templates now offer optional must-have, deviation, and verification-gap records. Existing requirement IDs connect delivery criteria, approved variance, and missing proof; the templates do not add automatic judging, background loops, hooks, or runtime registration.
- Image-prompt work retains prompt-first general capability without depending on the retired Computer Use configuration.
- Distribution versions are synchronized at `0.3.7`. The change passed `npm test`, `npm run check`, `node scripts/check-install-smoke.mjs`, and `git diff --check`. These checks establish local distribution and static contracts only, not browser, deployment, or future-model-adherence acceptance.
