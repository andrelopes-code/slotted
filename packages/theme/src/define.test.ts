import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { defineTheme, extendTheme, flattenTheme, type ThemeDefinition } from './define';
import { recipes } from './recipes';

// jsdom's `URL` (the test environment's global) rejects a `file:` base, so this
// resolves the path with `node:path` rather than `new URL(..., import.meta.url)`.
const values = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../themes/src/default/values.json'), 'utf8'),
) as Omit<ThemeDefinition, 'name' | 'seeds' | 'recipe'>;

const SEEDS = {
  accent: '#1d4ed8',
  neutral: '#64748b',
  success: '#15803d',
  info: 'oklch(0.6 0.15 255)',
  warning: '#facc15',
  danger: '#dc2626',
};

const definition = (overrides: Partial<ThemeDefinition> = {}): ThemeDefinition => ({
  ...values,
  name: 'test',
  seeds: SEEDS,
  recipe: recipes.standard,
  ...overrides,
});

describe('defineTheme', () => {
  it('returns a frozen theme', () => {
    const theme = defineTheme(definition());
    expect(theme.kind).toBe('slotted-theme');
    expect(Object.isFrozen(theme)).toBe(true);
    expect(Object.isFrozen(theme.seeds)).toBe(true);
  });

  it('refuses a name a selector cannot carry', () => {
    for (const name of ['my theme', 'a"b', 'Default', '1st', '']) {
      expect(() => defineTheme(definition({ name })), name).toThrow(/is not \[a-z\]\[a-z0-9-\]\*/);
    }
  });

  it('refuses a seed in another notation', () => {
    expect(() => defineTheme(definition({ seeds: { ...SEEDS, accent: 'red' } }))).toThrow(
      'seed accent "red" is neither #rrggbb nor oklch(L C H)',
    );
  });

  it('accepts a component token a family reads and refuses one no family reads', () => {
    expect(() =>
      defineTheme(definition({ components: { '--slotted-text-field-radius': '0px' } })),
    ).not.toThrow();
    expect(() =>
      defineTheme(
        definition({
          components: { '--slotted-nope-radius': '0px' } as NonNullable<
            ThemeDefinition['components']
          >,
        }),
      ),
    ).toThrow('components contains --slotted-nope-radius, which no family reads');
  });

  /**
   * A heading face is a typeface of the theme's own choosing, which neither
   * primitive face names: the contract records that reason, so a stack is
   * accepted there and still refused on a semantic token that records none.
   */
  it('accepts a heading face stated as a stack of its own', () => {
    const base = values.base as Record<string, string>;
    expect(() =>
      defineTheme(
        definition({
          base: { ...base, '--slotted-font-family-heading': "ui-serif, Georgia, 'Times', serif" },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      defineTheme(definition({ base: { ...base, '--slotted-control-font-family': 'serif' } })),
    ).toThrow('base --slotted-control-font-family states a literal without declaring why');
  });

  it('reports a contract token the theme leaves out', () => {
    const { ['--slotted-space-1']: _dropped, ...base } = values.base as Record<string, string>;
    expect(() => defineTheme(definition({ base }))).toThrow('base is missing --slotted-space-1');
  });

  it('refuses a component value that could close the rule it is written into', () => {
    expect(() =>
      defineTheme(
        definition({
          components: { '--slotted-card-radius': '0px; } .evil { color: red' },
        }),
      ),
    ).toThrow(
      'components --slotted-card-radius is "0px; } .evil { color: red", which contains an unquoted ;, { or }',
    );
  });

  it('refuses a font field that could close the rule it is written into, and keeps a legitimate one', () => {
    expect(() =>
      defineTheme(definition({ fonts: [{ family: 'X', src: 'url(a); } .evil { color: red' }] })),
    ).toThrow(
      'fonts[0].src is "url(a); } .evil { color: red", which contains an unquoted ;, { or }',
    );
    expect(() =>
      defineTheme(
        definition({
          fonts: [{ family: 'X', src: 'url("a;b.woff2") format("woff2")', weight: '100 900' }],
        }),
      ),
    ).not.toThrow();
  });

  it('accepts a value whose comment hides a structural character', () => {
    expect(() =>
      defineTheme(definition({ components: { '--slotted-card-radius': '1px /* } */ solid red' } })),
    ).not.toThrow();
    expect(() =>
      defineTheme(
        definition({ components: { '--slotted-card-radius': 'url(a.woff2) /* cache;v2 */' } }),
      ),
    ).not.toThrow();
  });

  it('refuses a value that leaves a string open', () => {
    expect(() =>
      defineTheme(definition({ components: { '--slotted-card-radius': '0px "' } })),
    ).toThrow(
      /components --slotted-card-radius is .* leaves a string, a comment or an escape open/,
    );
  });

  it('refuses a value whose string a newline ends before its quote', () => {
    expect(() =>
      defineTheme(
        definition({
          components: { '--slotted-card-radius': '"a\n} [data-ui="card"] { color: red; } "' },
        }),
      ),
    ).toThrow(
      /components --slotted-card-radius is .* leaves a string, a comment or an escape open/,
    );
  });

  it('reads an escaped structural character as escaped, and refuses a value ending in an escape', () => {
    expect(() =>
      defineTheme(definition({ components: { '--slotted-card-radius': 'a\\;b' } })),
    ).not.toThrow();
    expect(() =>
      defineTheme(definition({ components: { '--slotted-card-radius': '0px\\' } })),
    ).toThrow(
      /components --slotted-card-radius is .* leaves a string, a comment or an escape open/,
    );
  });

  it('refuses a value that leaves a comment open', () => {
    expect(() =>
      defineTheme(definition({ components: { '--slotted-card-radius': '0px /*' } })),
    ).toThrow(
      /components --slotted-card-radius is .* leaves a string, a comment or an escape open/,
    );
  });
});

describe('defineTheme rules', () => {
  const failsWith = (rules: string[]) => {
    try {
      defineTheme(definition({ name: 'ruled', rules }));
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error('defineTheme accepted the rules');
  };

  it('holds a rule given as text to the selector policy, naming the rule index, the line and the selector', () => {
    const message = failsWith([
      `[data-ui='card'] { gap: 0; }`,
      `[data-ui='card'] { gap: 0; }\n[data-ui='text-field'] input { color: red; }`,
    ]);
    expect(message).toContain(
      "- rules[1]:2 [data-ui='text-field'] input: input: an element type is not a public selector",
    );
  });

  it('refuses each selector the build refuses', () => {
    for (const [css, reason] of [
      [`.card { color: red; }`, '.card: a class is not a public selector'],
      [`[data-ui='card']#total { color: red; }`, '#total: an id is not a public selector'],
      [`[data-ui='card'] > * { margin: 0; }`, '*: the universal selector is not a public selector'],
      [`:root { color: red; }`, ':root: a document or scoping root is not a public selector'],
      [
        `[data-ui='tabs'] [role='tab'] { color: red; }`,
        "[role='tab']: an attribute outside data-* is not a public selector",
      ],
      [`[data-ui='nope'] { color: red; }`, "[data-ui='nope'] names no family"],
      [
        `[data-ui='button'][data-part='nope'] { color: red; }`,
        "[data-part='nope'] is not a part of button",
      ],
      [
        `[data-addOnPaste] { color: red; }`,
        '[data-addOnPaste] is not an attribute any family sets',
      ],
    ] as const) {
      expect(failsWith([css]), css).toContain(reason);
    }
  });

  it('refuses a rule that reads a property no theme may read', () => {
    expect(failsWith([`[data-ui='card'] { color: var(--_ink); }`])).toContain(
      "rules[0]:1 [data-ui='card']: var(--_ink) reads a private property of a family",
    );
    expect(failsWith([`[data-ui='card'] { color: var(--slotted-nope); }`])).toContain(
      'var(--slotted-nope) is not a token',
    );
  });

  it('refuses a rule whose braces do not balance before reading its selectors', () => {
    expect(failsWith(['[data-ui="card"] { color: red; } } .evil { color: blue; }'])).toMatch(
      /rules\[0\]: theme rule has an unbalanced `\}`/,
    );
  });

  it('accepts a rule over public hooks, and leaves a rule given as a URL to the build', () => {
    expect(() =>
      defineTheme(
        definition({
          rules: [
            `[data-ui='text-field']:has(> [data-part='input']:focus-visible) { outline-color: var(--slotted-tone-accent-solid); }
@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }`,
            new URL('https://example.test/rules.css'),
          ],
        }),
      ),
    ).not.toThrow();
  });

  it('accepts a variant axis as a theme axis, on the root and in a selector', () => {
    expect(() =>
      defineTheme(
        definition({
          rules: [
            `&[data-slotted-variant-depth='oled'] [data-ui='card'] { --slotted-card-radius: 0px; }
[data-slotted-variant-depth='oled'] [data-ui='card'] { border-color: var(--slotted-border-strong); }`,
          ],
        }),
      ),
    ).not.toThrow();
    expect(() =>
      defineTheme(
        definition({ rules: [`[data-slotted-variant-] [data-ui='card'] { color: red; }`] }),
      ),
    ).toThrow(/is not an attribute any family sets/);
  });
});

describe('flattenTheme', () => {
  const schemes = values.schemes as Record<string, Record<string, string>>;
  const flat = flattenTheme(
    defineTheme(
      definition({
        schemes: {
          ...schemes,
          dark: { ...schemes['dark'], '--slotted-scrim': 'rgb(0 0 0 / 0.5)' },
        },
      }),
    ),
  );

  it('writes a derived colour as hex and an alias as var()', () => {
    expect(flat.schemes['light']!['--slotted-tone-accent-solid']).toMatch(/^#[0-9a-f]{6}$/);
    expect(flat.schemes['light']!['--slotted-control-surface']).toBe('var(--slotted-surface)');
  });

  it('lets a scheme value win over the recipe', () => {
    expect(flat.schemes['dark']!['--slotted-scrim']).toBe('rgb(0 0 0 / 0.5)');
  });
});

describe('extendTheme', () => {
  it('merges seeds, keeps the rest, and appends rules', () => {
    const parent = defineTheme(definition({ rules: ['[data-ui="card"] { border-radius: 0; }'] }));
    const child = extendTheme(
      parent,
      {
        seeds: { accent: '#e11d48' },
        rules: ['[data-ui="button"] { border-radius: 999px; }'],
      },
      { name: 'child' },
    );
    expect(child.name).toBe('child');
    expect(child.seeds.accent).toBe('#e11d48');
    expect(child.seeds.neutral).toBe(SEEDS.neutral);
    expect(child.rules).toHaveLength(2);
    expect(child.base).toEqual(parent.base);
  });
});

describe('variants', () => {
  const OLED = {
    depth: {
      oled: {
        dark: {
          '--slotted-surface': { seed: 'neutral', l: 0, c: { scale: 0.22, max: 0.08 } },
          '--slotted-surface-raised': { seed: 'neutral', l: 0.08, c: { scale: 0.22, max: 0.03 } },
        },
      },
    },
  } as const;

  it('flattens each scheme a value changes, with the variant laid over the recipe', () => {
    const flat = flattenTheme(defineTheme(definition({ variants: OLED })));
    const dark = flat.variants?.['depth']?.['oled']?.['dark'];

    expect(dark?.['--slotted-surface']).toBe('#000000');
    expect(dark?.['--slotted-text']).toBe(flat.schemes['dark']?.['--slotted-text']);
    expect(flat.variants?.['depth']?.['oled']?.['light']).toBeUndefined();
  });

  it('refuses a name a selector cannot carry, a scheme, and a token the recipe does not derive', () => {
    const define = (variants: unknown) => defineTheme(definition({ variants: variants as never }));

    expect(() => define({ Depth: { oled: {} } })).toThrow(/variants axis "Depth"/);
    expect(() => define({ depth: { 'o led': {} } })).toThrow(/variants depth value "o led"/);
    expect(() => define({ depth: { oled: { dim: {} } } })).toThrow(
      /variants depth oled contains dim/,
    );
    expect(() =>
      define({ depth: { oled: { dark: { '--slotted-space-1': { alias: '--slotted-text' } } } } }),
    ).toThrow(/--slotted-space-1 is not a token the recipe derives for dark/);
    expect(() =>
      define({ depth: { oled: { dark: { '--slotted-surface': { mix: '--x;}', share: 0.1 } } } } }),
    ).toThrow(/variants depth oled dark --slotted-surface writes/);
  });

  it('refuses two axes that derive one token of one scheme', () => {
    const step = {
      far: {
        dark: {
          '--slotted-surface-raised': { seed: 'neutral', l: 0.3, c: { scale: 0.2, max: 0.03 } },
        },
      },
    };

    expect(() => defineTheme(definition({ variants: { ...OLED, step } as never }))).toThrow(
      /--slotted-surface-raised is also derived by the axis depth; axes that derive one token are one combined axis/,
    );
  });

  it('merges per axis, value and scheme when a theme extends another', () => {
    const base = defineTheme(definition({ variants: OLED }));
    const raised = { seed: 'neutral', l: 0.1, c: { scale: 0.22, max: 0.03 } } as const;
    const extended = extendTheme(
      base,
      { variants: { depth: { oled: { dark: { '--slotted-surface-raised': raised } } } } },
      { name: 'extended' },
    );
    const dark = extended.variants?.['depth']?.['oled']?.['dark'];

    expect(dark?.['--slotted-surface']).toEqual(OLED.depth.oled.dark['--slotted-surface']);
    expect(dark?.['--slotted-surface-raised']).toEqual(raised);
  });
});
