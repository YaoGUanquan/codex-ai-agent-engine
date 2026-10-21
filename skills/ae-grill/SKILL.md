---
name: ae-grill
description: 用户明确要求 ae-grill 或 AE 需求追问时，逐个检验需求和方案的关键决策。Use when explicitly asked for ae-grill or AE decision questioning before implementation.
license: GPL-2.0-only
compatibility: Markdown only; requires repository reading and conversational questions, with no bundled runtime.
---

# 决策追问

围绕用户希望实现的结果收敛决策，不自动进入编码、写文档或启动其他流程。

1. 确认讨论对象、目标和用户已接受的约束。已有结论继续复用，不重开已解决的问题。
2. 先读相关实现、依赖版本、配置和测试。能查到的事实直接核验，不让用户代查。
3. 找出影响行为、架构、安全、数据完整性或验收的未决项，优先处理被其他决定依赖的项。
4. 每次只提出一个关键问题，给出可行选项、推荐选择及依据，然后等待回答。区分事实、推断和待验证假设。
5. 根据回答更新共识，继续处理下一个关键节点。常规实现细节留给工程判断，不追求问完所有可能性。
6. 当决策足以执行、用户停止或达到约定预算时，汇总目标、已定事项、验收标准、未决风险和下一步。

对方案做压力测试时，检查依赖失败、权限边界、数据一致性、资源规模、恢复和验证是否有证据；只讨论实际适用的风险，不引入假想系统。

默认仅在会话中输出共识。用户要求文档时才在约定位置保存，不写私有对话、凭据或无关项目记忆。缺少材料时明确局限，不把推测当作已经确认的方案。
