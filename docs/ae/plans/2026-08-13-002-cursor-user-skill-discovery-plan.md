---
type: plan
status: completed
date: 2026-08-13
title: cursor-user-skill-discovery
origin: docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md
originFingerprint: 2026-08-13-cursor-user-skill-discovery
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Cursor User-Level AE Skill Discovery

> **For agentic workers:** Execute U1-U3 in this repository. Prefer TDD in `tests/global-install.test.mjs` before installer changes. Do not restore `.agents/skills` in the distribution source. Do not write `~/.cursor/skills-cursor`. One commit after verification, then push, as requested by the current-user instruction.

**Goal:** One current-user global apply leaves Codex on the personal marketplace plugin and Cursor on confined `~/.cursor/skills/ae-*` links to that plugin's skills.

**Architecture:** Extend `userPaths`, preview classification, `--retire-modified` preflight, apply, and rollback. After personal plugin activation and before Codex CLI registration, create Windows junctions or POSIX directory symlinks from `$HOME/.cursor/skills/<name>` to `$HOME/plugins/ai-agent-engine-codex/skills/<name>`. Deleting those entries must never recurse into the plugin tree.

**Tech Stack:** Node.js ESM, `node:fs` `symlinkSync(..., 'junction'|'dir')`, existing global-install journal/backup transaction, Node test runner.

## Source

- Requirements: `docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md`
- Design: `docs/ae/designs/cursor-user-skill-discovery-2026-08-13/design.md`
- Governing rules: `AGENTS.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

Add a Cursor-only user skill discovery surface to the existing global installer. Codex discovery stays `ai-agent-engine-codex@personal`. Skill payloads are not copied into `~/.cursor/skills`.

## Global Constraints

- Never modify Codex or Cursor private caches.
- Never write `$HOME/.cursor/skills-cursor`.
- Never recreate `$HOME/.agents/skills/ae-*` as an installer-owned discovery tree.
- Never restore the distribution-source `.agents/skills` mirror.
- `preview` remains read-only. `apply` still requires `--apply`, operation id, and confirmation digest.
- Plugin source trees still reject embedded symbolic links; Cursor skill entries are the only installer-created links and must resolve inside the personal plugin skill directory.
- Removing a Cursor link must unlink the link node only; recursive delete through a junction is forbidden.
- Isolated-home tests prove the filesystem surface. Slash-palette refresh requires a new Cursor chat and is not claimed by file checks.

## Alternatives

| Approach | Fit | Risk | Decision |
| --- | --- | --- | --- |
| Copy skills into `~/.cursor/skills` | Simple fingerprints | Third hashed tree; rejected by user | Rejected |
| Restore `$HOME/.agents/skills` | Shared path | Codex duplicate discovery | Rejected |
| Cursor marketplace plugin | Native plugin UI | Second plugin format | Out of scope |
| Junction/symlink to personal plugin skills | Official Cursor user skill root, no extra copy | Link deletion must not follow the target | Chosen |

## Decision Drivers

1. Cursor must see `/ae-*` after one global apply on this machine.
2. Codex must not gain a second AE skill tree.
3. Unrelated personal Cursor skills must survive apply and rollback.

## Pre-Mortem

- Recursive `rmSync` on a junction deletes personal plugin files: deletion helpers must `lstat`/`readlink` first and unlink the node only.
- A content copy or wrong-target `ae-*` is overwritten silently: preflight uses the existing `--retire-modified` gate.
- Codex CLI fails after links are created: rollback unlinks new entries and restores journaled prior Cursor `ae-*` state.

## Validation Evidence

| Requirement | Tier | Signal | Owner | Status | Recovery signal |
| --- | --- | --- | --- | --- | --- |
| R2, R3 | focused integration | isolated-home apply: each `ae-*` `realpath` equals personal plugin skill dir | implementer | unverified | revert installer unit |
| R5, R6 | focused integration | foreign skill hash unchanged; modified `ae-*` blocks without `--retire-modified` | implementer | unverified | no home mutation on block |
| R7 | focused integration | `--fail-at publish-cursor-skills` and Codex CLI failure restore prior Cursor state | implementer | unverified | journal/backup retained |
| R1, R4, NFR1-NFR4 | focused integration + docs | preview classifies Cursor surface; no `~/.agents/skills/ae-*`; no `skills-cursor` writes; smoke exposes `cursorSkillsRoot` | implementer | unverified | docs must not claim slash UI without a fresh thread |
| live slash palette | current-user operations | new Cursor chat lists `/ae-*`; `codex plugin list` still shows personal plugin | current user | unverified | reopen client session |

## Implementation Units

### U1 - Contract paths, link inspection, and confined link helpers

- Requirements covered: R3, R4, NFR1, NFR3.
- Acceptance criteria covered: `userPaths` exposes Cursor roots; inspection distinguishes owned links from copies/wrong targets; helpers refuse escaping targets.
- Depends on: none.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/global-install-contract.mjs`
  - `tests/global-install.test.mjs`
- Forbidden files:
  - `.codex/**`
  - `~/.cursor/skills-cursor/**`
  - real consumer projects
- Layer ownership: Distribution, Guardrail.
- Validation: unit assertions on path construction, `realpath`, and escape rejection in an isolated temp home.
- Rollback signals: a helper follows a link into plugin content during delete.
- Deferred implementation notes: none.

Interfaces this unit produces:

