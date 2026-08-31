import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlCollapsible } from './collapsible';
import { SlCollapsibleContent } from './collapsible-content';
import { SlCollapsibleTrigger } from './collapsible-trigger';

@Component({
  imports: [SlCollapsible, SlCollapsibleContent, SlCollapsibleTrigger],
  template: `
    <details slCollapsible id="collapsible" [(open)]="open">
      <summary slCollapsibleTrigger id="trigger">Billing details</summary>
      <div slCollapsibleContent id="content">Invoices are issued monthly.</div>
    </details>
  `,
})
class Host {
  readonly open = signal(false);
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    content: () => element.querySelector<HTMLElement>('#content')!,
    details: () => element.querySelector<HTMLDetailsElement>('#collapsible')!,
    fixture,
    trigger: () => element.querySelector<HTMLElement>('#trigger')!,
  };
}

const toggle = (element: HTMLDetailsElement, open: boolean) => {
  element.open = open;
  element.dispatchEvent(new Event('toggle'));
};

describe('SlCollapsible', () => {
  it('is the platform disclosure, not a button and a div', () => {
    const { details, trigger } = mount();

    expect(details().tagName).toBe('DETAILS');
    expect(trigger().tagName).toBe('SUMMARY');
  });

  it('starts closed unless told otherwise', () => {
    const { details } = mount();

    expect(details().hasAttribute('open')).toBe(false);
  });

  it('opens when the consumer sets the value', () => {
    const { details, fixture } = mount();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(details().hasAttribute('open')).toBe(true);
  });

  it('writes the reader’s change back through the two-way binding', () => {
    const { details, fixture } = mount();

    toggle(details(), true);
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('adds no ARIA of its own, because the element already carries it', () => {
    const { details, trigger } = mount();

    expect(details().hasAttribute('role')).toBe(false);
    expect(details().hasAttribute('aria-expanded')).toBe(false);
    expect(trigger().hasAttribute('aria-controls')).toBe(false);
  });

  it('names each part so the stylesheet can reach it', () => {
    const { content, details, trigger } = mount();

    expect(details().getAttribute('data-part')).toBe('root');
    expect(trigger().getAttribute('data-part')).toBe('trigger');
    expect(content().getAttribute('data-part')).toBe('content');
  });

  it('carries the class the stylesheet paints', () => {
    const { details } = mount();

    expect(details().classList.contains('slotted-collapsible')).toBe(true);
  });
});
