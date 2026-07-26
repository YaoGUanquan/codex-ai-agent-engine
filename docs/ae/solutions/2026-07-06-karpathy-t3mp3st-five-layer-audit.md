---
type: review
status: drafted
date: 2026-07-06
topic: karpathy-t3mp3st-five-layer-audit
---

# External Skill Audit: Karpathy, T3MP3ST, and Five-Layer Codex Template

## Source Freshness Evidence

### Source 1 - `multica-ai/andrej-karpathy-skills`

- Source URL: `https://github.com/multica-ai/andrej-karpathy-skills`
- Freshness method: `git ls-remote https://github.com/multica-ai/andrej-karpathy-skills.git HEAD`
- Ref source: `HEAD`
- Observed commit: `2c606141936f1eeef17fa3043a72095b4765b9c2`
- Local inspection commit: `2c606141936f1eeef17fa3043a72095b4765b9c2`
- Commit status: `current`
- GitHub API observed on 2026-07-06: `188162` stars, default branch `main`
- License evidence: `.claude-plugin/plugin.json` and `skills/karpathy-guidelines/SKILL.md` state `MIT`; GitHub API license field is null; no root `LICENSE` file was observed.
- Inspected files:
  - `CLAUDE.md`
  - `CURSOR.md`
  - `README.md`
  - `.claude-plugin/plugin.json`
  - `.claude-plugin/marketplace.json`
  - `skills/karpathy-guidelines/SKILL.md`

### Source 2 - `elder-plinius/T3MP3ST`

- Source URL: `https://github.com/elder-plinius/T3MP3ST`
- Freshness method: `git ls-remote https://github.com/elder-plinius/T3MP3ST.git HEAD`
- Ref source: `HEAD`
- Observed commit: `a5667374bf34601ad87a7a9380b3926847ee3a41`
- Local inspection commit: `a5667374bf34601ad87a7a9380b3926847ee3a41`
- Commit status: `current`
- GitHub API observed on 2026-07-06: `1888` stars, default branch `main`, license `AGPL-3.0`
- License evidence: `package.json` states `AGPL-3.0-or-later`; root `LICENSE` contains AGPL-3.0 text; `THIRD-PARTY.md` separates benchmark fixtures from distributed source.
- Inspected files:
  - `package.json`
  - `LICENSE`
  - `SECURITY.md`
  - `THIRD-PARTY.md`
  - `docs/SCOPE_AND_AUTHORIZATION.md`
  - `docs/INTEGRITY_LEDGER.md`
  - `scripts/verify-claims.mjs`
  - `src/arsenal/approval.ts`
  - selected `src`, `scripts`, and `docs` grep results for `scope`, `receipt`, `ledger`, `evidence`, `gate`, `claim`, and `approval`

### Source 3 - Five-Layer Codex Configuration Template

- Source URL: user-supplied architectural description in this session.
- Freshness method: user-provided text, no repository URL supplied.
- Ref source: prompt text.
- Observed commit: not applicable.
- Commit status: `offline-unverified`.
- Inspected elements:
  - Memory Layer: `CLAUDE.md` / global and project rules.
  - Knowledge Layer: `SKILLS/skill.md` workflow extraction.
  - Guardrail Layer: hooks and pre/post tool checks.
  - Delegation Layer: subagents.
  - Distribution Layer: plugin manifest and team install.

## Current AE Fit Baseline

The current project is already close to the five-layer shape:

