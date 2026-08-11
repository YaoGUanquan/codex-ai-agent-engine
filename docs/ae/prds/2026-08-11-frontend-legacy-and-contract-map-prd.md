---
type: prd
status: completed
date: 2026-08-11
topic: frontend-legacy-and-contract-map
format: human-readable-requirements
sharded: false
---

# 前端旧栈对照条目与质量契约映射说明（路线图第 7、10 条提前收尾）

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

治理批次四把 README 路线图第 7 条（旧版本前端栈适配）与第 10 条（前端质量契约交叉一致性）定案为"带触发条件的挂起"。2026-08-11 复核确认两项触发均未命中（`npm test` 125/125、前端契约文件仍为 3 份、无可归因旧栈缺陷），用户随后明确决定：不再等待触发信号，现在完成两条。第 7 条的处方动作是为受影响框架补最小对照条目（插件内容变更，须升版本）；第 10 条的处方动作是"先做轻量映射说明而非校验脚本"。

## Requirements

- R1. 旧栈最小对照节：`ae-web-app/references/` 下 `svelte-guidance.md` 补 Svelte 4（stores 与 `$:` 反应语句）对照节、`angular-guidance.md` 补 NgModule 时代对照节、`vue-guidance.md` 补 Options API 对照节。每节仅把既有 Common Defect Traps 映射到旧式语法（每框架不超过 6 条），保留文件首行 stack-conditional 语句与"匹配仓库既有风格"兜底；不改 `react-guidance.md`（第 7 条未列 React 旧栈）；不改 `ae-review` FE 镜头（其查项本就不区分框架版本）。插件与 `.agents` 镜像逐字节一致。
  Acceptance: 三份指导各含一个 `Counterparts` 对照节且既有章节未删改；`node scripts/check-skill-mirror.mjs` 通过；新增回归用例断言节标题与关键短语（先红后绿）。
- R2. 轻量映射说明：新建 `docs/ae/references/frontend-quality-contract-map.md`（维护者文档，仓库侧），登记 `web-ui-quality.md`、`ae-review` Frontend Components / Styles 镜头、`browser-acceptance.md` 之间约 5 组对应关系（逐条引用条目号）、既有测试锁（`tests/skills-docs.test.mjs` motion 用例）与镜头无 motion 查项的空档，并声明：本映射为描述性文档，不构成第 4 份契约面，不建校验脚本。
  Acceptance: 文档存在且含 5 组映射、测试锁说明、边界声明；`node scripts/check-ae-artifacts.mjs` 通过。
- R3. 版本与发布记录：根 `package.json` 与插件 manifest 同步递增至 0.3.26；README.md、README.en.md、CHANGELOG.md、CHANGELOG.en.md 各追加 0.3.26 条目（摘要 + 验证命令 + 证明边界）；README 版本窗口维持 5 条（0.3.21 条目移出 README，CHANGELOG 已含全部历史）。
  Acceptance: `node scripts/check-release-notes.mjs` 通过。
- R4. 路线图与决策收尾：README 双语路线图第 7、10 条划线并改写为完成摘要；本日早间加入的"挂起项复核"引导句改写为收尾表述；`docs/08-ai-memory/05-decision-log.md` 追加"用户决定提前完成"条目（记录对批次四 defer 姿态的覆盖与新的 Re-evaluate 条件，不改写历史条目）；`docs/08-ai-memory/00-registry.json` 追加 decision-log 至本批 PRD 与映射说明的两条关系。
  Acceptance: `node scripts/check-memory-knowledge-contract.mjs --root .` 通过；README 不再含"触发命中前无主动待办"的过期表述。
- R5. 批次工件：PRD（本文件）、计划、经验笔记、归档 summary 按批次惯例产出。
  Acceptance: `node scripts/check-ae-artifacts.mjs` 通过。

## Non-Functional Requirements

