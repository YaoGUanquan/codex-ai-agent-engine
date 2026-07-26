# Review Capability Upstream Audit

## Decision

Adapt two narrow methods into existing AE review surfaces: exact review-file inventory and optional bounded shallow impact context. Do not install, vendor, or invoke the three upstream projects at runtime.

## Source Freshness And License Evidence

| Source | Observed commit | License | Inspected files | Verdict |
| --- | --- | --- | --- | --- |
| `https://github.com/tirth8205/code-review-graph` | `4cdc7c5876791e5bb9f84ce8c2f81cae7f5bab46` | MIT | `README.md`, `docs/architecture.md`, `LICENSE` | Adapt review-seed and bounded impact-context method only. |
| `https://github.com/alibaba/open-code-review` | `0ced7165718725e15223c3e5a506df7b7e9de51f` | Apache-2.0 | `README.md`, `skills/open-code-review-delegate/SKILL.md`, `LICENSE` | Adapt deterministic file inventory and explicit coverage method only. |
| `https://github.com/github/spec-kit` | `c0fe0e43cd728ebc3dd1f714343f3921510a157f` | MIT | `README.md`, `templates/commands/analyze.md`, `LICENSE` | Retain current AE traceability/evidence lanes; no new entrypoint. |

Freshness method: `git ls-remote <repo> HEAD`, followed by a depth-one local inspection on 2026-07-26.

## Classification

| Pattern | Classification | AE Destination | Boundary |
| --- | --- | --- | --- |
| Changed-file seeds plus breadth-limited reverse/forward dependency traversal | Portable method plus local deterministic mechanism | `review-package --with-impact` | Advisory static context only; no persistence or claim of complete resolution. |
| Reviewable file list, status metadata, and explicit exclusion accounting | Portable method plus local deterministic mechanism | `review-package` inventory and `ae-review` | Every selected file remains a review target until a reviewer records an exclusion. |
| Path-sensitive rule resolution and smart bundling | Portable method, deferred | Existing review personas and future path-rule design if repeated need emerges | Do not add a rule engine without project-specific rule corpus and tests. |
| Cross-artifact consistency, coverage mapping, and constitution conflicts | Portable method already covered | `ae-review` traceability/evidence reviewers and PRD/plan contracts | No duplicate Spec Kit command. |
| AST graph database, watch mode, MCP auto-configuration, external provider/model configuration, CI comment posting, hooks | Runtime-specific behavior | Rejected | Not required for this task and not enforced by the present AE runtime. |

## Existing Skill Fit

- `ae-review`: strongest fit for inventory coverage, advisory context, explicit exclusions, and evidence reporting.
- `ae-skill-audit`: already provides provenance, license, freshness, and runtime-boundary evaluation; no change required.
- `ae-brainstorm`, `ae-prd`, and `ae-plan`: existing artifact contracts already provide Spec Kit's most useful clarify/specify/plan/analyze structure.

## Rejected Patterns

- Do not copy prompts, scripts, rule content, benchmark claims, or integration files from upstream.
- Do not treat upstream benchmark results as AE performance claims.
- Do not add a full code-intelligence database to solve a small review-preparation gap.

## Implementation Impact

- `plugins/ai-agent-engine-codex/scripts/ae-tools.mjs`
- paired `ae-review` source/mirror skill files
- `tests/skill-scripts.test.mjs`
- root and plugin SemVer metadata

Validation: focused review-package test, `npm test`, `npm run check`, and `git diff --check`.
