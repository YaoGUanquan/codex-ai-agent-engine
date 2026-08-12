# AI Agent Engine Codex Port Analysis

Date: 2026-05-11
Source: https://gitee.com/jiangqiang1996/ai-agent-engine
Observed source commit: 76d832c96a1c810410982bf28b425a3aedb461ab
Observed source ref: remote master inspected through the Gitee API on 2026-07-22.

## Conclusion

A Codex version is feasible, but it should not be a direct port of the OpenCode plugin runtime.

The upstream project is an OpenCode plugin that dynamically registers slash commands, agent prompts, skill paths, MCP configuration, rules, system prompt transforms, and OpenCode tools. Codex does not expose the same runtime API, so direct compilation or direct plugin entrypoint reuse would not provide the same behavior.

The workable Codex design is:

1. A local Codex plugin for packaging.
2. Multiple explicit Codex skills for workflow entrypoints.
3. Local scripts for deterministic checks and parsing.
4. A future MCP server only for stable tool APIs that need persistent tool semantics.

## Portable Parts

- Workflow contracts from AE skills such as lfg, brainstorm, plan, work, review, and swagger parser.
- Review and research persona concepts.
- Artifact path conventions under docs/ae.
- Deterministic helpers such as recovery, gate checks, task analysis, help/catalog, and OpenAPI parsing.

## Non-Portable Parts

- OpenCode `config.command` slash command registration.
- OpenCode `config.agent` with `mode: subagent|primary|all`.
- OpenCode `skills.paths` runtime injection.
- OpenCode `experimental.chat.system.transform` rule injection.
- OpenCode `ctx.ask` permission prompts.
- OpenCode SDK session creation/navigation used by handoff and prompt optimize.
- OpenCode-specific global/project paths such as `.opencode/*` and `~/.config/opencode/*`.

## Created Codex MVP

The initial Codex plugin lives at:

`plugins/ai-agent-engine-codex`

It contains:

- `.codex-plugin/plugin.json`: Codex plugin manifest.
- `.mcp.json`: empty MCP declaration for now; no fake server is declared.
- `skills/ae-help`: capability listing and migration notes.
- `skills/ae-lfg`: full workflow orchestrator.
- `skills/ae-brainstorm`: requirement clarification.
- `skills/ae-plan`: plan generation.
- `skills/ae-work`: guarded implementation workflow.
- `skills/ae-review`: layered code/document review.
- `skills/ae-swagger-parser`: OpenAPI/Swagger summary workflow.
- `skills/ae-skill-audit`: external agent/skill repository audit workflow.
- `scripts/ae-tools.mjs`: deterministic helper script.

The script currently supports:

```text
node scripts/ae-tools.mjs help [query]
node scripts/ae-tools.mjs recovery
node scripts/ae-tools.mjs task-analyze --mode scan --task "..."
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/example-plan.md
node scripts/ae-tools.mjs gate --workflow work --checkpoint final --validation "npm test"
node scripts/ae-tools.mjs swagger openapi.json method:POST path:/login mode:detail
node scripts/ae-tools.mjs ae-graph-build [--root <path>] [--limit 500]
node scripts/ae-tools.mjs ae-graph-query [--root <path>] (--path <file>|--keyword <text>)
```

## MVP Boundaries

Implemented now:

- Codex plugin scaffold.
- Forty Codex skills with UI metadata in both plugin source and `.ae-source/skills` maintenance mirror.
- Capability catalog and migration references.
- Help, recovery, task analysis, gate, OpenAPI JSON/YAML smoke paths, and shallow dependency graph scan/query helpers.
- Project-local installer and updater with bilingual skill-list metadata as the default.
- Explicit Codex permission model language for Git, network, destructive commands, browser setup, and database writes.
- Browser acceptance routed through Codex Browser, Playwright, or available DevTools tooling instead of dynamic OpenCode MCP registration.

Deferred intentionally:

- Real MCP server.
- Full SQLite-backed file graph build/query with schema design, sharding, freshness, and preview UI.
- SQL/JDBC tool.
- `ae-merge-branch`, until `ae-work` has stronger Git evidence and authorization boundaries.
- Handoff/new-session automation.
- Prompt optimize that creates new sessions.
- OpenCode style `/ae-*` slash command auto-registration.
- Automatic model scenario routing.
- Automatic global rule injection.
- OpenCode hook parity and automatic runtime enforcement.

