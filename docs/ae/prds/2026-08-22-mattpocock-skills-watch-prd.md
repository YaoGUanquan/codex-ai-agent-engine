---
type: prd
status: drafted
date: 2026-08-22
title: mattpocock-skills-watch
topic: mattpocock-skills-watch
origin: user-direction
originFingerprint: 2026-08-22-mattpocock-skills-long-term-watch-and-modified-skill-regression
depth: standard
format: human-readable-requirements
sharded: false
---

# mattpocock/skills 长期跟踪与已改技能回归需求

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

当前仓库已把 `https://github.com/mattpocock/skills` 中的可移植方法改写进若干 AE skills，但还没有一份可复检的长期跟踪记录。下次上游更新时，维护者无法从仓库内直接看到：上次检查的提交、已采用/已拒绝的模式、应对哪几个 AE skill 再优化。同时，本轮已改 skill 还缺少针对新增逻辑的锁定测试和多次回归证明。

期望结果：`mattpocock/skills` 成为可复检的外部跟踪源；上游发生变化时，仓库能给出候选优化清单而不是自动改写 skill；本轮已改 skill 经过多次自动化回归后，问题被记录为 finding、defer 或已修复。

## Requirements

**长期跟踪**
- R1. 仓库必须把 `https://github.com/mattpocock/skills` 登记为长期外部跟踪源，并保存上次检查的 `sourceUrl`、许可证、观测提交、检查方法和检查日期。  
  Acceptance: 一份权威跟踪记录同时包含这些字段，且人类记忆索引能指向它。
- R2. 跟踪记录必须列出已采用、已拒绝和待观察的模式，并把每个已采用模式映射到当前 AE skill 与可验证信号。  
  Acceptance: 每个 adopted 条目都有 AE 目标 skill 和一条可检查的本地证据；每个 rejected 条目都有不复制运行时或原文的理由。
- R3. 上游 `HEAD` 与已钉提交不同时，系统必须产出复检结果：是否变化、候选影响的 AE skill、以及 `adopt` / `defer` / `reject` 建议；不得自动改写 skill 或记忆。  
  Acceptance: 复检命令或等价检查能报告 `current` 或 `stale`，并在 stale 时列出受影响 skill 而不修改它们。
- R4. 复检失败不得被表述成“上游未变化”。网络不可用、短哈希无法解析、本地快照与远程不一致，都必须记为 freshness 限制。  
  Acceptance: 失败输出包含 `freshnessMethod` 或等价字段，以及 `unavailable` / `commitMismatch` / `unreachable` 之一。

**已改技能回归**
- R5. 本轮已改 skill 必须有锁定新增逻辑的回归测试：`ae-debug`、`ae-tdd`、`ae-review`、`ae-refactor`、`ae-tasks`，以及 `ae-help` 目录中新增的 `report` / `issue` / `skill-audit` 能力。  
  Acceptance: 源与镜像同时包含新增关键语句；目录项可被现有 help/catalog 检查覆盖。
- R6. 必须对上述已改 skill 及相关检查至少完整跑 3 轮，记录每轮命令、结果和差异。  
  Acceptance: 过程证据列出 3 轮相同命令集合；任一轮失败必须保留真实输出，不得用后续成功覆盖。
- R7. 静态 skill-audit 必须覆盖全部已分发 skill，并单独标出本轮已改 skill 的结果。  
  Acceptance: audit 结果包含 40 个 plugin skill 与 40 个镜像，且 `ae-debug`、`ae-tdd`、`ae-review`、`ae-refactor`、`ae-tasks`、`ae-help` 均有明确 pass / finding / defer。

## Non-Functional Requirements

- NFR1. 跟踪与复检必须保持 Codex-native 和离线可解释：默认不安装、不 vendor、不执行外部 skill 运行时。  
  Acceptance: 实现不新增对 `npx skills`、Claude plugin、hooks 或外部 tracker 的运行时依赖。
- NFR2. 外部方法只记录来源、提交、许可证和适配边界；不复制不兼容或大段原文。  
  Acceptance: 跟踪记录写明 MIT 许可证和“方法可改写、原文不整段复制”的边界。
- NFR3. 新的公开命令或能力声明必须同步到现有 help/catalog、镜像和验证命令。  
  Acceptance: 若增加可分发命令或 skill 文本，版本、README/CHANGELOG、镜像和烟测按现有发布规则同步；仅仓库文档/测试变更不强制升级版本。

## Must-Haves

- Requirement ID: R1  
  Must-have completion condition: 跟踪源、观测提交和许可证可在仓库内直接打开，不必回忆聊天记录。
- Requirement ID: R3  
  Must-have completion condition: 上游更新只会生成复检建议，不会静默改写 AE skill。
- Requirement ID: R6  
  Must-have completion condition: 已改 skill 的 3 轮回归结果被记录，失败不被后续成功抹掉。

## Success Criteria

- 维护者能从记忆索引走到跟踪记录，再走到已采用映射和复检方式。
- 复检发现上游变化时，能指出应再看哪些 AE skill，而不是重新全库搜索。
- 本轮已改 skill 的新增逻辑被测试锁住，并有 3 轮回归证据。

## Scope Boundary

### In Scope

- `mattpocock/skills` 的长期跟踪记录、记忆登记和复检契约。
- 已采用/已拒绝模式到 AE skill 的映射。
- 本轮已改 skill 的回归测试与 3 轮验证。
- 如需命令，只扩展现有 `skill-audit` 或增加同等薄命令层。
- 一个本地 issue，用于跟踪后续上游复检。

