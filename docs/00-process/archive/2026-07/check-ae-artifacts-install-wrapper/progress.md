---
type: process-note
status: done
date: 2026-07-07
topic: check-ae-artifacts-install-wrapper
---

# Check AE Artifacts Install Wrapper Progress

## Scope

Fix a help/catalog versus installed-project mismatch for `node scripts/check-ae-artifacts.mjs [--target <project>]`.

## External Finding

Target-project testing after an AE update found:

- `ae-tools help` advertised `node scripts/check-ae-artifacts.mjs [--target <project>]`.
- `scripts/check-ae-artifacts.mjs` was missing in the target project.
- `plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs` was also missing.
- Direct execution failed with `MODULE_NOT_FOUND`.

## Root Cause

The checker was implemented only as a root repository script. The installer did not generate a target-project wrapper, and the plugin did not package the checker implementation.

## Implementation

- Added packaged checker implementation:
  - `plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs`
- Converted root checker to wrapper:
  - `scripts/check-ae-artifacts.mjs`
- Updated installer:
  - `scripts/install-project.mjs`
- Updated install smoke:
  - `scripts/check-install-smoke.mjs`
- Updated regression assertion:
  - `tests/skill-scripts.test.mjs`
- Updated package check script:
  - `package.json`

## TDD Evidence

- Red: `npm test -- --test-name-pattern "check-install-smoke reports ok"` failed because `verifiedCommands` did not include `check-ae-artifacts`.
- Green: the same command passed after adding the packaged script, wrapper generation, and smoke assertions.

## Validation Result

- Passed: `npm test` with 71 tests.
- Passed: `npm run check`.
- Passed: `node scripts/check-ae-artifacts.mjs` with `checked: 42`.
- Passed: `node plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs` with `checked: 42`.
- Passed: `git diff --check`.

## Review Result

- AE review scope: current session diff, domain: code.
- Reviewer lane: approved; install path and execution checks cover the reported failure.
- Architect lane: approved; the shape matches the existing `check-design-contract` plugin-script plus wrapper pattern.
- Blocking findings: none.

## Gate

- Final gate: `docs/ae/gates/20260707T104341Z-work-final.json`
- Note: gate JSON files are ignored runtime evidence and were not committed.

## Residual Risk

Target projects must run the AE update or installer again before they receive the new wrapper.