## Validation Performed

- Confirmed source commit with `git ls-remote` and cloned the upstream repository.
- Inspected upstream README, package, plugin entrypoint, catalog, command registration, agent registration, skill-path registration, MCP registration, tools, and representative skills.
- Validated all seven Codex `SKILL.md` files with the local skill quick validator.
- Parsed plugin JSON, MCP JSON, and capability catalog JSON.
- Ran `node --check` on `scripts/ae-tools.mjs`.
- Ran help, recovery, scan task analysis, final gate, blocked gate, and Swagger JSON detail smoke tests.
- Ran `cmd /c npm run check` after adding the skill mirror, language metadata checks, install smoke checks, and default bilingual metadata behavior.

## 2026-07-07 Freshness Update

- Remote HEAD was rechecked with `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git HEAD`.
- Observed commit changed from `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392` to `760cc5b548d3f82c5db764fc01b98d7874867b95`.
- The current Codex port does not claim full upstream parity. The first synced item from this refresh is PRD reference completeness for `ae-prd`.

## 2026-07-07 Frontend And Brainstorm Refresh

- Remote `master` was rechecked with `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git refs/heads/master`.
- Observed commit advanced from `760cc5b548d3f82c5db764fc01b98d7874867b95` to `f0cb655ca76fc5e32b5179e155c84f857a9ec289`.
- Portable methods adapted in this pass: multi-perspective brainstorm collision synthesis, frontend skill repositioning away from "first version" language, and Codex-native four-question web routing through `ae-web-forge`.
- Runtime-specific behavior still rejected: OpenCode sub-agent registry, dynamic browser MCP registration, and slash-command enforcement.

## 2026-07-07 Design And Web Forge Entry Points

- Added `ae-design` as a Codex-native design contract stage between PRD and plan.
- Added `ae-web-forge` as an independent frontend/Web routing entrypoint that selects existing Codex skills instead of OpenCode `@ui-*` agents.
- Design artifacts use `docs/ae/designs`, not upstream `ae/designs`.
- Browser acceptance remains routed through `ae-test-browser`, Browser, Playwright, or available local tooling; no dynamic Chrome MCP registration is claimed.
- Capability catalog, language metadata, README content, install smoke checks, and regression tests now cover both entrypoints.

## 2026-07-07 Routing And Design Contract Follow-Up

- Resolved the `ae-web-forge` / `ae-web-app` overlap by making `ae-web-forge` the unified frontend/Web Q1-Q4 routing entrypoint.
- Repositioned `ae-web-app` as the implementation skill for Web app interaction, API, state, persistence, and light full-stack flows after routing.
- Added `check-design-contract` as a standalone checker for `docs/ae/designs/**/design.md` frontmatter, required sections, stable IDs, explicit omitted dimensions, mapping tables, and consistency fields.

## 2026-07-07 SkillOpt Audit Filter

- Treated Microsoft SkillOpt as reference input for audit discipline, not as a runtime dependency or automatic skill-evolution engine.
- Strengthened `ae-skill-audit` with a Skill Optimization Pattern Filter covering trajectory source, bounded edit shape, validation gate, rejected-update handling, staging/adoption, and AE validation mapping.
- Extended `ae-skill-audit/references/audit-template.md` with matching evidence fields so future audits can separate safe process adaptation from unsupported live mutation.
- Deferred `ae-skill-optimize`, replay datasets, SkillOpt install, and automatic adoption until AE has a local held-out task suite and a validated accept/reject gate.

## 2026-07-07 Codex Skill Slash Discoverability Planning

