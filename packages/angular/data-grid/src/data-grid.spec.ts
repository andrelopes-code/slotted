import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  GridCell,
  GridColumn,
  GridColumnState,
  GridDensity,
  GridOutOfSpace,
  GridQuery,
  GridRange,
  GridTree,
} from '@slotted/core/grid';
import { emptyQuery, POPIN_COLUMN_ID, withPageIndex } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { ChangeRequest } from '@slotted/core/state';
import { By } from '@angular/platform-browser';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlMenu } from '@slotted/angular/menu';
import { provideTooltipDefaults } from '@slotted/angular/tooltip';
import contract from '../../../../specs/components/data-grid/contract.json';
import { SELECTION_COLUMN, SlDataGrid } from './data-grid';
import { provideDataGridDefaults } from './data-grid-defaults';
import type {
  DataGridLoadMoreTrigger,
  DataGridLoading,
  DataGridActivateEvent,
  DataGridColumnOverflow,
  DataGridColumnStateRequest,
  DataGridDataSource,
  DataGridEditCommit,
  DataGridPinnedRows,
  DataGridQueryRequest,
  DataGridRowsReorderEvent,
  DataGridSelection,
  DataGridSelectionMode,
} from './data-grid-defaults';
import {
  SlDataGridCellTemplate,
  SlDataGridColumnHelp,
  SlDataGridDetailTemplate,
  SlDataGridEditorTemplate,
} from './data-grid-templates';

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

@Component({
  standalone: true,
  imports: [SlDataGrid, SlDataGridDetailTemplate],
  template: `
    <sl-data-grid
      id="grid-1"
      aria-label="Shipments"
      rowKey="id"
      [rows]="rows()"
      [columns]="columns"
      [selectionMode]="selectionMode()"
      [filterRow]="filterRow()"
      [filterDebounce]="10"
      [rowHeight]="rowHeight()"
      [highlightChanges]="highlightChanges()"
      [pinnedRows]="pinnedRows()"
      [activatable]="activatable()"
      [loading]="loading()"
      [error]="error()"
      [totalCount]="totalCount()"
      [hasMore]="hasMore()"
      [loadMoreTrigger]="loadMoreTrigger()"
      [loadMoreFailed]="loadMoreFailed()"
      [(query)]="query"
      [(columnState)]="columnState"
      [(value)]="value"
      [(range)]="range"
      [(current)]="current"
      (queryChangeRequest)="queryRequests.push($event)"
      (columnStateChangeRequest)="stateRequests.push($event)"
      (valueChangeRequest)="valueRequests.push($event)"
      (rangeChangeRequest)="rangeRequests.push($event)"
      (currentChangeRequest)="currentRequests.push($event)"
      (editCommit)="onCommit($event)"
      (activate)="activations.push($event)"
      (retry)="retries = retries + 1"
      (loadMore)="loads = loads + 1"
    >
      @if (detail()) {
        <ng-template slDataGridDetail let-row>
          <p>Detail of {{ row.id }}</p>
        </ng-template>
      }
    </sl-data-grid>
  `,
})
class Host {
  readonly grid = viewChild.required(SlDataGrid);
  readonly columns = COLUMNS;
  readonly rows = signal<readonly Shipment[]>(ROWS);
  readonly rowHeight = signal<number | 'auto' | undefined>(undefined);
  readonly highlightChanges = signal<boolean | number | undefined>(undefined);
  readonly pinnedRows = signal<DataGridPinnedRows | undefined>(undefined);
  readonly selectionMode = signal<DataGridSelectionMode>('none');
  readonly filterRow = signal(false);
  readonly activatable = signal(false);
  readonly loading = signal<DataGridLoading>(false);
  readonly error = signal<string | null | undefined>(undefined);
  readonly totalCount = signal<number | undefined>(undefined);
  readonly hasMore = signal<boolean | undefined>(undefined);
  readonly loadMoreTrigger = signal<DataGridLoadMoreTrigger | undefined>(undefined);
  readonly loadMoreFailed = signal(false);
  readonly detail = signal(false);
  readonly query = signal<GridQuery>(emptyQuery());
  readonly columnState = signal<Partial<GridColumnState> | undefined>(undefined);
  readonly value = signal<DataGridSelection>(null);
  readonly range = signal<GridRange | null>(null);
  readonly current = signal<GridCell | null>(null);
  readonly queryRequests: DataGridQueryRequest[] = [];
  readonly stateRequests: DataGridColumnStateRequest[] = [];
  readonly valueRequests: ChangeRequest<DataGridSelection>[] = [];
  readonly rangeRequests: ChangeRequest<GridRange | null>[] = [];
  readonly currentRequests: ChangeRequest<GridCell | null>[] = [];
  readonly commits: DataGridEditCommit<Shipment>[] = [];
  readonly activations: DataGridActivateEvent[] = [];
  retries = 0;
  loads = 0;
  commitOutcome: Promise<void> | null = null;

  onCommit(commit: DataGridEditCommit<Shipment>) {
    this.commits.push(commit);
    if (this.commitOutcome) commit.wait(this.commitOutcome);
  }
}

/** The glyph a family control draws inside itself, as the Glyph element. */
const glyphOf = (scope: Element | null | undefined) =>
  scope?.querySelector(':scope > [data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');

