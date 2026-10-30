import { SCHEMES } from '@slotted/theme';
import { describe, expect, it } from 'vitest';

import { CONTRAST_TOKENS, contrastReadings } from './contrast-reading';
import { nexoraTheme } from './nexora-themes';
import { THEME_CATALOGUE } from './theme-catalogue';

describe('contrastReadings', () => {
  it('reads seven pairs in each of the three schemes, against the floors of recipe-checks', () => {
    const readings = contrastReadings('default', { accent: '#7c3aed' });

    expect(readings.map((reading) => reading.scheme)).toEqual(['light', 'dark', 'high-contrast']);
    for (const reading of readings) {
      expect(reading.pairs.map((pair) => pair.id)).toEqual([
        'text',
        'accent-text',
        'accent-border',
        'on-solid',
        'on-success',
        'on-warning',
        'on-danger',
      ]);
    }
    const floors = (scheme: string) =>
      readings.find((reading) => reading.scheme === scheme)!.pairs.map((pair) => pair.floor);
    expect(floors('light')).toEqual([4.5, 4.5, 3, 4.5, 4.5, 4.5, 4.5]);
    expect(floors('dark')).toEqual([4.5, 4.5, 3, 4.5, 4.5, 4.5, 4.5]);
    expect(floors('high-contrast')).toEqual([7, 7, 3, 7, 7, 7, 7]);
    for (const pair of readings.flatMap((reading) => reading.pairs)) {
      expect(pair.ratio).toBeGreaterThan(1);
      expect(pair.passes).toBe(pair.ratio >= pair.floor);
    }
  });

  it('moves the accent pairs with the brand and the text pair with the neutral', () => {
    const light = (seeds: Parameters<typeof contrastReadings>[1]) =>
      Object.fromEntries(
        contrastReadings('default', seeds)[0]!.pairs.map((pair) => [pair.id, pair.ratio]),
      );
    const violet = light({ accent: '#7c3aed' });
    const amber = light({ accent: '#d97706' });
    const warm = light({ accent: '#7c3aed', neutral: '#78716c' });

    expect(amber['accent-text']).not.toBe(violet['accent-text']);
    expect(amber['on-solid']).not.toBe(violet['on-solid']);
    expect(amber['text']).toBe(violet['text']);
    expect(warm['text']).not.toBe(violet['text']);
    expect(warm['on-solid']).toBe(violet['on-solid']);
  });

  /** A theme's own seeds hold for every seed the reader writes none of. */
  it('reads the theme’s own seeds under the reader’s', () => {
    const editorial = nexoraTheme('nexora-editorial');
    expect(contrastReadings('nexora-editorial', {})).toEqual(
      contrastReadings('nexora-editorial', { ...editorial.seeds }),
    );
    const danger = (seeds: Parameters<typeof contrastReadings>[1]) =>
      contrastReadings('nexora-editorial', seeds)[0]!.pairs.find((pair) => pair.id === 'on-danger')!
        .ratio;
    expect(danger({ danger: '#e11d48' })).not.toBe(danger({}));
  });

  /**
   * The readings are the theme's own recipe: Editorial lays its text on a
   * warmer, darker paper than Standard's ground, so the same grey reads
   * another ratio there than on Standard, and both stand at the floor.
   */
  it('reads each theme’s own recipe', () => {
    const text = (theme: string) =>
      contrastReadings(theme, { neutral: '#64748b' })[0]!.pairs.find((pair) => pair.id === 'text')!;
    expect(text('nexora-editorial').ratio).not.toBe(text('default').ratio);
    expect(text('nexora-editorial').passes).toBe(true);
    expect(text('default').passes).toBe(true);
  });

  /**
   * The recipe caps every solid's chroma at 0.25, so a seed past the 0.35 it
   * was calibrated over still lands at its floor: a sweep of such seeds for
   * the four tones finds no failing pair. The table's "Below" branch is drawn
   * from readings written by hand (`contrast-table.spec.ts`).
   */
  it('holds the floors for seeds past the calibrated chroma', () => {
    const failing: string[] = [];
    for (const tone of ['accent', 'success', 'warning', 'danger'] as const) {
      for (let hue = 0; hue < 360; hue += 30) {
        for (const lightness of [0.5, 0.7, 0.9]) {
          const seed = `oklch(${lightness} 0.4 ${hue})`;
          for (const reading of contrastReadings('default', { [tone]: seed })) {
            for (const pair of reading.pairs) {
              if (!pair.passes) failing.push(`${tone} ${seed} ${reading.scheme} ${pair.id}`);
            }
          }
        }
      }
    }
    expect(failing).toEqual([]);
  });

  /**
   * The readings are the recipe's arithmetic; a value a theme declares over the
   * recipe is not in them. Every theme of the catalogue leaves the six tokens
   * to the recipe, in `base`, in `components` and in every scheme.
   */
  it('reads only tokens no catalogue theme declares over the recipe', () => {
    for (const entry of THEME_CATALOGUE) {
      const theme = nexoraTheme(entry.id);
      const declared = [
        theme.base,
        theme.components,
        ...SCHEMES.map((scheme) => theme.schemes?.[scheme]),
      ].flatMap((values) => Object.keys(values ?? {}));
      expect(
        CONTRAST_TOKENS.filter((token) => declared.includes(token)),
        entry.id,
      ).toEqual([]);
    }
  });
});
