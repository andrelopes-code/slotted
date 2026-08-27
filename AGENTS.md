# Slotted Repository Instructions

## Scope

`PROJECT-PRD.md` is product context, not an automatic backlog. Implement only the requested task and preserve unrelated user work.

React and Angular must remain idiomatic to their frameworks. Share specifications and contracts when useful; do not force shared implementation without demonstrated need.

## Working Loop

1. Read only the context required for the task.
2. Define or infer a bounded, observable outcome.
3. Change the smallest coherent set of files.
4. Select verification from the changed surface and risk.
5. Resolve related failures and report concrete evidence.

Do not impose a hard time limit on implementation. When work becomes long or changes phase, report the result obtained, available evidence, current obstacle, and next materially different attempt. Reassess or split work when attempts repeat without new evidence.

## Verification

- Isolated documentation or configuration: run its specific checker.
- One task-bearing package: run that package's filtered checks.
- Shared contract or dependency edge: run affected packages and dependents.
- Toolchain, release, or cross-cutting change: run `pnpm check:full`.
- Security-sensitive or otherwise high-risk behavior: add independent review.

Use `pnpm check` for the normal fast gate, `pnpm check:affected` for changed packages and dependents, and `pnpm check:full` only when the change surface warrants it.

Except for `pnpm format`, verification commands must not modify files.

## Browser Automation

Do not use Playwright for exploratory browsing, generic UI inspection, broad screenshot collection, or open-ended visual review. Browser automation is allowed only for a named deterministic scenario with explicit assertions and clear failure semantics.

## Restraint

Do not add dependencies, abstractions, packages, planning artifacts, reviewers, or subagents by default. Introduce them only when current scope or risk justifies them.

Do not run every available check merely for reassurance. Completion means the requested result is present, relevant checks pass, and remaining limitations are explicit.
