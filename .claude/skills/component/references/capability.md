# Inventorying a family's capabilities

The rest of this skill filters. Nothing in it generates, so a family ends up
holding exactly what the scope paragraph listed and nothing a real product
needs beyond it. This step generates the candidates; the filters then run on a
list worth filtering.

Recall is not a survey, the same way "checked against APG" is not a pattern
citation. Name the source and the version or URL for every claim.

## The four sections, in order

### 1. Surveyed

Name at least three serious implementations of this family and where you read
them. Prefer sources that disagree with each other: a headless behaviour
library, an opinionated design system, and the platform or framework's own
answer.

Useful starting points, not a closed list: Radix Primitives, Base UI, Ark UI /
Zag, React Aria and React Spectrum, Angular CDK and Angular Material, Fluent,
Carbon, Primer, Polaris, shadcn/ui, and the HTML or ARIA specification for the
element the family is built on.

Record what each one calls the family, since the same capability hides under
different names.

When no implementation ships the family under any name, the survey is of
analogues: implementations that ship its parts or its interactions inside
another component — the job row inside a file uploader, the progress track
inside a toast. Name at least three, each with the part or interaction of this
family it informs; an analogue informs only a part with the same role and the
same interaction. The section states that no direct counterpart exists and
lists the names searched.

At least one surveyed implementation with a live demonstration is also read for
its picture and its motion: the one whose rendering is the best the survey
found, captured as a specimen (`harness.md` › Specimen) in light and dark with
`--states` on its interactive element. Public demonstrations worth trying first:
ReUI (`https://reui.io/preview/base/<name>`), shadcn/ui, Radix Themes, Geist,
Primer. Step 8 compares the family's states with that specimen, value by value.

A surveyed implementation contributes capabilities, ideas and measurements. It
never contributes the shape of the API: its row records how it exposes a
capability, and the family's own shape follows `frameworks.md` and improves on
it in a respect the inventory names, or states that the two coincide.

### 2. Table stakes

Every capability that two or more surveyed implementations ship. One row each:

| Capability | Who ships it | Verdict | Reason |
| ---------- | ------------ | ------- | ------ |

The verdict vocabulary is `adopt`, `adapt`, `decline`, or `defer to <family>`.

The default verdict is `adopt` or `adapt`. A `decline` is only complete when it
names the family that owns the capability instead, or writes the two or three
lines of consumer code that compose it from what this family does ship. A
`defer` names the family and the wave.

These are not valid reasons to decline:

- it is not needed yet, or no consumer has asked;
- a shared test, schema or workbench map cannot express it — that is a defect
  in the shared tool, fixed first, in its own commit, as the briefing requires;
- it would enlarge the API — composition is the answer to that, not absence;
- the scope paragraph did not list it.

### 3. Differentiators

What the best surveyed implementation offers that the others do not, and what
this library can offer that none of them can because of what it already owns:
three colour schemes, three densities, logical properties, a layered token
foundation, and two first-class framework bindings rather than one.

At least one row. If a family genuinely has none, write the sentence that says
why, naming what was considered.

### 4. Gaps

What no surveyed implementation handles well and a real product still hits.
Loading, empty, error, extreme content, long translated strings, a hundred
items, a hostile string, an interrupted interaction, an offline save.

At least one row, or the sentence that says why none exists.

## What counts as a capability

Not only props. All of these are capabilities, and all of them are routinely
missed:

- **State**: every mutable value, each with a controlled and uncontrolled pair,
  a request carrying a reason, and a place in the state matrix.
- **Keyboard**: every key the APG pattern lists, plus typeahead, `Home`, `End`,
  `PageUp`, `PageDown`, and the focus destination after each one.
- **Focus**: roving focus, focus containment, restoration to the trigger, and
  where focus lands after an item is removed.
- **Composition**: which parts a consumer can replace, and which element a part
  can become without losing semantics.
- **Configuration once**: the defaults an application sets for the whole family
  rather than per instance.
- **Collections**: keys, sections, disabled and selected sets, empty and
  loading states, incremental loading.
- **Content**: what happens to text that is long, translated, right-to-left, or
  a single unbroken token.
- **Escape hatches**: the imperative action a consumer cannot express
  declaratively — `focus()`, `open()`, `scrollToKey()` — and nothing more.

## The exit condition

The inventory is finished when a reader who knows this family from another
library can point at nothing and ask "why is that missing?" without finding the
answer already written, with its reason, in one of the four sections.
