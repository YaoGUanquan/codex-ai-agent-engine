# 当前插件 Skills / AGENTS.md 审计报告

审计日期：2026-09-05
审计对象：`D:\codes\ph-AI-Agent-Engine` 中的 `ai-agent-engine-codex` 插件源与维护镜像
参考方法：用户提供的《GPT-6 Astra 项目指令审计规范：审计 ~/Projects 中的 Skills 和 AGENTS.md》

## 1. Executive Summary

本次是只读静态审计，不是插件运行验收，也没有修改仓库。

- 有效项目级指令：1 份根级 `AGENTS.md`。
- `AGENTS.override.md`：0 份。
- 当前插件源：40 个 `SKILL.md`，每个技能均有 `agents/openai.yaml`，共 129 个文件。
- `.ae-source` 维护镜像：40 个技能、129 个文件；与插件源逐文件 SHA-256 一致。
- 额外模板：2 份 `init-templates/*/agents.md`，属于生成模板，不是当前生效指令。
- MCP：插件 manifest 引用了 `.mcp.json`，但该文件明确为空，没有可执行的 MCP server。
- 最高级别发现：P2；未发现 P0/P1 凭据泄露、越权执行或绕过审批的直接证据。

主要问题是维护和认知风险：`.agents`、`.ae-source`、插件源和 `dist` 的角色需要更清楚地分层；前端技能的触发描述存在重叠；部分技能仍硬编码全局 dispatcher 路径；跨技能 references 的链接校验范围不足。前两项会增加错误路由和错误扫描的概率，后两项已被当前 README 记录为结构性债务。

## 2. Scope and Method

### 扫描范围

纳入扫描：

- 根级 `AGENTS.md`。
- `plugins/ai-agent-engine-codex/`：manifest、`.mcp.json`、40 个技能目录、技能 references、`agents/openai.yaml`、辅助脚本的静态结构。
- `.ae-source/`：维护镜像及 `marketplace.json`。
- `README.md`、`README.en.md`、`CHANGELOG.md`、`package.json`，用于核对能力、版本、分发和声明。
- `.agents/` 当前目录结构，用于核对项目级安装布局。

排除项：

- `.git/`：版本控制内部数据。
- `node_modules/`：第三方依赖及其自带技能，不属于当前插件。
- `dist/`、`build/`、`coverage/`：被 `.gitignore` 排除的生成物；其中发现的旧技能清单只记录为边界风险，不当作当前插件能力。
- `.tmp-install-smoke-checks/`：临时测试目录。
- `.env*`、凭据、私钥和本地认证文件：不读取、不记录。

### 方法

- 读取 frontmatter、技能正文、代理元数据、manifest、README 和项目规则。
- 用只读文件枚举、行号读取、Git 状态/追踪清单和 SHA-256 比对核对结构。
- 未跟随符号链接；本次扫描未发现需要跟随的技能符号链接。
- 没有执行插件脚本、`npm test`、`npm run check`、安装器、更新器、外部 API、部署命令、浏览器操作或数据库操作。
- 因此，本文的“已验证”仅表示文件存在性、静态内容和静态镜像一致性；不表示 Codex 实际加载顺序、模型遵循度、运行时命令成功或目标项目验收。

## 3. Inventory

### 项目级指令

| 文件 | 类型 | 作用 | 状态 |
| --- | --- | --- | --- |
| `AGENTS.md` | 生效指令 | 项目画像、变更边界、版本/编码/验证规则 | 已读取，52 行 |
| `AGENTS.override.md` | Codex override | 项目当前未配置 | 不存在 |
| `plugins/ai-agent-engine-codex/scripts/ae-tools/init-templates/en/agents.md` | 生成模板 | 英文初始化模板 | 非生效指令 |
| `plugins/ai-agent-engine-codex/scripts/ae-tools/init-templates/zh-CN/agents.md` | 生成模板 | 中文初始化模板 | 非生效指令 |

### 当前分发插件

插件 manifest 为 `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`，版本为 `0.3.41`，许可证为 `GPL-2.0-only`，技能入口为 `./skills/`，MCP 配置为 `./.mcp.json`。

