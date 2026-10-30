import assert from 'node:assert/strict';
import test from 'node:test';

import { LAYER_ORDER_STATEMENT, parseSeed, resolveTokens } from '../dist/index.js';

/**
 * The rules every theme is held to, in one place, so a second theme is a JSON
 * file rather than a JSON file and a copied test suite. What a theme *chose* —
 * its shadow scale, its neutral, the white it puts on a solid — is not here:
 * that is the theme's identity, and it belongs to the theme's own tests.
 */

const VARIANTS = ['accent', 'secondary', 'success', 'info', 'warning', 'danger'];
const SOLID_STATES = ['solid', 'solid-hover', 'solid-active'];
const SURFACES = ['--slotted-surface', '--slotted-surface-raised', '--slotted-surface-sunken'];

/**
 * A scheme named for contrast has to earn the name. `high-contrast` is held to
 * the AAA ratio for body text rather than the AA ratio the other schemes meet,
 * and its borders are held to the non-text ratio, because a border is what
 * separates two surfaces that no longer differ in fill.
 */
export const TEXT_RATIO = { light: 4.5, dark: 4.5, 'high-contrast': 7 };
const NON_TEXT_RATIO = 3;
/**
 * The floor for the edge of a control at rest: a line, and a step above the
 * rule a divider draws (1.35:1 in the default light scheme), never the 3:1 a
 * separator or a focus ring holds. See the border test below for the reason.
 */
const CONTROL_EDGE_RATIO = 1.5;
/** The OKLab lightness step a neutral highlight keeps from the ground it is drawn on. */
const HIGHLIGHT_STEP = 0.02;
/** The OKLab lightness step a dark scheme's raised layer keeps above the page, unless `thresholds.layerStep` says. */
const LAYER_STEP = 0.04;

/** The collapsed duration is short enough to read as instant, and never zero. */
const MAX_REDUCED_MOTION_MS = 1;

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  assert.ok(match, `Expected a literal six-digit hex color, received ${hex}`);
  const [, red = '00', green = '00', blue = '00'] = match;
  return (
    0.2126 * channel(Number.parseInt(red, 16)) +
    0.7152 * channel(Number.parseInt(green, 16)) +
    0.0722 * channel(Number.parseInt(blue, 16))
  );
}

export function contrast(first, second) {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
}

function milliseconds(value) {
  const match = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(String(value).trim());
  return match ? Number(match[1]) * (match[2] === 's' ? 1000 : 1) : undefined;
}

function names(contract, axis) {
  return contract.tokens.filter((token) => token.axis === axis).map((token) => token.name);
}

function reducedMotionNames(contract) {
  return contract.tokens.filter((token) => token.reducedMotion).map((token) => token.name);
}

function glyphNames(contract) {
  return names(contract, 'base').filter((name) => name.startsWith('--slotted-icon-'));
}

const indent = (text) =>
  text
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');

function expectedReducedMotionBlock(contract, theme) {
  const declarations = reducedMotionNames(contract)
    .map((name) => `    ${name}: ${theme.reducedMotion[name]};`)
    .join('\n');
  return indent(
    `@media (prefers-reduced-motion: reduce) {\n  [data-slotted-theme="${theme.name}"] {\n${declarations}\n  }\n}`,
  );
}

function payloadFor(theme, name) {
  const value = theme.base[name];
  assert.ok(value !== undefined, `${name} is missing`);

  const match = /^url\("data:image\/svg\+xml,([^"]*)"\)$/.exec(value);
  assert.ok(match, `${name} is not a complete SVG data URI`);
  return match[1];
}

