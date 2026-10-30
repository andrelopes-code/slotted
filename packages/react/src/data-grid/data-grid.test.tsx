import type {
  GridCell,
  GridColumn,
  GridColumnState,
  GridDensity,
  GridQuery,
} from '@slotted/core/grid';
import { emptyQuery, POPIN_COLUMN_ID, withPageIndex } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/data-grid/contract.json';
import { DataGrid } from './data-grid';
import { SELECTION_COLUMN } from './data-grid-constants';
import { TooltipDefaultsProvider } from '../tooltip/tooltip-defaults';
import { DataGridDefaultsProvider } from './data-grid-defaults';
import { SlottedProvider } from '../i18n';
import type {
  DataGridCellContext,
  DataGridColumn,
  DataGridColumnStateRequest,
  DataGridHandle,
  DataGridProps,
} from './data-grid.types';

interface Shipment {
  id: string;
  customer: string;
  carrier: string;
  weight: number | null;
  shipped: string;
  priority: boolean;
}

const ROWS: Shipment[] = [
  {
    id: 'S1',
    customer: 'Aurora',
    carrier: 'DHL',
    weight: 142.5,
    shipped: '2026-09-12',
    priority: true,
  },
  {
    id: 'S2',
    customer: 'Bloom',
    carrier: 'UPS',
    weight: 18.2,
    shipped: '2026-09-10',
    priority: false,
  },
  {
    id: 'S3',
    customer: 'Nordwind',
    carrier: 'FedEx',
    weight: null,
    shipped: '2026-09-08',
    priority: true,
  },
  {
    id: 'S4',
    customer: 'Casa Verde',
    carrier: 'DHL',
    weight: 64.3,
    shipped: '2026-09-13',
    priority: false,
  },
];

const COLUMNS: GridColumn<Shipment>[] = [
  { id: 'id', label: 'Tracking', rowHeader: true, width: 120 },
  { id: 'customer', label: 'Customer', width: 160, editable: true },
  {
    id: 'carrier',
    label: 'Carrier',
    kind: 'set',
    options: [
      { value: 'DHL', label: 'DHL' },
      { value: 'UPS', label: 'UPS' },
      { value: 'FedEx', label: 'FedEx' },
    ],
  },
  {
    id: 'weight',
    label: 'Weight',
    kind: 'number',
    aggregate: 'sum',
    editable: true,
    validate: (value) =>
      typeof value === 'number' && value < 0 ? 'A weight is not negative' : null,
  },
  { id: 'shipped', label: 'Shipped', kind: 'date' },
  { id: 'priority', label: 'Priority', kind: 'boolean' },
];

function Shipments(props: Partial<DataGridProps<Shipment>>) {
  return (
    <DataGrid<Shipment>
      columns={COLUMNS}
      aria-label="Shipments"
      rowKey="id"
      rows={ROWS}
      {...props}
    />
  );
}

const grid = () => screen.getByRole('grid', { name: 'Shipments' });
const cell = (row: string, column: string) =>
  grid().querySelector<HTMLElement>(`[data-row="${row}"] [data-column="${column}"]`)!;
const header = (column: string) =>
  grid().querySelector<HTMLElement>(`[data-part="column-header"][data-column="${column}"]`)!;

/** The glyph a family control draws inside itself, as the Glyph element. */
const glyphOf = (scope: Element | null | undefined) =>
  scope?.querySelector(':scope > [data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');

