import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Sparkline } from './sparkline';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * A table cell settles its column width after mount, and a path that eased
 * from the old geometry to the new one read as the series growing. Only a
 * new `data` eases; a new box redraws at once.
 */
describe('a sparkline whose box changes', () => {
  it('redraws a resize at once and eases a change of data', async () => {
    const { container, rerender } = render(
      <div style={{ inlineSize: '120px' }}>
        <Sparkline data={[1, 3, 2, 5]} label="Revenue" />
      </div>,
    );
    const holder = container.firstElementChild as HTMLElement;
    const root = () => container.querySelector('[data-ui="sparkline"]') as HTMLElement;
    const line = () => root().querySelector('[data-part="line"]') as SVGPathElement;
    await frame();

    holder.style.inlineSize = '240px';
    await frame();
    await frame();
    expect(root()).not.toHaveAttribute('data-animate');
    expect(getComputedStyle(line()).transitionProperty).not.toMatch(/\bd\b/);

    rerender(
      <div style={{ inlineSize: '240px' }}>
        <Sparkline data={[5, 2, 3, 1]} label="Revenue" />
      </div>,
    );
    expect(root()).toHaveAttribute('data-animate');
  });

  it('keeps a width of its own in a column sized by its content', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <td>
              <Sparkline data={[1, 3, 2, 5]} label="Revenue" />
            </td>
          </tr>
        </tbody>
      </table>,
    );
    const root = container.querySelector('[data-ui="sparkline"]') as HTMLElement;

    expect(root.getBoundingClientRect().width).toBeGreaterThan(0);
  });
});
