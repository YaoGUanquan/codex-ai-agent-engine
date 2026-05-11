# Task Routing

Use this routing before starting the full AE LFG workflow.

| Class | Signals | Route |
| --- | --- | --- |
| S1 simple answer | factual question, quick explanation, no repo change | answer directly; do not create AE artifacts |
| S2 fuzzy idea | broad goal, unclear behavior, multiple product directions | use ae-brainstorm |
| S3 small fix | precise bug or edit, likely <=2 production files, low risk | use ae-work light path after Git checks |
| S4 multi-step implementation | cross-module, new behavior, API/data/auth/config, unclear validation | use ae-lfg or ae-plan before work |
| S5 read-only review | user asks review/audit/report-only | use ae-review mode:report-only |
| S6 Git-only request | commit, merge, branch, push, tag | follow Codex Git approval rules; do not start implementation |
| S7 mixed request | implement plus commit/review/deploy | split stages; finish implementation/validation before Git write or deploy |

Escalate S3 to S4 when the task touches auth, authorization, data migration, external APIs, public API contracts, shared config, new abstractions, or unclear acceptance criteria.
