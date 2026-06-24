# Agent Skills 可吸收模式融合与战术落地路线图

## 总体策略

本文档基于 Addy Osmani 的 `agent-skills` 分析，梳理**可直接吸收的工程模式**，并将其与当前 AE-Codex 优化计划（U1-U8）对齐，最终落地为具体脚本、技能更新和治理规范。

---

## 第一部分：可吸收模式地图

| 模式 | 分类 | Agent-Skills 价值 | 建议 AE 动作 | 对应优化计划单元 | 优先级 |
|------|------|-------------------|------------|-------------|--------|
| **validate-skills.js** | 本地确定性机制 | 检查 SKILL.md、frontmatter、必需章节、description 长度、跨 skill 引用 | 新增 `scripts/check-skill-contract.mjs`，接入 `npm run check` | U8 验证 | **P0** |
| **skill-anatomy.md** | 便携工程方法 | 强调 process over prose、verification、anti-rationalization、progressive disclosure | 优化 `ae-skill-creator` 的质量门禁 | U1-U7 编写指导 | **P0** |
| **persona/skill/command 三层边界** | 便携工程方法 | persona 不互调，command 负责编排，skill 负责流程 | 优化 `ae-agent-creator` 和 `ae-review` 的委派边界说明 | U5 Expert Personas | **P1** |
| **source-driven-development** | 便携工程方法 | 框架决策必须查官方文档并引用，版本识别，未验证标注 | 新增或并入 `ae-web-app`/`ae-backend` | 新增子计划 | **P2** |
| **doubt-driven-development** | 便携工程方法 | 非平凡决策需要 fresh-context 对抗审查 | 作为 `ae-review` 的"高风险决策复核"子流程 | U2 Evidence | **P1** |
| **observability-and-instrumentation** | 便携工程方法 | 先定义 on-call 问题，再加日志/指标 | 优化 `ae-backend` 的可诊断性检查 | 新增子计划 | **P2** |
| **api-and-interface-design** | 便携工程方法 | contract-first、边界验证、统一错误语义 | 优化 `ae-backend`、`ae-swagger-parser` | 新增子计划 | **P2** |
| **hooks/sdd-cache** | 运行时专属行为 | 条件执行、缓存管理 | 不直接移植；改写为显式脚本或文档流程 | N/A | **P3** |

---

## 第二部分：优化计划与可吸收模式的对齐

### U1-U3：核心纪律与证据 ← 直接融合 validate-skills 与 skill-anatomy

| 计划单元 | 当前目标 | 增强方向 | 具体产出 |
|---------|--------|--------|--------|
| **U1** 反理性化指南 | 创建 8-12 对借口-反驳 | + skill-anatomy 的"不解释，展示运行结果" | `docs/ae/references/anti-rationalization.md` + 示例脚本输出截图 |
| **U2** 扩展 ae-review 证据 | 在 findings 加 evidence_type | + doubt-driven-development 的"高风险决策需复核" | 新增 `ae-review/references/decision-risk-checklist.md` |
| **U3** 扩展 ae-work 证据 | 后执行必须附 gate JSON | + validate-skills 的"验证 SKILL.md 自身的收缩性" | 同时生成 `work-execution-gate-template.json` |

### U4-U6：预算、角色与生命周期 ← 融合 persona 三层边界和角色清晰度

| 计划单元 | 当前目标 | 增强方向 | 具体产出 |
|---------|--------|--------|--------|
| **U4** 令牌预算 | `ae-plan` 加 per-phase 预算估算 | 用 doubt-driven 思维：大预算决策需写"为什么选这个模型/phase 分割" | `ae-plan/references/token-budget-template.md` |
| **U5** Expert Personas | 4 个 personas + 决策框架 | + persona/skill/command 三层边界：persona 只产报告，command 负责编排 | `docs/ae/references/expert-personas.md` + `persona-composition-rules.md` |
| **U6** 生命周期元数据 | skills-to-phases.json | 加 entry/exit criteria，映射到 Define/Plan/Build/Verify/Review/Ship | `docs/ae/references/phase-metadata.json` + `phase-transition-guide.md` |

