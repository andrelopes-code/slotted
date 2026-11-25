import '../../../themes/dist/default.css';

import { plainDate } from '@slotted/core/date';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Calendar } from './index';

const SCHEMES = ['light', 'dark', 'high-contrast'] as const;

/* The default theme, loaded here alone: every scheme draws its own inks. */
describe('the ink of a weekend day', () => {
  it.each(SCHEMES)(
    'in %s differs from a day outside the month and reads on the surface',
    (scheme) => {
      render(
        <div
          data-slotted-scheme={scheme}
          data-slotted-theme="default"
          style={{ background: 'var(--slotted-surface)' }}
        >
          <Calendar defaultFocusedDate={plainDate(2026, 11, 25)} fixedWeeks locale="en-US" />
        </div>,
      );
      const ground = rgbOf(
        getComputedStyle(document.querySelector<HTMLElement>('[data-slotted-theme]')!)
          .backgroundColor,
      );
      const saturday = rgbOf(getComputedStyle(dayIn('28', false)).color);
      const outside = rgbOf(getComputedStyle(dayIn('1', true)).color);

      expect(saturday).not.toEqual(outside);
      expect(contrast(saturday, ground)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

function dayIn(number: string, outside: boolean) {
  const cells = [...document.querySelectorAll<HTMLElement>('[data-part="cell"]')];
  const cell = cells.find(
    (each) => each.textContent === number && each.hasAttribute('data-outside-month') === outside,
  );

  return cell!.querySelector<HTMLElement>('[data-part="day"]')!;
}

/** A computed color in sRGB channels, as the canvas paints it. */
function rgbOf(color: string): readonly number[] {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);

  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

/** WCAG 2 contrast ratio of two opaque sRGB colors. */
function contrast(a: readonly number[], b: readonly number[]) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];

  return (light + 0.05) / (dark + 0.05);
}

function luminance(channels: readonly number[]) {
  const [r = 0, g = 0, b = 0] = channels.map((value) => {
    const unit = value / 255;

    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
