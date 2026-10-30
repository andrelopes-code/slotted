import { describe, expect, it } from 'vitest';

import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';

import {
  getPreviewStyle,
  getStorybookTheme,
  readSchemeFromSearch,
  subscribeToScheme,
} from './theme';

const relativeLuminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  const [red, green, blue] = channels ?? [];

  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
};

const contrastRatio = (foreground: string, background: string) => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));

  return (lighter + 0.05) / (darker + 0.05);
};

const NEUTRAL_CHANNEL_SPREAD = 12;

const channelSpread = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16));

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hex}`);
  }

  return Math.max(...channels) - Math.min(...channels);
};

describe('Angular Storybook theme', () => {
  it.each(['light', 'dark'] as const)(
    'keeps manager, panel, and input text readable in the %s scheme',
    (scheme) => {
      const theme = getStorybookTheme(scheme);

      expect(theme.base).toBe(scheme);
      expect(contrastRatio(theme.textColor, theme.appContentBg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.barTextColor, theme.barBg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colorSecondary, theme.appHoverBg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.inputTextColor, theme.inputBg)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('falls back to a complete light theme for an unknown global value', () => {
    expect(getStorybookTheme('unexpected').base).toBe('light');
  });

  it('keeps the dark chrome on the neutral carbon ramp of the default theme', () => {
    const theme = getStorybookTheme('dark');

    expect(theme.appBg).toBe('#09090b');
    expect(theme.appPreviewBg).toBe('#09090b');
    expect(theme.appContentBg).toBe('#111113');
    expect(theme.appBorderColor).toBe('#27272a');
    expect(theme.textColor).toBe('#fafafa');
    expect(theme.textMutedColor).toBe('#a1a1aa');

    const neutralSurfaces = [
      theme.appBg,
      theme.appContentBg,
      theme.appHoverBg,
      theme.appPreviewBg,
      theme.appBorderColor,
      theme.barBg,
      theme.buttonBg,
      theme.buttonBorder,
      theme.booleanBg,
      theme.booleanSelectedBg,
      theme.inputBg,
      theme.inputBorder,
      theme.colorPrimary,
      theme.colorSecondary,
      theme.textColor,
      theme.textMutedColor,
      theme.barTextColor,
    ];

    for (const color of neutralSurfaces) {
      expect(channelSpread(color)).toBeLessThanOrEqual(NEUTRAL_CHANNEL_SPREAD);
    }
  });

  it('derives the preview foreground, background, and native scheme together', () => {
    expect(getPreviewStyle('dark')).toMatchObject({
      background: 'var(--slotted-workbench-canvas)',
      color: 'var(--slotted-workbench-text)',
      colorScheme: 'dark',
    });
  });

  it('reads the scheme the manager query string carries on boot', () => {
    expect(readSchemeFromSearch('')).toBe('light');
    expect(readSchemeFromSearch('?path=/story/button--primary')).toBe('light');
    expect(readSchemeFromSearch('?globals=scheme:light')).toBe('light');
    expect(readSchemeFromSearch('?globals=scheme:dark')).toBe('dark');
    expect(readSchemeFromSearch('?path=/docs/button&globals=density:compact;scheme:dark')).toBe(
      'dark',
    );
  });

  it('adopts the preview boot globals and later changes, then unsubscribes on cleanup', () => {
    type Listener = (payload: { globals: Record<string, unknown> }) => void;
    const listeners = new Map<string, Set<Listener>>();
    const channel = {
      on: (event: string, listener: Listener) => {
        listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
      },
      off: (event: string, listener: Listener) => {
        listeners.get(event)?.delete(listener);
      },
    };
    const emit = (event: string, scheme: string) => {
      for (const listener of listeners.get(event) ?? []) {
        listener({ globals: { scheme } });
      }
    };
    const appliedSchemes: string[] = [];
    const unsubscribe = subscribeToScheme(channel, 'light', (scheme) => {
      appliedSchemes.push(scheme);
    });

    emit(SET_GLOBALS, 'dark');
    emit(GLOBALS_UPDATED, 'light');

    expect(appliedSchemes).toEqual(['light', 'dark', 'light']);

    unsubscribe();
    emit(SET_GLOBALS, 'dark');
    emit(GLOBALS_UPDATED, 'dark');

    expect(appliedSchemes).toEqual(['light', 'dark', 'light']);
  });
});
