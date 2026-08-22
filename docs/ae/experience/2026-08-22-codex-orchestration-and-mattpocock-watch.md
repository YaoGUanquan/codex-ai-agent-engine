<!-- ae-codex:experience -->
# Codex Orchestration, Local Tracker, and mattpocock Watch (0.3.32–0.3.34)

## What landed

| Version | Durable remainder |
| --- | --- |
| 0.3.32 | `task-analyze` worker envelope, offline HTML `report`, local `issue` tracker, static 40-skill `skill-audit` |
| 0.3.33 | Markdown report output; audit `findingCount` includes deferred findings |
| 0.3.34 | `docs/ae/references/external-skill-watchlist.json` and `skill-audit --watch` |

Portable methods from `https://github.com/mattpocock/skills` were rewritten into `ae-debug`, `ae-tdd`, `ae-review`, `ae-refactor`, and `ae-tasks`. The Claude plugin, `npx skills`, and verbatim skill copies were rejected.

## Authority

PRD/plan define intent and design. Tasks define execution units. Issues only track status and links. Review/gate/evidence define proof. A stale `--watch` result is a candidate list, not an authorized skill edit.

## Recheck

```text
node scripts/ae-tools.mjs skill-audit --watch
```

`current` means the pinned commit still matches. `stale` names `affectedSkills`. `unavailable` is a freshness failure, not “unchanged”. Follow-up issue: `docs/ae/issues/AEI-20260822-003.md`.

## Validation boundary

Local tests, mirror checks, and install smoke prove the plugin contract. They do not prove Codex parents adopt worker suggestions, later upstream commits, or skill outcomes in real projects. On this Windows host, two symlink-escape tests can fail with `EPERM` without invalidating the watch or skill locks.

Current-user apply `c84da2a4-5cff-492d-88ff-8df922371c31` published `ai-agent-engine-codex@personal` 0.3.34 and 40 real `~/.cursor/skills/ae-*` directories. Open a new Cursor chat to refresh `/ae`.
