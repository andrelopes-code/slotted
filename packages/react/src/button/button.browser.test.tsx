import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Glyph, Icon } from '../icon';
import { Button, IconButton } from './index';

const box = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { height: rect.height, width: rect.width };
};

/**
 * The ring that stands in for a glyph takes the glyph's box: the glyph stays in
 * the DOM and is not drawn, and the control keeps the size it has at rest. An
 * `IconButton` that waited drew the ring beside the icon in a square of one.
 */
describe('a control waiting in its glyph slot', () => {
  it('draws the ring in the icon button’s glyph box, and not the glyph', () => {
    const { rerender } = render(
      <IconButton aria-label="Refresh">
        <Icon>
          <Glyph name="rotate-ccw" />
        </Icon>
      </IconButton>,
    );
    const button = document.querySelector('[data-ui="button"]') as HTMLElement;
    const resting = box(button);

    rerender(
      <IconButton aria-label="Refresh" loading>
        <Icon>
          <Glyph name="rotate-ccw" />
        </Icon>
      </IconButton>,
    );
    const slot = button.querySelector('[data-part="icon"]') as HTMLElement;
    const ring = slot.querySelector('[data-part="indicator"]') as HTMLElement;
    const glyph = slot.querySelector('[data-ui="icon"]') as HTMLElement;

    expect(getComputedStyle(glyph).visibility).toBe('hidden');
    expect(getComputedStyle(ring).visibility).toBe('visible');
    expect(box(button)).toEqual(resting);
    const slotBox = slot.getBoundingClientRect();
    const ringBox = ring.getBoundingClientRect();
    expect(ringBox.left).toBeGreaterThanOrEqual(slotBox.left);
    expect(ringBox.right).toBeLessThanOrEqual(slotBox.right);
  });

  it('draws the ring in a button’s start slot, and not the glyph beside it', () => {
    render(
      <Button
        loading
        start={
          <Icon>
            <Glyph name="rotate-ccw" />
          </Icon>
        }
      >
        Refresh
      </Button>,
    );
    const slot = document.querySelector('[data-part="start"]') as HTMLElement;
    const glyph = slot.querySelector('[data-ui="icon"]') as HTMLElement;
    const ring = slot.querySelector('[data-part="indicator"]') as HTMLElement;

    expect(getComputedStyle(glyph).visibility).toBe('hidden');
    expect(getComputedStyle(ring).visibility).toBe('visible');
  });
});

/**
 * Squeezed in a row, a label broke inside its words — "Corri|gir", "Anul|ar" —
 * because it could break anywhere, which made a button as narrow as one
 * letter. A label is one line at its own width: the row overflows, or a
 * toolbar folds what does not fit.
 */
describe('a row of buttons narrower than their labels', () => {
  it('keeps every label on one line, whole', () => {
    const labels = ['Fix', 'Mark as transfer', 'Record restock', 'Void'];
    render(
      <div style={{ display: 'flex', inlineSize: 300 }}>
        {labels.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </div>,
    );
    for (const label of document.querySelectorAll<HTMLElement>('[data-part="label"]')) {
      const range = document.createRange();
      range.selectNodeContents(label);
      expect(range.getClientRects().length, label.textContent ?? '').toBe(1);
      expect(label.scrollWidth, label.textContent ?? '').toBeLessThanOrEqual(label.clientWidth);
    }
  });
});
