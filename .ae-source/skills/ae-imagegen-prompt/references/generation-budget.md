# Image Generation Budget

This skill produces prompt specifications and does not operate desktop GUI tools or `Computer Use`.

## Default Limits

| Case | Beginner Default | Hard Limit |
| --- | ---: | ---: |
| Prompt variants | 1 | 4 |
| Generated outputs requested | 1 | 4 |
| Storyboard frames per planning batch | 4 | 8 planned prompts, generated in separate bounded stages |
| Reference images per request | role-labeled only | no unlabeled references |

## GUI Boundary

- A request requiring GUI editing or desktop control is outside this skill and requires a separately authorized workflow.
- Inspect local visual files through file metadata or explicit user-provided references, not repeated screenshots.

## Stop Conditions

- User asks for unbounded variants, all styles, or open-ended batch generation.
- The workflow would upload raw video or large media through conversation context.
- Reference images are present but roles are unclear and the user refuses clarification.
