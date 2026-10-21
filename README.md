# AI Agent Engine for Codex

七个可独立复制的工程技能：需求追问、前后端实现与分层测试。唯一可分发技能源为 `skills/<name>/`；仓库校验与回归工具在 `tools/`，测试在 `tests/`。

灵感与能力划分参考 [AI Agent Engine](https://gitee.com/jiangqiang1996/ai-agent-engine)（本仓库独立实现，不复制上游正文）。许可证保持 `GPL-2.0-only`。

English: [README.en.md](README.en.md) · 安装：[INSTALL.zh-CN.md](INSTALL.zh-CN.md) / [INSTALL.md](INSTALL.md)

## 当前主线事实

- 版本：`0.5.0`
- 技能源：`skills/`（恰好 7 个；每个技能资源自闭合，可单独复制使用）
- 安装：标准 [skills](https://www.npmjs.com/package/skills) CLI；**不再**提供项目/全局安装器、`none|core|all` 隐式档位或 MCP 壳
- 调用：须明确点名技能（如 `$ae-frontend` / `ae-grill`）；不默认全流程或多代理
- 校验：`npm test`、`npm run check`、`npm run check:smoke`（入口均在 `tools/`）

## 快速开始

前置：Node.js ≥ 20，以及宿主已支持 Agent Skills。

```bash
# 列出本仓库可安装技能
npx skills add YaoGUanquan/codex-ai-agent-engine -l

# 安装全部 7 个技能到当前项目（跳过确认）
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s '*'

# 只装其中一个
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s ae-grill

# 装到用户级（全局）
npx skills add YaoGUanquan/codex-ai-agent-engine -g -y -s '*'
```

也可以把单个 `skills/<name>/` 目录复制到宿主的 skills 目录；目录内须带齐 `SKILL.md` 与 `references/`。

可选 npm 路径（包名 [`ai-agent-engine-codex`](https://www.npmjs.com/package/ai-agent-engine-codex)）：`npm install ai-agent-engine-codex@0.5.0` 后执行 `npx skills experimental_sync -y`。不要用 `skills add` 直接加 npm 包名。细节见 [INSTALL.zh-CN.md](INSTALL.zh-CN.md)。

调用示例（以 Codex / 支持 `$skill` 的宿主为准）：

```text
$ae-grill 收敛登录改造的验收边界
$ae-frontend mode=dev 实现订单列表筛选
$ae-backend mode=fix 排查重复扣款
$ae-unit-test 为 OrderService 补边界用例并执行
$ae-integration-test 验证下单到支付的租户隔离
$ae-e2e-test mode=test-only 跑已有结账冒烟
$ae-e2e-suite 整理项目 E2E 套件与 CI 门禁
```

更细的安装、迁移与卸载说明见 [INSTALL.zh-CN.md](INSTALL.zh-CN.md)。

## 七个技能

| 技能 | 用途 |
| --- | --- |
| `ae-grill` | 需求与方案追问：先查仓库，每次一个关键决策，给推荐与理由；默认只输出会话共识 |
| `ae-frontend` | 前端设计、页面与交互；`mode=dev\|fix` |
| `ae-backend` | 后端实现与根因修复；`mode=dev\|fix`；保留权限、契约、事务与数据规模约束 |
| `ae-unit-test` | 按现有框架生成/执行单元测试并分析失败 |
| `ae-integration-test` | 跨模块、接口、认证与持久化交互；须证明隔离环境 |
| `ae-e2e-test` | 用例级浏览器验证；支持只跑已有脚本，或编写后执行 |
| `ae-e2e-suite` | 项目级 E2E 基建、套件组织与 CI |

不包含 PPT、TTS、SSH 运维、独立代码审查入口、配置中心或通用运行平台。技能正文不引用其他技能名、兄弟目录、中央 dispatcher 或仓库 `tools/`。

## 从旧插件迁移

旧版是 Codex 插件（`plugins/ai-agent-engine-codex`）+ 安装/更新脚本 + 可选隐式档位。`0.5.0` 起改为独立技能集合：

1. 识别旧安装：项目或用户目录下仍有 `ai-agent-engine-codex` 插件、`.codex-plugin`、旧 `install-*/update-*` 脚本，或 skills 列表里大量已退役的 `ae-*`（如 `ae-help`、`ae-plan`、`ae-lfg`）。
2. 在宿主中停用/移除旧插件或旧技能，避免与新七技能重复加载。
3. 用上一节的 `npx skills add ...` 安装新技能；**不要**再跑旧 `install-project` / `update-ae-codex`。
4. 保留个人文档、记忆、配置、备份与 journal；本版本**不会**自动扫描或清理真实个人安装。

能力去向（摘要）：需求澄清 → `ae-grill`；前端实现/设计 → `ae-frontend`；后端/SQL/调试中的服务根因 → `ae-backend`；单测/TDD → `ae-unit-test`；接口与业务流集成 → `ae-integration-test`；浏览器单用例 → `ae-e2e-test`；E2E 基建与 CI → `ae-e2e-suite`。编排、gate、图谱、记忆、归档、安装器、语言切换、多代理 runtime 等机制已退役，详见 [CHANGELOG.md](CHANGELOG.md) 的 `0.5.0` 条目。

## 仓库结构

```text
skills/           # 唯一可分发技能源（7 个）
tools/            # 校验、语法、发布说明、公开内容、烟测与测试入口
tests/            # 回归测试
docs/             # 仅公开模板/参考与发布清单（过程记录不入库）
LICENSE
NOTICE.md
package.json      # files 白名单：skills/、LICENSE、NOTICE.md
```

npm 包分发**不包含** `tools/` 与 `tests/`；它们只服务本仓库开发与 CI。

## 开发检查

```bash
npm install
npm test
npm run check
npm run check:smoke
```

`check` 覆盖语法、技能 frontmatter/闭包、仓库残留、发布说明窗口与公开内容边界。过程记录与项目记忆遵守私有文档边界，不写回本公开仓库。

## 版本更新记录

完整历史见 [CHANGELOG.md](CHANGELOG.md)。此处仅保留最近 5 条。

### 0.5.0（2026-10-21）
- 全面改为独立工程技能集合：唯一分发源 `skills/`（7 个），仓库工具迁入 `tools/`；移除旧插件 manifest、MCP 壳、安装更新器与编排/gate/图谱/记忆 runtime。
- 文档与安装改为标准 skills CLI；废弃 `none|core|all` 隐式档位与旧插件更新流程；版本升至 `0.5.0`。
- 验证命令：`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。静态与隔离复制仅证明技能闭包与仓库合同；真实宿主模型与生产验收未在本环境宣称通过。

### 0.4.0-beta.3（2026-10-21）
- 新安装默认隐式档位改为 `none`（仅显式调用 AE）；保留 `core`/`all`，更新与语言切换保留已有安装设置，不强制迁移。修复 Cursor 元数据在 `none` 档把核心技能当作仍可模型调用的问题（`cursorShouldDisableModelInvocation`）。
- 调整 `ae-debug`：删除固定「列 3–5 个假设」；仅证据歧义时提出必要可证伪假设；缺环境只阻塞依赖修复/验收，证据不足不得宣称根因确认。
- 补充可离线的模型评测准备/结果校验入口（`scripts/model-evaluation-check.mjs`）与 worker 验收反例；规范与运行结果分离，不因一次运行改写历史规范。
- 验证命令：`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。真实 GPT-6.1 Sol / GPT-6 Astra 对照未在本环境执行（not-run/blocked）；Grok Bot 自运行不能替代模型行为证据。

### 0.4.0-beta.2（2026-10-20）
- 安装器支持 `--implicit core|all|none`；**默认档位从 `all` 改为 `core`**（仅 ae-help / ae-plan / ae-work / ae-review / ae-debug 可自然语言隐式触发）。非 core 自然语言请走 ae-help 路由或显式 `$ae-*`；需要旧行为时传 `--implicit all`。
- 验证命令：`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。这些静态和本地检查不能证明真实 Codex host/model 行为。

### 0.4.0-beta.1（2026-10-15）
- 新增按任务选择角色的团队合同与角色模板：复杂任务先确认方案，主代理负责原生调度、集成和实际验收，小任务继续直接执行。
- 团队执行写权限由「显式 opt-in」改为「父代理门禁」（`write_requires_explicit_opt_in: false` + `write_requires_parent_gate: true`）；写 worker 仍需父代理显式批准，`can_spawn_write_agents*` 保持 false。
- 并行分析区分文件与业务资源的读写冲突，局部冲突按波次串行；新增宿主名额、执行状态和自动并发配置，保留显式关闭及只读选择，无关脏改动不再一律阻塞委派。
- 强化从数据来源到输出的内存、查询与并发边界，补充隔离数据夹具及五类真实模型对照规范；首轮明确偏好 `gpt-6.1-sol`，不静默替换模型。
- 验证命令：`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。静态与隔离安装仅证明辅助工具、规则和分发合同；真实模型对照尚未完成，不宣称质量、耗时或生产容量已提升。

### 0.3.56（2026-10-15）
- 统一测试范围、通过结果复用和失效规则：单点失败先聚焦验证，扩大到全量前说明依据，审查、交付和上下文恢复不自动重跑；移除固定执行次数及脏工作区一律确认。收紧技能入口触发文案，强调明确请求后再加载专项门禁（默认 `implicit` 档位仍为 `all`，与 I 中期约定一致）。
- GPT-6.1 为首要行为验收目标，提供后续模型可复用的八类评测场景及三组对照、每组两次的执行规范；尚未完成真实模型行为评测，不宣称性能或质量提升已获证明。
- 验证命令：`node --test tests/model-adaptation.test.mjs tests/instruction-audit.test.mjs`、`npm test`、`npm run check`、`npm run check:smoke`、`git diff --check`。静态及隔离安装检查仅证明规则、元数据与分发合同，实际结果和未通过项以交付记录为准。

## 重要边界

- 公开仓库过程记录、交接与长期 AI 记忆不入库；仅保留公开模板/参考与发布清单。
- 失败须区分产品、测试、规格与环境原因；禁止放宽断言、无理由跳过或静默降级。
- Git 写入、推送、合并、发布、真实数据库写入或修改真实个人安装需单独授权；本说明不构成上述授权。

## 许可和致谢

- 本仓库：`GPL-2.0-only`（见 [LICENSE](LICENSE)、[NOTICE.md](NOTICE.md)）
- 上游参考声明见 NOTICE；上游版本若为 `GPL-3.0-or-later`，本仓库不擅自改许可证
