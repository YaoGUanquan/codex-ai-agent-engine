# AE Image Generation Profile Contract

`ae-imagegen-prompt` uses this optional profile convention for prompt specifications only.

## Config Path

`.codex/ae-skill-profiles.yaml`

If the file is missing, invalid, contains unknown fields, or requests unsafe values, continue with safe defaults. Do not fail the task because profile config is absent.

## Default Selection Rule

Use `beginner` mode when the user is silent or the profile is missing, invalid, or unsafe. Do not infer stronger capability from local machine specifications.

## User Modes

| Mode | Behavior |
| --- | --- |
| `beginner` | Infer routine prompt settings, ask at most one clarification when output use is unclear, and use one prompt variant by default. |
| `standard` | Use concise safe defaults and show the requested prompt settings. |
| `expert` | Apply whitelisted overrides and report the effective configuration before batch or storyboard output. |

## Skill Override Section

```yaml
skill_overrides:
  ae-imagegen-prompt: {}
```

## Whitelisted Overrides

- `default_aspect_ratio`
- `output_count`
- `style_strength`
- `prompt_language`
- `negative_prompt_level`
- `video_storyboard_mode`
- `reference_fidelity`
- `ask_before_generation`

## Fallback And Clamp Rules

- Missing, invalid, unsafe, or silent configuration: use `beginner` defaults.
- Unknown fields: ignore them and mention they were not applied.
- `output_count` above four: clamp to four and report the effective value.
- Unsafe combinations: downgrade only the risky field when possible.

## Hard Limits

- `max_prompt_variants: 4`
- `max_imagegen_output_count: 4`
- `require_reference_image_roles: true`
- `allow_raw_video_upload: false`
- `do_not_claim_generation_occurred_without_tool_evidence: true`

## Effective Config Report

Before batch or storyboard output, emit a compact report:

```text
Effective imagegen profile:
- user_mode:
- applied overrides:
- clamped overrides:
- active hard limits:
```
