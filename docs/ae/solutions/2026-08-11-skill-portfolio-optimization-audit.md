# 全量技能盘点与后续优化审计（2026-08-11）

## Decision

对 40 个本地 AE 技能逐一通读（SKILL.md 全量 + 关键 references + 契约校验脚本）后，技能组合整体健康：分层清晰、路由边界成文、既有治理项（brainstorm/prd 模板去重、evidence 保留期、README 版本窗口、tidy 维护）无回退。本轮新增 3 个待办与 3 个按需触发项，按「校验先行 → 内容修正 → 按需增强」排序：

- 批次 B（仓库侧，先行，不升版本）：扩展跨技能引用链接校验；补能力账本名称级一致性断言。
- 批次 A（插件内容，一次升版本打包）：统一运行时入口口径；补全 `ae-help` 工件契约表。
- 批次 C（按需触发，无主动待办）：`ae-review` lane 细则外移、`ae-refactor` 方法论 reference、主链技能场景卡回放清单。

本审计为 report-only 分析；除本文档与 README 双语路线图追加条目外，未修改任何技能、脚本或插件内容。

## 审计方法与证据边界

- 范围：`.agents/skills/` 全部 40 个技能（与 `plugins/ai-agent-engine-codex/skills/` 镜像一致，由 `scripts/check-skill-mirror.mjs` 锁定）。
- 方法：通读全部 40 份 SKILL.md；通读核心 references（`ae-lfg/references/pipeline.md`、`task-routing.md`、`ae-plan/references/validation-evidence-profile.md`、`ae-help/references/artifact-contract.md`、`ae-review/references/scope-detection.md`）；阅读 `scripts/check-skill-contract.mjs`、`plugins/ai-agent-engine-codex/scripts/check-ae-artifacts.mjs`；对疑点做 ripgrep 定量验证；对照 `docs/08-ai-memory/05-decision-log.md` 与今日四批治理记录排除已完成项。
- 边界：证据为静态检查（文件内容、行数、匹配计数），不代表任何目标项目中技能的运行时表现；行数统计含 references 与 metadata 文件。

## 技能全景（40 个，五层分组）

| 分层 | 数量 | 技能（总行数含 references） |
| --- | --- | --- |
| 工作流主链 | 10 | ae-lfg 86、ae-brainstorm 63、ae-prd 222、ae-design 190、ae-plan 270、ae-tasks 31、ae-work 172、ae-review 292、ae-constitution 55、ae-handoff 22 |
| 实现车道 | 9 | ae-backend 209、ae-frontend-design 53、ae-web-app 152、ae-web-forge 58、ae-sql 44、ae-debug 77、ae-tdd 43、ae-refactor 23、ae-task-loop 57 |
| 验证车道 | 2 | ae-test-api 127、ae-test-browser 67 |
| 独立工具 | 8 | ae-swagger-parser 26、ae-static-server 28、ae-markitdown 25、ae-imagegen-prompt 153、ae-doc-humanize 22、ae-doc-structure 23、ae-work-report 33、ae-prompt-optimize 22 |
| 元治理 | 11 | ae-help 517（主体为 capability-catalog.json 18.9KB）、ae-init 54、ae-update 24、ae-language 20、ae-skill-creator 86、ae-skill-audit 170、ae-agent-creator 29、ae-save-experience 35、ae-claude-code 74、ae-reverse-engineering 78、ae-ideate 23 |

## 健康面（本轮确认无需处理）

- 路由边界成文且互相引用一致：`ae-web-forge`（四问路由）→ `ae-frontend-design` / `ae-web-app` → `ae-test-browser`；`ae-task-loop` 开头的转出路由；`ae-lfg` 的 S1-S7 分类。
- 证据分层词汇已统一指向 `ae-plan/references/validation-evidence-profile.md` 唯一定义（0.3.23 落地，本轮复核 ae-brainstorm/ae-prd/ae-review/ae-test-api 引用一致）。
- 交接路由统一（任务内 → `docs/00-process/active/<task>/handoff.md`；跨会话独立 → `docs/ae/handoffs/`），ae-handoff 与 ae-lfg 表述一致。
- 薄技能中的多数（ae-ideate、ae-doc-humanize、ae-doc-structure、ae-prompt-optimize、ae-handoff、ae-language）职责窄、触发清晰，符合「窄触发可发现性优先」的既有决策，不建议合并。
- 需求正典目录 `docs/ae/prds` 的声明一致性已由 0.3.25 回归断言锁定。

