---
type: prd
status: completed
date: 2026-08-30
topic: frontend-taste-governance
format: human-readable-requirements
sharded: false
---

# 前端设计质感与外部技能治理需求

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

当前 AE 前端链路能稳定路由实现、覆盖交互状态并执行浏览器验收，但设计方向主要隐含在用户描述和模型判断中，无法从设计阶段稳定传递到实现、审查与浏览器验证。外部 Taste Skill 与 Impeccable 提供了可借鉴的设计判断和精修方法；当前 watch 又只能按仓库 HEAD 粗粒度判断 stale，无法区分真正受影响的已映射技能。

目标是在不新增重复 skill、不引入外部运行时、不复制外部大段提示词或检测器的前提下，让现有前端链路形成“设计意图 -> 实现 -> 精修 -> 有效视觉证据”的闭环，并让外部跟踪结果只在有路径证据时声称具体 skill 受影响。

## Requirements

**设计意图**

- R1. 前端设计工作必须在实现前形成一个紧凑的设计方向判断，至少覆盖表面类型、目标用户/主任务、现有视觉基线或品牌资产、层级、排版、色彩、密度、表现力、动效目的和显式禁区。  
  Acceptance: `ae-design` 的 UI 设计工件或 `ae-frontend-design` 的轻量实现路径能产生同一字段集合；缺失字段被标记为 inferred/assumed，而不是静默默认。
- R2. 设计方向必须以现有项目、用户提供的设计输入和目标用户为最高优先级，不得用固定审美配方覆盖 operational UI、公共服务、受监管或可访问性优先场景。  
  Acceptance: guidance 明确 existing baseline > supplied design input > contextual inference > generic defaults，并包含 operational/regulated 反例。
- R3. 表现力、动效和密度可以作为校准轴，但不得把硬编码默认数值或单一风格当作通用专业标准。  
  Acceptance: reference 使用上下文等级或项目 token，并说明任何轴都可被 existing design system 覆盖。

**精修与验证**

- R4. 现有前端入口必须支持少量可组合的精修模式，覆盖视觉审计、层级/排版/布局/色彩精修、bolder/quieter/distill 类方向调整、harden/adapt/optimize 类生产修复，并映射到现有 owning skill。  
  Acceptance: 一份路由表将精修意图映射到 `ae-frontend-design`、`ae-web-app`、`ae-review`、`ae-test-browser`；不新增 23 个技能。
- R5. 视觉验收证据必须先通过有效性门禁：页面非空、资源已加载或失败被记录、目标完整入镜、无关键遮挡/溢出；截图失败、缺失或用户提供视觉反例时必须重新执行相关复核。  
  Acceptance: browser acceptance reference 和对应回归断言包含证据有效性、重拍/重跑与 unverified 规则。
- R6. 设计质量评审必须区分上下文违约与个人审美偏好，只报告有目标、基线、可访问性、响应式或一致性证据的 finding。  
  Acceptance: frontend review lens 要求每个视觉 finding 指向 design input/UI Direction Contract/现有 token/浏览器证据之一，并抑制无证据风格建议。
- R7. 新的设计判断 guidance 必须有最小场景回放，至少覆盖营销页、密集 operational UI、保留式重设计和移动端响应式四类输入。  
  Acceptance: 场景卡记录输入、预期设计方向、不得触发的通用偏好和验证信号。

**外部跟踪治理**

- R8. Taste Skill 与 Impeccable 必须以来源、许可证、观测提交/发布、 inspected paths 和适配边界登记为外部研究源；跟踪不得自动安装、复制或改写 skill。  
  Acceptance: watch/reference 记录包含 provenance 和 adopted/rejected/watch 分类；Impeccable 明确禁止复制 Apache-2.0 源码到 GPL-2.0-only 分发物。
- R9. `skill-audit --watch` 只有在 changed-path 证据与 adopted mapping 的 `upstreamPaths` 匹配时才能填充 `affectedSkills`；仅 HEAD 不同必须输出候选或 unverified impact。  
  Acceptance: focused tests 覆盖 current、stale-without-path-evidence、stale-with-matching-path 和 stale-with-unrelated-path 四种情况。
