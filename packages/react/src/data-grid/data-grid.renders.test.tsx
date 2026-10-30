import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { DataGrid } from './data-grid';
import type { DataGridCellContext, DataGridColumn } from './data-grid.types';

interface Entry {
  id: string;
  payee: string;
  amount: number;
}

const ROWS: Entry[] = Array.from({ length: 30 }, (_, index) => ({
  id: `E${index}`,
  payee: `Payee ${index}`,
  amount: index * 10,
}));

const COLUMNS: DataGridColumn<Entry>[] = [
  { id: 'payee', label: 'Payee', rowHeader: true },
  { id: 'amount', label: 'Amount', kind: 'number' },
];

/**
 * Every row re-rendered on each selection change and each scroll step: the row
 * is memoised, but it and its cells read the whole grid context, whose value
 * changes with the selection and the window.
 */
describe('DataGrid row renders', () => {
  it('re-renders only the row whose selection changed', () => {
    const rendered: string[] = [];
    render(
      <DataGrid<Entry>
        aria-label="Entries"
        cellRenderers={{
          payee: ({ row, text }) => {
            rendered.push(row.id);
            return <span>{text}</span>;
          },
        }}
        columns={COLUMNS}
        rowKey="id"
        rows={ROWS}
        selectionMode="multiple"
        virtualize={false}
      />,
    );
    rendered.length = 0;

    const checkbox = screen.getAllByRole('checkbox', { name: /Payee 3/ })[0]!;
    fireEvent.click(checkbox);

    expect(new Set(rendered)).toEqual(new Set(['E3']));
  });
});

/**
 * A parent that holds the selection renders on every change of it, and the
 * props it writes inline are new objects each time: `messages`, `renderGroup`,
 * `tree`. Each of them re-rendered every mounted row, so a selection change
 * rendered the whole window instead of one row.
 */
describe('DataGrid row renders under a parent that renders', () => {
  const rendered: string[] = [];
  type TreeEntry = Entry & { parentId?: string | null };
  const COUNTING: Readonly<Record<string, (context: DataGridCellContext<TreeEntry>) => ReactNode>> =
    {
      payee: ({ row, text }) => {
        rendered.push(row.id);
        return <span>{text}</span>;
      },
    };

  it('re-renders one row for a selection change, with inline messages and renderGroup', () => {
    function Parent() {
      const [value, setValue] = useState<readonly string[]>([]);
      return (
        <DataGrid<Entry>
          aria-label="Entries"
          cellRenderers={COUNTING}
          columns={COLUMNS}
          messages={{ selectRow: ({ row }) => `Select ${String(row)}` }}
          onValueChange={(next) => setValue(next as readonly string[])}
          renderGroup={({ node }) => <strong>{node.text}</strong>}
          rowKey="id"
          rows={ROWS}
          selectionMode="multiple"
          value={value}
          virtualize={false}
        />
      );
    }
    render(<Parent />);
    rendered.length = 0;

    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Select Payee 3' })[0]!);

    expect(rendered).toEqual(['E3']);
  });

  const TREE: TreeEntry[] = [
    { ...ROWS[0]!, parentId: null },
    { ...ROWS[1]!, parentId: 'E0' },
    { ...ROWS[2]!, parentId: 'E0' },
  ];

  it('re-renders no row when the parent renders for its own state, with an inline tree', () => {
    let bump: () => void = () => {};
    function Parent() {
      const [count, setCount] = useState(0);
      bump = () => setCount(count + 1);
      return (
        <DataGrid<TreeEntry>
          aria-label={`Entries ${String(count)}`}
          cellRenderers={COUNTING}
          columns={COLUMNS}
          rowKey="id"
          rows={TREE}
          tree={{ parentKey: (row) => row.parentId }}
          virtualize={false}
        />
      );
    }
    render(<Parent />);
    rendered.length = 0;

    act(() => bump());

    expect(rendered).toEqual([]);
  });
});
