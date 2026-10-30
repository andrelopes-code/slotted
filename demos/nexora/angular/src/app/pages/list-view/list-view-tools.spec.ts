import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  emptyQuery,
  type GridColumn,
  type GridOutOfSpace,
  type GridQuery,
} from '@slotted/core/grid';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideTestBackend } from '../../../test/testing';
import { listView } from './list-view';
import { ListViewTools } from './list-view-tools';

const COLUMNS: readonly GridColumn<never>[] = [
  { id: 'name', label: 'Name', rowHeader: true },
  { id: 'status', label: 'Status', priority: 1 },
  { id: 'owner', label: 'Owner', priority: 2 },
  { id: 'actions', label: 'Actions', kind: 'actions' },
];

@Component({
  selector: 'app-list-view-tools-host',
  imports: [ListViewTools],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-list-view-tools
      label="Row"
      [view]="view"
      [columns]="columns"
      [outOfSpace]="outOfSpace()"
    />
  `,
})
class Host {
  readonly columns = COLUMNS;
  readonly query = signal<GridQuery>(emptyQuery({ index: 2, size: 25 }));
  readonly outOfSpace = signal<GridOutOfSpace>({ popin: [], hidden: [] });
  readonly view = listView({
    page: 'list-view-tools-spec',
    columns: COLUMNS,
    query: this.query,
    defaultQuery: emptyQuery({ index: 0, size: 25 }),
    applyQuery: (query) => this.query.set(query),
  });
}

describe('ListViewTools — the Sort menu', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideTestBackend()] });
  });

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const trigger = () =>
      fixture.nativeElement.querySelector(
        '[data-testid="sort-trigger"]',
      ) as HTMLButtonElement | null;
    const items = () => [...document.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')];
    const item = (column: string) =>
      items().find((element) => element.getAttribute('aria-label')?.startsWith(`${column},`));
    const clear = () =>
      [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
        (element) => element.textContent?.trim() === 'Clear sort',
      );
    const press = (element: HTMLElement | undefined) => {
      element!.click();
      fixture.detectChanges();
    };
    return { fixture, host: fixture.componentInstance, trigger, items, item, clear, press };
  }

  it('stays out of the bar while every column has a header', () => {
    const { trigger } = render();

    expect(trigger()).toBeNull();
  });

  it('moves each column through the order as Shift and a header press do, and keeps the menu open', async () => {
    const { fixture, host, trigger, items, item, clear, press } = render();
    host.outOfSpace.set({ popin: ['owner'], hidden: [] });
    fixture.detectChanges();
    press(trigger()!);
    await fixture.whenStable();

    expect(items().map((element) => element.getAttribute('aria-label'))).toEqual([
      'Name, not sorted',
      'Status, not sorted',
      'Owner, not sorted',
    ]);
    expect(clear()!.getAttribute('aria-disabled')).toBe('true');

    press(item('Owner'));
    expect(host.query().sort).toEqual([{ column: 'owner', direction: 'ascending' }]);
    expect(host.query().page).toEqual({ index: 0, size: 25 });
    expect(item('Owner')!.getAttribute('aria-checked')).toBe('true');
    expect(item('Owner')!.getAttribute('aria-label')).toBe('Owner, ascending');

    press(item('Status'));
    expect(host.query().sort).toEqual([
      { column: 'owner', direction: 'ascending' },
      { column: 'status', direction: 'ascending' },
    ]);
    expect(item('Status')!.getAttribute('aria-label')).toBe('Status, ascending, sort level 2');
    expect(item('Status')!.textContent).toContain('↑ 2');

    press(item('Owner'));
    expect(item('Owner')!.getAttribute('aria-label')).toBe('Owner, descending, sort level 1');

    press(item('Owner'));
    expect(host.query().sort).toEqual([{ column: 'status', direction: 'ascending' }]);
    expect(item('Owner')!.getAttribute('aria-checked')).toBe('false');
    expect(item('Status')!.getAttribute('aria-label')).toBe('Status, ascending');

    press(clear());
    expect(host.query().sort).toEqual([]);
  });
});
