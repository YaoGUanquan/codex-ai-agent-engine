# AI Agent Engine for OpenCode

AI Agent Engine（AE）是项目级 OpenCode 工程工作流插件。此专用分支对齐上游 `61b777542fb00d2e082af126d17b070318281933`，提供技能、命令、子代理、工具、完整项目图谱、媒体理解、Playwright CLI、显式 OCR 审查、模型路由和内置规则。

本分支明确不提供 PDF、DOCX、XLSX、PPTX 和 OfficeCLI 能力。OpenCode plugin/SDK 兼容版本为 `1.18.4`。

AE 不要求业务项目采用本仓库结构。面向用户的运行时能力以 `src/` 下资产为真源，安装后的实际可用能力以 `/ae-help` 为准。

## 快速开始

### 安装、更新与卸载

从专用分支执行项目级安装：

```powershell
git clone --depth 1 --branch codex/opencode-mode https://github.com/YaoGUanquan/codex-ai-agent-engine.git "$env:TEMP\ae-opencode"
node "$env:TEMP\ae-opencode\scripts\install-project.mjs" --target "D:\codes\your-project"
```

安装器在目标项目的 `.opencode/ai-agent-engine` 中完成锁定依赖安装和构建，验证成功后才激活 `.opencode/plugins/ae-server.js`。更新失败会恢复旧运行时和桥接文件。

### 验证

重启 opencode 后运行：

```text
/ae-help
/ae-help review
```

能看到技能、命令、代理和模型路由，说明插件已加载。

## 经典用法

手动控制阶段：

```text
/ae-brainstorm 设计一个多租户数据隔离方案
/ae-prd
/ae-design
/ae-review domain:document
/ae-work
/ae-review
```

`/ae-brainstorm` 仅做多视角发散讨论与汇总，不产出文档；当讨论结果需要沉淀为正式需求文档时，由 `/ae-prd` 接续。`/ae-design` 在需求之后产出设计文档，包含架构、接口、数据模型、测试用例和实现单元，供 `/ae-work` 直接执行。

只做代码或文档审查：

```text
/ae-review mode:report-only
/ae-review domain:document docs/ae/designs/example.md
```

前端和浏览器验收：

```text
/ae-playwright 打开 http://localhost:3000/login 并验证登录页
```

解析 Swagger/OpenAPI：

```text
/ae-swagger-parser ./openapi.json method:POST keyword:login mode:detail
```

探索性修复：

```text
/ae-task-loop 修复所有 TypeScript 编译错误
```

## 常用入口

| 目标 | 入口 |
| --- | --- |
| 查看当前能力 | `/ae-help` |
| 多视角发散讨论 | `/ae-brainstorm` |
| 需求澄清与需求文档 | `/ae-prd` |
| 设计阶段（架构、接口、数据模型、实现单元） | `/ae-design` |
| 计划执行 | `/ae-work` |
| Worktree 继续执行 | `/ae-work-continue` |
| 分支或 worktree 合并 | `/ae-merge-branch` |
| 工作总结 | `/ae-work-report` |
| 查看本人代码变更 | `/ae-my-code-changes` |
| 代码或文档审查 | `/ae-review` |
| 浏览器自动化与验收 | `/ae-playwright` |
| 原型预览 | `/ae-prototype-preview` |
| 接口测试 | `/ae-api-tester` |
| Swagger/OpenAPI 摘要 | `/ae-swagger-parser` |
| 图片转 Markdown 描述 | `/ae-image` |
| 音频内容理解 | `/ae-audio` |
| 视频内容理解 | `/ae-video` |
| 幻灯片大纲生成 | `/ae-slides-outline` |
| 项目关系图谱 | `/ae-graph-build`、`/ae-graph-query` |
| 探索性修复 | `/ae-task-loop` |
| 数据库操作 | `/ae-sql` |
| 会话交接 | `/ae-handoff` |
| 项目探索 | `/ae-project-explore` |
| 经验沉淀 | `/ae-save-experience` |
| 深度追问 | `/ae-grill` |
| 显式 OCR 审查 | `/ae-ocr` |
| 创建技能 | `/ae-skill-creator` |
| 提示词优化 | `/ae-prompt-optimize` |
| 创建代理 | `/ae-agent-creator` |
| 安装或更新 AE 插件 | `/ae-install` |
| 卸载 AE 插件 | `/ae-uninstall` |

