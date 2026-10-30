import { emptyQuery, type GridColumn, type GridQuery } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/data-list/contract.json';
import { SlottedProvider } from '../i18n';
import { DataList } from './data-list';
import { DataListDefaultsProvider } from './data-list-defaults';
import type { DataListHandle, DataListProps } from './data-list.types';

interface Account {
  id: string;
  name: string;
  email: string;
  balance: number;
  status: string;
  owner: string | null;
  region: string;
  plan: string;
  created: string;
}

const ROWS: Account[] = [
  {
    id: 'acme',
    name: 'Acme Logistics',
    email: 'ops@acme.example',
    balance: 12480,
    status: 'Active',
    owner: 'Marta Silva',
    region: 'Lisbon',
    plan: 'Pro',
    created: '2024-01-04',
  },
  {
    id: 'borealis',
    name: 'Borealis Foods',
    email: 'buying@borealis.example',
    balance: 3902,
    status: 'On hold',
    owner: null,
    region: 'Porto',
    plan: 'Free',
    created: '2023-06-10',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Studio',
    email: 'hello@cobalt.example',
    balance: 48120,
    status: 'Active',
    owner: 'John Reed',
    region: 'Madrid',
    plan: 'Enterprise',
    created: '2022-02-01',
  },
];

const COLUMNS: GridColumn<Account>[] = [
  { id: 'name', label: 'Account', rowHeader: true },
  { id: 'email', label: 'Email' },
  { id: 'balance', label: 'Balance', kind: 'number' },
  { id: 'status', label: 'Status', priority: 1 },
  { id: 'owner', label: 'Owner', priority: 2 },
  { id: 'region', label: 'Region', priority: 3 },
  { id: 'plan', label: 'Plan' },
  { id: 'created', label: 'Created', kind: 'date', sortable: false },
];

function Harness(props: Partial<DataListProps<Account>>) {
  return (
    <DataList
      columns={COLUMNS}
      label="Accounts"
      locale="en-US"
      rowKey="id"
      rows={ROWS}
      subtitle="email"
      trailing="balance"
      {...props}
    />
  );
}

const records = () => screen.getAllByRole('listitem');
const record = (name: string) =>
  records().find((item) => within(item).queryByText(name) !== null) as HTMLElement;

