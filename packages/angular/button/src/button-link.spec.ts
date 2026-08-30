import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { SlButtonLink } from './button-link';

@Component({
  imports: [SlButtonLink],
  template: `
    <a
      slButtonLink
      href="/settings"
      [aria-disabled]="ariaDisabled()"
      [disabled]="disabled()"
      [tabIndex]="tabIndex()"
      [fullWidth]="fullWidth()"
      [size]="size()"
      [fill]="fill()"
      [variant]="variant()"
      (click)="onClick($event)"
      (auxclick)="onAuxClick($event)"
      (keydown)="onKeydown($event)"
    >
      <span slButtonLeading>L</span>Settings<span slButtonTrailing>T</span>
    </a>
  `,
})
class TestHost {
  readonly disabled = signal(false);
  readonly ariaDisabled = signal<boolean | string | null>(null);
  readonly tabIndex = signal<number | string | null>(null);
  readonly fullWidth = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly fill = signal<'solid' | 'outline' | 'ghost'>('solid');
  readonly variant = signal<'accent' | 'secondary' | 'success' | 'warning' | 'danger'>('accent');
  readonly clickSpy = vi.fn();
  readonly auxClickSpy = vi.fn();
  readonly keySpy = vi.fn();

  onClick(event: Event) {
    event.preventDefault();
    this.clickSpy();
  }

  onAuxClick(event: Event) {
    event.preventDefault();
    this.auxClickSpy();
  }

  onKeydown(event: KeyboardEvent) {
    void event;
    this.keySpy();
  }
}

function keyboardEvent(key: string) {
  return new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
}

describe('SlButtonLink', () => {
  it('renders a native anchor with navigation, defaults, and logical parts', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(anchor.localName).toBe(contract.members.buttonLink.nativeElement);
    expect(anchor.getAttribute('href')).toBe('/settings');
    expect(anchor.dataset['slottedComponent']).toBe('button-link');
    expect(anchor.dataset['variant']).toBe('accent');
    expect(anchor.dataset['fill']).toBe('solid');
    expect(anchor.dataset['size']).toBe('md');
    expect(
      [...anchor.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part')),
    ).toEqual(contract.members.buttonLink.parts);
    expect(anchor.querySelector('[data-part="label"]')?.textContent?.trim()).toBe('Settings');
    expect(anchor.textContent?.trim()).toContain('Settings');
  });

  it('reflects appearance input bindings as data attributes', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.fullWidth.set(true);
    fixture.componentInstance.size.set('lg');
    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.fill.set('outline');
    await fixture.whenStable();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(anchor.getAttribute('data-full-width')).toBe('');
    expect(anchor.dataset['size']).toBe('lg');
    expect(anchor.dataset['variant']).toBe('danger');
    expect(anchor.dataset['fill']).toBe('outline');
  });

  it('preserves native anchor attributes, classes, and DOM reference behavior', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    anchor.classList.add('consumer-link');
    anchor.setAttribute('target', '_blank');
    anchor.focus();
    expect(anchor.classList).toContain('slotted-button');
    expect(anchor.classList).toContain('consumer-link');
    expect(anchor.target).toBe('_blank');
    expect(document.activeElement).toBe(anchor);
  });

  it('blocks explicit disabled activation and removes default tab access', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const clickCaptureSpy = vi.fn();
    const auxClickCaptureSpy = vi.fn();
    const keyCaptureSpy = vi.fn();
    anchor.addEventListener('click', clickCaptureSpy, true);
    anchor.addEventListener('auxclick', auxClickCaptureSpy, true);
    anchor.addEventListener('keydown', keyCaptureSpy, true);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const auxClick = new MouseEvent('auxclick', { bubbles: true, cancelable: true });
    const enter = keyboardEvent('Enter');
    const space = keyboardEvent(' ');

    anchor.dispatchEvent(click);
    anchor.dispatchEvent(auxClick);
    anchor.dispatchEvent(enter);
    anchor.dispatchEvent(space);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.dataset['disabled']).toBe('');
    expect(anchor.tabIndex).toBe(-1);
    expect([click, auxClick, enter, space].every((event) => event.defaultPrevented)).toBe(true);
    expect(clickCaptureSpy).not.toHaveBeenCalled();
    expect(auxClickCaptureSpy).not.toHaveBeenCalled();
    expect(keyCaptureSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.auxClickSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.keySpy).not.toHaveBeenCalled();
  });

  it('honors an explicit disabled tabIndex', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.tabIndex.set(0);
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('a') as HTMLAnchorElement).tabIndex).toBe(0);
  });

  it('lets non-activation keys reach the consumer while explicitly disabled', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const event = keyboardEvent('ArrowDown');
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    const captureSpy = vi.fn();
    anchor.addEventListener('keydown', captureSpy, true);
    anchor.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(captureSpy).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.keySpy).toHaveBeenCalledOnce();
  });

  it('allows enabled click, auxiliary click, and key handlers', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    anchor.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true }));
    anchor.dispatchEvent(keyboardEvent('Enter'));
    expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.auxClickSpy).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.keySpy).toHaveBeenCalledOnce();
  });

  it.each([true, 'true'] as const)(
    'blocks raw aria-disabled %s activation before consumer handlers',
    async (ariaDisabled) => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.ariaDisabled.set(ariaDisabled);
      await fixture.whenStable();
      const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      const clickCaptureSpy = vi.fn();
      const auxClickCaptureSpy = vi.fn();
      const keyCaptureSpy = vi.fn();
      anchor.addEventListener('click', clickCaptureSpy, true);
      anchor.addEventListener('auxclick', auxClickCaptureSpy, true);
      anchor.addEventListener('keydown', keyCaptureSpy, true);
      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      const auxClick = new MouseEvent('auxclick', { bubbles: true, cancelable: true });
      const enter = keyboardEvent('Enter');
      const space = keyboardEvent(' ');
      anchor.dispatchEvent(click);
      anchor.dispatchEvent(auxClick);
      anchor.dispatchEvent(enter);
      anchor.dispatchEvent(space);
      expect([click, auxClick, enter, space].every((event) => event.defaultPrevented)).toBe(true);
      expect(clickCaptureSpy).not.toHaveBeenCalled();
      expect(auxClickCaptureSpy).not.toHaveBeenCalled();
      expect(keyCaptureSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.auxClickSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.keySpy).not.toHaveBeenCalled();
      expect(anchor.dataset['disabled']).toBeUndefined();
      expect(anchor.hasAttribute('tabindex')).toBe(false);
    },
  );

  it.each([false, 'false'] as const)(
    'keeps raw aria-disabled %s interactive',
    async (ariaDisabled) => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.ariaDisabled.set(ariaDisabled);
      await fixture.whenStable();
      const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
    },
  );

  it('removes its capture guard when destroyed', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    fixture.destroy();
    const observer = vi.fn((event: Event) => event.preventDefault());
    anchor.addEventListener('click', observer, true);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    anchor.dispatchEvent(click);
    expect(observer).toHaveBeenCalledOnce();
    expect(click.defaultPrevented).toBe(true);
  });
});
