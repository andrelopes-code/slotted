import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import type { GridColumn, GridColumnState, GridOutOfSpace } from '@slotted/core/grid';
import { normalizeColumnState } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import { SlColumnManager, SlColumnManagerTrigger } from './column-manager';
import {
  type ColumnManagerApply,
  type ColumnManagerPresentation,
  type ColumnManagerRequest,
} from './column-manager-defaults';

const COLUMNS: GridColumn<never>[] = [
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

const normalize = (state: Partial<GridColumnState>) => normalizeColumnState(state, COLUMNS);

@Component({
  standalone: true,
  imports: [SlColumnManager, SlColumnManagerTrigger, SlButton],
  template: `
    <button slButton slColumnManagerTrigger [slColumnManagerTriggerFor]="manager" type="button">
      Columns
    </button>
    <sl-column-manager
      #manager="slColumnManager"
      [columns]="columns"
      [defaultColumnState]="defaults"
      [outOfSpace]="outOfSpace()"
      [presentation]="presentation()"
      [apply]="apply()"
      (columnStateChangeRequest)="onRequest($event)"
    />
  `,
})
class Host {
  readonly columns = COLUMNS;
  readonly defaults = DEFAULTS;
  readonly presentation = signal<ColumnManagerPresentation>('inline');
  readonly apply = signal<ColumnManagerApply>('live');
  readonly outOfSpace = signal<GridOutOfSpace>({ popin: [], hidden: [] });
  readonly requests: ColumnManagerRequest[] = [];
  readonly cancelNext = signal(false);
  readonly manager = viewChild.required<SlColumnManager>('manager');

  onRequest(request: ColumnManagerRequest) {
    this.requests.push(request);
    if (this.cancelNext()) request.cancel();
  }
}

async function setup(configure?: (host: Host) => void): Promise<ComponentFixture<Host>> {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

const item = (id: string) =>
  document.querySelector<HTMLElement>(`[data-part="item"][data-column="${id}"]`)!;
const box = (id: string) => item(id).querySelector<HTMLInputElement>('input[type="checkbox"]')!;
const handle = (id: string) => item(id).querySelector<HTMLButtonElement>('[data-part="handle"]')!;
const button = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) => candidate.textContent?.trim() === name,
  )!;

