# AI Agent Engine Codex Port Analysis

Date: 2026-05-11
Source: https://gitee.com/jiangqiang1996/ai-agent-engine
Observed source commit: 597b409eb3a53f78aa86861783e282ae6ffedcb5

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
- Thirty-one Codex skills with UI metadata in both plugin source and `.agents/skills` mirror.
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

## Recommended Next Phase

1. Convert `ae-tools.mjs` into a real MCP server only after the script surface stabilizes.
2. Decide whether Swagger/OpenAPI YAML needs a dependency-managed parser after the lightweight parser proves insufficient.
3. Add review-contract as a script/MCP command that emits selected reviewer personas.
4. Promote graph build/query to a separate MCP module only after defining `.ae/graph.db` schema, write approval, freshness policy, shard strategy, and preview expectations.
5. Revisit `ae-merge-branch` only after Git evidence capture, rollback guidance, and explicit authorization rules are stronger in `ae-work`.
