---
name: docs-page
description: Use when writing or rewriting the public documentation page of one component family in apps/docs (its MDX, its React and Angular examples, and the public text of its *.docs.ts), or when asked to "document <family>", "make the <family> page", "the <family> docs". Not for changing a family's behaviour; a defect found here goes to the package.
---

# Documentation page of a family

A family's page is where a team decides to adopt it and where an engineer copies it on a
working day. It runs every example in the framework the reader chose, and it says only
what the code does. The bar: the page answers every question a team building a real
product would ask before reaching for the source — and does it with examples worth
copying.

Product: `apps/docs/PRODUCT.md`.
Composition rules for product screens: `demos/nexora/guidelines/`.

## What a page is made of

| Part                            | Where it comes from                                                                              | Written by                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Title, one-sentence description | `src/content/components/<family>.mdx` frontmatter                                                | this skill                            |
| Route                           | `src/pages/[framework]/components/<family>.astro`, written by `pnpm routes` after the MDX exists | generated                             |
| Lead example                    | first `<Example>` in the MDX                                                                     | this skill                            |
| Installation                    | `<Installation />` right after the lead example                                                  | generated                             |
| Sections with examples          | `## Heading`, one paragraph, `<Example name="…" />`                                              | this skill                            |
| Recipes (complex families)      | `## Heading` sections composing the family with others                                           | this skill                            |
| Accessibility                   | `contract.json` › `keyboard` + `*.docs.ts` › `accessibility`                                     | generated; text edited in the docs.ts |
| API                             | `*.docs.ts` › `api`, `events`, `composition`, `anatomy`, `imports`                               | generated; text edited in the docs.ts |
| Theming                         | `<family>.tokens.json`, theme values                                                             | generated                             |

Examples live in `apps/docs/examples/react/<family>/<name>.tsx` and
`apps/docs/examples/angular/<family>/<name>.ts`, the same `<name>` in both. A name present in
one framework only is an unfinished page.

## Process

1. **Inventory.** Read the family's contract (`specs/components/<family>/contract.json`:
   members, axes, states, scenarios, keyboard), both `*.docs.ts` (scenes are the
   capability list the Storybook reference page already demonstrates), the stories, and
   the existing examples. List every capability a reader can use: each axis value,
   each state, controlled and uncontrolled, every part a consumer composes, loading,
   empty and error where the family has them, keyboard and focus behaviour worth seeing,
   narrow-width behaviour, composition with sibling families.
2. **Roster.** Turn the inventory into the page's sections, in the order a reader needs
   them: the lead (the family doing its everyday job), then the axes (variants, sizes),
   states, content and parts, behaviour (controlled, events), composition, recipes.
   Size by complexity: simple families 5–8 examples, medium 10–15, complex 20–40 with
   recipes. Write the roster at the top of the MDX as an HTML comment while working and
   delete it when done.
3. **Examples, both frameworks.** Each example:
   - shows one idea, with product content from one world (operations, commerce,
     finance — the home console's Northwind is a good source of names and figures);
     English; no lorem ipsum, no "Item 1", no "Option A";
   - is self-contained: imports from the published entry points
     (`@slotted/react/<family>` or the root, `@slotted/angular/<family>`), no site
     helpers, no CSS of its own unless the example is about the consumer's CSS — and
     then the smallest, token-based;
   - composes exactly the same UI in both frameworks (`pnpm test:parity` compares the
     DOM): the same parts, props as inputs, content and order;
   - React: one default-exported function component; Angular: one standalone component,
     `selector: 'app-<family>-<name>'`, inline template, signals for state;
   - a stateful example works when used (type, select, open, close) — the preview is
     live, not a picture.
4. **Text.** Each section: a heading naming the capability, one paragraph saying when to
   use it and what the reader gets, written for an engineer, in the second person or
   impersonal, present tense, no marketing words, no claims the example does not show.
   The public strings of both `*.docs.ts` (API descriptions, events, anatomy purposes,
   accessibility notes, import) are the site's API section: rewrite them in that voice —
   whole sentences ending with a period; no Portuguese; no repository paths or section
   numbers ("docs/…", "§2.8"); no "the library"/"the family" when the component's name
   reads better; keep every fact. Do not change behaviour while editing a docs.ts.
5. **Package defects.** A capability that does not work, a binding that renders a
   different DOM, an API that cannot express a reasonable example: triage with the
   rules of `AGENTS.md` › Demo Feedback Loop (contract decides which binding is wrong),
   fix in the package with a failing-then-passing test, and add a row to
   `apps/docs/LIBRARY-FEEDBACK.md`. Never work around a defect inside an example.
6. **Verify** (all must pass; report the output):
   - `cd apps/docs && pnpm test:parity` and `node_modules/.bin/astro check`;
   - `astro build`, then `pnpm test:sections` (sections and tabs present);
   - a browser pass on `/react/components/<family>/` and `/angular/components/<family>/`
     with playwright-core (scratchpad install; Chrome at `/usr/bin/google-chrome`; the dev
     server on :4321 is a singleton — reuse it): every example frame renders, no page
     errors, interact with each stateful example once, Code tab shows the source;
   - look at the page: screenshots of the lead, three examples spread down the page and
     the API section, in dark and light, and one at 390px. Fix what reads poorly:
     cramped previews, empty previews, previews taller than they need, misaligned text.
7. **Checkpoint**: one line per family in `.claude/progress/docs-pages.md` (examples
   count per framework, defects fixed, anything open).

## Preview layout

An `<Example>` centres a column of 24rem by default. Pass `wide` for examples that need
the column (tables, toolbars, shells, calendars, anything with a row of controls). A
preview holds one composition; several variants side by side use the library's own
`Inline`/`Stack`/`Grid`, not custom CSS.

## Done means

Both framework pages show the same sections and the same examples; every API row reads
as public documentation; the checks above pass; the screenshots were looked at.
