---
name: reui
description: Use when explicitly invoked as /reui <family> [survey|polish|build] in the Slotted repository, to raise a component family's visual and interaction craft — measurements, hover, press, focus, motion — using the ReUI library (reui.io — primitives, free c-* examples, Pro blocks) as measured reference wherever it draws the family or an analogue of it. Temporary development skill; do not infer it from a generic request to change component code.
---

# ReUI reference craft

> Execution quality: obsession with craft. Pixel-perfect, extreme refinement,
> exclusive microinteractions, premium animations, carefully designed
> hovers/actives/focus, and zero template or AI-slop look. Every pixel
> must be intentional.

The bar is `/component`'s: this motto, stated as pass conditions in
`.claude/skills/component/references/rubric.md` › Craft bar.

Temporary. This skill directory is removed at the end of the project; dossiers
already written stay in `docs/history/designs/` as history, and
`tools/harness/specimen.mjs` stays with the harness.

The target is the craft bar, applied to the Slotted family. ReUI is a source of
ideas and of measurements: capabilities, flexibility, compositions, states and
microinteractions it ships, and the computed values behind its picture and
motion. It is never the source of the API, the code, or the way a capability is
built. The bar holds whether ReUI draws the family, an analogue of it, or
nothing comparable.

An idea taken from ReUI is redesigned in Slotted terms before it enters the
family: the shape of its API follows `/component` — parts a consumer arranges,
native props and events, a controlled and uncontrolled pair with a reason,
React and Angular idioms — and the Slotted shape improves on the ReUI shape in
at least one named respect or the dossier records that the two coincide.

The output is a Slotted family — CSS on Slotted tokens, idiomatic React and
Angular bindings, a Slotted contract — that passes every row of the craft bar,
adopting a ReUI value only where the specimens show it is the better one.

The failure this skill exists to stop: a pass that looks at ReUI screenshots,
copies what it remembers of Tailwind class names, and ships values nobody
measured. Every number in this skill's output comes from a specimen, on both
sides.

## Invocation

`/reui <family> [survey|polish|build]`. Without a mode: `polish` when
`specs/components/<family>/` exists, `build` otherwise.

| Mode     | Output                                        | Stops at                   |
| -------- | --------------------------------------------- | -------------------------- |
| `survey` | Dossier                                       | Dossier written            |
| `polish` | Dossier, then the delta applied to the family | Dossier gate, then report  |
| `build`  | Dossier, then `/component <family>` fed by it | The two `/component` gates |

`polish` changes stylesheets, token files, and binding markup that the contract
already declares. A delta row that edits `contract.json` moves the run to
`build`.

## Evidence

`tools/harness/specimen.mjs` is the only browser automation this skill runs;
`.claude/skills/component/references/harness.md` › Specimen documents its flags,
its record and its exit status. For ReUI it reads the public preview route of
one item:

```bash
# ReUI side. c-<category>-<n> is a free example (route .../example/<name>); any other name is a Pro block.
node tools/harness/specimen.mjs \
  --url 'https://reui.io/preview/base/example/<name>?embed=1&style=nova&theme=light' \
  --name <name> --theme light \
  --ready 'html[data-preview-ready]' --missing-text 'This page could not be found' \
  --states '<selector>'

# Slotted side: the same readings from the harness page.
node tools/harness/build.mjs <family>
node tools/harness/specimen.mjs --family <family> --theme light --width 720 --states '<selector>'
```

The ReUI `theme` query parameter and `--theme` carry the same value. Density and
direction apply only to the Slotted side.

`--states` names the element a person interacts with. A family whose
interactive form is a rendering variant (`a`, `button`) is captured twice: once
on the static part, once on the interactive variant.

Read the specimen with `ctx_execute_file` and print only the rows the dossier
needs. Read, as images, the rest and state clips of the elements compared in
sections 3, 4 and 7 — one element per role on each side — and the full-page
picture of each item in both themes.

## Process

1. **Load.** `references/translation.md`, `references/dossier.md`,
   `.claude/skills/component/references/rubric.md` › Craft bar,
   `.claude/skills/component/references/polish-lenses.md`, and for the
   family: `specs/components/<family>/contract.json`,
   `packages/styles/src/<family>/`, its entry in `docs/component-features.md`,
   and the assertions of the tests in `packages/styles/src/*.test.mjs` that
   scan every family (focus ring, motion, logical properties, states,
   fallbacks). In `build` mode, read these after the `/component` step 1 law,
   not instead of it.
