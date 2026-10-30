# @slotted/angular

Angular components for Slotted, a UI library for product web applications.

This package is a `0.x` beta. Its public API changes between beta releases without deprecation.

## Install

```sh
npm install @slotted/angular @slotted/core @slotted/theme @slotted/themes
```

`@angular/core`, `@angular/common` and `@angular/forms` `>=22.1.0 <23` are peer dependencies.

## Use

Load one theme once in the application's global stylesheet:

```css
@layer slotted, app;
@import '@slotted/themes/default.css';
```

Every rule the library ships lives in the `slotted` cascade layer; the `@layer` statement places it before the application's own layer ([styling](https://github.com/andrelopes-code/slotted/blob/main/docs/styling.md)). Each component comes from its secondary entry point and attaches to its native element:

```ts
import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';

@Component({
  imports: [SlButton],
  template: `<button slButton>Save</button>`,
})
export class Actions {}
```

## Language

Components write English when no provider is present. `provideSlotted` sets the locale and the catalogs; `locale` accepts a string or a signal:

```ts
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

export const appConfig = {
  providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
};
```

## Agents

`docs/AGENTS.snippet.md` is the section an application adds to the instructions its coding agent reads: `AGENTS.md`, or `CLAUDE.md` for Claude Code, directly or through `@AGENTS.md`. It points the agent at the family pages, the guidelines and the skills of the installed version.

## License

MIT
