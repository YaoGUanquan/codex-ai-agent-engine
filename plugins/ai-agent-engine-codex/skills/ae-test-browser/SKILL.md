---
name: ae-test-browser
description: Use when the user asks for AE browser testing, /ae-test-browser, browser acceptance, UI verification, Playwright or DevTools checks, screenshots, console/network inspection, or end-to-end browser validation.
---

# AE Test Browser

Validate UI behavior in a real browser.

## Workflow

1. Determine the target URL, route, and acceptance flow.
2. Start or reuse the dev server when needed.
3. Use browser tools for navigation, snapshots, interaction, screenshots, console errors, and network failures.
4. Check desktop and mobile viewports when responsive behavior matters.
5. Report exact pass/fail evidence, screenshots if useful, and unverified areas.

## Rules

- Do not claim browser acceptance passed without actually exercising the flow.
- Prefer accessibility snapshots for interaction targets and screenshots for visual evidence.
- If the requested host is unreachable, validate the browser toolchain on a known-good page before blaming the app.
