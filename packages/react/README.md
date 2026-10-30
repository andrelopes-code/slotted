# @slotted/react

React components for Slotted, a UI library for product web applications.

This package is a `0.x` beta. Its public API changes between beta releases without deprecation.

## Install

```sh
npm install @slotted/react @slotted/core @slotted/theme @slotted/themes
```

`react` `>=19.2.0 <20` is a peer dependency.

## Use

Load one theme and the stylesheet of each family the application renders, then import each component from its subpath:

```tsx
import '@slotted/themes/default.css';
import '@slotted/react/button/styles.css';
import { Button } from '@slotted/react/button';

export function Actions() {
  return <Button>Save</Button>;
}
```

`@slotted/react/<family>/styles.css` holds the family and every family it renders. `@slotted/react/styles.css` holds every family in one sheet, 1.5 MB. The modules import no stylesheet, so server rendering and test runners load them unbundled.

Every rule the library ships lives in the `slotted` cascade layer. An application that keeps its own CSS in layers declares `@layer slotted, app;` before the first import ([styling](https://github.com/andrelopes-code/slotted/blob/main/docs/styling.md)).

## Language

Components write English when no provider is present. `SlottedProvider` sets the locale and the catalogs of its subtree:

```tsx
import { SlottedProvider } from '@slotted/react/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

<SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
  {children}
</SlottedProvider>;
```

## Agents

`dist/docs/AGENTS.snippet.md` is the section an application adds to the instructions its coding agent reads. It points the agent at the family pages, the guidelines and the skills of the installed version. The `slotted-agent-docs` command keeps it there, and keeps the skills where the agent finds them:

```sh
# Writes the snippet between <!-- slotted:begin --> and <!-- slotted:end --> in the file; the rest of the file is left as it is.
slotted-agent-docs instructions write --file AGENTS.md
# An instruction file outside the directory that holds node_modules names that directory, relative to the file.
slotted-agent-docs instructions write --file ../AGENTS.md --app-root web
# An application with its own theme.
slotted-agent-docs instructions write --file AGENTS.md --theme brand --theme-css @acme/brand/theme.css
# One entry per skill: a relative link, or a copy for an agent that does not follow links.
slotted-agent-docs skills link --dir .agents/skills [--mode copy]
```

`instructions check` and `skills check` take the same arguments, print what differs, and exit 1 when the file or the directory is not what the matching write would produce: a `prepare` script runs the writes, CI runs the checks.

Skill directories known to agents, as documentation only: `.agents/skills`, `.claude/skills`, `.github/skills`. Instruction files: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `GEMINI.md`.

## License

MIT
