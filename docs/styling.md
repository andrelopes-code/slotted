# Styling and the cascade

Every rule the library ships lives inside the `slotted` cascade layer. Nothing
is written outside it, and no rule uses `!important`.

## The one line an application writes

`slotted` is the only top-level layer. Its sublayers are an implementation
detail. An application that keeps its own CSS in layers declares the order
once, before importing anything:

```css
@layer slotted, app;
```

With Tailwind CSS v4, name Tailwind's layers in the same statement:

```css
@layer slotted, theme, base, components, utilities;
```

Unlayered CSS beats every layer, so an application that writes no layers of
its own needs no declaration: its rules already win.

A layer takes its position from the first mention of its name. The statement
therefore has to come before the first stylesheet that mentions `slotted`,
which is why it belongs at the top of the application's own entry CSS.

## The order the library publishes

```css
@layer slotted.reset, slotted.tokens, slotted.theme, slotted.components, slotted.theme-rules;
```

| Sublayer      | Written by        | Content                                    |
| ------------- | ----------------- | ------------------------------------------ |
| `reset`       | —                 | reserved, empty                            |
| `tokens`      | —                 | reserved, empty                            |
| `theme`       | `@slotted/themes` | token values per theme, scheme and density |
| `components`  | `@slotted/styles` | every family stylesheet                    |
| `theme-rules` | a theme           | the theme's own CSS rules, scoped to it    |

`reset` and `tokens` carry no rule today. They are declared because a name
inserted later would reorder what already shipped.

The statement opens every distributed stylesheet — `@slotted/theme/styles.css`,
`@slotted/themes/default.css`, `@slotted/react/styles.css` and each
`@slotted/react/<family>/styles.css` — so whichever loads first establishes
the internal order. Restating it is inert: the order
is fixed at the first mention.

The library publishes no override layer. A layer named by the library is a
layer whose position the library controls and can change; application rules
belong in application layers.

## Overriding a rule

Reach for a token first. A family reads its values from the theme, so setting
a token on a scope changes every family under it:

```css
.dense-panel {
  --slotted-space-4: 0.375rem;
}
```

When a declaration has to be replaced rather than retuned, write it in an
application layer or unlayered. Specificity is compared only inside a layer,
so a single class defeats any library selector:

```css
@layer app {
  .checkout [data-ui='button'] {
    border-radius: 0;
  }
}
```

To drop a library declaration and fall back to what the browser or an earlier
layer defines, use `revert-layer`:

```css
@layer app {
  .slotted-card {
    box-shadow: revert-layer;
  }
}
```

## Selector keys

Every element that carries `data-part="cell"` also carries `data-part-cell`,
and every element that carries `data-ui="data-grid"` also carries
`data-ui-data-grid`. The library's stylesheet matches the key, not the value.
Blink and WebKit file an attribute selector under the attribute's name, so a
rule keyed on `[data-part='cell']` is tested against every element that
carries `data-part`; a rule keyed on `[data-part-cell]` is tested against the
cells only. A full style recalculation of an application shell holding a data
grid of 50 rows measured 357 to 470 ms with value selectors, and 29 ms above
the bare document with keys (1 499 elements, Chromium headless,
`packages/react/src/styles.perf.browser.test.tsx`).

`data-part` and `data-ui` stay the public hooks a test or an application
selects by. An application rule keyed on them still matches; it costs one test
per element that carries the attribute.

An element an application renders into a family's anatomy, through a `render`
callback or a slot that asks for a part, carries the key beside the value:

```tsx
import { selectorKeyProps } from '@slotted/core/selector-key';

<span data-part="option-duration" {...selectorKeyProps('part', 'option-duration')}>
  {duration}
</span>;
```

The key is the value in lower case after `data-part-` or `data-ui-`. The
parts of `prose` that its content writes — `lead`, `exclude` and `footnotes` —
are the exception: the stylesheet keys them on the value, so content from a
CMS needs no key.

## Themes

A theme is a module, not a value file. `defineTheme` (`@slotted/theme`) takes
seeds, a recipe, token values, component tokens, fonts and CSS rules;
`extendTheme` builds one theme on another. `slotted-build-theme` compiles a
theme module to CSS at build time; `applyTheme` compiles and applies one at
runtime.
`applyTheme` adopts a constructed stylesheet, which a `style-src` policy
without `'unsafe-inline'` does not refuse. A document without constructed
stylesheets receives a `<style>` element, which carries the `nonce` option.

