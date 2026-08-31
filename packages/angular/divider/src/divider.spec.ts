import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlDivider } from './divider';
import type { DividerOrientation } from './divider';

@Component({
  imports: [SlDivider],
  template: `
    <hr slDivider id="plain" [decorative]="decorative()" [orientation]="orientation()" />
    <hr slDivider id="kept-role" decorative role="presentation" />
  `,
})
class Host {
  readonly decorative = signal(false);
  readonly orientation = signal<DividerOrientation>('horizontal');
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

describe('SlDivider', () => {
  it('is a separator by default, without being told to be one', () => {
    const { plain } = mount();

    expect(plain().tagName).toBe('HR');
    expect(plain().hasAttribute('role')).toBe(false);
  });

  it('carries the class the stylesheet paints', () => {
    const { plain } = mount();

    expect(plain().classList.contains('slotted-divider')).toBe(true);
  });

  it('leaves the accessibility tree when it is decorative', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.decorative.set(true);
    fixture.detectChanges();

    expect(plain().getAttribute('role')).toBe('none');
  });

  it('announces a vertical separator as vertical', () => {
    const { fixture, plain } = mount();

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(plain().getAttribute('aria-orientation')).toBe('vertical');
    expect(plain().getAttribute('data-orientation')).toBe('vertical');
  });

  it('leaves aria-orientation off a horizontal separator, which is the default', () => {
    const { plain } = mount();

    expect(plain().hasAttribute('aria-orientation')).toBe(false);
    expect(plain().getAttribute('data-orientation')).toBe('horizontal');
  });

  it('keeps the role the consumer set rather than replacing it', () => {
    const { keptRole } = mount();

    expect(keptRole().getAttribute('role')).toBe('presentation');
  });
});