2. **Select.** Fetch the catalog once per session:
   `curl -sL https://reui.io/llms-full.txt -o tools/harness/out/specimen/reui-llms-full.txt`.
   Search it for the family, its synonyms, the primitive names that compose it,
   and the parts and interactions it shares with other components (a row, a
   drop zone, a progress track, a popover list). Classify the coverage and
   choose the items § Selection in `references/dossier.md` requires for it, at
   base `base` and style `nova`; a second style enters only when the dossier
   names what it adds. Thumbnails triage the choice; they are never evidence.
   Pro blocks show the family in product context — density next to other
   controls, truncation, counts, status — and are the reason to include them.
3. **Capture.** A first run of each item without `--states` lists its `parts`;
   the `--states` selector and `--limit` are chosen from that list, one element
   per role. Then both themes and `--motion reduce` for every selected item, and
   `--click` runs for each state behind an interaction. Then the Slotted side:
   light, dark and high-contrast; `--motion reduce`; `--forced-colors active`;
   `--density dense`; `--dir rtl`.
4. **Write the dossier.** Every section of `references/dossier.md`, from the
   specimens. A value without a specimen path is removed.
5. **Gate** (`polish` only). Hand over the dossier path, sections 3, 4, 7 and 8,
   and the pairs of pictures that show the largest differences. Wait for the
   answer and incorporate it. `survey` ends at step 4. `build` continues at
   `/component <family>` step 1, with the dossier as the ReUI rows of step 3 —
   the reference specimen that step asks for included — and sections 3–5 as the
   target of step 7.
6. **Apply** (`polish`). The delta rows of this family in order. Every value on
   a token; a value without a step is written as the dossier recorded it. Rows
   marked `other family` are not applied; the report lists them.
7. **Recapture and compare.** The Slotted specimens again, then the
   `/component` step 8 captures. Each dossier row in sections 3, 4 and 7 is
   either at its target, with the new computed value, or reopened with the
   reason.
8. **Verify.** `pnpm check:affected`, exit status preserved.
9. **Report and commit** (`polish`). Dossier path, before and after pictures
   per changed state, check output. One commit naming every file, as
   `/component` step 15 requires.

## Reading the craft bar against ReUI

Section 7 of the dossier works every row of the craft bar on both sides. A row
Slotted fails is a delta row, whatever ReUI does. When the failing value
belongs to a composed family (a `progress-indicator` inside a job row), the row
names that family's files and is marked `other family`. A row ReUI fails and
Slotted passes is recorded as `exceed` and not changed. ReUI ships no
high-contrast scheme and no forced-colors treatment; those rows compare the
Slotted family with itself across schemes.

## Common mistakes

| Mistake                                                    | Correction                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Measuring by eye from a screenshot                         | Copy the computed value from the specimen JSON.                                                               |
| Reading `px-2` or `rounded-md` as the value                | Class names locate a rule; the specimen holds the value.                                                      |
| Capturing only ReUI                                        | The dossier compares two specimens; the Slotted side is captured first and after.                             |
| Hover captured as empty on ReUI                            | `specimen.mjs` launches Chrome with a fine pointer; an empty delta is a finding, not a capture error.         |
| A literal color or duration copied into a stylesheet       | Semantic token by role; motion token. `motion.test.mjs` rejects literal durations.                            |
| Opening reui.io pages for general browsing                 | `specimen.mjs` on a named item; the cached `llms-full.txt` for search; `ctx_fetch_and_index` for a docs page. |
| Treating ReUI as the ceiling                               | Section 7 is where Slotted exceeds it; every `exceed` row names the number.                                   |
| Stopping because ReUI has no such family                   | Coverage `analogue` or `none`; the craft bar still produces the delta.                                        |
| Copying an analogue's value into a part with another role  | An analogue informs only the part with the same role and interaction.                                         |
| Porting a ReUI prop list or `cva` variant table as the API | Section 6 records the ReUI shape and designs the Slotted shape with `/component` rules.                       |
