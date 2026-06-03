# Image Generation Budget

Prompt-only image work does not require Codex hooks because it does not use desktop screenshots or `Computer Use`.

## Default Limits

| Case | Beginner Default | Hard Limit |
| --- | ---: | ---: |
| Prompt variants | 1 | 4 |
| Generated outputs requested | 1 | 4 |
| Storyboard frames per planning batch | 4 | 8 planned prompts, generated in separate bounded stages |
| Reference images per request | role-labeled only | no unlabeled references |

## Require Hooks Only When

- The workflow hands off to `Computer Use`.
- A desktop image editor or video editor must be controlled by GUI.
- The agent would inspect local visual files through repeated screenshots instead of file metadata or explicit user-provided references.

## Stop Conditions

- User asks for unbounded variants, all styles, or open-ended batch generation.
- The workflow would upload raw video or large media through conversation context.
- Reference images are present but roles are unclear and the user refuses clarification.
