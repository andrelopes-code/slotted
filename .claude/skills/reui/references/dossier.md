# The ReUI dossier

Path: `docs/history/designs/YYYY-MM-DD-<family>-reui-dossier.md`, written in
English like the other documents in that directory, with one line added
under `## ReUI dossiers` (the section is
created by the first dossier).

The dossier has the nine sections below, in this order. A section with no
content carries the sentence that says what was checked and found empty.

## 0. Header

Family, mode (`survey`, `polish` or `build`), date, and the git HEAD read.

## 1. Selection

The first line states the coverage, then the `llms-full.txt` search terms used
and the count found for each.

| Coverage   | Condition                                                             | Minimum selection                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direct`   | ReUI ships the family as a primitive or as `c-*` examples             | The primitive's source and docs when it exists, three free examples, two Pro blocks with the family in product context                                                                                                |
| `analogue` | ReUI draws the family's parts or interactions inside other components | One item per Slotted part or interaction with a counterpart, up to six items                                                                                                                                          |
| `none`     | No item shares a part or an interaction with the family               | None. The Slotted siblings that share the family's parts (control height, row, focus ring, motion) are captured with `--family <sibling>` and fill the `ReUI` column of sections 3–5, headed with the sibling's name. |

One row per ReUI item captured.

| Item | Type | Route | Slotted part or interaction it informs | Captures |
| ---- | ---- | ----- | -------------------------------------- | -------- |

## 2. Anatomia

| `data-slot` ReUI | Parte Slotted | Estado |
| ---------------- | ------------- | ------ |

In `analogue`, a row pairs parts with the same role and interaction only.

`State` is `same`, `missing in Slotted`, or `only in Slotted`.

## 3. Measurements

One row per measured property of each part, at comfortable density and light
scheme. The header records the page width of each side. A property that does
not change with the page width is compared across unequal widths; one that
changes is compared with the ReUI item captured again at `--width 720`.

| Part | Property | ReUI | Slotted today | Target | Verdict |
| ---- | -------- | ---- | ------------- | ------ | ------- |

`ReUI` and `Slotted today` are computed values copied from the specimen JSON.
`Target` is a token, or a literal with the token-foundation section that allows
it. `Verdict` is `adopt`, `adapt`, `exceed`, `decline` or `other family`,
followed by one clause naming the evidence; `other family` names the composed
family that owns the value.

The minimum property set: height, inline padding, gap, font size, weight, line
height, letter spacing, radius, border width, icon size, and the rect at 1× of
every compared part.

## 4. State choreography

One row per part and state: hover, active, focus-visible, disabled, and every
state the contract declares.

| Part | State | ReUI delta | Slotted today delta | Target |
| ---- | ----- | ---------- | ------------------- | ------ |

A delta is the list of properties that change, with both values, copied from
`states[].deltas` of the specimen.

## 5. Movimento

Enter, exit and state transitions: property list, duration, easing, keyframes,
and the reduced-motion behavior, for ReUI and for the Slotted target.

## 6. Capacidades

What the ReUI items show the family doing that the Slotted family does not do.

| Capability | Where it appears in ReUI | Shape in ReUI | Shape in Slotted | Where the Slotted shape is better | Verdict | Owning family, if not this one |
| ---------- | ------------------------ | ------------- | ---------------- | --------------------------------- | ------- | ------------------------------ |

`Shape` is the consumer-facing API: props, parts, events, state ownership.
`Shape in Slotted` follows `/component` (`references/frameworks.md`), not the
ReUI shape. `Where the Slotted shape is better` names one concrete respect —
composition, native API, accessibility, state ownership, framework idiom — or
states that the two shapes coincide.

`Verdict` is `adopt`, `adapt`, `decline` or `defer to <family>`, as defined in
`.claude/skills/component/references/capability.md`, with its rules for a
complete `recusar`.

In `build` mode these rows enter the `/component` step 3 inventory, with ReUI
as one row of **Surveyed**.

## 7. Superar

The result of every row of `.claude/skills/component/references/rubric.md` ›
Craft bar, for both sides, with
the number that decides it.

| Criterion | ReUI | Slotted today | Target | Source |
| --------- | ---- | ------------- | ------ | ------ |

## 8. Delta

The ordered change list. One row per change.

| #   | File | Change | Dossier rows it resolves | Capture that proves it |
| --- | ---- | ------ | ------------------------ | ---------------------- |

A state the harness page does not render gets a row that adds its scene,
placed before the row that changes the state.

A row that edits `specs/components/<family>/contract.json` is marked
`contract`; its presence moves a `polish` run to `build`. A row that edits a
composed family's files is marked `other family`.
