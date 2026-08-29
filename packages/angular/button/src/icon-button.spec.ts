import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlIconButton } from './icon-button';

@Component({
  imports: [SlIconButton],
  template: `
    <button
      slIconButton
      aria-label="Close"
      [aria-busy]="ariaBusy()"
      [aria-disabled]="ariaDisabled()"
      [variant]="variant()"
      [tone]="tone()"
      [size]="size()"
      [type]="type()"
      [disabled]="disabled()"
      [fullWidth]="fullWidth()"
      [loading]="loading()"
      (click)="clickSpy()"
    >
      <span aria-hidden="true">×</span>
      @if (customLoadingIndicator()) {
        <span slButtonLoadingIndicator>Custom indicator</span>
      }
    </button>
  `,
})
class NamedHost {
  readonly ariaBusy = signal<boolean | string | null>(null);
  readonly ariaDisabled = signal<boolean | string | null>(null);
  readonly variant = signal<'solid' | 'outline' | 'ghost'>('ghost');
  readonly tone = signal<'neutral' | 'accent' | 'success' | 'warning' | 'danger'>('neutral');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  readonly disabled = signal(false);
  readonly fullWidth = signal(false);
  readonly loading = signal(false);
  readonly customLoadingIndicator = signal(false);
  readonly clickSpy = vi.fn();
}

@Component({
  imports: [SlIconButton],
  template: '<button slIconButton><span aria-hidden="true">×</span></button>',
})
class UnnamedHost {}

@Component({
  imports: [SlIconButton],
  template: '<button slIconButton aria-label=""><span aria-hidden="true">×</span></button>',
})
class EmptyNamedHost {}

@Component({
  imports: [SlIconButton],
  template:
    '<span id="label">Close</span><button slIconButton aria-labelledby="label"><span aria-hidden="true">×</span></button>',
})
class LabelledByHost {}

@Component({
  imports: [SlIconButton],
  template: '<button slIconButton aria-label=" "><span aria-hidden="true">×</span></button>',
})
class WhitespaceNamedHost {}

describe('SlIconButton', () => {
  it('renders a native icon button with safe defaults and an explicit accessible name', async () => {
    const fixture = TestBed.createComponent(NamedHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.localName).toBe('button');
    expect(button.type).toBe('button');
    expect(button.dataset['slottedComponent']).toBe('icon-button');
    expect(button.dataset['partRoot']).toBe('icon');
    expect(button.dataset['variant']).toBe('ghost');
    expect(button.dataset['tone']).toBe('neutral');
    expect(button.dataset['size']).toBe('md');
    expect(button.getAttribute('aria-label')).toBe('Close');
    expect(button.querySelector('[data-part="icon"]')).not.toBeNull();
  });

  it('updates native attributes and appearance inputs', async () => {
    const fixture = TestBed.createComponent(NamedHost);
    fixture.componentInstance.type.set('submit');
    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.fullWidth.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.type).toBe('submit');
    expect(button.dataset['variant']).toBe('outline');
    expect(button.getAttribute('data-full-width')).toBe('');
  });

  it('rejects a missing accessible name during stabilization', async () => {
    const fixture = TestBed.createComponent(UnnamedHost);

    await expect(fixture.whenStable()).rejects.toThrow(
      'IconButton requires aria-label or aria-labelledby',
    );
  });

  it('rejects an empty accessible name during stabilization', async () => {
    const fixture = TestBed.createComponent(EmptyNamedHost);

    await expect(fixture.whenStable()).rejects.toThrow(
      'IconButton requires aria-label or aria-labelledby',
    );
  });

  it('rejects a whitespace-only accessible name during stabilization', async () => {
    const fixture = TestBed.createComponent(WhitespaceNamedHost);

    await expect(fixture.whenStable()).rejects.toThrow(
      'IconButton requires aria-label or aria-labelledby',
    );
  });

  it('accepts a meaningful aria-labelledby accessible name', async () => {
    const fixture = TestBed.createComponent(LabelledByHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-labelledby')).toBe('label');
    expect((fixture.nativeElement.querySelector('#label') as HTMLElement).textContent).toBe(
      'Close',
    );
  });

  it('keeps a loading icon button enabled, focusable, named, and inert before later listeners', async () => {
    const fixture = TestBed.createComponent(NamedHost);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const laterCapture = vi.fn();
    button.addEventListener('click', laterCapture, { capture: true });

    button.focus();
    button.click();

    expect(button.disabled).toBe(false);
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-label')).toBe('Close');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.dataset['state']).toBe('loading');
    expect(laterCapture).not.toHaveBeenCalled();
    expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
  });

  it('gives explicit native disabled state priority over loading', async () => {
    const fixture = TestBed.createComponent(NamedHost);
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    expect(button.dataset['state']).toBe('disabled');
  });

  it.each([true, 'true'] as const)(
    'blocks raw aria-disabled value %s without applying disabled state',
    async (ariaDisabled) => {
      const fixture = TestBed.createComponent(NamedHost);
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
      const fixture = TestBed.createComponent(NamedHost);
      fixture.componentInstance.ariaDisabled.set(ariaDisabled);
      await fixture.whenStable();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(button.disabled).toBe(false);
      expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
    },
  );

  it('projects a custom loading indicator while keeping it hidden from the accessible name', async () => {
    const fixture = TestBed.createComponent(NamedHost);
    fixture.componentInstance.loading.set(true);
    fixture.componentInstance.customLoadingIndicator.set(true);
    await fixture.whenStable();
    const indicator = fixture.nativeElement.querySelector(
      '[data-part="loading-indicator"]',
    ) as HTMLSpanElement;

    expect(indicator.getAttribute('aria-hidden')).toBe('true');
    expect(indicator.textContent).toContain('Custom indicator');
    expect(indicator.querySelector('.slotted-button__spinner')).not.toBeNull();
  });
});
