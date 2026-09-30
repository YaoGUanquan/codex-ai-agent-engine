# Design Testing

## Risk-Scaled Test Design

When `test-cases` is required, select the smallest set of methods that exposes the design's actual risks and record that choice in the Test Coverage Matrix:

- use equivalence classes and boundary values for constrained inputs, ranges, lengths, collections, or pagination;
- use decision tables for multi-condition business rules;
- use state transitions for declared UI or workflow states;
- use error guessing for failure, timeout, concurrency, encoding, and hostile-input risks that the other methods do not cover.

For each critical scenario, record the selected design method, covered stable IDs, and an automatable verification signal. Use each coverage category only when its triggering structure exists: API errors, database constraints, authorization decisions, and UI interactions. For an absent category, use `N/A` with the explicit-omission reason. Do not require fixed scenario counts or invent coverage metrics that the design artifact cannot measure.

## Test-Case Quality Guards

For every designed test case, retain a stable `TC-XXX` ID, link it to the requirement or contract IDs it proves, and state an observable expected result. Do not treat "succeeds", "works", or an implementation detail as a sufficient assertion.

Merge or remove semantically duplicate cases: changed fixture values alone do not justify a separate case when the input condition, expected behavior, and covered IDs are materially the same. Keep separate cases only when they cover a distinct risk, boundary, failure behavior, or contract element. These guards improve test-case signal; they do not impose scenario counts, measured coverage claims, or categories whose trigger is absent.

## Review Closure

Before treating a design as ready, run or request `ae-review domain:document` for the design artifact.

The design is ready for `ae-plan` only when:

- required dimensions are present or explicitly justified as omitted;
- stable IDs are unique and referenced by the mapping tables;
- every stable ID used by a mapping table is declared by a canonical `### ADR|EP|T|TC|ST-XXX` heading in `design.md` or a listed sibling Markdown shard;
- every Split Manifest file is an existing Markdown file inside the current design directory;
- cross-dimension mapping does not contradict the dimension sections;
- no P0/P1 document review finding remains unresolved.