describe('SlDataGrid', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const root = () => fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
  const cell = (row: string, column: string) =>
    root().querySelector<HTMLElement>(`[data-row="${row}"] [data-column="${column}"]`)!;
  const header = (column: string) =>
    root().querySelector<HTMLElement>(`[data-part="column-header"][data-column="${column}"]`)!;
  const press = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
    );
    fixture.detectChanges();
  };
  const type = (input: HTMLInputElement, text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  const menuItem = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (item) => item.textContent?.trim() === name,
    )!;
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a grid of rows and cells, with every count written', () => {
    expect(root().getAttribute('data-ui')).toBe('data-grid');
    expect(root().getAttribute('aria-label')).toBe('Shipments');
    expect(root().getAttribute('id')).toBe('grid-1');
    expect(root().getAttribute('aria-colcount')).toBe('6');
    expect(root().getAttribute('aria-rowcount')).toBe('6');
    expect(root().querySelectorAll('[role="rowgroup"]')).toHaveLength(3);
    expect(root().querySelectorAll('[role="columnheader"]')).toHaveLength(6);
    expect(root().querySelectorAll('[role="rowheader"]')).toHaveLength(4);
    expect(cell('S1', 'customer').getAttribute('aria-colindex')).toBe('2');
    expect(cell('S1', 'customer').closest('[role="row"]')!.getAttribute('aria-rowindex')).toBe('2');
    /* One tab stop always: the header's first cell until the reader has been anywhere. */
    const stops = root().querySelectorAll('[tabindex="0"]');
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(header('id'));
  });

  /**
   * A native input is a tab stop without a tabindex attribute: counting
   * `[tabindex="0"]` missed every selection box, and Tab walked the rows.
   */
  it('keeps one tab stop with a selection column, the boxes included', () => {
    host.selectionMode.set('multiple');
    fixture.detectChanges();
    const stops = () =>
      [
        ...root().querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
        ),
      ].filter((node) => node.tabIndex >= 0 && !node.matches(':disabled'));
    expect(stops()).toHaveLength(1);
    host.current.set({ row: 'S2', column: SELECTION_COLUMN });
    fixture.detectChanges();
    expect(stops().every((node) => node.closest('[data-row="S2"]') !== null)).toBe(true);
  });

  it('names the set and yes-or-no filters in the filter row, as React does', () => {
    host.filterRow.set(true);
    fixture.detectChanges();
    const named = [
      ...root().querySelectorAll<HTMLElement>('[data-part="filter-cell"] [aria-label]'),
    ].map((node) => node.getAttribute('aria-label'));
    expect(named).toContain('Filter Priority');
    expect(named).toContain('Filter Carrier');
  });

  it('declares every part the contract names on the elements it names', () => {
    host.selectionMode.set('multiple');
    host.filterRow.set(true);
    host.detail.set(true);
    fixture.detectChanges();
    const parts = new Set(
      [...root().querySelectorAll<HTMLElement>('[data-part]')].map((node) => node.dataset['part']),
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
    host.current.set({ row: 'S1', column: 'customer' });
    fixture.detectChanges();
    expect(cell('S1', 'customer').getAttribute('tabindex')).toBe('0');
    expect(cell('S1', 'customer').hasAttribute('data-current')).toBe(true);
    cell('S1', 'customer').focus();
    press(cell('S1', 'customer'), 'ArrowRight');
    expect(cell('S1', 'carrier').getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(cell('S1', 'carrier'));
    press(cell('S1', 'carrier'), 'ArrowDown');
    expect(document.activeElement).toBe(cell('S2', 'carrier'));
    press(cell('S2', 'carrier'), 'End');
    expect(document.activeElement).toBe(cell('S2', 'priority'));
    press(cell('S2', 'priority'), 'Home', { ctrlKey: true });
    expect(document.activeElement).toBe(cell('S1', 'id'));
    press(cell('S1', 'id'), 'ArrowUp');
    expect(document.activeElement).toBe(header('id'));
    press(header('id'), 'End', { ctrlKey: true });
    expect(document.activeElement).toBe(cell('S4', 'priority'));
  });

  it('asks before the cursor moves, with the reason', () => {
    host.current.set({ row: 'S1', column: 'id' });
    fixture.detectChanges();
    press(cell('S1', 'id'), 'ArrowDown');
    expect(host.currentRequests.at(-1)).toMatchObject({
      value: { row: 'S2', column: 'id' },
      reason: 'keyboard',
    });
    cell('S3', 'customer').dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.currentRequests.at(-1)).toMatchObject({
      value: { row: 'S3', column: 'customer' },
      reason: 'pointer',
    });
    expect(host.current()).toEqual({ row: 'S3', column: 'customer' });
  });

  it('keeps the cursor on the same index when its row leaves', () => {
    host.current.set({ row: 'S2', column: 'customer' });
    fixture.detectChanges();
    host.query.set({ ...emptyQuery(), search: 'Nord' });
    fixture.detectChanges();
    expect(root().querySelector('[data-current][data-part="cell"]')).toBe(cell('S3', 'customer'));
  });

  it('sorts by one key on a press, cycles it, and appends with Shift', () => {
    header('weight').click();
    fixture.detectChanges();
    expect(header('weight').getAttribute('aria-sort')).toBe('ascending');
    expect(glyphOf(header('weight').querySelector('[data-part="sort"]'))).toBe('chevron-down');
    expect(glyphOf(header('weight').querySelector('[data-part="column-menu"]'))).toBe('ellipsis');
    expect(host.queryRequests.at(-1)).toMatchObject({
      value: { sort: [{ column: 'weight', direction: 'ascending' }] },
      reason: 'pointer',
      change: 'sort',
    });
    expect(
      [...root().querySelectorAll('[role="rowheader"]')].map((node) => node.textContent?.trim()),
    ).toEqual(['S2', 'S4', 'S1', 'S3']);
    header('weight').click();
    fixture.detectChanges();
    expect(header('weight').getAttribute('aria-sort')).toBe('descending');
    header('customer').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    fixture.detectChanges();
    expect(header('weight').getAttribute('aria-sort')).toBe('descending');
    expect(header('customer').hasAttribute('aria-sort')).toBe(false);
    expect(header('customer').querySelector('[data-part="sort"]')!.getAttribute('data-index')).toBe(
      '2',
    );
    header('weight').click();
    fixture.detectChanges();
    expect(header('weight').hasAttribute('aria-sort')).toBe(false);
  });

  it('sorts on a press on the name while the scroller is a tab stop, and never on the handle', () => {
    root().querySelector('[data-part="scroll"]')!.setAttribute('tabindex', '0');
    header('customer').querySelector('span')!.click();
    fixture.detectChanges();
    expect(header('customer').getAttribute('aria-sort')).toBe('ascending');
    header('customer').querySelector<HTMLElement>('[data-part="resizer"]')!.click();
    fixture.detectChanges();
    expect(header('customer').getAttribute('aria-sort')).toBe('ascending');
  });

  it('sorts from the keyboard on the header cell', () => {
    host.current.set({ row: 'header', column: 'customer' });
    fixture.detectChanges();
    press(header('customer'), 'Enter');
    expect(header('customer').getAttribute('aria-sort')).toBe('ascending');
  });

  it('applies a column filter from the filter row after the debounce', async () => {
    host.filterRow.set(true);
    fixture.detectChanges();
    const input = root().querySelector<HTMLInputElement>(
      '[data-part="filter-cell"][data-column="customer"] input',
    )!;
    type(input, 'ver');
    expect(host.queryRequests).toHaveLength(0);
    await new Promise((resolve) => setTimeout(resolve, 30));
    fixture.detectChanges();
    expect(host.queryRequests.at(-1)).toMatchObject({
      change: 'filter',
      value: {
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
      },
    });
    expect(root().querySelectorAll('[data-part="row"]')).toHaveLength(1);
    expect(header('customer').hasAttribute('data-filtered')).toBe(true);
    expect(glyphOf(header('customer').querySelector('[data-part="filter"]'))).toBe('funnel');
  });

  it('edits the panel as a draft and reports on Apply', async () => {
    host.current.set({ row: 'header', column: 'customer' });
    fixture.detectChanges();
    press(header('customer'), 'Enter', { ctrlKey: true });
    await settle();
    menuItem('Filter…').click();
    await settle();
    const panel = document.querySelector<HTMLElement>('[data-part="filter-panel"]')!;
    expect(panel.getAttribute('data-ui')).toBe('data-grid');
    const input = panel.querySelector<HTMLInputElement>('[data-part="filter-operand"] input')!;
    type(input, 'au');
    expect(host.queryRequests).toHaveLength(0);
    [...panel.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Apply')!
      .click();
    await settle();
    expect(host.queryRequests).toHaveLength(1);
    expect(root().querySelectorAll('[data-part="row"]')).toHaveLength(1);
  });

  it('shows the empty state a filter left, and clears it from there', () => {
    host.query.set({ ...emptyQuery(), search: 'zzz' });
    fixture.detectChanges();
    expect(root().querySelector('[data-part="empty"]')!.textContent).toContain(
      'No rows match the current filters',
    );
    [...root().querySelectorAll<HTMLButtonElement>('[data-part="empty"] button')]
      .find((button) => button.textContent?.trim() === 'Clear filters')!
      .click();
    fixture.detectChanges();
    expect(root().querySelectorAll('[data-part="row"]')).toHaveLength(4);
  });

  it('pages in client mode and states the range in the footer', () => {
    host.query.set(emptyQuery({ index: 1, size: 3 }));
    fixture.detectChanges();
    expect(root().querySelectorAll('[data-part="row"]')).toHaveLength(1);
    expect(root().querySelector('[data-range]')!.textContent).toContain('4–4 of 4');
  });

  it('draws the rows it is given in server mode, with the stated total', () => {
    host.totalCount.set(3412);
    host.query.set(emptyQuery({ index: 2, size: 4 }));
    fixture.detectChanges();
    expect(root().getAttribute('aria-rowcount')).toBe('3413');
    expect(root().querySelector('[data-range]')!.textContent).toContain('9–12 of 3,412');
  });

  /**
   * A server that pages by date sends its rows already ordered for grouping;
   * in server mode the grid emitted one plain row per row and ignored the
   * query's group. It groups what it is given, in the order given.
   */
  it('groups the rows a server sent, in their order, in server mode', () => {
    host.rows.set([
      { ...ROWS[0]!, id: 'D1', shipped: '2026-09-13' },
      { ...ROWS[1]!, id: 'D2', shipped: '2026-09-13' },
      { ...ROWS[2]!, id: 'D3', shipped: '2026-09-12' },
      { ...ROWS[3]!, id: 'D4', shipped: '2026-09-12' },
      { ...ROWS[0]!, id: 'D5', shipped: '2026-09-11' },
      { ...ROWS[1]!, id: 'D6', shipped: '2026-09-11' },
    ]);
    host.totalCount.set(6);
    host.query.set({ ...emptyQuery(), group: ['shipped'] });
    fixture.detectChanges();
    const groups = root().querySelectorAll('[data-part="group-row"]');
    expect(groups).toHaveLength(3);
    for (const group of groups) expect(group.textContent).toContain('2 rows');
    expect(root().querySelectorAll('[data-part="row"]')).toHaveLength(6);
  });

  it('groups, with counts and aggregates, and closes a group with the left arrow', () => {
    host.query.set({ ...emptyQuery(), group: ['carrier'] });
    host.current.set({ row: 'group:carrier=DHL', column: 'id' });
    fixture.detectChanges();
    const groups = root().querySelectorAll('[data-part="group-row"]');
    expect(groups).toHaveLength(3);
    expect(glyphOf(groups[0]!.querySelector('[data-part="group-toggle"]'))).toBe('chevron-right');
    expect(groups[0]!.getAttribute('aria-level')).toBe('1');
    expect(groups[0]!.getAttribute('aria-expanded')).toBe('true');
    expect(groups[0]!.textContent).toContain('2 rows');
    expect(groups[0]!.querySelector('[data-aggregate]')!.textContent).toContain('206.8');
    press(groups[0]!.querySelector<HTMLElement>('[role="gridcell"]')!, 'ArrowLeft');
    expect(
      root().querySelectorAll('[data-part="group-row"]')[0]!.getAttribute('aria-expanded'),
    ).toBe('false');
    expect(root().querySelectorAll('[data-part="row"]')).toHaveLength(2);
  });

  it('draws a summary row from the aggregating columns', () => {
    expect(
      root().querySelector('[data-part="summary"] [data-column="weight"]')!.textContent,
    ).toContain('225');
  });

  it('selects rows with the checkbox, extends with Shift, and covers the set from the header', () => {
    host.selectionMode.set('multiple');
    fixture.detectChanges();
    expect(root().getAttribute('aria-multiselectable')).toBe('true');
    cell('S1', '__selection').querySelector<HTMLInputElement>('input')!.click();
    fixture.detectChanges();
    expect(host.valueRequests.at(-1)).toMatchObject({ value: ['S1'], reason: 'pointer' });
    expect(cell('S1', 'id').closest('[role="row"]')!.getAttribute('aria-selected')).toBe('true');
    cell('S3', '__selection')
      .querySelector<HTMLInputElement>('input')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    fixture.detectChanges();
    expect(host.value()).toEqual(['S1', 'S2', 'S3']);
    const all = root().querySelector<HTMLElement>('[data-part="head"] [data-part="selection"]')!;
    expect(all.textContent).toContain('Select all 4 rows');
    all.querySelector<HTMLInputElement>('input')!.click();
    fixture.detectChanges();
    expect(host.valueRequests.at(-1)).toMatchObject({
      value: ['S1', 'S2', 'S3', 'S4'],
      reason: 'select',
    });
  });

  it('toggles the row with Shift+Space from any cell, and selects everything with Ctrl+A', () => {
    host.selectionMode.set('multiple');
    host.current.set({ row: 'S2', column: 'customer' });
    fixture.detectChanges();
    press(cell('S2', 'customer'), ' ', { shiftKey: true });
    expect(host.valueRequests.at(-1)).toMatchObject({ value: ['S2'], reason: 'keyboard' });
    press(cell('S2', 'customer'), 'a', { ctrlKey: true });
    expect(host.value()).toEqual(['S1', 'S2', 'S3', 'S4']);
  });

  it('selects a range of cells with Shift and the arrows, names its edges, and copies it', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: write } });
    host.selectionMode.set('range');
    host.current.set({ row: 'S1', column: 'customer' });
    fixture.detectChanges();
    press(cell('S1', 'customer'), 'ArrowDown', { shiftKey: true });
    press(cell('S2', 'customer'), 'ArrowRight', { shiftKey: true });
    expect(host.rangeRequests.at(-1)).toMatchObject({
      value: { anchor: { row: 'S1', column: 'customer' }, focus: { row: 'S2', column: 'carrier' } },
      reason: 'keyboard',
    });
    expect(cell('S1', 'customer').getAttribute('data-range-edge')).toBe('top start');
    expect(cell('S2', 'carrier').getAttribute('data-range-edge')).toBe('bottom end');
    expect(cell('S1', 'customer').getAttribute('aria-selected')).toBe('true');
    expect(cell('S3', 'customer').hasAttribute('data-in-range')).toBe(false);
    press(cell('S2', 'carrier'), 'c', { ctrlKey: true });
    await settle();
    expect(write).toHaveBeenCalledWith('Aurora\tDHL\nBloom\tUPS');
    press(cell('S2', 'carrier'), 'Escape');
    expect(host.rangeRequests.at(-1)).toMatchObject({ value: null, reason: 'clear' });
  });

  it('opens an editor on Enter, commits on Enter and moves down, cancels on Escape', async () => {
    host.current.set({ row: 'S1', column: 'customer' });
    fixture.detectChanges();
    press(cell('S1', 'customer'), 'Enter');
    await settle();
    expect(cell('S1', 'customer').hasAttribute('data-editing')).toBe(true);
    type(cell('S1', 'customer').querySelector<HTMLInputElement>('input')!, 'Aurora Textiles');
    press(cell('S1', 'customer'), 'Enter');
    await settle();
    expect(host.commits.at(-1)).toMatchObject({
      key: 'S1',
      column: 'customer',
      value: 'Aurora Textiles',
      previous: 'Aurora',
      reason: 'keyboard',
    });
    expect(cell('S2', 'customer').hasAttribute('data-current')).toBe(true);
    press(cell('S2', 'customer'), 'F2');
    await settle();
    type(cell('S2', 'customer').querySelector<HTMLInputElement>('input')!, 'x');
    press(cell('S2', 'customer'), 'Escape');
    expect(cell('S2', 'customer').hasAttribute('data-editing')).toBe(false);
    expect(host.commits).toHaveLength(1);
  });

  it('opens the editor with the typed key as its first character', async () => {
    host.current.set({ row: 'S1', column: 'customer' });
    fixture.detectChanges();
    press(cell('S1', 'customer'), 'Z');
    await settle();
    expect(cell('S1', 'customer').querySelector<HTMLInputElement>('input')!.value).toBe('Z');
  });

  it('keeps the draft and marks the cell when validation fails, and when the commit rejects', async () => {
    host.commitOutcome = Promise.reject(new Error('Offline'));
    host.commitOutcome.catch(() => undefined);
    host.current.set({ row: 'S1', column: 'weight' });
    fixture.detectChanges();
    press(cell('S1', 'weight'), 'Enter');
    await settle();
    type(cell('S1', 'weight').querySelector<HTMLInputElement>('input')!, '-4');
    press(cell('S1', 'weight'), 'Enter');
    await settle();
    expect(cell('S1', 'weight').hasAttribute('data-invalid')).toBe(true);
    expect(cell('S1', 'weight').getAttribute('aria-invalid')).toBe('true');
    expect(cell('S1', 'weight').getAttribute('title')).toBe('A weight is not negative');
    expect(host.commits).toHaveLength(0);
    type(cell('S1', 'weight').querySelector<HTMLInputElement>('input')!, '40');
    press(cell('S1', 'weight'), 'Enter');
    await settle();
    await settle();
    expect(host.commits).toHaveLength(1);
    expect(cell('S1', 'weight').getAttribute('title')).toBe('Offline');
    expect(cell('S1', 'weight').hasAttribute('data-editing')).toBe(true);
  });

  it('marks a cell whose row changed under the editor as a conflict', async () => {
    host.current.set({ row: 'S1', column: 'customer' });
    fixture.detectChanges();
    press(cell('S1', 'customer'), 'Enter');
    await settle();
    host.rows.set([{ ...ROWS[0]!, customer: 'Changed' }, ...ROWS.slice(1)]);
    fixture.detectChanges();
    expect(cell('S1', 'customer').hasAttribute('data-invalid')).toBe(true);
    expect(cell('S1', 'customer').getAttribute('title')).toBe(
      'This value changed while you were editing',
    );
  });

  it('activates a row on Enter when activatable, and never on an editable cell', async () => {
    host.activatable.set(true);
    host.current.set({ row: 'S1', column: 'id' });
    fixture.detectChanges();
    press(cell('S1', 'id'), 'Enter');
    expect(host.activations.at(-1)).toMatchObject({ key: 'S1', reason: 'keyboard' });
    press(cell('S1', 'customer'), 'Enter');
    await settle();
    expect(cell('S1', 'customer').hasAttribute('data-editing')).toBe(true);
    expect(host.activations).toHaveLength(1);
  });

  it('activates a row on one touch, and ignores the double press that follows it', () => {
    host.activatable.set(true);
    fixture.detectChanges();
    const tap = (target: HTMLElement, pointerType: string) => {
      target.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true, pointerType }),
      );
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      fixture.detectChanges();
    };
    const doublePress = (target: HTMLElement) => {
      target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
      fixture.detectChanges();
    };
    tap(cell('S1', 'carrier'), 'touch');
    expect(host.activations).toHaveLength(1);
    expect(host.activations[0]).toMatchObject({ key: 'S1', reason: 'pointer' });
    doublePress(cell('S1', 'carrier'));
    expect(host.activations).toHaveLength(1);

    tap(cell('S2', 'carrier'), 'pen');
    expect(host.activations.at(-1)).toMatchObject({ key: 'S2', reason: 'pointer' });

    /* The mouse keeps the double press. */
    tap(cell('S3', 'carrier'), 'mouse');
    expect(host.activations).toHaveLength(2);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);
    doublePress(cell('S3', 'carrier'));
    expect(host.activations.at(-1)).toMatchObject({ key: 'S3', reason: 'pointer' });
    vi.restoreAllMocks();
  });

  it('never activates on one touch of a widget in the cell, nor of a cell in edit', async () => {
    host.activatable.set(true);
    fixture.detectChanges();
    const widget = document.createElement('button');
    widget.type = 'button';
    cell('S1', 'carrier').append(widget);
    widget.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, bubbles: true, pointerType: 'touch' }),
    );
    widget.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    widget.remove();
    expect(host.activations).toHaveLength(0);

    host.current.set({ row: 'S1', column: 'customer' });
    fixture.detectChanges();
    press(cell('S1', 'customer'), 'Enter');
    await settle();
    expect(cell('S1', 'customer').hasAttribute('data-editing')).toBe(true);
    const editing = cell('S1', 'customer');
    editing.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, bubbles: true, pointerType: 'touch' }),
    );
    editing.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(host.activations).toHaveLength(0);
  });

  it('writes aria-readonly on a cell that does not edit while others do', () => {
    expect(cell('S1', 'id').getAttribute('aria-readonly')).toBe('true');
    expect(cell('S1', 'customer').hasAttribute('aria-readonly')).toBe(false);
  });

  it('resizes from the keyboard by a step, clamped, and announces', () => {
    host.current.set({ row: 'header', column: 'customer' });
    fixture.detectChanges();
    press(header('customer'), 'ArrowRight', { ctrlKey: true, shiftKey: true });
    expect(host.stateRequests.at(-1)).toMatchObject({
      value: { widths: { customer: 168 } },
      reason: 'keyboard',
      change: 'width',
    });
    expect(root().style.getPropertyValue('--slotted-data-grid-template')).toContain('168px');
  });

  it('moves a column with Alt and the arrows, inside its zone', () => {
    host.current.set({ row: 'header', column: 'customer' });
    fixture.detectChanges();
    press(header('customer'), 'ArrowRight', { altKey: true });
    expect(host.stateRequests.at(-1)).toMatchObject({
      value: { order: ['id', 'carrier', 'customer', 'weight', 'shipped', 'priority'] },
      change: 'order',
    });
    expect(
      [...root().querySelectorAll('[data-part="column-header"]')].map((node) =>
        node.getAttribute('data-column'),
      ),
    ).toEqual(['id', 'carrier', 'customer', 'weight', 'shipped', 'priority']);
  });

  it('pins, hides and fits through the column menu', async () => {
    host.current.set({ row: 'header', column: 'weight' });
    fixture.detectChanges();
    press(header('weight'), 'Enter', { ctrlKey: true });
    await settle();
    menuItem('Pin to end').click();
    await settle();
    expect(host.stateRequests.at(-1)).toMatchObject({
      value: { pinned: { start: [], end: ['weight'] } },
      change: 'pinned',
    });
    expect(header('weight').getAttribute('data-pinned')).toBe('end');
    expect(header('weight').hasAttribute('data-pin-edge')).toBe(true);
    expect(header('weight').style.getPropertyValue('--slotted-data-grid-pin-offset')).toBe('0px');
    press(header('weight'), 'Enter', { ctrlKey: true });
    await settle();
    menuItem('Hide column').click();
    await settle();
    expect(root().querySelector('[data-part="column-header"][data-column="weight"]')).toBeNull();
    expect(root().getAttribute('aria-colcount')).toBe('5');
  });

  it('takes a controlled column state and normalises it', () => {
    host.columnState.set({
      order: ['weight', 'id'],
      widths: {},
      hidden: ['priority', 'ghost'],
      pinned: { start: ['id'], end: [] },
    });
    fixture.detectChanges();
    expect(
      [...root().querySelectorAll('[data-part="column-header"]')].map((node) =>
        node.getAttribute('data-column'),
      ),
    ).toEqual(['id', 'weight', 'customer', 'carrier', 'shipped']);
  });

  it('opens a detail row under an expandable row, reachable by the arrows', () => {
    host.detail.set(true);
    host.current.set({ row: 'S1', column: '__expander' });
    fixture.detectChanges();
    press(cell('S1', '__expander'), 'ArrowRight');
    const detail = root().querySelector<HTMLElement>('[data-part="detail"]')!;
    expect(detail.getAttribute('role')).toBe('row');
    expect(detail.textContent).toContain('Detail of S1');
    expect(cell('S1', '__expander').querySelector('button')!.getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(glyphOf(cell('S1', '__expander').querySelector('button'))).toBe('chevron-right');
    press(cell('S1', '__expander'), 'ArrowLeft');
    expect(root().querySelector('[data-part="detail"]')).toBeNull();
  });

  it('exposes the imperative surface', async () => {
    host.grid().focusCell({ row: 'S3', column: 'weight' });
    await settle();
    expect(document.activeElement).toBe(cell('S3', 'weight'));
    host.grid().startEdit({ row: 'S3', column: 'customer' });
    await settle();
    expect(cell('S3', 'customer').hasAttribute('data-editing')).toBe(true);
    expect(host.grid().getVisibleRows()).toHaveLength(4);
  });

  /**
   * The gutters hold a chooser, a handle and an expander. An outline of a
   * control nobody can press yet is a control that lies, so the loader
   * reserves their width and draws nothing in them.
   */
  it('leaves the loader’s gutters empty and skeletons only the value columns', () => {
    host.selectionMode.set('multiple');
    host.loading.set(true);
    host.rows.set([]);
    fixture.detectChanges();
    const row = root().querySelector('[data-part="loader"] [data-part="row"]')!;
    const cells = [...row.children];
    expect(cells[0]!.querySelector('[data-ui="skeleton"]')).toBeNull();
    expect(cells.slice(1).every((cell) => cell.querySelector('[data-ui="skeleton"]'))).toBe(true);
    /* The lengths follow the value columns: the first one takes the first width. */
    const first = cells[1]!.querySelector('[data-ui="skeleton"]') as HTMLElement;
    expect(first.style.getPropertyValue('--slotted-skeleton-inline-size')).toBe('70%');
  });

  /* The skeleton rows take the height of the rows they stand in for, so the
     count that fills the frame and the rows drawn in it agree. */
  it('gives the skeleton rows the height of the body rows', () => {
    host.rowHeight.set(56);
    host.loading.set(true);
    host.rows.set([]);
    fixture.detectChanges();
    const loader = root().querySelector<HTMLElement>('[data-part="loader"]')!;
    expect(loader.style.getPropertyValue('--slotted-data-grid-loader-row-size')).toBe('56px');
  });

  /**
   * Zero rows is an answer, and a refetch of it reads again over the empty
   * state instead of replacing it with placeholders (AF-02). `'initial'` asks
   * for the skeleton anyway.
   */
  it('keeps the empty state it drew while it reads again', () => {
    host.rows.set([]);
    fixture.detectChanges();
    expect(root().querySelector('[data-part="empty"]')).not.toBeNull();

    host.loading.set(true);
    fixture.detectChanges();
    expect(root().querySelector('[data-part="empty"]')).not.toBeNull();
    expect(root().querySelector('[data-part="loader"]')).toBeNull();
    expect(root().getAttribute('aria-busy')).toBe('true');

    host.loading.set('initial');
    fixture.detectChanges();
    expect(root().querySelector('[data-part="loader"]')).not.toBeNull();
  });

  it('draws the loading, empty and error states', () => {
    host.loading.set(true);
    host.rows.set([]);
    fixture.detectChanges();
    expect(root().querySelector('[data-part="loader"]')).not.toBeNull();
    host.loading.set(false);
    fixture.detectChanges();
    expect(root().querySelector('[data-part="empty"]')!.textContent).toContain('No rows');
    host.error.set('Timed out');
    fixture.detectChanges();
    [...root().querySelectorAll<HTMLButtonElement>('[data-part="empty"] button')]
      .find((button) => button.textContent?.trim() === 'Try again')!
      .click();
    expect(host.retries).toBe(1);
    host.error.set(undefined);
    host.rows.set(ROWS);
    host.loading.set(true);
    fixture.detectChanges();
    expect(root().getAttribute('aria-busy')).toBe('true');
  });

  /**
   * A grid that loads its next page on its own offered a Load more control as
   * well, whose purpose the reader could not tell. Under the default trigger
   * the footer says the page is loading, and a control appears only to retry
   * a page that failed.
   */
  it('offers no Load more control by default, and a status while the page loads', () => {
    host.hasMore.set(true);
    host.query.set(emptyQuery({ cursor: null, size: 4 }));
    fixture.detectChanges();
    const footerButtons = () =>
      [...fixture.nativeElement.querySelectorAll('[data-part="footer"] button')].map(
        (button: HTMLButtonElement) => button.textContent?.trim(),
      );
    expect(footerButtons()).not.toContain('Load more');
    expect(fixture.nativeElement.querySelector('[data-range]').textContent).toContain('1–4');
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-loading-more]').textContent).toContain(
      'Loading more rows',
    );
  });

  /**
   * The next page is asked for when the rows near the end come into view of
   * the page, which an observer with no root reports; jsdom has none, so this
   * one reports the mark in view.
   */
  it('asks for the next page when the mark over the last rows comes into view', () => {
    const observed: Element[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly report: IntersectionObserverCallback) {}
        observe(target: Element) {
          observed.push(target);
          this.report(
            [{ isIntersecting: true, target } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        disconnect() {}
      },
    );
    host.hasMore.set(true);
    host.query.set(emptyQuery({ cursor: null, size: 4 }));
    fixture.detectChanges();
    TestBed.tick();
    expect(observed[0]?.getAttribute('aria-hidden')).toBe('true');
    expect(host.loads).toBeGreaterThanOrEqual(1);
    vi.unstubAllGlobals();
  });

  it('offers a retry after a failed page, and asks for it from the control', () => {
    host.hasMore.set(true);
    host.loadMoreFailed.set(true);
    host.query.set(emptyQuery({ cursor: null, size: 4 }));
    fixture.detectChanges();
    const before = host.loads;
    [...fixture.nativeElement.querySelectorAll('[data-part="footer"] button')]
      .find((button: HTMLButtonElement) => button.textContent?.trim() === 'Try again')!
      .click();
    expect(host.loads).toBe(before + 1);
  });

  it('offers Load more under the button trigger', () => {
    host.hasMore.set(true);
    host.loadMoreTrigger.set('button');
    host.query.set(emptyQuery({ cursor: null, size: 4 }));
    fixture.detectChanges();
    expect(root().getAttribute('aria-rowcount')).toBe('0');
    [...fixture.nativeElement.querySelectorAll('[data-part="footer"] button')]
      .find((button: HTMLButtonElement) => button.textContent?.trim() === 'Load more')!
      .click();
    expect(host.loads).toBeGreaterThanOrEqual(1);
  });
});

