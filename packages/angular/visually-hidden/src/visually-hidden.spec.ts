import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlVisuallyHidden } from './visually-hidden';

@Component({
  imports: [SlVisuallyHidden],
  template: `
    <span
      slVisuallyHidden
      [focusable]="focusable()"
      class="app-announcement"
      id="announcement"
      aria-live="polite"
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

  it('names itself with the identifier the stylesheet hides', () => {
    const { span } = mount();

    expect(span().getAttribute('data-ui')).toBe('visually-hidden');
    expect(span().getAttribute('data-part')).toBe('root');
  });

  it('keeps the class the consumer passed and adds none of its own', () => {
    const { span } = mount();

    expect([...span().classList]).toEqual(['app-announcement']);
  });

  it('leaves the attributes the consumer set untouched', () => {
    const { span } = mount();

    expect(span().getAttribute('id')).toBe('announcement');
    expect(span().getAttribute('aria-live')).toBe('polite');
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

    expect(link().getAttribute('data-ui')).toBe('visually-hidden');
    expect(link().getAttribute('data-focusable')).toBe('');
    expect(link().getAttribute('href')).toBe('#main');
  });
});
