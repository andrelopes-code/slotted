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
  brandTitle: 'Slotted · Angular',
  colorPrimary: '#1d4ed8',
  colorSecondary: '#1d4ed8',
  appBg: '#f1f5f9',
  appContentBg: '#ffffff',
  appHoverBg: '#e2e8f0',
  appPreviewBg: '#f8fafc',
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
  brandTitle: 'Slotted · Angular',
  colorPrimary: '#60a5fa',
  colorSecondary: '#60a5fa',
  appBg: '#020617',
  appContentBg: '#0f172a',
  appHoverBg: '#1e293b',
  appPreviewBg: '#0b1120',
  appBorderColor: '#334155',
  appBorderRadius: 8,
  fontBase: 'ui-sans-serif, system-ui, sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  textColor: '#f8fafc',
  textInverseColor: '#0f172a',
  textMutedColor: '#cbd5e1',
  barTextColor: '#cbd5e1',
  barHoverColor: '#f8fafc',
  barSelectedColor: '#60a5fa',
  barBg: '#0f172a',
  buttonBg: '#1e293b',
  buttonBorder: '#475569',
  booleanBg: '#334155',
  booleanSelectedBg: '#3b82f6',
  inputBg: '#111827',
  inputBorder: '#64748b',
  inputTextColor: '#f8fafc',
  inputBorderRadius: 6,
});

export const normalizeScheme = (scheme: unknown): SlottedScheme =>
  scheme === 'dark' ? 'dark' : 'light';

export const getStorybookTheme = (scheme: unknown): ThemeVars =>
  normalizeScheme(scheme) === 'dark' ? darkTheme : lightTheme;

export const getPreviewStyle = (scheme: unknown) => ({
  background: 'var(--slotted-button-outline-background)',
  color: 'var(--slotted-tone-neutral-text)',
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
