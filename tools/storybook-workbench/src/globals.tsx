/**
 * The toolbar has to offer every axis the theme emits, or the reviewer cannot
 * see what the law requires. High contrast, the dense density and a
 * right-to-left document are as much part of a family's contract as light and
 * dark, and a family is judged in Storybook before it is judged anywhere else.
 */
export const SCHEMES = ['light', 'dark', 'high-contrast'] as const;
export const DENSITIES = ['comfortable', 'compact', 'dense'] as const;
export const DIRECTIONS = ['ltr', 'rtl'] as const;
/**
 * The languages the library publishes a catalog for. A story is read in each
 * of them without a line of its own, the same way it is read right to left.
 */
export const LOCALES = ['en-US', 'pt-BR'] as const;

/**
 * One entry per theme package whose stylesheet the preview loads. The value
 * written to `data-slotted-theme` is what selects that theme's block, so a
 * name no loaded stylesheet carries leaves the subtree with no custom property
 * defined at all: every family falls through to the system colours it keeps as
 * a last resort, and a `transition` naming an undefined duration is dropped
 * whole. That is what a grey, motionless workbench means.
 */
export const THEMES = ['default'] as const;

export type WorkbenchTheme = (typeof THEMES)[number];
export type WorkbenchScheme = (typeof SCHEMES)[number];
export type WorkbenchDensity = (typeof DENSITIES)[number];
export type WorkbenchDirection = (typeof DIRECTIONS)[number];
export type WorkbenchLocale = (typeof LOCALES)[number];

/** The canvas each scheme is previewed against, outside the component's surface. */
const CANVAS: Record<WorkbenchScheme, string> = {
  light: '#f4f6f8',
  dark: '#09090b',
  'high-contrast': '#ffffff',
};

export const INITIAL_GLOBALS = {
  theme: 'default',
  scheme: 'light',
  density: 'comfortable',
  direction: 'ltr',
  locale: 'en-US',
} as const;

export const GLOBAL_TYPES = {
  theme: { toolbar: { icon: 'paintbrush', items: [...THEMES] as string[] } },
  scheme: { toolbar: { icon: 'contrast', items: [...SCHEMES] as string[] } },
  density: { toolbar: { icon: 'component', items: [...DENSITIES] as string[] } },
  direction: { toolbar: { icon: 'transfer', items: [...DIRECTIONS] as string[] } },
  locale: { toolbar: { icon: 'globe', items: [...LOCALES] as string[] } },
} as const;

type StorybookGlobals = Record<string, unknown> | undefined;

function oneOf<T extends string>(values: readonly T[], value: unknown, fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

export function resolveWorkbenchGlobals(globals: StorybookGlobals) {
  const theme = oneOf(THEMES, globals?.['theme'], 'default');
  const scheme = oneOf(SCHEMES, globals?.['scheme'], 'light');
  const density = oneOf(DENSITIES, globals?.['density'], 'comfortable');
  const direction = oneOf(DIRECTIONS, globals?.['direction'], 'ltr');
  const locale = oneOf(LOCALES, globals?.['locale'], 'en-US');

  return {
    background: CANVAS[scheme],
    density,
    direction,
    locale,
    scheme,
    theme,
  } as const;
}
