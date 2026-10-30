# Guidelines

Rules for composing screens from the `@slotted/*` families: what the library
does not say. The packages state what each family is — its parts, states,
tokens and keyboard. They do not state where a pager stands, what a region
shows before its first answer, or which family a bar's search slot is for.
Those are product decisions, and this directory records the ones the Nexora
demo has settled.

Rules that hold for any application ship in `@slotted/angular/docs/guidelines/`
and are read from `node_modules`; this directory keeps the rules of the Nexora
domain.

Every rule here was met on a Nexora screen first. A rule without an
observation is not written; an observation without a rule is a row in
`../angular/LIBRARY-FEEDBACK.md`.

## Files

| File                   | Prefix | Holds                                                                   |
| ---------------------- | ------ | ----------------------------------------------------------------------- |
| `index.md`             | —      | Every active rule in one line each. The only file a reader always loads |
| `writing-rules.md`     | —      | How a rule is written, numbered, evidenced and retired                  |
| `procurement-costs.md` | `PC`   | What a procurement screen reads under the cost permission               |

## Reading protocol

For a reader with a task — a person or a model about to write or review a
screen:

1. Load `index.md`. It is short; every rule is one line with its level and its
   file.
2. Match the task against the `triggers` in each topic file's front matter.
   Load the topic files that match, and no other.
3. Apply the rules by level: a `MUST` is a defect when broken, a `SHOULD` is a
   review finding, a `MAY` is a permission.
4. Verify with each rule's `Check` line before reporting the screen done.

A reader adding a rule loads `writing-rules.md` first.

## Lifecycle

```
observation on a Nexora screen
  → row in ../angular/LIBRARY-FEEDBACK.md (a defect or friction of the library)
  → or a rule here (a product decision the library does not make)
  → the demo is corrected so the rule's "Seen in" points at a fixed screen
  → the rule enters index.md
```

A rule that stops being true is retired, not deleted: `writing-rules.md`
says how. A rule that holds for any application moves, with its id, to
`tools/agent-docs/content/guidelines/` and ships with the library; its prefix
leaves this directory. `LG`, `WS`, `CV`, `RE` and `BD` moved on 2026-10-16.
