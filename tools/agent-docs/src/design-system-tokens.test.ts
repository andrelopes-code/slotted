import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { groupCovers } from '../../../packages/theme/src/token-groups.ts';
import { designTokens, loadFlatTheme, type DesignTokens } from './design-system-tokens.ts';
import { loadTokenSource } from './tokens.ts';

const root = resolve(import.meta.dirname, '../../..');
const source = loadTokenSource(root);
const flat = await loadFlatTheme(root);
const meta = { ref: 'main@0000000', synced: '2026-10-16' };
const { tokens, dropped } = designTokens({ source, flat, meta });

/** The Design System type's name grammar: `format.md`, "tokens.json grammar". */
const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const COLOR =
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgba?|hsla?|oklch|oklab|lab|lch)\([0-9.%\s,/+-]+\))$/;
const listFamilies = (value: DesignTokens) =>
  Object.entries(value).filter(
    ([key, family]) =>
      key !== 'type' && typeof family === 'object' && family !== null && 'tokens' in family,
  ) as [string, { tokens: { name: string; value: unknown; usage: string }[] }][];

describe('designTokens', () => {
  it('names the three schemes, the primary first', () => {
    expect(tokens.color.themes.map((theme) => theme.id)).toEqual([
      'light',
      'dark',
      'high-contrast',
    ]);
  });

  it('writes every token of every list family once, under a name the type reads, with a usage note', () => {
    const names = listFamilies(tokens).flatMap(([, family]) => family.tokens.map((t) => t.name));
    expect(names.filter((name) => !NAME.test(name))).toEqual([]);
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
    const silent = listFamilies(tokens).flatMap(([, family]) =>
      family.tokens.filter((token) => token.usage.trim() === '').map((token) => token.name),
    );
    expect(silent).toEqual([]);
  });

  it('gives each colour a value the type reads in every scheme, and drops what is no colour', () => {
    const notHex = tokens.color.tokens.filter(
      (token) => !Object.values(token.value).every((value) => COLOR.test(value)),
    );
    expect(notHex.map((token) => token.name)).toEqual([]);
    expect(tokens.color.tokens.find((token) => token.name === 'slotted-surface')?.value).toEqual({
      light: expect.stringMatching(HEX),
      dark: expect.stringMatching(HEX),
      'high-contrast': expect.stringMatching(HEX),
    });
    expect(tokens.color.tokens.find((token) => token.name === 'slotted-scrim')?.value.dark).toBe(
      'rgb(0 0 0 / 0.62)',
    );
    /* A scheme token that is no colour: the material's filter varies by scheme too. */
    expect(dropped).toEqual([
      '--slotted-material-backdrop',
      '--slotted-control-shadow',
      '--slotted-current-edge',
    ]);
    /* A state layer is the text colour at a share over transparency. */
    expect(
      tokens.color.tokens.find((token) => token.name === 'slotted-state-hover')?.value.light,
    ).toMatch(/^rgb\(\d+ \d+ \d+ \/ 0\.05\)$/);
  });

  it('carries every colour token the application reads, by scheme', () => {
    const read = source.tokens.filter(
      (token) =>
        token.axis === 'scheme' &&
        source.groups.some(
          (group) =>
            group.reader === 'application' &&
            group.id !== 'shadow' &&
            groupCovers(group, token.name),
        ),
    );
    const written = new Set(tokens.color.tokens.map((token) => `--${token.name}`));
    expect(
      read
        .map((token) => token.name)
        .filter((name) => !written.has(name) && !dropped.includes(name)),
    ).toEqual([]);
  });

  it('writes the scales with the default values and the type styles step by step', () => {
    expect(tokens.spacing.tokens.find((token) => token.name === 'slotted-space-6')?.value).toBe(
      '1rem',
    );
    expect(tokens.radius.tokens.map((token) => token.name)).toContain('slotted-radius-md');
    expect(Object.keys(tokens.type.families)).toEqual(['sans', 'mono', 'heading']);
    expect(tokens.type.groups[0]!.styles.find((style) => style.name === 'md')).toEqual({
      name: 'md',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      fontWeight: 400,
      usage: expect.any(String),
    });
  });

  it('records where it was read from', () => {
    expect(tokens.meta).toMatchObject({
      source: 'github',
      ref: 'main@0000000',
      synced: '2026-10-16',
    });
  });
});
