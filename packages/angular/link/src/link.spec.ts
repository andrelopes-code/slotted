import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlLink } from './link';
import type { LinkUnderline } from './link';

@Component({
  imports: [SlLink],
  template: `
    <a
      slLink
      id="plain"
      href="/invoices"
      [external]="external()"
      [externalHint]="externalHint()"
      [underline]="underline()"
      >Invoices</a
    >
    <a slLink id="kept" external href="https://example.com" rel="me" target="_self">Docs</a>
  `,
})
class Host {
  readonly external = signal(false);
  readonly externalHint = signal('(opens in a new tab)');
  readonly underline = signal<LinkUnderline>('always');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    kept: () => element.querySelector<HTMLElement>('#kept')!,
    plain: () => element.querySelector<HTMLElement>('#plain')!,
  };
}

describe('SlLink', () => {
  it('renders an anchor carrying the href it was given', () => {
    const { plain } = mount();

    expect(plain().tagName).toBe('A');
    expect(plain().getAttribute('href')).toBe('/invoices');
    expect(plain().classList.contains('slotted-link')).toBe(true);
  });

  it('is underlined unless told otherwise', () => {
    const { fixture, plain } = mount();

    expect(plain().getAttribute('data-underline')).toBe('always');

    fixture.componentInstance.underline.set('none');
    fixture.detectChanges();

    expect(plain().getAttribute('data-underline')).toBe('none');
  });

  it('says nothing extra when the link stays in the page', () => {
    const { plain } = mount();

    expect(plain().textContent?.trim()).toBe('Invoices');
    expect(plain().hasAttribute('target')).toBe(false);
    expect(plain().querySelector('[data-part="external-hint"]')).toBeNull();
  });

  it('warns that an external link leaves the page', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.external.set(true);
    fixture.detectChanges();

    expect(plain().textContent).toBe('Invoices (opens in a new tab)');
    expect(
      plain()
        .querySelector('[data-part="external-hint"]')
        ?.classList.contains('slotted-visually-hidden'),
    ).toBe(true);
  });

  it('takes the wording of the warning from the consumer', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.external.set(true);
    fixture.componentInstance.externalHint.set('(abre numa nova aba)');
    fixture.detectChanges();

    expect(plain().textContent).toBe('Invoices (abre numa nova aba)');
  });

  it('opens an external link in a new tab without leaking the opener', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.external.set(true);
    fixture.detectChanges();

    expect(plain().getAttribute('target')).toBe('_blank');
    expect(plain().getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps the target and rel the consumer set', () => {
    const { kept } = mount();

    expect(kept().getAttribute('target')).toBe('_self');
    expect(kept().getAttribute('rel')).toBe('me');
  });
});
