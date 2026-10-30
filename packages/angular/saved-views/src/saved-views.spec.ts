import { Component, Injector, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import type { ComponentFixture } from '@angular/core/testing';
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
import type { ChangeRequest } from '@slotted/core/state';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { persistedSavedViews } from './persisted-saved-views';
import { SlSavedViews } from './saved-views';
import type { SavedViewApply, SavedViewsRequest } from './saved-views-defaults';

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

@Component({
  standalone: true,
  imports: [SlSavedViews],
  template: `<sl-saved-views
    #views="slSavedViews"
    [current]="current()"
    [builtIn]="builtIn()"
    [defaultState]="initial()"
    [messages]="messages()"
    (stateChangeRequest)="onState($event)"
    (viewApply)="applied.push($event)"
    (openChangeRequest)="opens.push($event)"
  />`,
})
class Host {
  readonly current = signal<GridView>(LATE);
  readonly initial = signal<SavedViewsState>(STATE);
  readonly messages = signal<Record<string, string> | undefined>(undefined);
  readonly builtIn = signal<GridView>(BUILT_IN);
  readonly views = viewChild.required<SlSavedViews>('views');
  readonly requests: SavedViewsRequest[] = [];
  readonly applied: SavedViewApply[] = [];
  readonly opens: ChangeRequest<boolean>[] = [];
  refuse = false;

  onState(request: SavedViewsRequest) {
    this.requests.push(request);
    if (this.refuse) request.cancel();
  }
}

const root = () => document.querySelector<HTMLElement>("sl-saved-views[data-ui='saved-views']")!;
const trigger = () => root().querySelector<HTMLButtonElement>("[data-part='trigger']")!;
const panel = () => document.querySelector<HTMLElement>("[data-part='panel']")!;
const item = (name: string) =>
  [...panel().querySelectorAll<HTMLElement>("[data-part='item']")].find((node) =>
    node.querySelector('[data-label]')?.textContent?.trim().startsWith(name),
  )!;
const button = (scope: ParentNode, text: string) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (node) => node.textContent?.trim() === text,
  )!;
const glyphs = (host: Element | null) =>
  [...(host?.querySelectorAll("[data-ui='icon'] > svg[data-glyph]") ?? [])].map((svg) =>
    svg.getAttribute('data-glyph'),
  );
const menuItem = (text: string) =>
  [...document.querySelectorAll<HTMLElement>("[role='menuitem']")].find(
    (node) => node.textContent?.trim() === text,
  )!;