- NFR1. `npm run check`、`npm test`、`npm run check:smoke` 全绿后才可交付。
- NFR2. 全部新文件与改写为 UTF-8 无 BOM；中文文本不经由不安全的控制台重定向写入。
- NFR3. 对照节保持最小：不复制现代基线内容，不新增与既有 trap 无对应的检查项；对 API 可用性只作"仓库未采用则沿用旧式写法"的相对表述，唯一允许的绝对断言是 runes 在 Svelte 4 不存在。

## Success Criteria

- 旧栈仓库（Svelte 4 stores / NgModule / Options API）命中指导文件时能直接读到对照条目而不再仅靠兜底句；三份契约文件的对应关系首次有可查的映射文档；路线图 11 条全部为完成态。

## Scope Boundary

### In Scope
- R1-R5、NFR1-NFR3。

### Out Of Scope
- `react-guidance.md` 旧栈（class components）对照；第 7 条未列入。
- `ae-review` FE 镜头与 `browser-acceptance.md`、`web-ui-quality.md` 的内容变更。
- 契约映射的校验脚本或 contract 检查（决策维持"描述性映射"）。
- Git commit/push（按用户显式指令执行）。

### Constraints
- 插件内容变更须双 SemVer 同步与四文件版本条目（AGENTS.md 插件分发版本规则）。
- 镜像一致性由 `check-skill-mirror` 与既有测试共同锁定。

## Validation Evidence (Conditional)

- 本批证据层级为静态检查、单元测试与安装烟测（`npm run check`、`npm test`、`npm run check:smoke`）；`unverified`：真实旧栈目标项目的运行时验收（当前无此类项目可用，原触发信号即来源于此类项目的缺陷报告）。

## Key Decisions

- D1. 提前完成为用户显式决定（2026-08-11），覆盖批次四"等触发"姿态；决策日志以追加条目记录覆盖，不改写批次四历史条目。
- D2. 对照节与现代基线同文件并存，不建独立 legacy 文件；沿用四段式结构，把对照节放在 Common Defect Traps 之后。
- D3. 映射说明落在 `docs/ae/references/`（仓库侧维护者文档）而非插件内容，避免映射本身成为"第 4 份契约面"。
- D4. 仍不建校验脚本：motion 维已有测试锁；本批新增测试只锁对照节存在性与关键短语，不锁映射文档内容。

## Dependencies And Assumptions

### Dependencies
- 0.3.25 已提交（`d564fa6`）且工作区干净（`75dbe37` 之后）。

### Assumptions
- "受影响框架"在无缺陷报告场景下取第 7 条点名的全部三个旧栈（Svelte 4 stores、NgModule、Options API）。
- 映射组数以批次四 PRD R4 的盘点为基线（约 5 组），以三份文件现行文本为准逐条核对。

## Open Questions

### Must Resolve Before Planning
（无）

### Deferred To Planning
（无）

## Evidence Notes

- 触发复核证据 -> 本日会话：`npm test` 125/125；`reduced-motion` 关键词仅命中 `ae-frontend-design`、`ae-test-browser` 两技能（SKILL 与 reference）；FE 镜头位于 `code-review-rule-profiles.md` 第 49 行起。
- 对应关系落点 -> `web-ui-quality.md` 第 4/7/8/9/10/12-15 项；FE 镜头 6 查项；`browser-acceptance.md` 第 3/5/6/7 项与 Material Motion Evidence 节。
- 测试锁现状 -> `tests/skills-docs.test.mjs` 831-868 行（motion 治理用例）锁定 quality/acceptance 关键词与镜像一致；1079-1148 行（后端指导用例）为对照节回归用例的结构模板。
- 版本窗口现状 -> README 双语版本节各 5 条（0.3.25→0.3.21）；CHANGELOG 双语为 0.3.7 起完整历史，0.3.21 条目已在其中，移出 README 不需回填。

## Consistency Check

- requirementsCount: 5
- nonFunctionalRequirementsCount: 3
- decisionsCount: 4
- openQuestionsCount: 0
