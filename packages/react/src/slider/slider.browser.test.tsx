import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Slider } from './index';

describe('a slider whose track shows a scale', () => {
  it('paints the gradient across the whole track, with nothing over it', () => {
    const { container } = render(
      <Slider
        aria-label="Hue"
        defaultValue={40}
        indicator={false}
        style={
          {
            '--slotted-slider-track-background': 'linear-gradient(to right, red, blue)',
          } as CSSProperties
        }
      />,
    );
    const track = container.querySelector<HTMLElement>('[data-part="track"]')!;

    expect(getComputedStyle(track).backgroundImage).toBe(
      'linear-gradient(to right, rgb(255, 0, 0), rgb(0, 0, 255))',
    );
    expect(track.querySelector('[data-part="indicator"]')).toBeNull();
  });

  it('draws the indicator by default', () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={40} />);

    expect(container.querySelector('[data-part="indicator"]')).not.toBeNull();
  });
});
