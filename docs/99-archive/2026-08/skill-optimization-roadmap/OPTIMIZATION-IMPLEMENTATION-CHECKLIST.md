# Agent Skills 优化实施检查清单

**文档目的**：为团队提供阶段性的实施检查清单，确保所有可吸收模式的落地与验证。

**使用方式**：每个阶段开始前勾选；每个任务完成时更新状态；每个验证通过时标记✓。

---

## 总体实施时间表

| 阶段 | 工作项 | 预计时间 | 状态 |
|------|--------|--------|------|
| **第 0 阶段** | check-skill-contract.mjs（P0） | 1 天 | ⏳ Pending |
| **第 1 阶段** | U1-U3 核心纪律与证据 | 2-3 天 | ⏳ Pending |
| **第 2 阶段** | U4-U6 预算、角色、生命周期 | 3-4 天 | ⏳ Pending |
| **第 3 阶段** | U7-U8 渐进式披露与最终验证 | 2-3 天 | ⏳ Pending |
| **可选** | 领域技能增强（source-driven, observability, API） | 3-5 天 | ⏳ Pending |

**总计**：8-13 天（关键路径）

---

## 第 0 阶段：热身（check-skill-contract.mjs，P0）

### 目标
建立 SKILL.md 自身质量的机制化检查。

### 具体任务

- [ ] **T0.1** 创建 `scripts/check-skill-contract.mjs`
  - [ ] 检查每个 SKILL.md 有 `# <skill-name>` 标题
  - [ ] 验证目录名与标题名一致
  - [ ] 检查 description 字段 ≤ 180 字
  - [ ] 检查必需章节：Purpose / When to use / Example / Key outputs
  - [ ] 检查 frontmatter 的 `name` 与文件路径一致
  - [ ] 检查内部引用目标文件存在（如 `see ae-review`）
  - [ ] 验证 `.agents/skills` 镜像与 `plugins/ai-agent-engine-codex/skills` 完全一致
  - 预计时间：3-4 小时
  - 关键依赖：无
  - 验证命令：`node scripts/check-skill-contract.mjs`

- [ ] **T0.2** 集成到 `npm run check`
  - [ ] 打开 `package.json`
  - [ ] 在 `check` script 中添加 `node scripts/check-skill-contract.mjs`
  - [ ] 验证语法正确
  - 预计时间：30 分钟
  - 验证命令：`npm run check`

- [ ] **T0.3** 执行初始验证
  ```bash
  node scripts/check-skill-contract.mjs
  npm run check
  ```
  - [ ] 无新报错
  - [ ] 所有现存 SKILL.md 符合规范
  - 预计时间：30 分钟

### 产出物

| 文件 | 类型 | 状态 |
|------|------|------|
| `scripts/check-skill-contract.mjs` | 新建 | ⏳ |
| `package.json` (check script) | 修改 | ⏳ |

### 验证标记

- [ ] `npm run check` 成功运行，无新报错
- [ ] 提交信息：`feat: add check-skill-contract.mjs for SKILL.md quality validation`

---

## 第 1 阶段：核心纪律与证据（U1-U3）

### 目标
强化反理性化、验证证据、执行门禁。

### U1：反理性化指南 + Skill Anatomy

- [ ] **U1.1** 创建 `docs/ae/references/anti-rationalization.md`
  - [ ] 8-12 对常见借口-反驳
  - [ ] 每对加一个"验证法"示例（如 `npm run test` 的输出）
  - [ ] 包含示例脚本输出截图或日志
  - [ ] 编写完整性检查
  - 预计时间：2-3 小时
  - 关键参考：`docs/ae/constitution.md` Principle 5

- [ ] **U1.2** 在 AE 技能中链接反理性化指南
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - [ ] 编辑 `.agents/skills/ae-plan/SKILL.md`（镜像）
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - [ ] 编辑 `.agents/skills/ae-work/SKILL.md`（镜像）
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - [ ] 编辑 `.agents/skills/ae-review/SKILL.md`（镜像）
  - 预计时间：2-3 小时

- [ ] **U1.3** 验证 mirror 一致性
  ```bash
  node scripts/check-skill-mirror.mjs
  node scripts/check-skill-contract.mjs
  ```
  - [ ] 两个脚本都通过
  - 预计时间：30 分钟

