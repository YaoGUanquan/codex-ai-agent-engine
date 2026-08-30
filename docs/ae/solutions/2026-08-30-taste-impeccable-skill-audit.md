# Taste Skill、Impeccable 与 AE 主上游跟踪审计（2026-08-30）

## Decision

结论是 `ADAPT`，不是安装、复制或新增两个同名 AE skill。

Taste Skill 的高价值部分是设计意图推断、针对受众与页面类型的视觉方向选择、可调的表现力/动效/密度轴，以及重设计前先审计现状。Impeccable 的高价值部分是任务化精修词汇、设计上下文工件、截图驱动的复核回路、分平台验证和确定性检测思想。两者都与现有 `ae-frontend-design`、`ae-web-forge`、`ae-design`、`ae-review`、`ae-test-browser` 高度重叠，适合改写为现有技能的渐进式参考与验证契约，不适合形成第二套设计运行时。

`jiangqiang1996/ai-agent-engine` 是本项目声明在 `package.json`、README 和 capability catalog 中的主上游，优先级高于 Taste、Impeccable 和 mattpocock 等补充研究源。主上游提供 AE 工作流能力模型；补充源只用于校验或增强特定方法，不能反向改变主链所有权。

本报告只新增研究、需求、设计和计划文档；未修改 skill、mirror、watchlist、运行时或版本号。

## Findings

### F1 - P1：当前 watch 把“仓库变了”误写成“所有已映射 skill 都受影响”

- 位置：`plugins/ai-agent-engine-codex/scripts/ae-tools/skill-audit.mjs`
- 触发：远端 HEAD 与 `pinnedCommit` 不同。
- 证据：`inspectWatchedSource()` 通过 `uniqueSkills(source.adopted)` 取得全部已采用 AE skill；只要提交不同，就把全部值写入 `affectedSkills`，没有比较上游路径或提交差异。
- 实际观测：`mattpocock/skills` 的固定提交是 `5b15a47f2d7150f545fbcacbfe381787fc0230dc`，2026-08-30 通过 GitHub API 页面提取观测到 `main` 为 `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`。compare 结果为 ahead 3，变化只新增 `skills/in-progress/retro/` 及其 README 条目，没有修改已采用的 `diagnosing-bugs`、`tdd`、`code-review`、`codebase-design`、`to-tickets`。
- 影响：按当前逻辑会把五个 AE skill 全部列为 affected，造成无关复查，并把候选影响误表述为已证实影响。
- 修复方向：watchlist 为 adopted 映射记录 `upstreamPaths`；仅有 HEAD 差异时输出 `candidateSkills` 和 `impactStatus: unverified`，不填 `affectedSkills`；获得 changed-path 证据后才做路径匹配。

### F2 - P2：现有前端链路有工程质量契约，但缺少可传递的设计意图契约

- 位置：`ae-web-forge` Q1-Q4、`ae-frontend-design/SKILL.md`、`references/web-ui-quality.md`、`ae-design` 设计模板。
- 证据：当前链路能判断已有页面、设计输入、API 交互和视觉基线，也覆盖状态、可访问性、响应式与动效边界；但没有统一记录受众、表面类型、主任务、品牌资产、层级、排版、色彩、密度、表现力和视觉禁区。
- 影响：同一需求从 brainstorm/design 进入 implementation 时，视觉判断依赖模型默认偏好，容易产生模板化页面；review/browser 也没有共同的预期基线。
- 修复方向：增加紧凑的 `Design Read`/`UI Direction Contract`，使用上下文推断的离散等级而非固定审美配方；已有设计系统和现有页面优先级最高。

### F3 - P2：浏览器验收能证明“页面可用”，不能充分证明“视觉证据有效”

- 位置：`ae-test-browser/references/browser-acceptance.md`。
- 证据：当前要求截图、桌面/移动端、控制台/网络和键盘操作，但没有要求截图非空、目标完整入镜、遮挡/溢出检查、截图失败后重拍、用户给出反例截图后重新跑视觉复核。
- 影响：一个技术上成功但裁切、空白、资源未加载或与既定方向明显漂移的截图仍可能被当作验收证据。
- 修复方向：加入“证据有效性门禁”和“反例重开”规则；仅在视觉匹配任务中增加方向/基线矩阵，不把所有 UI 任务升级成像素级比较。

### F4 - P2：直接复制 Impeccable 的检测器存在许可证和维护边界问题

