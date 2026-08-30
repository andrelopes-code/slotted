import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlToggleButton } from './toggle-button';

@Component({
  imports: [SlToggleButton],
  template: `
    <button
      slToggleButton
      [(pressed)]="pressed"
      [aria-disabled]="ariaDisabled()"
      [disabled]="disabled()"
      [fullWidth]="fullWidth()"
      [size]="size()"
      [fill]="fill()"
      [type]="type()"
      [variant]="variant()"
    >
      <span slButtonLeading>L</span>Toggle<span slButtonTrailing>T</span>
    </button>
  `,
})
class BoundHost {
  pressed = false;
  readonly ariaDisabled = signal<boolean | string | null>(null);
  readonly disabled = signal(false);
  readonly fullWidth = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly fill = signal<'solid' | 'outline' | 'ghost'>('outline');
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  readonly variant = signal<'accent' | 'secondary' | 'success' | 'warning' | 'danger'>('secondary');
}

@Component({
  imports: [SlToggleButton],
  template: `
    <button
      slToggleButton
      [pressed]="pressed()"
      [aria-disabled]="ariaDisabled()"
      [disabled]="disabled()"
      (click)="onClick($event)"
      (pressedChange)="onPressedChange($event)"
    >
      Controlled
    </button>
  `,
})
class ControlledHost {
  readonly pressed = signal(false);
  readonly ariaDisabled = signal<boolean | string | null>(null);
  readonly disabled = signal(false);
  readonly clickSpy = vi.fn();
  readonly pressedChangeSpy = vi.fn();
  readonly order: string[] = [];
  preventClick = false;
  destroyed = false;

  onClick(event: Event) {
    this.order.push('click');
    if (this.preventClick) event.preventDefault();
    this.clickSpy();
  }

  onPressedChange(pressed: boolean) {
    this.order.push(`${this.destroyed ? 'change-after-destroy' : 'change'}:${pressed}`);
    this.pressedChangeSpy(pressed);
  }
}

function click(button: HTMLButtonElement) {
  return button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

describe('SlToggleButton', () => {
  it('renders defaults, native type, component identity, and labeled projection', async () => {
    const fixture = TestBed.createComponent(BoundHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.type).toBe('button');
    expect(button.dataset['slottedComponent']).toBe('toggle-button');
    expect(button.dataset['variant']).toBe('secondary');
    expect(button.dataset['fill']).toBe('outline');
    expect(button.dataset['size']).toBe('md');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.querySelector('[data-part="leading"]')?.textContent).toContain('L');
    expect(button.querySelector('[data-part="label"]')?.textContent).toContain('Toggle');
    expect(button.querySelector('[data-part="trailing"]')?.textContent).toContain('T');
  });

  it('reflects fullWidth as a data attribute', async () => {
    const fixture = TestBed.createComponent(BoundHost);
    fixture.componentInstance.fullWidth.set(true);
    await fixture.whenStable();

    expect(
      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).getAttribute(
        'data-full-width',
      ),
    ).toBe('');
  });

  it('uses the banana binding to update the consumer pressed value', async () => {
    const fixture = TestBed.createComponent(BoundHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    click(button);
    await fixture.whenStable();

    expect(fixture.componentInstance.pressed).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.dataset['state']).toBe('pressed');
  });

  it('requests the next pressed value without writing the controlled input', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    click(button);

    expect(fixture.componentInstance.pressedChangeSpy).toHaveBeenCalledWith(true);
    expect(fixture.componentInstance.order).toEqual(['click', 'change:true']);
    expect(fixture.componentInstance.pressed()).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.dataset['state']).toBeUndefined();
  });

  it('requests false from a true controlled input while the DOM remains true until the host updates', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.componentInstance.pressed.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    click(button);

    expect(fixture.componentInstance.pressedChangeSpy).toHaveBeenCalledWith(false);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.dataset['state']).toBe('pressed');
  });

  it('lets a consumer cancel a click before pressedChange and preserves output ordering', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.componentInstance.preventClick = true;
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    click(button);

    expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.pressedChangeSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.order).toEqual(['click']);
  });

  it('actively blocks cancelable activation while explicitly disabled and gives disabled state priority over pressed', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.componentInstance.pressed.set(true);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const laterCapture = vi.fn();
    button.addEventListener('click', laterCapture, true);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    button.click();
    button.dispatchEvent(event);

    expect(button.disabled).toBe(true);
    expect(button.dataset['state']).toBe('disabled');
    expect(event.defaultPrevented).toBe(true);
    expect(laterCapture).not.toHaveBeenCalled();
    expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.pressedChangeSpy).not.toHaveBeenCalled();
  });

  it.each([true, 'true'] as const)(
    'blocks raw aria-disabled %s before later capture and consumer handlers',
    async (ariaDisabled) => {
      const fixture = TestBed.createComponent(ControlledHost);
      fixture.componentInstance.ariaDisabled.set(ariaDisabled);
      await fixture.whenStable();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      const laterCapture = vi.fn();
      button.addEventListener('click', laterCapture, true);
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      button.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(button.getAttribute('aria-disabled')).toBe(String(ariaDisabled));
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe(String(ariaDisabled));
      expect(button.dataset['state']).toBeUndefined();
      expect(laterCapture).not.toHaveBeenCalled();
      expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.pressedChangeSpy).not.toHaveBeenCalled();
    },
  );

  it.each([false, 'false'] as const)(
    'keeps raw aria-disabled %s interactive without forcing disabled state',
    async (ariaDisabled) => {
      const fixture = TestBed.createComponent(ControlledHost);
      fixture.componentInstance.ariaDisabled.set(ariaDisabled);
      await fixture.whenStable();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      click(button);

      expect(button.disabled).toBe(false);
      expect(button.dataset['state']).toBeUndefined();
      expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
      expect(fixture.componentInstance.pressedChangeSpy).toHaveBeenCalledWith(true);
    },
  );

  it('emits synchronously for rapid controlled clicks without changing the input', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    click(button);
    click(button);

    expect(fixture.componentInstance.pressedChangeSpy).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.pressedChangeSpy).toHaveBeenNthCalledWith(1, true);
    expect(fixture.componentInstance.pressedChangeSpy).toHaveBeenNthCalledWith(2, true);
    expect(fixture.componentInstance.pressed()).toBe(false);
  });

  it('does not defer an output until after destruction', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    click(button);
    fixture.destroy();
    fixture.componentInstance.destroyed = true;
    await Promise.resolve();

    expect(fixture.componentInstance.pressedChangeSpy).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.order).toEqual(['click', 'change:true']);
  });

  it('removes its capture listener on destroy without disturbing a focused native button', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.componentInstance.ariaDisabled.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.focus();
    fixture.destroy();
    const observer = vi.fn((event: Event) => event.preventDefault());
    button.addEventListener('click', observer, true);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    button.dispatchEvent(event);

    expect(document.activeElement).toBe(button);
    expect(observer).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });
});
