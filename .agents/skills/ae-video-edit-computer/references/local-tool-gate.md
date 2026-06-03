# Video Local Tool Gate

Run this gate before local preprocessing, rough video generation, subtitle burn-in, frame sampling, or export validation.

## Default Required Tools

| Tool | Needed For | Check |
| --- | --- | --- |
| `ffmpeg` | transcoding, trimming, concatenation, subtitle burn-in, local render assembly | `ffmpeg -version` |
| `ffprobe` | duration, codec, resolution, stream validation | `ffprobe -version` |

Optional tools such as ImageMagick, Python media libraries, or editor CLIs are checked only when the chosen workflow needs them.

## Flow

1. Identify which local tools the selected stage needs.
2. Run version checks with shell commands, not `Computer Use`.
3. If a required tool is missing, ask the user before installing it.
4. If the user approves, install using the platform-appropriate package manager or user-provided installer path.
5. If the user refuses, stop before the tool-dependent stage and offer a local-plan-only or GUI-only fallback when safe.

## Install Request Text

```text
This video stage needs local media tools: ffmpeg/ffprobe.
They are missing or unavailable on PATH.
Approve installing or configuring these tools before video processing continues?
```

## Stop Conditions

- Missing required tool and user refuses installation.
- Tool installation requires admin rights the user does not approve.
- Installed tool still fails the version check.
- The task would require uploading raw video through conversation context.