Extending the shipped theme for one new accent:

```js
import { extendTheme } from '@slotted/theme';
import defaultTheme from '@slotted/themes/default';

export default extendTheme(defaultTheme, { seeds: { accent: '#e11d48' } }, { name: 'rose' });
```

Every heading and title reads `--slotted-font-family-heading`, so a theme gives
headings their own face by declaring that one token
(`docs/token-foundation.md` › Font family).

A theme stylesheet declares the seeds on the element that names the theme
(`data-slotted-theme`), and derives every colour token where a theme and a
scheme are named. A seed set inline on that element recolours every token
derived from it, with no build:

```js
document
  .querySelector('[data-slotted-theme]')
  .style.setProperty('--slotted-seed-accent', '#e11d48');
```

A seed set on an ancestor of that element is redeclared by the theme. On any
element inside it, a seed recolours the subtree when the element also carries
`data-slotted-seeds`, which derives every colour again from the seeds that
element sees:

```html
<section data-slotted-seeds style="--slotted-seed-accent: #e11d48">…</section>
```

`ThemeScope` (`@slotted/react/theme`) and the `slThemeScope` directive
(`@slotted/angular/theme`) write the same attributes on one element: `theme`,
`scheme`, `density` and `corners` become `data-slotted-theme`,
`data-slotted-scheme`, `data-slotted-density` and `data-slotted-corners`, and
`seeds` becomes the seed custom properties plus
`data-slotted-seeds`. An overlay opened inside the element carries all of them
to the end of the body.

```tsx
<ThemeScope scheme="dark" seeds={{ accent: '#e11d48' }}>
  …
</ThemeScope>
```

```html
<section slThemeScope scheme="dark" [seeds]="{ accent: '#e11d48' }">…</section>
```

`scheme="system"` resolves to `light`, and to `dark` while
`prefers-color-scheme: dark` matches.

`@slotted/theme/seeds` exports `SEED_NAMES` and `seedStyle` without the token
contract, the validator and the renderer (3 kB against 177 kB for
`@slotted/theme`). An application that writes a reader's seeds at start
imports them from there, and `ThemeScope` and `slThemeScope` do the same; a
bundler cannot drop the rest of `@slotted/theme` from a module the application
shares with a theme it compiles later.

A theme rule is CSS passed in `rules`, as a string or the URL of a `.css` file
the build reads:

```js
export default extendTheme(
  defaultTheme,
  { rules: [new URL('./rules.css', import.meta.url)] },
  {
    name: 'rose',
  },
);
```

```css
/* rules.css */
[data-ui='button'][data-variant='solid'] {
  border-radius: var(--slotted-radius-none);
}
```

A theme rule lives in `slotted.theme-rules` and may select only `data-ui`,
`data-part` and the public attributes, reading only tokens. An application
rule stays outside `slotted`, in its own layer or unlayered.

### Restyling a control

A theme restyles a control at three levels, each one reaching less than the
one before it:

1. Control tokens (`base`, `schemes`): every control reads them.
2. Family tokens (`components`): one family reads them, falling back to the
   control tokens.
3. Theme rules (`rules`): what no token reaches.

A text field drawn as an underline:

```js
export default extendTheme(
  defaultTheme,
  {
    components: {
      '--slotted-text-field-radius': 'var(--slotted-radius-none)',
      '--slotted-text-field-background': 'transparent',
      '--slotted-text-field-border-color': 'var(--slotted-border-strong)',
      '--slotted-text-field-invalid-border-color': 'var(--slotted-tone-danger-border)',
    },
    rules: [new URL('./rules.css', import.meta.url)],
  },
  { name: 'ruled' },
);
```

```css
/* rules.css */
[data-ui='text-field'][data-part='root']:not([data-variant='plain']) {
  border-width: 0 0 var(--slotted-control-border-width);
}

[data-ui='text-field'][data-part='root']:has(> [data-part='input']:focus-visible) {
  border-block-end-color: var(--slotted-focus-ring-color);
  box-shadow: inset 0 calc(-1 * var(--slotted-border-width-thick)) 0 var(--slotted-focus-ring-color);
  outline: var(--slotted-border-width-thick) solid transparent;
}

[data-ui='text-field'][data-part='root'][data-invalid] {
  background-color: var(--slotted-tone-danger-surface);
  box-shadow: inset 0 calc(-1 * var(--slotted-control-invalid-edge-width)) 0
    var(--slotted-text-field-invalid-border-color);
}

[data-ui='text-field'][data-part='root'][data-invalid]:has(> [data-part='input']:focus-visible) {
  box-shadow: inset 0
    calc(-1 * (var(--slotted-border-width-thick) + var(--slotted-control-invalid-edge-width))) 0
    var(--slotted-focus-ring-color);
}
```