## 发现（按严重度）

### F1【P1·一致性】双运行时入口口径不统一

- 证据：`$HOME/.agents/ai-agent-engine-codex/bin/ae.mjs` 硬编码出现在 12 个技能文件共 46 处（ae-claude-code 5、ae-init 5、ae-review 3、ae-work 3、ae-static-server 2、ae-lfg SKILL+pipeline 各 1、ae-help 1、ae-markitdown 1、ae-swagger-parser 1、shipping-workflow 1、capability-catalog.json 22）。而 `README.md` 明确「推荐使用项目级安装」，其入口是 `scripts/ae-tools.mjs`；技能文档中仅 2 处提到该项目级 wrapper（`ae-lfg/references/pipeline.md`、`ae-update/SKILL.md`）。
- 影响：仅做项目级安装的目标项目，照抄 SKILL.md 命令会得到路径不存在错误，agent 需自行猜测替换；`ae-lfg` 中「全局路径命令 + 项目 wrapper 说明」并置的表述自相矛盾。
- 方案：新增一条共享「运行时入口解析」说明（项目 `scripts/ae-tools.mjs` 优先，用户级全局 dispatcher 回退，两者 CLI 契约一致），全部命令示例统一为一种形式加一行回退说明；以 contract 测试锁定命令形式。
- 边界：改动 SKILL.md 与 catalog 属插件内容，须升版本并按规则写 README/CHANGELOG 条目。

### F2【P1·防漂移】跨技能 references 链接无校验

- 证据：`scripts/check-skill-contract.mjs` 的 `validateSkillLinks` 正则仅匹配以 `SKILL.md` 结尾的链接目标；而跨技能 references 依赖至少覆盖 8 个技能——`../ae-work/references/local-runtime-smoke-gate.md`（ae-debug、ae-tdd、ae-test-api、ae-task-loop）、`../ae-work/references/request-config-template.md`（ae-test-api）、`../ae-backend/references/api-contract-checklist.md`（ae-web-app）、`../ae-plan/references/validation-evidence-profile.md`（ae-brainstorm、ae-prd、ae-review，反引号引用）。`tests/skills-docs.test.mjs` 仅锁定手工挑选的文件子集。
- 影响：重命名或移动一个 reference 文件会静默断链，运行时 agent 找不到被引用的契约文件；0.3.22 删除 brainstorm 重复模板一类的重构未来还会发生。
- 方案：扩展 `check-skill-contract.mjs` 校验 SKILL.md 与 references 中所有相对 `.md` 链接的存在性；可选扩展到反引号引用的 `references/...`、`../ae-*/references/...` 路径；TDD 覆盖正反例。
- 边界：仓库侧脚本与测试，不升版本；建议先于 F1 落地，使后续技能文本大改在校验保护下进行。

### F3【P2·文档契约】ae-help 工件契约表滞后于实际产物族

- 证据：`ae-help/references/artifact-contract.md` 的路径表仅 10 行（Requirements、Plans、Reviews、Gates、Handoffs、Solutions、Process notes、Process archive、Topic archive、AI memory），缺以下实际在用目录：`docs/ae/designs`（ae-design 写入）、`docs/ae/tasks`（ae-tasks）、`docs/ae/evidence`（ae-review 证据、ae-test-api 的 `evidence/api/`）、`docs/ae/integrity`（ae-save-experience 路由）、`docs/ae/experience`（ae-save-experience 主落点）、`docs/ae/work-reports`（ae-work-report）、`docs/ae/constitution.md`（ae-constitution）。同时 `solutions` 与 `experience` 两目录并存实际都在用，边界未成文。
- 影响：新会话或新项目按契约表找不到七类产物的正典位置，目录选择靠各技能自述，正是 0.3.25 目录声明治理要消除的同类漂移。
- 方案：补全表格行；加一句边界说明（solutions = 外部审计与方案研究，experience = 自身完成工作的复盘）；纳入 0.3.25 已建立的目录声明回归断言。
- 边界：插件内容，升版本；体量小，与 F1 同批打包。

### F4【P2·可维护性】能力描述四份账本缺名称级一致性锁

