import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { TextField } from '../text-field';
import { Checkbox } from './checkbox';

/**
 * On a row of fields and buttons the plain halo is shorter than the controls
 * beside it and stands outside the root's box, over the row's gap. The
 * `control` variant is one control tall and holds the halo inside its box.
 */
describe('a checkbox on a row of controls', () => {
  it.each(DENSITIES)(
    'holds a halo one control tall inside its root at a label gap of $gap',
    ({ gap, height }) => {
      const { root, label, field } = row('control', gap, height);
      const halo = haloBox(label);
      const box = root.getBoundingClientRect();

      expect(halo.bottom - halo.top).toBeCloseTo(field.getBoundingClientRect().height, 1);
      expect(halo.top).toBeCloseTo(box.top, 1);
      expect(halo.bottom).toBeCloseTo(box.bottom, 1);
      expect(halo.left).toBeCloseTo(box.left, 1);
      expect(halo.right).toBeCloseTo(box.right, 1);
      expect(getComputedStyle(root).columnGap).toBe(gap);
    },
  );

  it('keeps the plain halo outside the root, where a stack of choices wants it', () => {
    const { root, label } = row('plain', '8px', '28px');
    const halo = haloBox(label);
    const box = root.getBoundingClientRect();

    expect(halo.left).toBeLessThan(box.left);
    expect(halo.right).toBeGreaterThan(box.right);
  });
});

const DENSITIES = [
  { gap: '12px', height: '34px' },
  { gap: '8px', height: '28px' },
  { gap: '6px', height: '26px' },
];

function row(variant: 'control' | 'plain', gap: string, height: string) {
  const { container } = render(
    <div
      style={
        {
          '--slotted-control-height-md': height,
          '--slotted-control-label-gap-md': gap,
          alignItems: 'center',
          columnGap: 6,
          display: 'grid',
          gridTemplateColumns: '10rem auto',
          justifyItems: 'start',
        } as CSSProperties
      }
    >
      <TextField aria-label="Name" />
      <Checkbox variant={variant}>Active</Checkbox>
    </div>,
  );

  return {
    field: container.querySelector<HTMLElement>('[data-ui="text-field"]')!,
    label: container.querySelector<HTMLElement>('[data-ui="checkbox"] [data-part="label"]')!,
    root: container.querySelector<HTMLElement>('[data-ui="checkbox"][data-part="root"]')!,
  };
}

/** The box of the label's `::after`, from its used insets against the label. */
function haloBox(label: HTMLElement) {
  const box = label.getBoundingClientRect();
  const style = getComputedStyle(label, '::after');

  return {
    bottom: box.bottom - parseFloat(style.bottom),
    left: box.left + parseFloat(style.left),
    right: box.right - parseFloat(style.right),
    top: box.top + parseFloat(style.top),
  };
}
