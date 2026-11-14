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

const frames = async (until: () => boolean) => {
  for (let frame = 0; frame < 30 && !until(); frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

/* Below the width its labels need, the control stands as a column with every label whole. */
describe('a control condensed to a column', () => {
  function control(width: number) {
    render(
      <div style={{ inlineSize: width }}>
        <SegmentedControl
          aria-label="Chart colours"
          condense="vertical"
          defaultValue="mono"
          fullWidth
        >
          <Segment value="spectrum">Spectrum</Segment>
          <Segment value="accent">From the accent</Segment>
          <Segment value="mono">Mono</Segment>
          <Segment value="distinct">For colour blindness</Segment>
        </SegmentedControl>
      </div>,
    );

    return document.querySelector<HTMLElement>('[data-ui="segmented-control"]')!;
  }

  it('stacks the segments at 240px, and cuts no label', async () => {
    const root = control(240);
    await frames(() => root.getAttribute('data-orientation') === 'vertical');
    await frames(() => false);
    const items = [...root.querySelectorAll<HTMLElement>('[data-part="item"]')];

    expect(root.getAttribute('data-orientation')).toBe('vertical');
    expect(items[1]!.getBoundingClientRect().top).toBeGreaterThan(
      items[0]!.getBoundingClientRect().top,
    );
    for (const element of root.querySelectorAll<HTMLElement>('*')) {
      expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth + 1);
    }
  });

  it('stays a row at 800px', async () => {
    const root = control(800);
    await frames(() => false);
    const items = [...root.querySelectorAll<HTMLElement>('[data-part="item"]')];

    expect(root.getAttribute('data-orientation')).toBe('horizontal');
    expect(items[1]!.getBoundingClientRect().top).toBe(items[0]!.getBoundingClientRect().top);
  });
});
