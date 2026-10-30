# Slotted

Slotted is a UI library for dense, product-oriented web applications, with idiomatic React and Angular bindings over shared specifications, accessibility contracts, tokens and behavior.

The packages are a `0.x` public beta on npm. The public API changes between beta releases without deprecation.

## Packages

| Package            | Content                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `@slotted/react`   | React components, one subpath per family, and `@slotted/react/styles.css`.          |
| `@slotted/angular` | Angular components, one secondary entry point per family.                           |
| `@slotted/core`    | Framework-independent behavior, formatting and i18n catalogs.                       |
| `@slotted/theme`   | The theme contract, `defineTheme`, `extendTheme` and the `slotted-build-theme` CLI. |
| `@slotted/themes`  | Prebuilt themes: `@slotted/themes/default.css`.                                     |
| `@slotted/styles`  | Per-family stylesheets, bundled by both bindings; not installed directly.           |

```sh
# React
npm install @slotted/react @slotted/core @slotted/theme @slotted/themes
# Angular
npm install @slotted/angular @slotted/core @slotted/theme @slotted/themes
```

Each package README holds its setup. Every rule the library ships lives in the `slotted` cascade layer; [docs/styling.md](docs/styling.md) holds the layer order and the override rules.

## Development

Requires Node.js 24 and pnpm 11.24.0.

```bash
corepack enable
corepack install --global pnpm@11.24.0
pnpm install --frozen-lockfile
pnpm build
pnpm check
```

`pnpm dev` starts both Storybooks: React on 6006, Angular on 6007. [CONTRIBUTING.md](CONTRIBUTING.md) holds the generated artefacts, the beta channel, publishing and the validation commands; [docs/README.md](docs/README.md) indexes every document; the [PRD](docs/product/prd.md) holds the product context.

## License

[MIT](LICENSE)