- 证据：Impeccable 为 Apache-2.0，本项目为 GPL-2.0-only；直接组合其代码或派生实现存在 GPLv2-only 兼容性问题。其 4.1.2 发布说明集中修复注释误报、颜色解析、路径逃逸、monorepo 继承、Windows hook 迁移和 symlink 边界，说明检测器不是一组可无成本搬运的正则。
- 影响：复制检测器会引入许可证义务、误报维护、跨平台路径安全和 hook 生命周期负担。
- 修复方向：第一阶段只改写通用方法与人工证据契约；若真实回放证明需要本地静态检测，再基于本项目需求独立实现少量规则，并先建立正反例语料与误报预算。

### F5 - P1：主上游没有进入机器可复检 watchlist

- 位置：`docs/ae/references/external-skill-watchlist.json`。
- 证据：项目 `package.json.upstreamReference`、README 和 capability catalog 都把 `https://gitee.com/jiangqiang1996/ai-agent-engine` 声明为主参考，但当前 watchlist 只有 `mattpocock-skills`。
- 实际观测：2026-08-30 运行 `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git HEAD refs/heads/master refs/heads/main`，`HEAD/master` 均为 `8ef17fbc9d8cd7b956f8d01c0448500651650189`。相对最近审计基线 `c4e5c14ec8b62adabaefc5f98fe267d1188211d5`，浅克隆中可见 13 个提交、58 个文件变化。
- 影响：项目能描述主上游，却不能通过现有 `skill-audit --watch` 获得同一套 freshness、路径影响和 adopted/rejected 证据；补充源反而拥有更完整的机器跟踪。
- 修复方向：watchlist 增加 `sourceRole: primary-upstream`，并要求主上游记录比普通研究源更完整的能力域/路径映射。主上游 stale 仍只产生审计建议，不自动同步。

### F6 - P2：主上游新增可运行规格闭环，当前 Codex PRD/design 链只保留文档契约

- 上游证据：`c0ccab69` 和 `c59151ed` 新增并重构 `ae:spec-html`、`spec-author`、`spec-translator`。其可移植核心是：用自包含静态 HTML 表达页面、字段、交互、响应式和业务状态；在规格与源码之间建立逐项一致性清单；同步方向不明确时交还用户；同步后有界重验。
- 当前 AE：`ae-prd`、`ae-design`、`ae-plan` 已有稳定 ID、映射、证据层级和浏览器验证，但没有一个可选的“可运行交互规格”作为需求证据，也没有 spec/code 双向同步入口。
- 判断：适合 `DEFER/ADAPT` 为可选原型证据模式，不适合直接移植。上游规格明确排除安全、并发和非功能需求，而当前 AE 的 S4 设计契约必须保留这些风险维度；上游还依赖 OpenCode agents 和 `ae:grill` 调度。
- 修复方向：先在本次 UI Direction Contract 计划中加入“静态交互规格可作为 design input/evidence，但不是 PRD 或 design 的替代品”；只有真实项目反复需要 spec/code 同步时，另开独立 PRD 设计 Codex-native workflow。

## Current AE Logic

当前前端主链是：

1. `ae-web-forge` 用 Q1-Q4 判断现有目标、设计输入、后端/API 交互和视觉基线。
2. 纯 UI 进入 `ae-frontend-design`；状态、API、auth 或持久化进入 `ae-web-app`。
3. `ae-frontend-design` 读取 `web-ui-quality.md`，复用现有栈、组件和设计系统，并补齐 loading/empty/error/disabled 等状态。
4. `ae-test-browser` 提供浏览器证据；`ae-review` 的 Frontend Components / Styles lens 主要检查代码缺陷、响应式、可访问性和样式泄漏。
5. `ae-design` 用稳定 ID 和映射表约束架构/UI/test，但 UI 维度还没有统一的视觉方向字段。
6. plugin source 与 `.ae-source/skills` mirror 由检查脚本锁定；可分发 skill 变更必须同步版本、README/CHANGELOG 和安装烟测。

这套结构不缺新的入口，缺的是设计判断在各阶段之间的共享语言和证据闭环。

## External Sources

