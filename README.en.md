# AI Agent Engine for Codex

Seven self-contained engineering skills for decision grilling, frontend/backend work, and layered testing. The only distributable skill source is `skills/<name>/`. Repository validators live in `tools/`; regression tests live in `tests/`.

Design inspiration: [AI Agent Engine](https://gitee.com/jiangqiang1996/ai-agent-engine) (independent implementation; upstream prose is not copied). License stays `GPL-2.0-only`.

中文：[README.md](README.md) · Install: [INSTALL.md](INSTALL.md) / [INSTALL.zh-CN.md](INSTALL.zh-CN.md)

## Current Mainline Facts

- Version: `0.5.0`
- Skill source: `skills/` (exactly seven; each skill is a closed resource tree and can be copied alone)
- Install: standard [skills](https://www.npmjs.com/package/skills) CLI; **no** project/global installers, `none|core|all` implicit tiers, or MCP shell
- Invocation: name the skill explicitly (for example `$ae-frontend` / `ae-grill`); no default full workflow or multi-agent orchestration
- Checks: `npm test`, `npm run check`, `npm run check:smoke` (all under `tools/`)

## Quick Start

Requires Node.js ≥ 20 and a host that supports Agent Skills.

```bash
# List skills in this repository
npx skills add YaoGUanquan/codex-ai-agent-engine -l

# Install all seven into the current project
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s '*'

# Install one skill
npx skills add YaoGUanquan/codex-ai-agent-engine -y -s ae-grill

# Install globally (user scope)
npx skills add YaoGUanquan/codex-ai-agent-engine -g -y -s '*'
```

You can also copy a single `skills/<name>/` folder into the host skills directory; keep `SKILL.md` and any `references/` together.

Optional npm path (package [`ai-agent-engine-codex`](https://www.npmjs.com/package/ai-agent-engine-codex)): `npm install ai-agent-engine-codex@0.5.0`, then `npx skills experimental_sync -y`. Do not `skills add` the npm package name. See [INSTALL.md](INSTALL.md).

Invocation examples (Codex / hosts that support `$skill`):

```text
$ae-grill converge acceptance for the login change
$ae-frontend mode=dev implement order-list filters
$ae-backend mode=fix investigate double charge
$ae-unit-test add boundary cases for OrderService and run them
$ae-integration-test verify tenant isolation from order to payment
$ae-e2e-test mode=test-only run the existing checkout smoke
$ae-e2e-suite organize the project E2E suite and CI gate
```

See [INSTALL.md](INSTALL.md) for install, migration, and removal detail.

## The Seven Skills

| Skill | Purpose |
| --- | --- |
| `ae-grill` | Requirements and design questioning: inspect the repo first, one key decision at a time, with a recommendation and rationale; default output is session consensus only |
| `ae-frontend` | Frontend design, pages, and interaction; `mode=dev\|fix` |
| `ae-backend` | Backend implementation and root-cause fixes; `mode=dev\|fix`; keeps auth, contracts, transactions, and data-scale constraints |
| `ae-unit-test` | Generate and run unit tests with the project's existing framework; triage failures |
| `ae-integration-test` | Cross-module, API, auth, and persistence flows; requires a proven isolated environment |
| `ae-e2e-test` | Case-level browser verification; run existing scripts only, or author then run |
| `ae-e2e-suite` | Project-level E2E infrastructure, suite layout, and CI |

No PPT, TTS, SSH ops, standalone code-review entry, config center, or generic runtime platform. Skill text must not reference other skill names, sibling directories, a central dispatcher, or repository `tools/`.

## Migrating From The Old Plugin

Earlier releases shipped a Codex plugin (`plugins/ai-agent-engine-codex`) plus install/update scripts and optional implicit tiers. From `0.5.0` this is a standalone skill set:

1. Identify old installs: leftover `ai-agent-engine-codex` plugin trees, `.codex-plugin`, old `install-*` / `update-*` scripts, or a long list of retired `ae-*` skills (`ae-help`, `ae-plan`, `ae-lfg`, and similar).
2. Disable or remove the old plugin/skills in the host so they do not load beside the new seven.
3. Install with `npx skills add ...` above; **do not** run legacy `install-project` / `update-ae-codex`.
4. Keep personal docs, memory, config, backups, and journals; this release does **not** auto-scan or clean real personal installs.

Capability mapping (summary): clarification → `ae-grill`; frontend/design → `ae-frontend`; backend/SQL/service root cause → `ae-backend`; unit/TDD → `ae-unit-test`; API/business integration → `ae-integration-test`; browser cases → `ae-e2e-test`; E2E infra/CI → `ae-e2e-suite`. Orchestration, gates, graph, memory, archive, installers, language switchers, and multi-agent runtime are retired; see the `0.5.0` entry in [CHANGELOG.en.md](CHANGELOG.en.md).

## Repository Layout

```text
skills/           # Sole distributable skill source (7)
tools/            # Validators, syntax, release notes, public-content, smoke, test runner
tests/            # Regression tests
docs/             # Public templates/references and release checklist only
LICENSE
NOTICE.md
package.json      # files whitelist: skills/, LICENSE, NOTICE.md
```

The npm package does **not** ship `tools/` or `tests/`; those exist for this repository's development and CI.

## Development Checks

```bash
npm install
npm test
npm run check
npm run check:smoke
```

`check` covers syntax, skill frontmatter/closure, retired-path residue, release-note window, and public-content boundaries. Process notes and project memory stay outside this public repository.

## Version Updates

Full history: [CHANGELOG.en.md](CHANGELOG.en.md). This section keeps at most five entries.

### 0.5.0 (2026-10-21)
- Rebuild as a standalone engineering skill set: sole distribute source `skills/` (seven skills), validators under `tools/`; remove the old plugin manifest, MCP shell, installers/updaters, and orchestration/gate/graph/memory runtime.
- Docs and install use the standard skills CLI; retire `none|core|all` implicit tiers and the old plugin update path; version `0.5.0`.
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`. Static checks and isolated skill copies prove closure and repository contracts only; real host-model and production acceptance are not claimed here.

### 0.4.0-beta.3 (2026-10-21)
- New installs default the implicit tier to `none` (explicit AE only); keep `core`/`all`. Updates and language switches preserve existing install settings and do not force migration. Fix Cursor metadata treating core skills as model-invocable under `none` (`cursorShouldDisableModelInvocation`).
- Adjust `ae-debug`: drop the fixed “list 3–5 hypotheses”; propose falsifiable hypotheses only when evidence is ambiguous; missing environment blocks only dependent fix/acceptance work; insufficient evidence must not claim a confirmed root cause.
- Add offline model-evaluation prep/result check entry (`scripts/model-evaluation-check.mjs`) and worker acceptance counterexamples; keep specs separate from run results so one run cannot rewrite historical norms.
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`. Real GPT-6.1 Sol / GPT-6 Astra contrasts were not run in this environment (not-run/blocked); Grok Bot self-runs do not substitute for model-behavior evidence.

### 0.4.0-beta.2 (2026-10-20)
- Installer supports `--implicit core|all|none`; **default tier changes from `all` to `core`** (only ae-help / ae-plan / ae-work / ae-review / ae-debug may trigger from natural language). Non-core natural language should go through ae-help routing or explicit `$ae-*`; pass `--implicit all` for the old behavior.
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`. These static and local checks do not prove real Codex host/model behavior.

### 0.4.0-beta.1 (2026-10-15)
- Add team contracts and role templates that choose roles by task: complex work confirms a plan first; the main agent owns native scheduling, integration, and real acceptance; small tasks still run directly.
- Team write permission moves from explicit opt-in to a parent gate (`write_requires_explicit_opt_in: false` + `write_requires_parent_gate: true`); write workers still need explicit parent approval; `can_spawn_write_agents*` stays false.
- Parallel analysis separates file vs business-resource read/write conflicts and serializes local conflicts by wave; add host quotas, execution state, and auto concurrency config; keep explicit off switches and read-only selection; unrelated dirty changes no longer block delegation by default.
- Strengthen memory, query, and concurrency bounds from data source to output; add isolated data fixtures and five real-model contrast norms; prefer `gpt-6.1-sol` for the first round and do not silently swap models.
- Verification: `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`. Static and isolated install checks prove helper tools, rules, and distribution contracts only; real model contrasts are incomplete; do not claim quality, latency, or production capacity gains.

### 0.3.56 (2026-10-15)
- Unify test scope, reuse of passing results, and invalidation rules: focus after a single failure, explain before widening to full runs; review, delivery, and context recovery do not auto-rerun; remove fixed execution counts and “dirty workspace always confirm”. Tighten skill-entry trigger wording so specialized gates load only after an explicit ask (default `implicit` tier remains `all`, matching the mid-I agreement).
- GPT-6.1 is the primary behavior-acceptance target, with eight reusable evaluation scenes and a three-pair / two-runs-each protocol for later models; real model-behavior evaluation is not done, so do not claim proven performance or quality gains.
- Verification: `node --test tests/model-adaptation.test.mjs tests/instruction-audit.test.mjs`, `npm test`, `npm run check`, `npm run check:smoke`, `git diff --check`. Static and isolated install checks prove rules, metadata, and distribution contracts; recorded delivery results remain authoritative for outcomes and misses.

## Important Boundaries

- Process notes, handoffs, and long-term AI memory stay out of this public repository; only public templates/references and the release checklist remain.
- Failures must be classified as product, test, spec, or environment; do not weaken assertions, skip without cause, or silently degrade.
- Git write, push, merge, publish, real database writes, and changes to real personal installs need separate authorization; this document is not that authorization.

## License And Attribution

- This repository: `GPL-2.0-only` (see [LICENSE](LICENSE), [NOTICE.md](NOTICE.md))
- Upstream attribution is in NOTICE; if upstream states `GPL-3.0-or-later`, this repository does not change its own license unilaterally