describe('DataGrid, the pattern', () => {
  it('is a grid of rows and cells, with every count written', () => {
    render(<Shipments />);
    const root = grid();
    expect(root).toHaveAttribute('data-ui', 'data-grid');
    expect(root).toHaveAttribute('aria-colcount', '6');
    /* Four rows, the header row and the summary the aggregating column draws. */
    expect(root).toHaveAttribute('aria-rowcount', '6');
    expect(root.querySelectorAll('[role="rowgroup"]')).toHaveLength(3);
    expect(root.querySelectorAll('[role="columnheader"]')).toHaveLength(6);
    expect(root.querySelectorAll('[role="rowheader"]')).toHaveLength(4);
    expect(cell('S1', 'customer')).toHaveAttribute('aria-colindex', '2');
    expect(cell('S1', 'customer').closest('[role="row"]')).toHaveAttribute('aria-rowindex', '2');
    /* One tab stop always: the header's first cell until the reader has been anywhere. */
    const stops = root.querySelectorAll('[tabindex="0"]');
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(header('id'));
  });

  /**
   * A native input is a tab stop without a tabindex attribute: counting
   * `[tabindex="0"]` misses a selection box that stayed in the sequence.
   */
  it('keeps one tab stop with a selection column, the boxes included', () => {
    const stops = () =>
      [
        ...grid().querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
        ),
      ].filter((node) => node.tabIndex >= 0 && !node.matches(':disabled'));
    const { rerender } = render(<Shipments selectionMode="multiple" />);
    expect(stops()).toHaveLength(1);
    rerender(
      <Shipments selectionMode="multiple" current={{ row: 'S2', column: SELECTION_COLUMN }} />,
    );
    expect(stops().every((node) => node.closest('[data-row="S2"]') !== null)).toBe(true);
  });

  it('declares every part the contract names on the elements it names', () => {
    render(<Shipments selectionMode="multiple" renderDetail={() => <p>detail</p>} filterRow />);
    const parts = new Set(
      [...grid().querySelectorAll<HTMLElement>('[data-part]')].map((node) => node.dataset['part']),
    );
    for (const part of [
      'root',
      'scroll',
      'head',
      'header-row',
      'column-header',
      'column-actions',
      'column-menu',
      'resizer',
      'filter-row',
      'filter-cell',
      'filter-operand',
      'filter-operator',
      'body',
      'row',
      'row-header',
      'cell',
      'selection',
      'expander',
    ]) {
      expect(parts.has(part), part).toBe(true);
    }
    expect(contract.members['data-grid'].parts).toContain('filter-panel');
  });

  it('puts one cell in the tab sequence once the cursor exists, and moves it with the arrows', () => {
    render(<Shipments defaultCurrent={{ row: 'S1', column: 'customer' }} />);
    expect(cell('S1', 'customer')).toHaveAttribute('tabindex', '0');
    expect(cell('S1', 'customer')).toHaveAttribute('data-current');
    cell('S1', 'customer').focus();
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'ArrowRight' });
    expect(cell('S1', 'carrier')).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(cell('S1', 'carrier'));
    fireEvent.keyDown(cell('S1', 'carrier'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cell('S2', 'carrier'));
    fireEvent.keyDown(cell('S2', 'carrier'), { key: 'End' });
    expect(document.activeElement).toBe(cell('S2', 'priority'));
    fireEvent.keyDown(cell('S2', 'priority'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cell('S2', 'priority'));
    fireEvent.keyDown(cell('S2', 'priority'), { key: 'Home', ctrlKey: true });
    expect(document.activeElement).toBe(cell('S1', 'id'));
    fireEvent.keyDown(cell('S1', 'id'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(header('id'));
    fireEvent.keyDown(header('id'), { key: 'End', ctrlKey: true });
    expect(document.activeElement).toBe(cell('S4', 'priority'));
  });

  it('asks before the cursor moves, with the reason', () => {
    const onCurrentChange = vi.fn();
    render(
      <Shipments defaultCurrent={{ row: 'S1', column: 'id' }} onCurrentChange={onCurrentChange} />,
    );
    fireEvent.keyDown(cell('S1', 'id'), { key: 'ArrowDown' });
    expect(onCurrentChange).toHaveBeenLastCalledWith(
      { row: 'S2', column: 'id' },
      expect.objectContaining({ reason: 'keyboard' }),
    );
    fireEvent.pointerDown(cell('S3', 'customer'), { button: 0 });
    expect(onCurrentChange).toHaveBeenLastCalledWith(
      { row: 'S3', column: 'customer' },
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('keeps the cursor on the same index when its row leaves', () => {
    function Filtered() {
      const [query, setQuery] = useState<GridQuery>(emptyQuery());
      return (
        <>
          <button onClick={() => setQuery({ ...query, search: 'Nord' })}>narrow</button>
          <Shipments
            defaultCurrent={{ row: 'S2', column: 'customer' }}
            onQueryChange={setQuery}
            query={query}
          />
        </>
      );
    }
    render(<Filtered />);
    fireEvent.click(screen.getByText('narrow'));
    expect(grid().querySelector('[data-current][data-part="cell"]')).toBe(cell('S3', 'customer'));
  });
});

describe('DataGrid, the query', () => {
  it('sorts by one key on a press, cycles it, and appends with Shift', () => {
    const onQueryChange = vi.fn();
    render(<Shipments onQueryChange={onQueryChange} />);
    fireEvent.click(header('weight'));
    expect(header('weight')).toHaveAttribute('aria-sort', 'ascending');
    expect(glyphOf(header('weight').querySelector('[data-part="sort"]'))).toBe('chevron-down');
    expect(glyphOf(header('weight').querySelector('[data-part="column-menu"]'))).toBe('ellipsis');
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: [{ column: 'weight', direction: 'ascending' }] }),
      expect.objectContaining({ reason: 'pointer', change: 'sort' }),
    );
    expect(
      [...grid().querySelectorAll('[role="rowheader"]')].map((node) => node.textContent),
    ).toEqual(['S2', 'S4', 'S1', 'S3']);
    fireEvent.click(header('weight'));
    expect(header('weight')).toHaveAttribute('aria-sort', 'descending');
    fireEvent.click(header('customer'), { shiftKey: true });
    expect(header('weight')).toHaveAttribute('aria-sort', 'descending');
    expect(header('customer')).not.toHaveAttribute('aria-sort');
    expect(header('customer').querySelector('[data-part="sort"]')).toHaveAttribute(
      'data-index',
      '2',
    );
    fireEvent.click(header('weight'));
    expect(header('weight')).not.toHaveAttribute('aria-sort');
  });

  it('sorts on a press on the name while the scroller is a tab stop, and never on the handle', () => {
    render(<Shipments />);
    /* The scroller becomes a tab stop while the grid overflows; a press on
       the name walked up to it and sorted nothing. */
    grid().querySelector('[data-part="scroll"]')!.setAttribute('tabindex', '0');
    fireEvent.click(header('customer').querySelector('span')!);
    expect(header('customer')).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(header('customer').querySelector('[data-part="resizer"]')!);
    expect(header('customer')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sorts from the keyboard on the header cell', () => {
    render(<Shipments defaultCurrent={{ row: 'header', column: 'customer' }} />);
    fireEvent.keyDown(header('customer'), { key: 'Enter' });
    expect(header('customer')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('applies a column filter from the filter row after the debounce, and on Enter at once', async () => {
    const onQueryChange = vi.fn();
    render(<Shipments filterRow filterDebounce={10} onQueryChange={onQueryChange} />);
    const input = within(
      grid().querySelector<HTMLElement>('[data-part="filter-cell"][data-column="customer"]')!,
    ).getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ver' } });
    await waitFor(() => expect(onQueryChange).toHaveBeenCalled());
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: {
          join: 'and',
          rules: [
            {
              field: 'customer',
              filter: {
                kind: 'text',
                join: 'and',
                conditions: [{ operator: 'contains', value: 'ver', end: null }],
              },
            },
          ],
        },
      }),
      expect.objectContaining({ change: 'filter' }),
    );
    expect(grid().querySelectorAll('[data-part="row"]')).toHaveLength(1);
    expect(header('customer')).toHaveAttribute('data-filtered');
    expect(glyphOf(header('customer').querySelector('[data-part="filter"]'))).toBe('funnel');
  });

  it('edits the panel as a draft and reports on Apply', () => {
    const onQueryChange = vi.fn();
    render(
      <Shipments
        onQueryChange={onQueryChange}
        defaultCurrent={{ row: 'header', column: 'customer' }}
      />,
    );
    fireEvent.keyDown(header('customer'), { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Filter…' }));
    const panel = document.querySelector<HTMLElement>('[data-part="filter-panel"]')!;
    expect(panel).toHaveAttribute('data-ui', 'data-grid');
    const input = within(panel).getByRole('textbox', { name: 'Value' });
    fireEvent.change(input, { target: { value: 'au' } });
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(grid().querySelectorAll('[data-part="row"]')).toHaveLength(1);
  });

  it('shows the empty state a filter left, and clears it from there', () => {
    render(<Shipments defaultQuery={{ ...emptyQuery(), search: 'zzz' }} />);
    expect(grid().querySelector('[data-part="empty"]')).toHaveTextContent(
      'No rows match the current filters',
    );
    // The message is inside the result state's announcing region, as in Angular.
    expect(grid().querySelector('[data-part="empty"] [role="status"]')).toHaveTextContent(
      'No rows match the current filters',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(grid().querySelectorAll('[data-part="row"]')).toHaveLength(4);
  });

  it('pages in client mode and states the range in the footer', () => {
    render(<Shipments defaultQuery={emptyQuery({ index: 1, size: 3 })} />);
    expect(grid().querySelectorAll('[data-part="row"]')).toHaveLength(1);
    expect(grid().querySelector('[data-range]')).toHaveTextContent('4–4 of 4');
  });

  it('draws the rows it is given in server mode, with the stated total', () => {
    render(<Shipments totalCount={3412} defaultQuery={emptyQuery({ index: 2, size: 4 })} />);
    expect(grid()).toHaveAttribute('aria-rowcount', '3413');
    expect(grid().querySelector('[data-range]')).toHaveTextContent('9–12 of 3,412');
  });

  it('groups, with counts and aggregates, and closes a group with the left arrow', () => {
    render(
      <Shipments
        defaultQuery={{ ...emptyQuery(), group: ['carrier'] }}
        defaultCurrent={{ row: 'group:carrier=DHL', column: 'id' }}
      />,
    );
    const groups = grid().querySelectorAll('[data-part="group-row"]');
    expect(groups).toHaveLength(3);
    expect(glyphOf(groups[0]!.querySelector('[data-part="group-toggle"]'))).toBe('chevron-right');
    expect(groups[0]).toHaveAttribute('aria-level', '1');
    expect(groups[0]).toHaveAttribute('aria-expanded', 'true');
    expect(groups[0]).toHaveTextContent('2 rows');
    expect(groups[0]!.querySelector('[data-aggregate]')).toHaveTextContent('206.8');
    fireEvent.keyDown(groups[0]!.querySelector('[role="gridcell"]')!, { key: 'ArrowLeft' });
    expect(grid().querySelectorAll('[data-part="group-row"]')[0]).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(grid().querySelectorAll('[data-part="row"]')).toHaveLength(2);
  });

  /**
   * A server that pages by date sends its rows already ordered for grouping;
   * in server mode the grid emitted one plain row per row and ignored the
   * query's group. It groups what it is given, in the order given.
   */
  it('groups the rows a server sent, in their order, in server mode', () => {
    const dated = [
      { ...ROWS[0]!, id: 'D1', shipped: '2026-09-13' },
      { ...ROWS[1]!, id: 'D2', shipped: '2026-09-13' },
      { ...ROWS[2]!, id: 'D3', shipped: '2026-09-12' },
      { ...ROWS[3]!, id: 'D4', shipped: '2026-09-12' },
      { ...ROWS[0]!, id: 'D5', shipped: '2026-09-11' },
      { ...ROWS[1]!, id: 'D6', shipped: '2026-09-11' },
    ];
    render(
      <Shipments
        defaultQuery={{ ...emptyQuery(), group: ['shipped'] }}
        mode="server"
        rows={dated}
        totalCount={6}
      />,
    );
    const groups = grid().querySelectorAll('[data-part="group-row"]');
    expect(groups).toHaveLength(3);
    for (const group of groups) expect(group).toHaveTextContent('2 rows');
    expect(grid().querySelectorAll('[data-part="row"]')).toHaveLength(6);
  });

  /**
   * The row's actions scrolled out of the frame with the columns unless the
   * application pinned them by hand. A column of kind `actions` is pinned to
   * the end while no column state says otherwise.
   */
  it('pins the actions column to the end without any column state', () => {
    render(
      <Shipments
        columns={[...COLUMNS, { id: 'actions', label: 'Actions', kind: 'actions' }]}
        cellRenderers={{ actions: () => <button type="button">More</button> }}
      />,
    );
    expect(cell('S1', 'actions')).toHaveAttribute('data-pinned', 'end');
    expect(header('actions')).toHaveAttribute('data-pinned', 'end');
  });

  it('draws a summary row from the aggregating columns', () => {
    render(<Shipments />);
    expect(grid().querySelector('[data-part="summary"] [data-column="weight"]')).toHaveTextContent(
      '225',
    );
  });
});

describe('DataGrid, selection', () => {
  it('selects rows with the checkbox, extends with Shift, and covers the set from the header', () => {
    const onValueChange = vi.fn();
    render(<Shipments selectionMode="multiple" onValueChange={onValueChange} />);
    expect(grid()).toHaveAttribute('aria-multiselectable', 'true');
    fireEvent.click(within(cell('S1', '__selection')).getByRole('checkbox'));
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['S1'],
      expect.objectContaining({ reason: 'pointer' }),
    );
    expect(cell('S1', 'id').closest('[role="row"]')).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(cell('S3', '__selection')).getByRole('checkbox'), { shiftKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith(['S1', 'S2', 'S3'], expect.anything());
    const all = within(
      grid().querySelector<HTMLElement>('[data-part="head"] [data-part="selection"]')!,
    ).getByRole('checkbox');
    expect(all).toHaveAccessibleName('Select all 4 rows');
    fireEvent.click(all);
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['S1', 'S2', 'S3', 'S4'],
      expect.objectContaining({ reason: 'select' }),
    );
  });

  /**
   * checkbox's contract names the control through its label (`labelAssociation:
   * for`), and a bare box's label holds hidden text (`labelHidden`), which is
   * the DOM `SlDataGrid` draws for the same column.
   */
  it('names each selection box through its label, in hidden text', () => {
    render(<Shipments selectionMode="multiple" />);
    const boxes = grid().querySelectorAll<HTMLElement>(
      '[data-part="selection"] [data-ui="checkbox"]',
    );
    expect(boxes.length).toBeGreaterThan(1);
    for (const box of boxes) {
      const control = box.querySelector('input') as HTMLInputElement;
      const label = box.querySelector('[data-part="label"]') as HTMLLabelElement;
      expect(control).not.toHaveAttribute('aria-label');
      expect(label.querySelector('[data-ui="visually-hidden"]')?.textContent).toBe(
        control.labels?.[0]?.textContent,
      );
      expect(box).toHaveAttribute('data-label-hidden');
    }
    expect(within(cell('S1', '__selection')).getByRole('checkbox')).toHaveAccessibleName(
      'Select row S1',
    );
  });

  it('names a selection box by the row header text, and by the key only without a row header', () => {
    interface Person {
      id: string;
      name: string;
    }
    const people: Person[] = [{ id: '01a15bae-5c1e-4f0b-9a57-0f3c2d9e7b11', name: 'Ada Lovelace' }];
    const { rerender } = render(
      <DataGrid<Person>
        aria-label="People"
        columns={[{ id: 'name', label: 'Name', rowHeader: true }]}
        rowKey="id"
        rows={people}
        selectionMode="multiple"
      />,
    );
    const box = () =>
      screen
        .getByRole('grid', { name: 'People' })
        .querySelector<HTMLElement>('[data-part="body"] [data-part="selection"] input')!;
    expect(box()).toHaveAccessibleName('Select row Ada Lovelace');
    rerender(
      <DataGrid<Person>
        aria-label="People"
        columns={[{ id: 'name', label: 'Name' }]}
        rowKey="id"
        rows={people}
        selectionMode="multiple"
      />,
    );
    expect(box()).toHaveAccessibleName('Select row 01a15bae-5c1e-4f0b-9a57-0f3c2d9e7b11');
  });

  it('toggles the row with Shift+Space from any cell, and selects everything with Ctrl+A', () => {
    const onValueChange = vi.fn();
    render(
      <Shipments
        selectionMode="multiple"
        onValueChange={onValueChange}
        defaultCurrent={{ row: 'S2', column: 'customer' }}
      />,
    );
    fireEvent.keyDown(cell('S2', 'customer'), { key: ' ', shiftKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['S2'],
      expect.objectContaining({ reason: 'keyboard' }),
    );
    fireEvent.keyDown(cell('S2', 'customer'), { key: 'a', ctrlKey: true });
    expect(onValueChange).toHaveBeenLastCalledWith(['S1', 'S2', 'S3', 'S4'], expect.anything());
  });

  it('selects a range of cells with Shift and the arrows, names its edges, and copies it', async () => {
    const onRangeChange = vi.fn();
    const write = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: write } });
    render(
      <Shipments
        selectionMode="range"
        onRangeChange={onRangeChange}
        defaultCurrent={{ row: 'S1', column: 'customer' }}
      />,
    );
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'ArrowDown', shiftKey: true });
    fireEvent.keyDown(cell('S2', 'customer'), { key: 'ArrowRight', shiftKey: true });
    expect(onRangeChange).toHaveBeenLastCalledWith(
      { anchor: { row: 'S1', column: 'customer' }, focus: { row: 'S2', column: 'carrier' } },
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(cell('S1', 'customer')).toHaveAttribute('data-range-edge', 'top start');
    expect(cell('S2', 'carrier')).toHaveAttribute('data-range-edge', 'bottom end');
    expect(cell('S1', 'customer')).toHaveAttribute('aria-selected', 'true');
    expect(cell('S3', 'customer')).not.toHaveAttribute('data-in-range');
    fireEvent.keyDown(cell('S2', 'carrier'), { key: 'c', ctrlKey: true });
    await waitFor(() => expect(write).toHaveBeenCalledWith('Aurora\tDHL\nBloom\tUPS'));
    fireEvent.keyDown(cell('S2', 'carrier'), { key: 'Escape' });
    expect(onRangeChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: 'clear' }),
    );
  });
});

