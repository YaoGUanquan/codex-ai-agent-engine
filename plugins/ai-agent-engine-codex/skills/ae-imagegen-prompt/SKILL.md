---
name: ae-imagegen-prompt
description: Use when the user asks to optimize an image-generation prompt, generate image prompt specs, create storyboard image prompts, edit images, use reference images, or prepare visual assets for video workflows.
---

# AE Imagegen Prompt

Turn vague visual requests into controlled image-generation prompt specs. When no safe profile is provided, default to beginner-safe choices under the same `2G/4-core relay` low-resource assumption used by Computer Use workflows.

## Workflow

1. Read `references/shared-profile-contract.md`.
2. Read `references/generation-budget.md`.
3. Classify the request: new image, edit, style transfer, subject consistency, product/cover asset, or video storyboard asset.
4. In beginner mode or missing-config mode, use the `2G/4-core relay` low-resource defaults: infer use case, aspect ratio, output count, and prompt language; ask at most one clarification if the output use is unclear.
5. In expert mode, apply whitelisted overrides from `.codex/ae-skill-profiles.yaml`, then report the effective config before batch or storyboard output.
6. Label every reference image role using `references/reference-image-roles.md`.
7. Build a structured prompt from `references/prompt-templates.md`.
8. Include positive prompt, avoid list, aspect ratio, output count, reference roles, and verification criteria.
9. Keep generation/edit loops bounded: revise one failed dimension at a time and do not expand beyond the user's intent.

## Hard Rules

- Preserve user intent; do not add arbitrary subjects, brands, or styles.
- Require reference image roles when references are provided.
- Do not output more than four requested prompt variants by default or config.
- Do not imply image generation occurred when only prompt optimization was performed.
- Do not require Codex hooks for prompt-only work.
- Require `ae-computer-use-guard` hooks gate before any GUI image editing or `Computer Use` handoff.
- For video assets, produce stable filenames and storyboard fields that `ae-video-edit-computer` can consume.
