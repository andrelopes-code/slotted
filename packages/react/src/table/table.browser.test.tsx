import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
} from './index';

const COLUMNS = ['Date', 'Payee', 'Category', 'Account', 'Status', 'Notes', 'Amount'];

/**
 * A pinned cell covers the cells that scroll under it. It copied its row's
 * ground with `inherit`, and where the row paints none — the header row, a row
 * on a transparent table surface — the pinned cell was transparent: the cells
 * under it showed through, and its header text overlapped the next column's.
 */
describe('a pinned column of a framed table wider than its scroller', () => {
  const table = (scheme: 'light' | 'dark') => (
    <div style={{ inlineSize: 372, colorScheme: scheme }}>
      <Table columns={7} variant="framed">
        <TableContent>
          <TableHead>
            <TableRow>
              {COLUMNS.map((name, index) => (
                <TableColumnHeader key={name} sticky={index === 6 ? 'end' : undefined}>
                  {name}
                </TableColumnHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow value="r1">
              {COLUMNS.map((name, index) => (
                <TableCell key={name} sticky={index === 6 ? 'end' : undefined}>
                  {name} value
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>
    </div>
  );
  const ground = (selector: string) =>
    getComputedStyle(document.querySelector(selector)!).backgroundColor;
  const transparent = ['rgba(0, 0, 0, 0)', 'transparent'];

  for (const scheme of ['light', 'dark'] as const) {
    it(`paints a ground under the header and the cell in the ${scheme} scheme`, () => {
      render(table(scheme));
      expect(transparent).not.toContain(ground('th[data-sticky="end"]'));
      expect(transparent).not.toContain(ground('td[data-sticky="end"]'));
    });
  }

  it('paints the row ground on a table whose surface is transparent', () => {
    const { container } = render(table('light'));
    (container.querySelector('[data-ui="table"]') as HTMLElement).style.setProperty(
      '--slotted-table-surface',
      'transparent',
    );
    expect(transparent).not.toContain(ground('th[data-sticky="end"]'));
    expect(transparent).not.toContain(ground('td[data-sticky="end"]'));
  });

  /* The layer under the row read `--slotted-surface` alone: a table over a
     card with a transparent surface showed one opaque band, the pinned column. */
  it('paints the family’s sticky surface under the row ground', () => {
    const { container } = render(table('light'));
    (container.querySelector('[data-ui="table"]') as HTMLElement).style.setProperty(
      '--slotted-table-sticky-surface',
      'rgb(1 2 3)',
    );

    expect(ground('td[data-sticky="end"]')).toBe('rgb(1, 2, 3)');
  });
});
