---
name: ae:playwright
description: Use when browser behavior needs Playwright CLI validation in an OpenCode project.
---

# AE Playwright

Use `playwright-cli` for browser validation. Confirm the command is available before attempting browser actions. Report unavailable browsers or CLI failures as verification gaps instead of claiming browser acceptance.

Do not install browser binaries, modify global OpenCode configuration, or run destructive browser actions unless the task explicitly authorizes them.
