import {
  emptyGridView,
  parseSavedViews,
  serializeGridView,
  serializeSavedViews,
  type GridView,
  type GridViewStorage,
  type SavedViewsState,
} from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SlottedProvider } from '../i18n';
import { SavedViews } from './saved-views';
import type { SavedViewsProps, SavedViewsRequest } from './saved-views.types';
import { usePersistedSavedViews } from './use-persisted-saved-views';

const BUILT_IN: GridView = emptyGridView();
const withSearch = (search: string, density: GridView['density'] = null): GridView => ({
  ...BUILT_IN,
  query: { ...BUILT_IN.query, search },
  density,
});
const LATE = withSearch('late');
const REGION = withSearch('midwest', 'compact');

const STATE: SavedViewsState = {
  views: [
    { id: 'late', name: 'Late orders', view: serializeGridView(LATE) },
    { id: 'region', name: 'My region', view: serializeGridView(REGION) },
    { id: 'high', name: 'High value', view: serializeGridView(withSearch('10000')) },
  ],
  defaultId: null,
  activeId: 'late',
};

function Harness(props: Partial<SavedViewsProps>) {
  return <SavedViews builtIn={BUILT_IN} current={LATE} defaultState={STATE} {...props} />;
}

const root = () =>
  document.querySelector<HTMLElement>('[data-ui="saved-views"][data-part="root"]')!;
const trigger = () => root().querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
const panel = () => document.querySelector<HTMLElement>('[data-part="panel"]')!;
const item = (name: string) =>
  [...panel().querySelectorAll<HTMLElement>('[data-part="item"]')].find((node) =>
    node.textContent?.includes(name),
  )!;
const openPanel = () => fireEvent.click(trigger());
const lastRequest = (mock: ReturnType<typeof vi.fn>) =>
  mock.mock.calls.at(-1)?.[1] as SavedViewsRequest;