function structureCases(contract, theme, css) {
  const label = theme.name;

  /**
   * A scheme is a palette and a UA hint. Without the hint every native control,
   * scrollbar and form widget renders in the light user-agent style whatever
   * scheme the application selected, so an unchecked radio on a dark card came
   * out a solid white dot that read as checked. Card was the first rebuilt
   * family to render a native control, and it is where this was found.
   */
  test(`${label} tells the user agent which scheme its own widgets are painted for`, () => {
    for (const [scheme, expected] of [
      ['light', 'light'],
      ['dark', 'dark'],
      ['high-contrast', 'light'],
    ]) {
      assert.match(
        css,
        new RegExp(
          `@scope \\([^{]*\\[data-slotted-scheme="${scheme}"\\][^{]*\\{\\s*:scope,\\s*\\[data-slotted-seeds\\][^{]*\\{\\s*color-scheme: ${expected};`,
        ),
        `${scheme} declares no color-scheme`,
      );
    }
  });

  test(`${label} collapses every duration the contract marks, and never to zero`, () => {
    assert.deepEqual(Object.keys(theme.reducedMotion).sort(), reducedMotionNames(contract).sort());

    for (const [name, value] of Object.entries(theme.reducedMotion)) {
      const duration = milliseconds(value);
      assert.ok(duration !== undefined, `${name} collapses to ${value}, which is not a duration`);
      assert.ok(
        duration > 0 && duration <= MAX_REDUCED_MOTION_MS,
        `${name} collapses to ${value}, outside (0, ${MAX_REDUCED_MOTION_MS}ms]`,
      );
    }
  });

  test(`${label} collapses every duration under its own theme selector`, () => {
    assert.ok(
      css.includes(expectedReducedMotionBlock(contract, theme)),
      'The theme emits no reduced-motion block',
    );
  });

  test(`${label} emits the reduced-motion block after the block it overrides`, () => {
    assert.ok(
      css.indexOf('@media (prefers-reduced-motion: reduce)') >
        css.indexOf(reducedMotionNames(contract)[0]),
      'A media query adds no specificity, so source order is what makes the override win',
    );
  });

  test(`${label} emits the reduced-motion block as the final content of the theme layer`, () => {
    assert.ok(
      css.includes(`${expectedReducedMotionBlock(contract, theme)}\n}\n`),
      'No later block of the theme layer may override reduced motion',
    );
  });

  test(`${label} grows every control to the comfortable target under a coarse pointer`, () => {
    const query = css.slice(css.indexOf('@media (pointer: coarse)'));

    for (const density of contract.requiredDensities) {
      assert.match(query, new RegExp(`data-slotted-density="${density}"`));
    }
    assert.match(
      query,
      /--slotted-control-height-md: max\([^)]+, var\(--slotted-target-comfortable\)\)/,
    );
    assert.ok(
      css.indexOf('@media (pointer: coarse)') > css.indexOf('--slotted-control-height-md:'),
      'The coarse-pointer block must follow the density block it overrides',
    );
  });

  test(`${label} maps every scheme token to a system colour under forced colours`, () => {
    const query = css.slice(
      css.indexOf('@media (forced-colors: active)'),
      css.indexOf('@media (prefers-reduced-motion: reduce)'),
    );

    for (const name of names(contract, 'scheme')) {
      assert.match(query, new RegExp(`${name}: [A-Za-z]+;`), `${name} is unmapped`);
    }
    for (const scheme of contract.requiredSchemes) {
      assert.match(
        query,
        new RegExp(`\\[data-slotted-scheme="${scheme}"\\]`),
        `forced colours must carry the specificity of the ${scheme} block`,
      );
    }
  });

  test(`${label} scopes every block to its own name`, () => {
    const scopes = new Set(
      [...css.matchAll(/\[data-slotted-theme="([^"]+)"\]/g)].map(([, name]) => name),
    );

    assert.deepEqual([...scopes], [theme.name], 'Two themes must emit disjoint selectors');
  });

  test(`${label} opens the stylesheet with the published layer order`, () => {
    assert.ok(css.startsWith(LAYER_ORDER_STATEMENT));
  });
}

