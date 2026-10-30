import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { applyTheme, THEME_CHANGE_EVENT, type ThemeChangeDetail } from './apply';
import { defineTheme, type Theme, type ThemeDefinition } from './define';
import { recipes } from './recipes';
import { seedStyle } from './seeds';

// jsdom's `URL` (the test environment's global) rejects a `file:` base, so this
// resolves the path with `node:path` rather than `new URL(..., import.meta.url)`.
const values = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../themes/src/default/values.json'), 'utf8'),
) as Omit<ThemeDefinition, 'name' | 'seeds' | 'recipe'>;
const SEEDS = {
  accent: '#1d4ed8',
  neutral: '#64748b',
  success: '#15803d',
  info: 'oklch(0.6 0.15 255)',
  warning: '#facc15',
  danger: '#dc2626',
};
const theme = (accent: string) =>
  defineTheme({ ...values, name: 'live', seeds: { ...SEEDS, accent }, recipe: recipes.standard });

afterEach(() => {
  document.head.innerHTML = '';
});

describe('applyTheme', () => {
  it('keeps one stylesheet per theme name and replaces its content', () => {
    applyTheme(theme('#1d4ed8'));
    applyTheme(theme('#e11d48'));
    const sheets = document.head.querySelectorAll('style[data-slotted-theme-sheet="live"]');
    expect(sheets).toHaveLength(1);
    expect(sheets[0]!.textContent).toContain('--slotted-seed-accent: #e11d48;');
  });

  it('announces the change, and the removal', () => {
    const seen: ThemeChangeDetail[] = [];
    const listener = (event: Event) => seen.push((event as CustomEvent<ThemeChangeDetail>).detail);
    document.addEventListener(THEME_CHANGE_EVENT, listener);
    const dispose = applyTheme(theme('#1d4ed8'));
    dispose();
    dispose();
    document.removeEventListener(THEME_CHANGE_EVENT, listener);
    expect(seen).toEqual([
      { name: 'live', applied: true },
      { name: 'live', applied: false },
    ]);
    expect(document.head.querySelector('style[data-slotted-theme-sheet]')).toBeNull();
  });

  it('leaves a later call in place when an earlier call for the same name disposes', () => {
    const seen: ThemeChangeDetail[] = [];
    const listener = (event: Event) => seen.push((event as CustomEvent<ThemeChangeDetail>).detail);
    document.addEventListener(THEME_CHANGE_EVENT, listener);

    const disposeFirst = applyTheme(theme('#1d4ed8'));
    const disposeSecond = applyTheme(theme('#e11d48'));

    disposeFirst();
    const sheet = document.head.querySelector('style[data-slotted-theme-sheet="live"]');
    expect(sheet).not.toBeNull();
    expect(sheet!.textContent).toContain('--slotted-seed-accent: #e11d48;');
    expect(seen).toEqual([
      { name: 'live', applied: true },
      { name: 'live', applied: true },
    ]);

    disposeFirst();
    expect(document.head.querySelector('style[data-slotted-theme-sheet="live"]')).not.toBeNull();
    expect(seen).toHaveLength(2);

    disposeSecond();
    expect(document.head.querySelector('style[data-slotted-theme-sheet="live"]')).toBeNull();
    expect(seen).toEqual([
      { name: 'live', applied: true },
      { name: 'live', applied: true },
      { name: 'live', applied: false },
    ]);

    disposeSecond();
    expect(seen).toHaveLength(3);
  });
});

describe('applyTheme in a document without constructed stylesheets', () => {
  it('writes the nonce a style-src policy allows on the <style> element', () => {
    expect(document.adoptedStyleSheets).toBeUndefined();

    applyTheme(theme('#1d4ed8'), { nonce: 'r4nd0m' });

    const sheet = document.head.querySelector<HTMLStyleElement>('style[data-slotted-theme-sheet]');
    expect(sheet!.nonce).toBe('r4nd0m');
  });
});

describe('applyTheme on a theme that did not come from defineTheme', () => {
  it('refuses it before the name reaches a selector or a value reaches the page', () => {
    const seen: Event[] = [];
    const listener = (event: Event) => seen.push(event);
    document.addEventListener(THEME_CHANGE_EVENT, listener);
    const forged = JSON.parse(JSON.stringify(theme('#1d4ed8'))) as Theme;
    for (const overrides of [
      { name: 'live"], * { color: red } [x="' },
      { components: { '--slotted-card-radius': '0; } * { color: red' } },
    ]) {
      expect(() => applyTheme({ ...forged, ...overrides } as Theme)).toThrow(/^Invalid theme /);
    }
    document.removeEventListener(THEME_CHANGE_EVENT, listener);
    expect(document.head.querySelector('style')).toBeNull();
    expect(seen).toHaveLength(0);
  });
});

describe('seedStyle', () => {
  it('names each seed as its custom property', () => {
    expect(seedStyle({ accent: '#e11d48', neutral: 'oklch(0.5 0.02 60)' })).toEqual({
      '--slotted-seed-accent': '#e11d48',
      '--slotted-seed-neutral': 'oklch(0.5 0.02 60)',
    });
  });

  it('refuses a value that is not a seed', () => {
    expect(() => seedStyle({ accent: 'banana' })).toThrow(
      'seed accent "banana" is neither #rrggbb nor oklch(L C H)',
    );
  });

  it('refuses a named color and a functional notation this library does not parse', () => {
    expect(() => seedStyle({ accent: 'red' })).toThrow(
      'seed accent "red" is neither #rrggbb nor oklch(L C H)',
    );
    expect(() => seedStyle({ neutral: 'rgb(0 0 0)' })).toThrow(
      'seed neutral "rgb(0 0 0)" is neither #rrggbb nor oklch(L C H)',
    );
  });
});