@Component({
  standalone: true,
  imports: [SlDataGrid],
  providers: [provideDataGridDefaults({ variant: 'framed' })],
  template: `<sl-data-grid
    rowKey="id"
    [rows]="[]"
    [columns]="columns"
    [messages]="{ empty: 'Nada' }"
  />`,
})
class Provided {
  readonly columns = COLUMNS;
}

/** The language the grid below speaks, changed in place by the test. */
const gridLocale = signal('pt-BR');

@Component({
  standalone: true,
  imports: [SlDataGrid],
  providers: [provideSlotted({ locale: gridLocale, catalogs: { 'pt-BR': PT_BR } })],
  template: `<sl-data-grid
    aria-label="Shipments"
    rowKey="id"
    selectionMode="multiple"
    [rows]="rows"
    [columns]="columns"
  />`,
})
class Localized {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
}

/**
 * The first view, before any render hook has run — the markup a server sends.
 * A part written by `afterNextRender` is missing from it, and so is every rule
 * the stylesheet keys on that part.
 */
describe('SlDataGrid, first view', () => {
  it('names the column menu trigger as its part before any render hook runs', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentRef.changeDetectorRef.detectChanges();

    const trigger = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-part="column-header"][data-column="weight"] button[aria-haspopup="menu"]',
    );
    expect(trigger?.getAttribute('data-part')).toBe('column-menu');
  });
});

