---
name: review-screen
description: Use when reviewing, auditing or fixing an existing screen of an application built with {{package}}, or when asked whether a screen follows the Slotted guidelines. Reads the rules that apply, sweeps the screen's code for the defects found without running it, and reports each finding with its rule, level and place.
---

# Review a screen

A review answers one question per rule read: does the screen pass the rule's
`Check`. A finding names a rule; a remark that names no rule is not a finding.

## 1. Inventory

1. List the screen's files: its component, its template, its stylesheet and
   the requests it starts.
2. List the families it imports, and read `{{docsDir}}/<family>.md` for each.
3. List the elements of the screen's own: every element that is not a family,
   with the CSS that paints it.
4. Classify the screen with the table in step 1 of
   `{{docsDir}}/skills/compose-screen/SKILL.md`.

## 2. Read

1. `{{docsDir}}/guidelines/index.md` and
   `{{docsDir}}/guidelines/composition.md`.
2. The topics of the classification, and each topic whose `triggers` the
   screen matches.
3. `own-elements.md` when step 1 listed an element of the screen's own.
4. `{{docsDir}}/skills/waiting-states/SKILL.md` when the screen starts a
   request.

## 3. Sweep the code

Each search below finds a defect without running the screen.

| Search the screen's files for                                                                                                                                                  | Defect                                                    | Rule         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------ |
| A color literal (hex, rgb, hsl, oklch), a length in pixels or rem other than zero, or a font size, in the screen's CSS                                                         | a value the theme has a token for                         | CP-05, OE-01 |
| A rule of the application's CSS that sets color, border, radius, padding or type on a family's `data-ui` or `data-part`                                                        | the screen restyles a family instead of setting its axes  | OE-08        |
| A control that starts a request and is not in its `loading` state until the answer, except a Refresh of the whole page                                                         | a control that fires twice                                | AF-03        |
| A Refresh of the whole page drawing a spinner on its button, or a refetch of data on screen with no `page-header` progress bar                                                 | a wait in the wrong place, and no wait shown for the page | AF-07        |
| An empty state drawn from the initial value of the data, before the first answer                                                                                               | a wait shown as nothing                                   | AF-01        |
| A spinner standing in a region that has no items yet                                                                                                                           | placeholders missing                                      | AF-02        |
| Siblings of the page's own spaced by margins, or text with a font size of its own                                                                                              | layout outside the primitives                             | CP-02        |
| A grid or flex track around a family that scrolls, with no zero minimum                                                                                                        | the page scrolls, not the family                          | CP-03        |
| A badge, a tag or a color beside a family that already draws the same state                                                                                                    | a state stated twice                                      | CP-06        |
| An element of the screen's own that takes focus with no ring in its `focus-visible` state                                                                                      | focus not drawn                                           | OE-03        |
| A `data-grid` or `table` with no `variant` on a page whose `width` is not `bleed`                                                                                              | a grid with no frame on the page's surface                | LP-15        |
| A list page's `page-header` with a heading and no subheading, no figures and no solid primary action                                                                           | a header that does not say what the list covers           | LP-16        |
| A grid whose column state unpins its `actions` column                                                                                                                          | the row's actions leave the frame                         | LP-17        |
| A row of `stat-card`s where a label has more than three words, or one card has a comparison the others lack                                                                    | a row of cards with no shared structure                   | OV-06        |
| A `stat-card` without the `plain` `fill`, or a `chart` with the `card` `variant`, inside a widget of the `dashboard-grid`, a `section` with the `surface` `ground` or a `card` | a frame inside a frame                                    | OV-08        |
| A menu, a toggle or a state of the application's own that hides, orders or resizes the blocks of an overview                                                                   | an arranged overview built outside `dashboard-grid`       | OV-07        |
| Two destinations of the navigation whose `page`s state different `width`s                                                                                                      | the column's edges move between destinations              | CP-10        |
| A write whose success handler refreshes only the region of the control that wrote                                                                                              | figures elsewhere stay stale after the write              | AF-08        |
| Two or more actions in a `page-header`'s `actions` outside a `toolbar` that folds into its menu, or toolbar items with no counterpart beside the primary one                   | a header whose actions wrap on a phone                    | LA-03        |
| A footer `action-bar` of three or more actions with no overflow control, or a secondary action with no counterpart                                                             | a footer that stacks into a column on a phone             | LA-07        |

A rule whose `Check` needs the screen running — a size class, a throttled
network, the accessibility tree — is run when the environment can run it, and
otherwise reported as not checked, with the step that checks it.

## 4. Report

One finding per entry, every `MUST` before every `SHOULD`:

- the rule's id and level;
- the file and the line;
- what the screen does, in one sentence;
- the change after which the rule's `Check` passes.

A `SHOULD` the screen breaks on purpose is listed with its reason, as a
deviation. The screen passes when no `MUST` finding remains.

## 5. Fix, when asked

1. Fix every `MUST` finding, then each `SHOULD` finding the request covers.
2. A fix uses what the family offers — its state, its slot, its axis — and
   never CSS on its parts.
3. A literal becomes a token of the group `{{docsDir}}/tokens.md` lists for
   that decision.
4. Run the searches of step 3 again on the changed files: none finds anything.
