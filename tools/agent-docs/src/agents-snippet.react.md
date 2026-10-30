## Slotted UI (@slotted/react)

Paths below are relative to the directory that holds node_modules.

Before writing or changing UI, read `{{docsDir}}/index.md`, then the file of each family you use. These files match the installed version: prefer them over prior knowledge of the library.

- Import components from `@slotted/react` or the family subpath that each file's Import section shows.
- Load `@slotted/react/styles.css` and `@slotted/themes/default.css` once, at the application entry.
- Set `data-slotted-theme="default"` on `<html>`. `data-slotted-scheme` (`light`, `dark`, `high-contrast`) and `data-slotted-density` (`comfortable`, `compact`, `dense`) apply to any element and its descendants.
- Change a family's appearance through its props (`size`, `variant`, `tone` where it has them), not with CSS that targets its parts.
- Application CSS uses `var(--slotted-*)` tokens for color, spacing and radius, inside a layer declared after the library's: `@layer slotted, app;`.
- To draw a family as another element, pass `render`. A router's link is never drawn on its own, only as what a family's `render` returns: `Link` for a link.
- In CSS and tests, select a family by `[data-ui="<family>"]` and its parts by `[data-part="<part>"]`.

### Tasks

Read the skill before the task:

- Compose or change a screen — a list, a record, a form, an overview: `{{docsDir}}/skills/compose-screen/SKILL.md`
- Show what a screen draws while it waits, and its empty and error states: `{{docsDir}}/skills/waiting-states/SKILL.md`
- Review a screen against the guidelines, or fix what a review found: `{{docsDir}}/skills/review-screen/SKILL.md`
- Write a component or element that no family draws: `{{docsDir}}/skills/build-own-element/SKILL.md`
- Change the brand colour, the scheme, the density or a control's shape: `{{docsDir}}/skills/theme-app/SKILL.md`
