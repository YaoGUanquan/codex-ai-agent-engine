---
name: ae-e2e-suite
description: 用户明确要求 ae-e2e-suite 或 AE 项目级 E2E 工程时，组织端到端基础设施、套件和 CI。Use when explicitly asked for ae-e2e-suite or AE project-wide end-to-end infrastructure and CI.
license: GPL-2.0-only
compatibility: Markdown only; uses the target project's browser framework, application lifecycle and CI provider.
---

# 项目级端到端工程

面向项目级测试组织和持续运行；单个用例执行不需要此规模的工程改动。

1. 盘点应用入口、现有测试分层、runner、fixture、CI 和服务生命周期，找出必须通过真实 UI 验证的关键链路。
2. 复用已有基建，按风险和用户要求确定 smoke、功能套件及排除范围；可在更低测试层验证的行为不重复铺成浏览器矩阵。
3. 按 [套件设计](references/suite-design.md) 定义目录、隔离、启动和停止、会话、并发、证据及失败退出机制。
4. 先落地一条可执行的关键链路，确认本地隔离启动和清理，再扩展获准范围。没有浏览器或测试依赖时完成可验证的配置与静态工作，标明运行缺口。
5. 接入项目既有 CI 和门禁，保留稳定检查名；合理限定 worker、超时和附件保留，不要求重建无关流水线。
6. 验证成功、断言失败、setup 失败、零用例、缺配置和清理失败都产生真实结果；不能只验证成功 happy path。
7. 输出套件入口、覆盖与未覆盖业务路径、实际命令和结果、隔离机制及维护说明。

只在复杂决策尚未批准且影响契约时澄清；复用用户已经批准的计划，不重复阶段确认。不得默认启动多代理或全项目生产扫描。

失败分类为产品、测试、规格、环境；根据证据修复获准范围，不放宽断言、重写快照或堆重试掩盖问题。真实外部副作用、Git 写入和部署不由测试基建请求自动授权。没有实际运行就不宣称套件、覆盖率或真实宿主行为已经通过。
