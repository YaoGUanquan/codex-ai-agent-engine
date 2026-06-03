# Computer Use Video Skills Progress

## 2026-06-03

- Started implementation from `docs/ae/plans/2026-06-03-001-computer-use-video-skills-plan.md`.
- Git baseline: branch `main`, latest commit `aebd4cd docs: update skill audit and language defaults`.
- Existing untracked file before implementation: `docs/ae/plans/2026-06-03-001-computer-use-video-skills-plan.md`.
- Execution mode: serial, because task analysis found shared files across U0-U4.
- Implemented U0 shared profile contract and example config template.
- Implemented U1 `ae-computer-use-guard` in plugin source and `.agents` mirror.
- Implemented U2 `ae-imagegen-prompt` in plugin source and `.agents` mirror.
- Implemented U3 `ae-video-edit-computer` in plugin source and `.agents` mirror.
- Implemented U4 metadata and README skill inventory updates.
- Validation passed:
  - `node scripts\check-skill-mirror.mjs`
  - `node scripts\check-skill-language-metadata.mjs`
  - `npm.cmd run check`
  - `npm.cmd test`

## 2026-06-03 Default Profile Follow-Up

- Tightened the default profile semantics: if the user is silent or config is missing/invalid/unsafe, all three new skills treat `beginner + low_resource` as the installed `2G/4-core relay` (`2G/4核中转`) mode.
- Updated `ae-computer-use-guard`, `ae-imagegen-prompt`, and `ae-video-edit-computer` plugin source files and synchronized `.agents/skills`.
- Updated the shared profile contract and Computer Use profile budget reference so local desktop hardware cannot be used as a reason to auto-upgrade the upstream server profile.
- Updated `docs/ae/templates/ae-skill-profiles.example.yaml` to explain that `standard` and `high_capacity` require explicit opt-in by the user/operator.
- Updated `scripts/install-project.mjs` to install `docs/ae/templates` into target projects without deleting user-owned template files.
- Updated `scripts/check-install-smoke.mjs` and `tests/skill-scripts.test.mjs` to verify the installed default profile marker `beginner+low_resource_2g4core_relay`.
- Validation passed:
  - `node scripts\check-skill-mirror.mjs`
  - `node scripts\check-skill-language-metadata.mjs`
  - `node scripts\check-install-smoke.mjs`
  - `npm.cmd test`
  - `npm.cmd run check`
- Final gate proof: `docs/ae/gates/20260603T033818Z-lfg-final.json`.
- Final gate proof: `docs/ae/gates/20260603T030250Z-lfg-final.json`.

## 2026-06-03 Hooks And Local Tool Gate Follow-Up

- Added follow-up plan `docs/ae/plans/2026-06-03-002-computer-use-hooks-gate-plan.md`.
- Added `ae-computer-use-guard` hooks-ready gate reference:
  - Missing or untrusted hooks must ask for user install/trust approval.
  - User refusal blocks `Computer Use`.
  - Local-only work may continue when safe.
- Updated `ae-video-edit-computer` so video editing/generation checks:
  - hooks-ready status before GUI/Computer Use,
  - `ffmpeg` and `ffprobe` before FFmpeg/ffprobe-dependent preprocessing, generation, subtitles, rough cuts, or export validation,
  - user approval before installing missing local media tools.
- Updated `ae-imagegen-prompt` decision:
  - prompt-only work does not require hooks,
  - GUI image editing or Computer Use handoff requires the `ae-computer-use-guard` hooks gate,
  - image/storyboard output remains bounded by generation budgets.
- Added hook templates under `docs/ae/templates/computer-use-hooks/`.
- Updated install smoke coverage for hook policy and local media tool policy.
- Validation passed:
  - `node scripts\check-skill-mirror.mjs`
  - `node scripts\check-skill-language-metadata.mjs`
  - `node scripts\check-install-smoke.mjs`
  - `npm.cmd test`
  - `npm.cmd run check`
