import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  contrast as colorContrast,
  contract,
  deltaE,
  evaluateRecipe,
  flattenTheme,
  parseSeed,
  resolveTokens,
  SCHEMES,
  seedGrid,
} from '@slotted/theme';
import { contrast, TEXT_RATIO } from '@slotted/theme/conformance';

import defaultTheme from '../src/default/theme.mjs';

/**
 * What this theme chose, as opposed to what every theme must meet. The values
 * are the theme resolved: the recipe evaluated on the default seeds.
 */
const theme = flattenTheme(defaultTheme);

/** The literal colours the recipe replaced, as `reference.json` holds them. */
const reference = JSON.parse(
  await readFile(new URL('../src/default/reference.json', import.meta.url), 'utf8'),
);

/** A colour laid over another at `alpha`, as a browser composites it. */
function over(ink, ground, alpha) {
  const channels = (hex) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  const mixed = channels(ink).map(
    (value, index) => alpha * value + (1 - alpha) * channels(ground)[index],
  );
  return `#${mixed.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

const REDUCED_MOTION_VALUES = {
  '--slotted-duration-instant': '1ms',
  '--slotted-duration-short': '1ms',
  '--slotted-duration-medium': '1ms',
  '--slotted-duration-long': '1ms',
};
const SHADOW_TOKENS = [
  '--slotted-shadow-xs',
  '--slotted-shadow-sm',
  '--slotted-shadow-md',
  '--slotted-shadow-lg',
];
const SHADOW_VALUES = {
  light: {
    '--slotted-shadow-xs': '0 1px 2px rgb(15 23 42 / 0.06)',
    '--slotted-shadow-sm': '0 1px 3px rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.08)',
    '--slotted-shadow-md':
      '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.08)',
    '--slotted-shadow-lg':
      '0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.08)',
  },
  dark: {
    '--slotted-shadow-xs': '0 1px 2px rgb(0 0 0 / 0.40)',
    '--slotted-shadow-sm': '0 1px 3px rgb(0 0 0 / 0.45), 0 1px 2px -1px rgb(0 0 0 / 0.40)',
    '--slotted-shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.50), 0 2px 4px -2px rgb(0 0 0 / 0.45)',
    '--slotted-shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.60), 0 4px 6px -4px rgb(0 0 0 / 0.50)',
  },
};
const Z_INDEX_TOKENS = [
  '--slotted-z-index-sticky',
  '--slotted-z-index-overlay',
  '--slotted-z-index-popover',
  '--slotted-z-index-toast',
];
const Z_INDEX_VALUES = {
  '--slotted-z-index-sticky': '100',
  '--slotted-z-index-overlay': '1000',
  '--slotted-z-index-popover': '1100',
  '--slotted-z-index-toast': '1200',
};

function pick(values, tokenNames) {
  return Object.fromEntries(tokenNames.map((name) => [name, values[name]]));
}

function names(axis) {
  return contract.tokens.filter((token) => token.axis === axis).map((token) => token.name);
}

test('is the theme the library ships by default', () => {
  assert.equal(theme.name, 'default');
});

test('states the exact reduced-motion collapse it published', () => {
  assert.deepEqual(theme.reducedMotion, REDUCED_MOTION_VALUES);
});

test('locks the exact shadow and stacking scales', () => {
  assert.deepEqual(
    names('scheme').filter((token) => token.startsWith('--slotted-shadow-')),
    SHADOW_TOKENS,
  );
  assert.deepEqual(
    names('base').filter((token) => token.startsWith('--slotted-z-index-')),
    Z_INDEX_TOKENS,
  );
  assert.deepEqual(pick(theme.schemes.light, SHADOW_TOKENS), SHADOW_VALUES.light);
  assert.deepEqual(pick(theme.schemes.dark, SHADOW_TOKENS), SHADOW_VALUES.dark);
  assert.deepEqual(pick(theme.base, Z_INDEX_TOKENS), Z_INDEX_VALUES);
});

test('keeps the corner of a control at the small step', () => {
  assert.equal(theme.base['--slotted-control-radius'], 'var(--slotted-radius-sm)');
});

/**
 * In `high-contrast` the edge of a control at rest and the danger border are
 * one black, and so are the two rings, so an invalid control cannot be told
 * from a valid one by colour (WCAG 1.4.1). The families draw an invalid frame
 * with an inset edge of `--slotted-control-invalid-edge-width` inside its
 * border; the theme gives it a width, so the invalid line is thicker in every
 * scheme.
 */
test('tells an invalid control from a valid one by width where colour cannot', () => {
  const hc = resolveTokens({ ...theme.base, ...theme.schemes['high-contrast'] });
  assert.equal(hc['--slotted-tone-danger-border'], hc['--slotted-control-border-color']);
  const base = resolveTokens(theme.base);
  assert.equal(base['--slotted-control-invalid-edge-width'], base['--slotted-border-width-thin']);
  assert.ok(Number.parseFloat(base['--slotted-control-invalid-edge-width']) >= 1);
});

test('danger remains a strong surface with white text', () => {
  for (const values of Object.values(theme.schemes)) {
    assert.equal(values['--slotted-tone-danger-on-solid'], '#ffffff');
  }
});

test('accent and success remain strong surfaces with white text', () => {
  for (const values of Object.values(theme.schemes)) {
    assert.equal(values['--slotted-tone-accent-on-solid'], '#ffffff');
    assert.equal(values['--slotted-tone-success-on-solid'], '#ffffff');
  }
});

/**
 * The light fill keeps a dark label and the dark fill a light one: each of the
 * four secondary roles stays within 0.02 in OKLab of the value it had before
 * the recipe derived it.
 */
test('secondary remains a neutral surface rather than an inverted foreground', () => {
  for (const scheme of ['light', 'dark']) {
    for (const role of ['solid', 'solid-hover', 'solid-active', 'on-solid']) {
      const token = `--slotted-tone-secondary-${role}`;
      const distance = deltaE(
        parseSeed(theme.schemes[scheme][token]),
        parseSeed(reference[scheme][token]),
      );
      assert.ok(distance <= 0.02, `${scheme} ${token} moved ${distance.toFixed(4)} in OKLab`);
    }
  }
});

/**
 * Every filled tone has a hover step a pointer can see, and none moves past
 * the share its scheme states: `recipes.standard` mixes the fill 6% toward
 * white (8% in `dark`), toward black above lightness 0.9, and a bound walks
 * it back where the label would lose its ratio.
 */
test('moves every solid hover a visible share of the way, and no further', () => {
  for (const [scheme, values] of Object.entries(theme.schemes)) {
    for (const tone of ['accent', 'secondary', 'success', 'warning', 'danger']) {
      const solid = parseSeed(values[`--slotted-tone-${tone}-solid`]);
      const hover = parseSeed(values[`--slotted-tone-${tone}-solid-hover`]);
      const target = solid.l > 0.9 ? 0 : 1;
      const share = (hover.l - solid.l) / (target - solid.l);
      assert.ok(
        share > 0.01 && share < 0.09,
        `${scheme} ${tone} hover moved ${(share * 100).toFixed(1)}%`,
      );
    }
  }
});

/**
 * The halo the selection scale describes — the circle `checkbox` and
 * `radio-group` light under the pointer — is a tone laid over the page at
 * `--slotted-selection-halo-opacity`, so what a reader sees is the mix and the
 * mix is what has to separate from the page. The ink is the accent's text
 * tone, which every scheme keeps legible on the surface, and the same twelfth
 * of it therefore lands in the same place in all three.
 *
 * It was the accent's surface tone at four tenths. A surface tone is a ground,
 * tuned to sit under text rather than to be told apart from the page: the halo
 * measured 1.09:1 in `light`, 1.03:1 in `dark` and 1.00:1 in `high-contrast`,
 * where the token is the page's own white — a gesture one scheme out of three
 * could see (CK7).
 */
/**
 * The band behind a span a query matched, held from both sides. It is mixed
 * from the accent's text tone for the reason the halo is — a `*-surface` tone
 * is a ground and does not separate from the surface it sits on, and in
 * `high-contrast` it is the page's own white (CB10) — and its share is smaller
 * than the halo's because a band is read through. The mark's own text sits on
 * it, so the share the band may take is whatever leaves that text the ratio
 * its scheme promises, on every ground a marked label can land on: the panel,
 * a highlighted row and a chosen row.
 */
test('lights the filter match without dimming the word it marks', () => {
  const alpha = Number(theme.base['--slotted-highlight-tint-opacity']);
  const panels = [];
  for (const [scheme, values] of Object.entries(theme.schemes)) {
    const ink = values['--slotted-tone-accent-text'];
    for (const [role, ground] of [
      ['the panel', values['--slotted-surface-raised']],
      ['a highlighted row', values['--slotted-tone-secondary-subtle-hover']],
      ['a chosen row', values['--slotted-tone-accent-surface']],
    ]) {
      const band = over(ink, ground, alpha);
      const separation = contrast(band, ground);
      assert.ok(
        separation >= 1.1,
        `the match band reads ${separation.toFixed(3)}:1 against ${role} in ${scheme}`,
      );
      const legibility = contrast(ink, band);
      assert.ok(
        legibility >= TEXT_RATIO[scheme],
        `the marked word reads ${legibility.toFixed(3)}:1 on its band over ${role} in ${scheme}`,
      );
      if (role === 'the panel') panels.push(separation);
    }
  }
  /* The same gesture in all three, not three strengths of one. */
  assert.ok(
    Math.max(...panels) - Math.min(...panels) <= 0.1,
    `the match band reads ${panels.map((ratio) => ratio.toFixed(3)).join(', ')} across the schemes`,
  );
});

test('lights the selection halo where every scheme can see it', () => {
  const alpha = Number(theme.base['--slotted-selection-halo-opacity']);
  const reached = [];
  for (const [scheme, values] of Object.entries(theme.schemes)) {
    const surface = values['--slotted-surface'];
    const ratio = contrast(over(values['--slotted-tone-accent-text'], surface, alpha), surface);
    assert.ok(ratio >= 1.2, `the halo reads ${ratio.toFixed(3)}:1 against the page in ${scheme}`);
    reached.push(ratio);
  }
  /* The same gesture in all three, not three strengths of one. */
  assert.ok(
    Math.max(...reached) - Math.min(...reached) <= 0.1,
    `the halo reads ${reached.map((ratio) => ratio.toFixed(3)).join(', ')} across the schemes`,
  );
});

/**
 * The file-kind palette is the second scale in the component layer, and the
 * whole of its argument is that it is a palette the five tones cannot give. A
 * palette a family invented is a palette nobody measured, so both questions the
 * pair raises are measured here: the tile against the page it sits on, and the
 * mark knocked out of it against the tile.
 *
 * Both are non-text elements carrying meaning, so 3:1 is the floor. The scale
 * clears it by a wide margin on purpose — a tile at the floor is a tile a
 * reader has to look for.
 */
test('keeps every file-kind tile legible against the page and against its own mark', () => {
  const kinds = contract.tokens
    .filter((token) => token.name.startsWith('--slotted-upload-kind-'))
    .map((token) => token.name)
    .filter((name) => name !== '--slotted-upload-kind-foreground');

  assert.equal(kinds.length, 9, 'the palette changed size without this test noticing');

  for (const [scheme, values] of Object.entries(theme.schemes)) {
    const foreground = values['--slotted-upload-kind-foreground'];
    for (const kind of kinds) {
      const tile = values[kind];
      assert.ok(tile, `${scheme} ${kind} is missing`);
      assert.ok(
        contrast(tile, values['--slotted-surface']) >= 3,
        `${scheme} ${kind} is ${contrast(tile, values['--slotted-surface']).toFixed(2)}:1 against the surface`,
      );
      assert.ok(
        contrast(tile, foreground) >= 3,
        `${scheme} ${kind} is ${contrast(tile, foreground).toFixed(2)}:1 against its own mark`,
      );
      /*
       * And against a failed row's ground, because the tile keeps its own
       * colour there: a refused archive that turned red would stop answering
       * the question its own message raises.
       */
      assert.ok(
        contrast(tile, values['--slotted-tone-danger-surface']) >= 3,
        `${scheme} ${kind} is ${contrast(tile, values['--slotted-tone-danger-surface']).toFixed(2)}:1 against a failed row`,
      );
    }
  }
});

/**
 * Nine hues, and the reader tells them apart at thirty-two pixels. Two kinds
 * painted the same colour would be one kind drawn twice, which is what
 * `document` and `pdf` were before they were split.
 */
test('gives every file kind a colour of its own in every scheme', () => {
  for (const [scheme, values] of Object.entries(theme.schemes)) {
    const painted = contract.tokens
      .filter(
        (token) =>
          token.name.startsWith('--slotted-upload-kind-') &&
          token.name !== '--slotted-upload-kind-foreground',
      )
      .map((token) => values[token.name]);
    assert.equal(new Set(painted).size, painted.length, `${scheme} paints two kinds alike`);
  }
});

/**
 * The code-scope palette is the third scale in the component layer, and it is
 * there for the reason the file-kind palette is: twelve kinds of word, and five
 * tones. Every scope is text — a keyword is read, not glanced at — so the
 * floor is the text ratio each scheme promises, measured against the fence
 * ground `prose` and `code-block` both draw, `--slotted-surface-sunken`.
 */
test('keeps every code scope legible as text against the fence ground', () => {
  const scopes = contract.tokens
    .filter((token) => token.name.startsWith('--slotted-code-'))
    .map((token) => token.name);

  assert.equal(scopes.length, 12, 'the palette changed size without this test noticing');

  for (const [scheme, raw] of Object.entries(theme.schemes)) {
    // `--slotted-code-comment` aliases `--slotted-text-muted` in light and
    // dark, so it is read resolved, the way a browser paints it.
    const values = resolveTokens(raw);
    const ground = values['--slotted-surface-sunken'];
    for (const scope of scopes) {
      const ink = values[scope];
      assert.ok(ink, `${scheme} ${scope} is missing`);
      assert.ok(
        contrast(ink, ground) >= TEXT_RATIO[scheme],
        `${scheme} ${scope} is ${contrast(ink, ground).toFixed(2)}:1 against the fence ground`,
      );
    }
  }
});

/**
 * Twelve hues a reader tells apart one character at a time. Two scopes painted
 * alike would be one scope drawn twice.
 */
test('gives every code scope a colour of its own in every scheme', () => {
  for (const [scheme, raw] of Object.entries(theme.schemes)) {
    const values = resolveTokens(raw);
    const painted = contract.tokens
      .filter((token) => token.name.startsWith('--slotted-code-'))
      .map((token) => values[token.name]);
    assert.equal(new Set(painted).size, painted.length, `${scheme} paints two scopes alike`);
  }
});

/**
 * The fence ground follows the neutral seed, like every other ground, and
 * `--slotted-code-comment` follows it too, through `--slotted-text-muted` —
 * so the ratio above holds for the default seed alone until it is read for
 * every neutral seed a theme can bring, the way the data-slot test below
 * reads it.
 */
test('keeps every code scope legible against the fence ground for every neutral seed of the grid', () => {
  const seeds = Object.fromEntries(
    Object.entries(defaultTheme.seeds).map(([name, value]) => [name, parseSeed(value)]),
  );
  const scopes = contract.tokens
    .filter((token) => token.name.startsWith('--slotted-code-'))
    .map((token) => token.name);
  const misses = new Map();
  for (const scheme of SCHEMES) {
    const floor = TEXT_RATIO[scheme];
    const literalInk = Object.fromEntries(
      scopes
        .filter((scope) => scheme === 'high-contrast' || scope !== '--slotted-code-comment')
        .map((scope) => [scope, parseSeed(theme.schemes[scheme][scope])]),
    );
    for (const neutral of seedGrid()) {
      const derived = evaluateRecipe(defaultTheme.recipe, { ...seeds, neutral }, scheme);
      const ground = derived['--slotted-surface-sunken'];
      for (const scope of scopes) {
        const ink =
          scheme !== 'high-contrast' && scope === '--slotted-code-comment'
            ? derived['--slotted-text-muted']
            : literalInk[scope];
        const ratio = colorContrast(ink, ground);
        const key = `${scheme} ${scope}`;
        if (ratio < floor && !(misses.get(key) <= ratio)) misses.set(key, ratio);
      }
    }
  }
  assert.deepEqual(
    [...misses].map(([key, ratio]) => `${key}: ${ratio.toFixed(3)}:1`),
    [],
  );
});

/**
 * The data scale is the first palette in the semantic layer: eight hues in a
 * fixed order, and the order is a measured fact rather than a preference.
 * The colour-vision separation it holds is measured by
 * the `dataviz` validator, not here. What is measured here is the one thing
 * the theme promises every mark: a line, a bar or a dot in any slot separates
 * from every surface a chart can be drawn on, at the non-text ratio.
 */
test('keeps every data slot legible against every surface a chart is drawn on', () => {
  const slots = contract.tokens
    .filter((token) => /^--slotted-data-\d+$/.test(token.name))
    .map((token) => token.name);

  assert.deepEqual(
    slots,
    Array.from({ length: 8 }, (_, index) => `--slotted-data-${index + 1}`),
    'the scale changed shape without this test noticing',
  );

  for (const [scheme, values] of Object.entries(theme.schemes)) {
    const floor = scheme === 'high-contrast' ? 4.5 : 3;
    for (const slot of slots) {
      const ink = values[slot];
      assert.ok(ink, `${scheme} ${slot} is missing`);
      for (const surface of [
        '--slotted-surface',
        '--slotted-surface-raised',
        '--slotted-surface-sunken',
      ]) {
        assert.ok(
          contrast(ink, values[surface]) >= floor,
          `${scheme} ${slot} is ${contrast(ink, values[surface]).toFixed(2)}:1 against ${surface}`,
        );
      }
    }
  }
});

/**
 * The grounds follow the neutral seed and the data slots are literals, so the
 * ratio above holds for the default seed alone until it is read for every
 * neutral seed a theme can bring.
 */
test('keeps every data slot legible against every ground for every neutral seed of the grid', () => {
  const seeds = Object.fromEntries(
    Object.entries(defaultTheme.seeds).map(([name, value]) => [name, parseSeed(value)]),
  );
  const misses = new Map();
  for (const scheme of SCHEMES) {
    const floor = scheme === 'high-contrast' ? 4.5 : 3;
    const slots = Object.keys(theme.schemes[scheme])
      .filter((token) => /^--slotted-data-\d+$/.test(token))
      .map((token) => [token, parseSeed(theme.schemes[scheme][token])]);
    for (const neutral of seedGrid()) {
      const values = evaluateRecipe(defaultTheme.recipe, { ...seeds, neutral }, scheme);
      for (const ground of [
        '--slotted-surface',
        '--slotted-surface-raised',
        '--slotted-surface-sunken',
      ]) {
        for (const [slot, ink] of slots) {
          const ratio = colorContrast(ink, values[ground]);
          const key = `${scheme} ${slot} on ${ground}`;
          if (ratio < floor && !(misses.get(key) <= ratio)) misses.set(key, ratio);
        }
      }
    }
  }
  assert.deepEqual(
    [...misses].map(([key, ratio]) => `${key}: ${ratio.toFixed(3)}:1`),
    [],
  );
});

/**
 * `info` is a tone of its own: the nine roles every tone carries, its text
 * readable on its own surface at the scheme's text ratio. An application whose
 * accent is green had no tone left for a note or a transfer.
 */
test('carries an info tone with every role, its text readable on its surface', () => {
  const roles = [
    'solid',
    'solid-hover',
    'solid-active',
    'on-solid',
    'surface',
    'subtle-hover',
    'subtle-active',
    'border',
    'text',
  ];
  for (const [scheme, values] of Object.entries(theme.schemes)) {
    for (const role of roles)
      assert.ok(values[`--slotted-tone-info-${role}`], `${scheme} info ${role}`);
    const floor = scheme === 'high-contrast' ? 7 : 4.5;
    const ratio = contrast(
      values['--slotted-tone-info-text'],
      values['--slotted-tone-info-surface'],
    );
    assert.ok(ratio >= floor, `${scheme} info text on its surface is ${ratio.toFixed(2)}:1`);
  }
});

/** Eight series a reader tells apart; two slots painted alike are one series drawn twice. */
test('gives every data slot a colour of its own in every scheme', () => {
  for (const [scheme, values] of Object.entries(theme.schemes)) {
    const painted = contract.tokens
      .filter((token) => /^--slotted-data-\d+$/.test(token.name))
      .map((token) => values[token.name]);
    assert.equal(new Set(painted).size, painted.length, `${scheme} paints two slots alike`);
  }
});

/**
 * A state layer is laid over whatever surface the element stands on, so the
 * same token reads on the page and on a raised sidebar. It is the scheme's
 * text colour at a small share over transparency, and it never resolves to an
 * opaque colour: an opaque hover ground is the one that changes nothing when
 * the surface under it changes.
 */
test('ships hover, pressed and selected state layers, translucent in every scheme', () => {
  const css = theme.schemes;
  for (const scheme of SCHEMES) {
    for (const [token, share] of [
      [
        '--slotted-state-hover',
        /^color-mix\(in oklab, var\(--slotted-text\) (\d+)%, transparent\)$/,
      ],
      [
        '--slotted-state-pressed',
        /^color-mix\(in oklab, var\(--slotted-text\) (\d+)%, transparent\)$/,
      ],
      [
        '--slotted-state-selected',
        /^color-mix\(in oklab, var\(--slotted-text\) (\d+)%, transparent\)$/,
      ],
    ]) {
      const value = css[scheme][token];
      assert.ok(value, `${scheme} has no ${token}`);
      const match = share.exec(value);
      assert.ok(
        match,
        `${scheme} ${token} is ${value}, not a translucent share of the text colour`,
      );
      const percent = Number(match[1]);
      assert.ok(percent > 0 && percent < 30, `${scheme} ${token} is ${percent}%`);
    }
    const percent = (token) => Number(/(\d+)%/.exec(css[scheme][token])[1]);
    assert.ok(percent('--slotted-state-hover') < percent('--slotted-state-selected'));
    assert.ok(percent('--slotted-state-selected') <= percent('--slotted-state-pressed'));
  }
});

test('ships the two tracking steps large type takes, in the built CSS', async () => {
  const css = await readFile(new URL('../dist/default.css', import.meta.url), 'utf8');
  assert.match(css, /--slotted-letter-spacing-tight:\s*-0\.02em/);
  assert.match(css, /--slotted-letter-spacing-tighter:\s*-0\.03em/);
});

/**
 * A bar that floats over scrolling content is drawn as a material: the
 * surface at a partial share over transparency, behind a backdrop blur. A
 * reader who asks for less transparency, and forced colours, get the opaque
 * surface and no blur.
 */
test('ships a translucent surface material and makes it opaque under reduced transparency', async () => {
  for (const scheme of ['light', 'dark']) {
    const value = theme.schemes[scheme]['--slotted-surface-material'];
    const match = /^color-mix\(in oklab, var\(--slotted-surface\) (\d+)%, transparent\)$/.exec(
      value ?? '',
    );
    assert.ok(match, `${scheme} --slotted-surface-material is ${value}, not a translucent surface`);
    const percent = Number(match[1]);
    assert.ok(percent > 0 && percent < 100, `${scheme} material is ${percent}%`);
  }
  /* A light page holds less contrast for a blur to keep, so its blur is shorter. */
  assert.equal(theme.schemes.light['--slotted-material-backdrop'], 'saturate(1.8) blur(6px)');
  assert.equal(theme.schemes.dark['--slotted-material-backdrop'], 'saturate(1.6) blur(20px)');
  assert.equal(theme.schemes['high-contrast']['--slotted-material-backdrop'], 'none');

  const css = await readFile(new URL('../dist/default.css', import.meta.url), 'utf8');
  const start = css.indexOf('@media (prefers-reduced-transparency: reduce)');
  assert.ok(start >= 0, 'no reduced-transparency block');
  const block = css.slice(start, css.indexOf('@media', start + 1));
  assert.match(block, /\[data-slotted-scheme="light"\]/);
  assert.match(block, /--slotted-surface-material:\s*var\(--slotted-surface\);/);
  assert.match(block, /--slotted-material-backdrop:\s*none;/);
  /* Forced colours come later in source and win over it. */
  assert.ok(css.indexOf('@media (forced-colors: active)') > start);
});
