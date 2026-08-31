import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlBadge } from './badge';
import type { BadgeFill, BadgeSize, BadgeVariant } from './badge';

@Component({
  imports: [SlBadge],
  template: `
    <span slBadge id="plain" [fill]="fill()" [size]="size()" [variant]="variant()">Paid</span>
    <span slBadge id="labelled" aria-label="Three unread messages">3</span>
  `,
})
class Host {
  readonly fill = signal<BadgeFill>('solid');
  readonly size = signal<BadgeSize>('md');
  readonly variant = signal<BadgeVariant>('secondary');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    labelled: () => element.querySelector<HTMLElement>('#labelled')!,
    plain: () => element.querySelector<HTMLElement>('#plain')!,
  };
}

describe('SlBadge', () => {
  it('renders its content with no role of its own', () => {
    const { plain } = mount();

    expect(plain().tagName).toBe('SPAN');
    expect(plain().hasAttribute('role')).toBe(false);
    expect(plain().textContent?.trim()).toBe('Paid');
  });

  it('states the quietest appearance when it is given none', () => {
    const { plain } = mount();

    expect(plain().getAttribute('data-variant')).toBe('secondary');
    expect(plain().getAttribute('data-fill')).toBe('solid');
    expect(plain().getAttribute('data-size')).toBe('md');
  });

  it('states every axis it was given to the stylesheet', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.fill.set('outline');
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();

    expect(plain().getAttribute('data-variant')).toBe('danger');
    expect(plain().getAttribute('data-fill')).toBe('outline');
    expect(plain().getAttribute('data-size')).toBe('sm');
  });

  it('carries the class the stylesheet paints', () => {
    const { plain } = mount();

    expect(plain().classList.contains('slotted-badge')).toBe(true);
  });

  it('leaves the accessible name the consumer wrote alone', () => {
    const { labelled } = mount();

    expect(labelled().getAttribute('aria-label')).toBe('Three unread messages');
  });
});
