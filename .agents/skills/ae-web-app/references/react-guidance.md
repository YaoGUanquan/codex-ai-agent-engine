# React Guidance

Apply this guidance only when the repository uses React-compatible tooling such as React, Next.js, Remix, or Vite React.

1. Follow the existing file and routing structure before adding new abstractions.
2. Keep component state local unless the repository already uses a shared state layer.
3. Reuse established data-fetching and mutation patterns instead of inventing a new one.
4. Handle loading, empty, error, and mutation feedback in the user-facing route.
5. When shadcn or another component system is present, extend it consistently.
6. Validate both build correctness and browser behavior for interactive changes.
