import { parseSeed } from './color';

/**
 * The seeds: the colors every derived color token is computed from. This
 * module is the entry `@slotted/theme/seeds`, which writes a reader's seeds
 * without loading the contract, the validator or the renderer.
 */
export const SEED_NAMES = ['accent', 'neutral', 'success', 'info', 'warning', 'danger'] as const;
export type SeedName = (typeof SEED_NAMES)[number];

/** The `style` object that gives an element its own seeds, for React `style` and Angular `[style]`. */
export function seedStyle(
  seeds: Readonly<Partial<Record<SeedName, string>>>,
): Record<string, string> {
  const style: Record<string, string> = {};
  for (const name of SEED_NAMES) {
    const value = seeds[name];
    if (value === undefined) continue;
    if (parseSeed(value) === null) {
      throw new Error(`seed ${name} ${JSON.stringify(value)} is neither #rrggbb nor oklch(L C H)`);
    }
    style[`--slotted-seed-${name}`] = value;
  }
  return style;
}