| Source | Freshness evidence | License | Inspected files / surfaces | Verdict |
| --- | --- | --- | --- | --- |
| `https://gitee.com/jiangqiang1996/ai-agent-engine` | `git ls-remote` 观测 `master/HEAD` `8ef17fbc9d8cd7b956f8d01c0448500651650189`，2026-08-30；相对 `c4e5c14...` 可见 13 commits / 58 files | GPL-3.0-or-later | `ae:spec-html`, `spec-author`, `spec-translator`, `ae:ocr`, install/path services, Playwright guidance | PRIMARY-UPSTREAM; ADAPT methods only, no code/prose/runtime copy |
| `https://github.com/Leonxlnx/taste-skill` | GitHub API 页面提取观测 HEAD `ccbc15639c97057cbfcf32ecebc38ef716e4bb37`，2026-08-24；该提交只改 README sponsor 布局 | MIT | repository README；`skills/taste-skill/SKILL.md`，blob `b72132f...`，87,253 bytes | ADAPT methods; do not copy the 87KB prompt |
| `https://github.com/pbakaus/impeccable` | GitHub API 页面提取观测 HEAD `b0594c72d18006b5865c70eb3a97e8b04064e600`，2026-08-29；最新稳定 skill release 4.1.2 为 `63b04e2530f5c7b41ea83c133daab24f34912456` | Apache-2.0 | README、release notes、LICENSE、`.claude/skills/impeccable/SKILL.md` blob `583d62a...`、reference/scripts 目录结构 | ADAPT behavior independently; reject code/prose copying |
| `https://github.com/mattpocock/skills` | GitHub API 页面提取观测 HEAD `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`，2026-08-24；相对 pinned `5b15a47...` ahead 3 | MIT | compare API、`skills/in-progress/retro/SKILL.md` patch、release notes | DEFER retro; fix watch precision first |

直接 `git ls-remote` 在本机对三个 GitHub 仓库均连接超时；`node scripts/ae-tools.mjs skill-audit --watch` 因同一原因返回 `freshness: unavailable`。上述 GitHub 完整提交来自 AnySearch 对 GitHub API/页面的实时提取，不冒充本机 git 远端校验。Gitee 主上游则由本机 `git ls-remote` 和 `--depth 200` 临时浅克隆直接验证。

Impeccable 的规则数量在可见来源中出现 59 与 61 两种表述；因此本报告只确认“存在确定性 detector”，不把精确规则数作为能力或采用依据。

## Portable Patterns

| Pattern | Category | AE destination | Adaptation boundary |
| --- | --- | --- | --- |
| Brief first：页面类型、受众、品牌资产、约束先于审美 | portable method | `ae-frontend-design`, `ae-design` | 复用现有视觉基线优先，不使用固定风格默认值 |
| 表现力、动效、密度三轴 | portable method | UI Direction Contract | 用 low/medium/high 或现有系统值；不复制 Taste 的默认数字和长规则表 |
| audit / polish / harden / clarify / adapt / optimize 等任务词汇 | portable method | `ae-web-forge` routing reference | 压缩为少量 refinement modes，不创建 23 个技能 |
| comp-first 与 code-first 的显式选择 | portable method | `ae-frontend-design`, `ae-imagegen-prompt` | 仅在图像生成可用且视觉探索价值明确时使用；普通产品 UI 默认 code-first |
| 截图有效性、反例重开与完成态复核 | local deterministic contract | `ae-test-browser`, `ae-review` | 记录可见证据；不依赖外部 live browser runtime |
| anti-pattern detector | local deterministic mechanism candidate | future helper script | 先建回放语料和误报预算；独立实现，禁止复制 Apache-2.0 源码 |
| hooks、provider installer、pin/unpin、live mode server | runtime-specific behavior | reject | Codex/平台运行时行为不由 AE skill 文本保证 |
| 可运行静态规格 + spec/code 一致性清单 | portable method | future `ae-prd`/`ae-design` optional evidence | 不排除安全/NFR，不复制 OpenCode agent 调度，不自动决定同步方向 |
| OCR delegate：确定性选择文件/规则，当前模型审查 | portable method already covered | `ae-review` review-package/review-contract | 维持本地脚本，不引入 `@alibaba-group/open-code-review` 或 OpenCode tools |
| 安装目录由模块/manifest 推断而非全局目录硬编码 | local deterministic candidate | `ae-update`/install checks | 仅在本地安装缺陷复现时审计；不复制 GPL-3.0 code |

## Ideation Options

| Option | Value | Cost / risk | Decision |
| --- | --- | --- | --- |
| 整包安装 Taste 与 Impeccable | 功能最全 | 重复入口、运行时分叉、许可证与更新负担 | Reject |
| 新建 `ae-design-taste` 或 23 个精修技能 | 可发现性强 | 与现有前端链路重叠，路由冲突和目录膨胀 | Reject |
| 在现有技能中增加共享方向契约、精修模式和视觉证据门禁 | 保留单一主链，改动可控 | 需要同步 3 个质量契约与 mirror | Choose |
| 立即实现本地 detector CLI | 可给确定性反馈 | 无本地误报基线，维护和安全成本高 | Defer |

