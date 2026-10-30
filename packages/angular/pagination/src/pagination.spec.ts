import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/pagination/contract.json';
import {
  SlPagination,
  SlPaginationFirst,
  SlPaginationItems,
  SlPaginationLast,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
} from './pagination';
import { providePaginationDefaults } from './pagination.constants';

@Component({
  imports: [
    SlPagination,
    SlPaginationFirst,
    SlPaginationItems,
    SlPaginationLast,
    SlPaginationNext,
    SlPaginationPageSize,
    SlPaginationPrevious,
    SlPaginationStatus,
  ],
  template: `<nav
    slPagination
    [count]="count()"
    [page]="page()"
    [defaultPage]="defaultPage()"
    [loading]="loading()"
    [disabled]="disabled()"
    [itemHref]="itemHref()"
    (pageChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  >
    <button slPaginationFirst type="button"></button>
    <button slPaginationPrevious type="button"></button>
    <sl-pagination-items />
    <button slPaginationNext type="button"></button>
    <button slPaginationLast type="button"></button>
    <sl-pagination-page-size />
    <p slPaginationStatus></p>
  </nav>`,
})
class TestHost {
  readonly count = signal<number | undefined>(482);
  readonly page = signal<number | undefined>(undefined);
  readonly defaultPage = signal(1);
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly itemHref = signal<((page: number) => string) | undefined>(undefined);
  readonly onPageChange = vi.fn();
  readonly onPageSizeChange = vi.fn();
}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="pagination"]') as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    part: (name: string) => root.querySelector(`[data-part="${name}"]`) as HTMLElement,
    pages: () =>
      [...root.querySelectorAll('[data-part="page"]')].map((page) => page.textContent?.trim()),
    current: () => root.querySelector('[aria-current="page"]') as HTMLElement | null,
    settle: () => fixture.detectChanges(),
  };
}