- R10. `jiangqiang1996/ai-agent-engine` 必须作为 `primary-upstream` 进入机器可复检 watch，并把主上游能力域/路径映射与 Taste、Impeccable、mattpocock 等补充研究源区分。  
  Acceptance: watch 输出能识别 source role；主上游记录包含 `master/HEAD`、GPL-3.0-or-later、能力域、adopted/rejected/watch 和路径映射，stale 仍不自动同步。
- R11. 主上游新增的可运行静态规格只能作为可选 design input/evidence，不得替代当前 PRD、security、concurrency、non-functional 或 validation contracts。  
  Acceptance: frontend/design guidance 允许引用静态交互规格，并明确其证据边界；本期不新增 spec/code 双向同步 skill 或 runtime。

## Non-Functional Requirements

- NFR1. 改动必须保持 Codex-native，不要求外部 installer、hook、live server、provider registry 或 detector runtime。  
  Acceptance: 默认安装与 smoke 不新增外部运行时依赖。
- NFR2. 外部方法必须独立改写并保留来源证据；不得复制 Taste 的长 SKILL 文本、Impeccable 的 detector、scripts 或 provider payload。  
  Acceptance: review 的 license-provenance lane 无阻断 finding。
- NFR3. 可分发变更必须保持 plugin source、`.ae-source/skills` mirror、language metadata、help/catalog、版本与发布说明一致。  
  Acceptance:相关 contract、test、smoke 与 release-note checks 通过。

## Must-Haves

- Requirement ID: R1
  Must-have completion condition: 设计方向字段能从设计或轻量实现入口传递到 review/browser evidence。
- Requirement ID: R5
  Must-have completion condition: 空白、裁切、资源失败或关键遮挡的截图不能被当成视觉验收通过。
- Requirement ID: R9
  Must-have completion condition: 仓库 HEAD 变化本身不再被表述为所有 adopted skill 已受影响。

## Success Criteria

- 相同 brief 在设计、实现、review 和浏览器验收阶段使用同一设计方向语言。
- 前端 guidance 减少模板化默认输出，同时不把营销页规则误用到 dashboard 或 operational UI。
- 外部更新能指出“源变了但 adopted paths 未变”或“具体映射受影响”，而不是全量误报。
- 不增加新的顶层设计 skill、外部运行时或大体量数据包。

## Scope Boundary

### In Scope

- `ae-frontend-design`、`ae-web-forge`、`ae-design`、`ae-review`、`ae-test-browser` 的 guidance/reference 协同。
- 可选的 `ae-imagegen-prompt` comp-first handoff 说明，不改变其 prompt-only 边界。
- 前端质量契约 map 和最小场景回放。
- Taste/Impeccable watch provenance 与 `skill-audit --watch` 路径级影响语义。
- Gitee AE 主上游的 source-role、能力域和路径级 watch 记录。

### Out Of Scope

- 安装或 vendor Taste Skill、Impeccable、其 CLI、hooks、live mode 或 detector。
- 新建 `ae-design-taste`、23 个精修 skill 或外部 provider adapter。
- 把审美质量压缩成统一分数或像素级验收所有 UI。
- 本期吸收 `mattpocock/skills` 的实验性 `retro` skill。
- 移植主上游 `ae:spec-html`、OpenCode agents、OCR delegate runtime 或安装代码。
- 自动生成或发布前端页面。

### Constraints

- 复用当前 Q1-Q4 路由和现有前端质量三表面，不建立并行工作流。
- 文档/脚本使用 UTF-8；保持用户工作和历史工件不变。
- plugin 内容变更按仓库 SemVer 与四份发布说明规则交付。

## Validation Evidence

| Boundary | Tier | Expected signal | Status |
| --- | --- | --- | --- |
| External source freshness | external-service observation | full commit/release and inspected paths recorded, or explicit unavailable | Gitee passed direct `git ls-remote`/shallow comparison; GitHub refs used page/API extraction because direct git timed out |
| Skill/source contracts | static inspection | mirror, metadata, links and design contract checks pass | planned |
| Watch path impact | focused automated test | four freshness/path cases return bounded semantics | planned |
| Design guidance behavior | manual replay | four scenario cards produce context-appropriate direction and exclusions | unverified until implementation |
| Browser visual evidence | browser acceptance | valid desktop/mobile evidence on a runnable fixture | unverified until implementation |

## Perspective Collision

