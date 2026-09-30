# Claim And Shipping

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## Claim-Evidence Mapping

When a task changes docs, README, installation behavior, capability claims, or skill behavior, record what proves each changed claim before shipping:

- evidence path, validation command, or explicit assumption; when useful, also cite the inspected file or observed external ref;
- whether the claim affects Memory, Knowledge, Guardrail, Delegation, or Distribution;
- whether unsupported runtime behavior was rejected or rewritten as a process contract;
- whether any correction or retraction belongs under `docs/ae/integrity/`.

If a changed claim cannot be tied to evidence, downgrade it to an assumption, remove it, or route it to ae-review. Do not claim success from a generated file alone.

## Shipping

Read `shipping-workflow.md` before final response.

When ready, run a final gate, for example:

```powershell
node "$aeEntry" gate --workflow work --checkpoint final --plan <path> --validation "npm test" --validation-result '<execution-result-json>' --review-status <actual-status> --worktree-decision <actual-decision> --write-proof
```

`--validation` only declares a command. Each `--validation-result` is a JSON object with `command`, `status` (`declared`, `executed`, `successful`, `failed`, or `unverified`) and optional `tier`. Execution records also require actual `exitCode`, `startedAt`, `finishedAt` and a repository-relative `evidence` artifact path. The gate hashes the artifact without executing commands; declarations, missing evidence and unsuccessful results cannot pass final validation. Preserve failed/skipped results and never manufacture execution records to pass the gate.

Final response sections: completed, verified, unverified/unable to verify, Git operations, gate result, residual risks.
