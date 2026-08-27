# Slotted

Slotted is experimental UI infrastructure for dense, product-oriented web applications.

The project targets React and Angular. It shares conceptual specifications, accessibility contracts, tokens, and behavioral expectations where useful while preserving idiomatic framework implementations.

Slotted is not yet a consumable component library. The repository currently contains only its operational foundation.

## Prerequisites

- Node.js 24
- pnpm 11.24.0

## Quick Start

```bash
corepack enable
corepack install --global pnpm@11.24.0
pnpm install --frozen-lockfile
pnpm check
```

## Repository Checks

- `pnpm check` runs the normal fast gate.
- `pnpm check:affected` covers changed task-bearing packages and dependents.
- `pnpm check:full` covers the complete task graph.

Read the [project PRD](PROJECT-PRD.md) for product context and [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes.

## License

[MIT](LICENSE)