describe('SlDataGrid, defaults', () => {
  it('fits every column in one request, each to its own content', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
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
    const requests = fixture.componentInstance.stateRequests;
    fixture.componentInstance.grid().autofit();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual(
      expect.objectContaining({ change: 'width', reason: 'programmatic' }),
    );
    expect(requests[0]!.value.widths).toEqual(
      Object.fromEntries(Object.entries(widths).map(([id, width]) => [id, width])),
    );
    delete (Range.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  });

  it('exports the visible rows and columns as CSV, and the selected rows on request', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.selectionMode.set('multiple');
    fixture.componentInstance.value.set(['S3', 'S1']);
    fixture.componentInstance.columnState.set({
      order: ['customer', 'id'],
      widths: {},
      hidden: ['priority', 'shipped'],
      pinned: { start: [], end: [] },
    });
    fixture.componentInstance.query.set({
      ...emptyQuery(),
      sort: [{ column: 'weight', direction: 'ascending' }],
    });
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid();
    /* Sorted by weight ascending, the empty one last; hidden columns out,
       the reader's order. */
    expect(grid.toCsv()).toBe(
      'Customer,Tracking,Carrier,Weight\r\n' +
        'Bloom,S2,UPS,18.2\r\n' +
        'Casa Verde,S4,DHL,64.3\r\n' +
        'Aurora,S1,DHL,142.5\r\n' +
        'Nordwind,S3,FedEx,\r\n',
    );
    /* The selected rows in the grid's order, not the selection's. */
    expect(grid.toCsv({ rows: 'selected', header: false })).toBe(
      'Aurora,S1,DHL,142.5\r\nNordwind,S3,FedEx,\r\n',
    );
    const clicks: string[] = [];
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      clicks.push(`${this.download}:${this.href}`);
    };
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:1' });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });
    try {
      grid.exportCsv({ filename: 'shipments.csv' });
      expect(clicks).toEqual(['shipments.csv:blob:1']);
    } finally {
      HTMLAnchorElement.prototype.click = click;
    }
  });

  it('marks a mounted cell whose value changed, for the stated time, and never a row that arrived', async () => {
    vi.useFakeTimers();
    try {
      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.highlightChanges.set(500);
      fixture.detectChanges();
      const [first, second, ...rest] = ROWS;
      fixture.componentInstance.rows.set([
        first!,
        { ...second!, weight: 99 },
        ...rest,
        { ...first!, id: 'S9' },
      ]);
      fixture.detectChanges();
      const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
      const cell = (row: string, column: string) =>
        root.querySelector<HTMLElement>(`[data-row="${row}"] [data-column="${column}"]`)!;
      expect(cell('S2', 'weight').hasAttribute('data-changed')).toBe(true);
      expect(cell('S2', 'customer').hasAttribute('data-changed')).toBe(false);
      expect(cell('S1', 'weight').hasAttribute('data-changed')).toBe(false);
      expect(cell('S9', 'weight').hasAttribute('data-changed')).toBe(false);
      expect(root.style.getPropertyValue('--slotted-data-grid-changed-duration')).toBe('500ms');
      vi.advanceTimersByTime(600);
      fixture.detectChanges();
      expect(cell('S2', 'weight').hasAttribute('data-changed')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('writes a numeric row height to the frame, so the drawn row is the windowed row', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.rowHeight.set(56);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    expect(root.style.getPropertyValue('--slotted-data-grid-row-block-size')).toBe('56px');
  });

  it('reads defaults from the provider, an explicit input winning', async () => {
    await TestBed.configureTestingModule({ imports: [Provided] }).compileComponents();
    const fixture = TestBed.createComponent(Provided);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    expect(root.getAttribute('data-variant')).toBe('framed');
    expect(root.querySelector('[data-part="empty"]')!.textContent).toContain('Nada');
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    gridLocale.set('pt-BR');
    await TestBed.configureTestingModule({ imports: [Localized] }).compileComponents();
    const fixture = TestBed.createComponent(Localized);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    const all = () => root.querySelector('[data-part="head"] [data-part="selection"]')!;
    const priority = (row: string) =>
      root.querySelector(`[data-row="${row}"] [data-column="priority"]`)!;
    // language: pt-BR
    expect(all().textContent).toContain('Selecionar todas as 4 linhas');
    expect(priority('S1').textContent).toContain('Sim');
    expect(priority('S2').textContent).toContain('Não');
    // language: en-US

    gridLocale.set('en-US');
    fixture.detectChanges();
    expect(all().textContent).toContain('Select all 4 rows');
    expect(priority('S1').textContent).toContain('Yes');
  });
});

describe('SlDataGrid, a column name its own box cuts', () => {
  /**
   * Every column name truncates, and a name cut to `Cus…` is unreadable until
   * something says the words. The hint says them, and only while the box is
   * measured as cutting them.
   */
  it('opens a hint over it, and none over a name that fits', async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTooltipDefaults({ openDelay: 0 })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const measure = (element: Element, sizes: { client: number; scroll: number }) => {
      Object.defineProperty(element, 'clientWidth', { configurable: true, value: sizes.client });
      Object.defineProperty(element, 'scrollWidth', { configurable: true, value: sizes.scroll });
    };
    const hint = () => document.querySelector('[role="tooltip"]');
    const name = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-part="column-header"][data-column="customer"] span',
    )!;
    /* jsdom does not expand the `overflow` shorthand, so the axis is written. */
    name.style.overflowX = 'hidden';

    measure(name, { client: 160, scroll: 160 });
    name.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    fixture.detectChanges();
    expect(hint()).toBeNull();

    measure(name, { client: 48, scroll: 160 });
    name.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    fixture.detectChanges();
    expect(hint()?.textContent).toBe('Customer');
    /* The header already states the words: naming them twice is reading them twice. */
    expect(hint()?.getAttribute('aria-hidden')).toBe('true');
    expect(name.getAttribute('aria-describedby')).toBeNull();
  });
});

