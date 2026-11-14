import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableExpander,
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

  it('paints the ground of the region it stands in under the row ground', () => {
    const { container } = render(table('light'));
    const root = container.querySelector('[data-ui="table"]') as HTMLElement;
    (root.parentElement as HTMLElement).style.setProperty('--slotted-ground', 'rgb(10, 20, 30)');
    root.style.setProperty('--slotted-table-surface', 'transparent');

    expect(ground('td[data-sticky="end"]')).toBe('rgb(10, 20, 30)');
  });
});

/**
 * A record that is no longer active is drawn in the muted ink. The row states
 * it, the cells read it, and a sibling row keeps the table's ink.
 */
describe('a muted row', () => {
  const colorOf = (selector: string) => getComputedStyle(document.querySelector(selector)!).color;

  function renderRows() {
    render(
      <Table
        columns={2}
        selectionMode="multiple"
        style={
          {
            '--slotted-table-color': 'rgb(10, 20, 30)',
            '--slotted-table-color-muted': 'rgb(100, 110, 120)',
          } as CSSProperties
        }
      >
        <TableContent>
          <TableBody>
            <TableRow muted value="ended">
              <TableCell>Gym</TableCell>
              <TableCell>Ended</TableCell>
            </TableRow>
            <TableRow value="active">
              <TableCell>Pool</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );
  }

  it('draws its cells in the muted ink and leaves a sibling row in the table ink', () => {
    renderRows();

    expect(colorOf('tr[data-value="ended"] td')).toBe('rgb(100, 110, 120)');
    expect(colorOf('tr[data-value="active"] td')).toBe('rgb(10, 20, 30)');
  });

  it('changes neither aria-disabled nor the selection set', () => {
    renderRows();
    const row = document.querySelector('tr[data-value="ended"]')!;

    expect(row.hasAttribute('aria-disabled')).toBe(false);
    expect(row.hasAttribute('data-disabled')).toBe(false);
    expect(row.hasAttribute('data-selected')).toBe(false);
  });
});

/* The cell publishes the padding it uses, so content drawn inside it can read it. */
describe('the padding of a table cell', () => {
  it('is readable from the two cell padding properties', () => {
    render(
      <Table columns={1}>
        <TableContent>
          <TableBody>
            <TableRow value="r1">
              <TableCell>Value</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );
    const cell = document.querySelector('[data-part="cell"]') as HTMLElement;
    const style = getComputedStyle(cell);
    const probe = document.createElement('div');

    cell.append(probe);
    probe.style.paddingBlock = 'var(--slotted-table-cell-padding-block)';
    probe.style.paddingInline = 'var(--slotted-table-cell-padding-inline)';

    expect(getComputedStyle(probe).paddingTop).toBe(style.paddingTop);
    expect(getComputedStyle(probe).paddingLeft).toBe(style.paddingLeft);
    expect(style.paddingLeft).not.toBe('0px');
  });
});

/**
 * A child row carries the line one level up on the center of its parent's
 * expander, through its whole height and over the rule above it, so the line
 * stays continuous across rows of any height.
 */
describe('the guide of a folded row', () => {
  it('stands on the center of the parent’s expander and spans the last child', () => {
    render(
      <Table columns={2} defaultExpanded={['assets']}>
        <TableContent>
          <TableBody>
            <TableRow level={0} value="assets">
              <TableCell>
                <TableExpander />
                Assets
              </TableCell>
              <TableCell>1,500.00</TableCell>
            </TableRow>
            <TableRow level={1} parent="assets" value="cash">
              <TableCell>Cash</TableCell>
              <TableCell>500.00</TableCell>
            </TableRow>
            <TableRow level={1} parent="assets" value="bank">
              <TableCell>
                Bank
                <br />
                Second line
              </TableCell>
              <TableCell>1,000.00</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );
    const expander = document.querySelector('[data-part="expander"]')!.getBoundingClientRect();
    const last = document.querySelector('tr[data-value="bank"] > td')!;
    const cell = last.getBoundingClientRect();
    const guide = getComputedStyle(last, '::before');
    const line = cell.left + parseFloat(guide.left);
    const text = document.createRange();
    text.selectNodeContents(last);

    expect(Math.abs(line - (expander.left + expander.width / 2))).toBeLessThan(1);
    /* The padding box, the rule above it, and not the rule under it, which the next row covers. */
    expect(parseFloat(guide.height)).toBeCloseTo(cell.height, 0);
    expect(parseFloat(guide.width)).toBeGreaterThan(0);
    expect(text.getBoundingClientRect().left).toBeGreaterThan(line);
  });
});
