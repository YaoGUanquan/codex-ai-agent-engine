# Computer Use Guard Profiles

## Server Budgets

Default selection: when the user does not specify capacity and no valid safe config exists, use `low_resource`. This is the installed `2G/4-core relay` (`2G/4核中转`) mode and must not be auto-upgraded from local desktop hardware signals.

| Field | low_resource | standard | high_capacity |
| --- | ---: | ---: | ---: |
| `max_image_width` | 960 | 1280 | 1600 |
| `max_image_height` | 540 | 720 | 900 |
| `image_quality` | 45 | 55 | 65 |
| `max_screenshots_per_stage` | 1 | 2 | 3 |
| `max_consecutive_screenshots` | 1 | 1 | 1 |
| `max_actions_per_stage` | 3 | 5 | 8 |
| `max_stage_minutes` | 8 | 12 | 15 |
| `max_failures_per_stage` | 1 | 2 | 2 |

## Expert-Configurable Fields

- `user_mode`
- `server_profile`
- `max_screenshots_per_stage`
- `max_actions_per_stage`
- `max_image_width`
- `max_image_height`
- `image_quality`
- `max_stage_minutes`
- `max_failures_per_stage`

## Non-Configurable Fields

- `max_images_per_request`
- `keep_old_screenshots`
- `allow_raw_video_upload`
- `allow_unbounded_context`
- `require_stage_checkpoint`

## Beginner Mode

Use the `low_resource` server profile as the `2G/4-core relay` default, ask only for the target app or task when missing, and stage every GUI action. Do not expose budget controls unless the user asks.

## Expert Mode

Apply only whitelisted overrides. Show the effective profile before using `Computer Use`. Clamp any value that exceeds the selected server profile or global hard limits.