### U7-U8：渐进式披露与验证 ← validate-skills 与 skill-anatomy 的最终收缩

| 计划单元 | 当前目标 | 增强方向 | 具体产出 |
|---------|--------|--------|--------|
| **U7** ae-help 渐进式披露 | 初始轻量，详情按需加载 | + skill-anatomy：references 只在需要时加载；long descriptions 移到 SKILL.md body | 更新 `ae-help/SKILL.md` + `skill-metadata-schema.json` |
| **U8** 验证与收集证据 | mirror/artifact/smoke checks | + validate-skills：新增 `check-skill-contract.mjs` 校验 SKILL.md 自身完整性 | `scripts/check-skill-contract.mjs` + 更新 `npm run check` 流程 |

---

## 第三部分：优先落地建议（四阶段）

### 🎯 第 0 阶段（热身，1 天）：创建 check-skill-contract.mjs（P0，最高 ROI）

**目标**：建立 SKILL.md 自身质量的机制化检查。这是最小可行收益，可立即接入现有 CI。

**具体步骤**：

1. 创建 `scripts/check-skill-contract.mjs`，检查：
   - 每个 SKILL.md 有 `# <skill-name>` 标题，与目录名一致
   - `description` 字段 ≤ 180 字
   - 必需章节：至少有 Purpose、When to use、Example、Key outputs
   - frontmatter（如有）的 `name` 与文件路径一致
   - 内部引用（如 `see ae-review`）的目标文件存在
   - `.agents/skills` 镜像与 `plugins/ai-agent-engine-codex/skills` 完全一致

2. 在 `npm run check` 中调用 `check-skill-contract.mjs`

3. 运行验证：
   ```bash
   node scripts/check-skill-contract.mjs
   npm run check
   ```

**关键产出**：
- `scripts/check-skill-contract.mjs`
- 更新 `package.json` 的 `check` script

**验证**：无新报错即可

---

### 🎯 第一阶段（基础纪律，2-3 天）：U1-U3 核心纪律与证据

**目标**：强化反理性化、验证证据、执行门禁。

**顺序**：

1. **U1** 创建反理性化指南 + skill-anatomy 示例
   - 文件：`docs/ae/references/anti-rationalization.md`
   - 包含 8-12 对常见借口-反驳，每对加一个"验证法"示例（如 `npm run test` 的输出）
   - 在 `ae-plan`、`ae-work`、`ae-review` SKILL.md 中链接此指南

2. **U2** 扩展 `ae-review` 证据要求
   - 修改 findings 模板，加 `evidence_type`（命令/构建/日志/手工观测）和 `evidence_reference`（文件路径/URL）
   - 新增 `ae-review/references/decision-risk-checklist.md` 用于高风险决策的对抗审查

3. **U3** 扩展 `ae-work` 执行证据
   - 后执行必须生成 `work-execution-gate-<timestamp>.json`，包含命令、输出、通过/失败状态
   - 创建模板 `ae-work/references/execution-gate-template.json`

**关键产出**：
- `docs/ae/references/anti-rationalization.md`
- `docs/ae/references/decision-risk-checklist.md`
- 更新 `.agents/skills/ae-review/SKILL.md` 和 `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`
- 更新 `.agents/skills/ae-work/SKILL.md` 和 `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`
- `ae-work/references/execution-gate-template.json`

**验证**：
```bash
node scripts/check-skill-mirror.mjs
node scripts/check-skill-contract.mjs
npm run check
```

---

### 🎯 第二阶段（预算与角色，3-4 天）：U4-U6 预算、Personas、生命周期

**目标**：显式化成本决策，清晰角色边界，映射生命周期。

**顺序**：

