---
name: ae-integration-test
description: 用户明确要求 ae-integration-test 或 AE 集成测试时，验证跨模块、接口、认证和持久化交互。Use when explicitly asked for ae-integration-test or AE integration and business-flow verification.
license: GPL-2.0-only
compatibility: Markdown only; uses the target project's integration runner and proven isolated dependencies.
---

# 集成测试

验证模块或服务之间的可观察契约，不把单个 HTTP 成功当作完整业务成功。

1. 读取已有 runner、接口定义、认证封装、事务及测试 fixture；明确测试范围、目标环境和成功后的持久状态。
2. 请求前读取 [隔离与业务断言](references/isolation-and-assertions.md)。无法证明环境隔离时不启动服务、不发送请求，继续静态契约与夹具检查。
3. 沿真实流程编排前置数据、认证角色、请求依赖及结果读取，复用已有客户端，不臆造 URL、标识符、字段和登录过程。
4. 覆盖请求校验、身份失效、越权与租户隔离，以及实际相关的重复提交、幂等、并发或回滚路径。
5. 在项目测试目录新增或更新测试；只执行请求则保持测试与产品源码不变。运行聚焦范围，记录数量和各状态。
6. 失败区分产品缺陷、测试缺陷、规格冲突与环境问题；以契约和持久化证据判断，不按状态码自动改断言。只修改获准范围，不能跳过失败来制造成功。
7. 用 finally 或项目 fixture 生命周期回收本次拥有的隔离资源。清理失败独立报告，不能覆盖原始失败；随后报告实际检查和未验证边界。

不自动扩展为压力测试、生产探测或部署。真实数据库写入、迁移和外部副作用需要对应授权；测试请求不授权 Git 写入。记录脱敏证据，不输出令牌、Cookie、个人信息或完整敏感响应。
