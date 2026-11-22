import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableExpander,
  TableGroupRow,
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
 * The row and its pinned cell both painted the row's ground, so a translucent
 * ground showed twice on the pinned column. The cells of a body row paint it,
 * once each, and the row paints none.
 */
describe('a pinned cell of a row with a translucent ground', () => {
  it('paints the hover ground once, as the plain cells do', async () => {
    const hover = 'rgba(255, 0, 0, 0.06)';
    const { container } = render(
      <div style={{ inlineSize: 372 }}>
        <Table
          columns={4}
          style={
            {
              '--slotted-table-row-surface-hover': hover,
              '--slotted-table-sticky-surface': 'transparent',
            } as CSSProperties
          }
          variant="framed"
        >
          <TableContent>
            <TableBody>
              <TableRow value="r1">
                <TableCell>A</TableCell>
                <TableCell>B</TableCell>
                <TableCell>C</TableCell>
                <TableCell sticky="end">D</TableCell>
              </TableRow>
            </TableBody>
          </TableContent>
        </Table>
      </div>,
    );
    const row = container.querySelector<HTMLElement>('tbody > tr')!;
    const plain = getComputedStyle(container.querySelector('td:not([data-sticky])')!);
    const pinned = getComputedStyle(container.querySelector('td[data-sticky="end"]')!);

    await userEvent.hover(row);

    expect(getComputedStyle(row).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(plain.backgroundColor).toBe(hover);
    expect(plain.backgroundImage).toBe('none');
    expect(pinned.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(pinned.backgroundImage).toBe(`linear-gradient(${hover}, ${hover}), none`);
  });
});

/**
 * A caption hidden by wrapping its text kept its padding, about 12 pixels of
 * empty space above the header row. `visuallyHidden` takes the box away and
 * leaves the name.
 */
describe('a visually hidden caption', () => {
  it('names the table and takes no space above the header', () => {
    const { container, getByRole } = render(
      <Table columns={1} variant="plain">
        <TableContent>
          <TableCaption visuallyHidden>Ended items</TableCaption>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Item</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>A</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );
    const table = getByRole('table', { name: 'Ended items' });
    const caption = container.querySelector('caption')!.getBoundingClientRect();
    const head = container.querySelector('thead')!.getBoundingClientRect();

    expect(caption.height).toBeLessThanOrEqual(1);
    expect(head.top).toBeCloseTo(table.getBoundingClientRect().top, 0);
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

describe('a framed table with a visible caption', () => {
  it.each([false, true])('paints the caption on the header ground, stickyHeader %s', (sticky) => {
    const { container } = render(
      <Table columns={2} stickyHeader={sticky} variant="framed">
        <TableContent>
          <TableCaption>Flows by month</TableCaption>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Month</TableColumnHeader>
              <TableColumnHeader numeric>Amount</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>May</TableCell>
              <TableCell numeric>12</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );
    const ground = (part: string) =>
      getComputedStyle(container.querySelector(`[data-part="${part}"]`)!).backgroundColor;

    expect(ground('caption')).toBe(ground('column-header'));
  });
});

describe('a sticky header', () => {
  it('pins the head as one element a backdrop filter spans', async () => {
    const { container } = render(
      <div
        style={
          {
            '--slotted-table-header-backdrop-filter': 'blur(40px)',
          } as CSSProperties
        }
      >
        <Table columns={3} stickyHeader>
          <TableContent>
            <TableHead>
              <TableRow>
                {['A', 'B', 'C'].map((name) => (
                  <TableColumnHeader key={name}>{name}</TableColumnHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 20 }, (_, row) => (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>{row}</TableCell>
                  <TableCell>{row}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContent>
        </Table>
      </div>,
    );
    const head = container.querySelector<HTMLElement>('[data-part="head"]')!;
    const scroll = container.querySelector<HTMLElement>('[data-part="scroll"]')!;
    const headerRow = head.querySelector('[data-part="row"]')!.getBoundingClientRect();

    scroll.style.maxBlockSize = '160px';
    scroll.scrollTop = 200;
    await new Promise(requestAnimationFrame);

    expect(scroll.scrollTop).toBeGreaterThan(0);
    expect(getComputedStyle(head).position).toBe('sticky');
    expect(getComputedStyle(head).backdropFilter).toBe('blur(40px)');
    expect(head.getBoundingClientRect().width).toBeCloseTo(headerRow.width, 0);
    expect(head.getBoundingClientRect().top).toBeCloseTo(scroll.getBoundingClientRect().top, 0);
  });
});

describe('a group band in a table wider than its scroller', () => {
  it('keeps the name and the total in view at both ends of the scroll', async () => {
    const { container } = render(
      <div style={{ inlineSize: 360 }}>
        <Table columns={4}>
          <TableContent>
            <TableHead>
              <TableRow>
                {['Date', 'Payee', 'Category', 'Amount'].map((name) => (
                  <TableColumnHeader key={name} style={{ minInlineSize: 200 }}>
                    {name}
                  </TableColumnHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableGroupRow end="−R$ 477,80">Today</TableGroupRow>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>2</TableCell>
                <TableCell>3</TableCell>
                <TableCell>4</TableCell>
              </TableRow>
            </TableBody>
          </TableContent>
        </Table>
      </div>,
    );
    const scroll = container.querySelector<HTMLElement>('[data-part="scroll"]')!;
    const band = container.querySelector<HTMLElement>('[data-part="group-content"]')!;
    const start = container.querySelector('[data-part="group-start"]')!;
    const end = container.querySelector('[data-part="group-end"]')!;
    const inset = parseFloat(getComputedStyle(band).paddingInlineStart);

    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    for (const left of [0, scroll.scrollWidth - scroll.clientWidth]) {
      scroll.scrollLeft = left;
      await new Promise(requestAnimationFrame);
      const box = scroll.getBoundingClientRect();
      const viewEnd = box.left + scroll.clientLeft + scroll.clientWidth;

      expect(start.getBoundingClientRect().left).toBeCloseTo(
        box.left + scroll.clientLeft + inset,
        0,
      );
      expect(end.getBoundingClientRect().right).toBeCloseTo(viewEnd - inset, 0);
    }
  });
});