function contrastCases(theme, thresholds) {
  const label = theme.name;
  const layerStep = thresholds.layerStep ?? LAYER_STEP;

  /**
   * One radius for every control, at every size. Button carried three of its
   * own — 7, 6 and 5 pixels — so a small button read rounder than a large one,
   * which is a scale nothing else in the library shares. The rebuild dropped
   * them, and this is what keeps a second corner scale from reappearing beside
   * the first.
   */
  test(`${label} leaves the corner of a control to one token`, () => {
    assert.deepEqual(
      Object.keys(theme.base).filter(
        (name) => /radius/.test(name) && !name.startsWith('--slotted-radius-'),
      ),
      ['--slotted-control-radius'],
    );
    assert.match(theme.base['--slotted-control-radius'], /^var\(--slotted-radius-[a-z]+\)$/);
  });

  for (const [scheme, raw] of Object.entries(theme.schemes)) {
    schemeCases(label, scheme, resolveTokens({ ...theme.base, ...raw }), layerStep);
  }

  /* A variant value is held to every check of each scheme it changes. */
  for (const [axis, values] of Object.entries(theme.variants ?? {})) {
    for (const [value, schemes] of Object.entries(values)) {
      for (const [scheme, raw] of Object.entries(schemes)) {
        const resolved = resolveTokens({ ...theme.base, ...raw });
        schemeCases(`${label} ${axis}=${value}`, scheme, resolved, layerStep);
      }
    }
  }
}

