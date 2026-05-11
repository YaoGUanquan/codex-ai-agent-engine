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
- `scripts/ae-tools.mjs`: deterministic helper script.

The script currently supports:

```text
node scripts/ae-tools.mjs help [query]
node scripts/ae-tools.mjs recovery
node scripts/ae-tools.mjs task-analyze --mode scan --task "..."
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/example-plan.md
node scripts/ae-tools.mjs gate --workflow work --checkpoint final --validation "npm test"
node scripts/ae-tools.mjs swagger openapi.json method:POST path:/login mode:detail
```

## MVP Boundaries

Implemented now:

- Codex plugin scaffold.
- Seven valid Codex skills with UI metadata.
- Capability catalog and migration references.
- Help, recovery, task analysis, gate, and OpenAPI JSON smoke paths.
- Explicit Codex permission model language for Git, network, destructive commands, browser setup, and database writes.

Deferred intentionally:

- Real MCP server.
- SQLite file graph build/query.
- SQL/JDBC tool.
- Handoff/new-session automation.
- Prompt optimize that creates new sessions.
- OpenCode style `/ae-*` slash command auto-registration.
- Automatic model scenario routing.
- Automatic global rule injection.
- `/ae-update` because it implies reset/clean/pull/build operations.

## Validation Performed

- Confirmed source commit with `git ls-remote` and cloned the upstream repository.
- Inspected upstream README, package, plugin entrypoint, catalog, command registration, agent registration, skill-path registration, MCP registration, tools, and representative skills.
- Validated all seven Codex `SKILL.md` files with the local skill quick validator.
- Parsed plugin JSON, MCP JSON, and capability catalog JSON.
- Ran `node --check` on `scripts/ae-tools.mjs`.
- Ran help, recovery, scan task analysis, final gate, blocked gate, and Swagger JSON detail smoke tests.

## Recommended Next Phase

1. Convert `ae-tools.mjs` into a real MCP server only after the script surface stabilizes.
2. Add YAML parsing for Swagger/OpenAPI through a dependency-managed package or MCP server.
3. Add review-contract as a script/MCP command that emits selected reviewer personas.
4. Port graph build/query as a separate MCP module with explicit `.ae/graph.db` write approval.
5. Add a small installer or marketplace entry only after deciding whether this plugin should be repo-local or home-local.
