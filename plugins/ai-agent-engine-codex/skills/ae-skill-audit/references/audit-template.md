# External Skill Repository Audit Template

## Source

- Repository:
- Date:
- License:
- Supported harnesses:
- Primary purpose:

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

List patterns that can be expressed as Codex-native skill workflow, validation, documentation, or local script behavior.

## Platform-Specific Patterns

List patterns that depend on unavailable runtime behavior, such as hook enforcement, global command injection, or non-Codex agent registries.

## Deterministic Engineering Patterns

List portable workflow mechanics that constrain agent behavior without depending on a specific runtime, such as deterministic file selection, schema validation, routing contracts, evidence capture, reflection or filtering passes, dry-run previews, bounded tool access, or structured output checks.

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
