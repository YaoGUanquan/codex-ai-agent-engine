# Work Subagent Template

For a safe team assignment, use the canonical
[team role prompt](../../ae-agent-creator/references/team-role-template.md) and
[adaptive team contract](../../ae-help/references/team-execution.md). Keep
small tasks inline; this template does not register agents or grant tools.

Fill the role and instance, assigned unit, owned/read-only/forbidden paths,
dependencies, resource access, acceptance, data budget and allowed checks.
Pass direct contract references and relevant evidence, not the full parent
transcript. Multiple instances may reuse one role's job contract.

Workers share a codebase: preserve others' edits, use exclusive writes and
shared reads, and stop affected work on unresolved ownership or business-contract
conflicts. Do not read a file while another worker writes it. No recursive fan-out,
staging, commit, push, destructive cleanup, service startup, broad formatting or
lockfile edits unless assigned and separately authorized where required.

Return `changed_files`, `tests` with actual command/result/evidence,
`risks`, `conflicts` and `unfinished_work`, including blocked or skipped checks.
A completion message alone cannot release a dependency. The parent reviews
the actual diff and verifies acceptance, integrates changes and owns delivery.
