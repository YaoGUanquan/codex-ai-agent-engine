---
name: ae-pptx
description: Use when the user asks for AE pptx, /ae-pptx, PowerPoint automation, slide generation, `.pptx` editing, deck inspection, or wants OfficeCLI-backed presentation workflows.
---

# AE PPTX

Use OfficeCLI-oriented workflows for `.pptx` creation, editing, inspection, validation, and profile-based deck work.

## Workflow

1. Read `references/pptx-workflow.md`.
2. Confirm the target deck, slide range, and whether the task is create, inspect, update, or validate.
3. If the task is pitch-deck-like, read `references/pitch-deck-profile.md`.
4. If the task depends on morph-like presentation behavior, read `references/morph-profile.md`.
5. Use OfficeCLI help and `--json` output where applicable instead of guessing slide or shape operations.
6. Prefer a content or layout change followed by a render, view, or validate step.
7. Report changed slides, validation evidence, and any remaining manual review areas.

## Rules

- Do not claim the deck is visually correct without a render, view, or equivalent verification step.
- Keep morph and pitch-deck logic as profiles in phase one.
- Treat OfficeCLI render or view outputs as the preferred proof path.