describe('SlPagination', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { root, part } = setup();

    expect(root.tagName).toBe('NAV');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(root.getAttribute('aria-label')).toBe('Pagination');
    expect(part('list').tagName).toBe('UL');
    expect(part('summary')).not.toBeNull();
  });

  it('draws the row the shared arithmetic produced', () => {
    const { host, pages, settle } = setup();
    host.defaultPage.set(7);
    settle();

    expect(pages()).toEqual(['1', '6', '7', '8', '25']);
    expect(contract.arithmetic).toBe('@slotted/core/pagination');
  });

  it('marks the current page with the value the specification names', () => {
    const { current, host, settle } = setup();
    host.defaultPage.set(3);
    settle();

    expect(current()?.textContent?.trim()).toBe('3');
    expect(current()?.getAttribute('aria-current')).toBe('page');
  });

  it('names every control so a reader hears which page it moves to', () => {
    const { part } = setup();

    expect(part('first').getAttribute('aria-label')).toBe('First page');
    expect(part('previous').getAttribute('aria-label')).toBe('Previous page');
    expect(part('next').getAttribute('aria-label')).toBe('Next page');
    expect(part('last').getAttribute('aria-label')).toBe('Last page');
  });

  it('draws one chevron for a step and two for an end, each mirrored with the text', () => {
    const { part } = setup();

    const glyphs = ['first', 'previous', 'next', 'last'].map((name) => {
      const box = part(name).querySelector('[data-ui="icon"]');
      expect(box?.hasAttribute('data-directional')).toBe(true);
      return box?.querySelector('svg[data-glyph]')?.getAttribute('data-glyph');
    });
    expect(glyphs).toEqual(['chevrons-right', 'chevron-right', 'chevron-right', 'chevrons-right']);
    expect(
      part('page-size-label').querySelector(
        ':scope > [data-ui="icon"] > svg[data-glyph="chevron-down"]',
      ),
    ).not.toBeNull();
  });

  it('moves the page when a trigger is pressed, and carries the reason', () => {
    const { host, part, current, settle } = setup();

    part('next').click();
    settle();

    expect(host.onPageChange).toHaveBeenCalledWith(
      expect.objectContaining({ previous: 1, reason: 'pointer', value: 2 }),
    );
    expect(current()?.textContent?.trim()).toBe('2');
  });

  it('never moves state the consumer owns', () => {
    const { host, part, current, settle } = setup();
    host.page.set(4);
    settle();

    part('next').click();
    settle();

    expect(host.onPageChange).toHaveBeenCalledWith(expect.objectContaining({ value: 5 }));
    expect(current()?.textContent?.trim()).toBe('4');
  });

  /** The collection shrank under a reader who was past its new end. */
  it('clamps a page the collection no longer has, and reports the clamp', () => {
    const { host, current, settle } = setup();
    host.page.set(40);
    host.count.set(40);
    settle();

    expect(current()?.textContent?.trim()).toBe('2');
    expect(host.onPageChange).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'programmatic', value: 2 }),
    );
  });

  it('keeps the reader first item visible when the page size changes', () => {
    const { host, part, settle } = setup();
    host.defaultPage.set(7);
    settle();

    const select = part('page-size') as HTMLSelectElement;
    select.value = '100';
    select.dispatchEvent(new Event('change'));
    settle();

    expect(host.onPageSizeChange).toHaveBeenCalledWith(
      expect.objectContaining({ previous: 20, reason: 'select', value: 100 }),
    );
    expect(part('status').textContent).toContain('101–200 of 482');
  });

  it('says which items this page holds, politely, and which page it is', () => {
    const { host, part, settle } = setup();
    host.defaultPage.set(7);
    settle();

    expect(part('status').textContent).toContain('121–140 of 482');
    expect(part('status').getAttribute('aria-live')).toBe('polite');
    expect(part('summary').textContent).toContain('Page 7 of 25');
  });

  it('draws no page numbers and invents no total the server did not give', () => {
    const { host, part, settle } = setup();
    host.count.set(undefined);
    settle();

    expect(part('list')).toBeNull();
    expect(part('previous').hasAttribute('disabled')).toBe(true);
    expect(part('next').hasAttribute('disabled')).toBe(false);
  });

  it('leaves a button at a bound to the native disabled, as React does', () => {
    const { part, settle } = setup();
    settle();

    expect(part('previous').hasAttribute('disabled')).toBe(true);
    expect(part('previous').hasAttribute('aria-disabled')).toBe(false);
  });

  it('refuses every move while a page change is in flight', () => {
    const { host, root, part, settle } = setup();
    host.loading.set(true);
    settle();

    part('next').click();
    settle();

    expect(host.onPageChange).not.toHaveBeenCalled();
    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.getAttribute('data-loading')).toBe('');
  });

  it('gives every control a real destination in link mode', () => {
    @Component({
      imports: [SlPagination, SlPaginationNext],
      template: `<nav slPagination [count]="200" [itemHref]="href">
        <a slPaginationNext></a>
      </nav>`,
    })
    class Linked {
      readonly href = (page: number) => `/invoices?page=${page}`;
    }

    TestBed.configureTestingModule({ imports: [Linked] });
    const fixture = TestBed.createComponent(Linked);
    fixture.detectChanges();

    const next = fixture.nativeElement.querySelector('[data-part="next"]') as HTMLAnchorElement;
    expect(next.tagName).toBe('A');
    expect(next.getAttribute('href')).toBe('/invoices?page=2');
  });

  it('takes the application defaults, and yields to an explicit input', () => {
    const { pages } = setup([providePaginationDefaults({ siblingCount: 2 })]);

    expect(pages()).toEqual(['1', '2', '3', '4', '5', '6', '7', '25']);
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { part, root, settle } = setup([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);

    // language: pt-BR
    expect(root.getAttribute('aria-label')).toBe('Paginação');
    expect(part('next').getAttribute('aria-label')).toBe('Próxima página');
    // language: en-US

    locale.set('en-US');
    settle();
    expect(part('next').getAttribute('aria-label')).toBe('Next page');
  });
});
