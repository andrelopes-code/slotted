import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { emptyQuery, type GridColumn, type GridQuery } from '@slotted/core/grid';
import type { DataListMessages, PartialMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/data-list/contract.json';
import { SlDataList, SlDataListFooter } from './data-list';
import {
  provideDataListDefaults,
  type DataListActivateEvent,
  type DataListExpandedRequest,
  type DataListQueryRequest,
  type DataListSelection,
  type DataListSelectionMode,
} from './data-list-defaults';
import { SlDataListCellTemplate } from './data-list-templates';

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

@Component({
  standalone: true,
  imports: [SlDataList, SlDataListCellTemplate, SlDataListFooter],
  template: `<sl-data-list
    #list="slDataList"
    label="Accounts"
    locale="en-US"
    rowKey="id"
    subtitle="email"
    trailing="balance"
    [rows]="rows()"
    [columns]="columns"
    [fields]="fields()"
    [selectionMode]="selectionMode()"
    [disabledKeys]="disabledKeys()"
    [loadingKeys]="loadingKeys()"
    [current]="current()"
    [href]="href()"
    [activatable]="activatable()"
    [loading]="loading()"
    [error]="error()"
    [hasMore]="hasMore()"
    [messages]="messages()"
    [loadingDelay]="0"
    [loadingMinDuration]="0"
    [(query)]="query"
    [(value)]="value"
    [(expanded)]="expanded"
    (queryChangeRequest)="queries.push($event)"
    (valueChangeRequest)="values.push($event)"
    (expandedChangeRequest)="expansions.push($event)"
    (activate)="activations.push($event)"
    (loadMore)="more = more + 1"
    (retry)="retries = retries + 1"
  >
    @if (strong()) {
      <ng-template slDataListCell="status" let-text="text"
        ><strong>{{ text }}!</strong></ng-template
      >
    }
    <p slDataListFooter>footer</p>
  </sl-data-list>`,
})
class Host {
  readonly list = viewChild.required<SlDataList<Account>>('list');
  readonly columns = COLUMNS;
  readonly rows = signal<readonly Account[]>(ROWS);
  readonly fields = signal<number | undefined>(undefined);
  readonly selectionMode = signal<DataListSelectionMode>('none');
  readonly disabledKeys = signal<readonly string[]>([]);
  readonly loadingKeys = signal<readonly string[]>([]);
  readonly current = signal<string | null>(null);
  readonly href = signal<((row: Account) => string) | undefined>(undefined);
  readonly activatable = signal(false);
  readonly loading = signal(false);
  readonly error = signal<boolean | string | null>(null);
  readonly hasMore = signal(false);
  readonly strong = signal(false);
  readonly messages = signal<PartialMessages<DataListMessages> | undefined>(undefined);
  query: GridQuery = emptyQuery();
  value: DataListSelection = null;
  expanded: readonly string[] = [];
  readonly queries: DataListQueryRequest[] = [];
  readonly values: ChangeRequest<DataListSelection>[] = [];
  readonly expansions: DataListExpandedRequest[] = [];
  readonly activations: DataListActivateEvent<Account>[] = [];
  more = 0;
  retries = 0;
}

const root = () => document.querySelector<HTMLElement>("sl-data-list[data-ui='data-list']")!;
const records = () => [...root().querySelectorAll<HTMLElement>("li[data-ui='list-item']")];
const record = (name: string) => records().find((item) => item.textContent?.includes(name))!;
const checkbox = (name: string) =>
  [...root().querySelectorAll<HTMLInputElement>('input[type=checkbox]')].find(
    (input) => input.closest('[data-ui=checkbox]')?.textContent?.trim() === name,
  )!;
const buttonNamed = (scope: ParentNode, text: string) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find(
    (node) => node.textContent?.trim() === text,
  )!;

function click(element: HTMLElement, init: MouseEventInit = {}) {
  element.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1, ...init }),
  );
}

