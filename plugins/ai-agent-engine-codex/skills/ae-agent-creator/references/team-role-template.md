# Team Role Prompt Template

Use the [adaptive team contract](../../ae-help/references/team-execution.md)
and [canonical role/model catalog](../../ae-help/references/team-roles.json).
Resolve the selected role's job and supported model/effort at dispatch. Keep job
definitions in that catalog; instance suffixes such as backend-1 and backend-2
do not create new roles. The parent holds the lead role and final acceptance.

This is a bounded native-tool prompt, not an auto-registered agent, permission
grant or isolated filesystem. Pass only relevant contracts and evidence.
Fill this assignment with inspected paths and observable acceptance:

```json
{
  "instance_id": "worker-1",
  "role": "worker",
  "unit_id": "U1",
  "contract_references": ["<approved plan and direct contract paths>"],
  "owned_files": ["<exclusive writable path>"],
  "read_only_files": ["<stable evidence path>"],
  "forbidden_files": ["<out-of-scope path>"],
  "dependencies": [],
  "shared_resources": [],
  "acceptance": "<observable accepted outcome>",
  "data_access_budget": "<applicable bound or not-applicable reason>",
  "allowed_checks": ["<command and permitted fixture/environment>"]
}
```

Dependencies require the parent's accepted completion, not another worker's
message. `acceptance` is text, matching the analyzer worker request.
`shared_resources` is an array of objects with `key` and `access` fields;
`access` is `read` or `write`. An empty array means the parent inspected and
found no shared resources. For example:

```json
[
  {"key": "api:items", "access": "read"},
  {"key": "schema:items", "access": "write"}
]
```

Shared reads are safe; no shared file
or resource may overlap a writer. Preserve user and peer edits. Review is
read-only; testers use assigned isolated fixtures. Documentation updates use
one owner for shared files.

Use follow-up repair instructions instead of recursive delegation. No unassigned
Git writes, service startup, lockfile changes, destructive cleanup or shared-state
cleanup. On an ownership conflict, failure or material contract change, stop the
affected assignment and return evidence for the parent; independent units may
continue. Respect explicit off switches, platform permissions and action-specific
authorization. Never report a queued, failed or skipped check as passing.

Return actual evidence in this shape; use empty arrays where appropriate:

```json
{
  "changed_files": [],
  "tests": [
    {
      "command": "<actual command>",
      "result": "<passed, failed, blocked or skipped; include actual exit result>",
      "evidence": "<observed result and its proof boundary>"
    }
  ],
  "risks": [],
  "conflicts": [],
  "unfinished_work": []
}
```

Separate static checks, install smoke, runtime/API/browser and deployment
evidence. The parent inspects the diff against ownership and verifies acceptance
before recording `passed`, releasing dependents or making delivery claims.
