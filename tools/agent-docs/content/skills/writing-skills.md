# Writing a product skill

A product skill is a procedure the consumer's agent runs on its own
application. It ships in `@slotted/react` and `@slotted/angular` under
`docs/skills/<name>/SKILL.md`; the snippet of each binding names it.

## One directory per skill

`<name>/SKILL.md`, and nothing else in the directory. This file is the only
file of `content/skills/` that is not a skill; it is never published.

```
---
name: <the directory's name>
description: Use when <the task, in the words a request would contain>. <What the skill decides.>
---
```

The content test fails when `name` differs from the directory, when the
description does not start with "Use when", or when the file passes 500 lines.

## What a skill may write

- `{{docsDir}}`, replaced by the docs directory of the binding;
  `{{package}}`, replaced by the package name; `{{themeScope}}`, replaced by
  the binding's element that sets a theme, scheme, density and seeds on a
  subtree. No other placeholder.
- Rule ids of active rules only (`AF-05`). A rule retired later fails the
  content test until the skill cites its replacement.
- Between backticks, only what the catalog resolves: families, parts, states,
  axes, tokens, token groups, the public API of `@slotted/theme` and
  `@slotted/themes`, theme attributes, seeds, cascade layers, topic files,
  `{{docsDir}}/…` paths that exist.
- No code block, no relative link, no name of the repository's demo.

## Evaluation

Every skill has at least one case in `tools/agent-docs/eval/cases.json`; the
content test fails without one. A case states a prompt a consumer would write
and the assertions a conforming answer passes. A change to a skill, or to a
rule a skill cites, is followed by `pnpm eval:agent-docs` before the next
release; the report is committed in `docs/evals/`.
