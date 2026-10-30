import { renderTheme, ruleErrors, SCHEMES } from '@slotted/theme';
import defaultTheme from '@slotted/themes/default';
import { describe, expect, it } from 'vitest';

import { buttonRules, fieldRules, FIELD_FAMILIES, inputTokens, TAB_STYLES } from './control-styles';
import {
  CARD_RADIUS_TOKENS,
  customOverrides,
  customTheme,
  OVERLAY_RADIUS_TOKENS,
} from './custom-theme';
import {
  BUTTON_CHOICES,
  CARD_CHOICES,
  CARD_RADIUS_CHOICES,
  CHART_CHOICES,
  CONTROL_BORDER_CHOICES,
  CONTROL_HEIGHT_CHOICES,
  CONTROL_RADIUS_CHOICES,
  CONTROL_TEXT_CHOICES,
  FOCUS_CHOICES,
  FONT_IDS,
  INPUT_CHOICES,
  LABEL_SPACING_CHOICES,
  LABEL_WEIGHT_CHOICES,
  MOTION_CHOICES,
  NO_CUSTOMISATION,
  OVERLAY_RADIUS_CHOICES,
  SCALE_CHOICES,
  SHADOW_CHOICES,
  TAB_CHOICES,
  type Customization,
} from './customization';
import { nexoraTheme } from './nexora-themes';
import { THEME_CATALOGUE } from './theme-catalogue';

const set = (axes: Partial<Customization>): Customization => ({ ...NO_CUSTOMISATION, ...axes });

