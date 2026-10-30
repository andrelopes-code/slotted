import { operatorsFor, setFilter } from '@slotted/core/filter';
import type { FilterDescriptor, SetFilter } from '@slotted/core/filter';
import { tableMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/table/contract.json';
import { SlottedProvider } from '../i18n';
import { TooltipDefaultsProvider } from '../tooltip/tooltip-defaults';
import { Table } from './table';
import { TableContent } from './table-content';
import { TableDefaultsProvider } from './table-defaults';
import {
  TableBooleanFilter,
  TableDateFilter,
  TableDateTimeFilter,
  TableNumberFilter,
  TableSetFilter,
  TableTextFilter,
  TableTimeFilter,
} from './table-filter';
import {
  TableBody,
  TableCaption,
  TableCell,
  TableColumnActions,
  TableColumnHeader,
  TableDetail,
  TableEmpty,
  TableExpander,
  TableGroupRow,
  TableHead,
  TableRow,
  TableRowHeader,
  TableSelect,
  TableSelectAll,
  TableSort,
} from './table-parts';
import type { TableProps, TableSortDescriptor } from './table.types';

const ROWS = [
  { amount: '1,240.00', client: 'Northwind Trading', id: 'INV-1042' },
  { amount: '18.50', client: 'Cascade Logistics', id: 'INV-1043' },
  { amount: '9,802.75', client: 'Bright Harbor', id: 'INV-1044' },
];

function Invoices({
  disabledRow,
  ...props
}: Partial<TableProps> & { disabledRow?: string | undefined }) {
  return (
    <Table columns={4} {...props}>
      <TableContent>
        <TableCaption>Invoices</TableCaption>
        <TableHead>
          <TableRow>
            <TableSelectAll />
            <TableColumnHeader column="invoice">
              <TableSort>Invoice</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="client">
              <TableSort>Client</TableSort>
            </TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow disabled={row.id === disabledRow} key={row.id} value={row.id}>
              <TableSelect />
              <TableRowHeader>{row.id}</TableRowHeader>
              <TableCell>{row.client}</TableCell>
              <TableCell numeric>{row.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

/**
 * The APG is explicit: a table "is not an interactive widget", and every role
 * the structure needs is what the platform's own elements carry. A family that
 * wrote one by hand would restate what the browser states and drift from it.
 */
describe('the structure', () => {
  it('takes every role from the platform and writes none', () => {
    render(<Invoices />);

    const table = screen.getByRole('table');
    expect(table.tagName).toBe('TABLE');
    expect(table).not.toHaveAttribute('role');
    expect(table.closest('[data-ui="table"]')).toHaveAttribute('data-part', 'root');
    expect(screen.getAllByRole('rowgroup').length).toBeGreaterThan(1);
  });

  it('names the table by its caption, without an authored reference', () => {
    render(<Invoices />);

    expect(screen.getByRole('table', { name: 'Invoices' })).not.toHaveAttribute('aria-labelledby');
  });

  it('scopes a column header to its column and a row header to its row', () => {
    render(<Invoices />);

    expect(screen.getByText('Client').closest('th')).toHaveAttribute('scope', 'col');
    expect(screen.getByText('INV-1042')).toHaveAttribute('scope', 'row');
  });

  it('holds alignment and numerals apart', () => {
    render(<Invoices />);

    const amount = screen.getByText('1,240.00');
    expect(amount).toHaveAttribute('data-numeric', '');
    expect(amount).not.toHaveAttribute('data-align');
  });
});

describe('an empty body', () => {
  it('holds the empty cell in a row of its own, and React reports no nesting error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Table columns={2}>
        <TableContent aria-label="Invoices">
          <TableHead>
            <TableRow>
              <TableColumnHeader>Invoice</TableColumnHeader>
              <TableColumnHeader>Client</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableEmpty>No invoices</TableEmpty>
          </TableBody>
        </TableContent>
      </Table>,
    );

    const cell = screen.getByText('No invoices');
    expect(cell).toHaveAttribute('data-part', 'empty');
    expect(cell.tagName).toBe('TD');
    expect(cell).toHaveAttribute('colspan', '2');
    expect(cell.parentElement?.tagName).toBe('TR');
    expect(cell.parentElement).not.toHaveAttribute('data-part');
    expect(cell.parentElement?.parentElement?.tagName).toBe('TBODY');
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('pinning', () => {
  /**
   * The two ends of the same box. `stickyHeader` holds the head against the top
   * and `stickyFooter` holds the summary against the bottom, and a table that
   * asks for neither pays for neither.
   */
  it('marks each end the table asks to hold, and no other', () => {
    const { rerender } = render(<Invoices stickyHeader />);

    const root = screen.getByRole('table').closest('[data-ui="table"]');
    expect(root).toHaveAttribute('data-sticky-header', '');
    expect(root).not.toHaveAttribute('data-sticky-footer');

    rerender(<Invoices stickyFooter stickyHeader />);
    expect(root).toHaveAttribute('data-sticky-footer', '');
  });

  /**
   * A selection column pins like any other, and the column beside it needs to
   * know where the first one stops: two columns pinned to the same edge both
   * resolve against the scroller, so the second is drawn over the first unless
   * the offset is stated.
   */
  it('pins a selection column, and states where the next one starts', () => {
    render(
      <Table columns={2}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableSelectAll sticky="start" />
              <TableColumnHeader sticky="start" stickyOffset="3rem">
                Invoice
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow value="INV-1042">
              <TableSelect sticky="start" />
              <TableRowHeader sticky="start" stickyOffset="3rem">
                INV-1042
              </TableRowHeader>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );

    const chooser = screen.getByRole('columnheader', { name: /Select all/ });
    expect(chooser).toHaveAttribute('data-sticky', 'start');
    expect(chooser).not.toHaveAttribute('style');

    const header = screen.getByRole('columnheader', { name: 'Invoice' });
    expect(header.style.getPropertyValue('--slotted-table-sticky-inset')).toBe('3rem');
    expect(
      screen.getByText('INV-1042').style.getPropertyValue('--slotted-table-sticky-inset'),
    ).toBe('3rem');
  });
});

describe('sorting', () => {
  it('cycles ascending, descending, then none', () => {
    const onSortChange = vi.fn();
    render(<Invoices onSortChange={onSortChange} />);

    const trigger = screen.getByRole('button', { name: 'Client' });
    const header = trigger.closest('th') as HTMLElement;
    /* The mark follows the name as the Glyph element; the stylesheet turns it. */
    expect(trigger.lastElementChild?.querySelector('svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-down',
    );

    fireEvent.click(trigger);
    expect(header).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(trigger);
    expect(header).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(trigger);
    expect(header).not.toHaveAttribute('aria-sort');

    expect(onSortChange.mock.calls.map(([value]) => value)).toEqual([
      { column: 'client', direction: 'ascending' },
      { column: 'client', direction: 'descending' },
      null,
    ]);
  });

  /**
   * ARIA has no way to say which sort key came first, so a second sorted column
   * would be silent or a lie. Sorting a new column moves the property with it.
   */
  it('writes the property on the sorted header and on no other', () => {
    render(<Invoices />);

    fireEvent.click(screen.getByRole('button', { name: 'Client' }));
    fireEvent.click(screen.getByRole('button', { name: 'Invoice' }));

    const sorted = screen
      .getAllByRole('columnheader')
      .filter((cell) => cell.hasAttribute('aria-sort'));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]?.textContent).toBe('Invoice');
  });

  it('says the column and the direction out loud', async () => {
    render(<Invoices />);

    fireEvent.click(screen.getByRole('button', { name: 'Client' }));

    /* The announcer queues, so the message lands a frame later. */
    await waitFor(() => expect(document.body.textContent).toContain('Client, sorted ascending'));
  });

  /** A controlled table reports and waits: it never moves its own value. */
  it('leaves a controlled descriptor to the consumer', () => {
    const onSortChange = vi.fn();
    const sort: TableSortDescriptor = { column: 'client', direction: 'ascending' };
    render(<Invoices onSortChange={onSortChange} sort={sort} />);

    fireEvent.click(screen.getByRole('button', { name: 'Client' }));

    expect(onSortChange).toHaveBeenCalledWith(
      { column: 'client', direction: 'descending' },
      expect.anything(),
    );
    expect(screen.getByRole('button', { name: 'Client' }).closest('th')).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('runs the consumer own handler first, and stops when it refuses', () => {
    const onSortChange = vi.fn();
    render(
      <Table columns={1} onSortChange={onSortChange}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader column="client">
                <TableSort onClick={(event) => event.preventDefault()}>Client</TableSort>
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody />
        </TableContent>
      </Table>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Client' }));
    expect(onSortChange).not.toHaveBeenCalled();
  });
});

describe('where a cell sits in its row', () => {
  /**
   * A row is as tall as its tallest cell, so the axis is a decision rather than
   * a leftover: the table states it once and the one cell that wants the other
   * answer overrides it.
   */
  it('centers by default, and lets a table and a cell each say otherwise', () => {
    const { rerender } = render(<Invoices />);

    const root = screen.getByRole('table').closest('[data-ui="table"]');
    expect(root).toHaveAttribute('data-cell-align', 'center');

    rerender(<Invoices cellAlign="start" />);
    expect(root).toHaveAttribute('data-cell-align', 'start');
    expect(screen.getByText('Northwind Trading')).not.toHaveAttribute('data-block-align');

    render(
      <Table columns={1}>
        <TableContent>
          <TableBody>
            <TableRow value="INV-1042">
              <TableCell blockAlign="end">Bottom</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );
    expect(screen.getByText('Bottom')).toHaveAttribute('data-block-align', 'end');
  });
});

describe('a column name its own box cuts', () => {
  function measure(element: Element, { client, scroll }: { client: number; scroll: number }) {
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: client });
    Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scroll });
  }

  /**
   * A header reading `Cli…` says nothing to the eye while the whole of it is
   * still what a screen reader repeats under every cell. The hint says the
   * words, and only while the box is measured as cutting them.
   */
  it('opens a hint over it, and none over a name that fits', async () => {
    render(
      <TooltipDefaultsProvider openDelay={0}>
        <Invoices />
      </TooltipDefaultsProvider>,
    );
    const header = screen.getByText('Client').closest('th') as HTMLElement;
    /* jsdom does not expand the `overflow` shorthand, so the axis is written. */
    header.style.overflowX = 'hidden';

    measure(header, { client: 160, scroll: 160 });
    fireEvent.pointerEnter(header, { pointerType: 'mouse' });
    expect(document.querySelector('[role="tooltip"]')).toBeNull();

    measure(header, { client: 48, scroll: 160 });
    fireEvent.pointerEnter(header, { pointerType: 'mouse' });
    const hint = await waitFor(() => {
      const found = document.querySelector('[role="tooltip"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(hint.textContent).toBe('Client');
    /* The header already states the words: naming them twice is reading them twice. */
    expect(hint).toHaveAttribute('aria-hidden', 'true');
    expect(header).not.toHaveAttribute('aria-describedby');
  });
});

describe('the column filter', () => {
  const OPTIONS = [{ count: 2, value: 'Paid' }, { count: 1, value: 'Overdue' }, { value: 'Draft' }];

  function Filtered({ onValueChange }: { onValueChange?: (value: SetFilter | null) => void }) {
    return (
      <Table columns={1}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader column="status">
                Status
                <TableColumnActions>
                  <TableSetFilter
                    columnLabel="status"
                    {...(onValueChange ? { onValueChange } : {})}
                    options={OPTIONS}
                  />
                </TableColumnActions>
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody />
        </TableContent>
      </Table>
    );
  }

  function Typed({
    kind,
    onValueChange,
    value,
  }: {
    kind: 'boolean' | 'date' | 'datetime' | 'number' | 'text' | 'time';
    onValueChange?: (value: FilterDescriptor | null) => void;
    value?: FilterDescriptor | null;
  }) {
    const props = {
      columnLabel: 'amount',
      ...(onValueChange ? { onValueChange: onValueChange as never } : {}),
      ...(value === undefined ? {} : { value: value as never }),
    };

    return (
      <Table columns={1}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader column="amount">
                Amount
                <TableColumnActions>
                  {kind === 'text' ? <TableTextFilter {...props} /> : null}
                  {kind === 'number' ? <TableNumberFilter {...props} /> : null}
                  {kind === 'date' ? <TableDateFilter {...props} /> : null}
                  {kind === 'time' ? <TableTimeFilter {...props} /> : null}
                  {kind === 'datetime' ? <TableDateTimeFilter {...props} /> : null}
                  {kind === 'boolean' ? <TableBooleanFilter {...props} /> : null}
                </TableColumnActions>
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody />
        </TableContent>
      </Table>
    );
  }

  /**
   * The whole point of a filter over a list of checkboxes: a reader ticking
   * four values fires one query, not four, and a reader who ticked the wrong
   * one has somewhere to go back to.
   */
  it('reports nothing until Apply, and reports the descriptor the engine reads', async () => {
    const onValueChange = vi.fn();
    render(<Filtered onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter status' }));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Paid' }));
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onValueChange).toHaveBeenCalledWith(
      setFilter(['Paid']),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('cancels the draft when the panel is dismissed', async () => {
    const onValueChange = vi.fn();
    render(<Filtered onValueChange={onValueChange} />);

    const trigger = screen.getByRole('button', { name: 'Filter status' });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Overdue' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('checkbox', { name: 'Overdue' })).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    expect(await screen.findByRole('checkbox', { name: 'Overdue' })).not.toBeChecked();
  });

  /**
   * The covering checkbox answers for what the search left, not for the whole
   * set: a reader who searched and then pressed it expects the four rows they
   * can see, not the forty they cannot.
   */
  it('covers what the search left, and says what is applied in the trigger name', async () => {
    render(<Filtered />);

    const trigger = screen.getByRole('button', { name: 'Filter status' });
    fireEvent.click(trigger);

    /* Three values is under the threshold, so no search is drawn. */
    expect(screen.queryByRole('searchbox')).toBeNull();

    fireEvent.click(await screen.findByRole('checkbox', { name: 'All' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Filter status/ })).toHaveAttribute(
        'data-filtered',
        '',
      ),
    );
    expect(
      screen.getByRole('button', { name: 'Filter status: Is any of Paid, Overdue, Draft' }),
    ).toBeInTheDocument();
  });

  it('draws a search once there are enough values, and narrows on the collator', async () => {
    const many = Array.from({ length: 9 }, (_, index) => ({ value: `Café ${index}` }));
    render(
      <Table columns={1}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader column="region">
                Region
                <TableColumnActions>
                  <TableSetFilter columnLabel="region" options={many} />
                </TableColumnActions>
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody />
        </TableContent>
      </Table>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filter region' }));
    const search = await screen.findByLabelText('Search values');

    /* Without a locale-sensitive comparison, `cafe` matches nothing at all. */
    fireEvent.change(search, { target: { value: 'cafe 3' } });
    expect(screen.getByRole('checkbox', { name: 'Café 3' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Café 4' })).toBeNull();

    fireEvent.change(search, { target: { value: 'nothing here' } });
    expect(screen.getByText('No values match')).toBeInTheDocument();
  });

  /**
   * The vocabulary is the engine's, and the panel offers exactly what the kind
   * holds. A list written here instead would be a second definition of what a
   * text column can be asked.
   */
  it('offers every operator its kind holds, and no other', async () => {
    render(<Typed kind="text" />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter amount' }));
    fireEvent.click(await screen.findByRole('combobox', { name: 'Condition' }));

    const offered = (await screen.findAllByRole('option')).map((option) => option.textContent);
    expect(offered).toEqual(
      operatorsFor('text').map((operator) => tableMessages.base.filterOperators[operator]),
    );
  });

  it('takes two operands for a range and none for a blank test', async () => {
    render(<Typed kind="number" />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter amount' }));
    expect(await screen.findByLabelText('Value')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Between' }));

    await waitFor(() => expect(screen.getByLabelText('From')).toBeInTheDocument());
    expect(screen.getByLabelText('To')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('combobox', { name: 'Condition' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Is empty' }));

    await waitFor(() => expect(screen.queryByLabelText('From')).toBeNull());
    /* The first condition draws no operand at all. The second appears beside
       it, because an operator that takes nothing is complete on its own. */
    const conditions = document.querySelectorAll('[data-part="filter-condition"]');
    expect(conditions[0]).toHaveAttribute('data-operands', '0');
    expect(conditions[0]?.querySelector('[data-part="filter-operand"]')).toBeNull();
  });

  /**
   * AG Grid's own reveal. The second condition is not drawn until the first is
   * complete, so the common case is one condition and the panel never opens as
   * a form.
   */
  it('reveals the second condition and its join once the first is complete', async () => {
    const onValueChange = vi.fn();
    render(<Typed kind="text" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter amount' }));
    expect(screen.queryByRole('radiogroup', { name: 'Match' })).toBeNull();

    fireEvent.change(await screen.findByLabelText('Value'), { target: { value: 'ana' } });
    const join = await screen.findByRole('radiogroup', { name: 'Match' });
    expect(join).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Or' }));
    const operands = screen.getAllByLabelText('Value');
    fireEvent.change(operands[1] as HTMLElement, { target: { value: 'bruno' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onValueChange).toHaveBeenCalledWith(
      {
        conditions: [
          { operator: 'contains', value: 'ana' },
          { operator: 'contains', value: 'bruno' },
        ],
        join: 'or',
        kind: 'text',
      },
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('offers one condition and no join when the consumer says so', async () => {
    render(
      <Table columns={1}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader column="client">
                Client
                <TableColumnActions>
                  <TableTextFilter columnLabel="client" conditions={1} />
                </TableColumnActions>
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody />
        </TableContent>
      </Table>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filter client' }));
    fireEvent.change(await screen.findByLabelText('Value'), { target: { value: 'ana' } });

    expect(screen.queryByRole('radiogroup', { name: 'Match' })).toBeNull();
    expect(screen.getAllByLabelText('Value')).toHaveLength(1);
  });

  /** An operator that takes no operand is complete on its own. */
  it('applies a blank test with no operand at all', async () => {
    const onValueChange = vi.fn();
    render(<Typed kind="text" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter amount' }));
    fireEvent.click(await screen.findByRole('combobox', { name: 'Condition' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Is empty' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onValueChange).toHaveBeenCalledWith(
      { conditions: [{ operator: 'empty' }], join: 'and', kind: 'text' },
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /**
   * An unfinished condition is not a condition, so applying one changes
   * nothing — and a request that changes nothing is never made.
   */
  it('reports nothing at all rather than an unfinished condition', async () => {
    const onValueChange = vi.fn();
    render(<Typed kind="text" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter amount' }));
    await screen.findByLabelText('Value');
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onValueChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByLabelText('Value')).toBeNull());
  });

  /** The one key the family takes, and the reason it is a recorded departure. */
  it('applies on Enter in an operand', async () => {
    const onValueChange = vi.fn();
    render(<Typed kind="text" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter amount' }));
    const operand = await screen.findByLabelText('Value');
    fireEvent.change(operand, { target: { value: 'ana' } });
    fireEvent.keyDown(operand, { key: 'Enter' });

    expect(onValueChange).toHaveBeenCalledWith(
      { conditions: [{ operator: 'contains', value: 'ana' }], join: 'and', kind: 'text' },
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('empties the filter on Clear, and says so', async () => {
    const onValueChange = vi.fn();
    render(<Filtered onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter status' }));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Paid' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    onValueChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Filter status/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Clear' }));

    expect(onValueChange).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear' }));
  });

  /**
   * The two kinds the date chain supplied. The operand is the whole picker,
   * and the descriptor it holds is the ISO text the engine compares at the
   * operand's own precision — so a value that came in as text goes back out
   * unchanged, whatever the picker showed in between.
   */
  it('draws one range picker for a time between, and writes the ISO text at its granularity', async () => {
    const onValueChange = vi.fn();
    const night = {
      conditions: [{ end: '02:00', operator: 'between', value: '22:00' }],
      join: 'and',
      kind: 'time',
    } as const;
    render(<Typed kind="time" onValueChange={onValueChange} value={night} />);

    const trigger = screen.getByRole('button', { name: /^Filter amount: Between 22:00/ });
    expect(trigger).toHaveAttribute('data-filtered', '');
    fireEvent.click(trigger);

    const operand = await waitFor(() => {
      const found = document.querySelector('[data-part="filter-operand"][data-kind="time"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(operand).toHaveAttribute('data-range', '');
    expect(operand.querySelectorAll('[data-ui="time-range-picker"]').length).toBe(1);
    expect(operand.querySelectorAll('[data-ui="time-picker"]').length).toBe(0);

    /* The picker's frame is a button: `Enter` on it opens the picker and
       applies nothing, where `Enter` in a single picker's field applies. */
    const frame = screen.getByRole('button', { name: /^Change range, 10:00 PM/ });
    fireEvent.keyDown(frame, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
    /* One end at a time: the From and To tabs, and the field and the list of
       the end the picker is on, which opens on the start. */
    const start = await waitFor(() => {
      const found = document.querySelector(
        '[data-part="field"][data-position="start"] [role="spinbutton"]',
      );
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(screen.getByRole('tab', { name: /^From/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /^To/ })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('listbox', { name: /^From/ })).toBeInTheDocument();

    /* The start field's hour segment, stepped once: the picker writes the
       minute it is set to, and the descriptor receives `HH:MM` rather than a
       `PlainTime` or a padded second. */
    const hour = start;
    fireEvent.keyDown(hour, { key: 'ArrowUp' });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onValueChange).toHaveBeenCalledWith(
      { ...night, conditions: [{ end: '02:00', operator: 'between', value: '23:00' }] },
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('draws one time picker for every other time operator', async () => {
    render(
      <Typed
        kind="time"
        value={{ conditions: [{ operator: 'after', value: '09:00' }], join: 'and', kind: 'time' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^Filter amount: After 09:00/ }));
    const operand = await waitFor(() => {
      const found = document.querySelector('[data-part="filter-operand"][data-kind="time"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(operand).not.toHaveAttribute('data-range');
    expect(operand.querySelectorAll('[data-ui="time-picker"]').length).toBe(1);
  });

  it('draws a date-time picker, and offers the operators of a day', async () => {
    render(
      <Typed
        kind="datetime"
        value={{
          conditions: [{ operator: 'after', value: '2026-09-14T09:00' }],
          join: 'and',
          kind: 'datetime',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Filter amount: After 2026-09-14T09:00/ }));
    const operand = await waitFor(() => {
      const found = document.querySelector('[data-part="filter-operand"][data-kind="datetime"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(operand.querySelectorAll('[data-ui="datetime-picker"]').length).toBe(1);

    /* The first condition is complete, so the second stands beside it with a
       chooser of its own; the first chooser is the one read. */
    fireEvent.click(screen.getAllByRole('combobox', { name: 'Condition' })[0] as HTMLElement);
    const offered = (await screen.findAllByRole('option')).map((option) => option.textContent);
    expect(offered).toEqual(
      operatorsFor('datetime').map((operator) => tableMessages.base.filterOperators[operator]),
    );
  });

  /**
   * `between` on a date-time is one `datetime-range-picker`. An end still open
   * reaches the draft as no operand, so the condition stays inactive and
   * Apply reports nothing for it — the engine's one rule for a missing operand.
   */
  it('draws one range picker for a date-time between, and holds an open end as no operand', async () => {
    const onValueChange = vi.fn();
    render(
      <Typed
        kind="datetime"
        onValueChange={onValueChange}
        value={{
          conditions: [{ operator: 'between', value: '2026-09-14T09:00' }],
          join: 'and',
          kind: 'datetime',
        }}
      />,
    );

    /* One end is no filter: the trigger is not marked and carries no summary. */
    const trigger = screen.getByRole('button', { name: 'Filter amount' });
    expect(trigger).not.toHaveAttribute('data-filtered');
    fireEvent.click(trigger);

    const operand = await waitFor(() => {
      const found = document.querySelector('[data-part="filter-operand"][data-kind="datetime"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(operand).toHaveAttribute('data-range', '');
    expect(operand.querySelectorAll('[data-ui="datetime-range-picker"]').length).toBe(1);
    expect(operand.querySelectorAll('[data-ui="datetime-picker"]').length).toBe(0);
    expect(operand.querySelector('[data-part="summary"]')).toHaveTextContent(/9:00 AM –$/);

    /* Applied as it stands, the condition is inactive and nothing changes. */
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  /**
   * One control for both ends of a date range rather than two pickers: it says
   * the run's length while it is drawn and takes the ends in either order. The
   * operand grid is told, so a single child is not left in the first of two
   * columns. Every other operator keeps the one picker it had.
   */
  it('draws one range picker for a date between, and one date picker otherwise', async () => {
    render(
      <Typed
        kind="date"
        value={{
          conditions: [{ end: '2026-09-30', operator: 'between', value: '2026-09-01' }],
          join: 'and',
          kind: 'date',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Filter amount: Between/ }));
    const operand = await waitFor(() => {
      const found = document.querySelector('[data-part="filter-operand"][data-kind="date"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(operand).toHaveAttribute('data-range', '');
    expect(operand.querySelectorAll('[data-ui="date-range-picker"]').length).toBe(1);
    expect(screen.getByRole('group', { name: 'From' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'To' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('combobox', { name: 'Condition' })[0] as HTMLElement);
    fireEvent.click(await screen.findByRole('option', { name: 'Is' }));

    await waitFor(() =>
      expect(
        document.querySelector('[data-part="filter-operand"] [data-ui="date-picker"]'),
      ).not.toBeNull(),
    );
    expect(document.querySelector('[data-part="filter-operand"]')).not.toHaveAttribute(
      'data-range',
    );
  });

  /**
   * A list too long to tick is typed instead. The chips hold the same list the
   * checkboxes held, so a saved view is read by either; the options are a
   * datalist of suggestions and the set a typed value must belong to.
   */
  it('types the set as chips, and refuses a value the column does not hold', async () => {
    const onValueChange = vi.fn();
    render(
      <Table columns={1}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader column="status">
                Status
                <TableColumnActions>
                  <TableSetFilter
                    columnLabel="status"
                    onValueChange={onValueChange}
                    operand="tags"
                    options={OPTIONS}
                  />
                </TableColumnActions>
              </TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody />
        </TableContent>
      </Table>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filter status' }));
    const operand = await waitFor(() => {
      const found = document.querySelector('[data-part="filter-operand"][data-operand="tags"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(operand.querySelector('[data-ui="tags-input"]')).not.toBeNull();
    expect(document.querySelector('[data-part="filter-list"]')).toBeNull();
    expect(operand.querySelectorAll('datalist option').length).toBe(OPTIONS.length);

    const input = operand.querySelector('[data-part="input"]') as HTMLInputElement;
    expect(input).toHaveAttribute('list', operand.querySelector('datalist')?.id);
    fireEvent.change(input, { target: { value: 'Paid' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(operand.querySelectorAll('[data-ui="tag"]').length).toBe(1));

    fireEvent.change(input, { target: { value: 'Nope' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(operand.querySelectorAll('[data-ui="tag"]').length).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onValueChange).toHaveBeenCalledWith(
      setFilter(['Paid']),
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  /**
   * A boolean column has three answers and the third is not being filtered at
   * all, which is what an empty draft already is.
   */
  it('holds false as an answer rather than as nothing', async () => {
    const onValueChange = vi.fn();
    render(<Typed kind="boolean" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter amount' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'No' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onValueChange).toHaveBeenCalledWith(
      { conditions: [{ operator: 'is', value: false }], join: 'and', kind: 'boolean' },
      expect.objectContaining({ reason: 'pointer' }),
    );
  });
});

describe('selection', () => {
  /**
   * A row is not selectable under the `table` role, so the state is painted on
   * the row and announced by the checkbox that owns it.
   */
  it('paints the row and writes no aria-selected', () => {
    render(<Invoices selectionMode="multiple" />);

    fireEvent.click(screen.getByRole('checkbox', { name: /INV-1042/ }));

    const row = screen.getByText('INV-1042').closest('tr') as HTMLElement;
    expect(row).toHaveAttribute('data-selected', '');
    expect(row).not.toHaveAttribute('aria-selected');
  });

  it('selects a range from the anchor when Shift is held', () => {
    const onValueChange = vi.fn();
    render(<Invoices onValueChange={onValueChange} selectionMode="multiple" />);

    fireEvent.click(screen.getByRole('checkbox', { name: /INV-1042/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /INV-1044/ }), { shiftKey: true });

    expect(onValueChange).toHaveBeenLastCalledWith(
      ['INV-1042', 'INV-1043', 'INV-1044'],
      expect.anything(),
    );
  });

  it('covers the rows in the DOM with the header checkbox, and says how many', () => {
    render(<Invoices selectionMode="multiple" />);

    const all = screen.getByRole('checkbox', { name: /Select all rows/ });
    fireEvent.click(all);
    expect(
      screen.getAllByRole('row').filter((row) => row.hasAttribute('data-selected')),
    ).toHaveLength(3);

    fireEvent.click(screen.getByRole('checkbox', { name: /INV-1043/ }));
    /* The state is painted on the checkbox's own root, which is the element
       that draws the bar; the input carries the property the platform holds. */
    const header = screen.getByRole('checkbox', { name: /2 selected/ }) as HTMLInputElement;
    expect(header.closest('[data-ui="checkbox"]')).toHaveAttribute('data-indeterminate', '');
  });

  it('names each checkbox with a visually hidden label, as the Angular binding does', () => {
    render(<Invoices selectionMode="multiple" />);

    for (const name of [/Select all rows/, /INV-1042/]) {
      const control = screen.getByRole('checkbox', { name });
      expect(control).not.toHaveAttribute('aria-label');
      const box = control.closest('[data-ui="checkbox"]') as HTMLElement;
      const hidden = box.querySelector('[data-part="label"] [data-ui="visually-hidden"]');
      expect(hidden?.textContent).toMatch(name);
      expect(box).toHaveAttribute('data-label-hidden');
    }
  });

  it('leaves a disabled row out of the set the header covers', () => {
    render(<Invoices disabledRow="INV-1043" selectionMode="multiple" />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Select all rows/ }));

    expect(
      screen.getAllByRole('row').filter((row) => row.hasAttribute('data-selected')),
    ).toHaveLength(2);
  });
});

describe('expansion', () => {
  function Expandable() {
    return (
      <Table columns={2}>
        <TableContent>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Invoice</TableColumnHeader>
              <TableColumnHeader>Client</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow value="INV-1042">
              <TableCell>
                <TableExpander />
              </TableCell>
              <TableRowHeader>INV-1042</TableRowHeader>
            </TableRow>
            <TableDetail value="INV-1042">Two reminders sent.</TableDetail>
          </TableBody>
        </TableContent>
      </Table>
    );
  }

  it('renders nothing while it is closed, and says so', () => {
    render(<Expandable />);

    const expander = screen.getByRole('button');
    expect(expander).toHaveAttribute('aria-expanded', 'false');
    // A closed detail row is not rendered, so the expander names nothing yet.
    expect(expander).not.toHaveAttribute('aria-controls');
    expect(expander.querySelector('[data-ui="icon"] > svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    expect(screen.queryByText('Two reminders sent.')).toBeNull();

    fireEvent.click(expander);
    expect(expander).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Two reminders sent.')).toBeInTheDocument();
    expect(document.getElementById(expander.getAttribute('aria-controls') ?? '')).toHaveAttribute(
      'data-part',
      'detail',
    );
  });
});

describe('the size of a set the DOM does not hold', () => {
  it('writes the pair only when the consumer states a total', () => {
    const { rerender } = render(<Invoices />);
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-rowcount');

    rerender(
      <Table columns={1}>
        <TableContent totalRowCount={128}>
          <TableBody>
            <TableRow rowIndex={41} value="INV-1042">
              <TableCell>Northwind Trading</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );

    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '128');
    expect(screen.getByRole('row')).toHaveAttribute('aria-rowindex', '41');
  });
});

describe('the scrolling region', () => {
  /**
   * `jsdom` lays nothing out: every element measures zero, so a scroller is
   * whatever the test says it is.
   */
  function measure(element: Element, { client, scroll }: { client: number; scroll: number }) {
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: client });
    Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scroll });
  }

  it('takes a tab stop only while the table overflows', () => {
    const { container, rerender } = render(<Invoices />);
    const scroll = container.querySelector('[data-part="scroll"]') as HTMLElement;

    expect(scroll).not.toHaveAttribute('tabindex');
    expect(scroll).not.toHaveAttribute('role');

    measure(scroll, { client: 320, scroll: 900 });
    rerender(<Invoices striped />);
    fireEvent.scroll(scroll);

    expect(scroll).toHaveAttribute('role', 'region');
    expect(scroll).toHaveAttribute('tabindex', '0');
    expect(scroll).toHaveAttribute('data-overflowing', '');
    expect(scroll).toHaveAccessibleName('Table, scrollable');
  });

  it('draws its ring for a focus from the keyboard, and not for a click followed by Shift', () => {
    /** A pointer press focuses the nearest focusable ancestor, as a browser does. */
    const press = (target: Element) => {
      fireEvent.pointerDown(target);
      target.closest<HTMLElement>('[tabindex], a[href], button')?.focus();
    };
    const { container, rerender } = render(<Invoices />);
    const scroll = container.querySelector('[data-part="scroll"]') as HTMLElement;
    measure(scroll, { client: 320, scroll: 900 });
    rerender(<Invoices striped />);
    fireEvent.scroll(scroll);

    press(scroll.querySelector('td')!);
    fireEvent.keyDown(scroll, { key: 'Shift' });
    expect(document.activeElement).toBe(scroll);
    expect(scroll).not.toHaveAttribute('data-focus-origin', 'keyboard');

    fireEvent.keyDown(scroll, { key: 'ArrowRight' });
    expect(scroll).toHaveAttribute('data-focus-origin', 'keyboard');

    scroll.blur();
    expect(scroll).not.toHaveAttribute('data-focus-origin');
    fireEvent.keyDown(document.body, { key: 'Tab' });
    scroll.focus();
    expect(scroll).toHaveAttribute('data-focus-origin', 'keyboard');
  });
});

describe('an application setting the family once', () => {
  it('is overridden by a table that states the axis itself', () => {
    render(
      <TableDefaultsProvider variant="plain">
        <Invoices />
        <Invoices variant="framed" />
      </TableDefaultsProvider>,
    );

    const [plain, framed] = screen.getAllByRole('table').map((table) => table.closest('[data-ui]'));
    expect(plain).toHaveAttribute('data-variant', 'plain');
    expect(framed).toHaveAttribute('data-variant', 'framed');
  });
});

/**
 * The outer inset is an axis the stylesheet reads from the root; the computed
 * padding it produces is asserted in a browser, by
 * `tools/harness/scenarios/table-edges.mjs`.
 */
describe('the outer edges', () => {
  it('writes inset by default, and what an application or the table states', () => {
    render(
      <>
        <Invoices />
        <TableDefaultsProvider edges="flush">
          <Invoices />
          <Invoices edges="inset" />
        </TableDefaultsProvider>
      </>,
    );

    const roots = screen.getAllByRole('table').map((table) => table.closest('[data-ui]'));
    expect(roots.map((root) => root?.getAttribute('data-edges'))).toEqual([
      'inset',
      'flush',
      'inset',
    ]);
  });
});

describe('the language in force', () => {
  it('speaks it, and lays its own messages over it', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Invoices messages={{ selectRow: 'Marcar {row}' }} selectionMode="multiple" />
      </SlottedProvider>,
    );

    expect(
      // language: pt-BR
      screen.getByRole('checkbox', { name: 'Selecionar todas as linhas' }),
      // language: en-US
    ).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: /^Marcar \S/ }).length).toBeGreaterThan(0);
  });
});

describe('the contract', () => {
  it('renders every part the contract declares', () => {
    const { container } = render(<Invoices selectionMode="multiple" />);
    const rendered = new Set(
      [...container.querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );

    for (const part of [
      'root',
      'scroll',
      'table',
      'caption',
      'head',
      'body',
      'row',
      'column-header',
      'row-header',
      'cell',
      'sort',
      'selection',
    ]) {
      expect(rendered.has(part), part).toBe(true);
    }
    expect(contract.members.table.parts).toContain('footer');
  });
});

/**
 * A ledger grouped by day: a band row per day that spans every column, a
 * current row beside a detail pane, and a row a click anywhere opens while its
 * link stays the keyboard's way in.
 */
describe('rows of a ledger', () => {
  function Ledger({
    current,
    onAction,
  }: {
    current?: string | undefined;
    onAction?: ((value: string) => void) | undefined;
  }) {
    return (
      <Table columns={3}>
        <TableContent>
          <TableCaption>Transactions</TableCaption>
          <TableHead>
            <TableRow>
              <TableColumnHeader>Description</TableColumnHeader>
              <TableColumnHeader>Category</TableColumnHeader>
              <TableColumnHeader numeric>Amount</TableColumnHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableGroupRow end="−R$ 58,40">Today</TableGroupRow>
            {['mercado', 'farmacia'].map((value) => (
              <TableRow
                current={current === value}
                key={value}
                {...(onAction === undefined ? {} : { onAction: () => onAction(value) })}
                value={value}
              >
                <TableCell>
                  <a href={`#${value}`}>{value}</a>
                </TableCell>
                <TableCell>
                  <button type="button">Categoria de {value}</button>
                </TableCell>
                <TableCell numeric>29,20</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContent>
      </Table>
    );
  }

  it('draws a band row whose one header spans every column and names the group', () => {
    render(<Ledger />);
    const band = document.querySelector('[data-part="group-row"]') as HTMLElement;
    const header = band.querySelector('th') as HTMLTableCellElement;
    expect(band.children).toHaveLength(1);
    expect(header.colSpan).toBe(3);
    expect(header).toHaveAttribute('scope', 'rowgroup');
    expect(header).toHaveAttribute('data-part', 'group-header');
    expect(header.querySelector('[data-part="group-start"]')).toHaveTextContent('Today');
    expect(header.querySelector('[data-part="group-end"]')).toHaveTextContent('−R$ 58,40');
  });

  it('marks the row the detail pane shows as current, and no other', () => {
    render(<Ledger current="farmacia" />);
    const rows = document.querySelectorAll('[data-part="body"] > [data-part="row"]');
    expect(rows[0]).not.toHaveAttribute('aria-current');
    expect(rows[1]).toHaveAttribute('aria-current', 'true');
    expect(rows[1]).toHaveAttribute('data-current');
  });

  it('acts on a click on a plain cell, and not on a click on a control inside the row', () => {
    const onAction = vi.fn();
    render(<Ledger onAction={onAction} />);
    const rows = document.querySelectorAll('[data-part="body"] > [data-part="row"]');
    expect(rows[0]).toHaveAttribute('data-interactive');

    fireEvent.click(rows[0]!.querySelector('[data-numeric]') ?? rows[0]!.lastElementChild!);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenLastCalledWith('mercado');

    fireEvent.click(screen.getByRole('button', { name: 'Categoria de mercado' }));
    fireEvent.click(screen.getByRole('link', { name: 'mercado' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('leaves the row out of the tab order: its link is the way in', () => {
    render(<Ledger onAction={() => {}} />);
    const row = document.querySelector('[data-part="body"] > [data-part="row"]');
    expect(row).not.toHaveAttribute('tabindex');
    expect(row).not.toHaveAttribute('role');
  });
});

/**
 * Measured in Chrome, a hundred rows of twenty cells cost 1.2 times the same
 * rows as a plain `table` in a production build and about 2.1 times in
 * React's development build, whose per-element instrumentation is the
 * difference. What the family adds to the mounting task is the scroller, and
 * the scroller no longer forces a layout of every row inside it.
 */
describe('Table, the cost of a hundred rows', () => {
  it('reads no layout while it mounts when an observer will report the first size', () => {
    const reports: (() => void)[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          reports.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    let reads = 0;
    const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => {
        reads += 1;
        return 0;
      },
    });

    const { unmount } = render(
      <Table columns={2}>
        <TableContent>
          <TableBody>
            <TableRow>
              <TableCell>a</TableCell>
              <TableCell>b</TableCell>
            </TableRow>
          </TableBody>
        </TableContent>
      </Table>,
    );

    expect(reads).toBe(0);
    expect(reports).toHaveLength(1);
    unmount();
    if (width !== undefined) Object.defineProperty(HTMLElement.prototype, 'clientWidth', width);
    vi.unstubAllGlobals();
  });
});
