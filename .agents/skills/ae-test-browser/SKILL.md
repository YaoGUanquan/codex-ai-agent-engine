---
name: ae-test-browser
description: Use when the user asks for AE browser testing, /ae-test-browser, browser acceptance, UI verification, Playwright or DevTools checks, screenshots, console/network inspection, or end-to-end browser validation.
---

# AE Test Browser

Validate UI behavior in a real browser.

## Workflow

1. Read `references/browser-acceptance.md`.
2. Determine the target URL, route, acceptance flow, and pass/fail expectations.
3. Choose the browser route:
   - Codex Browser/in-app browser for local pages, screenshots, snapshots, clicks, typing, and quick localhost checks.
   - Playwright for repeatable end-to-end flows, multi-step assertions, viewport checks, console/network capture, or CI-like evidence.
   - DevTools only when an available tool exposes low-level inspection that Browser or Playwright cannot cover.
4. Start or reuse the dev server when needed.
5. Confirm the page is nonblank and not obscured by a framework error overlay or blocking modal.
6. Use browser tools for navigation, snapshots, interaction, screenshots, console errors, and network failures.
7. Exercise at least one meaningful interaction for each claimed pass path.
8. Check desktop and mobile viewports when responsive behavior matters.
9. Report exact pass/fail evidence, screenshots if useful, and unverified areas.

## Rules

- Do not claim browser acceptance passed without actually exercising the flow.
- Prefer accessibility snapshots for interaction targets and screenshots for visual evidence.
- If the requested host is unreachable, validate the browser toolchain on a known-good page before blaming the app.
- Include console or network failures when they materially affect the result, even if the visible UI appears correct.
- Route implementation work back to `ae-frontend-design` or `ae-web-app`; this skill is for verification.
- Do not register or assume dynamic OpenCode MCP tools. Use only browser tools that are already available in the Codex session.
- Do not create a separate `ae-chrome-devtools` skill unless Codex exposes a stable DevTools tool contract for this repository.
