---
type: design
status: drafted
date: 2026-07-06
topic: agent-engineering-invariants
---

# Agent Engineering Invariants

These invariants are the short behavior contract AE skills should preserve when planning, implementing, reviewing, or documenting engineering work.

## Surface assumptions before editing

State material assumptions before changing files. If two interpretations would produce different code, docs, validation, or user-visible behavior, stop and resolve the ambiguity or record an explicit assumption.

## Choose the simplest sufficient route

Prefer the smallest route that satisfies the current requirement: existing behavior, deletion, configuration, documentation, standard library, framework-native capability, or an already-installed dependency. Add new abstractions, flags, wrappers, dependencies, or files only when the current requirement justifies owning them now.

## Keep edits surgical

Every changed line should trace to the user request, accepted plan, or validation failure being fixed. Do not reformat, rename, refactor, or "clean up" adjacent code unless the current task makes that change necessary.

## Define verifiable goals

Convert vague tasks into success signals that can be checked: a passing test, a validation command, a diff inspection, a document consistency check, a browser flow, or a gate proof. Weak success criteria must be clarified or explicitly deferred before implementation.

## Claim evidence before confidence

Do not promote capability, benchmark, installation, runtime-support, or behavior claims without evidence. Evidence can be a command, artifact path, commit/ref observation, inspected file, gate proof, or clearly marked assumption.

## Preserve safety and validation

Minimality never justifies removing trust-boundary validation, security controls, data-loss prevention, accessibility basics, or narrow tests for non-trivial behavior.
