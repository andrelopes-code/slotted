# Writing a rule

A rule is read by a model deciding what to draw, and by a reviewer deciding
whether a screen is done. Both need the same thing: one testable statement,
its reason, and a way to check it. Everything else is weight.

## One topic file

```
---
topic: <one noun phrase>
prefix: <two capital letters, unique across the directory>
triggers: [<words a task would contain: "pagination", "tab", "popover">]
families: [<the families the topic's rules name>]
---

# <Topic title>

<Two to four sentences: what the topic decides and where the library stops.>

### <PREFIX>-<NN> · <Title, five words or fewer>

Level: MUST | SHOULD | MAY
Applies to: <parts, families or situations, as a list>
Rule: <one sentence, in the imperative or the indicative, testable>
Why: <one sentence>
Do: <prose: the composition that satisfies the rule>
Don't: <prose: the anti-pattern, as it was seen>
Seen in: <demo> · <screen or region> · <ledger row, commit, or "corrected">
Verified in: <the demo test that pins the rule>
Check: <a step any application can perform>
```

Fields follow the heading after one blank line, in this order, each on its own line, each once. `Seen in` and
`Verified in` are optional and stay in the source: the build removes both from
the published copy. Every other field is required. A rule with no `Check` does
not enter `index.md`.

## Where a rule lives

A rule about composing screens from the families lives here and ships in
`@slotted/react` and `@slotted/angular`. A rule that holds only for one
product's domain — its permissions, its records, its routes — lives in that
demo's `guidelines/`. One prefix belongs to one place; the content test fails
when a demo declares a prefix this directory declares.

## Check is for the consumer

`Check` is published. It names a step any application can perform — throttle
the network, resize to a size class, read the accessibility tree — or a
property of the markup. It never names a demo panel, a demo route or a demo
test; those go to `Verified in`.

## Levels

RFC 2119, three words:

- `MUST` — broken, the screen has a defect. Reserved for what a reader
  cannot recover from: a wait shown as nothing, a control that fires twice.
- `SHOULD` — broken, the screen has a review finding with a stated reason to
  deviate. Most layout rules live here.
- `MAY` — a permission the library does not grant on its own.

## Identity

- The ID is the topic prefix, a hyphen and two digits: `AF-03`. Numbers are
  given in order of writing and never reused.
- A retired rule keeps its heading, gains `Status: retired · <reason or
destination>` as its first field, and loses its body. It leaves `index.md`.
- A rule that changes meaning is retired and rewritten under a new number. A
  rule whose wording improves keeps its number.
- A rule rewritten under a new number says so in its status:
  `Status: retired · rewritten as LP-12, which …`. The release notes read the
  new id from those words.

## What a rule does not contain

- **Code.** No snippet, no template, no selector. A rule names families,
  parts, states and tokens by their published names — `popover` `body`,
  `data-loading`, `--slotted-app-shell-row-inset` — and nothing that a
  refactor would falsify. The demo's source is the example; the rule points
  at the screen.
- **File paths or line numbers.** `Seen in` names a screen or a region and a
  ledger row or a commit. Paths move; screens and commits do not.
- **Pixel values that are tokens.** "one row inset", not "8px"; "the medium
  control height", not "34px". A literal appears only when the value is a
  literal in the library too — a breakpoint, a latency threshold.
- **Binding-specific API.** No input name, no directive selector, no React
  prop. Where the two bindings differ, the rule names the capability and the
  reference page names the API.
- **Justification beyond `Why`.** One sentence. A rule that needs a paragraph
  to defend is two rules or a design document.
- **Qualifiers without a measure.** "generous", "clean", "modern" do not
  test. "one space step more than the bar's own gap" does.

## Vocabulary

One word per thing, the reference pages' word:

| Say         | Not                           | Meaning                                                                      |
| ----------- | ----------------------------- | ---------------------------------------------------------------------------- |
| pending     | loading (as a noun), fetching | a request has started and no answer has arrived                              |
| busy        | refreshing, updating          | content is shown and a newer answer is on its way                            |
| empty       | no data, nothing              | an answer arrived and it holds zero items                                    |
| placeholder | skeleton row, shimmer         | the family `skeleton` standing in for a row                                  |
| waits       | spinner, loading button       | a control in its `loading` state: refuses activation and shows the indicator |
| region      | area, section, container      | the element carrying the state for a subtree                                 |
| row inset   | padding, gutter               | `--slotted-app-shell-row-inset`                                              |
| mark        | icon column, avatar slot      | the row's first column, `--slotted-app-shell-row-mark` wide                  |

## Evidence

`Seen in` is the rule's proof. It names the demo screen where the
anti-pattern was met and one of:

- the `LIBRARY-FEEDBACK.md` row, when the observation also produced a ledger
  entry;
- the commit that corrected the demo;
- `corrected`, when the fix landed in the same change as the rule.

A screenshot in the demo's `angular/screenshots/` may be named; it is evidence of the
picture, never of the rule.

## Before a rule enters the index

1. The statement is one sentence and a reviewer can answer yes or no to it.
2. `Check` is a step any application can perform, not "verify visually"; a
   demo test goes to `Verified in`.
3. No word in the forbidden list above appears in the body.
4. The demo satisfies the rule, or the rule says which ledger row blocks it.
5. The heading's id is new in its topic; `index.md` and the release notes
   are generated from the topics.
