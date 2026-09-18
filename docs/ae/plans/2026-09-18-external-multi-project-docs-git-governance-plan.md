---
type: plan
status: drafted
date: 2026-09-18
title: external-multi-project-docs-git-governance
origin: docs/ae/prds/2026-09-18-external-multi-project-docs-git-governance-prd.md
originFingerprint: external-multi-project-docs-git-governance
depth: standard
format: human-readable-plan
sharded: false
---

# Implementation Plan

## Current delivery scope

2026-09-18：本轮仅交付项目级 Git/docs/SQL 治理规则与需求/计划校正。本机公共配置和外部解析器不在本仓库交付范围；U1/U2 的插件与模板适配仍为计划，未实施。插件版本保持不变，不能宣称外部文档运行时已在分发插件中实现。正式需求及本计划随本次授权纳入仓库版本管理，不迁出。

## Decision

采用外部文档根目录和项目/分支命名空间。Git 历史是提交事实源，外部 docs manifest 是文档归并事实源；两者必须通过 commit range、base/head 和归并状态相互引用。采用“合并前冻结、合并后归并到目标分支/归档”的流程，不依赖静默同步。已跟踪正式文档及版本必要 SQL 保留仓库，外部资料仅按相关清单归并。

## Alternatives

- 所有文档一律写入仓库 `docs/`：不能满足本地过程文档的独立管理需求，拒绝；正式纳管文档仍保留仓库。
- 每个项目单独指定任意外部目录：隔离好，但缺少统一用户级根目录和项目索引，拒绝。
- 外部统一根目录下按项目和分支隔离：满足用户目标，路径可审计，选择。

## Units

### U1 - Git 与文档治理契约

- Covers: R1-R8, AC1-AC8
- Depends on: none
- Files: `plugins/ai-agent-engine-codex/skills/ae-work/references/git-and-docs-governance.md`, `.ae-source/skills/ae-work/references/git-and-docs-governance.md`, `plugins/ai-agent-engine-codex/skills/ae-work/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-lfg/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md`, `plugins/ai-agent-engine-codex/skills/ae-plan/SKILL.md`
- Forbidden: Git commit/push/merge, user global config, unrelated docs
- Validation: mirror check, skill contract check, manual document review
- Rollback: remove the new reference and its links

### U2 - Project documentation templates and repository guidance

- Covers: AC1-AC7
- Depends on: U1
- Files: `docs/00-process/templates/external-docs-branch-manifest-template.md`, `docs/00-process/templates/archive-rules.md`, `README.md`, `README.en.md`
- Forbidden: absolute user paths, automatic migration/deletion
- Validation: UTF-8, `git diff --check`, contract checks
- Rollback: restore only task-owned template/guidance sections

### U3 - Verification

- Covers: AC8
- Depends on: U1, U2
- Files: focused tests only if an existing contract needs extension
- Validation: `npm run test`, `npm run check`
- Rollback: none

## Validation boundary

Static and focused checks can prove the written contract and source/mirror parity. They do not prove Codeup branch protection, remote MR approval, CI execution, or user-confirmed external filesystem migration; those remain unverified until a user performs the runtime operations.
