# Guidelines

Rules for composing screens from the Slotted families: what the reference
pages do not state. A family's page states what it is — its parts, states,
tokens and keyboard. It does not state where a pager stands, what a region
shows before its first answer, or which family a bar's search slot is for.

## Reading protocol

For a reader with a task — a person or a model about to write or review a
screen:

1. Read `index.md`: every active rule in one line, with its level and its file.
2. Match the task against the `triggers` in each topic file's front matter.
   Read the topic files that match, and `composition.md` always.
3. Before writing an element beside a family, read that family's page in
   `{{docsDir}}`. Before writing an element no family draws, read
   `own-elements.md` and `{{docsDir}}/tokens.md`.
4. Apply the rules by level: a `MUST` broken is a defect, a `SHOULD` broken is
   stated with its reason, a `MAY` is a permission.
5. A screen is done when each `Check` of the rules read passes.

## Rule identity

An id (`AF-03`) never changes meaning. A rule whose meaning or level changes
is retired, keeps its heading with `Status: retired`, and is rewritten under a
new id. The release notes of each version list the ids added and retired.
