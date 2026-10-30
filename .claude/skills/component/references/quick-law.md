# /component quick law (read first, then branch)

Use this before the family-specific pass.
Read this first; full source docs are for decisions this file does not settle.

## Non-negotiable law

- Read `docs/build-briefing.md` first for the active rebuild mode and queue.
- The contract is law: `specs/contract.schema.mjs` requires `ui`, parts, and
  `stateModel` for every mutable capability.
- `docs/state-and-events.md` governs controlled/uncontrolled pairs, request
  reason, and state precedence.
- `docs/token-foundation.md` governs layered tokens, scales, literals, and
  density/contrast requirements.
- `references/rubric.md` is the quality bar for all steps with explicit “fails when” guards.
- Every family must answer `scheme`, `density`, `dir`, `focused/disabled/hover/active`
  interactions according to states already in the contract.
- If the family uses a native element/pattern, default to that behavior before
  adding proprietary behavior.

## Minimum scope documents

In order:

1. `docs/build-briefing.md`
2. `references/quick-law.md` (this file)
3. Family paragraph in `docs/component-features.md` + sections 2 and 18
4. `docs/history/designs/*` design doc for that family if it exists

Then read full-law docs when this brief leaves open questions, with no exception in these cases:

- first pass of a family;
- contract/state/schema changes;
- token or harness changes;
- any accessibility or keyboard behavior change;
- any framework binding adjustment.

This file is the default for `/component` runs. If this is a follow-up cycle on
the same family, skip the optional full-law read list below unless a decision
from the prior pass is still unresolved.

Otherwise, read:

- `docs/token-foundation.md`
- `docs/state-and-events.md`
- `references/rubric.md`
- `references/capability.md`
- `references/patterns.md`
- `references/frameworks.md`
- `references/stories.md`

If any one decision can alter visuals across multiple scenes, recapture the full
baseline harness set before final visual sign-off.

## Time-safe execution constraints

- Avoid broad re-reading. Do not revisit the same source more than once unless a
  contradiction appears.
- Capture image sets again only for changed scenes, not for unchanged baseline
  combinations.
- One `/component` run is scoped to one family (or tightly related pair); hand over after Step 13 rather than chaining separate families in the same context.
- Prefer `pnpm check:affected` as the default verification step; use `pnpm check`
  only for shared-tool or cross-family scope changes.
