# OpenCode Upstream 61b7775 Migration Progress

## U1 - Decision And Baseline Gate

- Status: completed
- Branch: `codex/opencode-mode`
- Upstream source: `https://gitee.com/jiangqiang1996/ai-agent-engine`
- Upstream target: `61b777542fb00d2e082af126d17b070318281933`
- Previous parity baseline: `a144f785579698190635305fe10784b7deca9e03`
- Decision: this branch will be distributed as GPL-3.0-or-later with updated notices.
- Decision: global `@playwright/cli` installation is approved for the selected upstream Playwright behavior.
- Exclusions: PDF, DOCX, XLSX, PPTX, OfficeCLI, and all related source, assets, tests, and dependencies remain excluded.
- Execution: serial, because package metadata, registry/schema, installer, parity manifest, and E2E fixtures overlap across units.

## U5 - Workflow Asset Cleanup

- Status: completed
- Replaced retained workflow browser guidance with the registered `ae:playwright` boundary.
- Removed the obsolete OpenCode `ae-web-forge` asset and stale Chrome DevTools MCP workflow references.
- Added the missing `ae:prototype-preview` asset required by the existing runtime catalog.

## U6 - Portable Correctness Fixes

- Status: completed
- Added normalized FilePart dedupe, directory-preserving media degradation, and compatible review-proof porcelain parsing.
- Existing graph resolver null-safety and symlink protections already matched the reviewed upstream behavior; focused graph regression suites passed without duplicate changes.

## U7 - Parity, Distribution, And Compliance

- Status: completed
- Added the `61b7775` no-Office parity manifest, installer distribution filtering, GPL-3.0-or-later notice files, and accurate public runtime documentation.
- Installer smoke validation confirmed excluded-path filtering, plugin-load validation, rollback, foreign bridge/runtime refusal, and project uninstall behavior.

## U8 - Final Review Remediation

- Status: completed. Focused OCR, review scope, asset health, and parity suites passed (28 tests); typecheck and `git diff --check` passed.
- Corrected platform-specific OCR resolution and shell-free OCR process execution.
- Registered `ocr-reviewer` and `document-reviewer` assets selected by review scope analysis.
- Replaced stale browser-inspector workflow dispatches with `e2e-tester` and `ae:playwright`.
- Replaced the LICENSE pointer with GPL-3.0 text, added the GPL-3.0-or-later project notice, and expanded no-Office source scanning to all `src` runtime roots.
