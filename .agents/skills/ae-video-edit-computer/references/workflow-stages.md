# Video Editing Workflow Stages

## Stage 0 - Request And Output Target

Confirm target platform, duration, orientation, resolution, and whether the user provided assets. In beginner mode, ask at most one blocking question.

## Stage 1 - Asset Inventory

Use filesystem or shell commands to list assets. Do not use `Computer Use` to inspect folders.

## Stage 2 - Timeline Plan

Create a compact shot order with asset path, duration, caption need, transition need, and missing-asset status.

## Stage 3 - Missing Asset Prompts

Use `ae-imagegen-prompt` for missing images or storyboard frames. Do not generate assets not required by the timeline plan.

## Stage 4 - Local Preprocessing

Run `references/local-tool-gate.md`, then use local tools when available for normalization, frame sampling, rough cuts, subtitles, or export validation preparation. If required local tools are missing and the user refuses installation, stop before this stage.

## Stage 5 - GUI Editing

Invoke `ae-computer-use-guard`, pass its hooks gate, write the execution contract, then perform one GUI stage at a time. If hooks are missing or declined, do not enter GUI editing.

## Stage 6 - Export And Validation

Export through the editor when needed. Validate the resulting file locally for existence, duration, resolution, and visible spot checks when possible.