40 个技能包如下。每个技能包均包含 `SKILL.md` 与 `agents/openai.yaml`；部分技能另外包含 references：

`ae-agent-creator`、`ae-backend`、`ae-brainstorm`、`ae-claude-code`、`ae-constitution`、`ae-debug`、`ae-design`、`ae-doc-humanize`、`ae-doc-structure`、`ae-frontend-design`、`ae-handoff`、`ae-help`、`ae-ideate`、`ae-imagegen-prompt`、`ae-init`、`ae-language`、`ae-lfg`、`ae-markitdown`、`ae-plan`、`ae-prd`、`ae-prompt-optimize`、`ae-refactor`、`ae-reverse-engineering`、`ae-review`、`ae-save-experience`、`ae-skill-audit`、`ae-skill-creator`、`ae-sql`、`ae-static-server`、`ae-swagger-parser`、`ae-task-loop`、`ae-tasks`、`ae-tdd`、`ae-test-api`、`ae-test-browser`、`ae-update`、`ae-web-app`、`ae-web-forge`、`ae-work`、`ae-work-report`。

静态体量：40 个 `SKILL.md` 共 145,817 bytes，平均约 3,645 bytes；最大文件为 `ae-review/SKILL.md`，15,194 bytes、193 行。references Markdown 共 48 个，约 141,972 bytes。

### 维护镜像和项目级安装树

| 路径 | 实际状态 | 角色 |
| --- | --- | --- |
| `plugins/ai-agent-engine-codex/skills` | 40 个技能、129 个文件 | 可分发插件源 |
| `.ae-source/skills` | 40 个技能、129 个文件 | 分发源仓库的维护镜像 |
| `.agents/skills` | 不存在 | 本仓库不作为自身 consumer 安装目标 |
| `.agents/plugins` | 目录存在但当前无 marketplace 文件 | 空的项目级安装示例骨架 |
| `dist/src/assets/skills` | 存在旧构建内容，未纳入本次插件能力清单 | 生成物，已排除 |

插件源与 `.ae-source` 维护镜像的 129 个文件逐文件 SHA-256 一致，未发现缺失、额外或内容漂移。

### 结构和能力边界

- 工作流主链：`ae-brainstorm`、`ae-prd`、`ae-design`、`ae-plan`、`ae-tasks`、`ae-work`、`ae-review`、`ae-lfg`、`ae-handoff`、`ae-work-report`。
- 实现车道：前端、Web、后端、调试、重构、TDD、SQL、逆向等。
- 验证车道：`ae-test-api`、`ae-test-browser`。
- 元治理：`ae-init`、`ae-help`、`ae-skill-audit`、`ae-skill-creator`、`ae-agent-creator`、`ae-update`、`ae-language` 等。
- `plugins/ai-agent-engine-codex/.mcp.json` 内容为空，当前没有 MCP server 配置。

## 4. Findings

### F-001

```text
ID: F-001
Severity: P2
Project: ai-agent-engine-codex
File: AGENTS.md:17-23; README.md:471-493
Category: instruction architecture / path naming
Observation: 根级 AGENTS.md 将 .agents 列为重要路径，README 又把 .agents 描述为当前仓库自用的项目级安装示例；但本仓库实际维护镜像位于 .ae-source，.agents/skills 当前不存在且 .agents/plugins 为空。
Evidence: 插件源和 .ae-source 均有 129 个文件并逐文件 SHA-256 一致；.agents 没有对应技能文件。
Impact: 人工审计或代理若把 .agents 当作本仓库的 canonical skill tree，可能得到“技能为空”的错误结论；若把 .ae-source 当作 consumer 安装目录，又可能重复发现或错误修改维护镜像。
Recommendation: 在 README 和根级 AGENTS.md 中把 consumer 安装布局、插件源和 .ae-source 维护镜像分别命名，并明确本仓库不应扫描 .agents/skills 作为自身生效技能源；增加目录角色的静态契约检查。
Confidence: high
```

### F-002