- `userPaths(home).cursorSkillsRoot` = `$HOME/.cursor/skills`
- `userPaths(home).cursorReservedSkillsRoot` = `$HOME/.cursor/skills-cursor`
- `expectedCursorSkillTarget(personalPluginRoot, skillName)` = guarded `skills/<skillName>` under the personal plugin
- `cursorLinkType()` = `'junction'` on win32, `'dir'` otherwise
- `inspectCursorSkillEntry(path)` returns `{ kind: 'missing'|'link'|'directory', target?: string, fingerprint?: { sha256, kind } }`
- `isOwnedCursorSkillLink(entry, expectedTarget)` is true only when `kind === 'link'` and resolved `target` equals `expectedTarget`
- `assertCursorLinkTargetAllowed(paths, target)` throws if the target is not inside `personalPluginRoot/skills`

### U2 - Preview classification, apply publication, and rollback

- Requirements covered: R1, R2, R3, R4, R5, R6, R7, NFR2, NFR3.
- Acceptance criteria covered: apply publishes owned links after personal plugin activation and before Codex CLI registration; modified/unknown `ae-*` block; rollback never recursively deletes through a link.
- Depends on: U1.
- Files:
  - `plugins/ai-agent-engine-codex/scripts/global-install.mjs`
  - `tests/global-install.test.mjs`
- Forbidden files:
  - `.codex/**`
  - `~/.cursor/skills-cursor/**`
  - `.ae-source/skills/**` except existing mirror checks
- Layer ownership: Distribution, Guardrail.
- Validation: `node --test tests/global-install.test.mjs` covering TC-001 through TC-006.
- Rollback signals: injected `publish-cursor-skills` failure or Codex runner failure leaves prior Cursor `ae-*` state.
- Deferred implementation notes: live Cursor palette is U3 documentation only.

Apply sequence insertion:

1. `activate-global-runtime` (existing; personal plugin files now exist)
2. `publish-cursor-skills` (new)
3. `register-codex-plugin` (existing)

`publish-cursor-skills` behavior:

- `mkdir` `$HOME/.cursor/skills` if missing; do not delete that directory on rollback if it contains foreign skills.
- For each existing `ae-*` under the Cursor skill root: owned current-release link may be replaced in place; unknown/modified entries must already have been rejected or authorized with `--retire-modified` and backed up; retired names that are installer-owned are unlinked.
- For each current-release skill: `symlinkSync(expectedTarget, dest, cursorLinkType())`.
- Record changes so rollback unlinks created nodes and restores backed-up copies or prior link targets.
- Do not recreate `$HOME/.agents/skills`.

Confirmation digest must include Cursor skill classification plus `--retire-modified`, so apply fails if Cursor `ae-*` state changed after preview.

Preflight must also keep `cursorSkillsRoot` inside the current user home when it exists, and must not require that directory to exist before apply.

### U3 - Documentation, smoke, and release metadata

- Requirements covered: R1, NFR4.
- Acceptance criteria covered: docs name both discovery surfaces and the fresh-thread boundary; smoke asserts `cursorSkillsRoot`; version is 0.3.29.
- Depends on: U1, U2.
- Files:
  - `docs/ae/references/global-ae-install-contract.md`
  - `README.md`
  - `README.en.md`
  - `CHANGELOG.md`
  - `CHANGELOG.en.md`
  - `INSTALL.md`
  - `INSTALL.zh-CN.md`
  - `docs/08-ai-memory/04-known-pitfalls.md`
  - `scripts/check-global-install-smoke.mjs`
  - `package.json`
  - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
  - `docs/ae/prds/2026-08-13-cursor-user-skill-discovery-prd.md`
  - `docs/ae/designs/cursor-user-skill-discovery-2026-08-13/design.md`
- Forbidden files:
  - real consumer projects
  - Cursor or Codex private caches
- Layer ownership: Distribution, Knowledge, Guardrail.
- Validation: `npm test`, `npm run check`, `npm run check:smoke`, `node scripts/check-release-notes.mjs`.
- Rollback signals: release-note mapping fails or docs claim Cursor slash UI without a new chat.
- Deferred implementation notes: Git commit and push happen after those commands pass.

## Test Cases

Focused tests live in `tests/global-install.test.mjs` and reuse the isolated-home + fake Codex runner pattern.

- TC-001: after apply, every current `ae-*` under `cursorSkillsRoot` is a link whose `realpath` equals `join(home, 'plugins', 'ai-agent-engine-codex', 'skills', name)`.
- TC-002: `~/.cursor/skills/other-skill/SKILL.md` hash is unchanged.
- TC-003: a content-directory `ae-help` under Cursor skills blocks apply without `--retire-modified`.
- TC-004: `--fail-at publish-cursor-skills` and a failing Codex runner both restore prior Cursor `ae-*` state and do not leave a new personal plugin behind on Codex failure.
- TC-005: preview JSON includes `cursorSkillsRoot` and per-skill classification; preview writes nothing.
- TC-006: apply does not create `$HOME/.agents/skills/ae-*` and does not change `$HOME/.cursor/skills-cursor`.

## Plan Self-Review

- Requirements mapped: R1-R7 and NFR1-NFR4 are covered by U1-U3.
- No Cursor marketplace plugin, no `.agents/skills` restoration, and no cache writes are in scope.
- Link deletion safety is an explicit unit constraint because junction follow-through is the highest-severity failure mode.
