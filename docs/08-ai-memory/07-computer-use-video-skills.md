# Computer Use Video Skills Memory

## Scope

This memory is repo-specific for `ai-agent-engine-codex`.

## Durable Decisions

- Added three AE skills: `ae-computer-use-guard`, `ae-imagegen-prompt`, and `ae-video-edit-computer`.
- Default profile for these skills is `beginner + low_resource`, interpreted as a `2G/4-core relay` when the user is silent or config is missing/invalid/unsafe.
- `Computer Use` is a final GUI layer only. File inspection, media metadata, FFmpeg/ffprobe checks, preprocessing, and export validation should use local tools first.
- `Computer Use` requires the `ae-computer-use-guard` hooks gate. If hooks are missing/untrusted, ask the user to install or trust them. If the user refuses, block `Computer Use`.
- Video workflows check `ffmpeg` and `ffprobe` before FFmpeg/ffprobe-dependent preprocessing, generation, subtitle, rough-cut, or export-validation stages. If tools are missing, ask before installing; refusal blocks that stage.
- `ae-imagegen-prompt` does not require hooks for prompt-only work. It requires hooks only when handing off to GUI image editing or `Computer Use`.
- Hook templates under `docs/ae/templates/computer-use-hooks/` are examples and must not be silently trusted.
- Server middleware remains the real hard-enforcement layer for request body/image/concurrency limits.

## Validation Contract

- `node scripts\check-skill-mirror.mjs`
- `node scripts\check-skill-language-metadata.mjs`
- `node scripts\check-install-smoke.mjs`
- `npm.cmd test`
- `npm.cmd run check`

## Key Artifacts

- Plans:
  - `docs/ae/plans/2026-06-03-001-computer-use-video-skills-plan.md`
  - `docs/ae/plans/2026-06-03-002-computer-use-hooks-gate-plan.md`
- Archive:
  - `docs/99-archive/2026-06/computer-use-video-skills/solution-archive.md`
  - `docs/00-process/archive/2026-06/computer-use-video-skills/progress.md`
- Gates:
  - `docs/ae/gates/20260603T030250Z-lfg-final.json`
  - `docs/ae/gates/20260603T033818Z-lfg-final.json`