describe('SlDataGrid as a tree', () => {
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

  @Component({
    standalone: true,
    imports: [SlDataGrid],
    template: `
      <sl-data-grid
        aria-label="Sites"
        rowKey="id"
        [rows]="rows()"
        [columns]="columns"
        [tree]="tree"
        [(expanded)]="expanded"
        [current]="current()"
        (loadChildren)="loads.push($event.key)"
      />
    `,
  })
  class TreeHost {
    readonly grid = viewChild.required(SlDataGrid);
    readonly columns = SITE_COLUMNS;
    readonly rows = signal<readonly Site[]>(SITES);
    readonly expanded = signal<readonly string[]>([]);
    readonly current = signal<GridCell | null>(null);
    readonly loads: string[] = [];
    tree: GridTree<Site> = { parentKey: (row) => row.parent };
  }

  async function mount() {
    await TestBed.configureTestingModule({ imports: [TreeHost] }).compileComponents();
    const fixture = TestBed.createComponent(TreeHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="data-grid"]') as HTMLElement;
    const rowKeys = () =>
      [...root.querySelectorAll<HTMLElement>('[data-part="body"] > [data-part="row"]')].map(
        (row) => row.dataset['row'],
      );
    const cell = (row: string, column: string) =>
      root.querySelector<HTMLElement>(`[data-row="${row}"] [data-column="${column}"]`)!;
    const toggle = (key: string) =>
      root.querySelector<HTMLElement>(`[data-row="${key}"] [data-part="tree-toggle"]`)!;
    return { fixture, root, rowKeys, cell, toggle };
  }

  it('is a treegrid of closed roots, and opens a branch from its toggle', async () => {
    const { fixture, root, rowKeys, toggle } = await mount();
    expect(root.getAttribute('role')).toBe('treegrid');
    expect(rowKeys()).toEqual(['pt', 'es']);
    expect(root.querySelector('[data-row="pt"]')!.getAttribute('aria-expanded')).toBe('false');
    expect(toggle('es').tagName).toBe('SPAN');
    expect(glyphOf(toggle('pt'))).toBe('chevron-right');
    expect(glyphOf(toggle('es'))).toBeUndefined();
    toggle('pt').click();
    fixture.detectChanges();
    expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-por', 'es']);
    expect(root.querySelector('[data-row="pt-lis"]')!.getAttribute('aria-level')).toBe('2');
  });

  it('opens and closes from the keyboard in the tree column, and climbs to the parent', async () => {
    const { fixture, cell, rowKeys } = await mount();
    fixture.componentInstance.expanded.set(['pt']);
    fixture.componentInstance.current.set({ row: 'pt-lis', column: 'name' });
    fixture.detectChanges();
    cell('pt-lis', 'name').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-lis-a', 'pt-por', 'es']);
    cell('pt-lis', 'name').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    fixture.detectChanges();
    expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-por', 'es']);
    cell('pt-lis', 'name').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    fixture.detectChanges();
    expect(cell('pt', 'name').hasAttribute('data-current')).toBe(true);
  });

  it('asks for the children of a row that has none yet, and shows the wait until they arrive', async () => {
    const { fixture, root, rowKeys, toggle } = await mount();
    fixture.componentInstance.tree = {
      parentKey: (row) => row.parent,
      hasChildren: (row) => row.id === 'pt-lis',
    };
    fixture.componentInstance.rows.set(SITES.filter((row) => row.id !== 'pt-lis-a'));
    fixture.detectChanges();
    toggle('pt').click();
    fixture.detectChanges();
    toggle('pt-lis').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.loads).toEqual(['pt-lis']);
    expect(root.querySelector('[data-row="pt-lis"]')!.hasAttribute('data-loading')).toBe(true);
    /* The wait turns the chevron into the loader's ring. */
    expect(glyphOf(toggle('pt-lis'))).toBe('loader-circle');
    fixture.componentInstance.rows.set(SITES);
    fixture.detectChanges();
    expect(root.querySelector('[data-row="pt-lis"]')!.hasAttribute('data-loading')).toBe(false);
    expect(rowKeys()).toEqual(['pt', 'pt-lis', 'pt-lis-a', 'pt-por', 'es']);
  });
});

describe('SlDataGrid reordering rows', () => {
  @Component({
    standalone: true,
    imports: [SlDataGrid],
    template: `
      <sl-data-grid
        aria-label="Shipments"
        rowKey="id"
        [rows]="rows"
        [columns]="columns"
        [query]="query()"
        [current]="current()"
        rowsReorderable
        (rowsReorder)="moves.push($event)"
      />
    `,
  })
  class ReorderHost {
    readonly rows = ROWS;
    readonly columns = COLUMNS;
    readonly query = signal<GridQuery>(emptyQuery());
    readonly current = signal<GridCell | null>(null);
    readonly moves: DataGridRowsReorderEvent[] = [];
  }

  async function mount() {
    await TestBed.configureTestingModule({ imports: [ReorderHost] }).compileComponents();
    const fixture = TestBed.createComponent(ReorderHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    const handle = (row: string) =>
      root.querySelector<HTMLElement>(`[data-row="${row}"] [data-part="row-handle"]`)!;
    const cell = (row: string, column: string) =>
      root.querySelector<HTMLElement>(`[data-row="${row}"] [data-column="${column}"]`)!;
    return { fixture, root, handle, cell };
  }

  it('draws a handle per row that only works while the query is at rest', async () => {
    const { fixture, root, handle } = await mount();
    expect(root.querySelectorAll('[data-part="row-handle"]')).toHaveLength(4);
    expect(handle('S1').getAttribute('aria-label')).toBe('Reorder S1');
    expect(glyphOf(handle('S1'))).toBe('grip-vertical');
    expect(handle('S1').hasAttribute('aria-disabled')).toBe(false);
    fixture.componentInstance.query.set({
      ...emptyQuery(),
      sort: [{ column: 'weight', direction: 'ascending' }],
    });
    fixture.detectChanges();
    expect(handle('S1').getAttribute('aria-disabled')).toBe('true');
  });

  it('moves a row with Alt and the vertical arrows, reporting where it goes in rows', async () => {
    const { fixture, cell } = await mount();
    fixture.componentInstance.current.set({ row: 'S2', column: 'customer' });
    fixture.detectChanges();
    const press = (key: string) =>
      cell('S2', 'customer').dispatchEvent(
        new KeyboardEvent('keydown', { key, altKey: true, bubbles: true, cancelable: true }),
      );
    press('ArrowDown');
    expect(fixture.componentInstance.moves.at(-1)).toEqual(
      expect.objectContaining({ key: 'S2', from: 1, to: 2, reason: 'keyboard' }),
    );
    press('ArrowUp');
    expect(fixture.componentInstance.moves.at(-1)).toEqual(
      expect.objectContaining({ key: 'S2', from: 1, to: 0, reason: 'keyboard' }),
    );
  });

  it('drags a row by its handle to a gap, and reports the move', async () => {
    const { fixture, root, handle } = await mount();
    const rows = [...root.querySelectorAll<HTMLElement>('[data-part="body"] > [data-part="row"]')];
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
    const body = root.querySelector<HTMLElement>('[data-part="body"]')!;
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
    handle('S1').dispatchEvent(press('pointerdown', 115));
    document.dispatchEvent(press('pointermove', 140));
    document.dispatchEvent(press('pointermove', 205));
    fixture.detectChanges();
    expect(root.querySelector('[data-row="S1"]')!.hasAttribute('data-dragging')).toBe(true);
    expect(root.querySelector('[data-part="drop-indicator"][data-axis="row"]')).not.toBeNull();
    document.dispatchEvent(press('pointerup', 205));
    fixture.detectChanges();
    expect(fixture.componentInstance.moves.at(-1)).toEqual(
      expect.objectContaining({ key: 'S1', from: 0, to: 3, reason: 'pointer' }),
    );
  });
});

describe('SlDataGrid pinned rows', () => {
  it('keeps pinned rows out of the query, in their own groups, counted and indexed in order', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.pinnedRows.set({ top: ['S3'], bottom: ['S1'] });
    fixture.componentInstance.query.set({
      ...emptyQuery(),
      sort: [{ column: 'weight', direction: 'descending' }],
    });
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    const keysIn = (selector: string) =>
      [...root.querySelectorAll<HTMLElement>(`${selector} > [data-part="row"]`)].map(
        (row) => row.dataset['row'],
      );
    expect(keysIn('[data-part="pinned-rows"][data-edge="top"]')).toEqual(['S3']);
    expect(keysIn('[data-part="body"]')).toEqual(['S4', 'S2']);
    expect(keysIn('[data-part="pinned-rows"][data-edge="bottom"]')).toEqual(['S1']);
    /* Four rows, the header and the summary. */
    expect(root.getAttribute('aria-rowcount')).toBe('6');
    expect(root.querySelector('[data-row="S3"]')!.getAttribute('aria-rowindex')).toBe('2');
    expect(root.querySelector('[data-row="S4"]')!.getAttribute('aria-rowindex')).toBe('3');
    expect(root.querySelector('[data-row="S1"]')!.getAttribute('aria-rowindex')).toBe('5');
  });

  it('lets the cursor walk from the top pinned row through the body to the bottom one', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.pinnedRows.set({ top: ['S3'], bottom: ['S1'] });
    fixture.componentInstance.current.set({ row: 'S3', column: 'customer' });
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    const cell = (row: string, column: string) =>
      root.querySelector<HTMLElement>(`[data-row="${row}"] [data-column="${column}"]`)!;
    const down = (row: string, key: string) => {
      cell(row, 'customer').dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      fixture.detectChanges();
    };
    down('S3', 'ArrowDown');
    expect(cell('S2', 'customer').hasAttribute('data-current')).toBe(true);
    down('S2', 'ArrowDown');
    down('S4', 'ArrowDown');
    expect(cell('S1', 'customer').hasAttribute('data-current')).toBe(true);
    down('S1', 'ArrowUp');
    expect(cell('S4', 'customer').hasAttribute('data-current')).toBe(true);
  });
});

