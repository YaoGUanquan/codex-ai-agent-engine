# Install And Detect

Use this sequence before relying on OfficeCLI:

1. Check whether `officecli` is already in `PATH`.
2. If it is missing, say so explicitly and offer install guidance instead of faking command support.
3. Treat download or install as an explicit user-approved action because it requires network or binary writes.
4. Prefer a machine-readable detection step before any real workflow command.

Typical detection flow:

- `officecli --version`
- `officecli --help`
- `node scripts/check-officecli-available.mjs` when this repository provides the helper

Platform note:

- Installation steps differ across Windows and Unix-like systems.
- Do not assume OfficeCLI exists just because Office document files are present.
