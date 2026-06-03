# AE Computer Use Hooks Templates

These files are examples for projects that want a hooks-ready gate before Codex `Computer Use`.

Do not silently install or trust hooks. The user must review and trust hooks in the active Codex surface before GUI control continues.

Default policy:

- `Computer Use` requires hooks-ready protection on the `2G/4-core relay` profile.
- Missing hooks require user approval before installation.
- User refusal blocks `Computer Use`; local-only work can continue.
- Image prompt-only work does not require hooks.
- Video preprocessing also requires local `ffmpeg` and `ffprobe` checks before tool-dependent stages.

Server middleware is still required to hard-block oversized upstream request bodies.
