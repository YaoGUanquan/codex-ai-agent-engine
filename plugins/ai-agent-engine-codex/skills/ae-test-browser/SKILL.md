---
name: ae-test-browser
description: Use when the user asks for AE browser testing, /ae-test-browser, browser acceptance, UI verification, Playwright or DevTools checks, screenshots, console/network inspection, or end-to-end browser validation.
---

# AE Test Browser

Validate UI behavior in a real browser.

## Workflow

1. Read `references/browser-acceptance.md`.
2. Determine the target URL, route, acceptance flow, and pass/fail expectations.
3. Start or reuse the dev server when needed.
4. Confirm the page is nonblank and not obscured by a framework error overlay or blocking modal.
5. Use browser tools for navigation, snapshots, interaction, screenshots, console errors, and network failures.
6. Exercise at least one meaningful interaction for each claimed pass path.
7. Check desktop and mobile viewports when responsive behavior matters.
8. Report exact pass/fail evidence, screenshots if useful, and unverified areas.

## Rules

- Do not claim browser acceptance passed without actually exercising the flow.
- Prefer accessibility snapshots for interaction targets and screenshots for visual evidence.
- If the requested host is unreachable, validate the browser toolchain on a known-good page before blaming the app.
- Include console or network failures when they materially affect the result, even if the visible UI appears correct.
- Route implementation work back to `ae-frontend-design` or `ae-web-app`; this skill is for verification.
