import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { TokenContract, TokenDefinition } from './contract-types';
import { dimensionValues, groupCovers, groupErrors, type TokenGroup } from './token-groups';

const token = (name: string, layer: TokenDefinition['layer'] = 'semantic'): TokenDefinition => ({
  name,
  layer,
  axis: 'scheme',
  type: 'color',
});

const tone: TokenGroup = {
  id: 'tone',
  purpose: 'p',
  reader: 'application',
  pattern: '--slotted-tone-{tone}-{role}',
  dimensions: {
    tone: { accent: 'a', danger: 'd' },
    role: { solid: 's', 'on-solid': 'o' },
  },
};
const space: TokenGroup = {
  id: 'space',
  purpose: 'p',
  reader: 'application',
  pattern: '--slotted-space-{step}',
  dimensions: { step: 'open' },
};
const surface: TokenGroup = {
  id: 'surface',
  purpose: 'p',
  reader: 'application',
  tokens: { '--slotted-surface': 's' },
};
const toneTokens = ['accent', 'danger'].flatMap((t) =>
  ['solid', 'on-solid'].map((r) => token(`--slotted-tone-${t}-${r}`)),
);

describe('groupCovers', () => {
  it('a pattern covers the names its dimensions spell, a list covers its names', () => {
    expect(groupCovers(tone, '--slotted-tone-danger-on-solid')).toBe(true);
    expect(groupCovers(tone, '--slotted-tone-warning-solid')).toBe(false);
    expect(groupCovers(space, '--slotted-space-12')).toBe(true);
    expect(groupCovers(surface, '--slotted-surface')).toBe(true);
    expect(groupCovers(surface, '--slotted-surface-raised')).toBe(false);
  });

  it('reads the value of each dimension, the longest value first', () => {
    expect(dimensionValues(tone, '--slotted-tone-accent-on-solid')).toEqual({
      tone: 'accent',
      role: 'on-solid',
    });
  });
});

describe('groupErrors', () => {
  it('accepts tokens each covered by one group', () => {
    expect(
      groupErrors(
        [...toneTokens, token('--slotted-space-1', 'primitive'), token('--slotted-surface')],
        [tone, space, surface],
      ),
    ).toEqual([]);
  });

  it('reports a token in no group and a token in two', () => {
    const wide: TokenGroup = { ...space, id: 'wide', pattern: '--slotted-{step}' };
    expect(
      groupErrors([token('--slotted-space-1'), token('--slotted-gap')], [space, wide]),
    ).toEqual(['--slotted-space-1: in groups space, wide']);
    expect(groupErrors([token('--slotted-gap')], [surface])).toEqual([
      '--slotted-gap: in no group',
      'surface: --slotted-surface is not in the contract',
      'surface: covers no token',
    ]);
  });

  it('reports a missing combination, an empty meaning and a listed name the contract lacks', () => {
    const empty: TokenGroup = {
      ...tone,
      dimensions: { ...tone.dimensions, role: { solid: '', 'on-solid': 'o' } },
    };
    expect(groupErrors(toneTokens.slice(1), [empty])).toEqual([
      'tone: --slotted-tone-accent-solid is missing',
      'tone: role solid has no meaning',
    ]);
    expect(
      groupErrors(
        [token('--slotted-surface')],
        [{ ...surface, tokens: { '--slotted-surface': 's', '--slotted-x': 'x' } }],
      ),
    ).toEqual(['surface: --slotted-x is not in the contract']);
  });

  it('reports a component token read by the application, and a malformed group', () => {
    expect(groupErrors([token('--slotted-surface', 'component')], [surface])).toEqual([
      '--slotted-surface: a component token in the application group surface',
    ]);
    const both: TokenGroup = { ...surface, pattern: '--slotted-surface' };
    const slot: TokenGroup = { ...space, dimensions: { other: 'open' } };
    expect(
      groupErrors([token('--slotted-surface'), token('--slotted-space-1')], [both, slot]),
    ).toEqual([
      'space: dimension other is not in the pattern',
      'space: slot {step} has no dimension',
      'surface: has a pattern or tokens, not both',
    ]);
  });
});

describe('the contract', () => {
  it('every token is in exactly one group, every meaning stated', () => {
    const contract = JSON.parse(
      readFileSync(join(import.meta.dirname, 'contract.json'), 'utf8'),
    ) as TokenContract & { groups?: TokenGroup[] };
    expect(groupErrors(contract.tokens, contract.groups ?? [])).toEqual([]);
  });
});
