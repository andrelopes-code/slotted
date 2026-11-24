import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Grid } from './index';

/** A length without a unit makes the track function invalid, and the columns are lost. */
describe('a stated column count', () => {
  it.each([0, 6] as const)('holds its columns at gap %i', (gap) => {
    const { container } = render(
      <div style={{ inlineSize: 600 }}>
        <Grid columns={3} gap={gap} minItemWidth="xs">
          <span>Packed</span>
          <span>Shipped</span>
          <span>Delivered</span>
        </Grid>
      </div>,
    );

    const grid = container.querySelector('[data-ui="grid"]')!;

    expect(getComputedStyle(grid).gridTemplateColumns.split(' ')).toHaveLength(3);
  });
});