## Perspective Collision

| Perspective | Position | Disagreement type |
| --- | --- | --- |
| Critic | 大量“禁止某种审美”的规则会把一种模板替换成另一种模板 | value |
| Pragmatist | 先补设计意图字段和验收证据，不增加入口与依赖 | value |
| Innovator | comp-first、方向候选和精修词汇能显著扩展探索空间 | assumption |
| Systems | 任何视觉规则必须穿过 source/mirror、review、browser evidence 和 release gate | fact |

Collision insight：反默认偏差不能靠另一组绝对默认值解决；应让设计方向由 brief、现有系统和目标用户决定，再用精修模式校正具体维度。

Thinking preservation zone：品牌气质、视觉大胆程度和“是否足够专业”仍需要人类判断；技能只能提供结构化选择与证据，不能把审美变成单一分数。

## Tracked Update Assessment

### Primary upstream: jiangqiang1996/ai-agent-engine

相对 2026-08-05 的 `c4e5c14...` 基线，当前 `8ef17f...` 的变化可分三组：

- `ae:spec-html`、`spec-author`、`spec-translator`：新增需求规格与源码双向同步。可借鉴“可运行交互证据、逐项差异、方向确认、有界重验”；不采用其排除 security/concurrency/NFR 的规格边界。
- `ae:ocr`：从 review/scan 转为 delegate，只让外部 OCR 做文件/规则选择，宿主 LLM 审查。该职责分离与当前 `ae-review` 的 deterministic preparation 基本等价，结论是“已覆盖，无需新增依赖”。
- install/path/runtime：移除全局配置目录依赖，改为从插件安装目录和 module layout 推断，补 Windows 和定制版软件路径。它与设计质感无直接关系，应登记为 `ae-update`/安装烟测的独立候选，不混入本次前端改动。

主上游仍是 GPL-3.0-or-later，而本项目是 GPL-2.0-only。两者不能通过复制/派生源码直接合并；本项目继续只独立表达工作流思想，并记录 provenance。

### Supplementary upstream: mattpocock/skills

`mattpocock/skills` 新增的 `retro` 仍在 `in-progress`，上游自己标注为 “STUB: design notes only, not functional yet”。它提出 navigation、automated checks、coding standards、AGENTS.md、tool economy、no-ops、information access 七类复盘候选。

AE 已有 `ae-save-experience`、memory placement、candidate evaluation 和 `ae-skill-creator` 授权门禁。当前不应吸收一个实验性同义入口。可继续观察两点：

- 若多个真实会话重复出现“经验写了，但没有区分应改导航、检查、规则还是工具”的问题，可在 `ae-save-experience` reference 中加入环境改进分类。
- `retro` 的新增不影响当前五个 adopted skill，watch 应报告 source stale 但 adopted impact unverified/none-by-path-evidence，而不是全量 affected。

## Implementation Impact If Authorized

- Plugin source and mirror: `ae-frontend-design`, `ae-web-forge`, `ae-design`, `ae-review`, `ae-test-browser` 及相关 references；必要时仅给 `ae-imagegen-prompt` 增加 handoff 说明。
- Governance: `docs/ae/references/external-skill-watchlist.json`、`skill-audit --watch` 路径级影响语义、focused tests。
- Quality map: 更新 `docs/ae/references/frontend-quality-contract-map.md`，避免三个前端质量表面漂移。
- Validation: mirror、language metadata、skill contract、design contract、focused tests、full test/check、install smoke、release notes check。
- Distribution: 一旦修改 plugin 内容，根 `package.json` 与 plugin manifest 同步递增，并补四份 README/CHANGELOG 版本条目。

## Final Verdict

- AE 主上游：`PRIMARY-UPSTREAM / ADAPT`；立即补入机器 watch，吸收可运行规格的证据思想，暂不创建双向同步 runtime。
- Taste Skill：`ADAPT`，重点吸收设计意图推断、上下文优先和三轴校准。
- Impeccable：`ADAPT`，重点吸收精修模式、视觉证据闭环和检测器的治理思想；因 Apache-2.0/GPL-2.0-only 边界，不复制代码或长提示词。
- mattpocock update：`DEFER` retro 内容，`ADOPT` watch 路径级影响精度修复。
- 新技能：不创建。