describe('SavedViews', () => {
  it('renders the contract identity, the group and the view in use', () => {
    render(<Harness />);
    expect(root()).toHaveAttribute('role', 'group');
    expect(root()).toHaveAttribute('aria-label', 'Views');
    expect(trigger()).toHaveTextContent('Late orders');
    expect(root()).not.toHaveAttribute('data-modified');
    expect(root().querySelector('[data-part="revert"]')).toBeNull();
  });

  it('marks a modified view and reverts it to the view in use', () => {
    const onViewApply = vi.fn();
    render(<Harness current={withSearch('late shipments')} onViewApply={onViewApply} />);
    expect(root()).toHaveAttribute('data-modified');
    expect(trigger()).toHaveTextContent('Modified');
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }), { detail: 1 });
    expect(onViewApply).toHaveBeenCalledTimes(1);
    const [view, request] = onViewApply.mock.calls[0] as [GridView, SavedViewsRequest];
    expect(serializeGridView(view)).toBe(serializeGridView(LATE));
    expect(request.action).toBe('revert');
    expect(request.reason).toBe('pointer');
  });

  it('does not call a page turn a modification', () => {
    const paged = (index: number): GridView => ({
      ...BUILT_IN,
      query: { ...BUILT_IN.query, page: { index, size: 25 } },
    });
    render(
      <Harness builtIn={paged(0)} current={paged(4)} defaultState={{ ...STATE, activeId: null }} />,
    );
    expect(root()).not.toHaveAttribute('data-modified');
  });

  it('names the built-in view when none is active, and compares against it', () => {
    render(<Harness current={BUILT_IN} defaultState={{ ...STATE, activeId: null }} />);
    expect(trigger()).toHaveTextContent('Default');
    expect(root()).not.toHaveAttribute('data-modified');
  });

  it('applies a view: asks for the state, emits the parsed view and closes', () => {
    const onStateChange = vi.fn();
    const onViewApply = vi.fn();
    render(<Harness onStateChange={onStateChange} onViewApply={onViewApply} />);
    openPanel();
    const apply = within(item('My region')).getByRole('button', { name: 'My region' });
    fireEvent.click(apply, { detail: 1 });
    expect(onStateChange.mock.calls[0]?.[0]).toMatchObject({ activeId: 'region' });
    expect(lastRequest(onStateChange)).toMatchObject({ action: 'apply', reason: 'pointer' });
    const view = onViewApply.mock.calls[0]?.[0] as GridView;
    expect(view.query.search).toBe('midwest');
    expect(view.density).toBe('compact');
    expect(root()).not.toHaveAttribute('data-open');
  });

  it('applies the built-in view as the builtIn input', () => {
    const onViewApply = vi.fn();
    render(<Harness onViewApply={onViewApply} />);
    openPanel();
    /* The built-in view is the default until another is chosen: the hidden word joins its name. */
    fireEvent.click(within(item('Default')).getByRole('button', { name: 'Default default' }));
    expect(onViewApply.mock.calls[0]?.[0]).toBe(BUILT_IN);
  });

  it('refuses a cancelled request and applies nothing', () => {
    const onViewApply = vi.fn();
    render(<Harness onStateChange={(_, request) => request.cancel()} onViewApply={onViewApply} />);
    openPanel();
    fireEvent.click(within(item('My region')).getByRole('button', { name: 'My region' }));
    expect(onViewApply).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent('Late orders');
  });

  it('marks the view in use with aria-current and data-current', () => {
    render(<Harness />);
    openPanel();
    expect(
      within(item('Late orders')).getByRole('button', { name: 'Late orders' }),
    ).toHaveAttribute('aria-current', 'true');
    expect(item('Late orders')).toHaveAttribute('data-current');
    expect(item('Default')).toHaveAttribute('data-built-in');
  });

  /* No stylesheet paints a glyph: each one is an `icon` holding the library's `Glyph`. */
  it('draws its glyphs as elements, the check on the view in use alone', () => {
    const glyphs = (host: Element | null) =>
      [...(host?.querySelectorAll('[data-ui="icon"] > svg[data-glyph]') ?? [])].map((svg) =>
        svg.getAttribute('data-glyph'),
      );
    render(
      <Harness
        current={withSearch('late shipments')}
        defaultState={{ ...STATE, defaultId: 'late' }}
      />,
    );
    expect(glyphs(trigger())).toEqual(['chevron-down']);
    const revert = root().querySelector('[data-part="revert"]');
    expect(glyphs(revert)).toEqual(['rotate-ccw']);
    /* An arrow that turns back turns the other way in a right-to-left document. */
    expect(revert?.querySelector('[data-ui="icon"]')).toHaveAttribute('data-directional');
    openPanel();
    const apply = (name: string) => item(name).querySelector('[data-part="apply"]');
    expect(glyphs(apply('Late orders'))).toEqual(['check', 'pin']);
    expect(glyphs(item('Late orders').querySelector('[data-part="default-mark"]'))).toEqual([
      'pin',
    ]);
    expect(glyphs(apply('My region'))).toEqual([]);
    expect(glyphs(item('My region').querySelector('[data-part="actions"]'))).toEqual(['ellipsis']);
  });

  it('disables Save on the built-in view and on an unmodified view', () => {
    const { unmount } = render(
      <Harness current={withSearch('x')} defaultState={{ ...STATE, activeId: null }} />,
    );
    openPanel();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    unmount();
    render(<Harness />);
    openPanel();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves the current view over the view in use', () => {
    const onStateChange = vi.fn();
    const current = withSearch('late shipments');
    render(<Harness current={current} onStateChange={onStateChange} />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const next = onStateChange.mock.calls[0]?.[0] as SavedViewsState;
    expect(next.views[0]?.view).toBe(serializeGridView(current));
    expect(lastRequest(onStateChange).action).toBe('save');
    expect(root()).not.toHaveAttribute('data-modified');
  });

  it('creates a view from the current one and makes it the view in use', () => {
    const onStateChange = vi.fn();
    const current = withSearch('over 10k', 'dense');
    render(<Harness current={current} onStateChange={onStateChange} />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Save as new view…' }));
    const input = screen.getByRole('textbox', { name: 'View name' });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: '  Big accounts  ' } });
    fireEvent.submit(input.closest('form')!);
    const next = onStateChange.mock.calls[0]?.[0] as SavedViewsState;
    const created = next.views.at(-1)!;
    expect(created.name).toBe('Big accounts');
    expect(created.view).toBe(serializeGridView(current));
    expect(next.activeId).toBe(created.id);
    expect(lastRequest(onStateChange)).toMatchObject({ action: 'create', reason: 'submit' });
    expect(trigger()).toHaveTextContent('Big accounts');
    expect(
      within(item('Big accounts')).getByRole('button', { name: 'Big accounts' }),
    ).toHaveFocus();
  });

  it('refuses an empty and a duplicate name with an invalid field', () => {
    const onStateChange = vi.fn();
    render(<Harness current={withSearch('x')} onStateChange={onStateChange} />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Save as new view…' }));
    const input = screen.getByRole('textbox', { name: 'View name' });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText('Enter a name for the view')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(input, { target: { value: 'my REGION' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText('A view with this name already exists')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'default' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText('A view with this name already exists')).toBeInTheDocument();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('renames a view in its row, keeping its own name allowed', () => {
    const onStateChange = vi.fn();
    render(<Harness onStateChange={onStateChange} />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for My region' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'View name' });
    expect(input).toHaveValue('My region');
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'Midwest region' } });
    fireEvent.submit(input.closest('form')!);
    expect((onStateChange.mock.calls[0]?.[0] as SavedViewsState).views[1]?.name).toBe(
      'Midwest region',
    );
    expect(lastRequest(onStateChange)).toMatchObject({ action: 'rename', reason: 'submit' });
  });

  it('offers only Set as default on the built-in view', () => {
    render(<Harness />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Default' }));
    expect(screen.getAllByRole('menuitem').map((node) => node.textContent)).toEqual([
      'Set as default',
    ]);
  });

  it('deletes after a confirmation naming the view, falling back to the built-in view', () => {
    const onStateChange = vi.fn();
    render(<Harness onStateChange={onStateChange} />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Late orders' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const confirm = within(item('Late orders')).getByRole('group');
    expect(confirm).toHaveTextContent('Delete “Late orders”?');
    expect(onStateChange).not.toHaveBeenCalled();
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    const next = onStateChange.mock.calls[0]?.[0] as SavedViewsState;
    expect(next.views.map((view) => view.id)).toEqual(['region', 'high']);
    expect(next.activeId).toBeNull();
    expect(lastRequest(onStateChange)).toMatchObject({ action: 'delete', reason: 'remove' });
    expect(trigger()).toHaveTextContent('Default');
  });

  it('sets the default view and marks it', () => {
    const onStateChange = vi.fn();
    render(<Harness onStateChange={onStateChange} />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for High value' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Set as default' }));
    expect((onStateChange.mock.calls[0]?.[0] as SavedViewsState).defaultId).toBe('high');
    expect(lastRequest(onStateChange).action).toBe('default');
    expect(item('High value')).toHaveAttribute('data-default');
    expect(item('High value').querySelector('[data-part="default-mark"]')).toHaveTextContent(
      'default',
    );
  });

  it('cancels the form on Escape and keeps the layer open', () => {
    const onOpenChange = vi.fn();
    render(<Harness current={withSearch('x')} onOpenChange={onOpenChange} />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Save as new view…' }));
    const input = screen.getByRole('textbox', { name: 'View name' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'View name' })).toBeNull();
    expect(root()).toHaveAttribute('data-open');
    expect(screen.getByRole('button', { name: 'Save as new view…' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Save as new view…' }), {
      key: 'Escape',
    });
    expect(root()).not.toHaveAttribute('data-open');
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'escape' }),
    );
  });

  it('holds a controlled state until the consumer answers', () => {
    function Controlled() {
      const [state, setState] = useState(STATE);
      return (
        <SavedViews
          builtIn={BUILT_IN}
          current={LATE}
          onStateChange={(next, request) => {
            if (request.action !== 'delete') setState(next);
          }}
          state={state}
        />
      );
    }
    render(<Controlled />);
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for High value' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    fireEvent.click(within(item('High value')).getByRole('button', { name: 'Delete' }));
    expect(item('High value')).toBeDefined();
  });

  it('speaks the language in force, and the instance’s messages win', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Harness
          current={withSearch('x')}
          defaultState={{ ...STATE, activeId: null }}
          messages={{ revert: 'Desfazer' }}
        />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(root()).toHaveAttribute('aria-label', 'Visualizações');
    expect(trigger()).toHaveTextContent('Padrão');
    // language: en-US
    expect(screen.getByRole('button', { name: 'Desfazer' })).toBeInTheDocument();
  });

  it('applies by id through the handle, with the reason programmatic', () => {
    const onStateChange = vi.fn();
    let handle: import('./saved-views.types').SavedViewsHandle | null = null;
    render(<Harness onStateChange={onStateChange} ref={(value) => void (handle = value)} />);
    act(() => handle!.apply('high'));
    expect(lastRequest(onStateChange)).toMatchObject({ action: 'apply', reason: 'programmatic' });
    expect(handle!.element).toBe(root());
  });
});