配置合并和模型场景路由见 [docs/builtin-config.md](docs/builtin-config.md)，分支安装边界见 [README.opencode.md](README.opencode.md)。

## 工作规则

| 规则 | 说明 |
| --- | --- |
| 需求不清先澄清 | 复杂实现前先产出需求或设计，避免直接编码 |
| 审查先定范围 | 代码、文档或通用混合范围按目标类型选择审查代理 |
| 交付必须验证 | `/ae-work` 交付前检查验证、审查和 Git 授权证据 |
| 浏览器验证 | 通过 `/ae-playwright` 和 Playwright CLI 执行；CLI 不可用时如实记录未验证 |
| Git 写操作需授权 | 提交、拉取、重置、清理、变基、推送等都需要明确授权；`/ae-commit` 不等同于 push |
| 远程写操作不默认提供 | 用户侧流程不提供 push、创建 PR、创建 Issue 或 Release 的可复制流程 |

## 资产快照

| 类型 | 当前快照 | 真源 |
| --- | ---: | --- |
| 技能 | 28 | `src/assets/skills/`、`src/schemas/ae-asset-schema.ts` |
| 命令 | 37 | `src/services/command-registration.ts`、`src/assets/commands/` |
| 代理 | 50 | `src/assets/agents/`、`src/services/agent-registration.ts` |
| 工具 | 23 | `src/tools/` |
| 规则 | 6 | `src/assets/rules/` |
| 内置配置 | 1 | `src/assets/config/ae.jsonc` |

该表是文档快照，不替代 `/ae-help`。

## 配置

AE 默认注入两个远程 MCP：

| 名称 | 作用 |
| --- | --- |
| `context7` | 获取库/框架文档 |
| `gh_grep` | 搜索真实 GitHub 代码示例 |

可选配置入口：

| 路径 | 作用 |
| --- | --- |
| `.opencode/ae.jsonc` | 当前项目覆盖 AE 内置配置 |
| `~/.config/opencode/ae.jsonc` | 当前用户的全局默认配置 |

示例：

```jsonc
{
  "$schema": "https://raw.giteeusercontent.com/jiangqiang1996/ai-agent-engine/raw/master/src/assets/config/ae.schema.json",
  "modelScenarios": {
    "quick": "provider/fast-model",
    "standard": "provider/default-model",
    "deep": "provider/strong-model",
    "vision": "provider/vision-model"
  }
}
```

完整规则见 [docs/builtin-config.md](docs/builtin-config.md)。

## 开发

本仓库是 AE opencode 插件源码仓库。`dist/` 是构建产物，`.opencode/plugins/` 是本仓库调试桥接目录，不代表业务项目必须具备的结构。

| 操作 | 命令 |
| --- | --- |
| 安装依赖 | `npm ci` |
| 构建 | `npm run build` |
| 测试 | `npm run test` |
| 类型检查 | `npm run typecheck` |

| 路径 | 作用 |
| --- | --- |
| `src/index.ts` | server 插件入口 |
| `src/assets/skills/` | 技能提示词和参考文件 |
| `src/assets/commands/` | Markdown 命令 |
| `src/assets/agents/` | 子代理提示词 |
| `src/assets/rules/` | 注入用户会话的规则 |
| `src/tools/` | opencode 工具定义 |
| `src/services/` | 注册、门禁、审查、配置和解析服务 |
| `src/schemas/` | 资产常量和输入 schema |

## 文档入口

| 入口 | 内容 |
| --- | --- |
| [docs/builtin-config.md](docs/builtin-config.md) | MCP、`ae.jsonc`、模型场景路由和覆盖规则 |
| [README.opencode.md](README.opencode.md) | 项目级安装和分支边界 |
| [运行时移植规格](docs/superpowers/specs/2026-07-15-opencode-runtime-parity-without-office-design.md) | 上游基线、排除项和验证设计 |
| `/ae-help` | 当前运行时权威帮助 |
