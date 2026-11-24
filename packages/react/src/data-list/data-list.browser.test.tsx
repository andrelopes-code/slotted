import type { GridColumn } from '@slotted/core/grid';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IconButton } from '../button';
import { Glyph } from '../icon';
import { DataList } from './index';

interface Account {
  readonly id: string;
  readonly name: string;
}

const COLUMNS: GridColumn<Account>[] = [
  { id: 'name', label: 'Name', rowHeader: true },
  { id: 'actions', kind: 'actions', label: 'Actions' },
];

/* The control of a record makes its row taller than its text, on both screens. */
describe('a record with a title and an action', () => {
  it.each(['sm', 'md', 'lg'] as const)('is as tall as its skeleton (%s)', (size) => {
    const loading = draw({ loading: true, rows: [], size });
    const skeleton = height(loading.container);
    loading.unmount();

    const loaded = draw({ loading: false, rows: [{ id: 'a', name: 'Checking' }], size });

    expect(loaded.container.querySelector('[data-part="loader"]')).toBeNull();
    expect(skeleton).toBeCloseTo(height(loaded.container), 0);
  });
});

interface DrawProps {
  readonly loading: boolean;
  readonly rows: readonly Account[];
  readonly size: 'sm' | 'md' | 'lg';
}

function draw({ loading, rows, size }: DrawProps) {
  return render(
    <DataList
      columns={COLUMNS}
      label="Accounts"
      loading={loading}
      loadingDelay={0}
      renderCell={({ column, row }) =>
        column.id === 'actions' ? (
          <IconButton aria-label={`Open ${row.name}`} size="sm" variant="ghost">
            <Glyph name="ellipsis" />
          </IconButton>
        ) : undefined
      }
      rowKey={(row) => row.id}
      rows={rows}
      size={size}
    />,
  );
}

function height(container: HTMLElement) {
  return container.querySelector('[data-ui="list-item"]')!.getBoundingClientRect().height;
}