describe('SlDataGrid with a data source', () => {
  type Answer = { rows: Shipment[]; total: number };
  function source(answer: (query: GridQuery) => Answer | Error) {
    const calls: { query: GridQuery; signal: AbortSignal }[] = [];
    return {
      calls,
      getRows: (query: GridQuery, options: { signal: AbortSignal }) => {
        calls.push({ query, signal: options.signal });
        const result = answer(query);
        return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
      },
    };
  }

  @Component({
    standalone: true,
    imports: [SlDataGrid],
    template: `
      <sl-data-grid
        aria-label="Shipments"
        rowKey="id"
        [columns]="columns"
        [dataSource]="source"
        [(query)]="query"
      />
    `,
  })
  class SourcedHost {
    readonly grid = viewChild.required(SlDataGrid);
    readonly columns = COLUMNS;
    readonly query = signal<GridQuery>(emptyQuery({ index: 0, size: 2 }));
    source: DataGridDataSource<Shipment> = { getRows: () => Promise.resolve({ rows: [] }) };
  }

  const settle = async (fixture: { detectChanges(): void }) => {
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  };

  it('asks for the rows of each query, shows the wait, and keeps the answer by the query', async () => {
    const shipments = source((query) => ({
      rows:
        query.page && 'index' in query.page && query.page.index === 1
          ? [ROWS[2]!, ROWS[3]!]
          : [ROWS[0]!, ROWS[1]!],
      total: 4,
    }));
    await TestBed.configureTestingModule({ imports: [SourcedHost] }).compileComponents();
    const fixture = TestBed.createComponent(SourcedHost);
    fixture.componentInstance.source = shipments;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    const bodyKeys = () =>
      [...root.querySelectorAll<HTMLElement>('[data-part="body"] > [data-part="row"]')].map(
        (row) => row.dataset['row'],
      );
    expect(root.querySelector('[data-part="loader"]')).not.toBeNull();
    await settle(fixture);
    expect(bodyKeys()).toEqual(['S1', 'S2']);
    expect(root.getAttribute('aria-rowcount')).toBe('5');
    fixture.componentInstance.query.update((query) => withPageIndex(query, 1).query);
    fixture.detectChanges();
    /* The page that is there stays, dimmed, while the next one is fetched. */
    expect(bodyKeys()).toEqual(['S1', 'S2']);
    expect(root.getAttribute('aria-busy')).toBe('true');
    await settle(fixture);
    expect(bodyKeys()).toEqual(['S3', 'S4']);
    fixture.componentInstance.query.update((query) => withPageIndex(query, 0).query);
    fixture.detectChanges();
    await settle(fixture);
    expect(bodyKeys()).toEqual(['S1', 'S2']);
    expect(shipments.calls).toHaveLength(2);
  });

  it('draws the error the source threw, retries from it, and reloads past the cache', async () => {
    let failing = true;
    const shipments = source(() =>
      failing ? new Error('The shipments service timed out') : { rows: [ROWS[0]!], total: 1 },
    );
    await TestBed.configureTestingModule({ imports: [SourcedHost] }).compileComponents();
    const fixture = TestBed.createComponent(SourcedHost);
    fixture.componentInstance.source = shipments;
    fixture.detectChanges();
    await settle(fixture);
    const root = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    expect(root.textContent).toContain('The shipments service timed out');
    failing = false;
    (root.querySelector('[data-part="empty"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await settle(fixture);
    expect(root.querySelectorAll('[data-part="body"] > [data-part="row"]')).toHaveLength(1);
    expect(shipments.calls).toHaveLength(2);
    fixture.componentInstance.grid().reload();
    fixture.detectChanges();
    await settle(fixture);
    expect(shipments.calls).toHaveLength(3);
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

const ACCOUNT_COLUMNS: GridColumn<Account>[] = [
  { id: 'name', label: 'Account', width: 200 },
  {
    id: 'arr',
    label: 'ARR',
    kind: 'number',
    width: 120,
    description: 'Annual recurring revenue, in US dollars',
    priority: 1,
  },
  { id: 'owner', label: 'Owner', width: 160, priority: 3 },
  { id: 'region', label: 'Region', width: 120, priority: 2 },
];

@Component({
  standalone: true,
  imports: [SlDataGrid, SlDataGridColumnHelp, SlDataGridCellTemplate],
  template: `
    <sl-data-grid
      aria-label="Accounts"
      rowKey="id"
      [rows]="rows"
      [columns]="columns()"
      [density]="density()"
      [columnOverflow]="columnOverflow()"
      [pinnedRows]="pinnedRows()"
      [activatable]="activatable()"
      (columnStateChangeRequest)="stateRequests.push($event)"
      (queryChangeRequest)="queryRequests.push($event)"
      (outOfSpaceChange)="spaced.push($event)"
      (activate)="activations.push($event)"
    >
      <ng-template slDataGridColumnHelp="owner">
        <p>The account executive who <a href="#owners">owns the renewal</a>.</p>
      </ng-template>
      <ng-template slDataGridCell="owner" let-text="text" let-key="key">
        <strong data-owner>{{ text }} ({{ key }})</strong>
      </ng-template>
    </sl-data-grid>
  `,
})
class Accounts {
  readonly grid = viewChild.required(SlDataGrid);
  readonly rows = ACCOUNTS;
  readonly columns = signal<readonly GridColumn<Account>[]>(ACCOUNT_COLUMNS);
  readonly density = signal<GridDensity | null | undefined>(undefined);
  readonly columnOverflow = signal<DataGridColumnOverflow | undefined>('popin');
  readonly pinnedRows = signal<DataGridPinnedRows | undefined>(undefined);
  readonly activatable = signal(false);
  readonly stateRequests: DataGridColumnStateRequest[] = [];
  readonly queryRequests: DataGridQueryRequest[] = [];
  readonly spaced: GridOutOfSpace[] = [];
  readonly activations: DataGridActivateEvent[] = [];
}

/**
 * The composition the column-manager reference writes: the manager, and the
 * count it reads from the grid, stand before the grid in the template, so the
 * set is read before the grid's own inputs are bound.
 */
@Component({
  standalone: true,
  imports: [SlDataGrid],
  template: `
    <output>{{ grid.outOfSpace().popin.length }}</output>
    <sl-data-grid
      #grid="slDataGrid"
      aria-label="Accounts"
      rowKey="id"
      [rows]="rows"
      [columns]="columns"
    />
  `,
})
class ReadBeforeTheGrid {
  readonly rows = ACCOUNTS;
  readonly columns = ACCOUNT_COLUMNS;
}

describe('SlDataGrid, the out-of-space set read before the grid', () => {
  it('is empty, and throws no required-input error, before the grid is bound', () => {
    const fixture = TestBed.createComponent(ReadBeforeTheGrid);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect((fixture.nativeElement as HTMLElement).querySelector('output')?.textContent).toBe('0');
  });
});

describe('SlDataGrid, explaining and arranging columns', () => {
  let fixture: ComponentFixture<Accounts>;
  let observed: (() => void)[] = [];
  /* The main pointer `(pointer: coarse)` answers, and who listens to it. */
  let coarse = false;
  let pointerListeners: (() => void)[] = [];

  const root = () => fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
  const header = (column: string) =>
    root().querySelector<HTMLElement>(`[data-part="column-header"][data-column="${column}"]`)!;
  const press = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
    );
    fixture.detectChanges();
  };
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const menuItem = (name: string) =>
    [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (item) => item.textContent?.trim() === name,
    )!;

  beforeEach(async () => {
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
    await TestBed.configureTestingModule({ imports: [Accounts] }).compileComponents();
    fixture = TestBed.createComponent(Accounts);
    fixture.detectChanges();
    await settle();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks a column with something to say, and describes its header by the text', () => {
    const arr = header('arr');
    const description = arr.querySelector<HTMLElement>('[data-part="column-description"]')!;
    expect(description.textContent?.trim()).toBe('Annual recurring revenue, in US dollars');
    expect(arr.getAttribute('aria-describedby')).toBe(description.id);
    /* Described, not named: the header's name stays the column's label. */
    expect(description.getAttribute('aria-hidden')).toBe('true');
    expect(
      arr.querySelector('[data-part="column-actions"] > [data-part="column-help"]'),
    ).not.toBeNull();
    expect(arr.querySelector('[data-part="column-help"]')!.getAttribute('aria-label')).toBe(
      'About ARR',
    );
    /* A template alone is help too; a column with neither has no button. */
    expect(header('owner').querySelector('[data-part="column-help"]')).not.toBeNull();
    expect(header('owner').hasAttribute('aria-describedby')).toBe(false);
    expect(header('name').querySelector('[data-part="column-help"]')).toBeNull();
    /* The help comes before the filter and the menu. */
    const actions = [...arr.querySelectorAll<HTMLElement>('[data-part="column-actions"] > *')];
    expect(actions[0]!.dataset['part']).toBe('column-help');
  });

  it('opens the help on a press, never sorting, with the description and the template', async () => {
    const help = header('owner').querySelector<HTMLElement>('[data-part="column-help"]')!;
    expect(help.getAttribute('aria-expanded')).toBe('false');
    expect(glyphOf(help)).toBe('circle-question');
    help.click();
    await settle();
    expect(help.getAttribute('aria-expanded')).toBe('true');
    const content = document.getElementById(help.getAttribute('aria-controls')!)!;
    expect(content.textContent).toContain('owns the renewal');
    expect(fixture.componentInstance.queryRequests).toHaveLength(0);

    const arrHelp = header('arr').querySelector<HTMLElement>('[data-part="column-help"]')!;
    arrHelp.click();
    await settle();
    const arrContent = document.getElementById(arrHelp.getAttribute('aria-controls')!)!;
    expect(arrContent.textContent).toContain('Annual recurring revenue');
    expect(arrContent.getAttribute('aria-label')).toBe('About ARR');
  });

  it('shows the description atop the column menu, and describes the menu by it', async () => {
    header('arr').focus();
    fixture.detectChanges();
    press(header('arr'), 'Enter', { ctrlKey: true });
    await settle();
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    const shown = menu.querySelector<HTMLElement>('[data-part="column-menu-description"]')!;
    expect(shown.textContent?.trim()).toBe('Annual recurring revenue, in US dollars');
    expect(shown.getAttribute('aria-hidden')).toBe('true');
    expect(menu.getAttribute('aria-describedby')).toBe(
      header('arr').querySelector('[data-part="column-description"]')!.id,
    );
  });

  it('enters the header cell with F2, cycles its widgets with Tab, and leaves with Escape', async () => {
    const arr = header('arr');
    arr.focus();
    fixture.detectChanges();
    press(arr, 'F2');
    const help = arr.querySelector<HTMLElement>('[data-part="column-help"]')!;
    const menu = arr.querySelector<HTMLElement>('[data-part="column-menu"]')!;
    expect(document.activeElement).toBe(help);
    press(help, 'Tab');
    expect(document.activeElement).toBe(menu);
    press(menu, 'Tab');
    expect(document.activeElement).toBe(help);
    press(help, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(menu);
    press(menu, 'Escape');
    expect(document.activeElement).toBe(arr);
    /* Enter on the header still sorts. */
    press(arr, 'Enter');
    expect(fixture.componentInstance.queryRequests.at(-1)).toMatchObject({ change: 'sort' });
  });

  it('announces a hidden column, and the request carries what an undo restores', async () => {
    const announce = vi.spyOn(getLiveAnnouncer(document), 'announce');
    header('owner').focus();
    fixture.detectChanges();
    press(header('owner'), 'Enter', { ctrlKey: true });
    await settle();
    menuItem('Hide column').click();
    await settle();
    const request = fixture.componentInstance.stateRequests.at(-1)!;
    expect(request).toMatchObject({ change: 'hidden', value: { hidden: ['owner'] } });
    expect(request.previous.hidden).toEqual([]);
    expect(announce).toHaveBeenCalledWith('Owner hidden');
    announce.mockRestore();
  });

  /**
   * A drag moves the guide and nothing else; the
   * width is requested once, on release, and Escape requests nothing.
   */
  it('requests the width once on release and nothing on Escape', () => {
    const requests = fixture.componentInstance.stateRequests;
    const resizer = header('owner').querySelector<HTMLElement>('[data-part="resizer"]')!;
    resizer.setPointerCapture = () => {};
    resizer.releasePointerCapture = () => {};
    const pointer = (type: string, clientX: number) =>
      resizer.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, clientX }));

    const before = requests.length;
    pointer('pointerdown', 100);
    fixture.detectChanges();
    for (let step = 1; step <= 20; step += 1) pointer('pointermove', 100 + step * 2);
    expect(requests.length).toBe(before);
    expect(resizer.querySelector('[data-part="resize-guide"]')).not.toBeNull();
    pointer('pointerup', 140);
    fixture.detectChanges();
    expect(requests.length).toBe(before + 1);
    expect(requests.at(-1)).toMatchObject({ change: 'width', reason: 'pointer' });
    expect(resizer.querySelector('[data-part="resize-guide"]')).toBeNull();

    pointer('pointerdown', 100);
    fixture.detectChanges();
    pointer('pointermove', 130);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    pointer('pointerup', 130);
    expect(requests.length).toBe(before + 1);
    expect(resizer.querySelector('[data-part="resize-guide"]')).toBeNull();
  });

  it('fits one column or every column, with the reason of the gesture', async () => {
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
    const requests = fixture.componentInstance.stateRequests;
    const resizer = header('owner').querySelector<HTMLElement>('[data-part="resizer"]')!;
    resizer.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(requests.at(-1)).toMatchObject({ change: 'width', reason: 'pointer' });
    expect(Object.keys(requests.at(-1)!.value.widths)).toEqual(['owner']);
    measured = 80;
    resizer.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, shiftKey: true }));
    expect(requests.at(-1)).toMatchObject({ change: 'width', reason: 'pointer' });
    expect(requests.at(-1)!.value.widths).toEqual({ name: 80, arr: 80, owner: 80, region: 80 });
    measured = 70;
    header('owner').focus();
    fixture.detectChanges();
    press(header('owner'), 'Enter', { ctrlKey: true, shiftKey: true });
    expect(requests.at(-1)).toMatchObject({ change: 'width', reason: 'keyboard' });

    measured = 60;
    press(header('owner'), 'Enter', { ctrlKey: true });
    await settle();
    menuItem('Fit all columns').dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    await settle();
    expect(requests.at(-1)).toMatchObject({ change: 'width', reason: 'pointer' });
    expect(requests.at(-1)!.value.widths).toEqual({ name: 60, arr: 60, owner: 60, region: 60 });
    measured = 50;
    press(header('owner'), 'Enter', { ctrlKey: true });
    await settle();
    menuItem('Fit to content').click();
    await settle();
    expect(requests.at(-1)).toMatchObject({ change: 'width', reason: 'keyboard' });
    measured = 40;
    fixture.componentInstance.grid().autofit('owner');
    expect(requests.at(-1)).toMatchObject({ change: 'width', reason: 'programmatic' });
    delete (Range.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect;
  });

  const resize = (width: number) => {
    const scroller = root().querySelector<HTMLElement>('[data-part="scroll"]')!;
    Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: width });
    for (const run of observed) run();
    fixture.detectChanges();
  };
  const row = (key: string) =>
    root().querySelector<HTMLElement>(`[role="row"][data-row="${key}"]`)!;
  const popin = (key: string) => row(key).querySelector<HTMLElement>('[data-part="popin"]');
  const fields = (key: string) =>
    [...popin(key)!.querySelectorAll<HTMLElement>('[data-part="popin-field"]')].map((field) => [
      field.querySelector('[data-part="popin-label"]')?.textContent?.trim() ?? null,
      field.querySelector('[data-part="popin-value"]')!.textContent?.trim(),
    ]);
  const rightClick = (target: HTMLElement, init: MouseEventInit = {}) => {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: 40,
      clientY: 60,
      ...init,
    });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const columnMenu = (column: string) =>
    fixture.debugElement
      .queryAll(By.directive(SlMenu))
      .map((node) => node.componentInstance as SlMenu)
      .find((menu) => menu.trigger()?.getAttribute('data-menu-for') === column)!;

  it('moves the columns of least priority into the row’s pop-in, outside the state', async () => {
    const instance = fixture.componentInstance;
    expect(instance.grid().outOfSpace()).toEqual({ popin: [], hidden: [] });
    expect(root().hasAttribute('data-popin')).toBe(false);
    expect(popin('A1')).toBeNull();
    expect(root().querySelector('[data-part="popin-header"]')).toBeNull();

    resize(400);
    /* 600 asked for: Owner (3) goes first, then Region (2); ARR (1) stays. */
    expect(instance.grid().outOfSpace()).toEqual({ popin: ['owner', 'region'], hidden: [] });
    expect(root().getAttribute('data-popin')).toBe('2');
    expect(root().hasAttribute('data-space-hidden')).toBe(false);
    /* Account, ARR and the pop-in's own column. */
    expect(root().getAttribute('aria-colcount')).toBe('3');
    expect(header('owner')).toBeNull();
    expect(root().style.getPropertyValue('--slotted-data-grid-template')).not.toContain('160px');

    const heading = root().querySelector<HTMLElement>('[data-part="popin-header"]')!;
    expect(heading.getAttribute('role')).toBe('columnheader');
    expect(heading.getAttribute('aria-colindex')).toBe('3');
    expect(heading.textContent?.trim()).toBe('Details');
    expect(heading.parentElement!.lastElementChild).toBe(heading);

    const cell = popin('A1')!;
    expect(cell.getAttribute('role')).toBe('gridcell');
    expect(cell.getAttribute('aria-colindex')).toBe('3');
    expect(row('A1').lastElementChild).toBe(cell);
    /* The label is the header's, the value the cell's own template with its context. */
    expect(fields('A1')).toEqual([
      ['Owner', 'Maya Chen (A1)'],
      ['Region', 'EMEA'],
    ]);
    expect(cell.querySelector('[data-owner]')).not.toBeNull();
    /* A row with a pop-in is measured as it grows. */
    expect(root().getAttribute('data-rows')).toBe('auto');
    /* The pop-in starts where the first data column does: no gutter here. */
    expect(root().style.getPropertyValue('--slotted-data-grid-leading')).toBe('0px');
    expect(instance.spaced).toEqual([{ popin: ['owner', 'region'], hidden: [] }]);
    expect(instance.stateRequests).toHaveLength(0);

    resize(1000);
    expect(instance.grid().outOfSpace()).toEqual({ popin: [], hidden: [] });
    expect(root().getAttribute('aria-colcount')).toBe('4');
    expect(popin('A1')).toBeNull();
    expect(root().getAttribute('data-rows')).toBe('fixed');
    expect(root().style.getPropertyValue('--slotted-data-grid-leading')).toBe('');
    expect(instance.spaced).toEqual([
      { popin: ['owner', 'region'], hidden: [] },
      { popin: [], hidden: [] },
    ]);
  });

  it('hides a column that declines the pop-in, and takes nothing out under scroll', async () => {
    const instance = fixture.componentInstance;
    instance.columns.set(
      ACCOUNT_COLUMNS.map((column) =>
        column.id === 'region' ? { ...column, popin: false } : column,
      ),
    );
    fixture.detectChanges();
    resize(400);
    expect(instance.grid().outOfSpace()).toEqual({ popin: ['owner'], hidden: ['region'] });
    expect(root().getAttribute('data-popin')).toBe('1');
    expect(header('region')).toBeNull();
    expect(fields('A1')).toEqual([['Owner', 'Maya Chen (A1)']]);

    instance.columnOverflow.set('scroll');
    fixture.detectChanges();
    expect(instance.grid().outOfSpace()).toEqual({ popin: [], hidden: [] });
    expect(root().hasAttribute('data-popin')).toBe(false);
    expect(header('region')).not.toBeNull();
    expect(root().getAttribute('aria-colcount')).toBe('4');
  });

  it('pops in under auto only on a phone-wide frame or a touch frame narrower than a desktop', () => {
    const instance = fixture.componentInstance;
    /* 1800 asked for: too many columns for every frame below. */
    instance.columns.set(
      ACCOUNT_COLUMNS.map((column) => ({ ...column, width: (column.width ?? 0) * 3 })),
    );
    instance.columnOverflow.set(undefined);
    fixture.detectChanges();

    /* A mouse on a wide frame scrolls: the columns keep their layout. */
    resize(1280);
    expect(instance.grid().outOfSpace()).toEqual({ popin: [], hidden: [] });
    resize(800);
    expect(instance.grid().outOfSpace()).toEqual({ popin: [], hidden: [] });
    expect(root().hasAttribute('data-popin')).toBe(false);
    /* A phone-wide frame pops in, whatever the pointer. */
    resize(560);
    expect(instance.grid().outOfSpace().popin.length).toBeGreaterThan(0);
    expect(root().hasAttribute('data-popin')).toBe(true);

    /* A finger pops in under a desktop's width, and the grid hears the pointer change. */
    resize(800);
    expect(instance.grid().outOfSpace().popin).toEqual([]);
    coarse = true;
    for (const listener of pointerListeners) listener();
    fixture.detectChanges();
    expect(instance.grid().outOfSpace().popin.length).toBeGreaterThan(0);
    resize(1100);
    expect(instance.grid().outOfSpace()).toEqual({ popin: [], hidden: [] });

    /* An explicit pop-in holds at any width. */
    coarse = false;
    for (const listener of pointerListeners) listener();
    instance.columnOverflow.set('popin');
    fixture.detectChanges();
    expect(instance.grid().outOfSpace().popin.length).toBeGreaterThan(0);
  });

  it('draws the pop-in in pinned rows, and the popped aggregates in the summary', async () => {
    const instance = fixture.componentInstance;
    instance.pinnedRows.set({ top: ['A2'] });
    instance.columns.set(
      ACCOUNT_COLUMNS.map((column) =>
        column.id === 'region' ? { ...column, aggregate: 'count' as const } : column,
      ),
    );
    fixture.detectChanges();
    resize(400);
    expect(row('A2').closest('[data-part="pinned-rows"]')).not.toBeNull();
    expect(fields('A2')).toEqual([
      ['Owner', 'Omar Haddad (A2)'],
      ['Region', 'NA'],
    ]);
    const summary = root().querySelector<HTMLElement>('[data-part="summary"] [role="row"]')!;
    const total = popin('summary')!;
    expect(total.getAttribute('aria-colindex')).toBe('3');
    expect(fields('summary')).toEqual([['Region', '1']]);
    expect(total.parentElement).toBe(summary);
  });

  it('walks the cursor onto the pop-in as the last column, and activates the row from it', async () => {
    const instance = fixture.componentInstance;
    instance.activatable.set(true);
    fixture.detectChanges();
    resize(400);
    instance.grid().focusCell({ row: 'A1', column: 'arr' });
    await settle();
    const arr = root().querySelector<HTMLElement>('[data-row="A1"] [data-column="arr"]')!;
    press(arr, 'ArrowRight');
    await settle();
    expect(instance.grid().current()).toEqual({ row: 'A1', column: POPIN_COLUMN_ID });
    expect(popin('A1')!.hasAttribute('data-current')).toBe(true);
    expect(document.activeElement).toBe(popin('A1'));
    press(popin('A1')!, 'Enter');
    expect(instance.activations.at(-1)).toMatchObject({ key: 'A1', reason: 'keyboard' });
    /* The header row has no cell to stand on there: the cursor stops at ARR. */
    press(popin('A1')!, 'ArrowUp');
    await settle();
    expect(instance.grid().current()).toEqual({ row: 'header', column: 'arr' });
    press(header('arr'), 'ArrowRight');
    expect(instance.grid().current()).toEqual({ row: 'header', column: 'arr' });
  });

  it('opens the column menu at the pointer on a header’s context menu', async () => {
    const menu = columnMenu('owner');
    const reasons: string[] = [];
    menu.openChangeRequest.subscribe((request) => reasons.push(request.reason));
    const event = rightClick(header('owner'), { clientX: 40, clientY: 60 });
    await settle();
    expect(event.defaultPrevented).toBe(true);
    expect(menu.isOpen()).toBe(true);
    expect(reasons).toEqual(['pointer']);
    const point = menu.anchor()!.getBoundingClientRect();
    expect([point.x, point.y, point.width, point.height]).toEqual([40, 60, 0, 0]);

    /* The button opens it where it always did. */
    menu.toggle(false, 'programmatic');
    await settle();
    header('owner').querySelector<HTMLElement>('[data-part="column-menu"]')!.click();
    await settle();
    expect(menu.isOpen()).toBe(true);
    expect(menu.anchor()).toBeNull();
  });

  it('opens the column menu on the header from the keyboard, and ignores the echo', async () => {
    const menu = columnMenu('owner');
    const reasons: string[] = [];
    menu.openChangeRequest.subscribe((request) => reasons.push(request.reason));
    header('owner').focus();
    press(header('owner'), 'F10', { shiftKey: true });
    await settle();
    expect(menu.isOpen()).toBe(true);
    expect(menu.anchor()).toBe(header('owner'));
    expect(reasons).toEqual(['keyboard']);
    /* Windows fires contextmenu for the key the grid already answered. */
    const echo = rightClick(header('owner'));
    await settle();
    expect(echo.defaultPrevented).toBe(true);
    expect(reasons).toEqual(['keyboard']);
    expect(menu.anchor()).toBe(header('owner'));
  });

  it('leaves the browser’s menu with Shift, on a field, and off a data column', async () => {
    const menu = columnMenu('owner');
    expect(rightClick(header('owner'), { shiftKey: true }).defaultPrevented).toBe(false);
    const field = document.createElement('input');
    header('owner').append(field);
    expect(rightClick(field).defaultPrevented).toBe(false);
    field.remove();
    await settle();
    expect(menu.isOpen()).toBe(false);

    resize(400);
    const heading = root().querySelector<HTMLElement>('[data-part="popin-header"]')!;
    expect(rightClick(heading).defaultPrevented).toBe(false);
    expect(rightClick(popin('A1')!).defaultPrevented).toBe(false);
  });

  it('writes its own density on the root, and inherits the page’s without one', () => {
    expect(root().hasAttribute('data-slotted-density')).toBe(false);
    fixture.componentInstance.density.set('dense');
    fixture.detectChanges();
    expect(root().getAttribute('data-slotted-density')).toBe('dense');
    fixture.componentInstance.density.set(null);
    fixture.detectChanges();
    expect(root().hasAttribute('data-slotted-density')).toBe(false);
  });
});

