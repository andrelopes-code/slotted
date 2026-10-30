import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'lightningcss';
import { describe, expect, it } from 'vitest';

import { defineTheme, type Theme, type ThemeDefinition } from './define';
import { LAYER_ORDER_STATEMENT } from './layer-order';
import { recipes } from './recipes';
import { renderTheme } from './render';

// jsdom's `URL` (the test environment's global) rejects a `file:` base, so this
// resolves the path with `node:path` rather than `new URL(..., import.meta.url)`.
const values = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../themes/src/default/values.json'), 'utf8'),
) as Omit<ThemeDefinition, 'name' | 'seeds' | 'recipe'>;

const theme = defineTheme({
  ...values,
  name: 'test',
  seeds: {
    accent: '#1d4ed8',
    neutral: '#64748b',
    success: '#15803d',
    info: 'oklch(0.6 0.15 255)',
    warning: '#facc15',
    danger: '#dc2626',
  },
  recipe: recipes.standard,
  components: { '--slotted-card-radius': '0px' },
  fonts: [
    { family: 'Inter Variable', src: "url('/inter.woff2') format('woff2')", weight: '100 900' },
  ],
  rules: [`@keyframes glow { to { opacity: 1; } } [data-ui='card'] { animation: glow 1s; }`],
});
const css = renderTheme(theme);

