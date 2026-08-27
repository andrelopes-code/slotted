# Contributing to Slotted

Slotted is experimental. Architectural and public API decisions should remain small, explicit, and reversible until stabilized through a dedicated decision record.

## Prerequisites

- Node.js 24
- pnpm 11.24.0

Enable the pinned package manager and install dependencies:

```bash
corepack enable
corepack install --global pnpm@11.24.0
pnpm install --frozen-lockfile
```

## Validation Commands

- `pnpm check`: normal fast repository gate.
- `pnpm check:affected`: changed task-bearing packages and their dependents.
- `pnpm check:full`: all task-bearing packages and root checks.
- `pnpm format`: explicitly rewrite supported files with Prettier.

Choose the smallest command that covers the changed surface. Pull requests that alter toolchain or cross-package contracts should use `pnpm check:full`.

## Product Direction

Read [`PROJECT-PRD.md`](PROJECT-PRD.md) for product context. Its phases and open questions are not an automatic implementation checklist.
