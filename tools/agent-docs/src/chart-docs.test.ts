import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadFamilies } from './load.ts';
import { renderFamily } from './render.ts';

const root = resolve(import.meta.dirname, '../../..');

/**
 * A chart inside a card or section whose heading already names it needs a name
 * with no visible caption; the React page says that the plot takes it from the
 * aria-label passed to Chart, and the Angular page that it takes it from the
 * aria-label written on the figure.
 */
describe('the react chart page', () => {
  it('names aria-label as the plot’s name when no title is written', async () => {
    const family = (await loadFamilies('react', root)).find(
      (each) => each.contract.family === 'chart',
    )!;
    const page = renderFamily({ ...family, verdicts: new Map() })
      .files.map((file) => file.content)
      .join('\n');

    expect(page).toMatch(/Without title, the plot is named by the aria-label passed to Chart/);
    expect(page).toMatch(/<Chart aria-label=/);
  });
});

describe('the angular chart page', () => {
  it('names aria-label as the plot’s name when no title is written', async () => {
    const family = (await loadFamilies('angular', root)).find(
      (each) => each.contract.family === 'chart',
    )!;
    const page = renderFamily({ ...family, verdicts: new Map() })
      .files.map((file) => file.content)
      .join('\n');

    expect(page).toMatch(
      /Without title, the plot is named by the aria-label written on the figure/,
    );
    expect(page).toMatch(/<figure\s+slChart\s+aria-label=/);
  });
});