describe('SlDataList', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  async function mount(setup: (host: Host) => void = () => {}, providers: unknown[] = []) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: providers as never[],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    setup(host);
    await settle();
  }

  it('names the family and its parts the way the contract declares', async () => {
    await mount((h) => {
      h.selectionMode.set('multiple');
      h.href.set((row) => `#${row.id}`);
    });
    expect(root().dataset['ui']).toBe(contract.ui);
    expect(root().dataset['part']).toBe('root');
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
      'footer',
    ]) {
      expect(root().querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().querySelector('ul[data-ui=list]')?.getAttribute('aria-label')).toBe('Accounts');
    expect(root().querySelector('[data-part=sort] button')?.getAttribute('data-part')).toBe('root');
  });

  it('places the columns: title, subtitle, trailing and the fields by priority', async () => {
    await mount();
    const acme = record('Acme Logistics');
    expect(acme.textContent).toContain('ops@acme.example');
    expect(acme.querySelector('[data-part=trailing]')?.textContent).toContain('12,480');
    const labels = [...acme.querySelectorAll('[data-part=field-label]')].map((node) =>
      node.textContent?.trim(),
    );
    expect(labels).toEqual(['Status', 'Owner', 'Region', 'Plan']);
  });

  it('says an empty field in words beside the dash', async () => {
    await mount();
    const empty = record('Borealis Foods').querySelector('[data-part=field-empty]');
    expect(empty?.textContent).toContain('—');
    expect(empty?.textContent).toContain('Empty');
  });

  it('opens the fields past `fields` and asks with a reason', async () => {
    await mount((h) => h.fields.set(2));
    const more = buttonNamed(record('Acme Logistics'), 'Show 3 more');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(
      more.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph'),
    ).toBe('chevron-down');
    expect(more.getAttribute('aria-controls')).toBe(
      record('Acme Logistics').querySelector('dl')?.id,
    );
    click(more);
    await settle();
    expect(host.expansions[0]).toMatchObject({ value: ['acme'], reason: 'pointer', key: 'acme' });
    expect(host.expanded).toEqual(['acme']);
    expect(record('Acme Logistics').querySelectorAll('[data-part=field]')).toHaveLength(5);
  });

  it('selects through the checkbox, extends with Shift, and paints without aria-selected', async () => {
    await mount((h) => h.selectionMode.set('multiple'));
    click(checkbox('Select Acme Logistics'));
    await settle();
    expect(host.value).toEqual(['acme']);
    expect(record('Acme Logistics').hasAttribute('data-selected')).toBe(true);
    expect(record('Acme Logistics').hasAttribute('aria-selected')).toBe(false);
    expect(root().querySelector('[data-part=count]')?.textContent).toContain('1 of 3 selected');
    click(checkbox('Select Cobalt Studio'), { shiftKey: true });
    await settle();
    expect(host.value).toEqual(['acme', 'borealis', 'cobalt']);
    expect(host.values.at(-1)?.reason).toBe('select');
  });

  it('selects every record the query left, and says the count in the name', async () => {
    await mount((h) => {
      h.selectionMode.set('multiple');
      h.disabledKeys.set(['borealis']);
    });
    click(checkbox('Select all 2 items'));
    await settle();
    expect(host.value).toEqual(['acme', 'cobalt']);
    expect(checkbox('Select Borealis Foods').disabled).toBe(true);
  });

  it('holds one key in single mode', async () => {
    await mount((h) => h.selectionMode.set('single'));
    click(checkbox('Select Cobalt Studio'));
    await settle();
    expect(host.value).toBe('cobalt');
    expect(root().querySelector('[data-part=select-all]')).toBeNull();
  });

  it('sorts from the menu and says the key on the trigger', async () => {
    await mount();
    const trigger = root().querySelector<HTMLButtonElement>('[data-part=sort] button')!;
    const glyph = () =>
      trigger
        .querySelector('[data-part="end"] > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph');
    /* Without a key there is nothing to point at, and no chevron is drawn. */
    expect(glyph()).toBeUndefined();
    click(trigger);
    await settle();
    const items = [...document.querySelectorAll<HTMLElement>('[role=menuitemradio]')];
    expect(items.map((item) => item.textContent?.trim())).not.toContain('Created');
    click(items.find((item) => item.textContent?.trim() === 'Balance')!);
    await settle();
    expect(host.queries[0]).toMatchObject({
      change: 'sort',
      value: { sort: [{ column: 'balance', direction: 'ascending' }] },
    });
    expect(records()[0]?.textContent).toContain('Borealis Foods');
    expect(trigger.textContent).toContain('Sort: Balance');
    expect(trigger.getAttribute('aria-label')).toBe('Sort, Balance ascending');
    expect(glyph()).toBe('chevron-down');
  });

  it('makes the title a link or a command, and refuses a disabled or busy one', async () => {
    await mount((h) => h.href.set((row) => `#${row.id}`));
    expect(record('Acme Logistics').querySelector('a[data-part=title]')?.getAttribute('href')).toBe(
      '#acme',
    );
    await mount((h) => {
      h.activatable.set(true);
      h.disabledKeys.set(['borealis']);
      h.loadingKeys.set(['cobalt']);
    });
    click(record('Acme Logistics').querySelector<HTMLButtonElement>('button[data-part=title]')!);
    expect(host.activations[0]).toMatchObject({ key: 'acme', reason: 'pointer' });
    expect(
      record('Borealis Foods').querySelector<HTMLButtonElement>('button[data-part=title]')!
        .disabled,
    ).toBe(true);
    expect(record('Cobalt Studio').hasAttribute('data-loading')).toBe(true);
  });

  it('marks the current record through the row', async () => {
    await mount((h) => {
      h.current.set('cobalt');
      h.href.set((row) => `#${row.id}`);
    });
    expect(record('Cobalt Studio').getAttribute('aria-current')).toBe('page');
  });

  it('draws a value through a column template with the cell’s context', async () => {
    await mount((h) => h.strong.set(true));
    expect(record('Acme Logistics').querySelector('strong')?.textContent).toBe('Active!');
  });

  it('groups by query.group into list sections', async () => {
    await mount((h) => (h.query = { ...emptyQuery(), group: ['status'] }));
    const labels = [...root().querySelectorAll('[data-part=section-label]')].map((node) =>
      node.textContent?.trim(),
    );
    expect(labels).toEqual(['Status: Active · 2', 'Status: On hold · 1']);
  });

  it('tells empty, no results and error apart, and clears the filter in one change', async () => {
    await mount((h) => h.rows.set([]));
    expect(root().textContent).toContain('No items yet');
    await mount((h) => (h.query = { ...emptyQuery(), search: 'zzz' }));
    expect(root().textContent).toContain('No items match');
    click(buttonNamed(root(), 'Clear filters'));
    await settle();
    expect(host.queries[0]).toMatchObject({
      change: 'filter',
      reason: 'clear',
      value: { filter: null, search: '' },
    });
    await mount((h) => {
      h.rows.set([]);
      h.error.set(true);
    });
    click(buttonNamed(root(), 'Try again'));
    expect(host.retries).toBe(1);
  });

  it('draws the item anatomy in skeleton on the first load and keeps rows on a refresh', async () => {
    await mount((h) => {
      h.rows.set([]);
      h.loading.set(true);
    });
    const loader = root().querySelector('[data-part=loader]');
    expect(loader).not.toBeNull();
    expect(loader?.querySelector('[data-part=field-label]')?.textContent?.trim()).toBe('Status');
    await mount((h) => h.loading.set(true));
    expect(root().getAttribute('aria-busy')).toBe('true');
    expect(records()).toHaveLength(3);
  });

  it('asks for more rows from the footer', async () => {
    await mount((h) => h.hasMore.set(true));
    click(buttonNamed(root(), 'Load more'));
    await settle();
    expect(host.more).toBe(1);
    host.loading.set(true);
    await settle();
    expect(root().hasAttribute('aria-busy')).toBe(false);
  });

  it('moves focus to the next record when the focused one is removed', async () => {
    await mount((h) => h.selectionMode.set('multiple'));
    checkbox('Select Borealis Foods').focus();
    host.rows.set(ROWS.filter((row) => row.id !== 'borealis'));
    await settle();
    expect(document.activeElement).toBe(checkbox('Select Cobalt Studio'));
  });

  it('exposes focusKey and scrollToKey on the instance', async () => {
    await mount((h) => h.selectionMode.set('multiple'));
    expect(host.list().focusKey('cobalt')).toBe(true);
    expect(document.activeElement).toBe(checkbox('Select Cobalt Studio'));
    expect(host.list().scrollToKey('nope')).toBe(false);
  });

  it('takes defaults from the provider, and plurals from its own messages', async () => {
    await mount(
      // language: pt-BR
      (h) => h.messages.set({ count: '{count, plural, one {# conta} other {# contas}}' }),
      // language: en-US
      [provideDataListDefaults({ variant: 'framed' })],
    );
    // language: pt-BR
    expect(root().querySelector('[data-part=count]')?.textContent?.trim()).toBe('3 contas');
    // language: en-US
    expect(root().getAttribute('data-variant')).toBe('framed');
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    await mount(
      (h) => h.selectionMode.set('multiple'),
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const count = () => root().querySelector('[data-part=count]')?.textContent?.trim();
    // language: pt-BR
    expect(count()).toBe('3 itens');
    expect(checkbox('Selecionar Acme Logistics')).toBeDefined();
    // language: en-US

    locale.set('en-US');
    await settle();
    expect(count()).toBe('3 items');
    expect(checkbox('Select Acme Logistics')).toBeDefined();
  });
});
