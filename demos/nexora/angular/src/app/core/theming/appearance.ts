import { seedStyle, type SeedName } from '@slotted/theme/seeds';

import { catalogueTheme } from './theme-catalogue';

/** The brand colours offered as one press; `custom` keeps a colour of the reader's own. */
export const BRAND_PRESETS = [
  { id: 'violet', label: 'Violet', color: '#7c3aed' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'emerald', label: 'Emerald', color: '#059669' },
  { id: 'amber', label: 'Amber', color: '#d97706' },
  { id: 'rose', label: 'Rose', color: '#e11d48' },
  { id: 'graphite', label: 'Graphite', color: '#3f3f46' },
] as const;
export type BrandPresetId = (typeof BRAND_PRESETS)[number]['id'];

export interface BrandPreference {
  /** `theme` keeps the accent the theme brings. */
  readonly preset: BrandPresetId | 'custom' | 'theme';
  /** The reader's own colour, `#rrggbb`; kept while a preset is chosen, so Custom brings it back. */
  readonly custom: string;
}

export const DEFAULT_BRAND: BrandPreference = { preset: 'theme', custom: '#7c3aed' };

/**
 * The grey every surface, border and muted text is derived from. `theme`
 * writes no seed, so the theme's own neutral holds. The four colours carry
 * enough chroma to tint a ground the reader can see, and stand apart from
 * every theme's own (`theme-catalogue.spec.ts`).
 */
export const NEUTRAL_PRESETS = [
  { id: 'theme', label: 'Theme', color: null },
  { id: 'ocean', label: 'Ocean', color: '#0e7490' },
  { id: 'clay', label: 'Clay', color: '#9c6644' },
  { id: 'sage', label: 'Sage', color: '#5b7f66' },
  { id: 'plum', label: 'Plum', color: '#7e5a86' },
] as const;
export type NeutralPresetId = (typeof NEUTRAL_PRESETS)[number]['id'];

export interface NeutralPreference {
  /** `theme` keeps the neutral the theme brings. */
  readonly preset: NeutralPresetId | 'custom';
  /** The reader's own grey, `#rrggbb`; kept while a preset is chosen, so Custom brings it back. */
  readonly custom: string;
}

export const DEFAULT_NEUTRAL: NeutralPreference = { preset: 'theme', custom: '#64748b' };

/** The three status seeds; `null` keeps the theme's own. */
export const STATUS_SEEDS = ['success', 'warning', 'danger'] as const;
export type StatusSeed = (typeof STATUS_SEEDS)[number];
export type StatusColours = Readonly<Record<StatusSeed, string | null>>;
export const NO_STATUS: StatusColours = { success: null, warning: null, danger: null };

/** The colours the status fields offer in their panels. */
export const STATUS_PRESETS: Readonly<Record<StatusSeed, readonly string[]>> = {
  success: ['#15803d', '#059669', '#0d9488', '#65a30d'],
  warning: ['#d97706', '#ca8a04', '#ea580c', '#facc15'],
  danger: ['#dc2626', '#e11d48', '#be123c', '#c2410c'],
};

/** The accent a brand writes over `theme`, or `null` when the theme's own holds. */
export function brandColor(brand: BrandPreference, theme: string): string | null {
  if (brand.preset === 'theme') return catalogueTheme(theme).accent;
  if (brand.preset === 'custom') return brand.custom;
  return BRAND_PRESETS.find((preset) => preset.id === brand.preset)?.color ?? DEFAULT_BRAND.custom;
}

export function isNeutralPreset(value: unknown): value is NeutralPresetId {
  return NEUTRAL_PRESETS.some((preset) => preset.id === value);
}

/** The neutral a grey writes, or `null` when the theme's own holds. */
export function neutralColor(neutral: NeutralPreference): string | null {
  if (neutral.preset === 'custom') return neutral.custom;
  return NEUTRAL_PRESETS.find((preset) => preset.id === neutral.preset)?.color ?? null;
}

/**
 * The seeds a reader's colours write over `theme`, in the shape `slThemeScope`
 * and `seedStyle` take: only the ones the reader chose, so the theme's own
 * hold for the rest.
 */
export function appearanceSeeds(
  theme: string,
  brand: BrandPreference,
  neutral: NeutralPreference,
  status: StatusColours = NO_STATUS,
): Partial<Record<SeedName, string>> {
  const seeds: Partial<Record<SeedName, string>> = {};
  const accent = brandColor(brand, theme);
  if (accent !== null) seeds.accent = accent;
  const grey = neutralColor(neutral);
  if (grey !== null) seeds.neutral = grey;
  for (const name of STATUS_SEEDS) {
    const color = status[name];
    if (color !== null) seeds[name] = color;
  }
  return seeds;
}

/**
 * A brand read back from storage, each half checked on its own. A known preset
 * holds, and a custom colour `seedStyle` refuses is replaced by the default's.
 * An unknown preset, or `custom` with a refused colour, reads as the default.
 */
export function readBrand(value: unknown): BrandPreference {
  if (typeof value !== 'object' || value === null) return DEFAULT_BRAND;
  const { preset, custom } = value as Partial<Record<keyof BrandPreference, unknown>>;
  const color = isSeed(custom) ? custom : null;
  if (preset === 'theme' || BRAND_PRESETS.some((entry) => entry.id === preset)) {
    return { preset: preset as BrandPreference['preset'], custom: color ?? DEFAULT_BRAND.custom };
  }
  return preset === 'custom' && color !== null ? { preset, custom: color } : DEFAULT_BRAND;
}

/**
 * A grey read back from storage, as a brand is: a known preset holds with a
 * refused custom colour replaced by the default's, and an unknown preset, or
 * `custom` with a refused colour, reads as the default.
 */
export function readNeutral(value: unknown): NeutralPreference {
  if (typeof value !== 'object' || value === null) return DEFAULT_NEUTRAL;
  const { preset, custom } = value as Partial<Record<keyof NeutralPreference, unknown>>;
  const color = isSeed(custom) ? custom : null;
  if (isNeutralPreset(preset)) return { preset, custom: color ?? DEFAULT_NEUTRAL.custom };
  return preset === 'custom' && color !== null ? { preset, custom: color } : DEFAULT_NEUTRAL;
}

/** Status colours read back from storage: each one a seed, or the theme's own. */
export function readStatus(value: unknown): StatusColours {
  if (typeof value !== 'object' || value === null) return NO_STATUS;
  const stored = value as Partial<Record<StatusSeed, unknown>>;
  return {
    success: isSeed(stored.success) ? stored.success : null,
    warning: isSeed(stored.warning) ? stored.warning : null,
    danger: isSeed(stored.danger) ? stored.danger : null,
  };
}

/** Whether `seedStyle` takes `value` as a seed: `#rgb`, `#rrggbb` or `oklch(L C H)`. */
export function isSeed(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    seedStyle({ accent: value });
    return true;
  } catch {
    return false;
  }
}
