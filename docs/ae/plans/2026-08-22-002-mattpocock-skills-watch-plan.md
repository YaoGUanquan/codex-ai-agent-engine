---
type: plan
status: drafted
date: 2026-08-22
title: mattpocock-skills-watch
origin: docs/ae/prds/2026-08-22-mattpocock-skills-watch-prd.md
originFingerprint: 2026-08-22-mattpocock-skills-watch
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: mattpocock/skills 长期跟踪与已改技能回归

## Source

`docs/ae/prds/2026-08-22-mattpocock-skills-watch-prd.md`

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Scope

把 `https://github.com/mattpocock/skills` 登记为可复检跟踪源，扩展现有 `skill-audit` 做 freshness 复检，锁定本轮已改 skill 的新增逻辑，并对同一命令集合连续跑 3 轮。不 vendor 上游，不自动改写 skill。

## Readiness

- Goal: 维护者能从记忆索引走到跟踪映射，并能在上游更新时得到候选优化清单；已改 skill 有 3 轮回归证据。
- Acceptance criteria: PRD R1-R7, NFR1-NFR3, D1-D3.
- Non-goals: vendor/installer、自动改写、40 个 skill 再改写、外部 tracker、运行时效果证明。
- Affected areas: `skill-audit` 命令、`docs/ae/references` 跟踪清单、`docs/08-ai-memory`、已改 skill 的回归测试、本地 issue、未发布插件版本记录。
- Validation surface: focused node:test, `skill-audit --watch`, full `skill-audit`, `npm test` x3, `npm run check`, memory contract, release-notes if version changes.
- Open questions: Q1 and Q2 resolved below.

## Validation Evidence

| Acceptance | Tier | Expected signal | Preconditions | Status | Recovery |
| --- | --- | --- | --- | --- | --- |
| R1/R2 watch record | static inspection | watchlist JSON + memory + registry relations pass memory contract | files exist | planned | revert the three files together |
| R3/R4 freshness | focused test + optional live `git ls-remote` | command reports `current`/`stale`/`unavailable` and never writes skills | fixture watchlist in temp worktree | planned | keep live network failure as `unavailable` |
| R5 guidance lock | focused test | source/mirror match adopted phrases | existing uncommitted skill text | planned | do not rewrite skill text unless a test names a real gap |
| R6 three runs | process ledger | same command set recorded 3 times | local Node test harness | planned | keep the first failing output |
| R7 portfolio audit | `skill-audit` | 40/40 coverage and named results for the six changed skills | plugin skills present | planned | treat P2 verification gaps as defer, not silent pass |
| Runtime skill effect | runtime | not claimed | n/a | unverified by design | none |

## Assumptions

- 工作区已有 0.3.33 未提交变更；本计划只追加跟踪、复检、测试和必要的命令扩展，不回退这些文件。
- 已改 skill 文本已经存在；U3 是锁定测试，不是再写一遍指导语。TDD 红灯只强制用在 U2 的 `--watch` 行为。
- 实现时必须重新读取上游 LICENSE 和 `git ls-remote`；审查时的提交不得直接当作当前事实。

## Alternatives Considered

| Approach | Fit | Trade-off | Decision |
| --- | --- | --- | --- |
| 只写一篇 memory 笔记 | 快，但下次复检仍靠聊天记忆 | 没有钉提交和命令契约 | Reject |
| 新 `skill-watch` 命令 + 独立模块 | 职责清晰，但新增抽象和 help/smoke 面 | 与“不轻易新增抽象”冲突 | Reject |
| 在现有 `skill-audit` 增加 `--watch`，清单放 `docs/ae/references` | 复用 provenance 字段、dispatch、catalog | 命令多一个只读模式 | Choose |
| 定时拉取并自动改 skill | 表面上“跟着更新” | 违反 D2，且无法审计 | Reject |

## Decision Records

- Q1: 扩展 `skill-audit --watch`，不新建命令。Drivers: 现有 dispatch/help/smoke 已认识 `skill-audit`；复检与审计同属 provenance。Consequence: `--watch` 只读，默认本地 audit 行为不变。
- Q2: 机器清单放 `docs/ae/references/external-skill-watchlist.json`。Drivers: registry 关系只能指向 `docs/ae`；references 已有治理契约。Consequence: 记忆文件解释，JSON 是复检输入。

## High-Risk Pre-Mortem

1. 把审查时的提交写成权威当前值。Signal: watchlist commit 与实现时 `git ls-remote` 不一致且未标 `stale`/`rechecked`。Recovery: 重测后更新 pinned 字段，保留旧值到 `lastRechecked`。
2. `--watch` 在网络失败时返回 `current`。Signal: 测试或实跑没有 `unavailable`。Recovery: 默认本地比较 pinned 与显式 `--remote-commit`；live fetch 失败必须降级。
3. 回归测试改写已有 skill 文本只为“更像上游”。Signal: debug/tdd/review 出现与需求无关的大段重写。Recovery: 还原 skill 文本，只补测试或跟踪映射。

## Implementation Units

### U1 - 跟踪清单与长期记忆

