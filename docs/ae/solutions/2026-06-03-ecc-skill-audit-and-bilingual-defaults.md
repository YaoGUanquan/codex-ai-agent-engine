# ECC Skill Audit And Bilingual Defaults

Date: 2026-06-03

## Summary

The project reviewed `affaan-m/everything-claude-code` as an external agent/skill workflow reference. The useful patterns were governance and process contracts, not direct runtime import.

The implemented adaptation adds `ae-skill-audit` and changes skill-list metadata defaults to bilingual.

## Adopted

- Add `ae-skill-audit` as a read-only entrypoint for external agent/skill repository analysis.
- Keep external repositories as research input and rewrite only portable workflow ideas.
- Make installed skill-list metadata default to `bilingual`.
- Keep `ae-language` as an advanced switch for `en`, `zh-CN`, and `bilingual`.
- Keep plugin source and `.agents/skills` mirror synchronized.

## Rejected

- Do not import the full ECC skill catalog.
- Do not emulate hook-heavy runtime behavior that Codex cannot enforce.
- Do not delete `ae-language`; it remains useful for explicit single-language display.

## Validation

```bash
cmd /c npm run check
node scripts/ae-tools.mjs help skill
```

The install smoke test must verify default bilingual metadata and explicit language switching for `en`, `zh-CN`, and `bilingual`.

