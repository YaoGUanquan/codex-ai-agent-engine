<!-- ae-codex:init managed -->
# AGENTS.md

## 项目画像

- 项目：ai-agent-engine-codex
- 描述：Codex-native AE-style workflow skills referencing https://gitee.com/jiangqiang1996/ai-agent-engine.
- 检测信号：
- Node.js package.json
- package type: module
- README.md
- README.zh-CN.md
- project-local Codex agents
- plugin directory
- scripts directory
- docs directory
- 重要路径：
- README.md
- README.zh-CN.md
- .agents
- plugins
- scripts
- docs

## 项目命令

- `npm run test` - node --test tests/*.test.mjs
- `npm run check` - npm run check:syntax && npm run check:contracts
- `npm run check:syntax` - node scripts/check-syntax.mjs
- `npm run check:contracts` - node scripts/check-skill-mirror.mjs && node scripts/check-skill-language-metadata.mjs && node scripts/check-skill-contract.mjs && node scripts/check-ae-artifacts.mjs && node scripts/check-design-contract.mjs && node scripts/check-memory-knowledge-contract.mjs --root . && node scripts/check-release-notes.mjs && node scripts/check-claims.mjs --dry-run && node scripts/ae-tools.mjs ae-memory-query --topic graph && node scripts/ae-tools.mjs ae-knowledge-map --root . --limit 20 && node scripts/ae-tools.mjs ae-graph-build --root scripts --no-write && node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs --no-write
- `npm run check:smoke` - node scripts/check-install-smoke.mjs && node scripts/check-global-install-smoke.mjs
- `npm run check:all` - npm run check && npm run check:smoke
- `npm run help` - node scripts/ae-tools.mjs help

## 项目规则

- 修改行为前先阅读已有文档。
- 变更范围保持在当前任务内。
- 优先沿用项目已有模式，不轻易新增抽象。
- 不覆盖用户已有工作，不回退无关变更。
- AE 工作流产物记录在 `docs/ae`。
- 执行中的过程记录放在 `docs/00-process/active`。
- 已完成的过程记录归档到 `docs/00-process/archive/YYYY-MM/<task-name>` 或 `docs/99-archive/YYYY-MM/<topic>`。
- 长期 AI 记忆记录在 `docs/08-ai-memory`。

## 工程执行

- 让失败明确暴露；不要伪造成功、吞掉错误，或仅为通过任务增加静默降级。
- 根据仓库证据和任务风险推进；只有缺失信息会改变行为、架构、安全或验证边界时才提问。
- 修复问题时先追踪根因，不要只消除表面症状。
- 当变更涉及重复业务逻辑、共享校验或权限、API/数据契约、状态同步或数据完整性时，按结构性变更处理：先明确不变量和唯一真源，再移除过时路径。
- 只加载当前任务触发的参考资料，不重复已经生效的上级规则；达到请求的验收标准和证据边界后停止。

## 中文与编码规则

- 文档、JSON、YAML、SQL、脚本和生成文本统一使用 UTF-8，优先 UTF-8 无 BOM。
- PowerShell 或终端输出中文乱码时，先用显式 UTF-8 读取验证，不要直接改写文件。
- 不要仅因控制台显示乱码就重写文件，必须先确认文件字节本身确实错误。

## 验证

- 按适用范围运行下列仓库已定义命令；从聚焦行为检查开始，再执行静态/类型检查、受影响构建和 smoke。不要把不相关命令当成强制清单。
- `npm run test`
- `npm run check`
- `npm run check:smoke`
- 交付前复查当前任务 diff，检查重复逻辑、隐藏降级、第二真源、未说明的行为变化、薄弱测试和安全回归。
- 如果无法验证，说明原因、未验证边界和剩余风险；低层检查不能证明更高层运行时、浏览器或部署结果。
<!-- /ae-codex:init managed -->

## 插件分发版本

- 每次可分发的 AE 插件更新都必须同步递增根 `package.json` 与 `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json` 的 SemVer `version`。
- 两处版本必须完全一致；更新脚本复制完整插件目录，因此目标项目更新后以插件 manifest 的版本作为已安装版本。
- 只调整文档而不改变可分发插件内容时，不单独升级插件版本；版本升级必须由回归测试和安装烟测验证。
- 每次递增可分发版本时，必须在 `README.md`、`README.en.md` 与 `CHANGELOG.md`、`CHANGELOG.en.md` 追加对应的 `### <version>（YYYY-MM-DD）` 或 `### <version> (YYYY-MM-DD)` 条目，至少说明修改摘要、验证命令及其证明边界；README 版本节仅保留最近 5 条，超出窗口的条目迁移到对应 CHANGELOG（CHANGELOG 为完整历史），README 须保留 CHANGELOG 链接；运行 `node scripts/check-release-notes.mjs` 验证版本、日期、摘要与 README/CHANGELOG 映射。
