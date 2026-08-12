---
name: ae-language
description: Use when the user asks for AE language, /ae-language, switch AE display language, make AE local skills Chinese, English, or bilingual, or update local AE skill UI metadata language.
---

# AE Language

Switch local AE skill display language.

## Workflow

1. Choose `zh-CN`, `en`, or `bilingual`; default to the user's requested language.
2. Run `node scripts/set-ae-language.mjs --lang <lang>` from the project root.
3. Verify representative `agents/openai.yaml` files changed as expected.
4. If a plugin source and installed `.agents/skills` copy both exist, keep both synchronized.

## Rules

- This changes display metadata only; it does not translate implementation code.
- Keep skill names stable so triggers continue to work.
