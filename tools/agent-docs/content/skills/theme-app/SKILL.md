---
name: theme-app
description: Use when changing how an application built with {{package}} looks, as a whole or in one region — its brand colour, a light, dark or high-contrast scheme, density, fonts, corners, or the shape of a control. Chooses the narrowest level that reaches the change — a seed, a token, a family token or a theme rule — and where it is declared.
---

# Theme an application

The theme decides every value a family paints. A change of look is made in a
theme or on a scope, never by CSS of the application on a family's parts.

## 1. Choose the level

Take the first row that reaches the change.

| The change                                                                      | Level                                                           | Declared in                                                                                                  |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| The brand colour, or the colour of one intent                                   | a seed: `--slotted-seed-accent` or another name of `SEED_NAMES` | the theme's `seeds`, or a scope                                                                              |
| Light, dark, high contrast, or the system's preference                          | the scheme: `light`, `dark`, `high-contrast`, `system`          | `data-slotted-scheme`, or the scheme of {{themeScope}}                                                       |
| How tight controls and rows are                                                 | the density: `comfortable`, `compact`, `dense`                  | `data-slotted-density`, or the density of {{themeScope}}                                                     |
| How round corners are, chosen by the reader                                     | the corners: `square`, `soft`, `standard`, `round`              | `data-slotted-corners`, or the corners of {{themeScope}}; the theme's `corners` holds each radius scale      |
| How deep a scheme's grounds sit, or how far each layer steps from the one below | the recipe: one derivation per token per scheme                 | the theme's `recipe`, spread from the base theme's, as below; `themeConformance` still checks every contrast |
| A recipe derivation chosen by the reader: an OLED black page, a stronger border | a variant: an axis, its values, a partial recipe per scheme     | the theme's `variants`; `data-slotted-variant-<axis>` set to the value; `themeConformance` checks each value |
| Spacing, corners, type, lines, shadows or motion                                | a token of a group in `{{docsDir}}/tokens.md`                   | the theme's `base`; `schemes` for a value per scheme; `densities` per density                                |
| One family's look                                                               | a token the family's page lists under Tokens                    | the theme's `components`                                                                                     |
| What no token reaches                                                           | a theme rule                                                    | the theme's `rules`                                                                                          |

Every colour token derives from the six seeds within contrast bounds, so a
new seed keeps the ratios of every scheme. A colour of the `tone`, `surface`,
`text` or `border` groups is changed through its seed, or through its
derivation in the recipe, never declared by hand.

A recipe change keeps every other derivation of the base theme: the theme's
`recipe` spreads the base theme's recipe, spreads from it the scheme it
changes, and replaces one token's derivation — its seed, its lightness and its
chroma's scale and ceiling, the shape every derivation of the standard recipe
has.

## 2. One theme for the product

1. Build it with `extendTheme` on the theme of `@slotted/themes/default`: a
   name of its own, and only what changes — `seeds`, then `base`, `schemes`
   and `densities`, then `components`, then `rules`. A face the product brings
   goes in `fonts`, and the `font-family` group names it; headings read
   `--slotted-font-family-heading`.
2. Compile it with `slotted-build-theme`, load the stylesheet it writes in
   place of `@slotted/themes/default.css`, and set the theme's name in
   `data-slotted-theme` and the scheme in `data-slotted-scheme` on the root
   element.
3. A theme chosen at runtime is applied with `applyTheme`, in a module the
   application loads on demand: `@slotted/theme` carries the whole token
   contract and its validator.
4. In a test of the theme, `themeConformance` from `@slotted/theme/conformance`
   checks the structure, the contrast of every scheme and the glyphs, under
   Node's test runner. It takes the `contract`, the theme passed through
   `flattenTheme`, and the compiled stylesheet.

## 3. One region

1. A scheme, a density or corners for a subtree: {{themeScope}}, which carries
   them to an overlay opened inside it, or the `data-slotted-scheme`,
   `data-slotted-density` and `data-slotted-corners` attributes on the
   subtree's root. A variant of the theme is the
   `data-slotted-variant-<axis>` attribute on the subtree's root or on an
   ancestor of the scheme's root.
2. A seed for a subtree: the seed property on an element that also carries
   `data-slotted-seeds`, or the seeds of {{themeScope}}. Every colour under it
   derives again from that seed.
3. A colour the reader picks at runtime: write the seed property on the element
   that carries `data-slotted-theme`, with `seedStyle` from
   `@slotted/theme/seeds`, which leaves the token contract out of the bundle.
4. A bar of the application's own that floats over scrolling content — a phone
   tab bar, a sticky banner — is a material: its background reads
   `--slotted-surface-material` and its backdrop filter reads
   `--slotted-material-backdrop`. The theme makes both opaque under reduced
   transparency and forced colours. A page header becomes that material once
   content passes under it with its `material` input, set on the header or on
   its defaults. A theme draws the command palette as one by setting
   `--slotted-command-palette-surface` to the material surface and
   `--slotted-command-palette-backdrop-filter` to the material backdrop, and a
   raised toast with `--slotted-toast-surface` and
   `--slotted-toast-backdrop-filter`. The bars at the bottom edge take
   `--slotted-page-footer-background` with
   `--slotted-page-footer-backdrop-filter`, and
   `--slotted-detail-panel-footer-background` with
   `--slotted-detail-panel-footer-backdrop-filter`, and a drawer's footer
   `--slotted-drawer-footer-surface` with
   `--slotted-drawer-footer-backdrop-filter`, and a bottom sheet's sticky
   header and resizer, once content scrolls under them,
   `--slotted-drawer-header-surface` with
   `--slotted-drawer-header-backdrop-filter`, and a dialog's panel
   `--slotted-dialog-surface` with `--slotted-dialog-backdrop-filter`. The
   chart's tooltip, menu and help read one filter,
   `--slotted-chart-overlay-backdrop-filter`. A chart's table view takes
   `--slotted-chart-table-surface` and its sticky header
   `--slotted-chart-table-header-surface`; `--slotted-chart-surface` stays
   opaque, because the series colours mix with it.

## 4. Restyle a control

1. A token every control reads, in `base`, `schemes` or `densities`.
2. Else a token of the family, in `components`; it falls back to the control
   token.
3. Else a theme rule. It lives in `slotted.theme-rules`, selects only
   `data-ui`, `data-part`, the attributes a family writes and the theme's
   attributes, and reads only tokens; the compiler names the file, the line
   and the selector of a rule it refuses. A rule for one scheme begins with
   the nesting selector, which names the theme root that carries the scheme.
   The same selector without it asks for a descendant of the root and is
   refused:

   ```css
   &[data-slotted-scheme='dark'] [data-ui='card'] {
     /* accepted */
   }
   [data-slotted-scheme='dark'] [data-ui='card'] {
     /* refused */
   }
   ```

## 5. Done

1. The application's own CSS declares no token of the `tone`, `surface`,
   `text` or `border` groups, and sets no colour, border, radius, padding or
   type on a family's `data-ui` or `data-part`.
2. `themeConformance` passes for the theme.
