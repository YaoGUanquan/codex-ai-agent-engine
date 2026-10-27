# AI Agent Engine for Codex

为 Codex 提供七项工程技能：澄清需求、开发前后端功能，以及编写和执行测试。

安装后，在对话中明确点名所需技能即可使用。例如：`$ae-backend 排查订单重复创建问题`。

**当前版本：`0.5.0`** · [English](README.en.md) · [安装与迁移](INSTALL.zh-CN.md) · [更新记录](CHANGELOG.md)

## 功能介绍

| 你要做什么 | 使用哪个技能 |
| --- | --- |
| 把模糊需求整理成可执行方案和验收标准 | `ae-grill` |
| 开发或修复前端页面、交互 | `ae-frontend` |
| 实现后端服务、接口，排查问题根因 | `ae-backend` |
| 为函数或模块补充单元测试并执行 | `ae-unit-test` |
| 验证接口、认证、数据持久化等环节的配合 | `ae-integration-test` |
| 编写或执行浏览器端到端测试用例 | `ae-e2e-test` |
| 建设端到端测试基础设施、套件和持续集成 | `ae-e2e-suite` |

七个技能可以分别安装、分别调用。使用一个技能不要求安装其余技能，也不会默认启动完整开发流程或多个代理。

## 安装

### 环境要求

- Node.js 20 或更高版本。
- 支持 Agent Skills 的宿主，例如已接入技能目录的 Codex。
- 能够访问 GitHub 和 npm。

### 安装到当前项目

在项目目录打开终端，执行：

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s '*'
```

这会通过标准 [skills CLI](https://www.npmjs.com/package/skills) 安装七个技能。安装完成后，在宿主的技能列表中确认出现 `ae-*` 技能。

只安装某个技能：

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s ae-backend
```

### 安装到用户级

需要在多个项目中使用时，可以安装到用户级：

```bash
npx skills add YaoGUanquan/codex-ai-agent-engine -g -y -s '*'
```

列出可安装技能、手动复制、npm 安装和卸载等操作，见[完整安装说明](INSTALL.zh-CN.md)。

## 快速使用

在 Codex 对话中输入技能名和具体任务：

```text
$ae-grill 我要改造登录流程，请先帮我明确需求和验收标准。
```

```text
$ae-frontend 实现订单列表的状态筛选，沿用项目现有组件和样式。
```

```text
$ae-backend 排查重复提交导致的订单重复创建问题，并修复根因。
```

```text
$ae-unit-test 为订单金额计算补充边界测试，并执行相关用例。
```

测试类任务也可以单独调用：

```text
$ae-integration-test 验证下单到支付的接口交互和数据持久化。
```

```text
$ae-e2e-test mode=test-only 运行现有结账流程的浏览器测试。
```

```text
$ae-e2e-suite 整理项目的端到端测试套件和持续集成配置。
```

请说明预期结果、修改范围，以及可用的测试环境。涉及外部服务、数据库或浏览器的任务，需要相应环境和权限才能完成验证。

## 常见问题

### 这是一个完整应用或 Codex 插件吗？

当前版本是 **Agent Skills 技能集合**，通过宿主加载技能文件工作。无需启动独立服务。`0.5.0` 已替代旧版的插件和专用安装脚本。

### 安装后会自动执行所有技能吗？

不会。需要在对话中明确点名技能，例如 `$ae-frontend` 或 `使用 ae-grill`。不会因为任务看起来相关，就默认启动全流程或多个代理。

### 可以只复制一个技能吗？

可以。完整复制 `skills/<技能名>/` 目录，并保留其中的 `SKILL.md` 和 `references/`，放到宿主对应的技能目录即可。

### 怎样从旧版升级？

如果仍在使用旧插件或旧安装脚本，先在宿主中移除旧入口，再用上面的 skills CLI 安装。不要同时保留同名旧技能。

个人文档、记忆、配置和备份请保留。本项目不会自动清理这些数据。详细步骤见[安装与迁移](INSTALL.zh-CN.md)。

### 技能会自动提交代码或部署吗？

调用技能不等于授权 Git 提交、推送、合并、部署或真实数据库写入。这些操作仍需用户明确授权。

### 安装成功是否代表所有功能都已验证？

安装成功表示技能文件已安装。实际执行效果还取决于宿主、模型、项目代码和测试环境。静态检查通过不能代替真实接口、浏览器或生产环境验收。

## 开发

以下内容面向修改技能或维护仓库的开发者，普通使用无需执行。

```bash
npm install
npm test
npm run check
npm run check:smoke
```

`check` 验证语法、技能元数据、资源引用、仓库结构、版本说明和公开内容边界；`check:smoke` 执行烟测。

### 仓库结构

```text
skills/       七项技能及各自的参考资源
tools/        仓库校验和测试工具
tests/        回归测试
docs/         公开模板、参考资料和发布清单
```

技能修改以 `skills/` 为唯一来源。每个技能的资源需要完整包含在自己的目录中。npm 安装包仅分发 `skills/`、`LICENSE` 和 `NOTICE.md`。

个人过程记录、交接和长期记忆不写入本公开仓库。开发规则见 [AGENTS.md](AGENTS.md)，发布前检查见[发布清单](docs/release-checklist.md)。

## 最近更新

### 0.5.0（2026-10-21）

- 改为七项可独立安装和使用的工程技能。
- 使用标准 skills CLI 安装，替代旧插件和专用安装、更新脚本。
- 移除旧版的隐式调用档位和编排运行机制，保留明确点名后的技能调用。

完整版本历史与迁移背景见 [CHANGELOG.md](CHANGELOG.md)。

## 问题反馈

请通过 [GitHub Issues](https://github.com/YaoGUanquan/codex-ai-agent-engine/issues)反馈问题，并提供版本、宿主、调用的技能、复现步骤和预期结果。日志和截图中请隐藏密钥及私人信息。

## 许可证与致谢

本项目使用 **GPL-2.0-only**，许可证和来源说明见 [LICENSE](LICENSE)、[NOTICE.md](NOTICE.md)。

能力划分参考 [AI Agent Engine](https://gitee.com/jiangqiang1996/ai-agent-engine)，技能指令由本项目独立实现。