function schemeCases(label, scheme, values, layerStep) {
  const required = TEXT_RATIO[scheme];

  test(`${label} ${scheme} text reads on every surface`, () => {
    for (const surface of SURFACES) {
      for (const text of ['--slotted-text', '--slotted-text-muted']) {
        assert.ok(
          contrast(values[surface], values[text]) >= required,
          `${scheme} ${text} on ${surface} is below ${required}:1`,
        );
      }
    }
  });

  /**
   * The neutral highlight is a ground, not a line, so it is held to a step of
   * lightness rather than to a ratio: an item under the pointer or the
   * keyboard has to read as lit on every surface it is drawn on. The dark
   * scheme's step was calibrated on `--slotted-surface` alone, and on
   * `--slotted-surface-raised` — where every menu, popup list and sheet
   * lives — it sat 0.005 above the ground in OKLab lightness: the highlight
   * of an action sheet's focused item was invisible. 0.02 is the step a
   * reader tells apart at a glance; the pressed step sits beyond the hover.
   */
  test(`${label} ${scheme} lights a neutral highlight on every surface`, () => {
    const lightness = (name) => parseSeed(values[name]).l;
    for (const surface of ['--slotted-surface', '--slotted-surface-raised']) {
      const ground = lightness(surface);
      const hover = lightness('--slotted-tone-secondary-subtle-hover');
      const active = lightness('--slotted-tone-secondary-subtle-active');
      assert.ok(
        Math.abs(hover - ground) >= HIGHLIGHT_STEP,
        `${scheme} --slotted-tone-secondary-subtle-hover is ${Math.abs(hover - ground).toFixed(3)} from ${surface}, below ${HIGHLIGHT_STEP}`,
      );
      assert.ok(
        Math.abs(active - ground) > Math.abs(hover - ground),
        `${scheme} the pressed step is not beyond the hover on ${surface}`,
      );
    }
  });

  /**
   * A card, a menu or a dialog is a layer over the page. In a light scheme
   * its shadow separates it; in a dark scheme a shadow on a dark ground does
   * not read, and the layer has to stand lighter than the page. At 0.017 in
   * OKLab lightness a card read apart only by its border.
   */
  if (scheme === 'dark') {
    test(`${label} ${scheme} raises a layer visibly above the page`, () => {
      const step =
        parseSeed(values['--slotted-surface-raised']).l - parseSeed(values['--slotted-surface']).l;
      assert.ok(
        step >= layerStep,
        `${scheme} --slotted-surface-raised is ${step.toFixed(3)} above --slotted-surface, below ${layerStep} (thresholds.layerStep)`,
      );
    });
  }

  test(`${label} ${scheme} inverts a surface without losing its text`, () => {
    assert.ok(
      contrast(values['--slotted-surface-inverse'], values['--slotted-text-inverse']) >= required,
      `${scheme} inverse text is below ${required}:1`,
    );
  });

  /**
   * A separator and a focus ring are non-text elements, and the surface they
   * are drawn against is not always `--slotted-surface`: an `outline` control
   * takes whatever ground it is placed on, so a form inside a raised card and
   * the same form on a sunken page are both cases the ratio has to survive.
   * Holding only the default surface is what let a line soften past the
   * floor on one of the other two without anything saying so.
   *
   * The edge of a control at rest is not held to the ratio. At 3:1 it was the
   * darkest line on the page in both schemes and read as a high-contrast
   * theme; a control is identified by its fill, its shadow, its label and its
   * size, which is the case WCAG 1.4.11 exempts from the boundary ratio, and
   * the states that carry meaning — focus, invalid, checked — keep it. The
   * edge still has to be a line: the floor below is the step a divider takes.
   */
  test(`${label} ${scheme} separates surfaces with a visible border`, () => {
    for (const surface of SURFACES) {
      assert.ok(
        contrast(values[surface], values['--slotted-border-strong']) >= NON_TEXT_RATIO,
        `${scheme} --slotted-border-strong on ${surface} is below ${NON_TEXT_RATIO}:1`,
      );
      assert.ok(
        contrast(values[surface], values['--slotted-control-border-color']) >= CONTROL_EDGE_RATIO,
        `${scheme} --slotted-control-border-color on ${surface} is below ${CONTROL_EDGE_RATIO}:1`,
      );
      assert.ok(
        contrast(values[surface], values['--slotted-focus-ring-color']) >= NON_TEXT_RATIO,
        `${scheme} focus ring on ${surface} is below ${NON_TEXT_RATIO}:1`,
      );
    }
  });

  /**
   * The edge of a control is lighter than the line between two surfaces, and
   * the two are separate tokens for that reason. Reading
   * `--slotted-border-strong` on a control drew a frame that was the darkest
   * line on the form.
   */
  test(`${label} ${scheme} keeps the control edge lighter than the surface separator`, () => {
    assert.ok(
      contrast(values['--slotted-surface'], values['--slotted-control-border-color']) <
        contrast(values['--slotted-surface'], values['--slotted-border-strong']) ||
        scheme === 'high-contrast',
      `${scheme} control border is not lighter than the strong border`,
    );
    assert.ok(
      contrast(values['--slotted-surface'], values['--slotted-disabled-border']) <
        contrast(values['--slotted-surface'], values['--slotted-control-border-color']) ||
        scheme === 'high-contrast',
      `${scheme} disabled border is not lighter than the control border`,
    );
  });

  test(`${label} ${scheme} solid variants meet the ratio the scheme promises`, () => {
    for (const variant of VARIANTS) {
      const foreground = values[`--slotted-tone-${variant}-on-solid`];
      for (const state of SOLID_STATES) {
        assert.ok(
          contrast(values[`--slotted-tone-${variant}-${state}`], foreground) >= required,
          `${scheme}.${variant}.${state} is below ${required}:1`,
        );
      }
    }
  });

  /**
   * The tinted rectangle each tone carries — its `surface` role under its
   * `text` role — is what `badge`, `tag` and `alert` are made of, and Button
   * handed the pair to them when `soft` left its painting axis. Nothing held
   * the ratio: the solid roles were covered from the first commit and the
   * tinted ones never were, so the first family to depend on them would have
   * been the one to discover a shortfall, in a screenshot.
   *
   * `outline` puts the same text on the page instead, so both grounds are
   * held here.
   */
  test(`${label} ${scheme} keeps a tinted ground readable`, () => {
    for (const variant of VARIANTS) {
      const text = values[`--slotted-tone-${variant}-text`];
      for (const ground of [`--slotted-tone-${variant}-surface`, ...SURFACES]) {
        assert.ok(
          contrast(values[ground], text) >= required,
          `${scheme} ${variant} text on ${ground} is below ${required}:1`,
        );
      }
    }
  });

  /**
   * What says a row, a card or a toggle is chosen. The `accent` ground alone
   * cannot say it: a tinted ground is bracketed from both sides — it has to
   * stay far enough below the page to be seen and far enough above its own
   * text to be read — and on a light page the two brackets do not overlap.
   * At 1.5:1 under white a ground sits at L ≤ 0.650, while `accent-text`
   * needs L ≥ 0.655 to hold 4.5:1 over it, and `danger` and `success` need
   * 0.680 and 0.892 (G9).
   * So the pair is what carries the state: the edge separates the chosen
   * item from the page and from the ground it encloses, at the non-text
   * ratio, and the ground tints what the edge encloses. A theme that softens
   * the accent edge loses the only half of the pair that is measurable in
   * every scheme — `high-contrast` paints every tone ground the page's own
   * white, and there the edge is the whole gesture.
   */
  test(`${label} ${scheme} says chosen with an edge, not with a ground alone`, () => {
    const ground = values['--slotted-tone-accent-surface'];
    const edge = values['--slotted-tone-accent-border'];
    for (const [against, what] of [
      [values['--slotted-surface'], 'the page'],
      [ground, 'the ground it encloses'],
    ]) {
      assert.ok(
        contrast(edge, against) >= NON_TEXT_RATIO,
        `${scheme} the accent edge reads ${contrast(edge, against).toFixed(
          3,
        )}:1 against ${what}, below ${NON_TEXT_RATIO}:1`,
      );
    }
  });

  test(`${label} ${scheme} keeps disabled text legible`, () => {
    assert.ok(
      contrast(values['--slotted-disabled-background'], values['--slotted-disabled-foreground']) >=
        NON_TEXT_RATIO,
      `${scheme} disabled text is below ${NON_TEXT_RATIO}:1`,
    );
  });
}