```text
ID: F-002
Severity: P2
Project: ai-agent-engine-codex
File: README.md:62-85
Category: stale or contradictory documentation
Observation: README 声明版本节“仅保留最近 5 个版本”，但 0.3.41 至 0.3.37 之后仍保留 0.3.28 和 0.3.26 两个旧版本小节。
Evidence: 0.3.41、0.3.40、0.3.39、0.3.38、0.3.37 是当前最近五个版本；0.3.28 与 0.3.26 出现在同一版本节之后。
Impact: 维护者无法仅凭 README 判断哪些条目是发布窗口、哪些是兼容性说明；后续版本更新可能继续复制旧条目，增加文档上下文成本。
Recommendation: 删除旧小节并保留 CHANGELOG 链接，或将其改成明确命名的“迁移兼容说明”，不要继续伪装为版本窗口条目。
Confidence: high
```

### F-003

```text
ID: F-003
Severity: P2
Project: ai-agent-engine-codex
File: plugins/ai-agent-engine-codex/skills/ae-frontend-design/SKILL.md:3,39; plugins/ai-agent-engine-codex/skills/ae-web-forge/SKILL.md:3,31-37; plugins/ai-agent-engine-codex/skills/ae-web-app/SKILL.md:3,26,35
Category: routing overlap / context cost
Observation: 三个公开技能的 description 都覆盖前端、页面、dashboard、form 或 Web app 实现；正文虽已规定 web-forge 负责广泛入口，frontend-design 负责视觉实现，web-app 负责应用接线，但触发元数据仍有明显重叠。
Evidence: ae-frontend-design description 包含 page/app prototype、dashboard、form flow；ae-web-app description 包含 web frontend、admin UI、dashboard；ae-web-forge description 包含 unified frontend/Web work。
Impact: 技能搜索或自然语言触发可能同时命中多个技能，增加重复读取和错误路由概率；正文路由规则不能完全抵消触发描述层的歧义。
Recommendation: 收窄 metadata：web-forge 仅保留广泛 intake/route，frontend-design 仅保留 focused visual/UI implementation，web-app 仅保留 app wiring/API/full-stack；为三个边界各增加一个正例和反例回归任务。
Confidence: high
```

### F-004

```text
ID: F-004
Severity: P2
Project: ai-agent-engine-codex
File: plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md:64; plugins/ai-agent-engine-codex/skills/ae-lfg/SKILL.md:14; README.md:558-560
Category: runtime entry consistency / maintenance drift
Observation: 多个技能示例硬编码全局 dispatcher 路径 $HOME/.agents/ai-agent-engine-codex/bin/ae.mjs，而 README 的项目级安装主入口是 scripts/ae-tools.mjs；README 已记录该差异为待办。
Evidence: ae-review 和 ae-lfg 直接引用全局路径；README 的项目级安装步骤复制 scripts/ae-tools.mjs，并在 0.3.41 文档中记录“运行时入口口径统一”仍待处理。
Impact: 项目级安装后，用户照着技能示例执行时可能找不到全局 dispatcher；不同安装模式下相同命令的可执行性不稳定。
Recommendation: 按 README 现有路线图统一为“项目 wrapper 优先、全局 dispatcher 回退”，将路径解析写入共享 reference，并由 contract test 锁定示例形式。
Confidence: high
```

### F-005

```text
ID: F-005
Severity: P2
Project: ai-agent-engine-codex
File: scripts/check-skill-contract.mjs:99-147; README.md:558
Category: validation coverage gap
Observation: 当前技能契约检查只校验 SKILL.md 中匹配到的、指向 SKILL.md 的 Markdown 链接；references 中的相对 Markdown 链接和反引号路径没有同等守护。
Evidence: linkPattern 在 check-skill-contract.mjs:131 只匹配包含 SKILL.md 的链接；README 已指出 local-runtime-smoke-gate.md、api-contract-checklist.md、validation-evidence-profile.md 等跨目录引用存在静默断链风险。
Impact: reference 文件重命名或移动后，技能正文可能继续通过现有检查，但运行时阅读路径已失效；问题会延迟到实际任务才暴露。
Recommendation: 扩展静态检查到 SKILL.md 与 references 中全部相对 .md 链接，并增加 README 能力清单、capability catalog 与技能目录的名称集合断言。
Confidence: high
```

### F-006

