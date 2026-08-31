import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlSpinner } from './spinner';
import type { SpinnerSize } from './spinner';

@Component({
  imports: [SlSpinner],
  template: `
    <span slSpinner id="plain" [decorative]="decorative()" [label]="label()" [size]="size()"></span>
    <span slSpinner id="kept-role" role="progressbar"></span>
  `,
})
class Host {
  readonly decorative = signal(false);
  readonly label = signal('Loading');
  readonly size = signal<SpinnerSize>('md');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    keptRole: () => element.querySelector<HTMLElement>('#kept-role')!,
    plain: () => element.querySelector<HTMLElement>('#plain')!,
  };
}

describe('SlSpinner', () => {
  it('announces itself as a status carrying its label', () => {
    const { plain } = mount();

    expect(plain().getAttribute('role')).toBe('status');
    expect(plain().textContent?.trim()).toBe('Loading');
  });

  it('takes the label the consumer wrote', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.label.set('Fetching invoices');
    fixture.detectChanges();

    expect(plain().textContent?.trim()).toBe('Fetching invoices');
  });

  it('hides the ring itself, so only the label is read', () => {
    const { plain } = mount();

    const indicator = plain().querySelector('[data-part="indicator"]');
    expect(indicator?.getAttribute('aria-hidden')).toBe('true');
  });

  it('hides the label from sight while leaving it readable', () => {
    const { plain } = mount();

    const label = plain().querySelector('[data-part="label"]');
    expect(label?.classList.contains('slotted-visually-hidden')).toBe(true);
  });

  it('says nothing at all when it is decorative', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.decorative.set(true);
    fixture.detectChanges();

    expect(plain().hasAttribute('role')).toBe(false);
    expect(plain().getAttribute('aria-hidden')).toBe('true');
    expect(plain().querySelector('[data-part="label"]')).toBeNull();
  });

  it('states its size to the stylesheet, defaulting to medium', () => {
    const { fixture, plain } = mount();

    expect(plain().getAttribute('data-size')).toBe('md');

    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();

    expect(plain().getAttribute('data-size')).toBe('lg');
  });

  it('carries the class the stylesheet paints', () => {
    const { plain } = mount();

    expect(plain().classList.contains('slotted-spinner')).toBe(true);
  });

  it('keeps a role the consumer set rather than replacing it', () => {
    const { keptRole } = mount();

    expect(keptRole().getAttribute('role')).toBe('progressbar');
  });
});
