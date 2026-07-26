# Review Capability Upstream Adaptation

## Scope

- Branch: `main`.
- Audited `code-review-graph`, `open-code-review`, and Spec Kit for portable AE review improvements.

## Decision

- Adapt deterministic changed-file inventory and optional bounded shallow impact context into existing review surfaces.
- Retain existing AE traceability/evidence workflow instead of creating a Spec Kit-like duplicate command.
- Reject external runtime installation, persistent graph storage, MCP/hook wiring, model/provider configuration, benchmark claims, and copied source.

## Implemented

- `review-package` now returns a complete Git-derived inventory and can add `--with-impact` advisory context.
- `ae-review` source and mirror require changed-file accounting and explicit exclusions.
- Distribution version advanced from `0.3.1` to `0.3.2` in both required manifests.
- The upstream audit, brainstorm, PRD, plan, review record, and long-term memory note are stored under established AE directories.

## Validation

- `node --test --test-name-pattern="review-package" tests/skill-scripts.test.mjs`: passed 2/2.
- `npm test`: passed 83/83.
- `npm run check`: passed, including mirror, artifact, installation smoke, and shallow graph checks.
- `git diff --check`: passed.

## Review

- Review contract evidence: `docs/ae/evidence/artifacts/review-contract/20260726T040216598Z-dbbd474e4e33.json`.
- Reviewer and architect lanes: APPROVE.
- Residual risk: static impact context is intentionally incomplete for dynamic/framework resolution.