function click(element: HTMLElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

describe('SlSavedViews', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  async function mount(providers: unknown[] = []) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: providers as never[],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  }

  async function openPanel() {
    click(trigger());
    await settle();
  }

  async function type(value: string) {
    const input = panel().querySelector<HTMLInputElement>('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  }

  async function submit() {
    const form = panel().querySelector<HTMLFormElement>("form[data-part='form']")!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();
  }

  beforeEach(async () => {
    await mount();
  });

  afterEach(() => fixture?.destroy());

  it('renders the contract identity, the group and the view in use', () => {
    expect(root().getAttribute('data-part')).toBe('root');
    expect(root().getAttribute('role')).toBe('group');
    expect(root().getAttribute('aria-label')).toBe('Views');
    expect(trigger().textContent).toContain('Late orders');
    expect(root().hasAttribute('data-modified')).toBe(false);
  });

  it('does not call a page turn a modification', async () => {
    const paged = (index: number): GridView => ({
      ...BUILT_IN,
      query: { ...BUILT_IN.query, page: { index, size: 25 } },
    });
    host.views().apply(null);
    host.builtIn.set(paged(0));
    host.current.set(paged(4));
    await settle();
    expect(trigger().textContent).toContain('Default');
    expect(root().hasAttribute('data-modified')).toBe(false);
  });

  it('marks a modified view and reverts it to the view in use', async () => {
    host.current.set(withSearch('late shipments'));
    await settle();
    expect(root().hasAttribute('data-modified')).toBe(true);
    expect(trigger().textContent).toContain('Modified');
    click(root().querySelector<HTMLButtonElement>("[data-part='revert']")!);
    await settle();
    expect(host.applied).toHaveLength(1);
    expect(serializeGridView(host.applied[0]!.view)).toBe(serializeGridView(LATE));
    expect(host.applied[0]!.request.action).toBe('revert');
    expect(host.requests).toHaveLength(0);
  });

  it('applies a view: asks for the state, emits the parsed view and closes', async () => {
    await openPanel();
    expect(root().hasAttribute('data-open')).toBe(true);
    click(item('My region').querySelector<HTMLButtonElement>("[data-part='apply']")!);
    await settle();
    expect(host.requests[0]).toMatchObject({ action: 'apply', reason: 'pointer' });
    expect(host.requests[0]!.value.activeId).toBe('region');
    expect(host.applied[0]!.view.query.search).toBe('midwest');
    expect(host.applied[0]!.view.density).toBe('compact');
    expect(root().hasAttribute('data-open')).toBe(false);
    expect(trigger().textContent).toContain('My region');
  });

  it('applies the built-in view as the builtIn input, and refuses a cancelled request', async () => {
    await openPanel();
    click(item('Default').querySelector<HTMLButtonElement>("[data-part='apply']")!);
    await settle();
    expect(host.applied[0]!.view).toBe(BUILT_IN);
    host.refuse = true;
    await openPanel();
    click(item('High value').querySelector<HTMLButtonElement>("[data-part='apply']")!);
    await settle();
    expect(host.applied).toHaveLength(1);
  });

  it('disables Save on the built-in view and on an unmodified view', async () => {
    await openPanel();
    expect(button(panel(), 'Save').disabled).toBe(true);
    fixture.destroy();
    await mount();
    host.initial.set({ ...STATE, activeId: null });
    host.current.set(withSearch('x'));
    await settle();
    await openPanel();
    expect(button(panel(), 'Save').disabled).toBe(true);
  });

  it('saves the current view over the view in use', async () => {
    const current = withSearch('late shipments');
    host.current.set(current);
    await settle();
    await openPanel();
    click(button(panel(), 'Save'));
    await settle();
    expect(host.requests[0]!.action).toBe('save');
    expect(host.requests[0]!.value.views[0]!.view).toBe(serializeGridView(current));
    expect(root().hasAttribute('data-modified')).toBe(false);
  });

  it('creates a view from the current one, and refuses an empty and a duplicate name', async () => {
    const current = withSearch('over 10k', 'dense');
    host.current.set(current);
    await settle();
    await openPanel();
    click(button(panel(), 'Save as new view…'));
    await settle();
    await submit();
    expect(panel().textContent).toContain('Enter a name for the view');
    expect(panel().querySelector("[data-ui='field']")?.hasAttribute('data-invalid')).toBe(true);
    await type('my REGION');
    await submit();
    expect(panel().textContent).toContain('A view with this name already exists');
    expect(host.requests).toHaveLength(0);
    await type('  Big accounts ');
    await submit();
    const created = host.requests[0]!.value.views.at(-1)!;
    expect(host.requests[0]).toMatchObject({ action: 'create', reason: 'submit' });
    expect(created.name).toBe('Big accounts');
    expect(created.view).toBe(serializeGridView(current));
    expect(host.requests[0]!.value.activeId).toBe(created.id);
    expect(trigger().textContent).toContain('Big accounts');
  });

  it('renames a view in its row', async () => {
    await openPanel();
    click(item('My region').querySelector<HTMLButtonElement>("[data-part='actions']")!);
    await settle();
    click(menuItem('Rename'));
    await settle();
    expect(panel().querySelector<HTMLInputElement>('input')!.value).toBe('My region');
    await type('Midwest region');
    await submit();
    expect(host.requests[0]).toMatchObject({ action: 'rename', reason: 'submit' });
    expect(host.requests[0]!.value.views[1]!.name).toBe('Midwest region');
  });

  it('offers only Set as default on the built-in view', async () => {
    await openPanel();
    click(item('Default').querySelector<HTMLButtonElement>("[data-part='actions']")!);
    await settle();
    expect(
      [...document.querySelectorAll("[role='menuitem']")].map((node) => node.textContent?.trim()),
    ).toEqual(['Set as default']);
  });

  it('deletes after a confirmation, falling back to the built-in view', async () => {
    await openPanel();
    click(item('Late orders').querySelector<HTMLButtonElement>("[data-part='actions']")!);
    await settle();
    click(menuItem('Delete'));
    await settle();
    const confirm = panel().querySelector<HTMLElement>("[data-part='confirm']")!;
    expect(confirm.textContent).toContain('Delete “Late orders”?');
    expect(host.requests).toHaveLength(0);
    click(button(confirm, 'Delete'));
    await settle();
    expect(host.requests[0]).toMatchObject({ action: 'delete', reason: 'remove' });
    expect(host.requests[0]!.value.activeId).toBeNull();
    expect(trigger().textContent).toContain('Default');
  });

  it('sets the default view and marks it', async () => {
    await openPanel();
    click(item('High value').querySelector<HTMLButtonElement>("[data-part='actions']")!);
    await settle();
    click(menuItem('Set as default'));
    await settle();
    expect(host.requests[0]!.action).toBe('default');
    expect(host.requests[0]!.value.defaultId).toBe('high');
    expect(item('High value').hasAttribute('data-default')).toBe(true);
    expect(item('High value').querySelector("[data-part='default-mark']")?.textContent).toContain(
      'default',
    );
    expect(glyphs(item('High value').querySelector("[data-part='default-mark']"))).toEqual(['pin']);
  });

  /* No stylesheet paints a glyph: each one is an `icon` holding the library's `Glyph`. */
  it('draws its glyphs as elements, the check on the view in use alone', async () => {
    host.current.set(withSearch('late shipments'));
    await settle();
    expect(glyphs(trigger())).toEqual(['chevron-down']);
    const revert = root().querySelector("[data-part='revert']");
    expect(glyphs(revert)).toEqual(['rotate-ccw']);
    /* An arrow that turns back turns the other way in a right-to-left document. */
    expect(revert!.querySelector("[data-ui='icon']")!.hasAttribute('data-directional')).toBe(true);
    await openPanel();
    const apply = (name: string) => item(name).querySelector("[data-part='apply']");
    expect(glyphs(apply('Late orders'))).toEqual(['check']);
    expect(glyphs(apply('My region'))).toEqual([]);
    expect(glyphs(item('My region').querySelector("[data-part='actions']"))).toEqual(['ellipsis']);
  });

  it('cancels the form on Escape and keeps the layer open', async () => {
    host.current.set(withSearch('x'));
    await settle();
    await openPanel();
    click(button(panel(), 'Save as new view…'));
    await settle();
    const input = panel().querySelector<HTMLInputElement>('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    await settle();
    expect(panel().querySelector('input')).toBeNull();
    expect(root().hasAttribute('data-open')).toBe(true);
    button(panel(), 'Save as new view…').dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
    );
    await settle();
    expect(root().hasAttribute('data-open')).toBe(false);
    expect(host.opens.at(-1)).toMatchObject({ value: false, reason: 'escape' });
  });

  it('speaks the language in force, follows a change of it in place, and the instance wins', async () => {
    fixture.destroy();
    const locale = signal('pt-BR');
    await mount([provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })]);
    host.initial.set({ ...STATE, activeId: null });
    host.current.set(withSearch('x'));
    host.messages.set({ revert: 'Desfazer' });
    await settle();
    // language: pt-BR
    expect(root().getAttribute('aria-label')).toBe('Visualizações');
    expect(trigger().textContent).toContain('Padrão');
    // language: en-US
    expect(root().querySelector("[data-part='revert']")?.textContent?.trim()).toBe('Desfazer');

    locale.set('en-US');
    await settle();
    expect(root().getAttribute('aria-label')).toBe('Views');
  });
});

