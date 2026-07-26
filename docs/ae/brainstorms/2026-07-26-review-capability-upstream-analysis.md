<!-- ae-codex:experience -->

# Review Capability Upstream Analysis

## Problem Frame

The project already has AE review personas, a review contract, a review-package artifact, and a shallow read-only dependency graph. Review preparation does not yet expose a machine-readable complete changed-file inventory or connect the optional graph context to a range review.

## Perspective Collision

| Perspective | Position | Collision Insight |
| --- | --- | --- |
| Critic | A graph can miss dynamic or framework edges and create false confidence. | Graph output must be advisory and state limitations. |
| Pragmatist | Reviewers need a deterministic list of every changed file before applying judgment. | The review package should become the source of the changed-file inventory. |
| Innovator | Impact-radius context can reduce irrelevant reading on larger changes. | Add a bounded optional traversal without a persistent graph service. |
| Systems | New CLIs, MCP servers, hooks, and model configuration increase distribution burden. | Reuse the existing Node script and skill mirror instead of integrating external runtimes. |

## Chosen Scope

- Add an exact Git-derived changed-file inventory to `review-package`.
- Add opt-in shallow impact context for branch or commit range review.
- Require `ae-review` to account for every selected changed file and label impact context advisory.
- Keep the implementation local, read-only, dependency-free, and mirrored.

## Non-Goals

- Do not install or vendor `code-review-graph`, `open-code-review`, or Spec Kit.
- Do not add MCP configuration, hooks, persistent graph storage, model providers, CI integration, or automatic review decisions.
- Do not claim graph-derived context is a complete impact analysis.

## Validation Signals

- The package reports changed paths, status, diff counts, and role classification.
- `--with-impact` produces bounded advisory context with explicit limitations.
- The source and mirror `ae-review` skills remain identical.
- Targeted and full project validation pass.
