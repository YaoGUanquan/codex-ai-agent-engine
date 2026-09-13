---
type: plan
status: ready
date: 2026-09-13
title: runtime-entry-unification
depth: standard
format: human-readable-plan
sharded: false
---

# Plan: Runtime Entry Unification

## Source And Scope

用户要求先实现上一轮剩余的运行时入口统一，并显式使用 ae-lfg。范围来自 `docs/ae/solutions/2026-09-05-current-plugin-instruction-audit.md` F-004 与双语 README 路线图第 13 项。需求已在对话中明确，无需另建 PRD。

## AI Parse Contract

- canonicalKind: plan
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Requirements And Acceptance

- R1 / AC1：从明确的目标项目根解析入口，优先 `scripts/ae-tools.mjs`；仅该路径缺失时选择当前用户的全局 dispatcher。返回绝对路径，不改变 cwd、不执行目标命令。
- R2 / AC2：本地入口存在但不是普通文件、符号链接目标损坏或读取失败时明确失败。所选入口执行失败不得触发第二次执行或自动安装。
- R3 / AC3：所有活跃 skill Markdown 和 capability catalog 的 AE 命令示例使用 `node "$aeEntry"`，并能沿相对链接找到唯一 bootstrap reference。不硬编码 Codex 缓存版本和安装模式。
- R4 / AC4：help 保留原查询、分组和命令语义，显示基于本次实际成功启动路径的 PowerShell/POSIX 变量初始化。catalog 是模板，help 的已启动入口不重新切换版本。
- R5 / AC5：路径含空格和 shell 特殊字符时保持单一参数；验证 source、consumer 副本和隔离 global dispatcher。源/镜像、版本和双语发布说明同步。
- R6 / AC6：保留当前工作区第一批 0.3.45 未提交变更；本批升级至 0.3.46。真实模型路由/token 指标不从入口测试推断。

## Non-Goals And Constraints

不修改现有 wrapper、dispatcher 的命令参数、项目根发现、权限、更新和退出码语义；不创建新的命令执行 wrapper；不修改真实用户全局安装、模型目录、凭据或安全测试来获得全绿。无浏览器/API/模型实测，无提交、推送或删除旧生成物。

## Alternatives And Decision

1. 只替换为项目路径：无法覆盖 global-only 安装，拒绝。
2. 在每个技能复制 shell 选择逻辑：形成多处真源且增加上下文，拒绝。
3. 共享 reference 加一个独立只读 Node 路径解析器：采用。解析器随 `ae-help/scripts` 分发，因此 source、consumer、全局 skill 副本均能通过相对链接定位，不依赖待解析的入口启动自身。不新增依赖，不执行或转发命令。

决策驱动：可安装性、单一真源、失败可见。`$aeResolver` 是代理依据当前选中技能相对链接得到的本地绝对路径；`$aeEntry` 是只读解析结果，不是模型配置或持久化设置。

## Implementation Units

### U1 - Resolver And Bootstrap Contract

- Requirements: R1, R2, R5; AC1, AC2, AC5.
- Depends on: none.
- Files: `plugins/ai-agent-engine-codex/skills/ae-help/scripts/resolve-runtime-entry.mjs`, `plugins/ai-agent-engine-codex/skills/ae-help/references/runtime-entry.md`, matching `.ae-source/skills/ae-help` paths, `tests/runtime-entry.test.mjs`.
- Forbidden files: existing installer/dispatcher implementations, global user configuration.
- Validation: Node tests for local priority, global-only, neither, invalid file/parent, failed selected command, cwd, arguments and spaces; bootstrap snippet execution in available host shells.
- Rollback signals: any swallowed filesystem error or fallback after execution failure blocks delivery; revert only this task's additions after review.
- Deferred: unavailable OS shells are reported, not simulated as runtime proof.
- Layers: Guardrail, Distribution. Claim evidence: tests execute the resolver, not only match prose.

### U2 - Active Examples And Help

- Requirements: R3, R4; AC3, AC4.
- Depends on: U1.
- Files: active command-bearing SKILL.md and references under `ae-help`, `ae-init`, `ae-lfg`, `ae-work`, `ae-review`, `ae-claude-code`, `ae-markitdown`, `ae-static-server`, `ae-swagger-parser`, `ae-update`, `ae-skill-audit`; matching mirrors; `ae-help/references/capability-catalog.json`; `plugins/ai-agent-engine-codex/scripts/ae-tools/help.mjs`; `tests/runtime-entry.test.mjs`.
- Forbidden files: historical plans, reviews and old audit reports; non-command skill behavior.
- Validation: inventory guard rejects legacy executable prefixes, verifies bootstrap links and catalog templates, and executes help initialization with special-character paths. Existing help/skill contracts remain intact.
- Rollback signals: unbound variable in help, altered command tails or changed authorization gates block delivery.
- Deferred: no automatic repair of old external installations.
- Layers: Knowledge, Guardrail, Distribution; Delegation command spelling only, not permissions.

### U3 - Distribution And Review

- Requirements: R5, R6; AC5, AC6.
- Depends on: U1, U2.
- Files: `package.json`, plugin manifest, README/CHANGELOG bilingual pairs, task plan/review/progress artifacts; `tests/runtime-entry.test.mjs` installation fixtures.
- Forbidden files: unrelated first-batch changes, real global installation and secrets.
- Validation: `node --test tests/runtime-entry.test.mjs tests/instruction-audit.test.mjs tests/skills-docs.test.mjs`; `npm.cmd test`; `npm.cmd run check`; `npm.cmd run check:smoke`; `git diff --check`.
- Rollback signals: installation-copy drift, version mismatch, duplicate execution or prior-change loss blocks delivery.
- Deferred: real model and host discovery evidence; do not label a skipped or unavailable check passed.
- Layers: Distribution, Knowledge; no durable memory update requested.

## Risks And Validation Boundary

- Broken local install must not silently run a different global version. Test failure before and after selection separately.
- Bootstrap may be run from a skill directory instead of the target. Require target cwd or explicit `--project-root`; test cwd is unchanged and no nested-root guessing is introduced.
- Paths embedded in help may expand shell variables. Emit separately escaped PowerShell and POSIX assignments, then keep all command examples variable-based.
- Windows file-symlink fixture creation previously failed with EPERM. Keep the full-suite result visible; do not weaken tests or claim full release readiness without this gate.
- Installation tests use temporary homes and fake Codex registration only. They prove file distribution and local dispatcher execution, not desktop discovery or real global rollout.

## Consensus And Self-Review

需求：对话确认。工作树：用户批准在当前 main 执行，保留前一批未提交变更。执行：串行，无 sub-agent。开放产品决策：无；模型实测明确排除。文档 reviewer lane：验收与单元覆盖完整；architect lane：共享只读解析器替代重复执行 wrapper，边界清楚。文档审查无阻塞项，可进入 ae-work。