describe('customTheme', () => {
  /**
   * The builder is `extendTheme` on the chosen theme: every value of every
   * axis, on every theme of the catalogue, is a theme `defineTheme` accepts
   * and `renderTheme` writes — no build step between a choice and its sheet.
   * About 300 compiles of 30–50 ms each: the test states its own time limit.
   */
  it('compiles every value of every axis on every theme', () => {
    const values: Partial<Customization>[] = [
      { radius: 0 },
      { radius: 24 },
      ...FONT_IDS.map((body) => ({ body })),
      ...FONT_IDS.map((heading) => ({ heading })),
      ...SCALE_CHOICES.map((scale) => ({ scale })),
      { border: 1 },
      { border: 2 },
      ...SHADOW_CHOICES.map((shadow) => ({ shadow })),
      ...MOTION_CHOICES.map((motion) => ({ motion })),
      ...CARD_CHOICES.map((cards) => ({ cards })),
      ...TAB_CHOICES.map((tabs) => ({ tabs })),
      ...CHART_CHOICES.map((chart) => ({ chart })),
      ...INPUT_CHOICES.map((input) => ({ input })),
      ...FOCUS_CHOICES.map((focus) => ({ focus })),
      ...BUTTON_CHOICES.map((button) => ({ button })),
      ...CONTROL_RADIUS_CHOICES.map((controlRadius) => ({ controlRadius })),
      ...CARD_RADIUS_CHOICES.map((cardRadius) => ({ cardRadius })),
      ...OVERLAY_RADIUS_CHOICES.map((overlayRadius) => ({ overlayRadius })),
      ...CONTROL_BORDER_CHOICES.map((controlBorder) => ({ controlBorder })),
      ...LABEL_WEIGHT_CHOICES.map((labelWeight) => ({ labelWeight })),
      ...LABEL_SPACING_CHOICES.map((labelSpacing) => ({ labelSpacing })),
      ...CONTROL_TEXT_CHOICES.map((controlText) => ({ controlText })),
      ...CONTROL_HEIGHT_CHOICES.map((controlHeight) => ({ controlHeight })),
      {
        radius: 16,
        body: 'nunito',
        heading: 'fraunces',
        scale: 90,
        border: 2,
        shadow: 'strong',
        motion: 'reduced',
        cards: 'flat',
        tabs: 'pill',
        chart: 'accent',
        input: 'underline',
        focus: 'glow',
        button: 'ghost',
        controlRadius: 9999,
        cardRadius: 24,
        overlayRadius: 0,
        controlBorder: 2,
        labelWeight: 400,
        labelSpacing: 'wider',
        controlText: 2,
        controlHeight: -4,
      },
    ];
    for (const entry of THEME_CATALOGUE) {
      for (const axes of values) {
        const theme = customTheme(entry.id, set(axes), 'nexora-custom');
        expect(theme.name).toBe('nexora-custom');
        expect(renderTheme(theme)).toContain('[data-slotted-theme="nexora-custom"]');
      }
    }
  }, 120_000);

  it('writes nothing for an axis left to the theme', () => {
    expect(customOverrides(NO_CUSTOMISATION)).toEqual({});
    const theme = customTheme('nexora-corporate', NO_CUSTOMISATION, 'nexora-custom');
    const { name: _a, kind: _b, ...own } = nexoraTheme('nexora-corporate');
    const { name: _c, kind: _d, ...built } = theme;
    expect(built).toEqual(own);
  });

  /** One expectation per axis: the token the axis names and the value it writes. */
  it('moves the tokens each axis names', () => {
    const radius = customOverrides(set({ radius: 12 }));
    expect(radius.base).toMatchObject({
      '--slotted-radius-xs': '3px',
      '--slotted-radius-sm': '6px',
      '--slotted-radius-md': '9px',
      '--slotted-radius-lg': '12px',
      '--slotted-control-radius': 'var(--slotted-radius-sm)',
    });
    expect(radius.components).toMatchObject({
      '--slotted-card-radius': 'var(--slotted-radius-lg)',
    });

    const serif = customOverrides(set({ body: 'source-serif', heading: 'fraunces' }));
    expect(serif.base?.['--slotted-font-family-sans']).toMatch(/^'Source Serif 4 Variable',/);
    expect(serif.base?.['--slotted-control-font-family']).toBe('var(--slotted-font-family-sans)');
    expect(serif.base?.['--slotted-font-family-heading']).toMatch(/^'Fraunces Variable',/);
    expect(serif.fonts?.map((font) => font.family)).toEqual([
      'Source Serif 4 Variable',
      'Fraunces Variable',
    ]);
    const same = customOverrides(set({ body: 'outfit', heading: 'outfit' }));
    expect(same.fonts?.map((font) => font.family)).toEqual(['Outfit Variable']);
    const geist = customOverrides(set({ body: 'geist' }));
    expect(geist.base?.['--slotted-font-family-sans']).toMatch(/^'Geist Variable',/);
    expect(geist.fonts).toBeUndefined();

    const scale = customOverrides(set({ scale: 112 }));
    expect(scale.base?.['--slotted-font-size-md']).toBe('0.98rem');
    expect(scale.base?.['--slotted-font-size-4xl']).toBe('2.24rem');
    expect(scale.densities?.comfortable?.['--slotted-control-font-size-md']).toBe('14.56px');
    expect(scale.densities?.dense?.['--slotted-control-font-size-md']).toBeDefined();

    expect(customOverrides(set({ border: 2 })).base).toMatchObject({
      '--slotted-border-width-thin': '2px',
      '--slotted-border-width-thick': '3px',
      '--slotted-control-border-width': 'var(--slotted-border-width-thin)',
    });

    const flat = customOverrides(set({ shadow: 'none' }));
    for (const scheme of ['light', 'dark'] as const) {
      expect(flat.schemes?.[scheme]?.['--slotted-shadow-md']).toBe('none');
      expect(flat.schemes?.[scheme]?.['--slotted-control-shadow']).toBe('none');
    }
    expect(flat.schemes?.['high-contrast']).toBeUndefined();
    expect(customOverrides(set({ shadow: 'soft' })).schemes?.light?.['--slotted-shadow-md']).toBe(
      defaultTheme.schemes?.light?.['--slotted-shadow-md'],
    );

    expect(customOverrides(set({ motion: 'off' })).base).toMatchObject({
      '--slotted-duration-short': '1ms',
      '--slotted-duration-long': '1ms',
    });
    expect(customOverrides(set({ motion: 'reduced' })).base?.['--slotted-duration-medium']).toBe(
      '100ms',
    );

    expect(customOverrides(set({ cards: 'elevated' })).components).toMatchObject({
      '--slotted-card-border-width': '0px',
      '--slotted-card-shadow': 'var(--slotted-shadow-md)',
      '--slotted-stat-card-shadow': 'var(--slotted-shadow-md)',
    });
    expect(customOverrides(set({ cards: 'flat' })).components).toMatchObject({
      '--slotted-card-background': 'var(--slotted-surface-sunken)',
      '--slotted-card-shadow': 'none',
    });
    expect(customOverrides(set({ chart: 'accent' })).components).toMatchObject({
      '--slotted-chart-color-1': 'var(--slotted-tone-accent-solid)',
    });
    expect(customOverrides(set({ chart: 'palette' })).components).toMatchObject({
      '--slotted-chart-color-1': 'var(--slotted-data-1)',
    });
  });

  /**
   * The Controls axes, each at the level of the model it belongs to: the
   * input style moves every field family's own tokens and adds the frame's
   * rules; focus moves the focus tokens and adds rules where a token cannot
   * draw it; the button style is rules alone; the corners are a control token
   * and family tokens; the line, the label's weight and spacing are control
   * tokens; text size and height are each density's control tokens.
   */
  it('writes each Controls axis at its level of the model', () => {
    const filled = customOverrides(set({ input: 'filled' }));
    for (const { ui } of FIELD_FAMILIES) {
      expect(filled.components, ui).toMatchObject({
        [`--slotted-${ui}-background`]: 'var(--slotted-tone-secondary-surface)',
        [`--slotted-${ui}-border-color`]: 'var(--slotted-text-muted)',
        [`--slotted-${ui}-shadow`]: 'none',
      });
    }
    expect(filled.rules).toEqual(fieldRules('filled', 'ring'));
    expect(filled.base).toBeUndefined();
    expect(filled.rules!.join('\n')).toMatch(
      /\[data-ui='text-field'\]\[data-part='root'\]:not\(\[data-variant='plain'\]\) \{\n {2}border-style: solid;\n {2}border-width: 0 0 var\(--slotted-control-border-width\);/,
    );

    const offset = customOverrides(set({ focus: 'offset' }));
    expect(offset.base).toEqual({
      '--slotted-focus-ring-width': 'var(--slotted-border-width-thick)',
      '--slotted-focus-ring-offset': 'calc(2 * var(--slotted-border-width-thick))',
    });
    expect(offset.components).toBeUndefined();
    expect(offset.rules).toEqual([
      ...fieldRules('outlined', 'offset'),
      ...buttonRules('solid', 'offset'),
    ]);

    const soft = customOverrides(set({ button: 'soft' }));
    expect(soft.base).toBeUndefined();
    expect(soft.components).toBeUndefined();
    expect(soft.rules).toEqual(buttonRules('soft', 'ring'));
    expect(soft.rules!.join('\n')).toMatch(
      /background-color: var\(--slotted-tone-accent-surface\);[\s\S]*color: var\(--slotted-tone-accent-text\);/,
    );

    const pill = customOverrides(set({ controlRadius: 9999 }));
    expect(pill.base?.['--slotted-control-radius']).toBe('var(--slotted-radius-full)');
    expect(pill.components).toMatchObject({
      '--slotted-text-field-radius': 'var(--slotted-control-radius)',
      '--slotted-select-radius': 'var(--slotted-control-radius)',
      '--slotted-textarea-radius': 'var(--slotted-control-radius)',
    });
    expect(customOverrides(set({ controlRadius: 4 })).base?.['--slotted-control-radius']).toBe(
      'calc(var(--slotted-radius-none) + 4px)',
    );
    const cards = customOverrides(set({ cardRadius: 16 }));
    expect(cards.base).toBeUndefined();
    for (const token of CARD_RADIUS_TOKENS) expect(cards.components?.[token as never]).toBe('16px');
    const overlays = customOverrides(set({ overlayRadius: 24 }));
    for (const token of OVERLAY_RADIUS_TOKENS) {
      expect(overlays.components?.[token as never]).toBe('24px');
    }

    expect(customOverrides(set({ controlBorder: 2 })).base).toEqual({
      '--slotted-control-border-width': 'var(--slotted-border-width-thick)',
    });
    expect(customOverrides(set({ labelWeight: 700 })).base).toEqual({
      '--slotted-control-font-weight': 'calc(var(--slotted-font-weight-semibold) + 100)',
    });
    expect(customOverrides(set({ labelSpacing: 'wide' })).base).toEqual({
      '--slotted-control-letter-spacing': '0.02em',
    });

    /* Text size and height move the theme's own values, in every density, never below 24 px. */
    const corporate = nexoraTheme('nexora-corporate').densities!;
    const bigger = customOverrides(set({ controlText: 2, controlHeight: 8 }), 'nexora-corporate');
    expect(bigger.densities?.comfortable?.['--slotted-control-font-size-md']).toBe(
      `${Number.parseFloat(corporate.comfortable!['--slotted-control-font-size-md']!) + 2}px`,
    );
    expect(bigger.densities?.dense?.['--slotted-control-height-md']).toBe(
      `${Number.parseFloat(corporate.dense!['--slotted-control-height-md']!) + 8}px`,
    );
    const shorter = customOverrides(set({ controlHeight: -4 }));
    expect(shorter.densities?.comfortable?.['--slotted-control-height-md']).toBe('30px');
    expect(shorter.densities?.dense?.['--slotted-control-height-sm']).toBe('24px');
    expect(shorter.base).toBeUndefined();
    /* With the type scale set, the text size moves the scale's values. */
    expect(
      customOverrides(set({ scale: 112, controlText: 1 })).densities?.comfortable?.[
        '--slotted-control-font-size-md'
      ],
    ).toBe('15.56px');
  });

  /**
   * The input, focus and button rules are written for the three styles in
   * effect — each the reader's, or the theme's own — after the theme's own
   * rules, and they pass the theme-rule policy in every combination.
   */
  it('writes the Controls rules for the styles in effect, after the theme’s, within the policy', () => {
    const editorial = nexoraTheme('nexora-editorial');
    const built = customTheme('nexora-editorial', set({ focus: 'glow' }), 'x');
    expect(built.rules!.slice(0, editorial.rules!.length)).toEqual(editorial.rules);
    expect(built.rules!.slice(editorial.rules!.length)).toEqual([
      ...fieldRules('underline', 'glow'),
      ...buttonRules('outline', 'glow'),
    ]);
    for (const input of INPUT_CHOICES) {
      for (const focus of FOCUS_CHOICES) {
        for (const rule of fieldRules(input, focus)) {
          expect(ruleErrors(rule), `${input} × ${focus}`).toEqual([]);
        }
      }
    }
    for (const button of BUTTON_CHOICES) {
      for (const focus of FOCUS_CHOICES) {
        for (const rule of buttonRules(button, focus)) {
          expect(ruleErrors(rule), `${button} × ${focus}`).toEqual([]);
        }
      }
    }
  });

  /**
   * Every focus style keeps a solid mark of the ring's color where colors
   * are not forced — an outline, the field's line doubled, or a bar — and
   * every one is drawn inside `not (forced-colors: active)`, so under forced
   * colors each family's own outline in a system color marks focus.
   */
  it('draws every focus style in the ring’s color, and leaves forced colors to the families', () => {
    for (const focus of FOCUS_CHOICES) {
      const [frame, focused] = fieldRules('outlined', focus);
      expect(frame).not.toMatch(/focus/);
      expect(focused).toMatch(/^@media not \(forced-colors: active\) \{/);
      expect(focused).toMatch(/var\(--slotted-focus-ring-color\)/);
      const [buttons] = buttonRules('solid', focus);
      expect(buttons).toMatch(/^@media not \(forced-colors: active\) \{/);
      expect(buttons).toMatch(/\[data-ui='button'\]:not\(\[data-disabled\]\):focus-visible/);
    }
    /* The invalid edge stays wider than a valid line: the bottom edge under a bottom-line frame. */
    expect(fieldRules('underline', 'underline')[1]).toMatch(
      /inset 0 calc\(-1 \* \(var\(--slotted-border-width-thick\) \+ var\(--slotted-text-field-invalid-edge-width, var\(--slotted-control-invalid-edge-width\)\)\)\) 0/,
    );
    /*
     * The edge's color falls back to the danger border as the family's own
     * does: no theme declares a family's invalid border color, and an
     * undeclared `var()` with no fallback discards the whole box-shadow.
     */
    for (const { ui } of FIELD_FAMILIES) {
      expect(fieldRules('outlined', 'ring')[1]).toContain(
        `box-shadow: inset 0 0 0 var(--slotted-${ui}-invalid-edge-width, var(--slotted-control-invalid-edge-width)) var(--slotted-${ui}-invalid-border-color, var(--slotted-tone-danger-border));`,
      );
    }
  });

  /**
   * A field drawn by its fill alone — `borderless` at rest, `filled` above
   * its line — is found by that fill: it is never one of the grounds a form
   * stands on, where it would leave the label over nothing.
   */
  it('fills a fill-drawn field with a ground no page stands on', () => {
    const grounds = ['--slotted-surface', '--slotted-surface-raised', '--slotted-surface-sunken'];
    for (const input of ['filled', 'borderless'] as const) {
      for (const { ui } of FIELD_FAMILIES) {
        const fill = (inputTokens(input) as Record<string, string>)[`--slotted-${ui}-background`];
        expect(grounds.map((ground) => `var(${ground})`), `${input} ${ui}`).not.toContain(fill);
      }
    }
    /*
     * High-contrast paints the secondary surface in the page's white: there a
     * borderless field takes the control's line, under the theme's own scheme
     * on its root (`&[…]`) and under a nested scheme alike.
     */
    const [frame] = fieldRules('borderless', 'ring');
    for (const { ui } of FIELD_FAMILIES) {
      const field = `[data-ui='${ui}'][data-part='root']:not([data-variant='plain']):not([data-invalid])`;
      expect(frame).toContain(
        `&[data-slotted-scheme='high-contrast'] ${field} {\n  border-color: var(--slotted-control-border-color);\n}`,
      );
    }
    expect(fieldRules('filled', 'ring')[0]).not.toMatch(/high-contrast/);
    for (const rule of fieldRules('borderless', 'ring')) expect(ruleErrors(rule)).toEqual([]);
  });

  /**
   * The tabs axis is the same two styles a catalogue theme draws its tabs
   * with: the marker's and the track's tokens, and the rule no token reaches.
   * Its rule comes after the theme's own in the same layer, so an underline
   * laid over Expressive's pill undoes it.
   */
  it('draws the selected tab as an underline or a pill, over any theme', () => {
    const pill = customOverrides(set({ tabs: 'pill' }));
    expect(pill.components).toMatchObject({
      '--slotted-tabs-marker-color': 'transparent',
      '--slotted-tabs-hover-marker-color': 'transparent',
      '--slotted-tabs-track-color': 'transparent',
    });
    expect(pill.rules).toEqual([TAB_STYLES.pill.rule]);
    expect(pill.rules![0]).toMatch(/border-radius: var\(--slotted-radius-full\)/);

    const underline = customOverrides(set({ tabs: 'underline' }));
    expect(underline.components).toMatchObject({
      '--slotted-tabs-marker-color': 'var(--slotted-tone-accent-solid)',
      '--slotted-tabs-track-color': 'var(--slotted-border-subtle)',
    });
    expect(underline.rules).toEqual([TAB_STYLES.underline.rule]);
    expect(underline.rules![0]).toMatch(/background-color: transparent;/);

    expect(nexoraTheme('nexora-expressive').rules).toContain(TAB_STYLES.pill.rule);
    const css = renderTheme(customTheme('nexora-expressive', set({ tabs: 'underline' }), 'x'));
    expect(css.lastIndexOf('background-color: transparent;')).toBeGreaterThan(
      css.indexOf(
        'background-color: var(--slotted-tone-accent-surface);\n  border-radius: var(--slotted-radius-full)',
      ),
    );
  });

  /**
   * An axis moves every token of its kind a theme of the catalogue sets: a
   * corner, a face, a line weight or a shadow a theme wrote on one family
   * follows the builder too, so no theme keeps a corner or a shadow no axis
   * reaches. A token that only names a token an axis writes follows it already.
   */
  it('reaches every token of its kind a catalogue theme declares', () => {
    const all = set({
      radius: 10,
      body: 'geist',
      heading: 'geist',
      border: 1,
      shadow: 'soft',
      motion: 'normal',
      cards: 'bordered',
      input: 'outlined',
      controlRadius: 8,
      cardRadius: 8,
      overlayRadius: 8,
    });
    const overrides = customOverrides(all);
    const reached = new Set([
      ...Object.keys(overrides.base ?? {}),
      ...Object.keys(overrides.components ?? {}),
      ...SCHEMES.flatMap((scheme) => Object.keys(overrides.schemes?.[scheme] ?? {})),
    ]);
    const KINDS = /(radius|font-family|border-width|shadow|duration|easing)$/;
    /* The fixed ends of the radius scale, the loops of indeterminate indicators and the code face. */
    const SKIPPED = /^--slotted-(radius-(none|full)|duration-loop|font-family-mono)/;
    for (const entry of THEME_CATALOGUE) {
      const theme = nexoraTheme(entry.id);
      const declared: [string, string][] = [
        ...Object.entries(theme.base ?? {}),
        ...Object.entries(theme.components ?? {}),
        ...(['light', 'dark'] as const).flatMap((scheme) =>
          Object.entries(theme.schemes?.[scheme] ?? {}),
        ),
      ];
      const follows = (value: string) => {
        const named = /^var\((--slotted-[a-z0-9-]+)\)$/.exec(value)?.[1];
        return named !== undefined && reached.has(named);
      };
      expect(
        declared
          .filter(([token]) => KINDS.test(token) && !SKIPPED.test(token))
          .filter(([token, value]) => !reached.has(token) && !follows(value))
          .map(([token]) => token),
        entry.id,
      ).toEqual([]);
    }
  });
});
