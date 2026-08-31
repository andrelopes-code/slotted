import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { create, type ThemeVars } from 'storybook/theming';

export type SlottedScheme = 'light' | 'dark';

export type SchemeRoot = {
  dataset: Record<string, string | undefined>;
  style: { colorScheme: string };
};

type SchemePayload = { globals: Record<string, unknown> };

type SchemeChannel = {
  on: (event: string, listener: (payload: SchemePayload) => void) => unknown;
  off: (event: string, listener: (payload: SchemePayload) => void) => unknown;
};

const lightTheme = create({
  base: 'light',
  brandTitle: 'Slotted · React',
  colorPrimary: '#1d4ed8',
  colorSecondary: '#1d4ed8',
  appBg: '#f1f5f9',
  appContentBg: '#ffffff',
  appHoverBg: '#e2e8f0',
  appPreviewBg: '#eef1f5',
  appBorderColor: '#cbd5e1',
  appBorderRadius: 8,
  fontBase: 'ui-sans-serif, system-ui, sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  textColor: '#0f172a',
  textInverseColor: '#ffffff',
  textMutedColor: '#475569',
  barTextColor: '#334155',
  barHoverColor: '#1d4ed8',
  barSelectedColor: '#1d4ed8',
  barBg: '#ffffff',
  buttonBg: '#f8fafc',
  buttonBorder: '#94a3b8',
  booleanBg: '#cbd5e1',
  booleanSelectedBg: '#2563eb',
  inputBg: '#ffffff',
  inputBorder: '#94a3b8',
  inputTextColor: '#0f172a',
  inputBorderRadius: 6,
});

const darkTheme = create({
  base: 'dark',
  brandTitle: 'Slotted · React',
  colorPrimary: '#d4d4d8',
  colorSecondary: '#d4d4d8',
  appBg: '#09090b',
  appContentBg: '#111113',
  appHoverBg: '#27272a',
  appPreviewBg: '#09090b',
  appBorderColor: '#27272a',
  appBorderRadius: 8,
  fontBase: 'ui-sans-serif, system-ui, sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  textColor: '#fafafa',
  textInverseColor: '#18181b',
  textMutedColor: '#a1a1aa',
  barTextColor: '#a1a1aa',
  barHoverColor: '#fafafa',
  barSelectedColor: '#fafafa',
  barBg: '#111113',
  buttonBg: '#18181b',
  buttonBorder: '#3f3f46',
  booleanBg: '#27272a',
  booleanSelectedBg: '#52525b',
  inputBg: '#18181b',
  inputBorder: '#3f3f46',
  inputTextColor: '#fafafa',
  inputBorderRadius: 6,
});

export const normalizeScheme = (scheme: unknown): SlottedScheme =>
  scheme === 'dark' ? 'dark' : 'light';

export const getStorybookTheme = (scheme: unknown): ThemeVars =>
  normalizeScheme(scheme) === 'dark' ? darkTheme : lightTheme;

export const getPreviewStyle = (scheme: unknown) => ({
  background: 'var(--slotted-workbench-canvas)',
  color: 'var(--slotted-workbench-text)',
  colorScheme: normalizeScheme(scheme),
});

export const applyRootScheme = (root: SchemeRoot, scheme: unknown) => {
  const normalizedScheme = normalizeScheme(scheme);

  root.dataset['slottedScheme'] = normalizedScheme;
  root.style.colorScheme = normalizedScheme;

  return normalizedScheme;
};

export const subscribeToScheme = (
  channel: SchemeChannel,
  initialScheme: unknown,
  applyScheme: (scheme: SlottedScheme) => void,
) => {
  const handleGlobalsUpdated = ({ globals }: SchemePayload) => {
    applyScheme(normalizeScheme(globals['scheme']));
  };

  applyScheme(normalizeScheme(initialScheme));
  channel.on(GLOBALS_UPDATED, handleGlobalsUpdated);

  return () => {
    channel.off(GLOBALS_UPDATED, handleGlobalsUpdated);
  };
};
