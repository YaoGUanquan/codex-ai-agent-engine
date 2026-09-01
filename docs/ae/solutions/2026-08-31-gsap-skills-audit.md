# GreenSock `gsap-skills` 审计与 AE 前端审美适配（2026-08-31）

## Decision

结论：`ADAPT`。`greensock/gsap-skills` 是 MIT 许可的官方 GSAP 技能集合；其可复用价值在于动效实现与性能/可访问性复核，不在于替代设计判断或提供通用审美模板。本项目吸收 runtime-neutral 方法，继续由 `ae-frontend-design` / `ae-web-forge` 负责方向与路由，不新增 GSAP skill、不安装 GSAP、不复制外部示例或运行时。

## Source evidence

- Source: `https://github.com/greensock/gsap-skills`
- Freshness: `git ls-remote ... HEAD` -> `aed9cfd3277740755f6bfc1155c7aa645403b760`; local shallow clone HEAD matches; observed commit date `2026-04-21`.
- License: MIT, verified from the repository `LICENSE`.
- Inspected: `README.md`, `LICENSE`, `skills/gsap-core/SKILL.md`, `skills/gsap-performance/SKILL.md`, `skills/gsap-timeline/SKILL.md`, `skills/gsap-react/SKILL.md`, `skills/gsap-frameworks/SKILL.md`, and repository structure.

## Adaptation map

| External pattern | Classification | AE destination | Boundary |
| --- | --- | --- | --- |
| transform/opacity over layout-heavy animation | portable method | `ae-frontend-design` UI direction and quality references | review cue only; target stack chooses implementation |
| timeline/state coordination instead of arbitrary delays | portable method | `ae-frontend-design` motion decision gate | requires task-relevant purpose and usable completion state |
| responsive/reduced-motion branching | portable method | `ae-frontend-design`, `ae-test-browser` | evidence required; no runtime-specific API guarantee |
| lifecycle cleanup and debounced layout refresh | portable method | `ae-frontend-design` hardening cues | inspect framework lifecycle in target project |
| GSAP recommendation, install commands, framework snippets | runtime-specific | rejected | dependency, license, and runtime ownership belong to target project |

## Changes

- Added runtime-neutral motion implementation hints to `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/ui-direction-contract.md` and mirrored `.ae-source` copy.
- Added one quality-contract rule to `web-ui-quality.md` and mirrored copy.
- Registered `greensock-gsap-skills` in `docs/ae/references/external-skill-watchlist.json` with path-scoped impact mapping and rejected runtime patterns.
- Bumped distributable version to `0.3.38` and updated README/CHANGELOG release notes.

## Validation and limits

Passed: `npm run check`, `npm run check:smoke`, `git diff --check`. These prove source/mirror, metadata, artifact, design, release-note, and installation contracts. They do not prove visual improvement, browser rendering, frame rate, or reduced-motion behavior in a real target application; those remain `unverified` until a target route and browser fixture are supplied.
