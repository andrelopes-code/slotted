import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import { Glyph, Icon } from './index';

/**
 * A glyph beside a label is centerd on its main shape, not on its whole ink.
 * The calendar's rings rise above its page: centerd on the ink, the page sat
 * one unit low, 0.6px under the cap-height center of a 14px label trimmed to
 * its caps.
 */
describe('a calendar beside a label', () => {
  it('centers its page on the label’s cap height', () => {
    render(
      <Button
        start={
          <Icon size="sm">
            <Glyph name="calendar" />
          </Icon>
        }
      >
        Outubro de 2026
      </Button>,
    );
    const page = document.querySelectorAll('[data-glyph="calendar"] path')[2] as SVGPathElement;
    const label = document.querySelector('[data-part="label"]') as HTMLElement;
    const center = (box: DOMRect) => box.top + box.height / 2;

    expect(
      Math.abs(center(page.getBoundingClientRect()) - center(label.getBoundingClientRect())),
    ).toBeLessThanOrEqual(0.25);
  });

  it.each(['sm', 'md', 'lg'] as const)(
    'centers its page on the cap height of a %s outline button',
    (size) => {
      render(
        <Button
          size={size}
          start={
            <Icon>
              <Glyph name="calendar" />
            </Icon>
          }
          variant="outline"
        >
          Oct 2026
        </Button>,
      );
      const page = document.querySelectorAll('[data-glyph="calendar"] path')[2] as SVGPathElement;
      const label = document.querySelector('[data-part="label"]') as HTMLElement;
      const center = (box: DOMRect) => box.top + box.height / 2;

      expect(
        Math.abs(center(page.getBoundingClientRect()) - center(label.getBoundingClientRect())),
      ).toBeLessThanOrEqual(0.5);
    },
  );
});