- Captured a PRD and plan for improving Codex-native skill-backed discoverability without claiming OpenCode `config.command` parity.
- The chosen direction is metadata, skill-description, documentation, release-checklist, and regression-test improvement for core AE skills such as `ae-prd`, `ae-plan`, `ae-brainstorm`, `ae-work`, `ae-review`, and `ae-lfg`.
- The boundary remains: this project does not implement automatic Codex command registration or OpenCode-style slash command injection. Runtime slash-list visibility must be phrased as Codex skill discoverability and verified in the active Codex app.
- Source artifacts: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md` and `docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`.

## 2026-07-07 Codex Skill Discoverability Docs Update

- Updated README, release checklist, `ae-help`, and capability catalog wording to distinguish supported Codex skill-backed discoverability from unsupported OpenCode `config.command` registration.
- Added a manual release verification step: in a fresh Codex App thread, search `/` for `ae-plan` and `ae-prd`, and verify explicit `$ae-plan` / `$ae-prd` invocation guidance remains available.
- Kept the non-portable runtime boundary intact: no command registry, MCP auto-loading, hooks, global config propagation, or always-on agent registry was added.

## 2026-07-07 Core Skill Trigger Metadata Completion

- Strengthened source and mirror metadata for `ae-prd`, `ae-plan`, `ae-brainstorm`, `ae-work`, `ae-review`, and `ae-lfg`.
- Each core entrypoint now has stable `ae-*` names in generated UI metadata plus explicit `ae-*`, `/ae-*`, `$ae-*`, and `use ae-*` trigger forms in `SKILL.md` descriptions.
- Added regression coverage in `tests/skill-scripts.test.mjs` to keep these trigger signals from drifting.
- Final pushed commit: `67896d0 feat: strengthen AE skill trigger metadata`.
- Final validation: `npm test`, `npm run check`, and `git diff --check` passed.
- Runtime UI boundary remains unchanged: actual `/` or skill-search visibility must be manually verified in the active Codex App and is not equivalent to OpenCode `config.command` registration.

## 2026-07-13 Workflow Optimization Refresh

- Remote `master` was rechecked with `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git refs/heads/master` at `00d7e9ca7594945ac26a46fffc43ccd679cd461b`.
- The capability catalog now assigns every skill one presentation tier (`core`, `docs`, `tools`, or `meta`) so help output is grouped without changing skill routing or permissions.
- Codex-native adaptations in this pass strengthen design-contract semantic validation and the `ae-task-loop` completion contract.
- OpenCode sessions, hooks, dynamic MCP registration, async bash, media fallback, graph telemetry, and designer-agent runtime remain explicitly unsupported.

## 2026-07-22 Safety And Test Contract Refresh

- The upstream `master` commit `76d832c96a1c810410982bf28b425a3aedb461ab` was inspected through the Gitee API after Git TLS negotiation proved intermittent in this environment.
- Upstream `package.json` now declares `GPL-3.0-or-later` and its `LICENSE` is GPLv3; the local capability catalog records that source fact without changing this repository's own licensing or adding an upstream dependency.
- This Codex port adopts the portable symbolic-link boundary: recursive artifact and design validation skip links, and Split Manifest entries must remain within the real design directory.
- `ae-design` now uses a risk-scaled test coverage matrix: it selects equivalence classes, boundary values, decision tables, state transitions, and error guessing only when the design structure warrants them. It intentionally does not import upstream fixed scenario counts, OpenCode agents, command runtime, or automatic coverage measurement.

## 2026-07-07 Installed Command Wrapper Follow-Up

- External target-project testing found one real catalog/install mismatch: `ae-tools help` advertised `node scripts/check-ae-artifacts.mjs [--target <project>]`, but installed projects did not receive that wrapper and the plugin did not package a matching script implementation.
- The fix uses the same distribution shape as `check-design-contract`: packaged implementation under `plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs`, root and installed-project wrappers under `scripts/check-ae-artifacts.mjs`.
- `scripts/install-project.mjs` now writes the installed wrapper, and `scripts/check-install-smoke.mjs` verifies both path presence and target-project execution.
- Regression coverage now treats `check-ae-artifacts` as an installed helper command in `verifiedCommands`.
- This does not add a Codex slash command or a new skill. It only makes a documented helper command executable after project installation/update.

## Recommended Next Phase

1. Convert `ae-tools.mjs` into a real MCP server only after the script surface stabilizes.
2. Decide whether Swagger/OpenAPI YAML needs a dependency-managed parser after the lightweight parser proves insufficient.
3. Add review-contract as a script/MCP command that emits selected reviewer personas.
4. Promote graph build/query to a separate MCP module only after defining `.ae/graph.db` schema, write approval, freshness policy, shard strategy, and preview expectations.
5. Revisit `ae-merge-branch` only after Git evidence capture, rollback guidance, and explicit authorization rules are stronger in `ae-work`.
