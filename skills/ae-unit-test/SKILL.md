---
name: ae-unit-test
description: 用户明确要求 ae-unit-test 或 AE 单元测试时，编写和执行聚焦单元测试并分析失败或覆盖率。Use when explicitly asked for ae-unit-test or AE unit-test generation, execution and diagnosis.
license: GPL-2.0-only
compatibility: Markdown only; uses the target project's existing test runner and coverage support.
---

# 单元测试

1. 明确要验证的行为、代码范围及只执行或允许补测试的要求。先读实现、调用方、需求与邻近测试。
2. 沿用项目框架、测试目录和 fixture；根据目标代码判断前端或后端，不任意切换工具或新增框架。
3. 从公开行为选择正常、边界、错误和适用的权限或资源生命周期场景。可稳定复现的缺陷优先增加回归用例，不镜像实现逐句断言。
4. 用合成数据和受控替身隔离时间、随机性、网络、文件和外部依赖。不得读取真实令牌或连接用户管理的数据源；仅本地地址不能证明隔离。
5. 运行目标用例并记录命令、收集数量、通过、失败和跳过。零用例、进程异常及未执行不能当成功。
6. 按 [失败归因](references/failure-triage.md) 处理异常，修复后验证目标与直接受影响范围。
7. 仅在实际启用且产物可读时报告覆盖率，同时说明测量范围；覆盖率不是业务正确性或线上容量证明。

测试写入项目既有目录。只执行请求不得修改脚本；允许补测时可以修正错误 mock 或过期期望，但须有需求或契约依据，不能删掉失败断言、改产品逻辑来让测试表面通过。超出请求的产品修复先报告证据及范围。

复用仍有效的已通过检查；新增共享行为或影响范围不明时才扩大检查。达到验收或真实阻塞即停止。Git 写入和发布不由测试请求自动授权，结果不得包含秘密或私有数据。
