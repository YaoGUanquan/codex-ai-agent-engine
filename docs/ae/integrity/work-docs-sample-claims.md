---
type: design
status: drafted
date: 2026-07-06
topic: work-docs-claim-samples
---

# Work Docs Claim Samples

These `ae-claim` blocks exercise `scripts/check-claims.mjs --dry-run` against a copied subset of `D:/codes/work/docs`.

The source project is not modified. Copied files live under `docs/external-samples/work-docs/`.

```ae-claim
id: WORKDOCS-PRD-1
claim: A copied PRD sample is available for claim-checker path evidence validation.
source: docs/ae/integrity/work-docs-sample-claims.md
layer: Knowledge
status: active
evidenceType: path
evidence: docs/external-samples/work-docs/ae/prds/2026-07-06-student-import-oss-preview-prd.md
```

```ae-claim
id: WORKDOCS-PLAN-1
claim: A copied long-form implementation plan sample is available for claim-checker path evidence validation.
source: docs/ae/integrity/work-docs-sample-claims.md
layer: Knowledge
status: active
evidenceType: path
evidence: docs/external-samples/work-docs/ae/plans/2026-07-06-001-student-import-oss-preview-plan.md
```

```ae-claim
id: WORKDOCS-GATE-1
claim: A copied final gate JSON sample is available for claim-checker path evidence validation.
source: docs/ae/integrity/work-docs-sample-claims.md
layer: Guardrail
status: active
evidenceType: path
evidence: docs/external-samples/work-docs/ae/gates/20260629T223000Z-external-manifest-preset-grading-mode-smoke.json
```

```ae-claim
id: WORKDOCS-SMOKE-1
claim: A copied smoke report sample is available for claim-checker path evidence validation.
source: docs/ae/integrity/work-docs-sample-claims.md
layer: Guardrail
status: active
evidenceType: path
evidence: docs/external-samples/work-docs/00-process/archive/2026-06/external-manifest-to-assignment-grading/smoke-report-2026-06-29.md
```

```ae-claim
id: WORKDOCS-COMMAND-1
claim: Copied gate samples contain real validation commands that can later inform a command allowlist.
source: docs/ae/integrity/work-docs-sample-claims.md
layer: Guardrail
status: active
evidenceType: command
evidence: mvn -pl axon-common -Dtest=ExamAssignmentGradingServiceImplTest#createTaskFromExternalGenericManifest_mapsExternalManifestAndCreatesTask test
reason: dry-run records command evidence but does not execute external project commands
```

```ae-claim
id: WORKDOCS-ASSUMPTION-1
claim: These copied samples are representative enough to test claim schema adoption, not to prove all work-docs history.
source: docs/ae/integrity/work-docs-sample-claims.md
layer: Knowledge
status: assumption
evidenceType: assumption
evidence: selected PRD, plan, gate, and smoke artifacts from D:/codes/work/docs
reason: this is a small curated subset, not a full corpus migration
```

```ae-claim
id: WORKDOCS-DEFERRED-1
claim: Strong gate upgrade remains deferred until command allowlist and execution isolation are designed.
source: docs/ae/integrity/work-docs-sample-claims.md
layer: Guardrail
status: deferred
evidenceType: deferred
evidence: command allowlist design and isolated execution policy
reason: current checker intentionally performs dry-run validation only
```
