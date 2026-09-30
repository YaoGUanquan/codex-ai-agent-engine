# Review Preparation

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## Deterministic Review Preparation

For an S2/S3 branch or commit range, create a review package before drawing conclusions; S1 light-path reviews are exempt and inspect the locked target files directly:

```powershell
node "$aeEntry" review-package --base <base-ref> --head <head-ref> --with-impact
```

Treat the returned `inventory.files` as the complete changed-file review set. Every file must either be reviewed or be listed in the final result as excluded with a concrete reason. Do not silently omit configuration, documentation, tests, renames, binary files, or untracked artifacts that are in the selected scope.

`--with-impact` adds a bounded, shallow static dependency context. Use it when changed source/configuration files may affect imports or mentioned local paths; inspect relevant related files or explain why they do not alter the finding. It is advisory only: dynamic imports, aliases, generated code, and framework resolution can be absent, so it never proves the impact set is complete.

For S2/S3 workspace or session review, establish the same inventory from `git status --short` and the selected scope, then use `review-contract` after file inventory to select lenses; it selects reviewers, not files or findings. S1 light-path workspace/session reviews inspect the locked target files directly and skip `review-contract`.

## Diff Review Discipline

For S2/S3 fixed-point branch or commit-range reviews, keep two distinguishable lenses: **Standards** (repository rules and maintainability baseline) and **Spec** (originating PRD, plan, task, or issue alignment). Pin the base and head before reading the diff, capture the commit list and complete changed-file inventory, then resolve the nearest originating specification from linked issues or `docs/ae` artifacts. A missing spec is a verification gap, not permission to invent requirements. S1 reviews remain on the light path unless the user explicitly asks for this comparison.

Apply this section only when `domain:code` uses a diff-like scope: `from:<ref>`, `recent:<N>`, `session`, or the default Git status/diff review. `full` and `full:<path>` remain repository or path scans and must not be narrowed to changed lines only.

For diff-like scopes:

- Establish the changed-file inventory before line-level analysis. Include the inventory count and every explicit exclusion in the review output or delivery evidence.
- Make the finding subject newly added or modified code whenever possible. Deleted lines, unchanged context, and other files may support the evidence, but they should not become the primary finding unless the user explicitly requested a broader scan.
- Perform a manual position check before finalizing each code finding: re-open the target file, diff, or hunk context and confirm the path plus line still identifies the affected code. If the exact line is uncertain, report the finding at path level and state the location uncertainty.
- Run a contradiction check before final output. If the reviewed diff directly contradicts a finding's factual claim, mark the finding as contradicted or remove it only when the contradiction is certain. Do not discard security, reliability, contract, or architecture findings merely because the diff alone cannot prove them.
- When file type matters, consult `code-review-rule-profiles.md` as optional review lenses. The profiles are not an automatic rule engine and do not replace project-specific requirements or the selected reviewer personas.

## Persona Selection

For scoped database-backed list/query/count or write behavior, review against the [data-access and scale contract](../../ae-backend/references/data-access-contract.md), including document/design reviews and unchanged-schema paths. Add performance for scale-sensitive access (pass `--has-performance` when using `review-contract`), reliability for async/chunk recovery, API-contract for total/acceptance changes and data-migrations for auxiliary structures/backfills. Check concrete query budgets, fan-out/count semantics, batch versus commit, derived-data maintenance and durable completion; do not turn missing runtime measurements into an invented speed claim or require every lane for bounded CRUD.

Read `review-personas.md`. Use the smallest useful reviewer set. Quick selection: a code diff starts with correctness, testing, standards, and maintainability; add security, api-contract, reliability, data-migrations, or performance only when the matching trigger exists; a document starts with coherence and feasibility plus content-conditional lenses. For new tables, entity persistence changes, or migrations, read `../../ae-backend/references/persistence-contract.md` and add the data-migrations lens. For frontend component, style, form, query, mutation, or client-access changes, read `../../ae-frontend-design/references/component-data-access-contract.md` and apply the Frontend Components / Styles profile with the API-contract lens when data access changes. Do not spawn sub-agents unless the user explicitly requested/allowed parallel agent work. If sub-agents are allowed, each reviewer is read-only and must return evidence-backed findings.

When reviewer selection is non-trivial, generate a deterministic contract before dispatching lanes:

```powershell
node "$aeEntry" review-contract --kind code --mode report-only --targets code,document --write-evidence
```

Use the returned reviewers and target coverage as the review routing baseline. The command writes lightweight evidence under `docs/ae/evidence` only when `--write-evidence` is present.

If `.codex/ae-skill-profiles.yaml` has `multi_agent.enabled: auto` or `multi_agent.enabled: true`, and `multi_agent.review_lanes_parallel: true`, read-only reviewer lanes may run in parallel when the scope is large enough and each lane has a distinct lens. When `task-analyze` is available, use `read_parallel_eligibility` and `parallel_waves` for read-only lane planning; do not treat write-worker blockers as blockers for read-only review. This does not authorize write workers. Keep reviewer outputs evidence-backed and merge them under the strictest verdict. `multi_agent.enabled: false` disables parallel reviewer lanes.

For S2/S3 code or plan reviews, or when the user explicitly requests layered review, apply two lanes even when you are not spawning sub-agents:

- reviewer lane: correctness, testing, security, contracts, reliability, and concrete regression risk,
- architect lane: boundary fit, coupling, long-term maintainability, alternatives, rollback, and whether the chosen shape matches the stated decision drivers.

The lanes may be evaluated by one agent, but their conclusions must stay distinguishable in the review notes or final summary when they disagree.
