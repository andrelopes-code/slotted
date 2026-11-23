import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Glyph, Icon } from '../icon';
import { atPixelRatio, inkSpan, paint } from '../test/ink';
import { IconButton } from './index';

const SIZES = [13.1, 12.25, 11.4, 10.5, 16, 24];

/** The fraction of a pixel each line starts at. */
const FRACTIONS = [0, 0.17, 0.33, 0.5, 0.66, 0.83];

/* An inline icon button reads as a mark on the capital beside it: the two ink centers are one. */
describe.each([
  [1, 0.5],
  [2, 0.25],
])('the ink of an inline icon button at device pixel ratio %d', (ratio, limit) => {
  it.each(SIZES)('centers on a capital of a %d px text', async (size) => {
    const { container } = render(
      <div style={{ color: '#000', fontSize: size, paddingInlineStart: 8 }}>
        {FRACTIONS.map((fraction) => (
          <Line fraction={fraction} key={fraction} />
        ))}
      </div>,
    );

    const offsets = await atPixelRatio(ratio, async () => {
      const painted = await paint();

      return [...container.querySelectorAll('[data-line]')].map((line) => {
        const [capital, glyph] = ['[data-capital]', '[data-ui="button"]'].map((part) =>
          inkSpan(painted, line.querySelector(part)!.getBoundingClientRect()),
        );

        return Number((glyph!.center - capital!.center).toFixed(2));
      });
    });

    expect(Math.max(...offsets.map(Math.abs)), offsets.join(' ')).toBeLessThanOrEqual(limit);
  });
});

describe('the line an inline icon button stands in', () => {
  it.each(SIZES)('keeps the height of a %d px text', (size) => {
    const { container } = render(
      <div style={{ fontSize: size }}>
        {[1, 1.25, 1.5].map((lineHeight) => (
          <div key={lineHeight} style={{ lineHeight }}>
            <div data-plain="">H</div>

            <div data-marked="">
              H
              <Mark />
            </div>
          </div>
        ))}
      </div>,
    );
    const heights = (name: string) =>
      [...container.querySelectorAll(`[data-${name}]`)].map(
        (line) => line.getBoundingClientRect().height,
      );

    expect(heights('marked')).toEqual(heights('plain'));
  });

  it('draws the icon from the capital of the text', () => {
    const { container } = render(
      <>
        {[10.5, 24].map((fontSize) => (
          <p key={fontSize} style={{ fontSize }}>
            H
            <Mark />
          </p>
        ))}
      </>,
    );
    const [small, large] = [...container.querySelectorAll('[data-ui="button"] svg')].map(
      (icon) => icon.getBoundingClientRect().height,
    );

    expect(small).toBeLessThan(10.5 * 1.25);
    expect(large).toBeGreaterThan(18);
  });
});

interface LineProps {
  readonly fraction: number;
}

function Line({ fraction }: LineProps) {
  return (
    <div data-line="" style={{ lineHeight: 1.6, paddingBlockStart: 8 + fraction }}>
      <span data-capital="" style={{ marginInlineEnd: 4 }}>
        H
      </span>
      <Mark />
    </div>
  );
}

function Mark() {
  return (
    <IconButton aria-label="About the balance" inline size="sm" tone="secondary" variant="ghost">
      <Icon>
        <Glyph name="circle-question" />
      </Icon>
    </IconButton>
  );
}
