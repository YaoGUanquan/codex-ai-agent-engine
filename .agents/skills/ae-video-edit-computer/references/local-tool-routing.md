# Local Tool Routing

Prefer compact structured local outputs over GUI screenshots.

## Use Local Tools For

- File and folder inventory.
- Media duration, codec, resolution, and audio stream checks.
- Frame extraction or thumbnails.
- Transcoding, trimming, rough concatenation, or format normalization.
- Export validation.

Run `references/local-tool-gate.md` before using FFmpeg/ffprobe-dependent local workflows.

## Use Computer Use For

- Opening the editor project.
- Importing prepared assets when no script/API path is available.
- Placing assets on the timeline when the GUI is required.
- Confirming export settings.
- Starting export and observing completion.

Run `ae-computer-use-guard` and pass its hooks gate before this section.

## Avoid In Computer Use

- Browsing large folders visually.
- Repeatedly analyzing the same timeline screenshot.
- Reading long logs or metadata windows.
- Understanding raw video content without local summaries.
- Carrying screenshots across stages.