The family points `--slotted-focus-ring-color` at the invalid colour on an
invalid root, so the focus rule above draws an invalid field's underline in
that colour without a rule of its own. The family draws an invalid frame with
an inset edge of `--slotted-control-invalid-edge-width` on all four sides; the
two invalid rules move that edge to the bottom alone, at rest and under focus,
so an invalid line stays thicker than a valid one where the two share a colour,
as they do in `high-contrast`. The transparent outline paints
nothing until forced colours replace its colour with a system colour; there
the box shadow is dropped and the line takes a system colour, so the outline
is the only mark of focus.

A theme rule selects by these hooks:

- `[data-ui]` naming a family, and `[data-part]` naming a part of the family
  named in the same compound selector, each with `=` or with no value;
- a `data-*` attribute a family writes to the DOM, spelled as it is written
  there (`data-toggle-placement`), from the hook index
  `packages/theme/src/generated/hooks.json`;
- the theme axes: `data-slotted-theme`, `data-slotted-scheme`,
  `data-slotted-density`, `data-slotted-corners` and `data-slotted-seeds`;
- `&`, inside a style rule;
- `&` outside a style rule, which is the theme's root, as the first compound
  of a selector that goes on to a hook, carrying only `data-slotted-scheme`,
  `data-slotted-density`, `data-slotted-corners` or `data-slotted-seeds`:
  `&[data-slotted-scheme='high-contrast'] [data-ui='text-field']`. The root
  holds the theme's own scheme, and `[data-slotted-scheme='high-contrast'] …`
  asks for a descendant of the root, so only this form reaches a theme's own
  scheme on `html`.

Attribute names match without regard to case, as in HTML: `[DATA-UI='card']`
is `[data-ui='card']`.

Pseudo-classes, pseudo-elements and combinators refine a hook. Each compound
selector carries a hook; `[data-ui='card'] :first-child` is refused, because
`:first-child` alone matches elements no family owns. `:is()` and `:where()`
without a hook of their own carry one in every argument. The arguments of
`:not()`, `:has()` and `:nth-child(… of …)` filter an element already
selected, so they need no hook, and follow every other rule here.

Refused: a class, an id, an element type (`input`, `html`, `body`), `*`,
`:root`, `:scope`, `:host`, `:host-context()`, any other `&` outside a style
rule (there it is the theme's root, as `:scope` is), an attribute outside `data-*`
(`aria-*`, `role`), and `^=`, `$=`, `*=`, `~=` or `|=` on `data-ui` or
`data-part`, which match more than one family or part. `@scope`, `@import`
and `@layer` are refused at any depth, because the compiler writes them
around the rules. A prelude that starts with `--` is a custom property only
inside a style rule; anywhere else it is checked as a selector.

A declaration reads `var()` of a contract token, a component token or a seed;
`var(--_*)` and any other `--slotted-*` are refused, and so is a `style()`
query over them, in a value (`if(style(--_x: …))`) or in `@container`. A
declaration that writes a private property (`--_*`) is refused, and so is a
declaration outside a style rule, which inside the compiled `@scope` would
apply to the theme's root. `@property` is hoisted out of the scope and holds
for the whole page, so it may register only a property of the theme's own: a
private property or a `--slotted-*` name is refused. Escapes are decoded
before any of these checks: `var(--\5f x)` and `v\61r(--_x)` read `--_x`.

`slotted-build-theme` checks every rule and names the file, the line and the
selector (`rules.css:4 [data-ui='text-field'] input: input: an element type is
not a public selector`). `defineTheme`, `extendTheme`, `renderTheme` and
`applyTheme` check every rule given as text with the same check and name the
rule by its index (`rules[0]:4 …`).

## Angular

Angular components inline their stylesheet and render it with
`ViewEncapsulation.None`, so the CSS is injected into the document when a
component first renders — after the application's own stylesheets. The layer
order still holds, because `@slotted/themes/default.css` is a required
import and carries the statement.