describe('SlDataGrid selection box name', () => {
  interface Person {
    id: string;
    name: string;
  }

  @Component({
    standalone: true,
    imports: [SlDataGrid],
    template: `
      <sl-data-grid
        aria-label="People"
        rowKey="id"
        selectionMode="multiple"
        [rows]="rows"
        [columns]="columns()"
      />
    `,
  })
  class PeopleHost {
    readonly rows: readonly Person[] = [
      { id: '01a15bae-5c1e-4f0b-9a57-0f3c2d9e7b11', name: 'Ada Lovelace' },
    ];
    readonly columns = signal<GridColumn<Person>[]>([
      { id: 'name', label: 'Name', rowHeader: true },
    ]);
  }

  it('is the row header text, and the key only without a row header', async () => {
    await TestBed.configureTestingModule({ imports: [PeopleHost] }).compileComponents();
    const fixture = TestBed.createComponent(PeopleHost);
    fixture.detectChanges();
    const name = () =>
      (
        fixture.nativeElement.querySelector(
          '[data-part="body"] [data-part="selection"] input',
        ) as HTMLInputElement
      ).labels?.[0]?.textContent?.trim();
    expect(name()).toBe('Select row Ada Lovelace');
    fixture.componentInstance.columns.set([{ id: 'name', label: 'Name' }]);
    fixture.detectChanges();
    expect(name()).toBe('Select row 01a15bae-5c1e-4f0b-9a57-0f3c2d9e7b11');
  });
});

