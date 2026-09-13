# 指令审计优化第一批

日期：2026-09-13。基于 `docs/ae/solutions/2026-09-05-current-plugin-instruction-audit.md`，在用户明确批准的当前 `main` 分支执行。起始工作区干净，基线版本 0.3.44，本批版本 0.3.45；未提交、推送或更新用户全局安装。

## 决策与范围

以已有 `model-adaptation-contract.md` 为基线，按能力、风险和证据边界适配，不新增 GPT-6 Astra 专属参数或模型名分支。本批目标是消除可观察的指令歧义，不声称模型效果提升已经实测。

选择修改当前 source、生成 metadata 并同步 mirror，不新增路由执行器、模型分类器或配置开关。避免引入新的行为真源。安全、授权、数据访问和浏览器验收要求继续保留。

## 审计项对照

| 项目 | 本批状态 | 证据与剩余边界 |
| --- | --- | --- |
| F-001 目录角色 | 已验证：文档与静态契约 | `AGENTS.md` 与双语 README 区分 canonical source、maintenance mirror、consumer layout；`tests/instruction-audit.test.mjs` 锁定说明。不是宿主加载证据。 |
| F-002 版本窗口 | 已验证：文档与发布检查 | 双语 README 仅留最近五版，删除遗留四级版本标题，完整记录仍在双语 CHANGELOG。 |
| F-003 前端触发重叠 | 已验证：静态边界；模型效果未验证 | 三技能 frontmatter、metadata 真源及 YAML 同步；已有目标默认保留修改，避免重复 intake；六组正反例覆盖视觉、API、既有路由、混合需求、只验收和显式技能。 |
| F-004 runtime entry | 延后 | 全局 dispatcher 示例与项目 wrapper 的统一解析仍需独立实现与两种安装模式验证；本批未修改其执行逻辑。 |
| F-005 引用守护 | 部分已在 0.3.43 实现 | 当前 checker 已遍历技能目录 Markdown 相对链接，本批通过检查。反引号路径、完整 Markdown 语法与能力清单集合断言不是本批完成项。 |
| F-006 旧生成物 | 部分：明确扫描边界 | 根指令默认排除生成目录，既有安装 source-exclusion 检查通过；未删除 dist，未新增统一审计扫描器。 |

## 修改文件

- `AGENTS.md`：目录角色、扫描排除边界和实际英文 README 名称。
- `plugins/ai-agent-engine-codex/skills/ae-frontend-design/`、`ae-web-app/`、`ae-web-forge/`：缩窄触发边界、按需读取、复用路由决策和路由样本；对应 `.ae-source/skills/` 镜像同步。
- `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`：元数据生成唯一源；三技能 YAML 从该源生成。
- `tests/instruction-audit.test.mjs`、`tests/skills-docs.test.mjs`：新增边界、样本和元数据一致性断言，更新已改变的文案预期。
- `package.json`、插件 manifest、双语 README/CHANGELOG：同步 0.3.45 分发版本与证据边界。

## 验证

- 基线：`node --test tests/skills-docs.test.mjs`，39 项通过。
- 最终聚焦回归：`node --test tests/instruction-audit.test.mjs tests/skills-docs.test.mjs`，42 项全部通过，包含最终 CHANGELOG 链接断言。
- 初轮聚焦检查：42 项中 41 通过、1 项因 metadata 文案与既有断言不一致失败；修正措辞后全量运行中的该项通过。初轮英文 README 六条版本记录检查失败，删除窗口外旧条目后通过。最终 diff 复查恢复了中文 README 的 CHANGELOG 链接，并新增链接断言。
- `npm.cmd test`：174 项，172 通过、2 失败、0 跳过。失败为 `tests/ae-tools.test.mjs` 的 report/issue canonical link escape 和 static-server canonical path escape 样本，在 `symlinkSync(..., 'file')` 准备阶段返回 `EPERM`。这两项测试和被测实现未在本批修改；当前环境未验证其后续安全断言，不能声称完整测试全绿。
- `npm.cmd run check`：退出码 0，语法、40 技能/40 元数据、131 个源/镜像文件、80 个双树技能和 180 个 Markdown 文件、发布与其他仓库契约检查通过。claims dry-run 保留既有 command/assumption/deferred 证据警告，不是这些声明的运行验证。
- `npm.cmd run check:smoke`：退出码 0，临时 consumer 安装与三种语言模式通过，版本为 0.3.45；全局部分为当前用户安装 preview 与 source-exclusion 检查，不是实际全局更新。
- `git diff --check`：通过。
- 最终人工 diff 自审覆盖源/镜像、metadata、版本窗口和新增测试；未调用独立 reviewer。文档加入后重新运行 `node scripts/check-ae-artifacts.mjs` 与 `node scripts/check-release-notes.mjs`，均通过。等价交付门禁结论为部分验证，不满足完整测试全绿发布条件。

## 未验证与恢复

交付为部分验证：静态/聚焦回归和本地安装分发已验证，完整测试门禁因符号链接权限未通过。真实模型路由、token 成本、宿主技能加载、GPT-6 Astra 运行表现、认证 API、浏览器和部署不在本批证据内。

下一步先在可创建文件符号链接的 Windows 测试环境重跑完整测试，再处理 F-004 的共享命令入口合同。真实模型评估应使用 `ae-web-forge/references/routing-examples.md` 中同一组任务与固定仓库 fixture，记录实际路由和可观测指标；不依据模型名称猜测结果。

恢复只需复核并撤销本批任务拥有的未提交 diff，保持其他用户后续改动；不运行 hard reset、不修改全局模型目录、不删除生成物。当前未发布，无线上回滚动作。
