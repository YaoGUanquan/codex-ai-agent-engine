# Video Asset Modes

## All Images Or Media Provided

- Inventory paths locally.
- Preserve user assets; do not generate replacements.
- Ask only for missing output target when needed.
- Build timeline order, captions, transitions, and export settings.

## Partial Images Provided

- Inventory provided assets.
- Identify missing shots.
- Use `ae-imagegen-prompt` only for necessary missing assets.
- Mark generated assets in the plan.

## No Visual Assets Provided

- Create script and shot list first.
- Use `ae-imagegen-prompt` for storyboard image prompts.
- Generate or request assets before GUI editing.

## Video Footage Provided

- Use local tools for duration, codec, resolution, and frame sampling.
- Use rough-cut or preprocessing tools when available.
- Use GUI editor only for steps that require the editing application.

