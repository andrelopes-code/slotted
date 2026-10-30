# The reference page

A family's two reference pages are the only place a consumer meets it. The
harness proves the picture; the pages prove the API. A page that shows a
component working and never shows how it is written documents a screenshot.

This file is binding for every family not listed in
`specs/legacy-reference-pages.json`. That list only shrinks: a family leaves it
when both of its pages answer this contract, and nothing may join it.
`specs/reference-pages.test.mjs` is the ratchet, and
`referencePageErrors` — from `@slotted/storybook-workbench/testing`, called in
each family's stories spec — is the check.

## What the page must contain

In this order, because it is the order a reader needs it in.

1. **Import.** The exact import statement. An Angular page also names the
   `selector` the directive attaches to and its `exportAs`. A reader who
   cannot copy the import cannot start.
2. **Anatomy.** One row per part the contract declares: the `data-part`, the
   element it renders, whether it is always present, and what it is for. The
   contract already names the parts; this is where the page says what they are.
3. **Demonstrations.** One per scenario the contract declares — not two, not
   the two that happened to be wired up. Each one carries a title, a caption
   saying what to look at, and the code that produced it.
4. **Inputs, or Props.** Every axis and every value input, with its type, its
   default and one line of meaning. Every default the contract declares is
   required to appear, and the shared checker enforces it.
5. **Outputs, or Events.** Name, payload, and the moment it is emitted. A
   family whose contract declares a `stateModel` and shows no event table is
   refused.
6. **Composition and escape hatches.** The provider that sets defaults once,
   the `render` prop or the directive on the consumer's own element, the ref or
   `exportAs`, the native attributes that pass through, and the handlers that
   compose rather than replace.
7. **Accessibility.** At least three sentences, each naming a decision rather
   than a virtue: what the platform supplies, what the family adds, what a
   reader hears.
8. **Public tokens**, then **Code** — the anatomy as it reaches the DOM, and
   the stylesheet an application would write to retune the family.

## Demonstrations

The scenario list in the contract is the floor. A family with three axes, four
states and a composition story does not have three demonstrations.

Every demonstration is worth its place or it is not on the page:

- **It answers a question a reader actually has.** "What does `variant` do" is
  a question; "here are all the values in a row" is a swatch. Show each value
  in the context that value exists for — a neutral link in a table row, an
  inverse link on a solid surface — and the axis explains itself.
- **It carries a caption that says what to look at**, not what it is called.
  Forty characters is the floor the checker enforces, and the floor is not the
  target. "Hover darkens the text and fills the underline; press goes one step
  further" is a caption. "The states" is a label.
- **It shows its own source.** The curated snippet beside the canvas is the
  usage, not the demo scaffolding: the two or three lines a consumer would
  actually write. Snippets are formatted by Prettier and checked, so they are
  code a reader can paste.
- **It is exercised at the narrow width and in every scheme** before it is
  called finished. The toolbar switches scheme, density and direction, and a
  demonstration that only holds at 1400 pixels in light is half a
  demonstration.

Include, at minimum, one demonstration for each of: every axis, every state the
contract declares, the family in a real context rather than in isolation,
content the family did not choose (long, translated, right-to-left, unbroken),
composition with the families it is meant to sit beside, and the keyboard.

### The page shows everything the family does, not a sample of it

The reviewer's standing complaint about these pages, in their own words: the
screens are extremely basic, few capabilities are chosen to be shown, and the
whole point of a story is to see exhaustively what the component offers.

So the bar is coverage, not illustration. Read the capability inventory from
step 3 and the contract side by side, and count: every axis value, every state,
every part a consumer may replace, every prop that changes what is drawn, every
capability the inventory listed as a differentiator. A capability with no
demonstration is a capability nobody can find, and the family may as well not
have shipped it. `date-field` holds the day a short month could not take, and a
page that never shows 31 → 28 → 31 has hidden the one behaviour no surveyed
implementation has.

Two demonstrations of the same thing under different names is padding, and
padding is not coverage. The question for each is: which line of the inventory
does this one answer.

### A demonstration is a real screen, not a specimen

Three fields called "Field 1", "Field 2" and "Field 3" prove that a form lays
out. They prove nothing about whether anyone would want to use it. The reviewer
asks for demonstrations faithful to reality — a real form with real labels, a
real table with plausible rows, a real page with a real title and real actions —
because a component's defects only appear against real content: a label that is
two words in the mock and nine in the product, a number column that is right-
aligned everywhere except in the one row that holds a dash, an action bar with
one button in the demo and seven in the application.

Write the content a product would have. Real names, real quantities, real dates,
real currency, real states — including the awkward ones, because the awkward
ones are where the family either holds or does not. Pick one domain per family
and stay in it, so the page reads as one product rather than as a bag of
fragments.

This is not decoration and it is not extra scope: it is the difference between
a page that demonstrates the family and a page that demonstrates that the family
renders.

## Spacing, and why stories may not style themselves

Every demonstration is laid out with the workbench primitives. A story that
reaches for an inline style is reaching past one, and
`specs/reference-pages.test.mjs` refuses it.

