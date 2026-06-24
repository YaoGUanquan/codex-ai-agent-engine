---
type: plan
status: ready
date: 2026-06-03
title: computer-use-hooks-gate
origin: inline user follow-up after 2G/4-core relay default
originFingerprint: sha256:9e4f1e7400bcf9c6a8e9775c4abbd5fca06e924054823e7b9850fac614f92767
---

# Plan: Computer Use Hooks Gate

## Goal

Add a default hooks-ready gate before any Codex `Computer Use` stage, extend the same rule to video editing/generation workflows, add local non-GUI media tool checks before video generation, and document why image prompt generation should not require hooks unless it enters GUI or `Computer Use`.

## Decisions

- `ae-computer-use-guard` becomes the owner of the hooks gate.
- `ae-video-edit-computer` must use `ae-computer-use-guard` before any GUI/video-editor stage; if hooks are missing and the user refuses installation/trust, the workflow must stop before `Computer Use`.
- `ae-video-edit-computer` must also check local non-GUI media tools such as `ffmpeg` and `ffprobe` before preprocessing, validation, or local video generation. If required tools are missing, ask the user before installing; if the user refuses, stop before the tool-dependent stage.
- `ae-imagegen-prompt` does not require hooks for prompt-only work. It requires budget limits for prompt variants and generated asset plans, and it requires hooks only when it hands off to GUI/Computer Use or local desktop image editing.
- Hook templates are shipped as documentation/templates only. They must not be silently installed or trusted because Codex hooks require user review/trust.
- The default 2G/4-core relay profile remains conservative: no hooks means no `Computer Use`.

## Files

- Modify `plugins/ai-agent-engine-codex/skills/ae-computer-use-guard/SKILL.md`
- Add `plugins/ai-agent-engine-codex/skills/ae-computer-use-guard/references/hooks-gate.md`
- Modify `plugins/ai-agent-engine-codex/skills/ae-video-edit-computer/SKILL.md`
- Modify `plugins/ai-agent-engine-codex/skills/ae-video-edit-computer/references/local-tool-routing.md`
- Add `plugins/ai-agent-engine-codex/skills/ae-video-edit-computer/references/local-tool-gate.md`
- Modify `plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/SKILL.md`
- Add `plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/references/generation-budget.md`
- Modify shared profile contract copies for all three skills.
- Modify `docs/ae/templates/ae-skill-profiles.example.yaml`
- Add `docs/ae/templates/computer-use-hooks/README.md`
- Add `docs/ae/templates/computer-use-hooks/hooks.example.json`
- Add `docs/ae/templates/computer-use-hooks/pre-tool-use-computer-budget.example.py`
- Modify `scripts/check-install-smoke.mjs`
- Modify `tests/skill-scripts.test.mjs`
- Mirror plugin skill changes into `.agents/skills`.

## Acceptance Criteria

- The default profile says hooks are required before `Computer Use` on the low-resource relay path.
- Video workflows cannot enter GUI/Computer Use without passing the hooks gate.
- Video workflows check local media tools before FFmpeg/ffprobe-dependent preprocessing, generation, or validation, and ask before installation when missing.
- Image prompt-only workflows explicitly do not require hooks, but large/batch generation and GUI handoff remain bounded.
- Hook templates are installed by `install-project.mjs` through the existing `docs/ae/templates` copy path.
- Smoke tests verify the hook templates and default hook policy markers are installed.

## Validation

- `node scripts\check-skill-mirror.mjs`
- `node scripts\check-skill-language-metadata.mjs`
- `node scripts\check-install-smoke.mjs`
- `npm.cmd test`
- `npm.cmd run check`

## Review

- Document review: no blocking open questions. The only product decision is whether image prompt-only work should require hooks; decision is no, because it does not use `Computer Use` screenshots.
- Code review focus: installer smoke coverage and non-destructive template install behavior.
