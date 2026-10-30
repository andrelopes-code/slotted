# @slotted/agent-docs

Builds the documentation an agent reads from the installed package —
`dist/docs` of `@slotted/react`, `docs` of `@slotted/angular` — and checks the
material published with it: guidelines, product skills and the token page.

## What to edit

| Change                        | Edit                                                                                                                                                                                                                       | Verify                                                   | Evaluation before release |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------- |
| New rule                      | its topic in `content/guidelines/`, by `writing-rules.md`                                                                                                                                                                  | `pnpm --filter @slotted/agent-docs verify`               | yes                       |
| Rule reworded, same meaning   | the rule's fields; the id stays                                                                                                                                                                                            | same                                                     | yes                       |
| Rule changes meaning or level | `Status: retired · rewritten as XX-NN` on the old id, a new id below                                                                                                                                                       | same                                                     | yes                       |
| Rule retired                  | `Status: retired · <reason>`; the body goes                                                                                                                                                                                | same                                                     | yes                       |
| New topic                     | a file in `content/guidelines/` with a new two-letter prefix                                                                                                                                                               | same                                                     | yes                       |
| New or changed skill          | `content/skills/<name>/SKILL.md`, by `content/skills/writing-skills.md`; a case in `eval/cases.json`, and its starting files in `eval/seeds/<seed>/<binding>/` when the task changes existing code; a line in each snippet | same                                                     | yes                       |
| New theme token               | `packages/theme/src/contract.json`: the token and its group                                                                                                                                                                | `pnpm --filter @slotted/theme test`, then the line above | no                        |
| Design system book or cover   | `content/design-system/README.md`, `content/design-system/cover.html`                                                                                                                                                      | same                                                     | no                        |
| Snippet                       | `agents-snippet.react.md`, `agents-snippet.angular.md`                                                                                                                                                                     | `pnpm --filter @slotted/agent-docs verify`               | yes                       |
| `slotted-agent-docs` command  | `cli/slotted-agent-docs.mjs`; Node built-ins only, published as written                                                                                                                                                    | `pnpm --filter @slotted/agent-docs verify`               | no                        |

## Generated, never edited

- `guidelines/index.md` of each binding, from the topics.
- `skills/index.md` of each binding, from the skills' descriptions.
- `tokens.md`, from the groups of `packages/theme/src/contract.json` and the
  values of `packages/themes/src/default/values.json`.
- The reference catalog the content test resolves names against, from the
  family contracts, the theme contract, the stylesheets and the public API of
  `@slotted/theme` and `@slotted/themes`.
- The release notes' guideline block, from the topics at the last tag and now.
- The site routes and `llms.txt` of `apps/docs`, from the built packages.
- `packages/react/dist/bin/slotted-agent-docs.mjs`, copied from `cli/` by `bin/build.mjs --bin`.

## Design System export

The design system on Claude (`content/design-system/system.json` names its
URL) is generated from the repository: tokens from the theme, one folder per
family from the React docs, the book and the cover from
`content/design-system/`.

1. `pnpm --filter @slotted/react build`.
2. `pnpm --filter @slotted/agent-docs design-system --out <dir>/design-system`.
   It prints the tokens it left out and the families without a preview: a
   family gains a preview when its site example compiles as a complete module.
3. In a session with the Artifact tool, read `project/design-system.json` of
   the system. Keys the page added since the last export (`sections`,
   `assetGroups`, `groups`) go into the generated index.
4. Publish to the system's URL with `root` = `<dir>/design-system`, every file
   under `project/` in `files`, and `project/design-system.json` as
   `file_path`.

## Release

1. Build the bindings: `pnpm --filter @slotted/react build && pnpm --filter @slotted/angular build`.
2. Pack the betas: `node scripts/pack-beta.mjs --only @slotted/react,@slotted/angular,@slotted/core,@slotted/theme,@slotted/themes`.
3. When `content/` changed since the last tag: `pnpm eval:agent-docs`, and
   commit the report it writes in `docs/evals/`.
4. `pnpm release`.