describe('DataGrid, editing', () => {
  it('opens an editor on Enter, commits on Enter and moves down, cancels on Escape', async () => {
    const onEditCommit = vi.fn();
    render(
      <Shipments onEditCommit={onEditCommit} defaultCurrent={{ row: 'S1', column: 'customer' }} />,
    );
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'Enter' });
    const input = within(cell('S1', 'customer')).getByRole('textbox');
    expect(cell('S1', 'customer')).toHaveAttribute('data-editing');
    fireEvent.change(input, { target: { value: 'Aurora Textiles' } });
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'Enter' });
    await waitFor(() =>
      expect(onEditCommit).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'S1',
          column: 'customer',
          value: 'Aurora Textiles',
          previous: 'Aurora',
          reason: 'keyboard',
        }),
      ),
    );
    await waitFor(() => expect(cell('S2', 'customer')).toHaveAttribute('data-current'));
    fireEvent.keyDown(cell('S2', 'customer'), { key: 'F2' });
    fireEvent.change(within(cell('S2', 'customer')).getByRole('textbox'), {
      target: { value: 'x' },
    });
    fireEvent.keyDown(cell('S2', 'customer'), { key: 'Escape' });
    expect(cell('S2', 'customer')).not.toHaveAttribute('data-editing');
    expect(onEditCommit).toHaveBeenCalledTimes(1);
  });

  it('commits a draft set in the same handler as the commit', async () => {
    const onEditCommit = vi.fn();
    render(
      <Shipments
        defaultCurrent={{ row: 'S1', column: 'customer' }}
        editorRenderers={{
          customer: ({ setDraft, commit }) => (
            <button
              type="button"
              onClick={() => {
                setDraft('x');
                commit();
              }}
            >
              Choose x
            </button>
          ),
        }}
        onEditCommit={onEditCommit}
      />,
    );
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'Enter' });
    fireEvent.click(within(cell('S1', 'customer')).getByRole('button', { name: 'Choose x' }));
    await waitFor(() =>
      expect(onEditCommit).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'S1', column: 'customer', value: 'x', previous: 'Aurora' }),
      ),
    );
    expect(cell('S1', 'customer')).not.toHaveAttribute('data-editing');
  });

  it('opens the editor with the typed key as its first character', () => {
    render(<Shipments defaultCurrent={{ row: 'S1', column: 'customer' }} />);
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'Z' });
    expect(within(cell('S1', 'customer')).getByRole('textbox')).toHaveValue('Z');
  });

  it('keeps the draft and marks the cell when validation fails, and when the commit rejects', async () => {
    const onEditCommit = vi.fn().mockRejectedValue(new Error('Offline'));
    render(
      <Shipments onEditCommit={onEditCommit} defaultCurrent={{ row: 'S1', column: 'weight' }} />,
    );
    fireEvent.keyDown(cell('S1', 'weight'), { key: 'Enter' });
    const input = within(cell('S1', 'weight')).getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-4' } });
    fireEvent.blur(input);
    fireEvent.keyDown(cell('S1', 'weight'), { key: 'Enter' });
    await waitFor(() => expect(cell('S1', 'weight')).toHaveAttribute('data-invalid'));
    expect(cell('S1', 'weight')).toHaveAttribute('aria-invalid', 'true');
    expect(cell('S1', 'weight')).toHaveAttribute('title', 'A weight is not negative');
    expect(onEditCommit).not.toHaveBeenCalled();
    fireEvent.change(within(cell('S1', 'weight')).getByRole('spinbutton'), {
      target: { value: '40' },
    });
    fireEvent.blur(within(cell('S1', 'weight')).getByRole('spinbutton'));
    fireEvent.keyDown(cell('S1', 'weight'), { key: 'Enter' });
    await waitFor(() => expect(onEditCommit).toHaveBeenCalled());
    await waitFor(() => expect(cell('S1', 'weight')).toHaveAttribute('title', 'Offline'));
    expect(cell('S1', 'weight')).toHaveAttribute('data-editing');
  });

  it('marks a cell whose row changed under the editor as a conflict', () => {
    const { rerender } = render(<Shipments defaultCurrent={{ row: 'S1', column: 'customer' }} />);
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'Enter' });
    rerender(
      <Shipments
        defaultCurrent={{ row: 'S1', column: 'customer' }}
        rows={[{ ...ROWS[0]!, customer: 'Changed' }, ...ROWS.slice(1)]}
      />,
    );
    expect(cell('S1', 'customer')).toHaveAttribute('data-invalid');
    expect(cell('S1', 'customer')).toHaveAttribute(
      'title',
      'This value changed while you were editing',
    );
  });

  it('activates a row on Enter when activatable, and never on an editable cell', () => {
    const onActivate = vi.fn();
    render(
      <Shipments
        activatable
        onActivate={onActivate}
        defaultCurrent={{ row: 'S1', column: 'id' }}
      />,
    );
    fireEvent.keyDown(cell('S1', 'id'), { key: 'Enter' });
    expect(onActivate).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'S1', reason: 'keyboard' }),
    );
    fireEvent.keyDown(cell('S1', 'customer'), { key: 'Enter' });
    expect(cell('S1', 'customer')).toHaveAttribute('data-editing');
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('activates a row on one touch, and ignores the double press that follows it', () => {
    const onActivate = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Shipments
        activatable
        onActivate={onActivate}
        onValueChange={onValueChange}
        selectionMode="single"
      />,
    );
    const tap = (target: HTMLElement, pointerType: string) => {
      fireEvent.pointerDown(target, { button: 0, pointerType });
      fireEvent.click(target, { detail: 1 });
    };
    tap(cell('S1', 'carrier'), 'touch');
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'S1', reason: 'pointer' }),
    );
    /* The press that opens the record chose it too, as a click does. */
    expect(onValueChange).toHaveBeenLastCalledWith('S1', expect.anything());
    fireEvent.doubleClick(cell('S1', 'carrier'), { detail: 2 });
    expect(onActivate).toHaveBeenCalledTimes(1);

    tap(cell('S2', 'carrier'), 'pen');
    expect(onActivate).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'S2', reason: 'pointer' }),
    );

    /* The mouse keeps the double press. */
    tap(cell('S3', 'carrier'), 'mouse');
    expect(onActivate).toHaveBeenCalledTimes(2);
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + 1000);
    fireEvent.doubleClick(cell('S3', 'carrier'), { detail: 2 });
    expect(onActivate).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'S3', reason: 'pointer' }),
    );
    vi.restoreAllMocks();
  });

  it('never activates on one touch of a widget in the cell, nor of a cell in edit', () => {
    const onActivate = vi.fn();
    render(
      <Shipments
        activatable
        cellRenderers={{ carrier: ({ text }) => <button type="button">{text}</button> }}
        defaultCurrent={{ row: 'S1', column: 'customer' }}
        onActivate={onActivate}
      />,
    );
    const widget = cell('S1', 'carrier').querySelector('button')!;
    fireEvent.pointerDown(widget, { button: 0, pointerType: 'touch' });
    fireEvent.click(widget, { detail: 1 });
    expect(onActivate).not.toHaveBeenCalled();

    fireEvent.keyDown(cell('S1', 'customer'), { key: 'Enter' });
    expect(cell('S1', 'customer')).toHaveAttribute('data-editing');
    fireEvent.pointerDown(cell('S1', 'customer'), { button: 0, pointerType: 'touch' });
    fireEvent.click(cell('S1', 'customer'), { detail: 1 });
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('writes aria-readonly on a cell that does not edit while others do', () => {
    render(<Shipments />);
    expect(cell('S1', 'id')).toHaveAttribute('aria-readonly', 'true');
    expect(cell('S1', 'customer')).not.toHaveAttribute('aria-readonly');
  });
});

describe('DataGrid, columns', () => {
  it('resizes from the keyboard by a step, clamped, and announces', () => {
    const onColumnStateChange = vi.fn();
    render(
      <Shipments
        onColumnStateChange={onColumnStateChange}
        defaultCurrent={{ row: 'header', column: 'customer' }}
      />,
    );
    fireEvent.keyDown(header('customer'), { key: 'ArrowRight', ctrlKey: true, shiftKey: true });
    expect(onColumnStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ widths: { customer: 168 } }),
      expect.objectContaining({ reason: 'keyboard', change: 'width' }),
    );
    expect(grid().style.getPropertyValue('--slotted-data-grid-template')).toContain('168px');
  });

  /**
   * Every column name truncates, and a name cut to `Cus…` is unreadable until
   * something says the words. The hint says them, and only while the box is
   * measured as cutting them.
   */
  it('opens a hint over a column name its box cuts, and none over one that fits', async () => {
    function measure(element: Element, { client, scroll }: { client: number; scroll: number }) {
      Object.defineProperty(element, 'clientWidth', { configurable: true, value: client });
      Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scroll });
    }

    render(
      <TooltipDefaultsProvider openDelay={0}>
        <Shipments />
      </TooltipDefaultsProvider>,
    );
    const name = header('customer').querySelector('span')!;
    /* jsdom does not expand the `overflow` shorthand, so the axis is written. */
    name.style.overflowX = 'hidden';

    measure(name, { client: 160, scroll: 160 });
    fireEvent.pointerEnter(name, { pointerType: 'mouse' });
    expect(document.querySelector('[role="tooltip"]')).toBeNull();

    measure(name, { client: 48, scroll: 160 });
    fireEvent.pointerEnter(name, { pointerType: 'mouse' });
    const hint = await waitFor(() => {
      const found = document.querySelector('[role="tooltip"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(hint.textContent).toBe('Customer');
    /* The header already states the words: naming them twice is reading them twice. */
    expect(hint).toHaveAttribute('aria-hidden', 'true');
    expect(name).not.toHaveAttribute('aria-describedby');
  });

  it('moves a column with Alt and the arrows, inside its zone', () => {
    const onColumnStateChange = vi.fn();
    render(
      <Shipments
        onColumnStateChange={onColumnStateChange}
        defaultCurrent={{ row: 'header', column: 'customer' }}
      />,
    );
    fireEvent.keyDown(header('customer'), { key: 'ArrowRight', altKey: true });
    expect(onColumnStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        order: ['id', 'carrier', 'customer', 'weight', 'shipped', 'priority'],
      }),
      expect.objectContaining({ change: 'order' }),
    );
    expect(
      [...grid().querySelectorAll('[data-part="column-header"]')].map((node) =>
        node.getAttribute('data-column'),
      ),
    ).toEqual(['id', 'carrier', 'customer', 'weight', 'shipped', 'priority']);
  });

  it('pins, hides and fits through the column menu', () => {
    const onColumnStateChange = vi.fn();
    render(
      <Shipments
        onColumnStateChange={onColumnStateChange}
        defaultCurrent={{ row: 'header', column: 'weight' }}
      />,
    );
    fireEvent.keyDown(header('weight'), { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Pin to end' }));
    expect(onColumnStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ pinned: { start: [], end: ['weight'] } }),
      expect.objectContaining({ change: 'pinned' }),
    );
    expect(header('weight')).toHaveAttribute('data-pinned', 'end');
    expect(header('weight')).toHaveAttribute('data-pin-edge');
    expect(header('weight').style.getPropertyValue('--slotted-data-grid-pin-offset')).toBe('0px');
    fireEvent.keyDown(header('weight'), { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide column' }));
    expect(grid().querySelector('[data-part="column-header"][data-column="weight"]')).toBeNull();
    expect(grid()).toHaveAttribute('aria-colcount', '5');
  });

  it('takes a controlled column state and normalises it', () => {
    const state: GridColumnState = {
      order: ['weight', 'id'],
      widths: {},
      hidden: ['priority', 'ghost'],
      pinned: { start: ['id'], end: [] },
    };
    render(<Shipments columnState={state} />);
    expect(
      [...grid().querySelectorAll('[data-part="column-header"]')].map((node) =>
        node.getAttribute('data-column'),
      ),
    ).toEqual(['id', 'weight', 'customer', 'carrier', 'shipped']);
  });
});

