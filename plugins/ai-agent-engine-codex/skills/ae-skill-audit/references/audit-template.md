# External Skill Repository Audit Template

## Source

- Repository:
- Date:
- License:
- Supported harnesses:
- Primary purpose:
- Source URL:
- Freshness method: `git ls-remote <repo-url> HEAD` / local clone / unavailable
- Ref source: HEAD / branch / tag / user-supplied commit
- Observed commit:
- User supplied ref or short hash:
- Commit status: current / commitMismatch / unreachable-short-hash / offline-unverified
- Inspected files:

## License Compatibility

- SPDX or stated license:
- Project compatibility:
- Copying allowed:
- Attribution or notice required:
- Reuse boundary:

## Structure

- Skills:
- Agents:
- Hooks or automation:
- Commands or scripts:
- MCP or external services:
- Installer or manifest:

## Portable Patterns

List portable method candidates that can be expressed as Codex-native skill workflow, validation, documentation, or local script behavior.

## Platform-Specific Patterns

List patterns that depend on unavailable runtime behavior, such as hook enforcement, global command injection, or non-Codex agent registries.

## Deterministic Engineering Patterns

List portable workflow mechanics that constrain agent behavior without depending on a specific runtime, such as deterministic file selection, schema validation, routing contracts, evidence capture, reflection or filtering passes, dry-run previews, bounded tool access, or structured output checks.

## Skill Optimization Pattern Filter

- Optimization claim:
- Trajectory source: real sessions / synthetic tasks / benchmark split / user task file / unverifiable demo
- Train or replay evidence:
- Held-out validation or gate:
- Gate metric and accept rule:
- Candidate edit shape: add / replace / delete / full rewrite / memory append / live mutation
- Edit budget or protected region:
- Rejected update handling:
- Staging and adoption policy:
- AE validation mapping: mirror check / skill contract check / claim check / gate proof / future replay suite
- Direct adoption blockers:
- Safe AE rewrite:

## Runtime Boundary Classification

| Finding | Category | Evidence | AE action |
| --- | --- | --- | --- |
|  | portable method |  | improve existing skill / create skill / reference / reject |
|  | local deterministic mechanism |  | script or validation candidate |
|  | runtime-specific behavior |  | reject or rewrite as process contract |

## Source Freshness Notes

- `git ls-remote` output or reason unavailable:
- Local checkout commit if used:
- Remote/local commit mismatch:
- Short hash resolution:
- Files inspected for the conclusion:

## AE Fit

For each candidate pattern, decide:

- `Improve existing skill`
- `Create new skill`
- `Add reference/template`
- `Reject`
- `Defer`

Include the target AE skill or proposed skill name.

## Implementation Impact

- Plugin source files:
- `.agents/skills` mirror files:
- Help catalog:
- Language metadata:
- README or docs:
- Validation commands:

## Verdict

Use one verdict:

- `ADOPT`: clear fit and low maintenance cost.
- `ADAPT`: useful, but requires Codex-specific rewriting.
- `DEFER`: promising but needs more evidence.
- `REJECT`: poor fit, duplicate, unsafe, or license/platform mismatch.