describe('usePersistedSavedViews', () => {
  function memory(initial: Record<string, string> = {}): GridViewStorage & {
    data: Record<string, string>;
  } {
    const data = { ...initial };
    return {
      data,
      getItem: (key) => data[key] ?? null,
      setItem: (key, value) => void (data[key] = value),
      removeItem: (key) => void delete data[key],
    };
  }

  it('reads once, and writes after every change', () => {
    const store = memory({ orders: serializeSavedViews(STATE) });
    const { result } = renderHook(() => usePersistedSavedViews({ key: 'orders', storage: store }));
    expect(result.current.state).toEqual(STATE);
    expect(result.current.openedDefault).toBeNull();
    act(() => result.current.onStateChange({ ...STATE, defaultId: 'region' }));
    expect(parseSavedViews(store.data['orders']).defaultId).toBe('region');
  });

  it('opens the visit on the default view when none is in use', () => {
    const store = memory({
      orders: serializeSavedViews({ ...STATE, activeId: null, defaultId: 'region' }),
    });
    const { result } = renderHook(() => usePersistedSavedViews({ key: 'orders', storage: store }));
    expect(result.current.state.activeId).toBe('region');
    expect(result.current.openedDefault?.query.search).toBe('midwest');
  });

  it('keeps the views in memory when the store throws', () => {
    const throwing: GridViewStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {},
    };
    const { result } = renderHook(() =>
      usePersistedSavedViews({ key: 'orders', storage: throwing }),
    );
    expect(result.current.state.views).toEqual([]);
    act(() => result.current.onStateChange(STATE));
    expect(result.current.state).toEqual(STATE);
  });
});
