---
type: prd
status: completed
date: 2026-09-27
title: plugin-scale-compatibility
origin: user-confirmed
originFingerprint: plugin-scale-compatibility-2026-09-27
topic: plugin-scale-compatibility
format: human-readable-requirements
sharded: false
---

# Plugin Scale Compatibility

## Problem Frame

当前 Codex 插件适合小型、单机、低并发项目，但在大型分布式项目、大数据量项目和大并发项目中存在系统性缺陷：扫描与解析无资源预算，任务范围识别过窄，安装更新不是原子切换，验证 gate 可能把声明当成证据，Issue/恢复/config 处理会随历史规模增长而退化，技能之间也缺少统一的规模化工程基线。

## Goals

- 让全部技能在触发规模、并发、异步、批量、分片、外部依赖或长时间运行工作时，使用同一套可复用的工程决策和证据边界。
- 让插件自身的扫描、任务分析、安装、更新、验证、Issue、恢复与配置处理具备有界资源、可诊断失败和可恢复操作语义。
- 保持现有工作流、命令入口、源/镜像分发和 v0.3.47 数据访问契约兼容。
- 将“声明”“执行”“通过”“未验证”分开，避免低层检查冒充运行时、浏览器、部署或生产证据。

## Non-Goals

- 不为目标项目引入新的 ORM、数据库、消息队列、运行时依赖或默认架构。
- 不承诺插件本地测试证明目标项目的真实吞吐、容量、生产故障恢复或第三方服务可用性。
- 不重写全部技能内容，不复制外部 agent runtime，不改变授权逆向边界。
- 不提交、推送、部署，也不修改外部文档仓库或目标项目数据。

## Requirements

### R1. Shared scale-ready contract

建立一个共享 reference，覆盖容量/资源预算、内存与读取边界、并发控制、锁/租约/fencing、幂等与重试、deadline/cancellation、分区/分片/顺序、队列/outbox/异步耐久性、可观测性、版本协商、故障域/回滚和证据等级。所有技能按触发条件引用，不重复维护相互矛盾的规则。

### R2. Bounded analysis

图扫描、任务分析、恢复扫描、Issue 列表和指纹计算必须有文件数、深度、单文件字节数、总字节数、错误数或结果数预算；截断、跳过和解析失败必须返回可诊断的统计与原因。

### R3. Content-aware scope

任务分析不能只依赖文件路径关键词。它应在预算内搜索文件内容、使用路径/内容/契约词的可解释评分，返回候选文件、匹配来源、截断状态和人工复核提示；宽泛描述仍不得伪造精确范围。

### R4. Transactional install/update

项目安装使用 staging、校验、有限切换、操作锁和 journal；避免直接删除再复制，崩溃后的中间状态必须可识别并可恢复。逐组件重命名不是跨所有组件的单一原子事务，激活期间消费者应暂停。更新必须记录 source revision/fingerprint，区分安装成功与维护 tidy 的 skipped/failed；不得因 tidy 失败继续伪装整体成功。

### R5. Truthful validation evidence

gate 必须区分 declared validation、executed validation、successful validation 和 unverified。仅传入命令字符串不能生成通过证据；不允许 gate 为获得通过状态而自动执行任意用户命令。

### R6. Bounded issue/recovery/config behavior

Issue、recovery 和多代理配置处理在大型历史或共享目录下保持可用：锁带 owner/时间/诊断，支持过期锁识别；列表支持 limit/分页式截断；历史增长有界或可转移；无支持的 YAML 结构必须显式失败，不得悄悄回退成默认配置。

### R7. All-skill integration

全部技能的 SKILL.md 和维护镜像都应明确规模触发条件、证据边界和共享 reference 路由。后端数据访问契约继续作为数据库专项 reference，不被通用契约覆盖或重复实现。

### R8. Distribution integrity

源技能、`.ae-source` 镜像、metadata、安装 smoke、focused tests、静态检查和双语 release notes 保持一致。可分发行为变化递增 package/plugin manifest 版本并记录日期、摘要、验证命令和证明边界。

## Acceptance Matrix

| ID | Acceptance | Evidence boundary |
|---|---|---|
| A1 | 共享 reference 被全部技能按触发条件可发现地引用，源/镜像一致 | 静态检查与 focused test |
| A2 | graph/task/recovery 在超预算 fixture 上有限返回并给出 diagnostics | focused Node tests |
| A3 | gate 未提供 executed/successful 结果时不输出可误读的 pass proof | focused Node tests |
| A4 | install/update 在注入失败或并发冲突时保留旧状态并可恢复 | install/update tests 与 smoke |
| A5 | issue/config 大历史 fixture 不会无限扫描或静默吞配置错误 | focused Node tests |
| A6 | `npm test`、`npm run check`、`npm run check:smoke` 分层报告 | repository validation |
| A7 | 目标项目的真实分布式吞吐、部署和生产恢复仍明确为未验证 | final evidence report |

## Acceptance Outcome

2026-09-27：本 PRD 定义的插件本地范围已实现为 v0.3.50。全部 40 个技能接入共享契约，代码路径补充有界处理、并发与恢复、源内容绑定和真实证据门禁；最终全量测试 258 项，252 通过、0 失败、6 项明确跳过，静态检查和隔离安装 smoke 通过。

命令、跳过原因、行为兼容变化和未验证边界记录在 `docs/ae/plans/2026-09-27-001-plugin-scale-compatibility-plan.md`。完成状态仅覆盖 A1-A7 的本地证据边界，不表示真实目标项目吞吐、跨主机可靠性、生产验收或当前用户安装已验证。

## Assumptions And Open Questions

- 假设 Node.js 运行时保持项目当前支持范围，优先使用内建模块，不新增依赖。
- 假设现有本地 Markdown/JSON 产物格式需要兼容读取；新增字段应可选。
- 大规模 Issue 历史的完整外置存储迁移不在本轮强制完成，先提供预算、分页和明确诊断。
- 若未来需要真实负载/故障注入，应由目标项目单独授权并在 API、浏览器、部署或生产证据层验证。

## Rollback Signals

- 现有命令参数或 JSON 字段被破坏。
- 源/镜像检查、安装 smoke 或历史 artifact checker 失败。
- 安装失败后旧目标状态无法恢复。
- gate 仍能在没有执行证据时写出误导性的 pass。
- 用户配置在解析失败时被静默替换为默认值。
