import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlKbd } from './kbd';
import type { KbdSize } from './kbd';

@Component({
  imports: [SlKbd],
  template: `
    <kbd slKbd id="plain" [size]="size()">K</kbd>
    <kbd slKbd id="labelled" aria-label="Command">&#8984;</kbd>
  `,
})
class Host {
  readonly size = signal<KbdSize>('md');
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

describe('SlKbd', () => {
  it('renders the element the platform already has for a key', () => {
    const { plain } = mount();

    expect(plain().tagName).toBe('KBD');
    expect(plain().textContent?.trim()).toBe('K');
  });

  it('states its size to the stylesheet, defaulting to medium', () => {
    const { fixture, plain } = mount();

    expect(plain().getAttribute('data-size')).toBe('md');

    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();

    expect(plain().getAttribute('data-size')).toBe('sm');
  });

  it('carries the class the stylesheet paints', () => {
    const { plain } = mount();

    expect(plain().classList.contains('slotted-kbd')).toBe(true);
  });

  it('leaves the accessible name the consumer wrote alone', () => {
    const { labelled } = mount();

    expect(labelled().getAttribute('aria-label')).toBe('Command');
  });
});
