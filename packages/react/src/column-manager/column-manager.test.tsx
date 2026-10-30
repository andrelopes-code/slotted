import type { GridColumn, GridColumnState } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { ColumnManager, ColumnManagerTrigger } from './column-manager';
import type {
  ColumnManagerHandle,
  ColumnManagerProps,
  ColumnManagerRequest,
} from './column-manager.types';

const COLUMNS: GridColumn[] = [
  { id: 'order', label: 'Order', hideable: false },
  { id: 'customer', label: 'Customer' },
  { id: 'status', label: 'Status', description: 'Fulfilment stage, from Draft to Delivered' },
  { id: 'due', label: 'Due date', description: 'The date promised to the customer' },
  // language: pt-BR
  { id: 'region', label: 'Região' },
  // language: en-US
  { id: 'notes', label: 'Notes' },
];

const DEFAULTS: Partial<GridColumnState> = {
  hidden: ['notes'],
  pinned: { start: ['order'], end: [] },
};

type Spy = ReturnType<
  typeof vi.fn<(state: GridColumnState, request: ColumnManagerRequest) => void>
>;

function inline(props: Partial<ColumnManagerProps> = {}) {
  const onColumnStateChange: Spy = vi.fn();
  const view = render(
    <ColumnManager
      columns={COLUMNS}
      defaultColumnState={DEFAULTS}
      onColumnStateChange={onColumnStateChange}
      presentation="inline"
      {...props}
    />,
  );
  return { ...view, onColumnStateChange };
}

const item = (id: string) =>
  document.querySelector<HTMLElement>(`[data-part="item"][data-column="${id}"]`)!;
const box = (id: string) => item(id).querySelector<HTMLInputElement>('input[type="checkbox"]')!;
const handle = (id: string) => item(id).querySelector<HTMLButtonElement>('[data-part="handle"]')!;
const lastRequest = (spy: Spy) => spy.mock.calls.at(-1)![1];

