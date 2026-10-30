import type { Corner, Density, Scheme } from '@slotted/theme';
import { seedStyle, type SeedName } from '@slotted/theme/seeds';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/** The five seeds a theme derives its colours from (`@slotted/theme` › `SEED_NAMES`). */
export type ThemeSeedName = SeedName;
/** A recipe scheme (`@slotted/theme` › `Scheme`), plus `system`: resolved from `prefers-color-scheme`. */
export type ThemeSchemeName = Scheme | 'system';
export type ThemeDensityName = Density;
export type ThemeCornersName = Corner;

export interface ThemeScopeProps extends HTMLAttributes<HTMLElement> {
  /** The theme the subtree uses: the `name` of a loaded theme stylesheet. */
  theme?: string | undefined;
  scheme?: ThemeSchemeName | undefined;
  density?: ThemeDensityName | undefined;
  /** How round the corners are below this element; `--slotted-radius-full` stays. */
  corners?: ThemeCornersName | undefined;
  /** Seeds for this subtree. Every colour below is derived from them again. */
  seeds?: Readonly<Partial<Record<ThemeSeedName, string>>> | undefined;
  /** Renders another element in place of the `div`, with these props. */
  render?: ((props: HTMLAttributes<HTMLElement>) => ReactNode) | undefined;
  children?: ReactNode;
}

/**
 * A subtree with its own theme, scheme, density, corners or seeds. It writes the same
 * attributes and custom properties an application can write by hand; an
 * overlay opened inside it carries them to the end of the body.
 */
export function ThemeScope({
  theme,
  scheme,
  density,
  corners,
  seeds,
  render,
  style,
  ...rest
}: ThemeScopeProps) {
  const seedProperties = seedStyle(seeds ?? {});
  const seeded = Object.keys(seedProperties).length > 0;
  const props = {
    ...rest,
    'data-slotted-theme': theme,
    'data-slotted-scheme': scheme,
    'data-slotted-density': density,
    'data-slotted-corners': corners,
    'data-slotted-seeds': seeded ? '' : undefined,
    style: seeded ? ({ ...seedProperties, ...style } as CSSProperties) : style,
  } as HTMLAttributes<HTMLElement>;
  return render ? render(props) : <div {...(props as HTMLAttributes<HTMLDivElement>)} />;
}
