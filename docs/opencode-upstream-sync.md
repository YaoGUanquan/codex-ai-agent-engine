# OpenCode Upstream Sync

## Source

- Repository: `https://gitee.com/jiangqiang1996/ai-agent-engine`
- Branch: `master`
- Last inspected commit: `61b777542fb00d2e082af126d17b070318281933`
- Inspection command: `node scripts/check-opencode-upstream.mjs --source <checkout> --since a144f785579698190635305fe10784b7deca9e03`

## Adaptation policy

The Gitee project is the OpenCode runtime reference. This branch consumes
portable workflow and skill guidance, but does not copy the upstream TypeScript
plugin runtime by default. Runtime code depends on the upstream tool registry,
hooks, MCP registration, session SDK, and asset layout.

Before adapting an upstream change:

1. Inspect the changed files with `check-opencode-upstream.mjs`.
2. Classify the change as portable skill guidance, deferred runtime behavior,
   or an asset that requires a matching tool boundary.
3. Adapt only the smallest OpenCode-native file or skill needed.
4. Run `node scripts/check-opencode.mjs`, the project tests, and an OpenCode
   CLI config/command smoke test.

## Current mapping

| Upstream change | Local action | Evidence or reason |
| --- | --- | --- |
| `61b7775` SDK v2, Playwright CLI, OCR, and review routing | Selectively applied | Runtime and asset boundaries are asserted by the 61b7775 no-Office manifest |
| `61b7775` PDF, document, and OfficeCLI paths | Excluded | No matching capability is shipped in the project-local installer distribution |

## Boundary

OpenCode commands and agents are project-local assets under `.opencode/`.
Shared AE skills remain under `.agents/skills/`. Upstream runtime features such
as dynamic MCP registration, system transforms, session creation, and model
routing require an explicit compatibility implementation before adoption.
