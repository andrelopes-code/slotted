# Slotted

[![npm](https://img.shields.io/npm/v/@slotted/react?label=npm)](https://www.npmjs.com/package/@slotted/react)
[![CI](https://github.com/andrelopes-code/slotted/actions/workflows/ci.yml/badge.svg)](https://github.com/andrelopes-code/slotted/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Slotted is a UI library for dense, product-oriented web applications, with idiomatic React and Angular bindings over shared specifications, accessibility contracts, tokens and behavior.

The packages are a `0.x` public beta on npm. The public API changes between beta releases without deprecation.

- **Two native bindings.** React and Angular components, each written the way its framework expects, over one contract per family in `specs/components/` (125 families).
- **Accessibility by contract.** Each family states its ARIA pattern, roles, keyboard table and focus model, and a test verifies the contract.
- **Themes as data.** Tokens, schemes (light, dark, high contrast) and densities come from a theme module; every rule ships in the `slotted` cascade layer, so application CSS overrides it without specificity fights.
- **Internationalization.** One message catalog with ICU plurals; en-US is built in and pt-BR ships as a catalog.

## Packages

| Package                                | Content                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| [`@slotted/react`](packages/react)     | React components, one subpath per family, and `@slotted/react/styles.css`.          |
| [`@slotted/angular`](packages/angular) | Angular components, one secondary entry point per family.                           |
| [`@slotted/core`](packages/core)       | Framework-independent behavior, formatting and i18n catalogs.                       |
| [`@slotted/theme`](packages/theme)     | The theme contract, `defineTheme`, `extendTheme` and the `slotted-build-theme` CLI. |
| [`@slotted/themes`](packages/themes)   | Prebuilt themes: `@slotted/themes/default.css`.                                     |
| [`@slotted/styles`](packages/styles)   | Per-family stylesheets, bundled by both bindings; not installed directly.           |

## Quick start

### React

```sh
npm install @slotted/react @slotted/core @slotted/theme @slotted/themes
```

```tsx
import '@slotted/themes/default.css';
import '@slotted/react/button/styles.css';
import { Button } from '@slotted/react/button';

export function Actions() {
  return <Button>Save</Button>;
}
```

### Angular

```sh
npm install @slotted/angular @slotted/core @slotted/theme @slotted/themes
```

```css
/* styles.css */
@import '@slotted/themes/default.css';
```

```ts
import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';

@Component({
  imports: [SlButton],
  template: `<button slButton>Save</button>`,
})
export class Actions {}
```

Each package README holds its full setup. [docs/styling.md](docs/styling.md) holds the cascade layer order and the override rules.

## Repository

| Directory   | Content                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `packages/` | The six published packages.                                               |
| `specs/`    | The public contract of each family and the test that verifies it.         |
| `apps/`     | The documentation site and the React and Angular Storybooks.              |
| `demos/`    | Nexora, a reference application that consumes the published packages.     |
| `tools/`    | Unpublished workspace tooling: agent docs, the visual harness, Storybook. |
| `docs/`     | Design law, decisions, product context and the build order.               |

## Development

Requires Node.js 24 and pnpm 11.24.0.

```bash
corepack enable
corepack install --global pnpm@11.24.0
pnpm install --frozen-lockfile
pnpm build
pnpm check
```

`pnpm dev` starts both Storybooks: React on 6006, Angular on 6007. [CONTRIBUTING.md](CONTRIBUTING.md) holds the generated artifacts, the beta channel, publishing and the validation commands; [docs/README.md](docs/README.md) indexes every document; the [PRD](docs/product/prd.md) holds the product context. Every tracked file and commit message is written in en-US (`pnpm test:language`).

## License

[MIT](LICENSE)