describe('ColumnManager', () => {
  /* No stylesheet paints a glyph: each one is an `icon` holding the library's `Glyph`. */
  it('draws the magnifier, and a grip and a pin on every row, as glyph elements', () => {
    inline();
    const glyph = (host: Element | null) =>
      host?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    expect(glyph(document.querySelector('[data-part="search"]'))).toBe('search');
    for (const id of ['order', 'customer', 'notes']) {
      expect(glyph(handle(id))).toBe('grip-vertical');
      expect(glyph(item(id).querySelector('[data-part="pin"]'))).toBe('pin');
    }
    /* A pinned column's pin is the same glyph; the accent ink is the stylesheet's. */
    expect(item('order').querySelector('[data-part="pin"]')).toHaveAttribute('data-pinned');
  });

  it('asks to hide a column with the change hidden and the reason of the press', () => {
    const { onColumnStateChange } = inline();
    fireEvent.click(box('customer'), { detail: 1 });
    expect(onColumnStateChange).toHaveBeenCalledTimes(1);
    const [state, request] = onColumnStateChange.mock.calls[0]!;
    expect(state.hidden).toEqual(['notes', 'customer']);
    expect(request.change).toBe('hidden');
    expect(request.changes).toEqual(['hidden']);
    expect(request.reason).toBe('pointer');
    expect(request.previous.hidden).toEqual(['notes']);
  });

  it('moves in uncontrolled mode and waits for the consumer in controlled mode', () => {
    inline();
    fireEvent.click(box('customer'));
    expect(item('customer')).toHaveAttribute('data-hidden');

    const controlled = normalize({ hidden: [] });
    const { onColumnStateChange } = inline({ columnState: controlled });
    const boxes = document.querySelectorAll<HTMLElement>(
      '[data-part="item"][data-column="customer"] input',
    );
    fireEvent.click(boxes[1]!);
    expect(onColumnStateChange).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[data-column="customer"][data-hidden]')).toHaveLength(1);
  });

  it('keeps a required column and the last shown column ticked and disabled', () => {
    inline({
      defaultColumnState: { hidden: ['customer', 'status', 'due', 'region', 'notes'] },
      columns: COLUMNS.map((column) =>
        column.id === 'order' ? { ...column, hideable: true } : column,
      ),
    });
    expect(box('order')).toBeChecked();
    expect(box('order')).toBeDisabled();
    cleanupAll();

    inline();
    expect(box('order')).toBeDisabled();
    expect(item('order')).toHaveAttribute('data-locked');
    expect(within(item('order')).getByText('Required')).toHaveAttribute('data-part', 'status');
    expect(box('customer')).not.toBeDisabled();
  });

  it('filters by label and description without case or accents, and disables every handle', () => {
    inline();
    const search = screen.getByRole('searchbox', { name: 'Search columns' });
    fireEvent.change(search, { target: { value: 'REGIAO' } });
    expect(item('region')).not.toBeNull();
    expect(document.querySelectorAll('[data-part="item"]')).toHaveLength(1);
    expect(handle('region')).toHaveAttribute('aria-disabled', 'true');

    fireEvent.change(search, { target: { value: 'promised' } });
    expect(document.querySelectorAll('[data-part="item"]')).toHaveLength(1);
    expect(item('due')).not.toBeNull();

    fireEvent.change(search, { target: { value: 'margin' } });
    expect(document.querySelector('[data-part="empty"]')).toHaveTextContent('No columns match');
  });

  it('moves a column one place in its zone on Alt+ArrowDown, announces it and keeps focus', async () => {
    const { onColumnStateChange } = inline();
    handle('customer').focus();
    fireEvent.keyDown(handle('customer'), { key: 'ArrowDown', altKey: true });
    expect(onColumnStateChange).toHaveBeenCalledTimes(1);
    const [state, request] = onColumnStateChange.mock.calls[0]!;
    expect(request.change).toBe('order');
    expect(request.reason).toBe('keyboard');
    expect(state.order.indexOf('status')).toBeLessThan(state.order.indexOf('customer'));
    expect(state.order[0]).toBe('order');
    await waitFor(() =>
      expect(document.body.textContent).toContain('Customer moved to position 2'),
    );
    expect(document.activeElement).toBe(handle('customer'));
  });

  it('says where a pointer drop landed, in the words of the drag catalog', async () => {
    const { onColumnStateChange } = inline();
    const section = document.querySelector<HTMLElement>(
      '[data-part="section"][data-zone="middle"]',
    )!;
    const box = (top: number, height: number) =>
      ({
        top,
        bottom: top + height,
        left: 0,
        right: 300,
        width: 300,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
    const items = [...section.querySelectorAll<HTMLElement>('[data-part="item"]')];
    items.forEach((node, index) => {
      node.getBoundingClientRect = () => box(100 + index * 30, 30);
    });
    section.getBoundingClientRect = () => box(100, items.length * 30);
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
      handle('customer').dispatchEvent(press('pointerdown', 115));
      document.dispatchEvent(press('pointermove', 140));
      document.dispatchEvent(press('pointermove', 170));
      document.dispatchEvent(press('pointerup', 170));
    });
    expect(lastRequest(onColumnStateChange).reason).toBe('pointer');
    await waitFor(() =>
      expect(document.body.textContent).toMatch(/Customer dropped, position 2 of \d+\./),
    );
  });

  it('never moves a column out of its zone, and moves nothing while searching', () => {
    const { onColumnStateChange } = inline();
    fireEvent.keyDown(handle('order'), { key: 'ArrowDown', altKey: true });
    expect(onColumnStateChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'status' } });
    fireEvent.keyDown(handle('status'), { key: 'ArrowUp', altKey: true });
    expect(onColumnStateChange).not.toHaveBeenCalled();
  });

  it('pins a column from the pin menu, which moves it to its new section', async () => {
    const { onColumnStateChange } = inline();
    const pin = item('due').querySelector<HTMLButtonElement>('[data-part="pin"]')!;
    expect(pin).toHaveAccessibleName('Pin Due date');
    fireEvent.click(pin);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin to end' }));
    const request = lastRequest(onColumnStateChange);
    expect(request.change).toBe('pinned');
    expect(request.value.pinned.end).toEqual(['due']);
    expect(item('due').closest('[data-part="section"]')).toHaveAttribute('data-zone', 'end');
  });

  it('shows every column, and restores the defaults with the reason clear', () => {
    const { onColumnStateChange } = inline({
      defaultColumnState: { ...DEFAULTS },
      columnState: normalize({ hidden: ['notes', 'customer', 'status'] }),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }), { detail: 1 });
    expect(lastRequest(onColumnStateChange).value.hidden).toEqual([]);
    expect(lastRequest(onColumnStateChange).reason).toBe('pointer');

    fireEvent.click(screen.getByRole('button', { name: 'Restore defaults' }));
    const request = lastRequest(onColumnStateChange);
    expect(request.reason).toBe('clear');
    expect(request.value).toEqual(normalize(DEFAULTS));
  });

  it('drafts under confirm and asks once with the reason submit; Cancel discards', () => {
    const { onColumnStateChange } = inline({ apply: 'confirm' });
    fireEvent.click(box('customer'));
    fireEvent.click(box('status'));
    expect(onColumnStateChange).not.toHaveBeenCalled();
    expect(item('customer')).toHaveAttribute('data-hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onColumnStateChange).toHaveBeenCalledTimes(1);
    const [state, request] = onColumnStateChange.mock.calls[0]!;
    expect(request.reason).toBe('submit');
    expect(state.hidden).toEqual(['notes', 'customer', 'status']);

    fireEvent.click(box('due'));
    expect(item('due')).toHaveAttribute('data-hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(item('due')).not.toHaveAttribute('data-hidden');
    expect(onColumnStateChange).toHaveBeenCalledTimes(1);
  });

  it('lists a column the grid hid for room with its status and the reader’s value', () => {
    inline({ outOfSpace: { popin: [], hidden: ['region'] } });
    expect(item('region')).toHaveAttribute('data-space-hidden');
    expect(box('region')).toBeChecked();
    // language: pt-BR
    expect(box('region')).toHaveAccessibleName('Região Hidden for space');
    // language: en-US
  });

  it('lists a column the grid moved into its rows as shown there', () => {
    inline({ outOfSpace: { popin: ['due'], hidden: ['region'] } });
    expect(item('due')).not.toHaveAttribute('data-space-hidden');
    expect(box('due')).toBeChecked();
    expect(box('due')).toHaveAccessibleName('Due date Shown in row');
    // language: pt-BR
    expect(box('region')).toHaveAccessibleName('Região Hidden for space');
    // language: en-US
  });

  it('describes a column by its description', () => {
    inline();
    expect(box('status')).toHaveAccessibleDescription('Fulfilment stage, from Draft to Delivered');
  });

  it('speaks the language in force', () => {
    render(
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <ColumnManager columns={COLUMNS} defaultColumnState={DEFAULTS} presentation="inline" />
      </SlottedProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Colunas' })).toBeInTheDocument();
    // language: pt-BR
    expect(screen.getByRole('group', { name: 'Fixadas no início' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostrar todas' })).toBeInTheDocument();
    expect(screen.getByText('5 de 6 visíveis')).toBeInTheDocument();
    // language: en-US
  });

  it('lays its own messages over the catalog', () => {
    inline({ messages: { showAll: 'Reveal all' } });
    expect(screen.getByRole('button', { name: 'Reveal all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore defaults' })).toBeInTheDocument();
  });
});

describe('ColumnManager layers and trigger', () => {
  function Wired({ presentation }: { presentation: 'popover' | 'drawer' }) {
    const ref = useRef<ColumnManagerHandle>(null);
    const [state, setState] = useState(normalize(DEFAULTS));
    return (
      <>
        <ColumnManagerTrigger manager={ref}>Columns</ColumnManagerTrigger>
        <ColumnManager
          columnState={state}
          columns={COLUMNS}
          onColumnStateChange={(next) => setState(next)}
          presentation={presentation}
          ref={ref}
        />
      </>
    );
  }

  it('renders the popover layer on the trigger, with the count in its name', async () => {
    render(<Wired presentation="popover" />);
    const trigger = await screen.findByRole('button', { name: 'Columns 1 hidden column' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('[data-part="count"]')).toHaveTextContent('1');
    expect(trigger.querySelector('[data-part="count"]')).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    const root = document.querySelector('[data-ui="column-manager"]')!;
    expect(root.closest('[data-ui="popover"]')).not.toBeNull();
    expect(trigger).toHaveAttribute('aria-controls', root.id);

    fireEvent.click(box('customer'));
    await waitFor(() => expect(trigger).toHaveAccessibleName('Columns 2 hidden columns'));
  });

  it('renders the drawer layer under presentation drawer, and the handle opens it', async () => {
    const ref = { current: null as ColumnManagerHandle | null };
    render(<ColumnManager columns={COLUMNS} presentation="drawer" ref={ref} />);
    expect(document.querySelector('[data-ui="column-manager"]')).toBeNull();
    act(() => ref.current!.show());
    await waitFor(() =>
      expect(
        document.querySelector('[data-ui="column-manager"]')?.closest('[data-ui="drawer"]'),
      ).not.toBeNull(),
    );
  });

  it('asks to open with a reason and waits when open is controlled', () => {
    const onOpenChange = vi.fn();
    const ref = { current: null as ColumnManagerHandle | null };
    render(<ColumnManager columns={COLUMNS} onOpenChange={onOpenChange} open={false} ref={ref} />);
    act(() => ref.current!.show());
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'programmatic' }),
    );
    expect(document.querySelector('[data-ui="column-manager"]')).toBeNull();
  });
});

import { normalizeColumnState } from '@slotted/core/grid';
import { cleanup } from '@testing-library/react';

function normalize(state: Partial<GridColumnState>): GridColumnState {
  return normalizeColumnState(state, COLUMNS);
}

function cleanupAll() {
  cleanup();
}
