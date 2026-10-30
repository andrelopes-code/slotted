import { act, render } from '@testing-library/react';
import { useState } from 'react';
import { cdp, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../button';
import { DataGrid } from './data-grid';
import type { DataGridColumn } from './data-grid.types';

interface Entry {
  id: string;
  payee: string;
  amount: number;
}

const ROWS: Entry[] = Array.from({ length: 200 }, (_, index) => ({
  id: `E${String(index)}`,
  payee: `Payee ${String(index)}`,
  amount: index * 10,
}));

const COLUMNS: DataGridColumn<Entry>[] = [
  { id: 'payee', label: 'Payee', rowHeader: true },
  { id: 'amount', label: 'Amount', kind: 'number' },
];

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * A scroll step re-rendered every row of the window: the window range is part
 * of the grid's state, and every row read the whole grid context. A step that
 * moves the window by one row renders the row that enters it, and the row that
 * leaves it at most.
 */
describe('DataGrid scrolling', () => {
  it('renders at most two rows when the window moves by one row', async () => {
    const rendered: string[] = [];
    const { container } = render(
      <DataGrid<Entry>
        aria-label="Entries"
        cellRenderers={{
          payee: ({ row, text }) => {
            rendered.push(row.id);
            return <span>{text}</span>;
          },
        }}
        columns={COLUMNS}
        height={400}
        rowHeight={40}
        rowKey="id"
        rows={ROWS}
        selectionMode="multiple"
      />,
    );
    await frame();
    await frame();
    const scroller = container.querySelector<HTMLElement>('[data-part="scroll"]')!;
    rendered.length = 0;

    scroller.scrollTop = 40;
    scroller.dispatchEvent(new Event('scroll'));
    await frame();
    await frame();

    expect(rendered.length).toBeGreaterThan(0);
    expect(new Set(rendered).size).toBeLessThanOrEqual(2);
  });
});

/**
 * A control a cell renderer draws stood as tall as the row, and its hover
 * ground covered the cursor's trace: the button seemed to jump out of the cell.
 * The row restates the control scale so the control stands inside the trace.
 */
describe('DataGrid cursor around a control', () => {
  it('keeps a small ghost button inside the current cell’s ring on all four sides', async () => {
    const { container } = render(
      <DataGrid<Entry>
        aria-label="Entries"
        cellRenderers={{
          payee: ({ text }) => (
            <Button size="sm" variant="ghost">
              {text}
            </Button>
          ),
        }}
        columns={COLUMNS}
        defaultCurrent={{ row: 'E1', column: 'payee' }}
        rowKey="id"
        rows={ROWS.slice(0, 5)}
        virtualize={false}
      />,
    );
    await frame();
    const cell = container.querySelector('[data-row="E1"] [data-column="payee"]') as HTMLElement;
    const button = cell.querySelector('[data-ui="button"]') as HTMLElement;
    expect(cell).toHaveAttribute('data-current');
    /* `--slotted-focus-ring-width`, the trace's width. */
    const ring = 2;
    const outer = cell.getBoundingClientRect();
    const inner = button.getBoundingClientRect();

    expect(inner.top).toBeGreaterThanOrEqual(outer.top + ring);
    expect(inner.bottom).toBeLessThanOrEqual(outer.bottom - ring);
    expect(inner.left).toBeGreaterThanOrEqual(outer.left + ring);
    expect(inner.right).toBeLessThanOrEqual(outer.right - ring);
  });
});

/**
 * Rows read again stay on screen and refuse the press. The refusal is a veil
 * over the body rather than an inherited `pointer-events`, so the point a
 * reader presses lands on the body, not on the cell under it.
 */
describe('a grid reading its rows again', () => {
  it('refuses a press on a row while it is busy', () => {
    const { rerender } = render(
      <DataGrid<Entry>
        aria-label="Entries"
        columns={COLUMNS}
        rowKey="id"
        rows={ROWS.slice(0, 5)}
      />,
    );
    const cell = document.querySelector('[data-part="body"] [role="gridcell"]') as HTMLElement;
    const box = cell.getBoundingClientRect();
    const center = () => document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    expect(cell.contains(center())).toBe(true);

    rerender(
      <DataGrid<Entry>
        aria-label="Entries"
        columns={COLUMNS}
        loading
        rowKey="id"
        rows={ROWS.slice(0, 5)}
      />,
    );
    expect(cell.contains(center())).toBe(false);
  });
});

/**
 * A run of selected rows is one block: the accent edge above its first row and
 * under its last, the inner tint between, and the pinned chooser on the row's
 * own ground — it held the resting selected ground while the row took the
 * hovered one.
 */
describe('DataGrid selected rows', () => {
  it('draws one block around a run and keeps pinned cells on the hovered ground', async () => {
    const { container } = render(
      <DataGrid<Entry>
        aria-label="Entries"
        columns={COLUMNS}
        defaultValue={['E1', 'E2']}
        rowKey="id"
        rows={ROWS.slice(0, 4)}
        selectionMode="multiple"
        variant="ruled"
        virtualize={false}
      />,
    );
    await frame();
    const [, first, second] = container.querySelectorAll<HTMLElement>('[data-part="row"]');
    const firstStyle = getComputedStyle(first!);
    const secondStyle = getComputedStyle(second!);

    expect(firstStyle.boxShadow).not.toBe('none');
    expect(secondStyle.boxShadow).not.toBe(firstStyle.boxShadow);
    expect(secondStyle.borderBottomColor).toBe(firstStyle.borderBottomColor);

    await userEvent.hover(second!);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const chooser = second!.querySelector<HTMLElement>('[data-part="selection"]')!;

    expect(getComputedStyle(chooser).backgroundColor).toBe(secondStyle.backgroundColor);
    expect(secondStyle.backgroundColor).not.toBe(firstStyle.backgroundColor);
  });
});

/**
 * A template that fits the frame scrolls nothing. The last column's resizer
 * is held inside the row, but the rule found it as the row's last child, and
 * with columns that yield to the frame the pop-in header comes after it: half
 * a resizer hung past the template, twelve pixels of horizontal scroll.
 */
describe('DataGrid with a template that fits its frame', () => {
  it('has no horizontal overflow', async () => {
    const { container } = render(
      <div style={{ inlineSize: 372 }}>
        <DataGrid<Entry>
          aria-label="Entries"
          columns={[
            { id: 'date', label: 'Date', accessor: () => '2026-10-22', width: 104 },
            { id: 'payee', label: 'Payee', rowHeader: true, flex: 2, minWidth: 150 },
            {
              id: 'category',
              label: 'Category',
              accessor: () => 'Food',
              flex: 1,
              minWidth: 160,
              maxWidth: 280,
              priority: 2,
            },
            {
              id: 'tags',
              label: 'Tags',
              accessor: () => 'a, b',
              width: 160,
              priority: 5,
              popin: false,
            },
            { id: 'amount', label: 'Amount', kind: 'number', width: 148, priority: 1 },
          ]}
          defaultColumnState={{ hidden: ['date'] }}
          rowKey="id"
          rows={ROWS.slice(0, 5)}
          selectionMode="multiple"
          virtualize={false}
        />
      </div>,
    );
    await frame();
    await frame();
    const scroller = container.querySelector('[data-part="scroll"]') as HTMLElement;
    expect(scroller.scrollWidth - scroller.clientWidth).toBe(0);
  });
});

/**
 * A grid without a height grows to its rows and an ancestor scrolls. Its own
 * scroller was as tall as its content, so the end of the rows was always
 * "within the threshold" and every page was requested at mount, with no
 * scroll at all. The next page is asked for when the end nears the visible
 * area of whatever scrolls.
 */
describe('DataGrid loading more inside a scrolling ancestor', () => {
  it('asks for one page at mount and one more after the ancestor scrolls to the end', async () => {
    let calls = 0;
    function Feed() {
      const [count, setCount] = useState(30);
      return (
        <div data-testid="ancestor" style={{ blockSize: 600, overflow: 'auto' }}>
          <DataGrid<Entry>
            aria-label="Entries"
            columns={COLUMNS}
            hasMore={count < 450}
            onLoadMore={() => {
              calls += 1;
              setCount((current) => current + 30);
            }}
            rowHeight={56}
            rowKey="id"
            rows={MANY.slice(0, count)}
          />
        </div>
      );
    }
    const { getByTestId } = render(<Feed />);
    for (let index = 0; index < 10; index += 1) await act(frame);
    expect(calls).toBeLessThanOrEqual(1);

    const before = calls;
    const ancestor = getByTestId('ancestor');
    ancestor.scrollTop = ancestor.scrollHeight;
    for (let index = 0; index < 10; index += 1) await act(frame);
    expect(calls).toBe(before + 1);
  });
});

const MANY: Entry[] = Array.from({ length: 450 }, (_, index) => ({
  id: `M${String(index)}`,
  payee: `Payee ${String(index)}`,
  amount: index,
}));

/**
 * A drag moves a guide and leaves the column
 * still: on a grid of rich rows the content lagged behind the pointer while
 * every move reflowed every cell. The width is applied once, on release, and
 * Escape leaves it as it was.
 */
describe('DataGrid resizing a column by its resizer', () => {
  async function mouse(
    type: 'mousePressed' | 'mouseMoved' | 'mouseReleased',
    x: number,
    y: number,
  ) {
    const frame = window.frameElement?.getBoundingClientRect();
    await cdp().send('Input.dispatchMouseEvent', {
      type,
      x: (frame?.left ?? 0) + x,
      y: (frame?.top ?? 0) + y,
      button: 'left',
      buttons: type === 'mouseReleased' ? 0 : 1,
      clickCount: 1,
    });
  }

  function scene() {
    const onColumnStateChange = vi.fn();
    const { container } = render(
      <div style={{ inlineSize: 400 }}>
        <DataGrid<Entry>
          aria-label="Entries"
          columns={[
            { id: 'payee', label: 'Payee', rowHeader: true, width: 160 },
            { id: 'amount', label: 'Amount', kind: 'number', width: 120 },
          ]}
          onColumnStateChange={onColumnStateChange}
          rowKey="id"
          rows={ROWS.slice(0, 5)}
          virtualize={false}
        />
      </div>,
    );
    const header = container.querySelector(
      '[data-part="column-header"][data-column="payee"]',
    ) as HTMLElement;
    const resizer = header.querySelector('[data-part="resizer"]') as HTMLElement;
    const grid = container.querySelector('[data-ui="data-grid"]') as HTMLElement;
    const rect = resizer.getBoundingClientRect();
    const start = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const template = () => getComputedStyle(grid).getPropertyValue('--slotted-data-grid-template');
    return { onColumnStateChange, header, grid, start, template };
  }

  it('moves only a guide while dragging and applies the width once on release', async () => {
    const { onColumnStateChange, header, grid, start, template } = scene();
    const width = header.getBoundingClientRect().width;
    const before = template();
    await mouse('mousePressed', start.x, start.y);
    for (let step = 1; step <= 20; step += 1)
      await mouse('mouseMoved', start.x + step * 2, start.y);
    expect(header.getBoundingClientRect().width).toBe(width);
    expect(template()).toBe(before);
    expect(onColumnStateChange).not.toHaveBeenCalled();
    expect(grid.querySelector('[data-part="resize-guide"]')).not.toBeNull();

    await mouse('mouseReleased', start.x + 40, start.y);
    expect(onColumnStateChange).toHaveBeenCalledTimes(1);
    const [state, request] = onColumnStateChange.mock.calls[0]!;
    expect(state.widths.payee).toBe(Math.round(width) + 40);
    expect(request.reason).toBe('pointer');
    expect(grid.querySelector('[data-part="resize-guide"]')).toBeNull();
  });

  it('leaves the width and removes the guide on Escape', async () => {
    const { onColumnStateChange, header, grid, start } = scene();
    const width = header.getBoundingClientRect().width;
    await mouse('mousePressed', start.x, start.y);
    for (let step = 1; step <= 10; step += 1)
      await mouse('mouseMoved', start.x + step * 3, start.y);
    await userEvent.keyboard('{Escape}');
    expect(grid.querySelector('[data-part="resize-guide"]')).toBeNull();
    await mouse('mouseReleased', start.x + 30, start.y);
    expect(header.getBoundingClientRect().width).toBe(width);
    expect(onColumnStateChange).not.toHaveBeenCalled();
  });
});
