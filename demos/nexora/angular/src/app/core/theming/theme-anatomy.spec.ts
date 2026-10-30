import defaultTheme from '@slotted/themes/default';
import { describe, expect, it } from 'vitest';

import { customTheme } from './custom-theme';
import { NO_CUSTOMISATION } from './customization';
import { nexoraTheme } from './nexora-themes';
import { ANATOMY_LAYERS, customizationAnatomy, themeAnatomy } from './theme-anatomy';
import { RUNTIME_THEME_IDS } from './theme-catalogue';

const count = (theme: Parameters<typeof themeAnatomy>[0], layer: string) =>
  themeAnatomy(theme).find((entry) => entry.id === layer)!.count;

describe('themeAnatomy', () => {
  it('reads the nine layers of a theme, in the order a theme is built', () => {
    expect(themeAnatomy(defaultTheme).map((layer) => layer.id)).toEqual(ANATOMY_LAYERS);
    expect(ANATOMY_LAYERS).toEqual([
      'seeds',
      'recipe',
      'base',
      'schemes',
      'densities',
      'motion',
      'components',
      'rules',
      'fonts',
    ]);
  });

  /** The library's own theme is the reference: its six seeds, and nothing laid over it. */
  it('reads the library’s theme as six seeds and nothing over the reference', () => {
    const anatomy = themeAnatomy(defaultTheme);
    expect(anatomy.find((layer) => layer.id === 'seeds')!.items).toEqual([
      'accent #1d4ed8',
      'neutral #64748b',
      'success #15803d',
      'info oklch(0.6 0.15 255)',
      'warning #facc15',
      'danger #dc2626',
    ]);
    expect(anatomy.filter((layer) => layer.id !== 'seeds').map((layer) => layer.count)).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  /** The counts are the theme object's own: what differs from the library's, layer by layer. */
  it('counts what a catalogue theme lays over the library’s', () => {
    const editorial = nexoraTheme('nexora-editorial');
    expect(count(editorial, 'components')).toBe(Object.keys(editorial.components!).length);
    expect(count(editorial, 'rules')).toBe(editorial.rules!.length);
    expect(count(editorial, 'fonts')).toBe(3);
    expect(themeAnatomy(editorial).find((layer) => layer.id === 'fonts')!.items).toEqual([
      'Source Serif 4 Variable',
      'Fraunces Variable',
      'Source Sans 3 Variable',
    ]);
    const components = themeAnatomy(editorial).find((layer) => layer.id === 'components')!;
    expect(components.items.some((item) => /^card ·/.test(item))).toBe(true);
    for (const id of RUNTIME_THEME_IDS) {
      for (const layer of themeAnatomy(nexoraTheme(id))) {
        expect(layer.count, `${id} ${layer.id}`).toBeGreaterThan(0);
      }
    }
  });

  /** The builder's output is a theme of the same shape; an axis shows in the layer it writes. */
  it('reads a custom theme as one more theme of the same shape', () => {
    const base = nexoraTheme('nexora-expressive');
    const custom = customTheme(
      'nexora-expressive',
      { ...NO_CUSTOMISATION, cards: 'flat', motion: 'off' },
      'nexora-custom',
    );
    expect(themeAnatomy(custom).map((layer) => layer.id)).toEqual(ANATOMY_LAYERS);
    expect(count(custom, 'rules')).toBe(count(base, 'rules'));
    expect(count(custom, 'components')).toBeGreaterThanOrEqual(count(base, 'components'));
    expect(count(custom, 'base')).toBeGreaterThanOrEqual(count(base, 'base'));
  });

  /**
   * A customization read axis by axis: each axis a reader set, with the layers
   * of the model it writes and how many entries in each — what the anatomy
   * shows beside the theme's own.
   */
  it('reads each customized axis by the layers it writes', () => {
    const read = customizationAnatomy('nexora-expressive', {
      ...NO_CUSTOMISATION,
      input: 'underline',
      focus: 'offset',
      button: 'ghost',
      cardRadius: 8,
      labelWeight: 700,
      controlHeight: 4,
      motion: 'off',
    });
    const layers = (axis: string) =>
      Object.fromEntries(
        read.find((entry) => entry.axis === axis)!.layers.map((layer) => [layer.id, layer.count]),
      );
    expect(read.map((entry) => entry.axis)).toEqual([
      'motion',
      'input',
      'focus',
      'button',
      'cardRadius',
      'labelWeight',
      'controlHeight',
    ]);
    expect(layers('input')).toEqual({ components: 36, rules: 2 });
    expect(layers('focus')).toEqual({ base: 2, rules: 3 });
    expect(layers('button')).toEqual({ rules: 1 });
    expect(layers('cardRadius')).toEqual({ components: 6 });
    expect(layers('labelWeight')).toEqual({ base: 1 });
    expect(layers('controlHeight')).toEqual({ densities: 9 });
    expect(layers('motion')).toEqual({ motion: 4 });
    expect(customizationAnatomy('default', NO_CUSTOMISATION)).toEqual([]);
  });
});
