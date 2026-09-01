---
type: prd
status: completed
date: 2026-09-01
topic: agents-md-aware-init
format: human-readable-requirements
sharded: false
---

# AGENTS.md-aware AE Init

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

`ae-init` already creates a root `AGENTS.md` and AE documentation scaffold, but it does not use several important properties of the open AGENTS.md format: useful repository commands are detected but omitted, nested instruction scopes are not surfaced, and Codex-specific override precedence is not diagnosed. Its legacy `--force` behavior can also replace a managed file after users have added durable rules. The desired outcome is a standards-aware, conservative initializer with explicit scaffold sizes and evidence that explains what Codex will actually read.

## Requirements

**Initialization profiles**
- R1. Init must provide `minimal`, `ae-core`, and `full` profiles, with `ae-core` as the default and `full` retaining the legacy complete directory set.
  Acceptance: dry-run tests prove each profile's file and directory boundary and an invalid profile fails clearly.

**Useful project guidance**
- R2. A generated `AGENTS.md` must include repository-derived build, test, lint, or package scripts when they are available.
  Acceptance: a fixture with package scripts produces those commands in the generated file without inventing commands.
- R3. Init must report existing root and nested `AGENTS.md` / `AGENTS.override.md` files and distinguish the general AGENTS.md convention from Codex-specific precedence.
  Acceptance: `--explain-instructions` returns a deterministic inventory and identifies a root override as effective for Codex.
- R4. Init must offer a read-only nested preview that suggests likely subproject instruction locations without creating them.
  Acceptance: `--nested=preview` finds bounded nested project manifests and dry-run/real execution create no nested `AGENTS.md` files.

**Overwrite safety**
- R5. Regeneration must preserve user-authored content outside a clearly delimited AE-managed region and must not overwrite legacy marker-only files whose drift cannot be proven.
  Acceptance: tests prove managed-region replacement preserves surrounding text and legacy managed files are reported as conflicts.

**Distribution consistency**
- R6. Skill guidance, help/catalog claims, source mirror, release notes, version metadata, and external-source provenance must match the implemented behavior.
  Acceptance: repository contract, release-note, smoke, and diff checks pass.

## Non-Functional Requirements

- NFR1. Initialization remains dependency-free, UTF-8, deterministic, path-bounded, and preserves existing non-managed files by default.
  Acceptance: focused tests cover dry-run parity, invalid options, bounded discovery, and preservation behavior.

## Success Criteria

- A new project can choose the smallest useful scaffold.
- Generated guidance contains real repository commands.
- Operators can see instruction precedence and nested candidates before writing files.
- `--force` cannot silently erase user additions from legacy or region-managed files.

## Scope Boundary

### In Scope

- `ae-init` skill and deterministic init CLI behavior.
- Root instruction inventory, bounded nested candidate discovery, and profile selection.
- Tests, help/catalog text, provenance, version, and release notes.

### Out Of Scope

- Generating Cursor, Gemini, Aider, or other client-specific configuration files.
- Automatically creating nested instruction files.
- Parsing every language's complete workspace grammar or claiming identical precedence across clients.
- Migrating existing project files automatically.

### Constraints

- Preserve the user's current `0.3.38` GSAP changes and release notes.
- Do not add dependencies.
- Treat the official `agentsmd/agents.md` repository as MIT reference input, not source text to copy.

## Perspective Collision

- Critic: changing the default scaffold can surprise existing automation; this is a value disagreement about compatibility versus minimality.
- Pragmatist: profiles make the legacy shape explicit while reducing new-project noise.
- Innovator: instruction explanation and nested previews turn init into a useful diagnostic rather than a static copier.
- Systems: generic AGENTS.md semantics and Codex-specific `AGENTS.override.md` behavior must remain separate claims.
- Collision insight: retaining `full` as a named compatibility profile makes `ae-core` a safe, legible default.
- Thinking preservation zone: project owners still decide whether suggested nested files are warranted and what rules belong in them.

## Key Decisions

- D1. Default to `ae-core`; preserve the former directory set as `full`.
  Reason: it aligns the initializer with its stated smallest-useful-scaffold principle while preserving an explicit compatibility route.
- D2. Preview nested candidates but never auto-create them.
  Reason: subproject rules require domain judgment that manifest discovery cannot supply.
- D3. Replace only delimited managed regions; reject force updates for legacy marker-only files.
  Reason: user-authored living documentation must not be destroyed when provenance is ambiguous.

## Dependencies And Assumptions

### Dependencies

- Existing Node.js standard-library CLI and repository validation scripts.

### Assumptions

- A bounded manifest scan is sufficient for suggestions; it is not claimed to be a complete workspace parser.

## Evidence Notes

- Open format, standard Markdown, no required fields, nested guidance -> Evidence: `https://agents.md/`, upstream commit `6ae22720966e9cca6b2c2dd0780fb7265a87a46c` inspected 2026-09-01.
- MIT license -> Evidence: upstream `LICENSE` at the same commit.
- Codex override and root-to-working-directory merge behavior -> Evidence: `https://learn.chatgpt.com/docs/agent-configuration/agents-md`, inspected 2026-09-01.
- Existing destructive force path -> Evidence: `plugins/ai-agent-engine-codex/scripts/ae-tools/init.mjs`.

## Consistency Check

- requirementsCount: 6
- nonFunctionalRequirementsCount: 1
- decisionsCount: 3
- openQuestionsCount: 0
