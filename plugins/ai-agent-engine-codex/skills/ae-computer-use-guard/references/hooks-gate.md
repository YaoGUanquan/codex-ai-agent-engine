# Computer Use Hooks Gate

Use this gate before every Codex `Computer Use` stage, especially under the default `2G/4-core relay` profile.

## Required Checks

1. Check whether project or user Codex hooks are installed and trusted for the current Codex surface.
2. If hooks are absent or trust is unclear, show the user a compact install request.
3. If the user agrees, install or point them to the templates under `docs/ae/templates/computer-use-hooks/`, then require user review/trust before continuing.
4. If the user refuses or trust cannot be confirmed, stop before `Computer Use`.

## User Request Text

```text
Computer Use requires hooks-ready protection for the current 2G/4-core relay profile.
I can install the AE hook templates, but you must review/trust them in Codex before GUI control continues.
Approve installing the hook templates?
```

## Effective Status Values

| Status | Meaning | Action |
| --- | --- | --- |
| `hooks_ready` | Hooks are installed and trusted. | Continue with the execution contract. |
| `hooks_missing` | No hook config or templates are present. | Ask for installation approval. |
| `hooks_untrusted` | Hook files exist but trust is unclear. | Ask the user to review/trust; do not continue yet. |
| `hooks_declined` | User refused install or trust. | Block `Computer Use`; local-only work may continue. |

## Boundary

Hooks are a guardrail, not a complete enforcement boundary. They reduce unsafe tool use and can deny supported tool calls, but server middleware is still required to hard-block oversized API request bodies.
