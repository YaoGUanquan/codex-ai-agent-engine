# Browser Acceptance

Minimum browser evidence for a claimed pass:

1. Target route or URL.
2. Acceptance flow exercised.
3. One or more interaction targets confirmed in the page snapshot.
4. No blocking console or network failure on the claimed happy path.
5. At least one screenshot or equivalent visual confirmation when layout matters.
6. Desktop and mobile checks when responsive behavior is relevant.

Route selection:

- Use Browser/in-app browser when the task is a local page inspection, manual flow, screenshot, click/type interaction, or quick localhost validation.
- Use Playwright when the task needs repeatable scripted evidence, multiple assertions, viewport matrix checks, or console/network capture across a flow.
- Use DevTools only when the current Codex session exposes a stable DevTools-capable tool and the task needs lower-level inspection beyond Browser or Playwright.
- Do not dynamically register Chrome DevTools MCP servers or assume OpenCode tool registration behavior.

Minimum browser evidence for a failure:

1. Route or URL reached.
2. Exact failure point.
3. Console error, network failure, incorrect UI state, or screenshot evidence.
4. Unverified areas that were not exercised after the failure.
