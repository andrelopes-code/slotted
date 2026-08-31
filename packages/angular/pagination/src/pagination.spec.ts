import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlPagination } from './pagination';
import { SlPaginationEllipsis } from './pagination-ellipsis';
import { SlPaginationItem } from './pagination-item';
import { SlPaginationList } from './pagination-list';
import { SlPaginationPage } from './pagination-page';

@Component({
  imports: [
    SlPagination,
    SlPaginationEllipsis,
    SlPaginationItem,
    SlPaginationList,
    SlPaginationPage,
  ],
  template: `
    <nav slPagination id="default">
      <ul slPaginationList id="list">
        <li slPaginationItem>
          <button slPaginationPage id="previous" disabled>Previous</button>
        </li>
        <li slPaginationItem><button slPaginationPage id="one" current>1</button></li>
        <li slPaginationItem><button slPaginationPage id="two">2</button></li>
        <li slPaginationItem><span slPaginationEllipsis id="ellipsis">&hellip;</span></li>
        <li slPaginationItem>
          <a slPaginationPage id="link" href="?page=9">9</a>
        </li>
      </ul>
    </nav>
    <h2 id="results">Results</h2>
    <nav slPagination id="pointed" aria-labelledby="results"></nav>
  `,
})
class Host {}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return { byId: (id: string) => element.querySelector<HTMLElement>(`#${id}`)! };
}

describe('SlPagination', () => {
  it('is a named navigation landmark', () => {
    const { byId } = mount();

    expect(byId('default').getAttribute('aria-label')).toBe('Pagination');
  });

  it('leaves the label off when the consumer pointed at visible text instead', () => {
    const { byId } = mount();

    expect(byId('pointed').hasAttribute('aria-label')).toBe(false);
  });

  it('is an unordered list, because the pages are siblings', () => {
    const { byId } = mount();

    expect(byId('list').tagName).toBe('UL');
  });

  it('marks the page the reader is on, and only that one', () => {
    const { byId } = mount();

    expect(byId('one').getAttribute('aria-current')).toBe('page');
    expect(byId('two').hasAttribute('aria-current')).toBe(false);
  });

  it('states disabled both to the platform and to the stylesheet', () => {
    const { byId } = mount();

    expect((byId('previous') as HTMLButtonElement).disabled).toBe(true);
    expect(byId('previous').getAttribute('data-disabled')).toBe('');
  });

  it('hides the gap, because it is not a destination', () => {
    const { byId } = mount();

    expect(byId('ellipsis').getAttribute('aria-hidden')).toBe('true');
  });

  it('sits on an anchor when the page has an address', () => {
    const { byId } = mount();

    expect(byId('link').tagName).toBe('A');
    expect(byId('link').getAttribute('href')).toBe('?page=9');
    expect(byId('link').getAttribute('data-part')).toBe('page');
  });

  it('never puts a disabled attribute on an anchor, which cannot carry one', () => {
    const { byId } = mount();

    expect(byId('link').hasAttribute('disabled')).toBe(false);
  });
});
