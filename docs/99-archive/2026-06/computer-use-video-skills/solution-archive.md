# Computer Use Video Skills Solution Archive

## Summary

This archive records the completed solution for three AE skills:

- `ae-computer-use-guard`
- `ae-imagegen-prompt`
- `ae-video-edit-computer`

The default user experience is beginner-safe. If the user is silent or config is missing/invalid/unsafe, the effective profile is `beginner + low_resource`, interpreted as a `2G/4-core relay` default.

## Final Decisions

- `Computer Use` is a final GUI layer, not the planning, file inspection, media analysis, or video preprocessing layer.
- `ae-computer-use-guard` owns the stage budget, screenshot/context constraints, execution contract, and hooks-ready gate.
- Missing or untrusted hooks require user approval before installation/trust. User refusal blocks `Computer Use`.
- `ae-video-edit-computer` must inventory assets and check local media tools before GUI work.
- Video preprocessing, generation, subtitles, rough cuts, and export validation check `ffmpeg` and `ffprobe` before tool-dependent stages.
- Missing local media tools require user approval before installation. User refusal blocks the tool-dependent stage.
- `ae-imagegen-prompt` does not require hooks for prompt-only work, but GUI image editing or `Computer Use` handoff requires the hooks gate.
- Hook templates are shipped as examples and must not be silently trusted.
- Server middleware is still required for hard request-body enforcement.

## Key Artifacts

- Plan: `docs/ae/plans/2026-06-03-001-computer-use-video-skills-plan.md`
- Follow-up plan: `docs/ae/plans/2026-06-03-002-computer-use-hooks-gate-plan.md`
- Profile template: `docs/ae/templates/ae-skill-profiles.example.yaml`
- Hook templates: `docs/ae/templates/computer-use-hooks/`
- Process archive: `docs/00-process/archive/2026-06/computer-use-video-skills/progress.md`
- Final gates:
  - `docs/ae/gates/20260603T030250Z-lfg-final.json`
  - `docs/ae/gates/20260603T033818Z-lfg-final.json`

## Validation

- `node scripts\check-skill-mirror.mjs`
- `node scripts\check-skill-language-metadata.mjs`
- `node scripts\check-install-smoke.mjs`
- `npm.cmd test`
- `npm.cmd run check`
