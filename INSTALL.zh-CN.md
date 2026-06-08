# 安装 AI Agent Engine for Codex

这个文件用于让 Codex 代理读取并执行安装步骤。

仓库 URL 占位：`https://github.com/YaoGUanquan/codex-ai-agent-engine`

参考项目：https://gitee.com/jiangqiang1996/ai-agent-engine

本 Codex 插件参考了上面这个 Gitee AI Agent Engine 项目的工作流设计和能力模型。它不会安装或运行上游 OpenCode runtime 插件。

## 推荐：项目级安装

只安装到当前项目，不写全局 Codex 配置。

Codex 代理执行步骤：

1. 确认当前工作目录就是目标项目。
2. 在目标项目外创建临时目录。
3. 将本仓库 clone 到临时目录。
4. 运行项目级安装脚本，并把 `--target` 指向当前项目。默认技能列表元数据为双语；只有用户明确想使用单一语言时，才追加 `--lang en` 或 `--lang zh-CN`。
5. 如果用户希望初始化当前项目的项目文档和长期记忆，从目标项目目录执行 `node scripts/ae-tools.mjs init`。
6. 删除临时目录。
7. 提醒用户重启或重新打开当前项目的 Codex 对话。

PowerShell 实现：

```powershell
$repo = 'https://github.com/YaoGUanquan/codex-ai-agent-engine.git'
$target = (Get-Location).Path
$tmp = Join-Path $env:TEMP ('ae-codex-install-' + [guid]::NewGuid().ToString('N'))
git clone --depth 1 $repo $tmp
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target
Push-Location $target
node scripts\ae-tools.mjs init
Pop-Location
Remove-Item -Recurse -Force $tmp
```

单一语言技能列表元数据：

```powershell
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target --lang zh-CN
node (Join-Path $tmp 'scripts\install-project.mjs') --target $target --lang en
```

Unix shell 实现：

```bash
repo='https://github.com/YaoGUanquan/codex-ai-agent-engine.git'
target="$PWD"
tmp="$(mktemp -d)"
git clone --depth 1 "$repo" "$tmp"
node "$tmp/scripts/install-project.mjs" --target "$target"
(cd "$target" && node scripts/ae-tools.mjs init)
rm -rf "$tmp"
```

单一语言技能列表元数据：

```bash
node "$tmp/scripts/install-project.mjs" --target "$target" --lang zh-CN
node "$tmp/scripts/install-project.mjs" --target "$target" --lang en
```

默认元数据语言为 `bilingual`。支持的元数据语言：`en`、`zh-CN`、`bilingual`。

## 初始化项目文档和长期记忆

安装到目标项目后，建议再运行：

```bash
node scripts/ae-tools.mjs init
```

这个命令会生成 `AGENTS.md`、`docs/ae`、`docs/00-process`、`docs/08-ai-memory`，并保留 `docs/ai-memory` 作为兼容说明入口。

如果需要先检查会创建什么内容，可以先运行：

```bash
node scripts/ae-tools.mjs init --dry-run --lang zh-CN
```

生成的中文文档统一按 UTF-8 读写；在 PowerShell 里如果看起来乱码，要先用显式 UTF-8 读取验证，不要直接按控制台显示改写文件。

## 全局安装

默认不建议全局安装，因为 Codex 的项目级 skill/marketplace 加载行为更可控。

如果用户明确要求全局安装，先停止并询问用户要写入哪个 Codex 全局插件目录。不要猜测路径，也不要在未确认时写入全局目录。

## 更新当前项目安装

如果当前项目已经安装过本插件，可以运行：

```powershell
node scripts\update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

或：

```bash
node scripts/update-ae-codex.mjs --repo https://github.com/YaoGUanquan/codex-ai-agent-engine.git --branch main
```

更新脚本会尽量保留当前已经安装的技能列表语言；如果无法识别，默认使用双语元数据。要显式覆盖，可追加 `--lang en`、`--lang zh-CN` 或 `--lang bilingual`。

## 配置多 agent auto 模式

从已合并的 `main` 分支更新后，最新配置模板会出现在 `docs/ae/templates/ae-skill-profiles.example.yaml`。更新脚本不会覆盖 `.codex/ae-skill-profiles.yaml`，因为它是项目本地运行策略。

在目标项目中使用安全的 auto 分析默认值：

```powershell
New-Item -ItemType Directory -Force -Path .codex | Out-Null
Copy-Item docs\ae\templates\ae-skill-profiles.example.yaml .codex\ae-skill-profiles.yaml
```

或：

```bash
mkdir -p .codex
cp docs/ae/templates/ae-skill-profiles.example.yaml .codex/ae-skill-profiles.yaml
```

除非用户明确需要写入型子代理自动并行，否则保持这个基线：

```yaml
multi_agent:
  enabled: auto
  mode: suggest
  allow_write_agents: false
```

`enabled: auto` 只让 `task-analyze` 推荐并行波次，不会直接派发写入型子代理。写入型自动并行还必须显式设置 `mode: auto`、`allow_write_agents: true`，并满足 Git 清洁状态、计划依赖声明和文件不冲突等门禁。

用真实计划验证当前生效策略：

```bash
node scripts/ae-tools.mjs task-analyze --mode plan --plan docs/ae/plans/<your-plan>.md
```

## 切换技能列表语言

Codex 技能列表中的描述是静态元数据文件。切换后需要重启或重新打开当前项目的 Codex 对话：

可以像安装一样，在目标项目的 Codex 对话里让代理辅助切换。

切换为中文：

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.zh-CN.md and switch this project to zh-CN.
```

切换为英文：

```text
Fetch and follow the AE skill language switch instructions from https://raw.githubusercontent.com/YaoGUanquan/codex-ai-agent-engine/main/INSTALL.zh-CN.md and switch this project to en.
```

如需双语，把最后的 `zh-CN` 或 `en` 改成 `bilingual`。

```powershell
node scripts\set-ae-language.mjs --lang zh-CN
node scripts\set-ae-language.mjs --lang en
node scripts\set-ae-language.mjs --lang bilingual
```

## 验证

安装或更新后运行：

```bash
node scripts/ae-tools.mjs help
```

预期能看到 `ae-help`、`ae-lfg`、`ae-brainstorm`、`ae-plan`、`ae-work`、`ae-officecli`、`ae-docx`、`ae-xlsx`、`ae-pptx`、`ae-web-app`、`ae-backend`、`ae-debug`、`ae-tdd`、`ae-review`、`ae-swagger-parser`。