### U2：扩展 ae-review 证据要求

- [ ] **U2.1** 创建 `docs/ae/references/decision-risk-checklist.md`
  - [ ] 定义"高风险决策"的标准（如：跨模块重构、性能关键路径、安全边界）
  - [ ] 给出对抗审查的提问清单
  - [ ] 包含 doubt-driven-development 的框架说明
  - 预计时间：2 小时

- [ ] **U2.2** 更新 ae-review 的 findings 模板
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - [ ] 加入 `evidence_type` 字段（命令 / 构建 / 日志 / 手工观测）
  - [ ] 加入 `evidence_reference` 字段（文件路径 / URL）
  - [ ] 编辑 `.agents/skills/ae-review/SKILL.md`（镜像）
  - 预计时间：2 小时

- [ ] **U2.3** 验证
  ```bash
  node scripts/check-skill-mirror.mjs
  node scripts/check-skill-contract.mjs
  npm run check
  ```
  - [ ] 通过
  - 预计时间：30 分钟

### U3：扩展 ae-work 执行证据

- [ ] **U3.1** 创建 `ae-work/references/execution-gate-template.json`
  - [ ] 定义 gate JSON 的模式（命令、输出、通过/失败、时间戳）
  - [ ] 给出填充示例
  - 预计时间：1.5 小时

- [ ] **U3.2** 更新 ae-work SKILL.md
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
  - [ ] 加入"Post-Execution Evidence"章节
  - [ ] 说明必须生成 `work-execution-gate-<timestamp>.json`
  - [ ] 编辑 `.agents/skills/ae-work/SKILL.md`（镜像）
  - 预计时间：1.5 小时

- [ ] **U3.3** 验证
  ```bash
  node scripts/check-skill-mirror.mjs
  node scripts/check-skill-contract.mjs
  npm run check
  ```
  - [ ] 通过
  - 预计时间：30 分钟

### 第 1 阶段产出物

| 文件 | 类型 | 状态 |
|------|------|------|
| `docs/ae/references/anti-rationalization.md` | 新建 | ⏳ |
| `docs/ae/references/decision-risk-checklist.md` | 新建 | ⏳ |
| `ae-work/references/execution-gate-template.json` | 新建 | ⏳ |
| `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md` | 修改 | ⏳ |
| `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md` | 修改 | ⏳ |
| `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` | 修改 | ⏳ |
| `.agents/skills/ae-plan/SKILL.md` | 修改 | ⏳ |
| `.agents/skills/ae-work/SKILL.md` | 修改 | ⏳ |
| `.agents/skills/ae-review/SKILL.md` | 修改 | ⏳ |

### 第 1 阶段验证

- [ ] 所有文件创建/修改完毕
- [ ] `node scripts/check-skill-mirror.mjs` 通过
- [ ] `node scripts/check-skill-contract.mjs` 通过
- [ ] `npm run check` 通过
- [ ] Git diff 显示所有更改都在预期范围内
- [ ] 提交信息：`feat: add anti-rationalization, evidence requirements, and execution gates (U1-U3)`

---

## 第 2 阶段：预算、角色、生命周期（U4-U6）

### 目标
显式化成本决策，清晰角色边界，映射生命周期。

### U4：令牌预算估算

- [ ] **U4.1** 创建 `ae-plan/references/token-budget-template.md`
  - [ ] 定义每阶段默认预算（Define 2k, Plan 5k, Build 20-50k, Verify 10k, Review 10k, Ship 5k）
  - [ ] 给出 per-phase 分配示例
  - [ ] 说明何时需要调整预算
  - 预计时间：2 小时

- [ ] **U4.2** 更新 ae-plan SKILL.md
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
  - [ ] 加入"Token Budget Estimation"章节
  - [ ] 链接到 token-budget-template.md
  - [ ] 编辑 `.agents/skills/ae-plan/SKILL.md`（镜像）
  - 预计时间：1.5 小时

- [ ] **U4.3** 验证
  ```bash
  node scripts/check-skill-mirror.mjs
  npm run check
  ```
  - [ ] 通过
  - 预计时间：30 分钟

### U5：Expert Personas 与组合规则