describe('DataGrid, the rest', () => {
  it('opens a detail row under an expandable row, reachable by the arrows', () => {
    render(
      <Shipments
        renderDetail={(row) => <p>Detail of {row.id}</p>}
        defaultCurrent={{ row: 'S1', column: '__expander' }}
      />,
    );
    fireEvent.keyDown(cell('S1', '__expander'), { key: 'ArrowRight' });
    expect(screen.getByText('Detail of S1').closest('[data-part="detail"]')).toHaveAttribute(
      'role',
      'row',
    );
    expect(within(cell('S1', '__expander')).getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(glyphOf(within(cell('S1', '__expander')).getByRole('button'))).toBe('chevron-right');
    fireEvent.keyDown(cell('S1', '__expander'), { key: 'ArrowLeft' });
    expect(screen.queryByText('Detail of S1')).toBeNull();
  });

  it('exposes the imperative surface', () => {
    function Handled() {
      const handle = useRef<DataGridHandle | null>(null);
      return (
        <>
          <button onClick={() => handle.current?.focusCell({ row: 'S3', column: 'weight' })}>
            go
          </button>
          <button onClick={() => handle.current?.startEdit({ row: 'S3', column: 'customer' })}>
            edit
          </button>
          <Shipments handle={handle} />
        </>
      );
    }
    render(<Handled />);
    fireEvent.click(screen.getByText('go'));
    expect(document.activeElement).toBe(cell('S3', 'weight'));
    fireEvent.click(screen.getByText('edit'));
    expect(cell('S3', 'customer')).toHaveAttribute('data-editing');
  });

  it('fits every column in one request, each to its own content', () => {
    const onColumnStateChange = vi.fn();
    function Handled() {
      const handle = useRef<DataGridHandle | null>(null);
      return (
        <>
          <button onClick={() => handle.current?.autofit()}>fit</button>
          <Shipments handle={handle} onColumnStateChange={onColumnStateChange} />
        </>
      );
    }
    render(<Handled />);
    const widths: Record<string, number> = {
      id: 60,
      customer: 140,
      carrier: 90,
      weight: 70,
      shipped: 100,
      priority: 50,
    };
    /* jsdom lays nothing out: the value's measured width is the column's. */
    /* jsdom's Range has no geometry at all; the method is defined for the test. */
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: Range) {
        const cell = (this.startContainer as Element).closest<HTMLElement>('[data-column]');
        const width = cell ? (widths[cell.dataset['column']!] ?? 0) : 0;
        return { width, height: 0, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0 };
      },
    });
    fireEvent.click(screen.getByText('fit'));
    expect(onColumnStateChange).toHaveBeenCalledTimes(1);
    const [state, request] = onColumnStateChange.mock.calls[0]!;
    expect(request).toEqual(expect.objectContaining({ change: 'width', reason: 'programmatic' }));
    expect(state.widths).toEqual(
      Object.fromEntries(Object.entries(widths).map(([id, width]) => [id, width])),
    );
    delete (Range.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  });

  it('marks a mounted cell whose value changed, for the stated time, and never a row that arrived', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(<Shipments highlightChanges={500} />);
      const [first, second, ...rest] = ROWS;
      rerender(
        <Shipments
          highlightChanges={500}
          rows={[first!, { ...second!, weight: 99 }, ...rest, { ...first!, id: 'S9' }]}
        />,
      );
      expect(cell('S2', 'weight')).toHaveAttribute('data-changed');
      expect(cell('S2', 'customer')).not.toHaveAttribute('data-changed');
      expect(cell('S1', 'weight')).not.toHaveAttribute('data-changed');
      expect(cell('S9', 'weight')).not.toHaveAttribute('data-changed');
      expect(grid().style.getPropertyValue('--slotted-data-grid-changed-duration')).toBe('500ms');
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(cell('S2', 'weight')).not.toHaveAttribute('data-changed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('exports the visible rows and columns as CSV, and the selected rows on request', () => {
    const urls: string[] = [];
    const created: Blob[] = [];
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        created.push(blob);
        return `blob:${created.length}`;
      },
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: (url: string) => void urls.push(url),
    });
    const clicks: string[] = [];
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      clicks.push(`${this.download}:${this.href}`);
    };
    try {
      const texts: string[] = [];
      function Handled() {
        const handle = useRef<DataGridHandle | null>(null);
        return (
          <>
            <button
              onClick={() => {
                texts.push(handle.current!.toCsv());
                handle.current?.exportCsv({ filename: 'shipments.csv' });
              }}
            >
              csv
            </button>
            <button
              onClick={() => {
                texts.push(handle.current!.toCsv({ rows: 'selected', header: false }));
                handle.current?.exportCsv({ rows: 'selected', header: false });
              }}
            >
              selected
            </button>
            <Shipments
              defaultColumnState={{ hidden: ['priority', 'shipped'], order: ['customer', 'id'] }}
              defaultQuery={{
                ...emptyQuery(),
                sort: [{ column: 'weight', direction: 'ascending' }],
              }}
              defaultValue={['S3', 'S1']}
              handle={handle}
              selectionMode="multiple"
            />
          </>
        );
      }
      render(<Handled />);
      fireEvent.click(screen.getByText('csv'));
      expect(clicks).toEqual(['shipments.csv:blob:1']);
      expect(urls).toEqual(['blob:1']);
      expect(created[0]!.type).toBe('text/csv;charset=utf-8');
      /* Sorted by weight ascending, the empty one last; hidden columns out,
         the reader's order. */
      expect(texts[0]).toBe(
        'Customer,Tracking,Carrier,Weight\r\n' +
          'Bloom,S2,UPS,18.2\r\n' +
          'Casa Verde,S4,DHL,64.3\r\n' +
          'Aurora,S1,DHL,142.5\r\n' +
          'Nordwind,S3,FedEx,\r\n',
      );
      fireEvent.click(screen.getByText('selected'));
      expect(clicks[1]).toBe('export.csv:blob:2');
      /* The selected rows in the grid's order, not the selection's. */
      expect(texts[1]).toBe('Aurora,S1,DHL,142.5\r\nNordwind,S3,FedEx,\r\n');
    } finally {
      HTMLAnchorElement.prototype.click = click;
    }
  });

  /**
   * Zero rows is an answer, and a refetch of it reads again over the empty
   * state instead of replacing it with placeholders (AF-02). `'initial'` asks
   * for the skeleton anyway.
   */
  it('keeps the empty state it drew while it reads again', () => {
    const { rerender } = render(<Shipments loading={false} rows={[]} />);
    expect(grid().querySelector('[data-part="empty"]')).not.toBeNull();

    rerender(<Shipments loading rows={[]} />);
    expect(grid().querySelector('[data-part="empty"]')).not.toBeNull();
    expect(grid().querySelector('[data-part="loader"]')).toBeNull();
    expect(grid()).toHaveAttribute('aria-busy', 'true');

    rerender(<Shipments loading="initial" rows={[]} />);
    expect(grid().querySelector('[data-part="loader"]')).not.toBeNull();
    expect(grid().querySelector('[data-part="empty"]')).toBeNull();
  });

  it('draws the skeleton for a first load, and for none after', () => {
    const { rerender } = render(<Shipments loading rows={[]} />);
    expect(grid().querySelector('[data-part="loader"]')).not.toBeNull();
    expect(grid()).not.toHaveAttribute('aria-busy');

    rerender(<Shipments loading={false} rows={[]} />);
    rerender(<Shipments loading="refresh" rows={[]} />);
    expect(grid().querySelector('[data-part="loader"]')).toBeNull();
  });

  /**
   * The gutters hold a chooser, a handle and an expander. An outline of a
   * control nobody can press yet is a control that lies, so the loader
   * reserves their width and draws nothing in them.
   */
  it('leaves the loader’s gutters empty and skeletons only the value columns', () => {
    render(<Shipments loading rows={[]} selectionMode="multiple" />);
    const cells = [...grid().querySelector('[data-part="loader"] [data-part="row"]')!.children];
    expect(cells[0]!.querySelector('[data-ui="skeleton"]')).toBeNull();
    expect(cells.slice(1).every((cell) => cell.querySelector('[data-ui="skeleton"]'))).toBe(true);
  });

  /* The skeleton rows take the height of the rows they stand in for, so the
     count that fills the frame and the rows drawn in it agree. */
  it('gives the skeleton rows the height of the body rows', () => {
    render(<Shipments loading rowHeight={56} rows={[]} />);
    const loader = grid().querySelector<HTMLElement>('[data-part="loader"]')!;
    expect(loader.style.getPropertyValue('--slotted-data-grid-loader-row-size')).toBe('56px');
  });

  it('draws the loading, empty and error states', () => {
    const { rerender } = render(<Shipments loading rows={[]} />);
    expect(grid().querySelector('[data-part="loader"]')).not.toBeNull();
    rerender(<Shipments rows={[]} />);
    expect(grid().querySelector('[data-part="empty"]')).toHaveTextContent('No rows');
    const onRetry = vi.fn();
    rerender(<Shipments rows={[]} error="Timed out" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<Shipments loading />);
    expect(grid()).toHaveAttribute('aria-busy', 'true');
  });

  it('reads defaults from the provider, an explicit prop winning', () => {
    render(
      <DataGridDefaultsProvider variant="framed">
        <Shipments rows={[]} messages={{ empty: 'Nada' }} />
      </DataGridDefaultsProvider>,
    );
    expect(grid()).toHaveAttribute('data-variant', 'framed');
    expect(grid().querySelector('[data-part="empty"]')).toHaveTextContent('Nada');
  });

  it('speaks the language in force: its words, its plurals and its booleans', () => {
    const { rerender } = render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Shipments selectionMode="multiple" />
      </SlottedProvider>,
    );
    const all = within(
      grid().querySelector<HTMLElement>('[data-part="head"] [data-part="selection"]')!,
    ).getByRole('checkbox');
    // language: pt-BR
    expect(all).toHaveAccessibleName('Selecionar todas as 4 linhas');
    // language: en-US
    expect(cell('S1', 'priority')).toHaveTextContent('Sim');
    // language: pt-BR
    expect(cell('S2', 'priority')).toHaveTextContent('Não');
    // language: en-US
    rerender(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Shipments rows={[]} />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(grid().querySelector('[data-part="empty"]')).toHaveTextContent('Nenhuma linha');
    // language: en-US
  });

  it('runs the consumer’s own handler first and stops when it was prevented', () => {
    const onKeyDown = vi.fn((event: React.KeyboardEvent) => event.preventDefault());
    render(<Shipments onKeyDown={onKeyDown} defaultCurrent={{ row: 'S1', column: 'id' }} />);
    fireEvent.keyDown(cell('S1', 'id'), { key: 'ArrowDown' });
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('passes native attributes through to the root', () => {
    render(<Shipments data-testid="shipments" id="grid-1" />);
    expect(screen.getByTestId('shipments')).toHaveAttribute('id', 'grid-1');
  });

  it('writes a numeric row height to the frame, so the drawn row is the windowed row', () => {
    render(<Shipments data-testid="shipments" rowHeight={56} />);
    expect(
      screen.getByTestId('shipments').style.getPropertyValue('--slotted-data-grid-row-block-size'),
    ).toBe('56px');
  });

  /**
   * A grid that loads its next page on its own offered a Load more control as
   * well, whose purpose the reader could not tell. Under the default trigger
   * the request is automatic, the footer says the page is loading, and a
   * control appears only to retry a page that failed.
   */
  it('asks for the next page by itself and offers no Load more control by default', () => {
    /* jsdom has no IntersectionObserver: this one reports the mark in view. */
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly report: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.report(
            [{ isIntersecting: true, target } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        disconnect() {}
      },
    );
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <Shipments
        hasMore
        onLoadMore={onLoadMore}
        defaultQuery={emptyQuery({ cursor: null, size: 4 })}
      />,
    );
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    expect(grid().querySelector('[data-range]')).toHaveTextContent('1–4');

    rerender(
      <Shipments
        hasMore
        loading
        onLoadMore={onLoadMore}
        defaultQuery={emptyQuery({ cursor: null, size: 4 })}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading more rows…');
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('stops asking after a failed page and offers a retry', () => {
    const onLoadMore = vi.fn();
    render(
      <Shipments
        hasMore
        loadMoreFailed
        onLoadMore={onLoadMore}
        defaultQuery={emptyQuery({ cursor: null, size: 4 })}
      />,
    );
    expect(onLoadMore).not.toHaveBeenCalled();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('asks only from the Load more control under the button trigger', () => {
    const onLoadMore = vi.fn();
    render(
      <Shipments
        hasMore
        loadMoreTrigger="button"
        onLoadMore={onLoadMore}
        defaultQuery={emptyQuery({ cursor: null, size: 4 })}
      />,
    );
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(grid()).toHaveAttribute('aria-rowcount', '0');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('settles a cell reference into the same cell object', () => {
    const cellRef: GridCell = { row: 'S1', column: 'id' };
    render(<Shipments current={cellRef} />);
    expect(cell('S1', 'id')).toHaveAttribute('data-current');
  });
  describe('with a data source', () => {
    type Answer = { rows: Shipment[]; total: number };
    function source(answer: (query: GridQuery) => Answer | Error, delay = 0) {
      const calls: { query: GridQuery; signal: AbortSignal }[] = [];
      const getRows = vi.fn((query: GridQuery, options: { signal: AbortSignal }) => {
        calls.push({ query, signal: options.signal });
        return new Promise<Answer>((resolve, reject) => {
          const result = answer(query);
          const settle = () => (result instanceof Error ? reject(result) : resolve(result));
          if (delay === 0) settle();
          else setTimeout(settle, delay);
        });
      });
      return { getRows, calls };
    }
    const bodyKeys = () =>
      [...grid().querySelectorAll<HTMLElement>('[data-part="body"] > [data-part="row"]')].map(
        (row) => row.dataset['row'],
      );

    it('asks for the rows of each query, shows the wait, and keeps the answer by the query', async () => {
      const shipments = source((query) => ({
        rows:
          query.page && 'index' in query.page && query.page.index === 1
            ? [ROWS[2]!, ROWS[3]!]
            : [ROWS[0]!, ROWS[1]!],
        total: 4,
      }));
      function Sourced() {
        const [query, setQuery] = useState<GridQuery>(emptyQuery({ index: 0, size: 2 }));
        return (
          <>
            <button onClick={() => setQuery(withPageIndex(query, 1).query)}>next</button>
            <button onClick={() => setQuery(withPageIndex(query, 0).query)}>back</button>
            <Shipments
              dataSource={shipments}
              onQueryChange={setQuery}
              query={query}
              rows={undefined}
            />
          </>
        );
      }
      render(<Sourced />);
      expect(grid().querySelector('[data-part="loader"]')).not.toBeNull();
      await waitFor(() => expect(bodyKeys()).toEqual(['S1', 'S2']));
      /* The total from the source, the header, no summary in server mode. */
      expect(grid()).toHaveAttribute('aria-rowcount', '5');
      fireEvent.click(screen.getByText('next'));
      /* The page that is there stays, dimmed, while the next one is fetched. */
      expect(bodyKeys()).toEqual(['S1', 'S2']);
      expect(grid()).toHaveAttribute('aria-busy', 'true');
      await waitFor(() => expect(bodyKeys()).toEqual(['S3', 'S4']));
      fireEvent.click(screen.getByText('back'));
      await waitFor(() => expect(bodyKeys()).toEqual(['S1', 'S2']));
      /* Two queries, two requests: the page the reader came back to was kept. */
      expect(shipments.getRows).toHaveBeenCalledTimes(2);
    });

    it('aborts the request a newer query replaces', async () => {
      const shipments = source(() => ({ rows: [ROWS[0]!], total: 1 }), 50);
      function Sourced() {
        const [query, setQuery] = useState<GridQuery>(emptyQuery());
        return (
          <>
            <button onClick={() => setQuery({ ...query, search: 'a' })}>search</button>
            <Shipments
              dataSource={shipments}
              onQueryChange={setQuery}
              query={query}
              rows={undefined}
            />
          </>
        );
      }
      render(<Sourced />);
      fireEvent.click(screen.getByText('search'));
      expect(shipments.calls[0]!.signal.aborted).toBe(true);
      expect(shipments.calls[1]!.signal.aborted).toBe(false);
      await waitFor(() => expect(bodyKeys()).toEqual(['S1']));
    });

    it('draws the error the source threw, retries from it, and reloads past the cache', async () => {
      let failing = true;
      const shipments = source(() =>
        failing ? new Error('The shipments service timed out') : { rows: [ROWS[0]!], total: 1 },
      );
      function Sourced() {
        const handle = useRef<DataGridHandle | null>(null);
        return (
          <>
            <button onClick={() => handle.current?.reload()}>reload</button>
            <Shipments dataSource={shipments} handle={handle} rows={undefined} />
          </>
        );
      }
      render(<Sourced />);
      await waitFor(() =>
        expect(screen.getByText('The shipments service timed out')).toBeInTheDocument(),
      );
      failing = false;
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      await waitFor(() => expect(bodyKeys()).toEqual(['S1']));
      expect(shipments.getRows).toHaveBeenCalledTimes(2);
      fireEvent.click(screen.getByText('reload'));
      await waitFor(() => expect(shipments.getRows).toHaveBeenCalledTimes(3));
    });
  });

  describe('pinned rows', () => {
    const keysIn = (part: string) =>
      [...grid().querySelectorAll<HTMLElement>(`[data-part="${part}"] > [data-part="row"]`)].map(
        (row) => row.dataset['row'],
      );

    it('keeps pinned rows out of the query, in their own groups, counted and indexed in order', () => {
      render(
        <Shipments
          pinnedRows={{ top: ['S3'], bottom: ['S1'] }}
          query={{ ...emptyQuery(), sort: [{ column: 'weight', direction: 'descending' }] }}
        />,
      );
      expect(keysIn('pinned-rows')).toEqual(['S3', 'S1']);
      expect(keysIn('body')).toEqual(['S4', 'S2']);
      expect(
        grid().querySelector('[data-part="pinned-rows"][data-edge="top"] [data-row="S3"]'),
      ).not.toBeNull();
      expect(
        grid().querySelector('[data-part="pinned-rows"][data-edge="bottom"] [data-row="S1"]'),
      ).not.toBeNull();
      /* Four rows, the header and the summary. */
      expect(grid()).toHaveAttribute('aria-rowcount', '6');
      expect(grid().querySelector('[data-row="S3"]')).toHaveAttribute('aria-rowindex', '2');
      expect(grid().querySelector('[data-row="S4"]')).toHaveAttribute('aria-rowindex', '3');
      expect(grid().querySelector('[data-row="S1"]')).toHaveAttribute('aria-rowindex', '5');
    });

    it('lets the cursor walk from the top pinned row through the body to the bottom one', () => {
      render(
        <Shipments
          defaultCurrent={{ row: 'S3', column: 'customer' }}
          pinnedRows={{ top: ['S3'], bottom: ['S1'] }}
        />,
      );
      fireEvent.keyDown(cell('S3', 'customer'), { key: 'ArrowDown' });
      expect(cell('S2', 'customer')).toHaveAttribute('data-current');
      fireEvent.keyDown(cell('S2', 'customer'), { key: 'ArrowDown' });
      fireEvent.keyDown(cell('S4', 'customer'), { key: 'ArrowDown' });
      expect(cell('S1', 'customer')).toHaveAttribute('data-current');
      fireEvent.keyDown(cell('S1', 'customer'), { key: 'ArrowUp' });
      expect(cell('S4', 'customer')).toHaveAttribute('data-current');
    });

    it('selects a pinned row with the rest', () => {
      const onValueChange = vi.fn();
      render(
        <Shipments
          onValueChange={onValueChange}
          pinnedRows={{ top: ['S3'] }}
          selectionMode="multiple"
        />,
      );
      fireEvent.click(within(cell('S3', SELECTION_COLUMN)).getByRole('checkbox'));
      expect(onValueChange).toHaveBeenLastCalledWith(['S3'], expect.anything());
      fireEvent.click(
        within(
          grid().querySelector<HTMLElement>('[data-part="head"] [data-part="selection"]')!,
        ).getByRole('checkbox'),
      );
      expect(onValueChange).toHaveBeenLastCalledWith(['S3', 'S1', 'S2', 'S4'], expect.anything());
    });
  });

  describe('reordering rows', () => {
    const handle = (row: string) =>
      grid().querySelector<HTMLElement>(`[data-row="${row}"] [data-part="row-handle"]`)!;

    it('draws a handle per row that only works while the query is at rest', () => {
      const { rerender } = render(<Shipments rowsReorderable />);
      expect(grid().querySelectorAll('[data-part="row-handle"]')).toHaveLength(4);
      expect(handle('S1')).toHaveAttribute('aria-label', 'Reorder S1');
      expect(glyphOf(handle('S1'))).toBe('grip-vertical');
      expect(handle('S1')).not.toHaveAttribute('aria-disabled');
      rerender(
        <Shipments
          rowsReorderable
          query={{ ...emptyQuery(), sort: [{ column: 'weight', direction: 'ascending' }] }}
        />,
      );
      expect(handle('S1')).toHaveAttribute('aria-disabled', 'true');
    });

    it('moves a row with Alt and the vertical arrows, reporting where it goes in rows', () => {
      const onRowsReorder = vi.fn();
      render(
        <Shipments
          defaultCurrent={{ row: 'S2', column: 'customer' }}
          onRowsReorder={onRowsReorder}
          rowsReorderable
        />,
      );
      fireEvent.keyDown(cell('S2', 'customer'), { key: 'ArrowDown', altKey: true });
      expect(onRowsReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({ key: 'S2', from: 1, to: 2, reason: 'keyboard' }),
      );
      fireEvent.keyDown(cell('S2', 'customer'), { key: 'ArrowUp', altKey: true });
      expect(onRowsReorder).toHaveBeenLastCalledWith(
        expect.objectContaining({ key: 'S2', from: 1, to: 0, reason: 'keyboard' }),
      );
      /* The first row has nowhere up to go. */
      onRowsReorder.mockClear();
      fireEvent.keyDown(cell('S2', 'customer'), { key: 'ArrowUp', altKey: true });
      fireEvent.keyDown(cell('S2', 'customer'), { key: 'ArrowUp', altKey: true });
      expect(onRowsReorder).toHaveBeenCalledTimes(2);
    });

    it('drags a row by its handle to a gap, and reports the move', async () => {
      const onRowsReorder = vi.fn();
      render(<Shipments onRowsReorder={onRowsReorder} rowsReorderable />);
      const rows = [
        ...grid().querySelectorAll<HTMLElement>('[data-part="body"] > [data-part="row"]'),
      ];
      rows.forEach((row, index) => {
        row.getBoundingClientRect = () =>
          ({
            top: 100 + index * 30,
            bottom: 130 + index * 30,
            left: 0,
            right: 400,
            width: 400,
            height: 30,
            x: 0,
            y: 100 + index * 30,
            toJSON: () => ({}),
          }) as DOMRect;
      });
      const body = grid().querySelector<HTMLElement>('[data-part="body"]')!;
      body.getBoundingClientRect = () =>
        ({
          top: 100,
          bottom: 220,
          left: 0,
          right: 400,
          width: 400,
          height: 120,
          x: 0,
          y: 100,
          toJSON: () => ({}),
        }) as DOMRect;
      const press = (type: string, y: number) =>
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          clientX: 10,
          clientY: y,
          button: 0,
        });
      act(() => {
        handle('S1').dispatchEvent(press('pointerdown', 115));
        document.dispatchEvent(press('pointermove', 140));
        document.dispatchEvent(press('pointermove', 205));
      });
      expect(grid().querySelector('[data-row="S1"]')).toHaveAttribute('data-dragging');
      expect(grid().querySelector('[data-part="drop-indicator"][data-axis="row"]')).not.toBeNull();
      act(() => {
        document.dispatchEvent(press('pointerup', 205));
      });
      expect(onRowsReorder).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'S1', from: 0, to: 3, reason: 'pointer' }),
      );
      await waitFor(() =>
        expect(document.body.textContent).toMatch(/dropped, position 4 of \d+ in rows\./),
      );
    });
  });

  describe('as a tree', () => {
    interface Site {
      id: string;
      parent: string | null;
      name: string;
      stock: number;
    }
    const SITE_COLUMNS: GridColumn<Site>[] = [
      { id: 'name', label: 'Name', rowHeader: true },
      { id: 'stock', label: 'Stock', kind: 'number' },
    ];
    const SITES: Site[] = [
      { id: 'pt', parent: null, name: 'Portugal', stock: 0 },
      { id: 'pt-lis', parent: 'pt', name: 'Lisboa', stock: 40 },
      { id: 'pt-lis-a', parent: 'pt-lis', name: 'Zona A', stock: 25 },
      { id: 'pt-por', parent: 'pt', name: 'Porto', stock: 30 },
      { id: 'es', parent: null, name: 'España', stock: 0 },
    ];
    function Sites(props: Partial<DataGridProps<Site>>) {
      return (
        <DataGrid<Site>
          columns={SITE_COLUMNS}
          aria-label="Sites"
          rowKey="id"
          rows={SITES}
          tree={{ parentKey: (row: Site) => row.parent }}
          {...props}
        />
      );
    }
    const sites = () => screen.getByRole('treegrid', { name: 'Sites' });
    const rowKeys = () =>
      [...sites().querySelectorAll<HTMLElement>('[data-part="body"] > [data-part="row"]')].map(
        (row) => row.dataset['row'],
      );
    const toggle = (key: string) =>
      sites().querySelector<HTMLElement>(`[data-row="${key}"] [data-part="tree-toggle"]`);

    it('is a treegrid of closed roots, each with its level, and opens a branch from its toggle', () => {
      render(<Sites />);
      expect(rowKeys()).toEqual(['pt', 'es']);
      const pt = sites().querySelector('[data-row="pt"]')!;
      expect(pt).toHaveAttribute('aria-level', '1');
      expect(pt).toHaveAttribute('aria-expanded', 'false');
      expect(sites().querySelector('[data-row="es"]')).not.toHaveAttribute('aria-expanded');
      /* A leaf keeps the toggle's room, empty, so the names align. */
      expect(toggle('es')!.tagName).toBe('SPAN');
      expect(toggle('pt')!.tagName).toBe('BUTTON');
      expect(glyphOf(toggle('pt'))).toBe('chevron-right');
      expect(glyphOf(toggle('es'))).toBeUndefined();
      fireEvent.click(toggle('pt')!);
      expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-por', 'es']);
      expect(pt).toHaveAttribute('aria-expanded', 'true');
      expect(sites().querySelector('[data-row="pt-lis"]')).toHaveAttribute('aria-level', '2');
      expect(
        sites()
          .querySelector<HTMLElement>('[data-row="pt-lis"] [data-column="name"]')!
          .style.getPropertyValue('--slotted-data-grid-level'),
      ).toBe('2');
    });

    it('opens and closes from the keyboard in the tree column, and climbs to the parent', () => {
      const onExpandedChange = vi.fn();
      render(
        <Sites
          defaultCurrent={{ row: 'pt', column: 'name' }}
          defaultExpanded={['pt']}
          onExpandedChange={onExpandedChange}
        />,
      );
      const cell = (row: string, column: string) =>
        sites().querySelector<HTMLElement>(`[data-row="${row}"] [data-column="${column}"]`)!;
      fireEvent.keyDown(cell('pt', 'name'), { key: 'ArrowRight' });
      /* Open already: the arrow moves the cursor, as anywhere else. */
      expect(cell('pt', 'stock')).toHaveAttribute('data-current');
      fireEvent.keyDown(cell('pt', 'stock'), { key: 'ArrowLeft' });
      fireEvent.keyDown(cell('pt', 'name'), { key: 'ArrowDown' });
      fireEvent.keyDown(cell('pt-lis', 'name'), { key: 'ArrowRight' });
      expect(onExpandedChange).toHaveBeenLastCalledWith(
        ['pt', 'pt-lis'],
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-lis-a', 'pt-por', 'es']);
      fireEvent.keyDown(cell('pt-lis', 'name'), { key: 'ArrowLeft' });
      expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-por', 'es']);
      /* Closed now: the next left climbs to the parent. */
      fireEvent.keyDown(cell('pt-lis', 'name'), { key: 'ArrowLeft' });
      expect(cell('pt', 'name')).toHaveAttribute('data-current');
    });

    it('asks for the children of a row that has none yet, and shows the wait until they arrive', () => {
      const onLoadChildren = vi.fn();
      const { rerender } = render(
        <Sites
          onLoadChildren={onLoadChildren}
          rows={SITES.filter((row) => row.id !== 'pt-lis-a')}
          tree={{
            parentKey: (row: Site) => row.parent,
            hasChildren: (row: Site) => row.id === 'pt-lis',
          }}
        />,
      );
      fireEvent.click(toggle('pt')!);
      expect(toggle('pt-lis')).not.toBeNull();
      fireEvent.click(toggle('pt-lis')!);
      expect(onLoadChildren).toHaveBeenCalledWith({ key: 'pt-lis', row: SITES[1] });
      expect(sites().querySelector('[data-row="pt-lis"]')).toHaveAttribute('data-loading');
      /* The wait turns the chevron into the loader's ring. */
      expect(glyphOf(toggle('pt-lis'))).toBe('loader-circle');
      rerender(
        <Sites
          onLoadChildren={onLoadChildren}
          rows={SITES}
          tree={{
            parentKey: (row: Site) => row.parent,
            hasChildren: (row: Site) => row.id === 'pt-lis',
          }}
        />,
      );
      expect(sites().querySelector('[data-row="pt-lis"]')).not.toHaveAttribute('data-loading');
      expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-lis-a', 'pt-por', 'es']);
    });
  });
});

/* ── Column help, hiding, fitting, responsive priority and density ────── */

interface Account {
  id: string;
  name: string;
  owner: string;
  region: string;
  arr: number;
}

const ACCOUNTS: Account[] = [
  { id: 'A1', name: 'Aurora Labs', owner: 'Maya Chen', region: 'EMEA', arr: 120000 },
  { id: 'A2', name: 'Bloom Retail', owner: 'Omar Haddad', region: 'NA', arr: 48000 },
];

const ACCOUNT_COLUMNS: DataGridColumn<Account>[] = [
  { id: 'name', label: 'Account', width: 200 },
  {
    id: 'arr',
    label: 'ARR',
    kind: 'number',
    width: 120,
    description: 'Annual recurring revenue, in US dollars',
    priority: 1,
  },
  {
    id: 'owner',
    label: 'Owner',
    width: 160,
    priority: 3,
    help: (
      <p>
        The account executive who <a href="#owners">owns the renewal</a>.
      </p>
    ),
  },
  { id: 'region', label: 'Region', width: 120, priority: 2 },
];

describe('DataGrid, explaining and arranging columns', () => {
  let observed: (() => void)[] = [];
  /* The main pointer `(pointer: coarse)` answers, and who listens to it. */
  let coarse = false;
  let pointerListeners: (() => void)[] = [];
  beforeEach(() => {
    observed = [];
    coarse = false;
    pointerListeners = [];
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() {
        return query === '(pointer: coarse)' && coarse;
      },
      addEventListener: (_type: string, listener: () => void) => pointerListeners.push(listener),
      removeEventListener: (_type: string, listener: () => void) => {
        pointerListeners = pointerListeners.filter((each) => each !== listener);
      },
    }));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: (entries: unknown[], observer: unknown) => void) {}
        observe() {
          observed.push(() => this.callback([], this));
        }
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function Accounts(props: Partial<DataGridProps<Account>>) {
    return (
      <DataGrid<Account>
        columns={ACCOUNT_COLUMNS}
        aria-label="Accounts"
        rowKey="id"
        rows={ACCOUNTS}
        {...props}
      />
    );
  }
  const grid = () => screen.getByRole('grid');
  const header = (column: string) =>
    grid().querySelector<HTMLElement>(`[data-part="column-header"][data-column="${column}"]`)!;

  it('marks a column with something to say, and describes its header by the text', () => {
    render(<Accounts />);
    const arr = header('arr');
    const description = arr.querySelector<HTMLElement>('[data-part="column-description"]')!;
    expect(description.textContent).toBe('Annual recurring revenue, in US dollars');
    expect(arr).toHaveAttribute('aria-describedby', description.id);
    /* Described, not named: the header's name stays the column's label. */
    expect(description).toHaveAttribute('aria-hidden', 'true');
    const help = arr.querySelector('[data-part="column-actions"] > [data-part="column-help"]');
    expect(help).toHaveAttribute('aria-label', 'About ARR');
    /* A help node alone is help too; a column with neither has no button. */
    expect(header('owner').querySelector('[data-part="column-help"]')).not.toBeNull();
    expect(header('owner')).not.toHaveAttribute('aria-describedby');
    expect(header('name').querySelector('[data-part="column-help"]')).toBeNull();
    const actions = [...arr.querySelectorAll<HTMLElement>('[data-part="column-actions"] > *')];
    expect(actions[0]!.dataset['part']).toBe('column-help');
  });

  it('opens the help on a press, never sorting, with the description and the node', async () => {
    const onQueryChange = vi.fn();
    render(<Accounts onQueryChange={onQueryChange} />);
    const help = header('owner').querySelector<HTMLElement>('[data-part="column-help"]')!;
    expect(help).toHaveAttribute('aria-expanded', 'false');
    expect(glyphOf(help)).toBe('circle-question');
    fireEvent.click(help, { detail: 1 });
    expect(help).toHaveAttribute('aria-expanded', 'true');
    const content = await waitFor(() => {
      const found = document.getElementById(help.getAttribute('aria-controls')!);
      expect(found).not.toBeNull();
      return found!;
    });
    expect(content.textContent).toContain('owns the renewal');
    expect(onQueryChange).not.toHaveBeenCalled();

    const arrHelp = header('arr').querySelector<HTMLElement>('[data-part="column-help"]')!;
    fireEvent.click(arrHelp, { detail: 1 });
    const arrContent = await waitFor(() => {
      const found = document.getElementById(arrHelp.getAttribute('aria-controls')!);
      expect(found).not.toBeNull();
      return found!;
    });
    expect(arrContent.textContent).toContain('Annual recurring revenue');
    expect(arrContent).toHaveAttribute('aria-label', 'About ARR');
  });

  it('shows the description atop the column menu, and describes the menu by it', () => {
    render(<Accounts />);
    fireEvent.keyDown(header('arr'), { key: 'Enter', ctrlKey: true });
    const menu = screen.getByRole('menu');
    const shown = menu.querySelector<HTMLElement>('[data-part="column-menu-description"]')!;
    expect(shown.textContent).toBe('Annual recurring revenue, in US dollars');
    expect(shown).toHaveAttribute('aria-hidden', 'true');
    expect(menu).toHaveAttribute(
      'aria-describedby',
      header('arr').querySelector('[data-part="column-description"]')!.id,
    );
  });

  it('enters the header cell with F2, cycles its widgets with Tab, and leaves with Escape', () => {
    const onQueryChange = vi.fn();
    render(<Accounts onQueryChange={onQueryChange} />);
    const arr = header('arr');
    act(() => arr.focus());
    fireEvent.keyDown(arr, { key: 'F2' });
    const help = arr.querySelector<HTMLElement>('[data-part="column-help"]')!;
    const menu = arr.querySelector<HTMLElement>('[data-part="column-menu"]')!;
    expect(document.activeElement).toBe(help);
    fireEvent.keyDown(help, { key: 'Tab' });
    expect(document.activeElement).toBe(menu);
    fireEvent.keyDown(menu, { key: 'Tab' });
    expect(document.activeElement).toBe(help);
    fireEvent.keyDown(help, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(menu);
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(document.activeElement).toBe(arr);
    /* Enter on the header still sorts. */
    fireEvent.keyDown(arr, { key: 'Enter' });
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ change: 'sort' }),
    );
  });

  it('announces a hidden column, and the request carries what an undo restores', () => {
    const announce = vi.spyOn(getLiveAnnouncer(document), 'announce');
    const onColumnStateChange = vi.fn();
    render(<Accounts onColumnStateChange={onColumnStateChange} />);
    fireEvent.keyDown(header('owner'), { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide column' }), { detail: 1 });
    const request = onColumnStateChange.mock.calls.at(-1)![1] as DataGridColumnStateRequest;
    expect(request).toMatchObject({ change: 'hidden', reason: 'pointer' });
    expect(request.value.hidden).toEqual(['owner']);
    expect(request.previous.hidden).toEqual([]);
    expect(announce).toHaveBeenCalledWith('Owner hidden');
    announce.mockRestore();
  });

  it('fits one column or every column, with the reason of the gesture', () => {
    let measured = 90;
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: measured,
        height: 0,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: measured,
        bottom: 0,
      }),
    });
    const onColumnStateChange = vi.fn();
    const handle = { current: null as DataGridHandle | null };
    render(<Accounts handle={handle} onColumnStateChange={onColumnStateChange} />);
    const last = () => onColumnStateChange.mock.calls.at(-1)![1] as DataGridColumnStateRequest;
    const resizer = header('owner').querySelector<HTMLElement>('[data-part="resizer"]')!;
    fireEvent.doubleClick(resizer);
    expect(last()).toMatchObject({ change: 'width', reason: 'pointer' });
    expect(Object.keys(last().value.widths)).toEqual(['owner']);
    measured = 80;
    fireEvent.doubleClick(resizer, { shiftKey: true });
    expect(last()).toMatchObject({ change: 'width', reason: 'pointer' });
    expect(last().value.widths).toEqual({ name: 80, arr: 80, owner: 80, region: 80 });
    measured = 70;
    fireEvent.keyDown(header('owner'), { key: 'Enter', ctrlKey: true, shiftKey: true });
    expect(last()).toMatchObject({ change: 'width', reason: 'keyboard' });
    measured = 60;
    fireEvent.keyDown(header('owner'), { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fit all columns' }), { detail: 1 });
    expect(last()).toMatchObject({ change: 'width', reason: 'pointer' });
    expect(last().value.widths).toEqual({ name: 60, arr: 60, owner: 60, region: 60 });
    measured = 50;
    fireEvent.keyDown(header('owner'), { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Fit to content' }), { detail: 0 });
    expect(last()).toMatchObject({ change: 'width', reason: 'keyboard' });
    measured = 40;
    act(() => handle.current!.autofit('owner'));
    expect(last()).toMatchObject({ change: 'width', reason: 'programmatic' });
    delete (Range.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  });

  const resize = (width: number) => {
    const scroller = grid().querySelector<HTMLElement>('[data-part="scroll"]')!;
    Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: width });
    act(() => {
      for (const run of observed) run();
    });
  };
  const row = (key: string) =>
    grid().querySelector<HTMLElement>(`[role="row"][data-row="${key}"]`)!;
  const popin = (key: string) => row(key).querySelector<HTMLElement>('[data-part="popin"]');
  const fields = (key: string) =>
    [...popin(key)!.querySelectorAll<HTMLElement>('[data-part="popin-field"]')].map((field) => [
      field.querySelector('[data-part="popin-label"]')?.textContent?.trim() ?? null,
      field.querySelector('[data-part="popin-value"]')!.textContent?.trim(),
    ]);
  const owners = {
    owner: ({ rowKey, text }: DataGridCellContext<Account>) => (
      <strong data-owner="">
        {text} ({rowKey})
      </strong>
    ),
  };
  const rightClick = (target: HTMLElement, init: MouseEventInit = {}) => {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: 40,
      clientY: 60,
      ...init,
    });
    act(() => void target.dispatchEvent(event));
    return event;
  };

  it('moves the columns of least priority into the row’s pop-in, outside the state', () => {
    const onOutOfSpaceChange = vi.fn();
    const onColumnStateChange = vi.fn();
    const handle = { current: null as DataGridHandle | null };
    render(
      <Accounts
        cellRenderers={owners}
        handle={handle}
        onColumnStateChange={onColumnStateChange}
        onOutOfSpaceChange={onOutOfSpaceChange}
      />,
    );
    expect(handle.current!.getOutOfSpace()).toEqual({ popin: [], hidden: [] });
    expect(grid()).not.toHaveAttribute('data-popin');
    expect(popin('A1')).toBeNull();
    expect(grid().querySelector('[data-part="popin-header"]')).toBeNull();

    resize(400);
    /* 600 asked for: Owner (3) goes first, then Region (2); ARR (1) stays. */
    expect(handle.current!.getOutOfSpace()).toEqual({ popin: ['owner', 'region'], hidden: [] });
    expect(grid()).toHaveAttribute('data-popin', '2');
    expect(grid()).not.toHaveAttribute('data-space-hidden');
    /* Account, ARR and the pop-in's own column. */
    expect(grid()).toHaveAttribute('aria-colcount', '3');
    expect(header('owner')).toBeNull();
    expect(grid().style.getPropertyValue('--slotted-data-grid-template')).not.toContain('160px');

    const heading = grid().querySelector<HTMLElement>('[data-part="popin-header"]')!;
    expect(heading).toHaveAttribute('role', 'columnheader');
    expect(heading).toHaveAttribute('aria-colindex', '3');
    expect(heading.textContent?.trim()).toBe('Details');
    expect(heading.parentElement!.lastElementChild).toBe(heading);

    const cell = popin('A1')!;
    expect(cell).toHaveAttribute('role', 'gridcell');
    expect(cell).toHaveAttribute('aria-colindex', '3');
    expect(row('A1').lastElementChild).toBe(cell);
    /* The label is the header's, the value the cell's own renderer with its context. */
    expect(fields('A1')).toEqual([
      ['Owner', 'Maya Chen (A1)'],
      ['Region', 'EMEA'],
    ]);
    expect(cell.querySelector('[data-owner]')).not.toBeNull();
    const field = cell.querySelector<HTMLElement>('[data-part="popin-field"]')!;
    expect(field).toHaveAttribute('data-field', 'owner');
    expect(field).not.toHaveAttribute('data-column');
    /* A row with a pop-in is measured as it grows. */
    expect(grid()).toHaveAttribute('data-rows', 'auto');
    /* The pop-in starts where the first data column does: no gutter here. */
    expect(grid().style.getPropertyValue('--slotted-data-grid-leading')).toBe('0px');
    expect(onOutOfSpaceChange.mock.calls).toEqual([[{ popin: ['owner', 'region'], hidden: [] }]]);
    expect(onColumnStateChange).not.toHaveBeenCalled();

    resize(1000);
    expect(handle.current!.getOutOfSpace()).toEqual({ popin: [], hidden: [] });
    expect(grid()).toHaveAttribute('aria-colcount', '4');
    expect(popin('A1')).toBeNull();
    expect(grid()).toHaveAttribute('data-rows', 'fixed');
    expect(grid().style.getPropertyValue('--slotted-data-grid-leading')).toBe('');
    expect(onOutOfSpaceChange.mock.calls).toEqual([
      [{ popin: ['owner', 'region'], hidden: [] }],
      [{ popin: [], hidden: [] }],
    ]);
  });

  it('hides a column that declines the pop-in, and takes nothing out under scroll', () => {
    const handle = { current: null as DataGridHandle | null };
    const declining = ACCOUNT_COLUMNS.map((column) =>
      column.id === 'region' ? { ...column, popin: false } : column,
    );
    const { rerender } = render(
      <Accounts cellRenderers={owners} columns={declining} handle={handle} />,
    );
    resize(400);
    expect(handle.current!.getOutOfSpace()).toEqual({ popin: ['owner'], hidden: ['region'] });
    expect(grid()).toHaveAttribute('data-popin', '1');
    expect(header('region')).toBeNull();
    expect(fields('A1')).toEqual([['Owner', 'Maya Chen (A1)']]);

    rerender(
      <Accounts
        cellRenderers={owners}
        columnOverflow="scroll"
        columns={declining}
        handle={handle}
      />,
    );
    expect(handle.current!.getOutOfSpace()).toEqual({ popin: [], hidden: [] });
    expect(grid()).not.toHaveAttribute('data-popin');
    expect(header('region')).not.toBeNull();
    expect(grid()).toHaveAttribute('aria-colcount', '4');
  });

  it('pops in under auto only on a phone-wide frame or a touch frame narrower than a desktop', () => {
    const handle = { current: null as DataGridHandle | null };
    /* 1800 asked for: too many columns for every frame below. */
    const wide = ACCOUNT_COLUMNS.map((column) => ({ ...column, width: (column.width ?? 0) * 3 }));
    const { rerender } = render(<Accounts columns={wide} handle={handle} />);
    const out = () => handle.current!.getOutOfSpace();

    /* A mouse on a wide frame scrolls: the columns keep their layout. */
    resize(1280);
    expect(out()).toEqual({ popin: [], hidden: [] });
    resize(800);
    expect(out()).toEqual({ popin: [], hidden: [] });
    expect(grid()).not.toHaveAttribute('data-popin');
    /* A phone-wide frame pops in, whatever the pointer. */
    resize(560);
    expect(out().popin.length).toBeGreaterThan(0);
    expect(grid()).toHaveAttribute('data-popin');

    /* A finger pops in under a desktop's width, and the grid hears the pointer change. */
    resize(800);
    expect(out().popin).toEqual([]);
    coarse = true;
    act(() => {
      for (const listener of pointerListeners) listener();
    });
    expect(out().popin.length).toBeGreaterThan(0);
    resize(1100);
    expect(out()).toEqual({ popin: [], hidden: [] });

    /* An explicit pop-in holds at any width. */
    coarse = false;
    act(() => {
      for (const listener of pointerListeners) listener();
    });
    rerender(<Accounts columnOverflow="popin" columns={wide} handle={handle} />);
    expect(out().popin.length).toBeGreaterThan(0);
  });

  it('takes the overflow policy an application sets once', () => {
    render(
      <DataGridDefaultsProvider columnOverflow="scroll">
        <Accounts />
      </DataGridDefaultsProvider>,
    );
    resize(400);
    expect(grid()).not.toHaveAttribute('data-popin');
    expect(header('owner')).not.toBeNull();
  });

  it('draws the pop-in in pinned rows, and the popped aggregates in the summary', () => {
    render(
      <Accounts
        cellRenderers={owners}
        columns={ACCOUNT_COLUMNS.map((column) =>
          column.id === 'region' ? { ...column, aggregate: 'count' as const } : column,
        )}
        pinnedRows={{ top: ['A2'] }}
      />,
    );
    /* Before the frame is measured the total sits in its own visible cell. */
    expect(grid().querySelector('[data-part="summary"] [data-part="popin"]')).toBeNull();
    resize(400);
    expect(row('A2').closest('[data-part="pinned-rows"]')).not.toBeNull();
    expect(fields('A2')).toEqual([
      ['Owner', 'Omar Haddad (A2)'],
      ['Region', 'NA'],
    ]);
    const summary = grid().querySelector<HTMLElement>('[data-part="summary"] [role="row"]')!;
    const total = popin('summary')!;
    expect(total).toHaveAttribute('aria-colindex', '3');
    expect(fields('summary')).toEqual([['Region', '1']]);
    expect(total.parentElement).toBe(summary);
    expect(total.querySelector('[data-part="popin-value"]')).not.toHaveAttribute('data-numeric');
  });

  it('keeps no summary pop-in while no column in it aggregates', () => {
    render(
      <Accounts
        columns={ACCOUNT_COLUMNS.map((column) =>
          column.id === 'arr' ? { ...column, aggregate: 'sum' as const } : column,
        )}
      />,
    );
    resize(400);
    expect(grid().querySelector('[data-part="summary"]')).not.toBeNull();
    expect(popin('summary')).toBeNull();
    expect(popin('A1')).not.toBeNull();
  });

  it('walks the cursor onto the pop-in as the last column, and activates the row from it', () => {
    const onActivate = vi.fn();
    const onCurrentChange = vi.fn();
    const handle = { current: null as DataGridHandle | null };
    render(
      <Accounts
        activatable
        handle={handle}
        onActivate={onActivate}
        onCurrentChange={onCurrentChange}
      />,
    );
    resize(400);
    act(() => handle.current!.focusCell({ row: 'A1', column: 'arr' }));
    const arr = grid().querySelector<HTMLElement>('[data-row="A1"] [data-column="arr"]')!;
    fireEvent.keyDown(arr, { key: 'ArrowRight' });
    const last = () => onCurrentChange.mock.calls.at(-1)![0] as GridCell;
    expect(last()).toEqual({ row: 'A1', column: POPIN_COLUMN_ID });
    expect(popin('A1')).toHaveAttribute('data-current');
    expect(popin('A1')).toHaveAttribute('tabindex', '0');
    expect(popin('A1')).toHaveAttribute('data-column', POPIN_COLUMN_ID);
    expect(document.activeElement).toBe(popin('A1'));
    fireEvent.keyDown(popin('A1')!, { key: 'Enter' });
    expect(onActivate).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'A1', reason: 'keyboard' }),
    );
    /* The header row has no cell to stand on there: the cursor stops at ARR. */
    fireEvent.keyDown(popin('A1')!, { key: 'ArrowUp' });
    expect(last()).toEqual({ row: 'header', column: 'arr' });
    const calls = onCurrentChange.mock.calls.length;
    fireEvent.keyDown(header('arr'), { key: 'ArrowRight' });
    expect(onCurrentChange).toHaveBeenCalledTimes(calls);
    /* The pop-in's heading is never a stop. */
    expect(grid().querySelector('[data-part="popin-header"]')).not.toHaveAttribute('tabindex');
  });

  it('follows a column that moves into the pop-in with the cursor', () => {
    const onCurrentChange = vi.fn();
    render(
      <Accounts
        defaultCurrent={{ row: 'A1', column: 'owner' }}
        onCurrentChange={onCurrentChange}
      />,
    );
    resize(400);
    expect(onCurrentChange.mock.calls.at(-1)![0]).toEqual({ row: 'A1', column: POPIN_COLUMN_ID });
    expect(popin('A1')).toHaveAttribute('data-current');
  });

  it('measures the rows again when the pop-in or the frame changes', () => {
    render(<Accounts rowHeight={40} />);
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
    const rowsMeasured = () =>
      measure.mock.contexts.filter(
        (element) => element instanceof HTMLElement && element.dataset['row'] === 'A1',
      ).length;
    resize(400);
    expect(rowsMeasured()).toBeGreaterThan(0);
    measure.mockClear();
    resize(380);
    expect(rowsMeasured()).toBeGreaterThan(0);
    measure.mockRestore();
  });

  it('opens the column menu at the pointer on a header’s context menu', async () => {
    render(<Accounts />);
    const event = rightClick(header('owner'));
    expect(event.defaultPrevented).toBe(true);
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveAccessibleName('Column menu, Owner');
    /* Hung from the point pressed, 60 down, the menu's offset of 4 away from
       it on whichever side has room; the header's own box is at 0. */
    const placedTop = () => {
      let node: HTMLElement | null = menu;
      while (node && node.style.top === '') node = node.parentElement;
      return node ? parseFloat(node.style.top) : null;
    };
    await waitFor(() => expect([56, 64]).toContain(placedTop()));
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('menuitem'));
    /* Focus returns to the header the reader pressed. */
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(document.activeElement).toBe(header('owner'));

    /* The button opens it where it always did, and focus returns to it. */
    const button = header('owner').querySelector<HTMLElement>('[data-part="column-menu"]')!;
    fireEvent.click(button, { detail: 1 });
    await screen.findByRole('menu');
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('menuitem'));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(document.activeElement).toBe(button);
  });

  it('opens the column menu on the header from the keyboard, and ignores the echo', async () => {
    render(<Accounts />);
    act(() => header('owner').focus());
    fireEvent.keyDown(header('owner'), { key: 'F10', shiftKey: true });
    await screen.findByRole('menu', { name: 'Column menu, Owner' });
    /* Windows fires contextmenu for the key the grid already answered. */
    const echo = rightClick(header('owner'));
    expect(echo.defaultPrevented).toBe(true);
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('menuitem'));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(document.activeElement).toBe(header('owner'));

    fireEvent.keyDown(header('owner'), { key: 'ContextMenu' });
    await screen.findByRole('menu', { name: 'Column menu, Owner' });
  });

  it('leaves the browser’s menu with Shift, on a field, and off a data column', () => {
    render(<Accounts />);
    expect(rightClick(header('owner'), { shiftKey: true }).defaultPrevented).toBe(false);
    const field = document.createElement('input');
    header('owner').append(field);
    expect(rightClick(field).defaultPrevented).toBe(false);
    field.remove();
    expect(screen.queryByRole('menu')).toBeNull();

    resize(400);
    const heading = grid().querySelector<HTMLElement>('[data-part="popin-header"]')!;
    expect(rightClick(heading).defaultPrevented).toBe(false);
    expect(rightClick(popin('A1')!).defaultPrevented).toBe(false);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('writes its own density on the root, and inherits the page’s without one', () => {
    const { rerender } = render(<Accounts />);
    expect(grid()).not.toHaveAttribute('data-slotted-density');
    rerender(<Accounts density={'dense' satisfies GridDensity} />);
    expect(grid()).toHaveAttribute('data-slotted-density', 'dense');
    rerender(<Accounts density={null} />);
    expect(grid()).not.toHaveAttribute('data-slotted-density');
  });
});
