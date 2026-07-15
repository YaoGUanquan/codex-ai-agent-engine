# OpenCode Upstream Sync

## Source

- Repository: `https://gitee.com/jiangqiang1996/ai-agent-engine`
- Branch: `master`
- Last inspected commit: `ff97284db2855e0048820843dd6416fb0f00ab72`
- Inspection command: `node scripts/check-opencode-upstream.mjs --source <checkout> --since b6df46e`

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
| `a2a0229` review specialists add `steps: 15` | Applied to `.opencode/agents/ae-review.md` | Same OpenCode agent frontmatter contract; limits review loops |
| `ff97284` Office skill design systems and visual validation | Deferred | Current branch has no upstream `ae-officecli` tool/runtime |
| `ff97284` removes upstream runtime dead assets | Not copied | No equivalent local files or behavior to remove |

## Boundary

OpenCode commands and agents are project-local assets under `.opencode/`.
Shared AE skills remain under `.agents/skills/`. Upstream runtime features such
as dynamic MCP registration, system transforms, session creation, and model
routing require an explicit compatibility implementation before adoption.