describe('renderTheme', () => {
  it('opens with the layer order and registers every seed as a colour', () => {
    expect(css.startsWith(LAYER_ORDER_STATEMENT)).toBe(true);
    for (const seed of ['accent', 'neutral', 'success', 'warning', 'danger']) {
      expect(css).toContain(
        `@property --slotted-seed-${seed} {\n  syntax: '<color>';\n  inherits: true;\n  initial-value: gray;\n}`,
      );
    }
  });

  it('declares the seeds and the component tokens on the theme', () => {
    expect(css).toMatch(/\[data-slotted-theme="test"\] \{\n {4}--slotted-seed-accent: #1d4ed8;/);
    expect(css).toContain('    --slotted-card-radius: 0px;');
  });

  it('scopes each scheme to its nearest root and re-derives under data-slotted-seeds', () => {
    expect(css).toContain(
      '@scope ([data-slotted-theme="test"][data-slotted-scheme="dark"], [data-slotted-theme="test"] [data-slotted-scheme="dark"], [data-slotted-scheme="dark"] [data-slotted-theme="test"]:not([data-slotted-scheme])) to ([data-slotted-scheme], [data-slotted-theme]) {\n    :scope,\n    [data-slotted-seeds] {\n      color-scheme: dark;',
    );
    expect(css).toContain(
      '--slotted-tone-accent-solid: oklch(from oklab(from oklch(from oklch(from var(--slotted-seed-accent)',
    );
  });

  /*
   * A theme root under a scheme takes that scheme only when it names none of
   * its own: a light panel in a dark page, written theme and scheme on one
   * element, matched the dark scope's third form as well as its own, and the
   * scope written later in the file won.
   */
  it('roots a scheme on a theme element below it only when the element names no scheme', () => {
    for (const scheme of ['light', 'dark', 'high-contrast', 'system']) {
      expect(css).toContain(
        `[data-slotted-scheme="${scheme}"] [data-slotted-theme="test"]:not([data-slotted-scheme])) to`,
      );
      expect(css).not.toContain(
        `[data-slotted-scheme="${scheme}"] [data-slotted-theme="test"]) to`,
      );
    }
  });

  /*
   * Firefox (Stylo, 146–155) lets two siblings share one computed style when
   * they differ only in the root selector of an @scope: a dark sibling took
   * the light values. A rule outside every @scope whose rightmost compound
   * names each scheme makes the attribute a selector the style cache checks.
   */
  it('names every scheme outside any @scope, with a declaration a minifier keeps', () => {
    const anchor =
      '  [data-slotted-scheme="light"],\n  [data-slotted-scheme="dark"],\n  [data-slotted-scheme="high-contrast"],\n  [data-slotted-scheme="system"] {\n    --_slotted-scheme-anchor: initial;\n  }';
    const layer = css.indexOf('@layer slotted.theme {');
    const at = css.indexOf(anchor);
    expect(at).toBeGreaterThan(layer);
    expect(at).toBeLessThan(css.indexOf('@scope'));
    const { code } = transform({ filename: 'test.css', code: Buffer.from(css), minify: true });
    expect(code.toString()).toContain(
      '[data-slotted-scheme=light],[data-slotted-scheme=dark],[data-slotted-scheme=high-contrast],[data-slotted-scheme=system]{--_slotted-scheme-anchor:initial}',
    );
  });

  it('follows the operating system under the system scheme', () => {
    const system = css.indexOf('[data-slotted-theme="test"][data-slotted-scheme="system"]');
    const query = css.indexOf('@media (prefers-color-scheme: dark)');
    expect(system).toBeGreaterThan(-1);
    expect(query).toBeGreaterThan(system);
    expect(css.slice(query, query + 600)).toContain('color-scheme: dark;');
  });

  it('emits fonts, hoisted keyframes and scoped rules after the theme layer', () => {
    expect(css).toContain(
      "@font-face {\n  font-family: \"Inter Variable\";\n  src: url('/inter.woff2') format('woff2');\n  font-weight: 100 900;",
    );
    const layerEnd = css.indexOf('@keyframes slotted-test-glow');
    expect(layerEnd).toBeGreaterThan(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(css).toContain(
      '@layer slotted.theme-rules {\n  @scope ([data-slotted-theme="test"]) to ([data-slotted-theme]:not([data-slotted-theme="test"])) {\n    [data-ui=\'card\'] { animation: slotted-test-glow 1s; }\n  }\n}',
    );
  });

  it('refuses a rule that is still a URL', () => {
    const unbuilt = defineTheme({ ...theme, name: 'unbuilt', rules: [new URL('file:///x.css')] });
    expect(() => renderTheme(unbuilt)).toThrow('unbuilt: a rule is still a URL (file:///x.css)');
  });

  it('refuses a rule whose unbalanced brace would escape the @scope it is compiled into', () => {
    const malformed = {
      ...theme,
      name: 'malformed',
      rules: ["[data-ui='card'] { color: red; } } [data-ui='button'] { color: blue; }"],
    };
    expect(() => defineTheme(malformed)).toThrow(/rules\[0\]: theme rule has an unbalanced `\}`/);
    expect(() => renderTheme(malformed as Theme)).toThrow(/unbalanced `\}`/);
  });

  it('keeps a rule whose comment hides a structural character, and still scopes it', () => {
    const commented = defineTheme({
      ...theme,
      name: 'commented',
      rules: [`[data-ui='card'] { color: red; /* ; */ }`],
    });
    const css = renderTheme(commented);
    expect(css).toContain(
      '@layer slotted.theme-rules {\n  @scope ([data-slotted-theme="commented"]) to ([data-slotted-theme]:not([data-slotted-theme="commented"])) {\n    [data-ui=\'card\'] { color: red; /* ; */ }\n  }\n}',
    );
  });
});

/**
 * `renderTheme` takes any object typed `Theme`, and a theme read back from
 * storage or a network response is such an object without ever passing
 * through `defineTheme`. Its name lands in selectors and every value in
 * declarations, so the render refuses what `defineTheme` would refuse.
 */
describe('renderTheme on a theme that did not come from defineTheme', () => {
  const forged = (overrides: Record<string, unknown>) => ({ ...theme, ...overrides }) as Theme;

  it('refuses a rule that selects what no family renders on purpose', () => {
    expect(() =>
      renderTheme(forged({ rules: ["[data-ui='text-field'] input { border: 0; }"] })),
    ).toThrow(
      "rules[0]:1 [data-ui='text-field'] input: input: an element type is not a public selector",
    );
  });

  it('refuses the at-rules the compiler writes, at any depth, with the line and the at-rule', () => {
    for (const [rule, message] of [
      ['@import url(x.css);', 'rules[0]:1 @import url(x.css): @import is written by the compiler'],
      ['@layer x { }', 'rules[0]:1 @layer x: @layer is written by the compiler'],
      [
        "[data-ui='card'] {\n  @scope (select) { & { color: red; } }\n}",
        'rules[0]:2 @scope (select): @scope is written by the compiler',
      ],
    ]) {
      expect(() => renderTheme(forged({ rules: [rule] })), rule).toThrow(message);
    }
  });

  it('refuses a name a selector cannot carry', () => {
    expect(() => renderTheme(forged({ name: 'x"], * { color: red } [x="' }))).toThrow(
      /is not \[a-z\]\[a-z0-9-\]\*/,
    );
  });

  it('refuses a value, a seed, a font field and a recipe derivation that could close their rule', () => {
    const [token] = Object.keys(recipes.standard.light);
    for (const overrides of [
      { components: { '--slotted-card-radius': '0; } * { color: red' } },
      { base: { ...theme.base, '--slotted-space-1': '0; } * { color: red' } },
      { seeds: { ...theme.seeds, accent: '#fff; } * { color: red' } },
      { fonts: [{ family: { toString: () => '}' }, src: 'url(a.woff2)' }] },
      {
        recipe: {
          ...recipes.standard,
          light: { ...recipes.standard.light, [token!]: { alias: '--a); } * { color: red' } },
        },
      },
    ]) {
      expect(() => renderTheme(forged(overrides)), JSON.stringify(overrides)).toThrow(
        /^Invalid theme test:/,
      );
    }
  });
});

/**
 * A server renders the theme into an inline `<style>`, whose text the HTML
 * parser ends at the first `</style`, inside a CSS string or not.
 */
describe('renderTheme inlined in an HTML <style>', () => {
  const hostile = defineTheme({
    ...theme,
    name: 'hostile',
    fonts: [{ family: '</style><b>', src: 'url("</style><script>alert(1)</script>.woff2")' }],
    rules: [`[data-ui='card']::before { content: "</style>"; }`],
  });
  const html = renderTheme(hostile);

  it('never writes `</` and keeps every `<` it escapes', () => {
    expect(html).not.toContain('</');
    expect(html).toContain('src: url("\\3c /style><script>alert(1)\\3c /script>.woff2");');
    expect(html).toContain('font-family: "\\3c /style><b>";');
    expect(html).toContain(`content: "\\3c /style>";`);
  });

  it('stays one style element with no element after it', () => {
    const parsed = new DOMParser().parseFromString(
      `<!doctype html><html><head><style>${html}</style></head><body></body></html>`,
      'text/html',
    );
    expect(parsed.querySelectorAll('style')).toHaveLength(1);
    expect(parsed.querySelector('script, b')).toBeNull();
    expect(parsed.querySelector('style')!.textContent).toBe(html);
  });
});

/*
 * The material's filter reads well in a dark scheme and leaves a flat grey on
 * a light page, so each scheme states its own, as it states the material's
 * surface. Reduced transparency resets it in every scope, later in source than
 * the scheme that set it.
 */
describe('the material backdrop', () => {
  const { ['--slotted-material-backdrop']: _base, ...base } = (values.base ?? {}) as Record<
    string,
    string
  >;
  const schemes = Object.fromEntries(
    Object.entries(values.schemes ?? {}).map(([scheme, tokens]) => [
      scheme,
      { ...tokens, '--slotted-material-backdrop': scheme === 'light' ? 'blur(6px)' : 'blur(20px)' },
    ]),
  );
  const material = () =>
    renderTheme(
      defineTheme({
        ...values,
        base,
        schemes,
        name: 'material',
        seeds: theme.seeds,
        recipe: recipes.standard,
      } as ThemeDefinition),
    );

  it('is declared in the scope of the scheme that states it', () => {
    const output = material();
    const light = output.indexOf('[data-slotted-scheme="light"]');
    const declared = output.indexOf('--slotted-material-backdrop: blur(6px);', light);
    expect(light).toBeGreaterThan(-1);
    expect(declared).toBeGreaterThan(light);
  });

  it('resolves to none under reduced transparency, after every scheme value', () => {
    const output = material();
    const reduced = output.indexOf('@media (prefers-reduced-transparency: reduce)');
    expect(reduced).toBeGreaterThan(output.lastIndexOf('--slotted-material-backdrop: blur('));
    const block = output.slice(reduced, output.indexOf('@media (forced-colors: active)', reduced));
    expect(block.match(/--slotted-material-backdrop: none;/g)?.length).toBe(5);
  });
});

/**
 * An application lets the reader choose how round the corners are, as it
 * chooses density: a scope per corner, each a partial radius scale, and the
 * theme's own tokens that read the scale declared again inside it.
 */
describe('corners', () => {
  const scope = (corner: string) =>
    new RegExp(
      `\\[data-slotted-theme="test"\\]\\[data-slotted-corners="${corner}"\\],\\n\\s*\\[data-slotted-theme="test"\\] \\[data-slotted-corners="${corner}"\\] \\{([^}]*)\\}`,
    ).exec(css)?.[1];

  it('writes a scope per corner the theme gives, and the standard one from the base scale', () => {
    expect(scope('round')).toContain('--slotted-radius-lg: 16px;');
    expect(scope('square')).toContain('--slotted-radius-lg: 0px;');
    expect(scope('standard')).toContain('--slotted-radius-lg: 8px;');
    expect(scope('standard')).toContain('--slotted-radius-xs: 2px;');
  });

  it('declares again what reads the scale, so it follows inside the scope', () => {
    expect(scope('round')).toContain('--slotted-control-radius: var(--slotted-radius-sm);');
  });

  it('never writes the full radius', () => {
    for (const corner of ['square', 'soft', 'standard', 'round'])
      expect(scope(corner)).not.toContain('--slotted-radius-full');
  });

  it('refuses a corner that writes anything but a step of the scale', () => {
    const define = (corners: unknown) =>
      defineTheme({
        ...values,
        name: 'bad',
        seeds: theme.seeds,
        recipe: recipes.standard,
        corners: corners as never,
      });
    expect(() => define({ round: { '--slotted-radius-full': '4px' } })).toThrow(
      /corners round writes --slotted-radius-full, which is not a step of the radius scale/,
    );
    expect(() => define({ pointy: {} })).toThrow(/corners contains pointy/);
    expect(() => define({ round: { '--slotted-radius-lg': '4px; color: red' } })).toThrow(
      /corners round --slotted-radius-lg/,
    );
  });
});

describe('variants', () => {
  const OLED = {
    depth: {
      oled: {
        light: { '--slotted-surface': { seed: 'neutral', l: 1, c: { scale: 0, max: 0 } } },
        dark: { '--slotted-surface': { seed: 'neutral', l: 0, c: { scale: 0.22, max: 0.08 } } },
      },
    },
  } as const;
  const variantCss = renderTheme(defineTheme({ ...theme, variants: OLED } as ThemeDefinition));
  const scope = (scheme: string) =>
    `@scope ([data-slotted-theme="test"][data-slotted-scheme="${scheme}"], [data-slotted-theme="test"] [data-slotted-scheme="${scheme}"], [data-slotted-scheme="${scheme}"] [data-slotted-theme="test"]:not([data-slotted-scheme])) to ([data-slotted-scheme], [data-slotted-theme]) {`;
  const v = '[data-slotted-variant-depth="oled"]';
  const targets = `:scope:where(${v}, ${v} *),\n    :where(${v}),\n    [data-slotted-seeds]:where(${v}, ${v} *) {`;
  const variantBody = (scheme: string) => {
    const start = variantCss.indexOf(`${scope(scheme)}\n    ${targets}`);
    return start === -1 ? undefined : variantCss.slice(start, variantCss.indexOf('}', start));
  };

  it('writes each scheme a value changes under the attribute, after the scheme blocks', () => {
    const dark = variantBody('dark');

    expect(dark).toContain('--slotted-surface: oklch(from var(--slotted-seed-neutral) 0 ');
    expect(variantCss.indexOf(`${scope('dark')}\n    ${targets}`)).toBeGreaterThan(
      variantCss.indexOf('@media (prefers-color-scheme: dark)'),
    );
    expect(variantBody('high-contrast')).toBeUndefined();
  });

  it('declares again every scheme value that reads a token the variant derives', () => {
    const dependents = Object.entries(theme.recipe.dark)
      .filter(([, rule]) => 'alias' in rule && rule.alias === '--slotted-surface')
      .map(([name]) => name);

    expect(dependents.length).toBeGreaterThan(0);
    for (const name of dependents)
      expect(variantBody('dark')).toContain(`${name}: var(--slotted-surface);`);
    expect(variantBody('dark')).not.toContain('--slotted-text:');
  });

  it('follows the system scheme, each under the scheme the system reports', () => {
    expect(variantCss).toContain(
      `@media (prefers-color-scheme: light) {\n    ${scope('system')}\n      ${targets.replaceAll('\n    ', '\n      ')}`,
    );
    expect(variantCss).toContain(
      `@media (prefers-color-scheme: dark) {\n    ${scope('system')}\n      ${targets.replaceAll('\n    ', '\n      ')}`,
    );
  });

  it('declares every scheme, reduced transparency and forced colours again on an element naming an axis', () => {
    const reroot = ':scope,\n    [data-slotted-seeds],\n    :where([data-slotted-variant-depth]) {';
    expect(variantCss).toContain(`${scope('dark')}\n    ${reroot}\n      color-scheme: dark;`);
    const forced = variantCss.slice(variantCss.indexOf('@media (forced-colors: active)'));
    expect(forced).toContain(`:where([data-slotted-variant-depth]) {`);
    expect(css).not.toContain('data-slotted-variant');
  });
});