- 证据：同一技能的能力描述分布在 SKILL.md frontmatter description、`agents/openai.yaml`（三语言）、`capability-catalog.json`、README 双语能力清单，最多 7 处文案。已有锁：mirror 检查、language-metadata 检查、catalog 部分字段断言、0.3.25 目录声明断言；缺失：README 能力清单条目 ↔ catalog 技能集合 ↔ 技能目录集合的名称级一致性。
- 影响：新增或改名技能时 README 清单可能漏更新（文案漂移可接受，条目缺失属可检缺陷）。
- 方案：在 contracts 测试中加名称集合级断言（不比对文案内容）。
- 边界：仓库侧，不升版本；与 F2 同批。

### F5【P3·认知负载】ae-review 主文档承载七个段落级 lane

- 证据：`ae-review/SKILL.md` 正文 111 行，含 Light Path、Diff 纪律、Persona 选择、Complexity lane、Claim-Integrity lane、Second-Model 证据、Cross-Artifact 审查等段落；是最大的单体工作流文档。
- 现状可用，0.3.23 刚做过 Light Path 精修；不主动重构。
- 触发条件：再新增 lane，或出现一次「lane 指引被跳过」的实际缺陷时，先把 Complexity 与 Claim-Integrity 细则外移 references，SKILL.md 保留路由与判据。

### F6【P3·深度不对称】ae-refactor 缺方法论 reference

- 证据：ae-refactor 全部 23 行，无 references；对比同为实现车道的 ae-debug（debugging-workflow.md）、ae-tdd（tdd-workflow.md）均有工作流 reference。行为基线、特征化测试、接缝分析、增量绞杀策略等重构方法论均未沉淀。
- 触发条件：真实重构任务出现一次可归因的方法论缺口时，补 `references/refactor-workflow.md`（属插件内容，届时升版本）；不预填。

### F7【P3·回归缺口】技能行为级回归缺少最小场景回放

- 证据：现有回归全部为静态契约、CLI 行为与关键词锁定；「技能被正确遵循」无场景级断言。`ae-skill-audit` 已把 AE replay suite 列为未来验证映射。
- 方案（最小版）：为工作流主链技能各写 1 张场景卡（触发输入 → 期望产物路径与门禁结果），落 `docs/ae/templates/`，作为大版本前的人工回归清单；不建自动化 harness。
- 触发条件：0.4.x 大版本前，或出现一次技能指引被跳过导致的交付缺陷。

## 推荐路线

| 批次 | 内容 | 版本影响 | 前置 |
| --- | --- | --- | --- |
| B（先行） | F2 链接校验扩展 + F4 名称级账本断言 | 仓库侧，不升版本，`npm run check` + `npm test` 全绿交付 | 无 |
| A | F1 运行时入口统一 + F3 工件契约表补全 | 插件内容，一次升版本（含 README/CHANGELOG 四文件条目与回归断言） | 建议 B 先落地 |
| C | F5 / F6 / F7 | 按各自触发条件，命中前无主动待办 | 触发信号见各发现条目 |

## 验证

- 本审计为只读分析；交付物为本文档与 README.md / README.en.md 路线图追加条目（纯文档，不升版本）。
- 交付前运行：`npm run check`、`npm test`、`node scripts/check-release-notes.mjs`。这些检查证明文档契约、镜像与发布记录结构一致，不证明任何发现的修复效果（修复属后续批次）。

## 残余风险

- 本审计交付期间，同一工作区存在另一并行会话正在实现路线图第 7、10 两项（旧栈对照条目写入 `ae-web-app` 三份 guidance、新增 `docs/ae/references/frontend-quality-contract-map.md` 与对应 PRD/计划、`tests/skills-docs.test.mjs` 新增对照断言）。曾观察到两例由其中间态引发的瞬态测试失败（旧栈对照断言、全局安装 staged runtime 指纹不匹配），在其文件写入完成后复跑均通过。这两项的「按需休眠」状态即将失效，后续 README 路线图收尾时应以该会话的交付为准。
- 行数与匹配计数为本日快照，后续技能变更会使数字过期；结论依赖的是结构性事实（校验正则范围、契约表行、路径分布），不依赖精确计数。
- F1 的方案假设项目 wrapper 与全局 dispatcher 的 CLI 契约保持一致；若未来两入口行为分叉，需先解决分叉再统一口径。
- 未审计 `plugins/ai-agent-engine-codex/scripts/` 下 15 个命令模块的实现质量（0.3.20 拆分时已有测试与经验记录覆盖），本轮仅确认技能文档与其命令引用的一致性。
