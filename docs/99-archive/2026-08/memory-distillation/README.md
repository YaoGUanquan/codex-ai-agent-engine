# 记忆蒸馏归档（2026-08-11）

批次三 `tidy memoryBudget` 登记的蒸馏待办的执行记录（预算规则见 `docs/08-ai-memory/06-agent-maintenance-rules.md`：单文件约 15KB、决策日志轮换归档、只移动不删除）。

## 分片

| 分片 | 来源 | 内容 |
| --- | --- | --- |
| `05-decision-log-2026-05-to-2026-07.md` | `docs/08-ai-memory/05-decision-log.md` | 2026-05 至 2026-07 的 20 条决策全文（逐字节移动）；源文件保留日期+标题索引与 2026-08 起的 10 条 |
| `03-key-workflows-adaptation-era.md` | `docs/08-ai-memory/03-key-workflows.md` | 六个适配期工作流全文（Phase 2 图谱路由、multi-agent rollout、minimality、OCR、Claude 适配、SkillOpt 审计）；长期边界由 `08/09/10/11` 专题记忆文件、skill 正文或源文件通用节承载 |

## 效果与核对

- 迁移脚本内置断言：标题集合守恒（20+10=30 条决策；6 节工作流）、无跨期泄漏、分片逐字节包含源文本。
- 蒸馏后体积：`05-decision-log.md` 31.5KB → 14.5KB；`03-key-workflows.md` 20.1KB → 12.8KB（均低于 15KB 预算）。
- registry 的 decision-log / key-workflows 关系全部由保留条目支撑，路径未变；registry 契约限定关系目标为 `AGENTS.md` 或 `docs/ae/` 下 Markdown，故分片指针只保留在正典 Markdown（05 索引节、03 指针节、00-index 导航），不进入 registry。
- 验证命令与结果见本次会话交付说明（tidy memoryBudget 复检、check-memory-knowledge-contract、npm run check、npm test）。