- Critic: anti-slop 规则容易成为新的模板和风格偏见。
- Pragmatist: 最小可行改动是共享方向契约、精修路由和证据门禁，不是复制规则库。
- Innovator: comp-first 和多方向探索能提升视觉上限，但只应在视觉探索价值高且图像能力可用时启用。
- Systems: 任何新设计规则都必须有 mirror、review、browser evidence 和 release gate。

Collision insight：以 brief 和现有系统驱动校准轴，能同时获得反默认偏差与项目一致性；绝对禁令只保留给可访问性、安全、布局稳定性等可验证边界。

Blind spot：本期没有真实目标项目 A/B 结果，不能声称设计质量已提升，只能先证明流程和证据契约更完整。

Thinking preservation zone：品牌气质、视觉大胆程度和最终审美认可保留给用户/设计负责人。

## Key Decisions

- D1. 改进现有前端技能，不创建新的 Taste/Impeccable AE skill。  
  Reason: 现有入口完整，新增 skill 会造成触发和所有权重叠。
- D2. 使用上下文驱动的方向字段和精修模式，不复制外部默认值、长提示词或规则库。  
  Reason: 避免把一种模板替换为另一种模板，并控制许可证边界。
- D3. detector 延后到出现真实重复缺陷和本地误报语料之后。  
  Reason: Impeccable 的维护历史证明路径、CSS 解析和 false positive 成本不可忽略。
- D4. watch 的 `affectedSkills` 必须由路径证据支持。  
  Reason: 当前 mattpocock 的 3 个新提交证明仓库变化不等于 adopted skill 变化。
- D5. Gitee AE 是主上游，其他外部源是补充研究输入。  
  Reason: package/README/catalog 已声明这一能力模型来源；跟踪治理必须反映该优先级。
- D6. 可运行静态规格先作为证据类型适配，不创建同步入口。  
  Reason: 该模式有价值，但上游范围排除安全/NFR 且依赖 OpenCode 调度，直接移植会削弱当前设计契约。

## Dependencies And Assumptions

### Dependencies

- 当前 `ae-web-forge` Q1-Q4 路由、`frontend-quality-contract-map.md` 和 source/mirror 检查保持有效。
- 实施时能更新相关 source/mirror、tests 和 release notes。

### Assumptions

- Taste 的 MIT 方法可独立改写；不复制其 87KB SKILL 文本。
- Impeccable 的 Apache-2.0 源码不进入 GPL-2.0-only 分发物；只使用通用思想和公开行为作为研究输入。
- Gitee AE 的 GPL-3.0-or-later 源码/提示词不进入 GPL-2.0-only 分发物；只独立表达方法。
- 手工场景回放只能证明 guidance 可解释，不能证明真实用户对视觉质量满意。

## Open Questions

### Deferred To Planning

- Q1. [Affects R4][technical] 精修模式放在一个共享 reference，还是分别写入各 owning skill。
- Q2. [Affects R9][technical] changed-path 证据通过 CLI 参数输入，还是只由人工审计后更新 watch 记录。

## Evidence Notes

- 当前前端路由和质量边界 -> Evidence: `ae-web-forge/SKILL.md`, `ae-frontend-design/SKILL.md`, `web-ui-quality.md`, `browser-acceptance.md`。
- Taste 方法与许可证 -> Evidence: GitHub README、MIT LICENSE、HEAD `ccbc15639c97057cbfcf32ecebc38ef716e4bb37`、core SKILL blob `b72132f...`。
- Impeccable 方法、发布与许可证 -> Evidence: GitHub README/release/Licence、HEAD `b0594c72d18006b5865c70eb3a97e8b04064e600`、skill-v4.1.2 `63b04e2530f5c7b41ea83c133daab24f34912456`。
- mattpocock 路径影响 -> Evidence: compare `5b15a47...6654f6b`，ahead 3，only `skills/in-progress/retro` and README。
- 主上游 freshness 与差异 -> Evidence: `git ls-remote` 返回 `8ef17fbc...`；临时浅克隆比较 `c4e5c14...8ef17fb` 得到 13 commits / 58 files；新能力集中于 spec-html、OCR delegate、install/path runtime。

## Consistency Check

- requirementsCount: 11
- nonFunctionalRequirementsCount: 3
- decisionsCount: 6
- openQuestionsCount: 2
