---
type: prd
status: drafted
date: 2026-06-29
topic: recognition-task-404-terminal-cache-deferred
format: human-readable-requirements
sharded: false
---

# Recognition Task 404 Terminal Cache Deferred PRD

## Context

The current recognition task polling path is front-end driven:

```text
front end
  -> axon proxy API: recognition task status by jobId
      -> third-party task status API
```

When the third-party service returns HTTP 404 because a job has expired, the task is missing, the third-party deployment is temporarily inconsistent, or the configured route is unavailable, the proxy request can return a terminal NOT_FOUND response to the client. Current investigation found that this terminal 404 may not be cached as a local terminal task snapshot when the third-party response lacks an explicit `status=failed` field.

This is accepted as a temporary risk while the third-party interface and persistence contract are still stabilizing. After the third-party interface is stable and related task data is persisted in the database, the same jobId should converge locally and stop repeatedly calling the third-party task status API.

## Goals

- Record the deferred requirement for local terminal convergence on recognition task 404 responses.
- Preserve the current short-term decision: no immediate code change is required.
- Make the future acceptance criteria explicit before later implementation planning.

## Requirements

### R1: Persist Definite Third-Party Not-Found Results As Terminal

When the proxy polls a third-party recognition task and receives a definite not-found result, the system must persist a local terminal failed snapshot for the jobId.

Acceptance: A subsequent poll for the same schoolId and jobId is served from local terminal data and does not call the third-party task status API again.

### R2: Treat Expired Or Missing Jobs As Terminal, Not Transient

Definite not-found signals must include HTTP 404 and third-party response text such as `No such job`, `task not found`, `expired`, or equivalent confirmed third-party messages.

Acceptance: A response with HTTP 404 and no explicit `status=failed` field still becomes a local terminal failed snapshot when it has a jobId and belongs to the current school boundary.

### R3: Preserve Transient Failure Semantics

Network failures, timeouts, 408, 429, and 5xx responses must remain transient unless the third-party contract later defines a specific terminal payload for them.

Acceptance: Transient failures do not poison the local task cache as failed terminal snapshots.

### R4: Keep Existing Background Queue Behavior Unchanged

The existing generic grading and OMR JSON background queue fail-fast behavior is not part of this deferred change unless a later plan explicitly expands scope.

Acceptance: Existing 404 fail-fast tests for generic grading and OMR decision classification remain valid.

## Non-Goals

- No immediate implementation in this task.
- No change to third-party API routing, deployment, or retry configuration.
- No change to front-end polling cadence before the third-party persistence contract is stable.
- No SQL migration is required until implementation planning confirms the final persistence shape.

## Constraints

- Any future implementation must preserve schoolId/jobId isolation.
- Terminal snapshots must not cache transient infrastructure failures as permanent business failures.
- Error text stored for terminal failures should be concise and safe for operational display.
- Existing `exam_third_party_recognition_task` usage must be reviewed before schema changes are proposed.

## Assumptions

- Short-term repeated front-end polling of expired or missing third-party jobs is acceptable while the third-party side stabilizes.
- The third-party task status API will eventually provide stable enough identifiers and response semantics for local persistence to be authoritative.
- The current generic grading queue 404 fail-fast behavior is already sufficient and should not be revisited in this deferred item.

## Open Questions

- OQ1: Should local terminal cache retention remain the current default retention window, or should expired/not-found jobs use a shorter TTL?
- OQ2: Which third-party messages are officially guaranteed not-found signals after the interface stabilizes?
- OQ3: Should the client receive the same NOT_FOUND response shape from cached terminal failures as from live third-party 404 responses?

## Validation Expectations

- Unit tests for recognition task polling must prove HTTP 404 without `status=failed` is persisted as terminal failed.
- Unit tests must prove subsequent same jobId polls read the cached terminal and skip the third-party gateway.
- Regression tests must prove transient failures are not cached as terminal failed.
- Existing generic grading poll decision tests must continue passing.

## Deferred Planning Questions

- Whether the fix belongs in `ExamRecognitionServiceImpl`, `ExamThirdPartyRecognitionTaskStoreServiceImpl`, or a shared recognition task terminal decision helper.
- Whether `findCachedTerminal` should accept terminal failed snapshots based on `last_http_status=404`, normalized stored status, explicit not-found text, or a new reason field.
- Whether a schema migration is needed for terminal reason codes.

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Consistency Check

- Requirements: 4
- Non-functional constraints: 4
- Decisions: 1 deferred short-term decision recorded
- Open questions: 3