async function settle(fixture: ComponentFixture<Host>) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('SlColumnManager', () => {
  /* No stylesheet paints a glyph: each one is an `icon` holding the library's `Glyph`. */
  it('draws the magnifier, and a grip and a pin on every row, as glyph elements', async () => {
    await setup();
    const glyph = (host: Element | null) =>
      host?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
    expect(glyph(document.querySelector('[data-part="search"]'))).toBe('search');
    for (const id of ['order', 'customer', 'notes']) {
      expect(glyph(handle(id))).toBe('grip-vertical');
      expect(glyph(item(id).querySelector('[data-part="pin"]'))).toBe('pin');
    }
    /* A pinned column's pin is the same glyph; the accent ink is the stylesheet's. */
    expect(item('order').querySelector('[data-part="pin"]')!.hasAttribute('data-pinned')).toBe(
      true,
    );
  });

  it('asks to hide a column with the change hidden and the reason of the press', async () => {
    const fixture = await setup();
    box('customer').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle(fixture);
    const request = fixture.componentInstance.requests[0]!;
    expect(request.change).toBe('hidden');
    expect(request.changes).toEqual(['hidden']);
    expect(request.reason).toBe('pointer');
    expect(request.value.hidden).toEqual(['notes', 'customer']);
    expect(item('customer').hasAttribute('data-hidden')).toBe(true);
  });

  it('keeps the state when the consumer cancels the request', async () => {
    const fixture = await setup((host) => host.cancelNext.set(true));
    box('customer').click();
    await settle(fixture);
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(item('customer').hasAttribute('data-hidden')).toBe(false);
  });

  it('keeps a required column and the last shown column ticked and disabled', async () => {
    const fixture = await setup();
    expect(box('order').checked).toBe(true);
    expect(box('order').disabled).toBe(true);
    expect(item('order').hasAttribute('data-locked')).toBe(true);
    expect(item('order').querySelector('[data-part="status"]')?.textContent).toBe('Required');
    for (const id of ['customer', 'status', 'due', 'region']) {
      box(id).click();
      await settle(fixture);
    }
    expect(box('order').disabled).toBe(true);
    expect(fixture.componentInstance.requests.at(-1)!.value.hidden).not.toContain('order');
  });

  it('disables the last shown column when every other is hidden', async () => {
    const fixture = await setup();
    fixture.componentInstance
      .manager()
      .columnState.set(normalize({ hidden: ['customer', 'status', 'due', 'region', 'notes'] }));
    await settle(fixture);
    expect(box('order').disabled).toBe(true);
    expect(box('customer').disabled).toBe(false);
  });

  it('filters by label and description without case or accents, and disables the handles', async () => {
    const fixture = await setup();
    fixture.componentInstance.manager().query.set('REGIAO');
    await settle(fixture);
    expect(document.querySelectorAll('[data-part="item"]')).toHaveLength(1);
    expect(handle('region').getAttribute('aria-disabled')).toBe('true');
    fixture.componentInstance.manager().query.set('promised');
    await settle(fixture);
    expect(document.querySelectorAll('[data-part="item"]')).toHaveLength(1);
    expect(item('due')).not.toBeNull();
    fixture.componentInstance.manager().query.set('margin');
    await settle(fixture);
    expect(document.querySelector('[data-part="empty"]')?.textContent).toContain(
      'No columns match',
    );
  });

  it('moves a column in its zone on Alt+ArrowDown, announces it and keeps focus', async () => {
    const fixture = await setup();
    handle('customer').focus();
    handle('customer').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
    );
    await settle(fixture);
    const request = fixture.componentInstance.requests[0]!;
    expect(request.change).toBe('order');
    expect(request.reason).toBe('keyboard');
    expect(request.value.order.indexOf('status')).toBeLessThan(
      request.value.order.indexOf('customer'),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(document.body.textContent).toContain('Customer moved to position 2');
    expect(document.activeElement).toBe(handle('customer'));
  });

  it('says where a pointer drop landed, in the words of the drag catalog', async () => {
    const fixture = await setup();
    const section = document.querySelector<HTMLElement>(
      '[data-part="section"][data-zone="middle"]',
    )!;
    const rect = (top: number, height: number) =>
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
      node.getBoundingClientRect = () => rect(100 + index * 30, 30);
    });
    section.getBoundingClientRect = () => rect(100, items.length * 30);
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
    handle('customer').dispatchEvent(press('pointerdown', 115));
    document.dispatchEvent(press('pointermove', 140));
    document.dispatchEvent(press('pointermove', 170));
    document.dispatchEvent(press('pointerup', 170));
    await settle(fixture);
    expect(fixture.componentInstance.requests.at(-1)!.reason).toBe('pointer');
    /* The announcer writes after a pause, longer on a loaded runner: wait for the words, not a time. */
    await vi.waitFor(
      () => expect(document.body.textContent).toMatch(/Customer dropped, position 2 of \d+\./),
      { timeout: 3000 },
    );
  });

  it('never moves a column out of its zone', async () => {
    const fixture = await setup();
    handle('order').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
    );
    await settle(fixture);
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('pins a column from the pin menu, which moves it to its new section', async () => {
    const fixture = await setup();
    const pin = item('due').querySelector<HTMLButtonElement>('[data-part="pin"]')!;
    expect(pin.getAttribute('aria-label')).toBe('Pin Due date');
    pin.click();
    await settle(fixture);
    const pinEnd = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (entry) => entry.textContent?.trim() === 'Pin to end',
    )!;
    pinEnd.click();
    await settle(fixture);
    const request = fixture.componentInstance.requests.at(-1)!;
    expect(request.change).toBe('pinned');
    expect(request.value.pinned.end).toEqual(['due']);
    expect(item('due').closest('[data-part="section"]')?.getAttribute('data-zone')).toBe('end');
  });

  it('shows every column, and restores the defaults with the reason clear', async () => {
    const fixture = await setup();
    fixture.componentInstance
      .manager()
      .columnState.set(normalize({ ...DEFAULTS, hidden: ['notes', 'customer'] }));
    await settle(fixture);
    button('Show all').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await settle(fixture);
    expect(fixture.componentInstance.requests.at(-1)!.value.hidden).toEqual([]);
    button('Restore defaults').click();
    await settle(fixture);
    const request = fixture.componentInstance.requests.at(-1)!;
    expect(request.reason).toBe('clear');
    expect(request.value).toEqual(normalize(DEFAULTS));
  });

  it('drafts under confirm and asks once with the reason submit; Cancel discards', async () => {
    const fixture = await setup((host) => host.apply.set('confirm'));
    box('customer').click();
    await settle(fixture);
    box('status').click();
    await settle(fixture);
    expect(fixture.componentInstance.requests).toHaveLength(0);
    expect(item('customer').hasAttribute('data-hidden')).toBe(true);
    button('Apply').click();
    await settle(fixture);
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(fixture.componentInstance.requests[0]!.reason).toBe('submit');
    expect(fixture.componentInstance.requests[0]!.value.hidden).toEqual([
      'notes',
      'customer',
      'status',
    ]);
    box('due').click();
    await settle(fixture);
    button('Cancel').click();
    await settle(fixture);
    expect(item('due').hasAttribute('data-hidden')).toBe(false);
    expect(fixture.componentInstance.requests).toHaveLength(1);
  });

  it('lists a column the grid hid for room with its status and the reader’s value', async () => {
    await setup((host) => host.outOfSpace.set({ popin: [], hidden: ['region'] }));
    expect(item('region').hasAttribute('data-space-hidden')).toBe(true);
    expect(box('region').checked).toBe(true);
    expect(item('region').querySelector('[data-part="status"]')?.textContent).toBe(
      'Hidden for space',
    );
  });

  it('lists a column the grid moved into its rows as shown there', async () => {
    await setup((host) => host.outOfSpace.set({ popin: ['due'], hidden: ['region'] }));
    expect(item('due').hasAttribute('data-space-hidden')).toBe(false);
    expect(box('due').checked).toBe(true);
    expect(item('due').querySelector('[data-part="status"]')?.textContent).toBe('Shown in row');
    expect(item('region').querySelector('[data-part="status"]')?.textContent).toBe(
      'Hidden for space',
    );
  });

  it('renders the popover layer and wires the trigger with the count in its name', async () => {
    const fixture = await setup((host) => host.presentation.set('popover'));
    const trigger = document.querySelector<HTMLButtonElement>('[data-column-manager-trigger]')!;
    await settle(fixture);
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('data-part')).toBe('trigger');
    expect(trigger.querySelector('[data-part="count"]')?.textContent).toBe('1');
    expect(trigger.querySelector('[data-ui="visually-hidden"]')?.textContent).toBe(
      '1 hidden column',
    );
    trigger.click();
    await settle(fixture);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const root = document.querySelector('[data-ui="column-manager"]')!;
    expect(root.closest('[data-ui="popover"]')).not.toBeNull();
    expect(trigger.getAttribute('aria-controls')).toBe(root.id);
    box('customer').click();
    await settle(fixture);
    expect(trigger.querySelector('[data-ui="visually-hidden"]')?.textContent).toBe(
      '2 hidden columns',
    );
  });

  it('renders the drawer layer under presentation drawer', async () => {
    const fixture = await setup((host) => host.presentation.set('drawer'));
    expect(document.querySelector('[data-ui="column-manager"]')).toBeNull();
    fixture.componentInstance.manager().show();
    await settle(fixture);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await settle(fixture);
    expect(
      document.querySelector('[data-ui="column-manager"]')?.closest('[data-ui="drawer"]'),
    ).not.toBeNull();
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const fixture = await setup();
    await settle(fixture);
    const sentence = () =>
      document.querySelector('[data-column-manager-trigger] [data-ui="visually-hidden"]')
        ?.textContent;
    expect(button('Mostrar todas')).toBeDefined();
    expect(sentence()).toBe('1 coluna oculta');

    locale.set('en-US');
    await settle(fixture);
    expect(button('Show all')).toBeDefined();
    expect(button('Mostrar todas')).toBeUndefined();
    expect(sentence()).toBe('1 hidden column');
  });
});
