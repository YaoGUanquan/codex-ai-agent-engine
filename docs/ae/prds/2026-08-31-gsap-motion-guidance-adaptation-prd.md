---
type: prd
status: completed
date: 2026-08-31
topic: gsap-motion-guidance-adaptation
format: human-readable-requirements
sharded: false
---

# GSAP 动效指导适配需求

## Outcome

将 `greensock/gsap-skills` 中与性能、生命周期、响应式和 reduced-motion 相关的通用方法纳入现有前端设计契约，不引入 GSAP runtime、外部安装器或复制示例。

## Acceptance Criteria

- AC1：`ae-frontend-design` 的 UI Direction Contract 明确 transform/opacity 优先、协调式状态转换、生命周期清理、布局刷新节流和最低设备验证。
- AC2：`web-ui-quality` 包含同一组动效复核要求，且 source/mirror 一致。
- AC3：外部 watchlist 记录来源、MIT 许可、观测提交、inspected paths、adopted/rejected/watch 边界。
- AC4：版本、README、CHANGELOG、技能镜像和安装 smoke 保持一致。

## Non-goals

- 不安装或推荐 GSAP 作为本项目依赖。
- 不复制外部 SKILL.md、示例、插件代码或 framework-specific runtime。
- 不声称真实目标项目的视觉质量、FPS 或浏览器验收已经提升。

## Validation

`npm run check`、`npm run check:smoke`、`git diff --check`；真实目标项目浏览器与性能验证保持 `unverified`。