function glyphCases(contract, theme) {
  const label = theme.name;
  const glyphs = glyphNames(contract);

  test(`${label} gives every glyph a fully encoded, complete SVG payload a mask can use`, () => {
    assert.ok(glyphs.length > 0, 'The contract declares no glyph');

    for (const name of glyphs) {
      const payload = payloadFor(theme, name);
      assert.doesNotMatch(payload, /[<>#]/, `${name} leaves SVG syntax unencoded`);

      const svg = decodeURIComponent(payload);
      assert.match(svg, /^<svg\b[^>]*>[\s\S]*<\/svg>$/, `${name} is not a complete SVG document`);
    }
  });

  test(`${label} uses black or none only for its mask alpha geometry`, () => {
    for (const name of glyphs) {
      const svg = decodeURIComponent(payloadFor(theme, name));
      const attributes = [...svg.matchAll(/\b(fill|stroke)=['"]([^'"]+)['"]/g)];
      assert.ok(attributes.length > 0, `${name} has no fill or stroke alpha geometry`);

      for (const [, attribute, value] of attributes) {
        assert.ok(
          value === 'black' || value === 'none',
          `${name} uses ${value} for ${attribute}, not black or none mask alpha geometry`,
        );
      }
    }
  });

  test(`${label} declares one viewBox for every glyph, so one size rule fits all`, () => {
    for (const name of glyphs) {
      const svg = decodeURIComponent(payloadFor(theme, name));
      assert.ok(svg.includes("viewBox='0 0 24 24'"), `${name} has a foreign viewBox`);
    }
  });
}

/**
 * Registers every case a theme has to pass. `theme` is `flattenTheme(theme)`;
 * `css` is `renderTheme(theme)`. `thresholds.layerStep` is the OKLab lightness
 * a dark scheme's raised layer keeps above the page, 0.04 unless given. Each
 * value of `theme.variants` is held to the checks of every scheme it changes.
 */
export function themeConformance({ contract, theme, css, thresholds = {} }) {
  structureCases(contract, theme, css);
  contrastCases(theme, thresholds);
  glyphCases(contract, theme);
}
