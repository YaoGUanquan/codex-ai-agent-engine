<!-- ae-codex:init managed -->
# AGENTS.md

## 项目画像

- 项目：{{name}}
{{descriptionLine}}- 检测信号：
{{indicators}}
- 重要路径：
{{importantPaths}}

## 项目规则

- 修改行为前先阅读已有文档。
- 变更范围保持在当前任务内。
- 优先沿用项目已有模式，不轻易新增抽象。
- 不覆盖用户已有工作，不回退无关变更。
- AE 工作流产物记录在 `docs/ae`。
- 执行中的过程记录放在 `docs/00-process/active`。
- 已完成的过程记录归档到 `docs/00-process/archive/YYYY-MM/<task-name>` 或 `docs/99-archive/YYYY-MM/<topic>`。
- 长期 AI 记忆记录在 `docs/08-ai-memory`。

## 中文与编码规则

- 文档、JSON、YAML、SQL、脚本和生成文本统一使用 UTF-8，优先 UTF-8 无 BOM。
- PowerShell 或终端输出中文乱码时，先用显式 UTF-8 读取验证，不要直接改写文件。
- 不要仅因控制台显示乱码就重写文件，必须先确认文件字节本身确实错误。

## 验证

- 交付前运行最小且相关的验证命令。
- 如果无法验证，说明原因和剩余风险。
