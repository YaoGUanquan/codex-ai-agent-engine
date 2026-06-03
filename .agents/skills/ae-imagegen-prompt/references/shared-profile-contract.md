# Shared AE Skill Profile Contract

All three Computer Use video skills use this same optional profile convention.

## Config Path

`.codex/ae-skill-profiles.yaml`

If the file is missing, invalid, contains unknown fields, or requests unsafe values, continue with safe defaults. Do not fail the task because profile config is absent.

## Shared Defaults

```yaml
user_mode: beginner
server_profile: low_resource # 2G/4-core relay default
hook_guard:
  check_before_computer_use: true
  ask_before_install: true
  deny_computer_use_when_missing: true
  imagegen_prompt_only_requires_hooks: false
```

## Default Selection Rule

If the user says nothing about capacity and `.codex/ae-skill-profiles.yaml` is missing, invalid, or unsafe, the effective profile is always `beginner + low_resource`. Treat `low_resource` as the installed default for a `2G/4-core relay` (`2G/4核中转`) and do not auto-upgrade based on local machine specs or optimism about the upstream.

## User Modes

| Mode | Behavior |
| --- | --- |
| `beginner` | Ask minimal questions, choose safe defaults, explain only the current step, hide advanced settings unless requested. |
| `standard` | Use safe defaults with modest budgets and show concise effective settings. |
| `expert` | Read whitelisted overrides, show effective config before risky work, and clamp values to hard limits. |

## Server Profiles

| Profile | Use case |
| --- | --- |
| `low_resource` | Installed default. Unknown relay, 2G/4-core server, or upstream that may reject large screenshot/context requests. |
| `standard` | Ordinary stable server or direct workflow with moderate budget. |
| `high_capacity` | Higher-capacity server; still subject to global hard limits and upstream risk. |

## Skill Override Sections

```yaml
skill_overrides:
  ae-computer-use-guard: {}
  ae-imagegen-prompt: {}
  ae-video-edit-computer: {}
```

## Whitelisted Overrides

`ae-computer-use-guard`:

- `max_screenshots_per_stage`
- `max_actions_per_stage`
- `max_image_width`
- `max_image_height`
- `image_quality`
- `max_stage_minutes`
- `max_failures_per_stage`

`ae-imagegen-prompt`:

- `default_aspect_ratio`
- `output_count`
- `style_strength`
- `prompt_language`
- `negative_prompt_level`
- `video_storyboard_mode`
- `reference_fidelity`
- `ask_before_generation`

`ae-video-edit-computer`:

- `target_editor`
- `default_platform`
- `output_resolution`
- `output_fps`
- `max_stage_duration_minutes`
- `local_tool_preference`
- `use_generated_images_when_missing`
- `subtitle_mode`
- `bgm_mode`

## Fallback And Clamp Rules

- Missing config, invalid config, unsafe config, or silent user: use `beginner + low_resource` as the `2G/4-core relay` default.
- Invalid YAML: ignore the file and continue with defaults.
- Unknown fields: ignore them and mention they were not applied.
- Values above hard limits: clamp to the nearest allowed value and report the effective value.
- Unsafe combinations: downgrade only the risky field when possible.

## Global Hard Limits

These cannot be bypassed by `expert` mode or `high_capacity` server profile:

- `max_images_per_request: 1`
- `keep_old_screenshots: false`
- `allow_raw_video_upload: false`
- `allow_unbounded_context: false`
- `require_stage_checkpoint: true`
- `require_failure_stop: true`
- `max_imagegen_output_count: 4`
- `require_reference_image_roles: true`
- `must_inventory_assets_before_gui: true`
- `must_use_ae_computer_use_guard_before_gui: true`
- `must_check_hooks_before_computer_use: true`
- `must_ask_before_hook_install: true`
- `deny_computer_use_when_hooks_missing: true`
- `imagegen_prompt_only_requires_hooks: false`
- `imagegen_gui_handoff_requires_hooks: true`
- `must_check_local_media_tools_before_video_processing: true`
- `must_ask_before_local_tool_install: true`
- `must_validate_export_locally: true`

## Effective Config Report

Before risky work, emit a compact report:

```text
Effective AE profile:
- user_mode:
- server_profile:
- applied overrides:
- clamped overrides:
- active hard limits:
```
