---
name: ae-reverse-engineering
description: Use when the user asks for authorized reverse engineering, defensive binary or mobile analysis, malware forensics, compatibility research, or a local CTF/training artifact. Establish authorization, artifact provenance, and evidence before analysis.
---

# AE Authorized Reverse Engineering

Analyze only user-owned or explicitly authorized artifacts. This skill provides a defensive, evidence-driven workflow; it does not provide an offensive router, tool installer, MCP setup, or global configuration.

## Authorization Gate

Before analysis, identify the artifact and classify the work as one of:

- user-owned software or data;
- an explicitly authorized assessment with a stated scope;
- a local CTF, crackme, or training artifact;
- defensive malware forensics or compatibility research.

If ownership, authorization, permitted network access, or the intended effect is unclear, do not execute the artifact, contact a target, capture traffic, replay requests, mutate data, or proceed to dynamic analysis. Ask the user for the missing boundary.

## Scope Boundaries

This skill supports static inspection, defensive forensics, compatibility analysis, and authorized local experimentation. It does not support license bypass, cracking, credential theft, persistence, detection evasion, active exploitation, target scanning, or unauthorized systems.

Do not install tools, download samples, register MCP servers, change global Codex or client configuration, or create a sandbox automatically. When a necessary tool or isolation environment is absent, explain the minimum requirement and wait for explicit user approval before any setup action.

## Workflow

1. Establish an artifact baseline: record the supplied path or source, SHA-256 when practical, file format, architecture, size, and whether the artifact is trusted to execute.
2. Start with static, read-only inspection. Record the actual available tool and version; never guess a tool path or claim that a tool is installed.
3. State the analysis question and select the smallest safe method. Keep compatibility, forensic, and training goals separate from any remote target interaction.
4. Treat dynamic execution, packet capture, new sandbox creation, credential use, target mutation, or network replay as a new boundary. Require the user's explicit authorization for the named environment, target, and effect before proceeding.
5. Maintain an evidence trail. Separate direct observations from high-confidence inferences and unverified hypotheses. Cite commands, hashes, offsets, symbols, functions, sanitized screenshots, or other reproducible evidence.
6. Before claiming completion, record what was proven, what remains unverified, and which next validation would change confidence. Use the local [analysis report template](references/analysis-report-template.md) when the user requests a durable report.

## Evidence Rules

- Do not present decompiler output, a string match, or a single dynamic trace as proof of complete behavior without explaining its boundary.
- Preserve relevant offsets, addresses, function names, file hashes, and tool versions when they support the conclusion.
- Keep credentials, tokens, private target data, personal information, and unredacted packet captures out of reports and repository files.
- Mark a conclusion as `observed`, `inferred`, or `unverified`; do not silently turn an inference into a fact.

## Related Skills

- Use `ae-debug` for a reproducible failure in code or a local runtime rather than artifact analysis.
- Use `ae-review` for source-code security, correctness, or architecture review.
- Use `ae-skill-audit` to assess an external reverse-engineering skill or tool repository.
- Use `ae-save-experience` only when the user explicitly asks to retain a completed, sanitized lesson.

## Rules

- Do not broaden the authorized scope or network boundary.
- Do not execute an untrusted artifact on the current host by default.
- Do not claim a tool, runtime, browser, service, or deployment result that was not observed.
- Do not publish, upload, or contribute analysis data without explicit user authorization.
