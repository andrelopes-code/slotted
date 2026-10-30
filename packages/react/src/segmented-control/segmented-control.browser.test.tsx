import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SegmentedControl } from './segmented-control';
import { Segment } from './segmented-control-parts';

/**
 * The thumb's ground is a `light-dark()` pair resolved by the used
 * `color-scheme`. A build that lowered it into variables nothing declared left
 * the property at its initial value: a transparent thumb in every scheme.
 */
describe('the segmented control thumb', () => {
  it.each(['light', 'dark'] as const)('paints a ground in the %s scheme', (scheme) => {
    render(
      <div style={{ colorScheme: scheme }}>
        <SegmentedControl aria-label="Range" defaultValue="a">
          <Segment value="a">A</Segment>
          <Segment value="b">B</Segment>
        </SegmentedControl>
      </div>,
    );
    const thumb = document.querySelector('[data-part="indicator"]') as HTMLElement;

    expect(getComputedStyle(thumb).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});
