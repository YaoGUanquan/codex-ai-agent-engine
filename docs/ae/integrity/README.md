---
type: design
status: drafted
date: 2026-07-06
topic: ae-integrity-ledger
---

# AE Integrity Ledger

Use this directory for claim corrections, retractions, and methodology fixes that affect AE skills, public documentation, install behavior, benchmark claims, validation claims, or workflow guidance.

This is not a general experience log. Use `docs/ae/experience/` for reusable lessons, `docs/00-process/active/` for in-progress notes, and `docs/ae/reviews/` for ordinary review reports.

## Entry Contract

Each future ledger entry should record:

- date,
- affected claim or workflow,
- original source path,
- correction or retraction,
- evidence that triggered the correction,
- validation or review performed after the correction,
- follow-up owner or deferred work when applicable.

## Claim Block Schema

`scripts/check-claims.mjs --dry-run` validates only explicit Markdown fenced blocks opened with `ae-claim`. Ordinary prose is not scanned for claims.

Example:

````markdown
```ae-claim
id: CLAIM-PATH-1
claim: The skill mirror checker validates source and mirror skill parity.
source: docs/ae/integrity/README.md
layer: Guardrail
status: active
evidenceType: path
evidence: scripts/check-skill-mirror.mjs
```
````

Required fields:

- `id`: uppercase hyphen-separated identifier.
- `claim`: the material claim being checked.
- `source`: repository-relative path where the claim is made.
- `layer`: one of `Memory`, `Knowledge`, `Guardrail`, `Delegation`, or `Distribution`.
- `status`: one of `active`, `assumption`, `deferred`, or `retracted`.
- `evidenceType`: one of `path`, `command`, `assumption`, or `deferred`.
- `evidence`: path, command, assumption note, or deferred evidence note.

Dry-run rules:

- `path` evidence must be an existing repository-relative path.
- `command` evidence is recorded but not executed.
- `assumption` and `deferred` evidence require `reason`.
- The checker reports command, assumption, and deferred evidence as not automatically verified.

## Rules

- Do not silently rewrite history when a public or workflow claim was materially wrong.
- Do not bury retractions inside unrelated experience notes.
- Do not store secrets, credentials, private data, or raw sensitive outputs.
- Link to evidence paths or validation commands instead of copying long logs.
