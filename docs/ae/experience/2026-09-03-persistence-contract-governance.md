<!-- ae-codex:experience -->
# Persistence Contract Governance

## Outcome

Version `0.3.40` added a backend-owned persistence contract for new tables and material persistence changes. It requires an explicit primary-key and external-exposure decision, classifies table lifecycle, and keeps MyBatis-Plus entity fields conditional on repository stack and table semantics.

## Durable Decisions

- Do not default a new table to auto-increment or UUID when repository evidence does not decide the contract.
- Apply `@Version`, `@TableLogic`, audit fields, and fill policies only to applicable MyBatis-Plus mutable aggregates.
- Persist enums as stable business codes, not language ordinal positions; map validation, not-found, conflict, authorization, and infrastructure failures through the established handler/envelope.

## Evidence Boundary

The focused persistence regression, design-contract check, repository checks, install smoke, release-note check, and patch hygiene check passed. The full suite had two Windows symlink-fixture `EPERM` failures before product assertions. No target database, API, browser, or deployment behavior was exercised.

## References

- Requirements: `docs/ae/prds/2026-09-03-persistence-contract-governance-prd.md`
- Plan: `docs/ae/plans/2026-09-03-001-persistence-contract-governance-plan.md`
- Review: `docs/ae/reviews/2026-09-03-persistence-contract-governance-implementation-review.md`
- Shared contract: `plugins/ai-agent-engine-codex/skills/ae-backend/references/persistence-contract.md`
