<!-- ae-codex:init managed -->
# AI 记忆索引

## 目的

- 这里是当前项目的标准长期 AI 记忆库。
- 只沉淀稳定、可复用、跨会话仍有价值的知识。
- 不记录一次性调试日志、临时命令输出或未确认猜测。

## 文件导航

- `01-project-context.md`：项目定位、技术栈、路径和本地约束。
- `02-architecture-boundaries.md`：模块边界、职责边界和集成点。
- `03-key-workflows.md`：长期复用的关键流程。
- `04-known-pitfalls.md`：历史坑点、易混淆边界和编码问题。
- `05-decision-log.md`：长期有效的决策。
- `06-agent-maintenance-rules.md`：AI 读取和更新记忆的规则。
- `07-computer-use-video-skills.md`：Computer Use、图像提示和视频编辑技能的稳定边界。
- `08-phase-two-tooling.md`：Phase 2 图谱、merge、浏览器/DevTools 路由决策。
- `09-multi-agent-auto-config.md`：`multi_agent.enabled: auto` 的默认策略、升级路径和安全边界。
- `10-minimality-review.md`：Ponytail-inspired minimality gate and complexity review adaptation boundaries.
- `11-ocr-review-guidance.md`：OCR-inspired diff review discipline, rule profiles, deterministic engineering audit, and prompt pattern boundaries.
- `99-prompt-template.md`：初始化或维护记忆库的提示词模板。

## 维护规则

开始任务时先读本索引，再按主题读取相关文件。任务结束时判断是否产生新的稳定知识；没有则说明本次无需更新 AI 记忆库。

## 2026-06-19 Addendum

- Claude Code best-practice adaptation is recorded in `03-key-workflows.md`, `05-decision-log.md`, and `docs/ae/experience/2026-06-19-claude-code-best-practice-adaptation.md` rather than a separate memory file.