describe('persistedSavedViews', () => {
  function memory(initial: Record<string, string> = {}) {
    const data: Record<string, string> = { ...initial };
    const store: GridViewStorage = {
      getItem: (key) => data[key] ?? null,
      setItem: (key, value) => void (data[key] = value),
      removeItem: (key) => void delete data[key],
    };
    return { data, store };
  }

  it('reads once, and writes after every change', () => {
    const { data, store } = memory({ orders: serializeSavedViews(STATE) });
    const injector = TestBed.inject(Injector);
    const views = persistedSavedViews({ key: 'orders', storage: store, injector });
    expect(views.state()).toEqual(STATE);
    expect(views.openedDefault).toBeNull();
    TestBed.tick();
    views.state.set({ ...STATE, defaultId: 'region' });
    TestBed.tick();
    expect(parseSavedViews(data['orders']).defaultId).toBe('region');
  });

  it('opens the visit on the default view when none is in use', () => {
    const { store } = memory({
      orders: serializeSavedViews({ ...STATE, activeId: null, defaultId: 'region' }),
    });
    const views = persistedSavedViews({
      key: 'orders',
      storage: store,
      injector: TestBed.inject(Injector),
    });
    expect(views.state().activeId).toBe('region');
    expect(views.openedDefault?.query.search).toBe('midwest');
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
    const views = persistedSavedViews({
      key: 'orders',
      storage: throwing,
      injector: TestBed.inject(Injector),
    });
    expect(views.state().views).toEqual([]);
    TestBed.tick();
    views.state.set(STATE);
    expect(() => TestBed.tick()).not.toThrow();
    expect(views.state()).toEqual(STATE);
  });
});