1. **U4** 令牌预算模板
   - 在 `ae-plan` SKILL.md 新增 "Token Budget Estimation" 章节
   - 创建 `ae-plan/references/token-budget-template.md`，包含每阶段估算（Define 2k, Plan 5k, Build 20-50k, Verify 10k, Review 10k, Ship 5k）
   - 写入示例计划显示 per-phase 分配

2. **U5** Expert Personas 与组合规则
   - 创建 `docs/ae/references/expert-personas.md`，定义 4 个 personas：
     - Code Reviewer：关注正确性、性能、安全
     - Test Engineer：关注覆盖率、边界、回归
     - Security Auditor：关注权限、数据保护、输入验证
     - Performance Auditor：关注延迟、吞吐、资源
   - 新增 `docs/ae/references/persona-composition-rules.md`：persona 不互调，只产单视角报告；编排由主会话或计划负责
   - 在 `ae-agent-creator` 和 `ae-review` SKILL.md 中链接此规则

3. **U6** 生命周期元数据
   - 创建 `docs/ae/references/skills-to-phases.json`，映射所有 43 个 skills 到 Define/Plan/Build/Verify/Review/Ship
   - 创建 `docs/ae/references/phase-transition-guide.md`，说明每阶段 entry/exit criteria

**关键产出**：
- `ae-plan/references/token-budget-template.md`
- `docs/ae/references/expert-personas.md`
- `docs/ae/references/persona-composition-rules.md`
- `docs/ae/references/skills-to-phases.json`
- `docs/ae/references/phase-transition-guide.md`
- 更新 `ae-plan`, `ae-agent-creator`, `ae-review` SKILL.md

**验证**：
```bash
node scripts/check-skill-mirror.mjs
npm run check
```

---

### 🎯 第三阶段（优化与完成，2-3 天）：U7-U8 渐进式披露与验证

**目标**：轻量化初始帮助，完成所有验证。

**顺序**：

1. **U7** 渐进式披露
   - 更新 `ae-help` SKILL.md，标记初级/进阶内容
   - 创建 `docs/ae/references/skill-metadata-schema.json`，定义 `description`（简短）vs `full_description`（详细）分层
   - 长 descriptions 移入 SKILL.md 主体或 references/

2. **U8** 最终验证
   - 运行所有 check 脚本
   - 手工验证 mirror 一致性
   - 验证反理性化指南、personas、生命周期元数据可访问且格式正确
   - 创建验证总结 `docs/ae/verification/2026-06-24-agent-skills-adaptation-verification.md`

**关键产出**：
- 更新 `ae-help/SKILL.md`
- `docs/ae/references/skill-metadata-schema.json`
- `docs/ae/verification/2026-06-24-agent-skills-adaptation-verification.md`

**验证**：
```bash
node scripts/check-skill-contract.mjs
node scripts/check-skill-mirror.mjs
node scripts/check-skill-language-metadata.mjs
node scripts/check-ae-artifacts.mjs
npm run check
```

---

## 第四部分：可选的领域技能扩展（P2，后续迭代）

基于 agent-skills，有 3 个领域最适合作为 AE 现有技能的**增强章节**，而非新建 skill（避免目录膨胀）：

### 1. Source-Driven Development → 强化 ae-web-app, ae-backend

**当前**：技能给通用指导。  
**增强**：加"官方文档优先"的检查清单。

**产出**：
- `ae-web-app/references/source-driven-checklist.md`（框架版本、官方示例、API 稳定性校验）
- `ae-backend/references/source-driven-checklist.md`（库文档、API 契约、弃用警告）

---

### 2. Observability & Instrumentation → 强化 ae-backend

**当前**：技能关注功能实现。  
**增强**：加"可观测性优先"的设计步骤。

**产出**：
- `ae-backend/references/observability-first-checklist.md`
  - 先定义：哪些问题 on-call 会遇到（如超时、数据不一致、权限拒绝）
  - 再设计：日志、指标、trace 来诊断这些问题
  - 包含日志级别、指标命名、trace span 结构示例

---

