import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { SlButton } from './button';

@Component({
  imports: [SlButton],
  template: `
    <button
      slButton
      [aria-busy]="ariaBusy()"
      [aria-disabled]="ariaDisabled()"
      [variant]="variant()"
      [tone]="tone()"
      [size]="size()"
      [type]="type()"
      [disabled]="disabled()"
      [fullWidth]="fullWidth()"
      [loading]="loading()"
      [loadingText]="loadingText()"
      (click)="onClick()"
    >
      <span slButtonLeading>L</span>
      Save
      <span slButtonTrailing>T</span>
      @if (customLoadingIndicator()) {
        <span slButtonLoadingIndicator>Custom indicator</span>
      }
    </button>
  `,
})
class TestHost {
  readonly variant = signal<'solid' | 'outline' | 'ghost'>('solid');
  readonly tone = signal<'neutral' | 'accent' | 'success' | 'warning' | 'danger'>('accent');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  readonly disabled = signal(false);
  readonly fullWidth = signal(false);
  readonly loading = signal(false);
  readonly loadingText = signal<string | undefined>(undefined);
  readonly ariaBusy = signal<boolean | string | null>(null);
  readonly ariaDisabled = signal<boolean | string | null>(null);
  readonly customLoadingIndicator = signal(false);
  readonly clickSpy = vi.fn();
  onClick() {
    this.clickSpy();
  }
}

describe('SlButton', () => {
  it('renders native safe defaults and logical parts', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.localName).toBe(contract.members.button.nativeElement);
    expect(button.dataset['slottedComponent']).toBe('button');
    expect(button.type).toBe(contract.members.button.defaults.type);
    expect(button.dataset['variant']).toBe(contract.members.button.defaults.variant);
    expect(button.dataset['tone']).toBe(contract.members.button.defaults.tone);
    expect(button.dataset['size']).toBe(contract.members.button.defaults.size);
    const parts = [...button.querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );
    expect(parts).toEqual(contract.members.button.parts.slice(0, 3));
  });

  it('updates inputs and preserves native events', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.type.set('submit');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.dataset['variant']).toBe('outline');
    expect(button.type).toBe('submit');
    expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
  });

  it('preserves native disabled behavior', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.dataset['state']).toBe('disabled');
    expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
  });

  it('matches the shared contract axes', () => {
    expect(BUTTON_VARIANTS).toEqual(contract.axes.variant);
    expect(BUTTON_TONES).toEqual(contract.axes.tone);
    expect(BUTTON_SIZES).toEqual(contract.axes.size);
  });

  it('blocks activation while loading without using native disabled', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.focus();
    button.click();
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.dataset['state']).toBe('loading');
    expect(document.activeElement).toBe(button);
    expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
  });

  it('renders explicit loading text and a replaceable indicator slot', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.loadingText.set('Saving');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Saving');
    expect(button.querySelector('[data-part="loading-indicator"]')).not.toBeNull();
  });

  it('exposes full-width layout as a data fact', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.fullWidth.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('data-full-width')).toBe('');
  });

  it('keeps its projected label as the accessible name for blank loading text', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.loadingText.set('   ');
    await fixture.whenStable();
    const content = fixture.nativeElement.querySelector(
      '.slotted-button__content',
    ) as HTMLSpanElement;
    expect(content.getAttribute('aria-hidden')).toBeNull();
    expect(content.textContent).toContain('Save');
  });

  it('replaces projected content only for meaningful loading text', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.loadingText.set('Saving');
    await fixture.whenStable();
    const content = fixture.nativeElement.querySelector(
      '.slotted-button__content',
    ) as HTMLSpanElement;
    const loading = fixture.nativeElement.querySelector(
      '.slotted-button__loading',
    ) as HTMLSpanElement;
    expect(content.getAttribute('aria-hidden')).toBe('true');
    expect(loading.textContent).toContain('Saving');
  });

  it.each([true, 'true'] as const)(
    'blocks activation for raw aria-disabled value %s without native disabled state',
    async (ariaDisabled) => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.ariaDisabled.set(ariaDisabled);
      await fixture.whenStable();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      button.click();
      expect(button.disabled).toBe(false);
      expect(button.dataset['state']).toBeUndefined();
      expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
    },
  );

  it.each([false, 'false'] as const)(
    'keeps raw aria-disabled value %s active',
    async (ariaDisabled) => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.ariaDisabled.set(ariaDisabled);
      await fixture.whenStable();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      button.click();
      expect(button.disabled).toBe(false);
      expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
    },
  );

  it('projects a custom loading indicator into the loading indicator part', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.customLoadingIndicator.set(true);
    await fixture.whenStable();
    const indicator = fixture.nativeElement.querySelector(
      '[data-part="loading-indicator"]',
    ) as HTMLSpanElement;
    expect(indicator.textContent).toContain('Custom indicator');
  });
});
