import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlVisuallyHidden } from './visually-hidden';

@Component({
  imports: [SlVisuallyHidden],
  template: `
    <span slVisuallyHidden [focusable]="focusable()" class="app-announcement" id="announcement"
      >Saved</span
    >
    <a slVisuallyHidden focusable href="#main">Skip to content</a>
  `,
})
class Host {
  readonly focusable = signal(false);
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    link: () => element.querySelector<HTMLElement>('a')!,
    span: () => element.querySelector<HTMLElement>('span')!,
  };
}

describe('SlVisuallyHidden', () => {
  it('leaves its content in the accessibility tree', () => {
    const { span } = mount();

    expect(span().textContent?.trim()).toBe('Saved');
    expect(span().hasAttribute('aria-hidden')).toBe(false);
  });

  it('carries the class the stylesheet hides', () => {
    const { span } = mount();

    expect(span().classList.contains('slotted-visually-hidden')).toBe(true);
  });

  it('keeps the class the consumer passed alongside its own', () => {
    const { span } = mount();

    expect(span().classList.contains('app-announcement')).toBe(true);
  });

  it('leaves the attributes the consumer set untouched', () => {
    const { span } = mount();

    expect(span().getAttribute('id')).toBe('announcement');
  });

  it('omits the marker when the content stays hidden under focus', () => {
    const { span } = mount();

    expect(span().hasAttribute('data-focusable')).toBe(false);
  });

  it('marks the focusable variant so focus can reveal it', () => {
    const { fixture, span } = mount();

    fixture.componentInstance.focusable.set(true);
    fixture.detectChanges();

    expect(span().getAttribute('data-focusable')).toBe('');
  });

  it('applies to any element, so a skip link stays an anchor', () => {
    const { link } = mount();

    expect(link().classList.contains('slotted-visually-hidden')).toBe(true);
    expect(link().getAttribute('data-focusable')).toBe('');
    expect(link().getAttribute('href')).toBe('#main');
  });
});