### 3. API & Interface Design → 强化 ae-backend, ae-swagger-parser

**当前**：技能关注实现。  
**增强**：加 contract-first 的边界验证。

**产出**：
- `ae-backend/references/contract-first-design.md`
  - 先写 OpenAPI，再实现
  - 边界验证清单（输入范围、错误响应、版本兼容性）
  - 统一错误语义示例

---

## 第五部分：实施时间表

| 阶段 | 工作项 | 时间 | 关键路径 |
|------|--------|------|--------|
| **第 0 阶段** | check-skill-contract.mjs（P0） | 1 天 | 必做 |
| **第 1 阶段** | U1-U3 核心纪律 | 2-3 天 | 必做 |
| **第 2 阶段** | U4-U6 预算与角色 | 3-4 天 | 必做 |
| **第 3 阶段** | U7-U8 渐进式披露 | 2-3 天 | 必做 |
| **第 4 阶段**（可选） | source-driven, observability, API 章节 | 3-5 天 | 可后续迭代 |

**总计**：8-13 天（关键路径），+3-5 天（可选领域增强）

---

## 第六部分：成功指标

实施完成后，应观察到：

1. ✅ `npm run check` 包含 `check-skill-contract.mjs`，无报错
2. ✅ 团队在计划、审查、执行时主动引用反理性化指南
3. ✅ `ae-review` findings 中每条都有 evidence_type 和 evidence_reference
4. ✅ `ae-work` 完成后生成 execution gate JSON
5. ✅ 大型计划（>30k token）包含 per-phase 预算估算
6. ✅ 多 agent 委派时提及 persona 组合规则
7. ✅ 新增技能时参考 skills-to-phases.json 确保生命周期映射
8. ✅ `ae-help` 初始输出更轻量，详细内容可按需加载

---

## 第七部分：与现有 Constitution 的对齐

本战术路线图强化了 **Constitution Principle 5**（验证证据前完成声明）：

| 原则 | 当前支持 | 本计划增强 |
|------|--------|----------|
| **Principle 1** 运行时边界 | ✓ | 不变 |
| **Principle 2** Source/Mirror 一致 | ✓ | + check-skill-contract 验证 |
| **Principle 3** 需求优先 | ✓ | 不变 |
| **Principle 4** 可追溯性 | ✓ | + 生命周期元数据 |
| **Principle 5** 验证证据 | ⚠️ 需加强 | **🔥 重点强化**：evidence_type, execution gate |
| **Principle 6** UTF-8 | ✓ | 不变 |

---

## 附录：快速参考

### 为什么这样优先级？

1. **P0 check-skill-contract**：最小投入，最大收益。SKILL.md 自身质量直接影响所有 43 个技能的可用性。
2. **P1 U1-U3**：反理性化 + 证据是 AE 纪律的核心，其他单元依赖这个基础。
3. **P1 U4-U6**：预算、角色、生命周期直接支撑多 agent 编排和规模化。
4. **P2 领域增强**：可以在 P0-P1 完成后作为持续改进，不阻塞核心流程。

### 常见问题

**Q: 这会不会让 SKILL.md 变得太重？**  
A: 不会。我们把长内容移到 `references/` 子目录，SKILL.md 保持简洁。`ae-help` 的渐进式披露（U7）就是为了处理这个问题。

**Q: 检查脚本会不会很复杂？**  
A: `check-skill-contract.mjs` 可以控制在 100-150 行，和现有 `check-skill-mirror.mjs` 风格一致，不会引入维护负担。

**Q: 什么时候可以看到效果？**  
A: 第 0 阶段（1 天）完成后，`npm run check` 就能捕获 SKILL.md 问题。第 1 阶段（2-3 天）后，反理性化指南和证据要求开始生效。

---

**文档所有者**：AI Agent Engine Optimization  
**创建日期**：2026-06-24  
**状态**：战术路线图已定，可开始执行  
**优先级**：P0(第0阶段) → P0(第1-3阶段) → P2(可选领域)