- Memory: root `AGENTS.md`, `docs/08-ai-memory`, `docs/ai-memory`.
- Knowledge: `plugins/ai-agent-engine-codex/skills/*` and mirrored `.agents/skills/*`.
- Guardrail: validation scripts, AE final gates under `docs/ae/gates`, and templates under `docs/ae/templates/computer-use-hooks`; no always-on Codex hook runtime is assumed.
- Delegation: `ae-claude-code`, `ae-agent-creator`, and multi-agent plan analysis guidance.
- Distribution: `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, install and update scripts.

Existing overlap is strong. The optimization opportunity is not adding a new architecture, but tightening three contracts:

1. a compact "behavioral invariant" layer that every AE skill can reference without duplicating long prose,
2. evidence-ledger and claim-verification mechanics for workflow outputs,
3. a documented five-layer mapping so users know which AE artifact owns each kind of instruction.

## Adaptable Patterns

### Karpathy Guidelines

Portable method candidates:

- Assumption surfacing before edits.
- Simplicity gate before introducing abstractions or dependencies.
- Surgical change discipline tied to the user's request.
- Goal-driven execution with concrete verification.

AE status:

- Mostly already present through `ae-plan`, `ae-work`, `ae-review`, `ae-task-loop`, and the earlier `ponytail-minimality` adaptation.
- Missing piece: a short canonical "engineering behavior invariant" reference that skill authors can cite, reducing drift across skills.

Recommended action: `ADAPT` as a reference/template and small skill wording cleanup, not as a new skill.

### T3MP3ST

Portable method candidates:

- Scope receipt model: target, action class, and approval are recorded separately.
- Tool gate model: action risk determines whether execution is blocked, allowed, or requires receipt.
- Evidence ledger: claims must link to durable evidence IDs.
- Finding ledger and retest status: claims move from observed to confirmed only after reproduction or validation.
- Claim verification script: headline claims are re-derived from committed artifacts.
- Integrity ledger: self-audit and retraction history are first-class, not hidden in changelog prose.
- Anti-contamination checks: no self-fitting, no phantom tools, no answer leakage, provenance-strict grading.

AE status:

- `ae-review`, `ae-work`, and `docs/ae/gates` already provide some evidence capture.
- `ae-skill-audit` already requires freshness, license, inspected files, and runtime-boundary classification.
- Missing piece: no uniform evidence ledger schema for PRD/plan/review/work claims, no claim verifier for docs/README assertions, and no integrity ledger for retractions or corrected guidance.

Recommended action: `ADAPT` the ledger and claim-verification mechanics only. Reject exploit, scanning, arsenal, payload, and target-interaction runtime behavior.

### Five-Layer Codex Template

Portable method candidates:

- Layer naming helps users reason about where to place rules.
- Distribution layer aligns with this project's plugin install scripts.
- Guardrail layer aligns with AE validation and gate templates when expressed as opt-in scripts.
- Delegation layer aligns with existing bounded subagent and Claude delegation guidance.

AE status:

- Already implemented structurally, but the mapping is not made explicit as a single architecture reference.

Recommended action: `ADAPT` as a documentation and validation matrix. Do not adopt always-on hooks or global config assumptions.

## Runtime Boundary Classification

| Finding | Category | Evidence | AE action |
| --- | --- | --- | --- |
| Four coding principles from `CLAUDE.md` | portable method | `andrej-karpathy-skills/CLAUDE.md` and `skills/karpathy-guidelines/SKILL.md` | Improve existing skills and add a short reference |
| Claude plugin marketplace files | runtime-specific behavior | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | Reject direct port; AE already has Codex plugin manifest |
| Cursor rule support | runtime-specific behavior | `CURSOR.md`, `.cursor` directory | Reject direct port; mention only as external harness |
| Scope receipt and tool gates | portable method / local deterministic mechanism | `T3MP3ST/docs/SCOPE_AND_AUTHORIZATION.md`, `src/arsenal/approval.ts` | Adapt as AE gate schema and validation guidance |
| Evidence/finding/retest ledger | portable method | `docs/SCOPE_AND_AUTHORIZATION.md`, `docs/INTEGRITY_LEDGER.md` | Add AE evidence-ledger reference and optional verifier |
| Claim re-derivation script | local deterministic mechanism | `scripts/verify-claims.mjs` | Create an AE-specific docs claim verifier; do not copy code |
| Offensive arsenal and live scanners | runtime-specific behavior | `src/arsenal`, many `scripts/*hunt*`, `scripts/*bench*` | Reject; outside AE workflow optimization |
| Five-layer template | portable method | user-supplied architecture | Adapt as project architecture map and install/readiness checklist |
| Hooks/PrePostToolUse shell layer | runtime-specific behavior unless Codex exposes hook support | user-supplied architecture | Keep as optional templates only, no enforcement claim |

## License Compatibility

- Current project license: `GPL-2.0-only`.
- `andrej-karpathy-skills`: MIT stated in plugin and skill metadata, but no root `LICENSE` observed. Reuse should be paraphrase-only unless a license notice pass is added.
- `T3MP3ST`: AGPL-3.0-or-later. Do not copy source, prompts, scripts, or text into this GPL-2.0-only project. Only adapt ideas at a method level with fresh AE-native wording.
- Five-layer template: user-provided text, no license. Treat as requirements input, not vendored artifact.

## Existing AE Skills To Improve

- `ae-skill-audit`: add stronger "reference-only adaptation" output fields for evidence ledger, claim verifier, and rejected runtime assumptions.
- `ae-prd`: add optional evidence expectations and claim provenance fields for requirements that affect public docs or evaluation claims.
- `ae-plan`: require implementation units to state whether they touch Memory, Knowledge, Guardrail, Delegation, or Distribution layer.
- `ae-work`: add optional final claim-evidence mapping when work changes docs, README, benchmark claims, install scripts, or skill behavior.
- `ae-review`: add a claim-integrity lane for documentation, benchmark, and capability claims.
- `ae-save-experience`: route retractions/corrections into an integrity ledger instead of burying them in experience notes.
- `ae-help`: expose the five-layer architecture as a concise capability map.

## New Skill Candidates

Do not create a new skill in the first pass.

Potential future candidates only after repeated use:

- `ae-claim-verify`: re-derive README/docs claims from local artifacts.
- `ae-integrity-ledger`: record corrected claims, retractions, and methodology fixes.

Both should stay deferred until an existing-skill implementation proves the workflow is too large for `ae-review`, `ae-work`, and `ae-save-experience`.

## Rejected Patterns

- Directly installing `andrej-karpathy-skills` as a separate bundled plugin: duplicates current AE behavior and adds catalog noise.
- Copying the 65-line CLAUDE text verbatim into multiple skills: creates maintenance drift and license/attribution work.
- Porting T3MP3ST offensive tools, exploit workflows, benchmark corpora, or MCP server: outside AE's workflow-skill purpose and license-incompatible for direct code reuse.
- Treating hooks as enforced in Codex: current project can ship templates and scripts, but should not claim always-on pre/post tool interception unless Codex exposes that runtime.
- Creating five new layers as directories if existing paths already cover them: this would be renaming without functional gain.

## Verdict

Overall verdict: `ADAPT`.

Use the three inputs to sharpen existing AE architecture and verification discipline:

1. Karpathy: compact behavioral invariants.
2. T3MP3ST: evidence, claim, and integrity ledgers.
3. Five-layer model: architecture map and installation/readiness checklist.

Do not add a new external skill catalog, hook runtime, offensive testing runtime, or broad reorganization.
