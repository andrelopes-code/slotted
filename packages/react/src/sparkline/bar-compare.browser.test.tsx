import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BarCompare } from './bar-compare';

const DOMAIN = { max: 800, min: -1600, step: 800 };

/** Two roots with one domain draw one axis, and a negative value hangs left of zero. */
describe('two bar comparisons on one domain', () => {
  it('share tick positions, hang the negative bar left of zero, and name every row', () => {
    render(
      <div style={{ display: 'grid', inlineSize: 420 }}>
        <BarCompare
          {...DOMAIN}
          data={[
            { label: 'Subject', value: -1000 },
            { label: 'Reference', texture: true, value: 33 },
          ]}
        />
        <BarCompare {...DOMAIN} data={[{ label: 'Benchmark', value: 400 }]} />
      </div>,
    );
    const [first, second] = screen.getAllByRole('img');
    const ticks = (root: Element) =>
      [...root.querySelectorAll('[data-part="row"]:first-child [data-part="tick"]')].map(
        (tick) => tick.getBoundingClientRect().left,
      );
    const negative = first!.querySelector('[data-part="row"][data-negative]')!;
    const bar = negative.querySelector('[data-part="bar"]')!.getBoundingClientRect();
    const zero = negative.querySelector('[data-part="zero"]')!.getBoundingClientRect();

    expect(ticks(first!)).toHaveLength(4);
    expect(ticks(first!)).toEqual(ticks(second!));
    expect(bar.right).toBeCloseTo(zero.left + zero.width / 2, 0);
    expect(bar.left).toBeLessThan(zero.left);
    expect(first).toHaveAccessibleName('Subject: -1,000; Reference: 33');
    expect(second).toHaveAccessibleName('Benchmark: 400');
  });
});
