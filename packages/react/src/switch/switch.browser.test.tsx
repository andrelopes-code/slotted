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

    expect(invalid.track.boxShadow).toBe('none');
    expect(invalid.track.outlineColor).toBe('rgb(200, 0, 0)');
    expect(invalid.track.outlineWidth).toBe(invalid.track.borderTopWidth);
    expect(valid.track.outlineStyle).toBe('none');
    expect(invalid.thumb.boxShadow).toBe(valid.thumb.boxShadow);
    expect(invalid.thumb.borderTopColor).toBe(valid.thumb.borderTopColor);
  });
});
