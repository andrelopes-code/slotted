import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadTokenSource, renderTokens, resolveValue, type TokenSource } from './tokens.ts';

const source: TokenSource = {
  tokens: [
    { name: '--slotted-space-1', layer: 'primitive', axis: 'base' },
    { name: '--slotted-space-2', layer: 'primitive', axis: 'base' },
    { name: '--slotted-duration-short', layer: 'primitive', axis: 'base' },
    { name: '--slotted-control-height-md', layer: 'semantic', axis: 'density' },
    { name: '--slotted-tone-accent-solid', layer: 'semantic', axis: 'scheme' },
    { name: '--slotted-surface', layer: 'semantic', axis: 'scheme' },
    { name: '--slotted-rating-edge', layer: 'component', axis: 'scheme' },
  ],
  groups: [
    {
      id: 'space',
      reader: 'application',
      purpose: 'Separation.',
      pattern: '--slotted-space-{step}',
      dimensions: { step: 'open' },
    },
    {
      id: 'duration',
      reader: 'application',
      purpose: 'Time.',
      pattern: '--slotted-duration-{step}',
      dimensions: { step: { short: 'A control changing state.' } },
    },
    {
      id: 'control-size',
      reader: 'application',
      purpose: 'Size.',
      pattern: '--slotted-control-{part}-{size}',
      dimensions: { part: { height: 'The block size.' }, size: { md: 'The medium step.' } },
    },
    {
      id: 'tone',
      reader: 'application',
      purpose: 'Intent.',
      pattern: '--slotted-tone-{tone}-{role}',
      dimensions: { tone: { accent: 'The intent.' }, role: { solid: 'A filled ground.' } },
    },
    {
      id: 'surface',
      reader: 'application',
      purpose: 'Grounds.',
      tokens: { '--slotted-surface': 'The ground of a card.' },
    },
    {
      id: 'rating',
      reader: 'family',
      purpose: 'A star.',
      tokens: { '--slotted-rating-edge': 'The edge.' },
    },
  ],
  values: {
    base: {
      '--slotted-space-1': '0.125rem',
      '--slotted-space-2': 'calc(var(--slotted-space-1) * 2)',
      '--slotted-duration-short': '120ms',
    },
    densities: {
      comfortable: { '--slotted-control-height-md': '34px' },
      compact: { '--slotted-control-height-md': '28px' },
      dense: {},
    },
    reducedMotion: { '--slotted-duration-short': '1ms' },
  },
};

describe('resolveValue', () => {
  it('replaces each var() by its value, and leaves one with no value', () => {
    expect(resolveValue('calc(var(--slotted-space-1) * 2)', {}, source.values.base)).toBe(
      'calc(0.125rem * 2)',
    );
    expect(resolveValue('var(--slotted-x)', {}, {})).toBe('var(--slotted-x)');
  });
});

describe('renderTokens', () => {
  const page = renderTokens(source);

  it('a base token has its resolved value, a reduced-motion value is stated', () => {
    expect(page).toContain('| `--slotted-space-2` | — | calc(0.125rem * 2) |');
    expect(page).toContain(
      '| `--slotted-duration-short` | A control changing state. | 120ms; 1ms under reduced motion |',
    );
  });

  it('a density token has a value per density, and a missing one reads as a dash', () => {
    expect(page).toContain(
      '| `--slotted-control-height-md` | The block size. The medium step. | comfortable 34px, compact 28px, dense — |',
    );
  });

  it('a pattern group states its names and its dimensions; a colour has no value', () => {
    expect(page).toContain('Names: --slotted-tone-{tone}-{role}');
    expect(page).toContain('| accent | The intent. |');
    expect(page).not.toContain('`--slotted-tone-accent-solid`');
    expect(page).toContain('| `--slotted-surface` | The ground of a card. | by scheme |');
  });

  it('a family group is listed last, outside the application groups', () => {
    const family = page.indexOf('## Read by their family only');
    expect(family).toBeGreaterThan(page.indexOf('## surface'));
    expect(page.slice(family)).toContain('- rating: A star. Names: --slotted-rating-edge');
  });

  it('puts between backticks only token names', () => {
    for (const [, name] of page.matchAll(/`([^`]+)`/g))
      expect(name).toMatch(/^--slotted-[a-z0-9-]+$/);
  });
});

describe('reduced motion', () => {
  it('a value that reaches a reduced-motion token states its reduced value', () => {
    const page = renderTokens({
      tokens: [{ name: '--slotted-control-transition-duration', layer: 'semantic', axis: 'base' }],
      groups: [
        {
          id: 'control',
          reader: 'application',
          purpose: 'C.',
          tokens: { '--slotted-control-transition-duration': 'How long.' },
        },
      ],
      values: {
        base: {
          '--slotted-control-transition-duration': 'var(--slotted-duration-short)',
          '--slotted-duration-short': '120ms',
        },
        densities: {},
        reducedMotion: { '--slotted-duration-short': '1ms' },
      },
    });
    expect(page).toContain(
      '| `--slotted-control-transition-duration` | How long. | 120ms; 1ms under reduced motion |',
    );
  });
});

describe('the theme', () => {
  it('every application token of the contract is on the page', () => {
    const real = loadTokenSource(resolve(import.meta.dirname, '../../..'));
    const page = renderTokens(real);
    expect(real.groups.length).toBeGreaterThan(0);
    expect(page).toContain('`--slotted-space-6`');
    expect(page).toContain('Names: --slotted-tone-{tone}-{role}');
    expect(page).not.toContain('`--slotted-icon-check`');
  });
});
