export const INITIAL_GLOBALS = {
  theme: 'default',
  scheme: 'light',
  density: 'comfortable',
} as const;

export const GLOBAL_TYPES = {
  theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
  scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
  density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
} as const;

type StorybookGlobals = Record<string, unknown> | undefined;

export function resolveWorkbenchGlobals(globals: StorybookGlobals) {
  const theme = globals?.['theme'] === 'default' ? 'default' : 'default';
  const scheme = globals?.['scheme'] === 'dark' ? 'dark' : 'light';
  const density = globals?.['density'] === 'compact' ? 'compact' : 'comfortable';

  return {
    background: scheme === 'dark' ? '#0e1117' : '#f4f6f8',
    density,
    scheme,
    theme,
  } as const;
}
