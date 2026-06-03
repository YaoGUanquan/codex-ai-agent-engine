---
name: ae-video-edit-computer
description: Use when the user asks Codex to edit a video with local desktop software, Jianying, CapCut, Premiere Pro, DaVinci Resolve, Computer Use, generated images, user-provided images, or a mixed video-production workflow.
---

# AE Video Edit Computer

Orchestrate desktop video editing with beginner-safe defaults. If the user does not specify capacity or config, assume a `2G/4-core relay` and use local tools/generated assets first; use Codex `Computer Use` only for GUI-required editing software operations.

## Workflow

1. Read `references/shared-profile-contract.md`.
2. Read `references/asset-modes.md`, `references/local-tool-routing.md`, `references/local-tool-gate.md`, and `references/workflow-stages.md`.
3. Determine the effective profile. Default to `beginner + low_resource` as the `2G/4-core relay` mode when no safe config exists or the user did not explicitly request a stronger profile.
4. Identify asset mode: all assets provided, partial assets provided, no visual assets, or video footage provided.
5. Inventory files with filesystem or shell commands before opening any GUI.
6. Build a script/timeline plan. Route missing image prompts to `ae-imagegen-prompt`.
7. Before local preprocessing, generation, subtitles, rough cuts, or export validation, pass the local tool gate. If `ffmpeg`, `ffprobe`, or another required local tool is missing, ask before installation; if the user refuses, stop before the tool-dependent stage.
8. Preprocess and validate media locally where possible.
9. Before GUI work, invoke `ae-computer-use-guard`, pass its hooks gate, and follow its execution contract.
10. Use `Computer Use` only for GUI-required steps: import, timeline placement, editor-specific settings, export confirmation.
11. Validate the exported file locally and report unverified areas.

## Hard Rules

- Do not open a desktop editor before asset inventory and stage planning.
- Do not use `Computer Use` to browse folders, analyze video duration, inspect raw media, or read long logs.
- Do not upload raw video or historical screenshots into context.
- Do not skip `ae-computer-use-guard` before any GUI operation.
- Do not run FFmpeg/ffprobe-dependent stages before checking required local tools and user-approved installation when missing.
- Do not claim adapters exist for an editor unless they are installed and verified.
