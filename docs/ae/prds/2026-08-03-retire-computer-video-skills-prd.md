---
type: prd
status: completed
date: 2026-08-03
topic: retire-computer-video-skills
format: human-readable-requirements
sharded: false
---

# Retire Computer Use And Video Editing Skills

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The current Codex plugin exposes `ae-computer-use-guard` and `ae-video-edit-computer`, but the user has requested that both attached skills be removed. Removal must cover both the distributable plugin source and the project-local mirror, while leaving historical records intact and preventing broken active references. The upstream Gitee repository was also checked for optimization opportunities; its latest changes are OpenCode-runtime-specific and provide only bounded process ideas for this Codex project.

## Requirements

**Upstream evidence and boundary**

- R1. Preserve a source-freshness record for `https://gitee.com/jiangqiang1996/ai-agent-engine` and classify reusable upstream ideas without copying OpenCode runtime behavior.
  Acceptance: The audit records `observedCommit: 0e58b614846bbac8fd556639e70d9363d271a812`, `refSource: master/HEAD`, the `git ls-remote` freshness command, inspected files, and explicit portable/runtime-specific classifications.

**Skill retirement**

- R2. Remove `ae-computer-use-guard` and `ae-video-edit-computer` from both canonical plugin source and `.agents/skills` mirror.
  Acceptance: Neither skill directory exists under either active root, and source/mirror checks pass.
- R3. Remove active discovery, language metadata, install-smoke, README, profile, hook-template, and cross-skill contracts that exist only for the retired skills.
  Acceptance: An active-reference search finds no retired skill name outside the retained historical/archive exclusions, and the installed package no longer advertises or validates an unowned Computer Use hook contract.
- R4. Keep `ae-imagegen-prompt` self-consistent after the retirement.
  Acceptance: Its active guidance and shared profile reference contain no dependency on either retired skill and still distinguish prompt-only generation from any separately approved GUI handoff.

**Distribution and recovery**

- R5. Keep the root package and plugin manifest SemVer synchronized for the distributable content change and retain historical documents as read-only records.
  Acceptance: Both manifests contain the same incremented SemVer, validation passes, and historical archive/old plan references are not rewritten or deleted.

## Non-Functional Requirements

- NFR1. Preserve unrelated user-owned files and avoid new dependencies or runtime behavior.
  Acceptance: `docs/ae/security-scans/` remains untouched, and the diff contains only task-owned cleanup plus AE artifacts.
- NFR2. Keep all edited text UTF-8 and retain source/mirror parity.
  Acceptance: mirror, metadata, artifact, package, install-smoke, and diff checks pass.

## Success Criteria

- The two named skills are absent from active plugin and mirror surfaces.
- Remaining skills, especially `ae-imagegen-prompt`, have no broken active dependency.
- Upstream findings remain evidence-backed and do not imply unsupported Codex runtime capabilities.
- The repository can still install, switch language metadata, and pass its normal checks.

## Scope Boundary

### In Scope

- The two skill directories in plugin source and `.agents/skills`.
- Active metadata, README/catalog, install-smoke, profile, hook-template, and image-generation references.
- A focused PRD, implementation plan, and review record.
- Synchronized package/plugin version increment and relevant validation.

### Out Of Scope

- Historical archives, AI memory, and the June computer-use plans.
- Copying upstream OpenCode commands, hooks, MCP tools, agents, or runtime registration.
- Implementing the upstream API-test or review-tool ideas in this task.

### Constraints

- Canonical plugin source and `.agents/skills` mirror remain authoritative and synchronized.
- No commit, push, dependency installation, or destructive Git reset is included.
- Repository-relative paths and UTF-8 documents are required.

## Validation Evidence (Conditional)

- Static inspection: active-reference search and directory existence checks prove the retirement boundary only.
- Focused automated test: `npm test` proves existing script/test behavior under the local fixtures.
- Integration/package: mirror, language metadata, skill contract, artifact, install-smoke, `npm run check`, and `git diff --check` prove local distribution consistency.
- Runtime/browser/deployment: not applicable; no running application or external service is changed.

## Key Decisions

- D1. Delete both skills from source and mirror together.
  Reason: a partial deletion would leave Codex discovery or package installation inconsistent.
- D2. Remove active references but preserve historical records.
  Reason: current behavior must not point to retired skills, while historical provenance remains useful and user-owned.
- D3. Rewrite only `ae-imagegen-prompt` dependency wording, retaining generic GUI safety language.
  Reason: image prompt generation remains active and must not inherit a dangling skill dependency.
- D4. Do not adapt the latest upstream runtime code in this change.
  Reason: the inspected upstream commit is OpenCode-specific; only portable review/API-test process ideas are candidates for a separately authorized task.

## Dependencies And Assumptions

### Dependencies

- `docs/ae/solutions/2026-08-03-external-skill-optimization-audit.md`.
- Current package, plugin manifest, metadata, install-smoke, and mirror checks.

### Assumptions

- The two skills shown in the supplied image are exactly `ae-computer-use-guard` and `ae-video-edit-computer`.
- Historical references are intentionally retained unless the user later requests archive cleanup.

## Open Questions

### Must Resolve Before Planning

- None. The user explicitly authorized removal.

### Deferred To Planning

- None.

## Evidence Notes

- Upstream freshness -> `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git HEAD refs/heads/master refs/heads/main` returned `0e58b614846bbac8fd556639e70d9363d271a812` on 2026-08-03.
- Upstream inspected files -> `src/assets/agents/testers/api-test-runner.md`, `src/assets/skills/ae-api-test/SKILL.md`, `src/assets/skills/ae-review/SKILL.md`, `src/tools/ae-review-proof.tool.ts`, `src/tools/ae-review-scope-analyze.tool.ts`, and `src/tools/ae-specialist-aggregate.tool.ts` at the observed commit.
- Local retirement inventory -> `git grep -n -I -e 'ae-computer-use-guard' -e 'ae-video-edit-computer'` with historical/archive exclusions.

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 2
- decisionsCount: 4
- openQuestionsCount: 0