- Covers: R1, R2, NFR2, D1
- Depends on: none
- Ownership: `docs/ae/references/external-skill-watchlist.json`, `docs/08-ai-memory/16-mattpocock-skills-watch.md`, `docs/08-ai-memory/00-index.md`, `docs/08-ai-memory/00-registry.json`, optional one-line pointers in `docs/08-ai-memory/03-key-workflows.md` and `docs/08-ai-memory/05-decision-log.md` only if they stay inside the 15KB budget.
- Work: After a live LICENSE read and `git ls-remote`, write one watch source for `mattpocock/skills` with `sourceUrl`, `license`, `pinnedCommit`, `freshnessMethod`, `checkedAt`, adopted/rejected/watch mappings. Adopted rows must name AE skill, local evidence phrase, and upstream method. Register the memory document and relations to this PRD, this plan, and the watchlist.
- Forbidden files: plugin skill bodies, lockfiles, user home, vendored clones.
- Validation: `node scripts/check-memory-knowledge-contract.mjs --root .`; `node scripts/ae-tools.mjs ae-memory-query --topic mattpocock`; JSON parse of the watchlist.
- Rollback: delete the new memory file and revert index/registry/watchlist together.

### U2 - `skill-audit --watch` 复检契约

- Covers: R3, R4, NFR1, NFR3
- Depends on: U1
- Ownership: `plugins/ai-agent-engine-codex/scripts/ae-tools/skill-audit.mjs`, `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs` only if help text must mention `--watch`, `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json` and `.ae-source` mirror, `plugins/ai-agent-engine-codex/skills/ae-skill-audit/SKILL.md` and mirror if a short `--watch` rule is needed, `tests/ae-tools.test.mjs`.
- Work: TDD first. A failing test must require `--watch` to read the watchlist, compare `pinnedCommit` to an explicit `--remote-commit` or a live fetch, and return `current` / `stale` / `unavailable` plus affected AE skills. Default local `skill-audit` output stays unchanged. The command must not write skills, memory, or the watchlist. Live fetch is optional and failures become `unavailable`.
- Forbidden files: unrelated skills, issue/report modules, lockfiles.
- Validation: focused `node --test --test-name-pattern "skill-audit --watch"`; then existing `skill-audit` still returns 40/40.
- Rollback: `--watch` is additive; remove the branch and keep default audit.
- Distribution: because plugin script/catalog may change, bump unreleased `0.3.33` to `0.3.34` with synchronized manifests and README/CHANGELOG entries. If implementation can keep `--watch` documentation inside existing `skill-audit` catalog purpose text without a new command name, still bump because `skill-audit.mjs` is distributable.

### U3 - 已改 skill 锁定测试

- Covers: R5
- Depends on: none
- Ownership: `tests/skills-docs.test.mjs`, `tests/ae-tools.test.mjs` if catalog assertions need the new watch wording.
- Work: Add a characterization test in the Ponytail/OCR style that locks source/mirror phrases already present: debug red-capable loop and 3-5 hypotheses; tdd public seam/independent oracle/vertical slice; review Standards/Spec lenses; refactor deep-module/deletion test; tasks tracer-bullet and blocking edges. Do not edit skill bodies unless a test finds a real source/mirror mismatch.
- Forbidden files: skill rewrites “to look better”, new skills.
- Validation: `node --test --test-name-pattern "mattpocock-adapted" tests/skills-docs.test.mjs`
- Rollback: remove the new test only.

### U4 - 三轮回归、审计、issue 与门禁

- Covers: R6, R7, NFR3
- Depends on: U1, U2, U3
- Ownership: `docs/00-process/active/2026-08-22-mattpocock-skills-watch/progress.md`, `docs/00-process/active/2026-08-22-mattpocock-skills-watch/ledger.jsonl`, `docs/ae/issues` via issue CLI, existing `docs/ae/reports` only if regenerating the skill-audit report, version/README/CHANGELOG if U2 changed plugin files.
- Work: Run the same command set three times: focused watch tests, focused guidance tests, `node scripts/ae-tools.mjs skill-audit --out docs/ae/reports/2026-08-22-skill-audit.json` or a dated equivalent, `npm test`, and `npm run check` at least once plus two more `npm test` passes. Record each round. Create or update a local issue for future upstream rechecks, linking the PRD, plan, watchlist, and audit report. Do not close AEI-20260822-002; that issue remains the separate 40-skill semantic rewrite tracker.
- Forbidden files: unrelated user docs, Git commit/push.
- Validation: three ledger rows with identical command names; skill-audit names the six changed skills; `node scripts/check-release-notes.mjs` if version changed; `git diff --check`.
- Rollback: process notes and issue records can remain if plugin code is reverted.

## Five-Layer Ownership

| Unit | Memory | Knowledge | Guardrail | Delegation | Distribution |
| --- | --- | --- | --- | --- | --- |
| U1 | new memory + registry | watchlist mappings | no auto-write | none | none |
| U2 | none | skill-audit watch output | freshness failure codes | none | plugin script/catalog, 0.3.34 |
| U3 | none | locked phrases | source/mirror equality | none | tests only |
| U4 | issue + process ledger | audit report | 3-run evidence | none | release notes if U2 shipped |

## Claim-Evidence Notes

- “长期跟踪” means a pinned watchlist plus `--watch` recheck, not a background updater. Evidence: this plan U1/U2 and NFR1.
- “跟着继续优化” means stale output lists affected AE skills for a later authorized edit. Evidence: R3 and D2.
- Star counts or installer popularity are not claims.

## Defer List

- Watching any source other than `mattpocock/skills`.
- Automatic GitHub polling or CI scheduled fetch.
- Closing or executing AEI-20260822-002.
- Browser or live skill-invocation proof.

## Plan Self-Review

- No TBD or placeholder units.
- R1-R7 and NFR1-NFR3 each map to a unit.
- TDD is required for U2; U3 is a lock test over existing text.
- Rollback is file-scoped and does not revert the user's current 0.3.33 working tree.
- Network freshness remains `unverified` unless a live `git ls-remote` succeeds during U1/U4.
