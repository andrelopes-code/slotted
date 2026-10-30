import {
  contrast,
  CONTRAST_REQUIREMENT,
  evaluateRecipe,
  parseSeed,
  SCHEMES,
  SEED_NAMES,
  type Oklch,
  type Scheme,
  type SeedName,
} from '@slotted/theme';

import { CONTRAST_PAIRS as PAIRS, type ContrastPairId } from './contrast-pairs';
import { nexoraTheme } from './nexora-themes';

/** recipe-checks' floor for a mark that is not text: a border, a focus ring. */
const NON_TEXT = 3;

/**
 * The tokens the readings take from the recipe. A theme that declares one of
 * them in `base`, `components` or a scheme paints a value the recipe does not
 * compute, so no catalogue theme does (`contrast-reading.spec.ts`).
 */
export const CONTRAST_TOKENS: readonly string[] = [
  ...new Set(PAIRS.flatMap((pair) => [pair.fore, pair.ground])),
];

export interface ContrastPair {
  readonly id: ContrastPairId;
  readonly label: string;
  readonly ratio: number;
  readonly floor: number;
  readonly passes: boolean;
}

export interface ContrastReading {
  readonly scheme: Scheme;
  readonly pairs: readonly ContrastPair[];
}

/**
 * The ratios a theme's recipe computes for the reader's seeds, scheme by
 * scheme: the same arithmetic the browser runs on the `oklch(from …)` the
 * sheet writes, so the numbers are the ones painted. The floors are
 * `CONTRAST_REQUIREMENT` for text and 3:1 for a border.
 */
export function contrastReadings(
  themeId: string,
  seeds: Readonly<Partial<Record<SeedName, string>>>,
): ContrastReading[] {
  const theme = nexoraTheme(themeId);
  const parsed = Object.fromEntries(
    SEED_NAMES.map((name) => [name, parseSeed(seeds[name] ?? theme.seeds[name])!]),
  ) as Record<SeedName, Oklch>;
  return SCHEMES.map((scheme) => {
    const values = evaluateRecipe(theme.recipe, parsed, scheme);
    return {
      scheme,
      pairs: PAIRS.map((pair) => {
        const ratio = contrast(values[pair.fore]!, values[pair.ground]!);
        const floor = pair.text ? CONTRAST_REQUIREMENT[scheme] : NON_TEXT;
        return { id: pair.id, label: pair.label, ratio, floor, passes: ratio >= floor };
      }),
    };
  });
}
