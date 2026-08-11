<!-- ae-codex:init managed -->
# AI 记忆索引

## 目的

- 这里是当前项目的标准长期 AI 记忆库。
- 只沉淀稳定、可复用、跨会话仍有价值的知识。
- 不记录一次性调试日志、临时命令输出或未确认猜测。

## 文件导航

- `00-registry.json`：经人工维护的机器可读元数据与证据关系；Markdown 记忆仍是唯一权威来源。
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
- `12-codex-skill-slash-discoverability.md`：Codex skill-backed discoverability decision, wording boundaries, and validation workflow.
- `13-review-inventory-and-advisory-impact.md`：审查文件清单、顾问式影响分析和证据边界。
- Frontend motion governance is recorded in `03-key-workflows.md`, `05-decision-log.md`, and `docs/ae/experience/2026-07-28-frontend-motion-governance.md`.
- Authenticated API smoke fillable request-config handoff is recorded in `03-key-workflows.md`, `04-known-pitfalls.md`, `05-decision-log.md`, and `docs/ae/experience/2026-08-10-api-smoke-fillable-request-config.md`.
- Per-user global AE migration, project-data locality, and personal-plugin discovery are recorded in `03-key-workflows.md`, `04-known-pitfalls.md`, `05-decision-log.md`, and `docs/ae/experience/2026-08-10-global-project-install-migration.md`.
- Structural debt refactor (ae-tools split, layered check, domain tests, import-cycle guard) is recorded in `02-architecture-boundaries.md`, `03-key-workflows.md`, `04-known-pitfalls.md`, `05-decision-log.md`, `docs/ae/references/ae-tools-module-layout.md`, and `docs/ae/experience/2026-08-11-structural-debt-refactor.md`.
- Frontend skill optimization (0.3.18–0.3.19, four frameworks + cross-skill lenses) is recorded in `03-key-workflows.md`, `05-decision-log.md`, and `docs/ae/experience/2026-08-11-frontend-skill-optimization.md` (commit `a51ef3c`).
- Fullstack skill optimization (backend language guides, FE/BE contract checklist, debug/sql safety) is recorded in `02-architecture-boundaries.md`, `03-key-workflows.md`, `05-decision-log.md`, `docs/ae/experience/2026-08-11-fullstack-skill-optimization.md`, and plan `docs/ae/plans/2026-08-11-002-fullstack-skill-optimization-plan.md`.
- Maintainer knowledge graph: declared relations in `00-registry.json`; human map in `docs/ae/graphs/maintainer-artifact-graph.md`; directory boundary in `docs/ae/graphs/README.md`. Shallow CLI graphs remain read-only (no `graph.json` persistence).
- Next planned batch: knowledge-base governance PRD (`docs/ae/prds/2026-08-11-knowledge-base-governance-prd.md`, target 0.3.22).
- `99-prompt-template.md`：初始化或维护记忆库的提示词模板。

## 维护规则

开始任务时先读本索引，再按主题读取相关文件。任务结束时判断是否产生新的稳定知识；没有则说明本次无需更新 AI 记忆库。

## 2026-06-19 Addendum

- Claude Code best-practice adaptation is recorded in `03-key-workflows.md`, `05-decision-log.md`, and `docs/ae/experience/2026-06-19-claude-code-best-practice-adaptation.md` rather than a separate memory file.
