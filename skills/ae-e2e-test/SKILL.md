---
name: ae-e2e-test
description: 用户明确要求 ae-e2e-test 或 AE 用例级端到端测试时，执行已有浏览器用例或编写后执行。Use when explicitly asked for ae-e2e-test or AE browser-case execution, authoring and evidence.
license: GPL-2.0-only
compatibility: Markdown only; requires the target project's browser test runner, browser and isolated application.
---

# 用例级端到端测试

| 模式 | 行为 |
| --- | --- |
| `mode=test-only` | 运行明确选择的现有脚本和配置，只收集证据，不改脚本或产品代码 |
| `mode=script` | 在项目现有测试目录编写或更新目标用例，然后执行并核验结果 |

显式模式优先；“只跑已有脚本”使用前者，“编写并运行”使用后者。缺省且已有对应脚本时先执行；需要新建时先确认请求已包含编写范围。

1. 读取目标路由、用户动作、相关源码、现有用例及 runner 配置，确定本次 spec 和验收结果，不搭建整套新工程。
2. 运行前证明应用使用测试拥有的临时数据源或明确授权的隔离环境。登录态、URL 与本地服务健康不代表有权读写真实数据。
3. 编写模式复用已有 fixture、选择器和认证封装，按 [用例与证据](references/cases-and-evidence.md) 编写行为断言。
4. 使用项目命令运行选定范围，记录收集、通过、失败、跳过、进程退出与附件。零用例或全局 setup 失败不得报通过。
5. 读取实际报告和必要截图、trace；对有视觉验收的路径核对画面与断言是否一致。不能凭附件名称推测内容。
6. 分别判断产品、测试、规格或环境原因。只执行模式仅报告；编写模式可修证据支持的测试问题。产品修复超出请求时报告根因与边界。
7. 变更后复跑受影响用例，复用仍有效的其他证据。输出结果、附件位置、环境限制和剩余风险。

不得删除断言、无理由跳过、加重试或擅自更新视觉基线掩盖失败。缺少浏览器、认证或隔离条件时标记阻塞，不声称实际验收通过。敏感认证与取证材料保持本地私密；Git 写入和外部发布另需授权。