describe('SlDataGrid editor template', () => {
  @Component({
    standalone: true,
    imports: [SlDataGrid, SlDataGridEditorTemplate],
    template: `
      <sl-data-grid
        aria-label="Shipments"
        rowKey="id"
        [rows]="rows"
        [columns]="columns"
        [current]="{ row: 'S1', column: 'customer' }"
        (editCommit)="commits.push($event)"
      >
        <ng-template slDataGridEditor="customer" let-setDraft="setDraft" let-commit="commit">
          <button type="button" (click)="setDraft('x'); commit()">Choose x</button>
        </ng-template>
      </sl-data-grid>
    `,
  })
  class EditorHost {
    readonly rows = ROWS;
    readonly columns = COLUMNS;
    readonly commits: DataGridEditCommit<Shipment>[] = [];
  }

  it('commits a draft set in the same handler as the commit', async () => {
    await TestBed.configureTestingModule({ imports: [EditorHost] }).compileComponents();
    const fixture = TestBed.createComponent(EditorHost);
    fixture.detectChanges();
    const customer = fixture.nativeElement.querySelector(
      '[data-row="S1"] [data-column="customer"]',
    ) as HTMLElement;
    customer.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    customer.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.commits.at(-1)).toMatchObject({
      key: 'S1',
      column: 'customer',
      value: 'x',
      previous: 'Aurora',
    });
    expect(customer.hasAttribute('data-editing')).toBe(false);
  });
});
