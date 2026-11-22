import { render } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { Switch } from './index';

/* No transition, so the computed colors are the end state. */
const still = (node: ReactNode) =>
  render(
    <div
      style={
        {
          '--slotted-control-transition-duration': '0s',
          '--slotted-switch-invalid-border-color': 'rgb(200, 0, 0)',
        } as CSSProperties
      }
    >
      {node}
    </div>,
  );

const parts = (container: HTMLElement) => ({
  thumb: getComputedStyle(container.querySelector('[data-part="thumb"]')!),
  track: getComputedStyle(container.querySelector('[data-part="track"]')!),
});

describe('an invalid switch', () => {
  it.each([true, false])('marks the outer edge of the track alone, checked %s', (checked) => {
    const valid = parts(
      still(<Switch aria-label="Feed" checked={checked} onCheckedChange={() => {}} />).container,
    );
    const invalid = parts(
      still(<Switch aria-label="Feed" checked={checked} invalid onCheckedChange={() => {}} />)
        .container,
    );

    /* One edge outside the track's border, in the invalid color, and nothing inset. */
    expect(invalid.track.boxShadow).toMatch(/^rgb\(200, 0, 0\) 0px 0px 0px \d/);
    expect(invalid.track.boxShadow).not.toContain('inset');
    expect(invalid.thumb.boxShadow).toBe(valid.thumb.boxShadow);
    expect(invalid.thumb.borderTopColor).toBe(valid.thumb.borderTopColor);
  });
});