- [ ] **U5.1** 创建 `docs/ae/references/expert-personas.md`
  - [ ] 定义 4 个 personas：
    - [ ] Code Reviewer（正确性、性能、安全）
    - [ ] Test Engineer（覆盖率、边界、回归）
    - [ ] Security Auditor（权限、数据保护、输入验证）
    - [ ] Performance Auditor（延迟、吞吐、资源）
  - [ ] 每个 persona 有：决策框架、手工交接契约、优先级排序
  - 预计时间：3-4 小时

- [ ] **U5.2** 创建 `docs/ae/references/persona-composition-rules.md`
  - [ ] persona 不互调规则
  - [ ] 编排责任归主会话或计划
  - [ ] 并行编排的安全条件
  - 预计时间：1.5 小时

- [ ] **U5.3** 更新 ae-agent-creator 和 ae-review SKILL.md
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md`
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
  - [ ] 链接到 expert-personas.md 和 persona-composition-rules.md
  - [ ] 编辑镜像文件（`.agents/skills/...`）
  - 预计时间：2 小时

- [ ] **U5.4** 验证
  ```bash
  node scripts/check-skill-mirror.mjs
  npm run check
  ```
  - [ ] 通过
  - 预计时间：30 分钟

### U6：生命周期元数据

- [ ] **U6.1** 创建 `docs/ae/references/skills-to-phases.json`
  - [ ] 映射所有 43 个 skills 到 Define/Plan/Build/Verify/Review/Ship
  - [ ] 格式：`{"skill_name": "ae-plan", "phases": ["Define", "Plan"], ...}`
  - [ ] 验证完整性（覆盖 43 个）
  - 预计时间：3-4 小时

- [ ] **U6.2** 创建 `docs/ae/references/phase-transition-guide.md`
  - [ ] Define 阶段：entry/exit criteria
  - [ ] Plan 阶段：entry/exit criteria
  - [ ] Build 阶段：entry/exit criteria
  - [ ] Verify 阶段：entry/exit criteria
  - [ ] Review 阶段：entry/exit criteria
  - [ ] Ship 阶段：entry/exit criteria
  - 预计时间：2.5 小时

- [ ] **U6.3** 验证 JSON 格式和完整性
  ```bash
  node -e "const j = require('./docs/ae/references/skills-to-phases.json'); console.log('Skills:', Object.keys(j).length);"
  ```
  - [ ] 43 个 skills
  - [ ] JSON 格式有效
  - 预计时间：30 分钟

### 第 2 阶段产出物

| 文件 | 类型 | 状态 |
|------|------|------|
| `ae-plan/references/token-budget-template.md` | 新建 | ⏳ |
| `docs/ae/references/expert-personas.md` | 新建 | ⏳ |
| `docs/ae/references/persona-composition-rules.md` | 新建 | ⏳ |
| `docs/ae/references/skills-to-phases.json` | 新建 | ⏳ |
| `docs/ae/references/phase-transition-guide.md` | 新建 | ⏳ |
| `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md` | 修改 | ⏳ |
| `plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md` | 修改 | ⏳ |
| `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md` | 修改 | ⏳ |
| `.agents/skills/ae-plan/SKILL.md` | 修改 | ⏳ |
| `.agents/skills/ae-agent-creator/SKILL.md` | 修改 | ⏳ |
| `.agents/skills/ae-review/SKILL.md` | 修改 | ⏳ |

### 第 2 阶段验证

- [ ] 所有文件创建/修改完毕
- [ ] `node scripts/check-skill-mirror.mjs` 通过
- [ ] `npm run check` 通过
- [ ] `skills-to-phases.json` 包含 43 个 skills
- [ ] 所有 phase transition criteria 有明确定义
- [ ] 提交信息：`feat: add token budgeting, expert personas, and lifecycle metadata (U4-U6)`

---

## 第 3 阶段：渐进式披露与最终验证（U7-U8）

### 目标
轻量化初始帮助，完成所有验证。

### U7：渐进式披露

- [ ] **U7.1** 创建 `docs/ae/references/skill-metadata-schema.json`
  - [ ] 定义 description（简短，≤180 字）vs full_description（详细）的分层
  - [ ] 给出示例
  - [ ] 说明何时触发详细内容加载
  - 预计时间：1.5 小时

- [ ] **U7.2** 更新 ae-help SKILL.md
  - [ ] 编辑 `plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md`
  - [ ] 标记初级/进阶内容
  - [ ] 长 descriptions 移入 SKILL.md 主体或 references/
  - [ ] 编辑 `.agents/skills/ae-help/SKILL.md`（镜像）
  - 预计时间：1.5 小时

- [ ] **U7.3** 验证
  ```bash
  node scripts/check-skill-mirror.mjs
  npm run check
  ```
  - [ ] 通过
  - 预计时间：30 分钟

### U8：最终验证与收集证据

- [ ] **U8.1** 全面验证运行
  ```bash
  node scripts/check-skill-contract.mjs
  node scripts/check-skill-mirror.mjs
  node scripts/check-skill-language-metadata.mjs
  node scripts/check-ae-artifacts.mjs
  npm run check
  ```
  - [ ] check-skill-contract.mjs：通过
  - [ ] check-skill-mirror.mjs：通过
  - [ ] check-skill-language-metadata.mjs：通过
  - [ ] check-ae-artifacts.mjs：通过
  - [ ] npm run check：通过
  - 预计时间：1 小时

- [ ] **U8.2** 创建验证总结 `docs/ae/verification/2026-06-24-agent-skills-adaptation-verification.md`
  - [ ] 列出所有验证命令的输出
  - [ ] 记录任何警告或非关键问题
  - [ ] 确认 mirror 一致性
  - [ ] 确认反理性化指南可访问且格式正确
  - [ ] 确认 personas 和生命周期元数据完整
  - 预计时间：1.5 小时

- [ ] **U8.3** Git 提交与总结
  - [ ] `git status` 显示所有预期的文件更改
  - [ ] `git diff` 审查所有变更
  - [ ] 提交信息：`feat: add progressive disclosure and finalize agent-skills adaptation (U7-U8)`
  - [ ] 验证提交已推送（如适用）
  - 预计时间：1 小时

### 第 3 阶段产出物

| 文件 | 类型 | 状态 |
|------|------|------|
| `docs/ae/references/skill-metadata-schema.json` | 新建 | ⏳ |
| `docs/ae/verification/2026-06-24-agent-skills-adaptation-verification.md` | 新建 | ⏳ |
| `plugins/ai-agent-engine-codex/skills/ae-help/SKILL.md` | 修改 | ⏳ |
| `.agents/skills/ae-help/SKILL.md` | 修改 | ⏳ |

### 第 3 阶段验证

- [ ] 所有 5 个 check 脚本都通过
- [ ] 验证总结文档完整且可读
- [ ] 所有 mirror 和元数据一致
- [ ] Git history 清晰（3 个提交：P0、U1-U3、U4-U8）
- [ ] 提交信息：`feat: finalize agent-skills adaptation and verification (U7-U8)`

---

## 成功标志（验收清单）

实施完成后，应观察到：

- [ ] 1️⃣ `npm run check` 包含 `check-skill-contract.mjs`，无报错
- [ ] 2️⃣ 团队在计划、审查、执行时主动引用反理性化指南
- [ ] 3️⃣ `ae-review` findings 中每条都有 evidence_type 和 evidence_reference
- [ ] 4️⃣ `ae-work` 完成后生成 execution gate JSON
- [ ] 5️⃣ 大型计划（>30k token）包含 per-phase 预算估算
- [ ] 6️⃣ 多 agent 委派时提及 persona 组合规则
- [ ] 7️⃣ 新增技能时参考 skills-to-phases.json 确保生命周期映射
- [ ] 8️⃣ `ae-help` 初始输出更轻量，详细内容可按需加载

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `docs/OPTIMIZATION-SUMMARY.md` | 高层概览 |
| `docs/ae/prds/2026-06-24-001-agent-skills-audit-and-adaptation-prd.md` | PRD 与问题分析 |
| `docs/ae/plans/2026-06-24-001-agent-skills-audit-and-adaptation-plan.md` | 详细实现计划 |
| `docs/OPTIMIZATION-TACTICAL-ROADMAP.md` | 战术路线图与可吸收模式 |
| `docs/ae/constitution.md` | AE 治理原则 |

---

**检查清单所有者**：AI Agent Engine Optimization  
**创建日期**：2026-06-24  
**上次更新**：2026-06-24  
**状态**：就绪，可开始第 0 阶段
