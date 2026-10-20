# Task Routing

Use this routing before starting the full AE LFG workflow.

| Class | Signals | Route |
| --- | --- | --- |
| S1 simple answer | factual question, quick explanation, no repo change | answer directly; do not create AE artifacts |
| S2 fuzzy idea | broad goal, unclear behavior, multiple product directions | use ae-brainstorm |
| S3 bounded implementation | clear goal and acceptance, including understood multi-file changes | use ae-work after Git checks; load specialist checks for concrete risks |
| S4 full workflow | explicitly requested full pipeline, materially unresolved design, or a concrete risk requiring coordinated stages | use ae-lfg; reuse approved decisions and load only required stages |
| S5 read-only review | user asks review/audit/report-only | use ae-review mode:report-only |
| S6 Git-only request | commit, merge, branch, push, tag | follow Codex Git approval rules; do not start implementation |
| S7 mixed request | implement plus commit/review/deploy | split stages; finish implementation/validation before Git write or deploy |

Multiple files or modules alone do not require S4. Auth, migration, public contracts and external side effects require the relevant specialist checks and authorization; escalate to S4 only when they introduce material unresolved decisions or an applicable rule requires coordinated planning. A request naming one AE skill activates that capability, not the full workflow.