### Out Of Scope

- 再次全量改写 40 个 skill。
- 安装或 vendor `mattpocock/skills`、`npx skills`、Claude plugin、newsletter 或外部 issue tracker。
- 上游更新后自动改写 AE skill、记忆或发布版本。
- GitHub/Linear 适配器、后台 watcher、定时拉取。
- 证明每个 skill 在真实用户项目中的效果。

### Constraints

- 沿用现有 `docs/ae`、`docs/08-ai-memory`、`ae-skill-audit` 和测试模式，不另建第二套治理系统。
- 保留当前工作区已有未提交变更，不回退无关文件。
- 文本使用 UTF-8，不因控制台乱码改写文件。

## Validation Evidence

| Boundary | Tier | Expected signal | Status |
| --- | --- | --- | --- |
| External source freshness | external-service observation | `git ls-remote` 得到完整提交，或明确记录不可用 | unverified until re-checked during implementation |
| Watch record and memory | static inspection | 跟踪记录、索引、registry 关系可被现有 memory/artifact 检查读取 | planned |
| Skill guidance lock | focused test | 源/镜像同时匹配已采用关键语句 | planned |
| Repeated regression | focused + suite | 相同命令集合连续 3 轮通过或保留失败输出 | planned |
| Runtime skill effect | runtime / user outcome | 不在本期证明 | unverified by design |

## Perspective Collision

| Perspective | 观点 |
| --- | --- |
| Critic | 只写一篇记忆笔记会在下次更新时再次丢失映射；没有钉提交就不是跟踪。 |
| Pragmatist | 复用 `ae-skill-audit` 的 provenance 字段和 Ponytail/OCR 的记忆+回归测试模式，不要新建平台。 |
| Innovator | 复检应能直接说出“这个上游 skill 变了，应回头看哪个 AE skill”。 |
| Systems | 跟踪记录是研究输入；PRD/plan 仍定义意图，review/gate 仍定义证明，issue 只跟踪复检状态。 |

Collision insight：长期跟踪的价值是“可复检的映射”，不是“自动跟上上游”。自动化越强，越必须把 freshness 失败和拒绝自动改写写成一等结果。

Blind spot：星标数、newsletter 订阅量和 skills.sh 安装量都不是工程证据。

Thinking preservation zone：哪些新上游 skill 值得采用，仍需要人判断，不能被复检命令自动批准。

## Key Decisions

- D1. 把 `mattpocock/skills` 作为参考输入长期跟踪，不 vendor、不订阅其安装器。  
  Reason: 与既有外部 skill 治理一致，避免引入第二套运行时。
- D2. 上游变化只产生复检建议，不自动改写 AE skill。  
  Reason: 用户要求“后期能继续优化”，不是“自动同步”。
- D3. 本轮回归范围限于已改 skill 及其目录/审计表面，不重开 40 个 skill 的语义改写。  
  Reason: 全量语义优化已有独立 issue；本期要的是锁定和验证当前改动。

## Dependencies And Assumptions

### Dependencies

- 2026-08-22 治理批次已把可移植方法写入 `ae-debug`、`ae-tdd`、`ae-review`、`ae-refactor`、`ae-tasks`，并给 `ae-help` 增加了 `report` / `issue` / `skill-audit` 目录项。
- 现有 `ae-skill-audit` 已要求记录 `sourceUrl`、`observedCommit`、`refSource`、`inspectedFiles`。
- 现有 memory registry 只接受指向 `docs/ae` 或 `AGENTS.md` 的关系。

### Assumptions

- 2026-08-22 观测到的上游 `HEAD` 为 `5b15a47f2d7150f545fbcacbfe381787fc0230dc`；实现时必须重新 `git ls-remote` 确认。
- 上游 LICENSE 为 MIT；实现时必须再读一次 LICENSE 文本后再写入跟踪记录。
- “测试几遍”按同一命令集合连续 3 轮解释，而不是 3 套不同的手工试玩。

## Open Questions

### Deferred To Planning

- Q1. [Affects R3][technical] 复检是扩展现有 `skill-audit`，还是增加同等薄命令。
- Q2. [Affects R1][technical] 机器可读跟踪清单放在 `docs/ae/references` 还是作为 audit 输入旁路文件。

## Evidence Notes

- 上游仓库存在且 README 列出 engineering/productivity skills -> Evidence: fetched `https://raw.githubusercontent.com/mattpocock/skills/main/README.md` on 2026-08-22.
- 上游 LICENSE 为 MIT -> Evidence: fetched `https://raw.githubusercontent.com/mattpocock/skills/main/LICENSE` on 2026-08-22; must re-read at implementation.
- 上游 `main/HEAD` 曾观测为 `5b15a47f2d7150f545fbcacbfe381787fc0230dc` -> Evidence: `git ls-remote https://github.com/mattpocock/skills.git HEAD refs/heads/main` on 2026-08-22; must re-check.
- 本轮已改 skill 为 debug/tdd/review/refactor/tasks 及 help catalog -> Evidence: `git diff --stat` on plugin source and `.ae-source` mirrors.
- 已采用方法来自 diagnosing-bugs、tdd、code-review、codebase-design、to-tickets -> Evidence: current skill diffs plus upstream README skill list; claim provenance must be recorded per mapping.
- 星标或安装量不是本期证据 -> Evidence: assumption; popularity metrics are excluded.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 3
- decisionsCount: 3
- openQuestionsCount: 2
