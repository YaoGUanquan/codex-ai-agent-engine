# 安装与迁移（中文）

English: [INSTALL.md](INSTALL.md)

## 前置条件

- Node.js ≥ 20
- 支持 [Agent Skills](https://www.npmjs.com/package/skills) 的宿主（例如 Codex / Cursor 等已对接 skills 目录的环境）
- 网络可访问本仓库（GitHub：`YaoGUanquan/codex-ai-agent-engine`）

本仓库**不再**提供 `install-project.mjs` / `install-global.mjs` / `update-ae-codex.mjs` 或语言切换脚本。

## 用 skills CLI 安装

先核验本机 CLI（示例输出随版本变化，以 `--help` 为准）：

```bash
npx skills --help
```

常用参数（`skills` 包当前实现）：

| 参数 | 含义 |
| --- | --- |
| `add <package>` | 添加技能包（GitHub `owner/repo`、URL 等） |
| `-l, --list` | 只列出仓库内可用技能，不安装 |
| `-s, --skill` | 指定技能名；`*` 表示全部 |
| `-g, --global` | 安装到用户级，而不是当前项目 |
| `-y, --yes` | 跳过确认 |
| `-a, --agent` | 指定写入哪些 agent（`*` 表示全部） |
| `--copy` | 复制文件而非符号链接 |

### 全量安装（推荐开发机）

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s '*'
```

### 单技能安装

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s ae-backend
```

### 用户级安装

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -g -y -s '*'
```

### 手动复制

将 `skills/<name>/`（含 `SKILL.md` 与 `references/`）复制到宿主 skills 根目录下同名文件夹。每个技能必须独立闭包，不要只拷半棵目录。

## 调用

明确点名后再执行，例如：

```text
$ae-grill …
$ae-frontend mode=fix …
$ae-unit-test …
```

自然语言里偶然出现「前端」「测试」等词**不**构成调用。不要期望旧的 `none|core|all` 隐式档位。

## 从旧插件迁移

1. **识别**：仍存在 `plugins/ai-agent-engine-codex`、`.codex-plugin`、旧安装脚本，或 skills 列表中有大量已退役入口（`ae-help`、`ae-plan`、`ae-work`、`ae-lfg`、`ae-prd` 等）。
2. **停用**：在宿主设置或 skills 管理中移除旧插件/旧技能，避免与新七技能重复加载。
3. **重装**：用本文的 `npx skills add` 安装 `0.5.0` 技能；不要再执行旧更新流程。
4. **保留个人数据**：用户文档、记忆、配置、备份、journal 一律保留；本版本不会自动扫描或卸载真实个人安装。

旧入口合并去向见 [README.md](README.md)「从旧插件迁移」与 [CHANGELOG.md](CHANGELOG.md) `0.5.0`。

## 卸载与更新

```bash
npx skills remove ae-grill ae-frontend ae-backend ae-unit-test ae-integration-test ae-e2e-test ae-e2e-suite
npx skills update
```

更新仍走 skills CLI，**不**走旧插件 updater。

## 开发者本地校验（可选）

克隆本仓库后：

```bash
npm install
npm test
npm run check
npm run check:smoke
```

这些命令验证仓库合同与隔离复制，不代替真实宿主验收。