```text
ID: F-006
Severity: P2
Project: ai-agent-engine-codex
File: dist/src/assets/skills/*/SKILL.md
Category: stale generated artifact / scan boundary
Observation: 被 .gitignore 排除的 dist 中仍存在一组旧技能文档，静态枚举得到 34 个 SKILL.md，名称集合与当前 40 技能插件不同。
Evidence: dist 内容包含 ae-api-tester、ae-audio、ae-graph-build、ae-grill、ae-merge-branch 等当前插件源没有的名称；dist 未被 Git 追踪。
Impact: 宽泛文件系统扫描或 IDE 搜索可能将旧构建文档误当作当前技能，导致错误路由或报告过期能力；本次已将其排除，不能据此推断当前插件 manifest 暴露这些技能。
Recommendation: 保持 dist 明确为生成物并在审计/打包工具中统一排除；如该目录不再需要，安排独立的生成物清理任务。不要在本次审计中直接删除。
Confidence: medium
```

### 安全审计结论

没有发现 P0/P1 级直接证据。当前高风险边界均有相应限制：

- `ae-work` 要求 Git/worktree 检查，Git 写入和破坏性操作需要用户批准：`ae-work/SKILL.md:17-34`。
- `ae-update` 明确说明网络和替换影响，并要求批准：`ae-update/SKILL.md:10-15`。
- `ae-claude-code` 默认只读、限制工具、禁止绕过权限和发送秘密：`ae-claude-code/SKILL.md:22-24,39-41,71,96-98`。
- `ae-test-api` 禁止未经 smoke gate 授权的服务重启、认证请求和状态变更，并要求脱敏：`ae-test-api/SKILL.md:28-38`。
- `ae-reverse-engineering` 将动态执行、凭据使用、目标变更和网络重放作为新的授权边界：`ae-reverse-engineering/SKILL.md:23,32,40`。

这些是静态指令事实，不等于宿主客户端一定强制执行；实际权限仍由 Codex 审批模型和具体宿主决定。

## 5. Conflict Matrix

| 规则 A | 规则 B | 冲突或重叠 | 可能适用范围 | 建议 |
| --- | --- | --- | --- | --- |
| `ae-web-forge` 作为统一前端/Web 入口 | `ae-frontend-design` description 直接覆盖 page/app/dashboard/form | 触发层重叠，正文路由层有区分 | 所有前端 UI 请求 | 收窄三个技能的 description，保留 web-forge 为 intake owner |
| `ae-web-forge` 作为统一入口 | `ae-web-app` description 直接覆盖 Web frontend/admin/dashboard | 触发层重叠，web-app 正文又要求先由 web-forge 选择 | Web app、后台和轻量全栈请求 | 在 metadata 中强调“被路由后实现”或仅保留明确 app wiring 触发词 |
| `.agents` 作为仓库重要路径/安装示例 | `.ae-source` 作为实际维护镜像 | 目录角色名称容易混淆，不是行为冲突 | 仓库扫描、维护和安装文档 | 增加 canonical source / consumer install / maintenance mirror 术语 |
| README 仅保留最近五个版本 | 同一节仍有 0.3.28、0.3.26 | 文档规则与实际结构不一致 | 发布说明阅读与后续维护 | 清理或重命名旧条目 |
| 项目 wrapper `scripts/ae-tools.mjs` | 多个技能示例的全局 dispatcher 路径 | 安装模式下命令入口不一致 | 已安装项目与全局安装 | 统一入口解析 reference 和测试 |

未发现根级 `AGENTS.md` 与技能正文之间的明确硬冲突。根级规则要求保持任务范围、保留用户变更、遵守版本与验证门禁；技能正文总体沿用同一边界。

## 6. Instruction Architecture

建议目标分层如下，本次不直接修改：