| Primitive                                                                                    | What it is for                                                                                             |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `.slotted-demo-grid` with `data-columns="1\|2\|3"`                                           | The row of scenes. Scenes share a subgrid, so stages start on the same line however long the captions are. |
| `.slotted-demo-scene` with `__header`, `__label`, `__note`                                   | One scene: its name and its caption.                                                                       |
| `.slotted-demo-stage` with `data-layout="row\|stack\|block\|prose"` and `data-align="start"` | The ground the examples stand on. **It owns the gap**: nothing placed on it can touch anything else.       |
| `.slotted-demo-surface` with `data-surface="inverse\|raised\|sunken"`                        | A painted context, from foundation tokens, so it answers the scheme switch.                                |
| `.slotted-demo-rows`                                                                         | A dense two-column table context, for a family whose real home is a row.                                   |
| `.slotted-demo-measure`                                                                      | A narrow column, for showing what happens at 360 pixels and below.                                         |
| `.slotted-demo-stack`, `.slotted-demo-row`                                                   | A column or a wrapping row of examples inside a stage.                                                     |
| `--slotted-demo-gap`                                                                         | The one distance a story may retune, and it is a custom property rather than a style attribute.            |

### How much room a demonstration gets

A scene is read at the full width of the page. `data-columns` is an opt-in for
members narrow enough to sit beside each other — a badge, a key, a chip, an
avatar — and asking for two or three is a claim that the family reads correctly
in half or a third of the page. A family that reflows, wraps, truncates or
answers its own width takes one column, which is the default.

More room than the consumer will give is a mild inaccuracy. Less room breaks the
component in the picture, and the correction is then made against a constraint
nobody imposes.

**Height is the same decision, and it is the one that gets forgotten.** The
stage is 88 pixels tall at rest and grows to its contents, which is right for a
control and wrong for anything that owns a screen. `.slotted-demo-viewport`
carries the scale:

| Size                 | Height             | For                                                       |
| -------------------- | ------------------ | --------------------------------------------------------- |
| unset                | `4rem`             | A bar across the top of something.                        |
| `data-size="tall"`   | `22rem`            | A panel with room around it: a dialog, a drawer, a sheet. |
| `data-size="screen"` | `min(80vh, 46rem)` | A family that owns a whole screen.                        |

A page, a page header that snaps on scroll, an application shell, a split view,
a side navigation, a data grid: each is a screen's worth of decisions, and in a
box the height of a card it becomes a picture of a different component. The
reviewer's words: a page header in four hundred by five hundred and twenty is
horrible, and what it shows is not the family. Take `screen` and let the
demonstration be the size the thing actually is.

Add `data-scroll` when the behaviour is about what happens while the reader
scrolls past it, and `data-layout="page"` when what scrolls has to read as a
page rather than as a box.

### Measure the page, do not only look at it

A page can pass every test, look plausible in a screenshot, and still be drawn
wrong: `pagination` stood at **zero pixels** inside a 676-pixel stage on the
published page, with its content spilling 171 pixels past the box that owned it.
Nothing offline could see it, because the defect exists only once a browser has
laid the page out.

With a Storybook already running:

```bash
node tools/harness/audit.mjs "http://localhost:6006/iframe.html?viewMode=docs&id=components-<family>--reference"
node tools/harness/audit.mjs "http://localhost:6007/iframe.html?viewMode=docs&id=components-<family>--reference"
node tools/harness/audit.mjs "<url>" --width 620
```

It reports two geometries and exits non-zero on either: an element **collapsed**
to a sliver inside a wide stage, and content that **overflows** the box that owns
it. Both are read as measurements rather than as causes, so the guard holds for
the next cause nobody predicted. A finding is a defect of this step.

### Which layout a stage takes

`stack` is a column of things that keep their own width: right for a chip, a key,
a badge. `block` is a column whose children fill it.

**A family that declares `container-type: inline-size` on its root takes
`block`.** Its contents no longer contribute to its intrinsic width, so a stage
that shrink-wraps its children resolves it to nothing: `collapsible`,
`pagination` and `stepper` each stood about one character wide and broke their
text one letter per line, on a page that passed every test.
`specs/story-layout.test.mjs` now refuses the pairing.

Eight families answer their own width today — `alert`, `button-group`, `card`,
`collapsible`, `field`, `form`, `pagination` and `stepper` — and any family that
puts a container query on its root joins them.

The root is what the rule is about. `progress-indicator` declares a container on
the track of its linear shape, so a dash stated in stroke thicknesses can
measure the track; its root contributes its width as any other element does, and
a circle of its own on a `stack` stage is correct. The test reads the selector
rather than the file for that reason.

If a demonstration needs a ground the primitives do not have, add the primitive
to `workbench.css` with a test, in its own commit, and use it. That is the same
rule the briefing states for every other shared tool.

## Before the gate

If a Storybook server is already running, validate in that live scenario first.
Use React on port 6006 or Angular on port 6007. Do not start Storybook here.
If neither is running, validate with the harness or the available rendered artifacts.
Not the story files — the pages. The reference pages are Storybook docs
entries: `.../iframe.html?viewMode=docs&id=components-<family>--reference`
renders one on its own, which is what a screenshot can be taken of.

Look for, and fix:

- a demonstration whose canvas is mostly empty;
- two examples with no distance between them;
- a caption that says the title again;
- a table clipped at the right edge;
- a scene whose stage starts lower than the one beside it;
- an API table that omits an input the story uses;
- a code drawer whose snippet no longer matches the demonstration above it.

Hand the page URLs to the reviewer at the gate, and say which widths and
schemes were read.
