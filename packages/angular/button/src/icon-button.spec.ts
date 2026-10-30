import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import type { ButtonShape } from './button.constants';
import { SlIconButton } from './icon-button';

const defaults = contract.members.iconButton.defaults;

@Component({
  imports: [SlIconButton],
  template: `<button
    slIconButton
    [attr.aria-label]="label()"
    [shape]="shape()"
    [disabled]="disabled()"
    [loading]="loading()"
    [pressed]="pressed()"
    [defaultPressed]="defaultPressed()"
    (pressedChange)="onPressedChange($event)"
  >
    <svg></svg>
  </button>`,
})
class TestHost {
  readonly label = signal<string | null>('Add member');
  readonly shape = signal<ButtonShape>('square');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly pressed = signal<boolean | undefined>(undefined);
  readonly defaultPressed = signal<boolean | undefined>(undefined);
  readonly onPressedChange = vi.fn<(request: ChangeRequest<boolean>) => void>();
}

function mount() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  return { button, fixture, host: fixture.componentInstance };
}

describe('SlIconButton', () => {
  it('is a square button with the family identity and an icon part', () => {
    const { button } = mount();

    expect(button.localName).toBe(contract.members.iconButton.nativeElement);
    expect(button.getAttribute('data-ui')).toBe(contract.ui);
    expect(button.getAttribute('data-part')).toBe('root');
    expect(button.getAttribute('data-shape')).toBe(defaults.shape);
    expect(button.getAttribute('data-tone')).toBe(defaults.tone);
    expect(button.getAttribute('data-variant')).toBe(defaults.variant);
    expect(button.querySelector('[data-part="icon"] svg')).not.toBeNull();
  });

  it('refuses to render without an accessible name in development', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.label.set(null);

    expect(() => fixture.detectChanges()).toThrow(/aria-label/);
  });

  /**
   * A plain icon button that announced `aria-pressed` would be announcing a
   * state it does not have, so the attribute waits for either half of the
   * state model.
   */
  it('is not a toggle until the consumer says it is', () => {
    const { button } = mount();

    expect(button.hasAttribute('aria-pressed')).toBe(false);
    expect(button.hasAttribute('data-pressed')).toBe(false);
  });

  it('owns its state when only the initial value is given', () => {
    const { button, fixture, host } = mount();
    host.defaultPressed.set(false);
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('data-pressed')).toBe('');
  });

  it('never moves state the consumer owns', () => {
    const { button, fixture, host } = mount();
    host.pressed.set(false);
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(host.onPressedChange).toHaveBeenCalledOnce();
    expect(host.onPressedChange.mock.calls[0]?.[0].value).toBe(true);
  });

  it('carries the reason, the value it replaces and the originating event', () => {
    const { button, fixture, host } = mount();
    host.defaultPressed.set(true);
    fixture.detectChanges();

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    const request = host.onPressedChange.mock.calls[0]?.[0];
    expect(request?.value).toBe(false);
    expect(request?.previous).toBe(true);
    expect(request?.reason).toBe('pointer');
    expect(request?.source).toBeDefined();
  });

  it('tells a keyboard activation from a pointer one', () => {
    const { button, fixture, host } = mount();
    host.defaultPressed.set(false);
    fixture.detectChanges();

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(host.onPressedChange.mock.calls[0]?.[0].reason).toBe('keyboard');
  });

  it('commits nothing when the request is cancelled', () => {
    const { button, fixture, host } = mount();
    host.defaultPressed.set(false);
    host.onPressedChange.mockImplementation((request) => request.cancel());
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('waits without losing its name, and refuses activation while it does', () => {
    const { button, fixture, host } = mount();
    host.loading.set(true);
    host.defaultPressed.set(false);
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('data-loading')).toBe('');
    expect(button.disabled).toBe(false);
    const indicator = button.querySelector('[data-part="indicator"]');
    expect(indicator?.getAttribute('role')).toBe('progressbar');
    /* The ring is the shared spinner, drawn once for every family that waits. */
    expect(indicator?.getAttribute('data-ui')).toBe('spinner');
    expect(button.querySelector('[data-part="icon"]')).toContain(indicator);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(host.onPressedChange).not.toHaveBeenCalled();
  });

  it('takes the shape the consumer asked for', () => {
    const { button, fixture, host } = mount();
    host.shape.set('circle');
    fixture.detectChanges();

    expect(button.getAttribute('data-shape')).toBe('circle');
  });
});
