#!/usr/bin/env python3
"""Example Codex hook guard for AE Computer Use workflows.

This template is intentionally conservative and must be reviewed against the
current Codex hooks schema before enabling in a real project.
"""

import json
import sys


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print(json.dumps({"decision": "deny", "reason": "Hook input is not valid JSON"}))
        return 0

    text = json.dumps(payload, ensure_ascii=False).lower()
    risky_markers = [
        "computer use",
        "screenshot",
        "raw video",
        "base64",
        "image/jpeg",
        "image/png",
    ]

    if "raw video" in text:
        print(json.dumps({"decision": "deny", "reason": "Raw video upload is blocked by AE guard"}))
        return 0

    if text.count("image/") > 1:
        print(json.dumps({"decision": "deny", "reason": "More than one image marker detected"}))
        return 0

    if any(marker in text for marker in risky_markers):
        print(json.dumps({"decision": "allow", "reason": "AE guard inspected risky marker; continue only with stage contract"}))
        return 0

    print(json.dumps({"decision": "allow", "reason": "No AE Computer Use risk marker detected"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
