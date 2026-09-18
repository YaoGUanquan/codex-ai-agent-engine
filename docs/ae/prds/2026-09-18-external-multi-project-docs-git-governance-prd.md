---
type: prd
status: drafted
date: 2026-09-18
title: external-multi-project-docs-git-governance
origin: user-confirmed
originFingerprint: external-multi-project-docs-git-governance
topic: external-multi-project-docs-git-governance
format: human-readable-requirements
sharded: false
---

# 外置多项目多分支文档与 Git 治理需求

## 1. Problem

项目当前把 AE 文档模型与项目根目录 `docs/`、Git 分支和本地工作区耦合在一起。多项目、多分支、多 worktree 并行时，会产生文档覆盖、分支删除后资料丢失、合并后共享知识未同步、以及无法区分 Git 已合并和文档已归并的问题。

## 2. Goals

- 文档根目录由用户明确选择，不在项目根目录自动创建完整 `docs/`。
- 一个外部文档根目录支持多个项目和每个项目的多个 Git 分支。
- 每个活动分支拥有隔离的文档工作区。
- Git 分支的创建、切换、提交、推送、MR、评审、合并、冲突处理、回滚和删除都有明确的 docs 联动步骤。
- 合并 Git 分支时，将选定相关文档归并到目标分支空间，按需归档过程资料；不静默覆盖冲突，不自动提升到共享区。
- 阿里工程质量要求只作为编码、异常、日志、数据库和验证质量参考；Git 分支模型以云效 Codeup 的长期集成分支、动态发布分支、保护分支、MR 评审和 CI 卡点为依据。

## 3. Non-goals

- 不伪造 Codeup API、钩子或 CI 平台自动化。
- 不把用户绝对路径提交到 Git。
- 不自动删除旧项目根目录 `docs/`。
- 不把所有分支文档直接复制到共享区。

## 4. Document layout

```text
<AE_DOCS_HOME>/projects/<project-id>/
  project-manifest.json
  branches/<branch-key>/
    branch-manifest.json
    docs/
      ae/
      00-process/active/
  archive/<YYYY-MM>/
  migrations/
```

`project-id`、原始 Git 分支名、提交范围和归并状态写入清单；`branch-key` 只用于安全路径。

## 5. Acceptance criteria

- 初始化没有用户确认的外部根目录时只返回预览/阻断信息，不生成文档。
- 同一外部根目录可注册多个项目，项目之间没有路径碰撞。
- 同一项目的不同分支不能写入同一活动分支目录。
- 合并前检查目标分支、Git 状态、验证证据、分支文档清单和冲突；不满足条件时不宣称完成。
- 合并归并仅处理经审查的相关文档，目标为目标分支 docs；归档不自动删除源资料。
- 同路径内容冲突、清单缺失或归并基线缺失时不得猜测覆盖；无基线只允许已审查新路径加入或同内容去重。
- 老项目迁移采用预检、清单、复制校验、注册切换、用户确认删除五步，默认保留旧文件。
- 所有新增治理规则同步插件源与 `.ae-source` 镜像，并有静态/合同测试覆盖。
- 版本发布必要的 SQL/迁移代码保留仓库并纳入 Git，沿用已有迁移框架；临时查询与脱敏执行记录才放外部 docs。Git 合并、SQL 纳管和各环境执行状态分别验收。

## 6. Open boundaries

- 外部根目录配置保存在用户级配置，不进入项目 Git；项目只保留稳定 `project-id` 和相对文档契约。
- Git 远端保护分支、MR 审批人数和 CI 卡点由 Codeup/托管平台配置，AE 只检查证据并报告缺失。
- 本轮实际交付为项目规则、需求与计划，以及本机外部工具/规则配置；可分发插件适配仍未实施，不能把本机配置当作插件能力。上述插件镜像验收项留待插件实施阶段。
