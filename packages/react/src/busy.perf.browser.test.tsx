import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { DataGrid } from './index';
import type { DataGridColumn } from './data-grid/data-grid.types';

interface Entry {
  id: string;
  payee: string;
  category: string;
  amount: number;
}

const ROWS: Entry[] = Array.from({ length: 70 }, (_, index) => ({
  id: `E${String(index)}`,
  payee: `Payee ${String(index)}`,
  category: `Category ${String(index % 9)}`,
  amount: index * 13.5,
}));

const COLUMNS: DataGridColumn<Entry>[] = [
  { id: 'payee', label: 'Payee', rowHeader: true },
  { id: 'category', label: 'Category' },
  { id: 'amount', label: 'Amount', kind: 'number' },
  { id: 'id', label: 'Reference' },
];

/** The median of nine toggles of one attribute, each followed by a forced layout. */
function toggleCost(element: Element, name: string): number {
  const samples: number[] = [];
  for (let run = 0; run < 10; run += 1) {
    const start = performance.now();
    if (run % 2 === 0) element.setAttribute(name, 'true');
    else element.removeAttribute(name);
    void document.body.offsetHeight;
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return samples[4] ?? 0;
}

/**
 * A busy region restyles what its rules target. Keyed on `[data-part=…]`, an
 * `aria-busy` toggle on any ancestor invalidated every element carrying
 * `data-part` (340 ms for a 70-row grid in Chrome 150); keyed on
 * `[data-part-…]` it invalidates the elements of one part. The grid's own
 * toggle refused presses with an inherited `pointer-events`, which restyled
 * every cell: 9 ms, 2 ms with a veil.
 */
describe('a busy region', () => {
  it('restyles what its rules target, not every part under it', async () => {
    await page.viewport(1440, 900);
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() =>
      root.render(
        <div data-testid="container">
          <DataGrid<Entry>
            aria-label="Transactions"
            columns={COLUMNS}
            rowKey="id"
            rows={ROWS}
            virtualize={false}
          />
        </div>,
      ),
    );
    const container = host.firstElementChild as HTMLElement;
    const grid = host.querySelector('[data-ui="data-grid"]') as HTMLElement;
    toggleCost(container, 'aria-busy');
    const ancestor = toggleCost(container, 'aria-busy');
    const own = toggleCost(grid, 'aria-busy');

    root.unmount();
    host.remove();
    expect(ancestor).toBeLessThan(20);
    expect(own).toBeLessThan(20);
  });
});