describe('DataList', () => {
  it('names the family and its parts the way the contract declares', () => {
    const { container } = render(<Harness selectionMode="multiple" href={(row) => `#${row.id}`} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['ui']).toBe(contract.ui);
    expect(root.dataset['part']).toBe('root');
    for (const part of [
      'header',
      'select-all',
      'count',
      'sort',
      'selection',
      'title',
      'fields',
      'field',
      'field-label',
      'field-value',
      'field-empty',
      'more',
      'trailing',
    ]) {
      expect(container.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(screen.getByRole('list', { name: 'Accounts' })).toBeInTheDocument();
    for (const item of records()) expect(item.dataset['ui']).toBe('list-item');
  });

  it('places the columns: title, subtitle, trailing and the fields by priority', () => {
    render(<Harness />);
    const acme = record('Acme Logistics');
    expect(within(acme).getByText('ops@acme.example')).toBeInTheDocument();
    expect(acme.querySelector('[data-part="trailing"]')).toHaveTextContent('12,480');
    const labels = [...acme.querySelectorAll('[data-part="field-label"]')].map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(['Status', 'Owner', 'Region', 'Plan']);
  });

  it('says an empty field in words a reader hears, beside the dash a reader sees', () => {
    render(<Harness />);
    const empty = record('Borealis Foods').querySelector('[data-part="field-empty"]');
    expect(empty).toHaveTextContent('—');
    expect(empty).toHaveTextContent('Empty');
  });

  it('opens the fields past `fields` and asks with a reason', () => {
    const onExpandedChange = vi.fn();
    render(<Harness fields={2} onExpandedChange={onExpandedChange} />);
    const acme = record('Acme Logistics');
    const more = within(acme).getByRole('button', { name: 'Show 3 more' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more.querySelector('[data-ui="icon"] > svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-down',
    );
    expect(more.getAttribute('aria-controls')).toBe(acme.querySelector('dl')?.id);
    fireEvent.click(more, { detail: 1 });
    expect(onExpandedChange).toHaveBeenCalledWith(
      ['acme'],
      expect.objectContaining({ reason: 'pointer', key: 'acme' }),
    );
    expect(within(acme).getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(acme.querySelectorAll('[data-part="field"]')).toHaveLength(5);
  });

  it('holds a controlled expansion until the consumer moves it', () => {
    render(<Harness expanded={[]} fields={2} />);
    fireEvent.click(within(record('Acme Logistics')).getByRole('button', { name: 'Show 3 more' }));
    expect(
      within(record('Acme Logistics')).getByRole('button', { name: 'Show 3 more' }),
    ).toBeInTheDocument();
  });

  it('selects a record through its checkbox and paints it, with no aria-selected', () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} selectionMode="multiple" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Acme Logistics' }));
    expect(onValueChange).toHaveBeenCalledWith(['acme'], expect.anything());
    expect(record('Acme Logistics')).toHaveAttribute('data-selected');
    expect(record('Acme Logistics')).not.toHaveAttribute('aria-selected');
    expect(screen.getByText('1 of 3 selected')).toBeInTheDocument();
  });

  it('extends the selection from the anchor with Shift', () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} selectionMode="multiple" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Acme Logistics' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Cobalt Studio' }), {
      shiftKey: true,
    });
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['acme', 'borealis', 'cobalt'],
      expect.objectContaining({ reason: 'select' }),
    );
  });

  it('selects every record the query left, and says the count in the name', () => {
    render(<Harness disabledKeys={['borealis']} selectionMode="multiple" />);
    const all = screen.getByRole('checkbox', { name: 'Select all 2 items' });
    fireEvent.click(all);
    expect(screen.getByText('2 of 3 selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Borealis Foods' })).toBeDisabled();
  });

  it('keeps a selection the filter hides', () => {
    const query: GridQuery = {
      ...emptyQuery(),
      filter: {
        join: 'and',
        rules: [
          {
            field: 'region',
            filter: {
              kind: 'text',
              join: 'and',
              conditions: [{ operator: 'equals', value: 'Porto' }],
            },
          },
        ],
      },
    } as unknown as GridQuery;
    const onValueChange = vi.fn();
    render(
      <Harness
        defaultValue={['acme']}
        onValueChange={onValueChange}
        query={query}
        selectionMode="multiple"
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Borealis Foods' }));
    expect(onValueChange).toHaveBeenCalledWith(['acme', 'borealis'], expect.anything());
  });

  it('holds one key in single mode', () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} selectionMode="single" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Cobalt Studio' }));
    expect(onValueChange).toHaveBeenCalledWith('cobalt', expect.anything());
    expect(screen.queryByRole('checkbox', { name: /Select all/ })).toBeNull();
  });

  it('sorts from the menu and announces the order', async () => {
    const onQueryChange = vi.fn();
    render(<Harness onQueryChange={onQueryChange} />);
    /* Without a key there is nothing to point at, and no chevron is drawn. */
    expect(document.querySelector('[data-part="sort"] svg[data-glyph]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }), { detail: 1 });
    await screen.findByRole('menu');
    expect(screen.queryByRole('menuitemradio', { name: 'Created' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Balance' }), { detail: 1 });
    expect(onQueryChange).toHaveBeenCalledWith(
      expect.objectContaining({ sort: [{ column: 'balance', direction: 'ascending' }] }),
      expect.objectContaining({ change: 'sort', reason: 'pointer' }),
    );
    await waitFor(() => expect(records()[0]).toHaveTextContent('Borealis Foods'));
  });

  it('turns the direction of the first key', async () => {
    const onQueryChange = vi.fn();
    render(
      <Harness
        defaultQuery={{ ...emptyQuery(), sort: [{ column: 'balance', direction: 'ascending' }] }}
        onQueryChange={onQueryChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: /Sort, Balance ascending/ });
    expect(trigger).toHaveTextContent('Sort: Balance');
    expect(
      trigger.querySelector('[data-part="end"] > [data-ui="icon"] > svg[data-glyph]'),
    ).toHaveAttribute('data-glyph', 'chevron-down');
    fireEvent.click(trigger, { detail: 1 });
    await screen.findByRole('menu');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Descending' }), { detail: 1 });
    await waitFor(() => expect(records()[0]).toHaveTextContent('Cobalt Studio'));
  });

  it('makes the title a link or a command, and activates once', () => {
    const onActivate = vi.fn();
    const { rerender } = render(<Harness href={(row) => `#${row.id}`} onActivate={onActivate} />);
    const link = screen.getByRole('link', { name: 'Acme Logistics' });
    expect(link).toHaveAttribute('href', '#acme');
    rerender(<Harness activatable onActivate={onActivate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Acme Logistics' }), { detail: 1 });
    expect(onActivate).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'acme', reason: 'pointer' }),
    );
  });

  it('refuses the activation of a disabled or busy record', () => {
    const onActivate = vi.fn();
    render(
      <Harness
        activatable
        disabledKeys={['acme']}
        loadingKeys={['cobalt']}
        onActivate={onActivate}
      />,
    );
    expect(screen.getByRole('button', { name: 'Acme Logistics' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cobalt Studio' })).toBeDisabled();
    expect(record('Acme Logistics')).toHaveAttribute('data-disabled');
    expect(record('Cobalt Studio')).toHaveAttribute('data-loading');
  });

  it('marks the current record through the row', () => {
    render(<Harness current="cobalt" href={(row) => `#${row.id}`} />);
    expect(record('Cobalt Studio')).toHaveAttribute('aria-current', 'page');
    expect(record('Cobalt Studio')).toHaveAttribute('data-current');
  });

  it('draws a value through renderCell with the cell’s context', () => {
    render(
      <Harness
        renderCell={({ column, text }) =>
          column.id === 'status' ? <strong>{text}!</strong> : undefined
        }
      />,
    );
    expect(within(record('Acme Logistics')).getByText('Active!').tagName).toBe('STRONG');
  });

  it('groups by query.group into list sections', () => {
    render(<Harness defaultQuery={{ ...emptyQuery(), group: ['status'] }} />);
    expect(screen.getByText('Status: Active · 2')).toBeInTheDocument();
    expect(screen.getByText('Status: On hold · 1')).toBeInTheDocument();
  });

  it('tells empty, no results and error apart, and clears the filter in one change', () => {
    const { rerender } = render(<Harness rows={[]} />);
    expect(screen.getByText('No items yet')).toBeInTheDocument();

    const onQueryChange = vi.fn();
    rerender(
      <Harness
        key="search"
        defaultQuery={{ ...emptyQuery(), search: 'zzz' }}
        onQueryChange={onQueryChange}
      />,
    );
    expect(screen.getByText('No items match')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onQueryChange).toHaveBeenCalledWith(
      expect.objectContaining({ filter: null, search: '' }),
      expect.objectContaining({ change: 'filter', reason: 'clear' }),
    );

    const onRetry = vi.fn();
    rerender(<Harness error onRetry={onRetry} rows={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('draws the item anatomy in skeleton on the first load and keeps rows on a refresh', async () => {
    const { container, rerender } = render(<Harness loading loadingDelay={0} rows={[]} />);
    const loader = container.querySelector('[data-part="loader"]');
    expect(loader).not.toBeNull();
    expect(loader?.querySelectorAll('[data-part="field-label"]')[0]).toHaveTextContent('Status');
    rerender(<Harness loading loadingDelay={0} loadingMinDuration={0} />);
    await waitFor(() => expect(container.querySelector('[data-part="loader"]')).toBeNull());
    rerender(<Harness loading />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(records()).toHaveLength(3);
  });

  it('asks for more rows from the footer, and the button waits without dimming the list', () => {
    const onLoadMore = vi.fn();
    const { container, rerender } = render(<Harness hasMore onLoadMore={onLoadMore} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalled();
    rerender(<Harness hasMore loading onLoadMore={onLoadMore} />);
    expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
  });

  it('moves focus to the next record when the focused one is removed', () => {
    function Removable() {
      const [rows, setRows] = useState(ROWS);
      return (
        <>
          <Harness rows={rows} selectionMode="multiple" />
          <button
            onClick={() => setRows((all) => all.filter((row) => row.id !== 'borealis'))}
            type="button"
          >
            remove
          </button>
        </>
      );
    }
    render(<Removable />);
    const checkbox = screen.getByRole('checkbox', { name: 'Select Borealis Foods' });
    checkbox.focus();
    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'Select Cobalt Studio' }),
    );
  });

  it('exposes focus, focusKey and scrollToKey', () => {
    const ref = createRef<DataListHandle>();
    render(<Harness ref={ref} selectionMode="multiple" />);
    expect(ref.current?.root?.dataset['ui']).toBe('data-list');
    expect(ref.current?.focusKey('cobalt')).toBe(true);
    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'Select Cobalt Studio' }),
    );
    expect(ref.current?.focusKey('nope')).toBe(false);
  });

  it('takes defaults from the provider, and plurals from its own messages', () => {
    render(
      <DataListDefaultsProvider variant="framed">
        {/* language: pt-BR */}
        <Harness messages={{ count: '{count, plural, one {# conta} other {# contas}}' }} />
        {/* language: en-US */}
      </DataListDefaultsProvider>,
    );
    expect(screen.getByText('3 contas')).toBeInTheDocument();
    expect(document.querySelector('[data-ui="data-list"]')).toHaveAttribute(
      'data-variant',
      'framed',
    );
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <Harness selectionMode="multiple" />
      </SlottedProvider>,
    );
    expect(screen.getByText('3 itens')).toBeInTheDocument();
    // language: pt-BR
    expect(
      screen.getByRole('checkbox', { name: 'Selecionar todos os 3 itens' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Selecionar Acme Logistics' })).toBeInTheDocument();
    // language: en-US
  });

  it('passes native props and composes the consumer’s blur handler', () => {
    const onBlur = vi.fn();
    render(<Harness data-testid="list" id="accounts" onBlur={onBlur} />);
    const root = screen.getByTestId('list');
    expect(root).toHaveAttribute('id', 'accounts');
    fireEvent.blur(root);
    expect(onBlur).toHaveBeenCalled();
  });
});
