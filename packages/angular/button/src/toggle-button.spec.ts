import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import { SlButtonEnd, SlButtonStart } from './button-appearance';
import { SlToggleButton } from './toggle-button';

const defaults = contract.members.toggleButton.defaults;

@Component({
  imports: [SlButtonEnd, SlButtonStart, SlToggleButton],
  template: `<button
    slToggleButton
    [disabled]="disabled()"
    [pressed]="pressed()"
    [defaultPressed]="defaultPressed()"
    (click)="onClick($event)"
    (pressedChange)="onPressedChange($event)"
  >
    @if (withIcons()) {
      <span slButtonStart>S</span>
    }
    Pin
    @if (withIcons()) {
      <span slButtonEnd>E</span>
    }
  </button>`,
})
class TestHost {
  readonly disabled = signal(false);
  readonly pressed = signal<boolean | undefined>(undefined);
  readonly defaultPressed = signal(false);
  readonly withIcons = signal(false);
  readonly onPressedChange = vi.fn<(request: ChangeRequest<boolean>) => void>();
  readonly onClick = vi.fn<(event: Event) => void>();
}

function mount() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  return { button, fixture, host: fixture.componentInstance };
}

describe('SlToggleButton', () => {
  it('is a native button announced as a toggle', () => {
    const { button } = mount();

    expect(button.localName).toBe(contract.members.toggleButton.nativeElement);
    expect(button.getAttribute('data-ui')).toBe(contract.ui);
    expect(button.getAttribute('aria-pressed')).toBe(String(defaults.defaultPressed));
    expect(button.getAttribute('data-tone')).toBe(defaults.tone);
    expect(button.getAttribute('data-variant')).toBe(defaults.variant);
  });

  it('owns its state when the consumer passes only an initial value', () => {
    const { button, fixture } = mount();

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
  });

  it('moves when the consumer hands the new value back', () => {
    const { button, fixture, host } = mount();
    host.pressed.set(false);
    host.onPressedChange.mockImplementation((request) => host.pressed.set(request.value));
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('carries the value, the value it replaces, the reason and the event', () => {
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

  it('says keyboard when the click carried no pointer', () => {
    const { button, host } = mount();

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(host.onPressedChange.mock.calls[0]?.[0].reason).toBe('keyboard');
  });

  it('commits nothing when the request is cancelled', () => {
    const { button, fixture, host } = mount();
    host.onPressedChange.mockImplementation((request) => request.cancel());
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('treats a refused activation as no activation', () => {
    const { button, fixture, host } = mount();
    host.onClick.mockImplementation((event) => event.preventDefault());
    fixture.detectChanges();

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(host.onPressedChange).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('leaves the disabled state to the platform and keeps saying whether it is on', () => {
    const { button, fixture, host } = mount();
    host.defaultPressed.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('data-disabled')).toBe('');
    expect(host.onPressedChange).not.toHaveBeenCalled();
  });

  it('renders the content parts the contract names', () => {
    const { button, fixture, host } = mount();
    host.withIcons.set(true);
    fixture.detectChanges();

    expect(
      [...button.querySelectorAll('[data-part]')].map((part) => part.getAttribute('data-part')),
    ).toEqual(['start', 'label', 'end']);
  });
});
