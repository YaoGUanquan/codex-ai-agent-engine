---
type: prd
status: drafted
date: 2026-08-17
topic: document-encoding-evidence-governance
format: human-readable-requirements
sharded: false
---

# 文档编码证据治理 PRD

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

PowerShell 的渲染编码曾使有效中文文档看似乱码。严格 UTF-8 字节解码已确认 `docs/` 下 516 个文档、配置与测试数据文本文件均可解码且无 `U+FFFD`。需保留此证据与维护边界，避免无证据批量重写。

## Requirements

- R1. 建立可追溯的编码证据记录，明确扫描类型、文件数、严格解码和替换字符检查结果。  
  Acceptance: 记录说明 516 个 `docs/` 文本文件、0 个解码失败、0 个含 `U+FFFD` 文件，并注明其不证明 PowerShell 渲染健康。
- R2. 明确有效文档不得因默认 PowerShell 输出或乱码预览被批量重写；新增文档采用 UTF-8 无 BOM，除非目标工具要求 BOM。  
  Acceptance: 工件要求先进行显式 UTF-8 或字节级验证，并将批量重写列为非目标。
- R3. 在 AI 记忆注册表和维护图谱声明证据、PRD、设计与计划关系。  
  Acceptance: `node scripts/check-memory-knowledge-contract.mjs --root .` 通过，目标记忆可查询到声明关系。

## Non-Functional Requirements

- NFR1. 证据只保留可复现命令形状、汇总计数、仓库相对路径和证明边界。  
  Acceptance: 无控制台状态、凭据或未验证编码推断进入工件。
- NFR2. 本次不重写已验证的规则或业务文档内容，不修改插件分发内容、版本和发布说明；记忆索引、注册表和图谱仅允许为本次证据追加登记。  
  Acceptance: 变更仅包含新增工作流工件及图谱/记忆的追加式登记。

## Scope Boundary

### In Scope

- 探索、PRD、设计、计划、图谱与记忆登记。

### Out Of Scope

- 批量改写、新脚本、CI、依赖、版本升级。

### Constraints

- 复用 `docs/00-process/templates/encoding-rules.md` 的正典规则；新增文本采用 UTF-8 无 BOM。

## Key Decisions

- D1. 使用严格字节解码证据和长期登记，不做批量修复。  
  Reason: 文件内容已验证有效，问题在输出层。
- D2. 自动门禁独立延后。  
  Reason: 当前没有足以证明新增维护成本合理的回归信号。

## Dependencies And Assumptions

### Dependencies

- 编码规则正典与 `00-registry.json` 的现有关系模型。

### Assumptions

- 本次扫描后的 `docs/` 是所声明证据的完整范围。

## Open Questions

### Deferred To Planning

- Q1. [Affects R2][technical] 真实回归发生后是否增加严格 UTF-8 检查器。

## Evidence Notes

- Strict scan -> Node `TextDecoder('utf-8', { fatal: true })` over declared text extensions; observed 516 files, 0 failures, 0 replacement files on 2026-08-17.
- Existing rule -> `docs/00-process/templates/encoding-rules.md`.

## Consistency Check

- requirementsCount: 3
- nonFunctionalRequirementsCount: 2
- decisionsCount: 2
- openQuestionsCount: 1
