<!-- ae-codex:init managed -->
# 关键工作流

记录需要跨任务复用的稳定流程。

## 模板

- 工作流：
- 使用场景：
- 步骤：
- 验证：
- 已知风险：

## 项目级安装后初始化

- 工作流：安装 AI Agent Engine for Codex 后，使用 `ae-init` 或 `node scripts/ae-tools.mjs init` 创建当前项目的 `AGENTS.md`、AE 产物目录、过程归档目录和长期 AI 记忆库。
- 使用场景：用户希望把 AE 能力落到某个目标项目，并让后续 Codex 会话能读取项目规则、归档规则和长期记忆。
- 步骤：
  1. 先运行项目级安装脚本，把插件文件安装到目标项目。
  2. 明确切换到目标项目目录后执行 `ae-init` 或 `node scripts/ae-tools.mjs init`。
  3. 如需中文骨架，使用 `node scripts/ae-tools.mjs init --lang zh-CN`；如需先预览，使用 `--dry-run`。
  4. 检查 `AGENTS.md`、`docs/ae`、`docs/00-process`、`docs/08-ai-memory` 和 `docs/ai-memory` 是否符合当前项目需求。
- 验证：运行 `cmd /c npm run check`、`node scripts\ae-tools.mjs init --dry-run --lang zh-CN`、`node scripts\ae-tools.mjs recovery` 和 `git diff --check`。
- 已知风险：安装文档中的 `node scripts/...` 必须在目标项目目录执行；如果仍在临时 clone 目录或其他 cwd，会初始化错误项目或找不到脚本。
