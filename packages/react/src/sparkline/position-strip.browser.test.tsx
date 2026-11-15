import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PositionStrip } from './position-strip';

const VALUES = [1000, -500, 2000, 0, 1500, 500, 2500, 1000];

const center = (element: Element) => {
  const box = element.getBoundingClientRect();

  return box.left + box.width / 2;
};

/** Where a value stands among its own recent values, measured on the drawn track. */
describe('a position strip with a negative period', () => {
  it('places the value dot at its share of the extent, with the zero tick and the ends', () => {
    render(
      <div style={{ inlineSize: 420 }}>
        <PositionStrip label="Savings rate" reference={1200} value={800} values={VALUES} />
      </div>,
    );
    const root = screen.getByRole('img');
    const part = (name: string) => root.querySelector(`[data-part="${name}"]`)!;
    const track = part('track').getBoundingClientRect();
    const share = (element: Element) => (center(element) - track.left) / track.width;

    expect(share(part('value'))).toBeCloseTo(1300 / 3000, 2);
    expect(share(part('zero'))).toBeCloseTo(500 / 3000, 2);
    expect(root.querySelectorAll('[data-part="dot"]')).toHaveLength(8);
    expect(part('start')).toHaveTextContent('-500');
    expect(part('end')).toHaveTextContent('2,500');
    expect(root).toHaveAccessibleName(
      'Savings rate: 800, against a range of -500 to 2,500, reference 1,200',
    );
  });

  it('writes each end in full, whatever its format', () => {
    render(
      <div style={{ inlineSize: 320 }}>
        <PositionStrip
          formatOptions={{ currency: 'BRL', style: 'currency' }}
          label="Savings"
          locale="pt-BR"
          max={12000}
          min={-10000}
          value={800}
          values={VALUES}
        />
      </div>,
    );
    const root = screen.getByRole('img');

    for (const name of ['start', 'end']) {
      const end = root.querySelector<HTMLElement>(`[data-part="${name}"]`)!;

      expect(end.scrollWidth).toBeLessThanOrEqual(end.clientWidth);
    }
  });

  it('draws no value dot while the value is hidden, and says so', () => {
    render(<PositionStrip hideValue label="Savings rate" value={800} values={VALUES} />);
    const root = screen.getByRole('img');

    expect(root.querySelector('[data-part="value"]')).toBeNull();
    expect(root).toHaveAccessibleName(
      'Savings rate: value pending, against a range of -500 to 2,500',
    );
  });
});
