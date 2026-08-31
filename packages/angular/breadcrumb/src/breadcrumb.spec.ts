import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlBreadcrumb } from './breadcrumb';
import { SlBreadcrumbItem } from './breadcrumb-item';
import { SlBreadcrumbLink } from './breadcrumb-link';
import { SlBreadcrumbList } from './breadcrumb-list';

@Component({
  imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList],
  template: `
    <nav slBreadcrumb id="default">
      <ol slBreadcrumbList id="list">
        <li slBreadcrumbItem><a slBreadcrumbLink href="/">Workspace</a></li>
        <li slBreadcrumbItem><a slBreadcrumbLink href="/invoices">Invoices</a></li>
        <li slBreadcrumbItem>
          <a slBreadcrumbLink current href="/invoices/42">INV-0042</a>
        </li>
      </ol>
    </nav>
    <nav slBreadcrumb id="named" aria-label="You are here"></nav>
    <h2 id="where">Location</h2>
    <nav slBreadcrumb id="pointed" aria-labelledby="where"></nav>
    <a slBreadcrumbLink id="kept" aria-current="step" current href="/step-2">Step 2</a>
  `,
})
class Host {}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    byId: (id: string) => element.querySelector<HTMLElement>(`#${id}`)!,
    links: () => [...element.querySelectorAll<HTMLElement>('#list [data-part="link"]')],
  };
}

describe('SlBreadcrumb', () => {
  it('is a named navigation landmark', () => {
    const { byId } = mount();

    expect(byId('default').getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('takes the name the consumer gave it', () => {
    const { byId } = mount();

    expect(byId('named').getAttribute('aria-label')).toBe('You are here');
  });

  it('leaves the label off when the consumer pointed at visible text instead', () => {
    const { byId } = mount();

    expect(byId('pointed').hasAttribute('aria-label')).toBe(false);
    expect(byId('pointed').getAttribute('aria-labelledby')).toBe('where');
  });

  it('is an ordered list, because the order is the information', () => {
    const { byId } = mount();

    expect(byId('list').tagName).toBe('OL');
    expect(byId('list').querySelectorAll('li')).toHaveLength(3);
  });

  it('marks the page the reader is on, and only that one', () => {
    const crumbs = mount().links();

    expect(crumbs[2]?.getAttribute('aria-current')).toBe('page');
    expect(crumbs[2]?.getAttribute('data-current')).toBe('');
    expect(crumbs[0]?.hasAttribute('aria-current')).toBe(false);
  });

  it('leaves the current page reachable, rather than dropping the link', () => {
    const crumbs = mount().links();

    expect(crumbs[2]?.getAttribute('href')).toBe('/invoices/42');
  });

  it('keeps an aria-current the consumer set rather than replacing it', () => {
    const { byId } = mount();

    expect(byId('kept').getAttribute('aria-current')).toBe('step');
  });

  it('ships no separator element for a consumer to hide', () => {
    const { byId } = mount();

    expect(byId('list').querySelectorAll('[aria-hidden]')).toHaveLength(0);
  });
});
