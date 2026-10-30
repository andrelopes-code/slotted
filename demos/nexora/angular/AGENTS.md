## Slotted UI (@slotted/angular)

Paths below are relative to the directory that holds node_modules.

Before writing or changing UI, read `node_modules/@slotted/angular/docs/index.md`, then the file of each family you use. These files match the installed version: prefer them over prior knowledge of the library.

- Import the standalone directives from the family entry point that each file's Import section shows (`@slotted/angular/<family>`), and place each on the native element its selector names: `<button slButton>`.
- Load `@slotted/themes/default.css` once, in the global stylesheet.
- Set `data-slotted-theme="default"` on `<html>`. `data-slotted-scheme` (`light`, `dark`, `high-contrast`) and `data-slotted-density` (`comfortable`, `compact`, `dense`) apply to any element and its descendants.
- Change a family's appearance through its inputs (`size`, `variant`, `tone` where it has them), not with CSS that targets its parts.
- Application CSS uses `var(--slotted-*)` tokens for color, spacing and radius, inside a layer declared after the library's: `@layer slotted, app;`.
- In CSS and tests, select a family by `[data-ui="<family>"]` and its parts by `[data-part="<part>"]`.

### Tasks

Read the skill before the task:

- Compose or change a screen — a list, a record, a form, an overview: `node_modules/@slotted/angular/docs/skills/compose-screen/SKILL.md`
- Show what a screen draws while it waits, and its empty and error states: `node_modules/@slotted/angular/docs/skills/waiting-states/SKILL.md`
- Review a screen against the guidelines, or fix what a review found: `node_modules/@slotted/angular/docs/skills/review-screen/SKILL.md`
- Write a component or element that no family draws: `node_modules/@slotted/angular/docs/skills/build-own-element/SKILL.md`
- Change the brand color, the scheme, the density or a control's shape: `node_modules/@slotted/angular/docs/skills/theme-app/SKILL.md`

## Nexora domain rules

`../guidelines/index.md` holds the rules of the Nexora domain; they apply with the library's.