1. 根级 `AGENTS.md`：只保留稳定不变量、目录角色、真实命令、版本/许可证/安全边界和报告证据规则。
2. 子目录 `AGENTS.md`：当前不必新增；只有 `plugins/`、`docs/` 或 `scripts/` 出现独有且稳定的约束时再增加。
3. `agents/openai.yaml`：只放简短、可发现的触发描述和默认提示，不承担完整流程和安全门禁。
4. `SKILL.md`：放单一技能的流程、失败处理、路由边界和 references 入口；metadata 与正文应共享明确的正例/反例边界。
5. references：放较长的领域契约、模板和检查表；所有相对 Markdown 链接应纳入静态校验。
6. 任务 Prompt：提供本次任务的目标、范围、验收标准、停止条件和人工审批点，不由通用技能替代。
7. `plugins/ai-agent-engine-codex/`：可分发插件源。
8. `.ae-source/`：维护镜像和 local marketplace，不应与 consumer 项目的 `.agents/skills` 混称。
9. `.agents/skills`：仅作为目标项目安装后的 consumer 目录；当前分发源仓库不应将其当作自身 canonical source。
10. `dist/`、`node_modules/`：审计工具默认排除，并在报告中保留排除理由。

## 7. Prioritized Action Plan

### 立即处理

当前没有 P0/P1，暂无需要立即停止自动化的事项。

### 近期整理

1. 明确 `.agents`、`.ae-source`、插件源和 consumer 安装目录的角色，修订 README/AGENTS.md 表述并增加目录角色检查。
2. 收窄 `ae-web-forge`、`ae-frontend-design`、`ae-web-app` 的 metadata 触发边界，添加 routing 正反例回归任务。
3. 统一项目 wrapper 和全局 dispatcher 的运行时入口解析，落实 README:559 的既有待办。
4. 扩展 `check-skill-contract.mjs` 到全部相对 references 链接，落实 README:558 的既有待办。
5. 清理或明确标记 `dist` 中的旧技能构建产物，避免宽扫描误报。
6. 清理 README 中超出“最近五个版本”窗口的旧版本小节。

### 持续优化

- 用真实代表性任务记录技能命中、重复路由、上下文 token、完成率、错误率、耗时和人工介入次数。
- 对每个被压缩、删除或重路由的规则保留至少一个回归任务。
- 将插件源、`.ae-source` 镜像、metadata、capability catalog、README 和 release notes 纳入同一发布前检查。
- 对涉及全局安装、Claude delegation、网络更新和动态工具的技能，持续区分“文档要求”“脚本行为”“宿主强制”三类证据。

## 8. Verification Plan

清理或调整后应分层验证：

1. 静态结构：重新枚举根级 `AGENTS.md`、`AGENTS.override.md`、源/镜像 `SKILL.md`、`openai.yaml`、references 和生成物排除项。
2. 契约检查：运行 `node scripts/check-skill-contract.mjs`、`node scripts/check-skill-mirror.mjs`、`node scripts/check-skill-language-metadata.mjs`，并补充全 references 链接检查。
3. 发布检查：运行 `node scripts/check-release-notes.mjs`，确认 root/package manifest 版本一致、README/CHANGELOG 映射正确。
4. 安装检查：运行 `node scripts/check-install-smoke.mjs` 和 `node scripts/check-global-install-smoke.mjs`，确认 consumer `.agents/skills` 与维护镜像边界不混淆。
5. 回归路由：准备至少三类前端任务：视觉-only、新 Web app/API、已有 route 二次开发；记录最终命中技能和是否发生重复路由。
6. 安全回归：准备只读审计、认证 API 冒烟、Claude 只读 delegation、更新器 preview 四类样本；确认没有凭据进入报告，未授权写入会阻塞。
7. 运行时验收：在新 Codex 会话中确认技能可发现、项目 wrapper 与全局 dispatcher 两种安装模式都能解析；本报告未执行该项。
8. 重新审计：按本报告同样的排除规则和输出顺序重新扫描，并比较前后 findings 数量、严重级别和路径角色。

## 完成边界

本次审计满足：纳入范围内的指令和技能文件均已列出或有排除理由；发现均有文件与行号；观察、影响、建议和置信度分离；未复制秘密；未执行插件脚本、安装、部署或外部 API；提供了冲突矩阵、目标分层、行动计划和验证方案。

未完成且不应被本报告冒充完成的事项：插件实际运行、Codex 宿主加载顺序、自然语言路由准确率、token/context 真实成本、安装/更新 smoke、浏览器/API/部署验收，以及对上述 P2 的代码或文档修复。
