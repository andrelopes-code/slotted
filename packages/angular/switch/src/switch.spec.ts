import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { describe, expect, it, vi } from 'vitest';

import { SlSwitch } from './switch';
import type { SwitchSize } from './switch';

@Component({
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlSwitch],
  template: `
    <div
      slField
      id="alerts"
      [disabled]="fieldDisabled()"
      [invalid]="fieldInvalid()"
      [required]="fieldRequired()"
    >
      <label slFieldLabel>Email alerts</label>
      <button
        slSwitch
        class="app-switch"
        [disabled]="disabled()"
        [size]="size()"
        [(checked)]="checked"
      ></button>
      <p slFieldDescription>Sent when a build fails.</p>
    </div>
  `,
})
class Host {
  readonly checked = signal(false);
  readonly disabled = signal<boolean | undefined>(undefined);
  readonly size = signal<SwitchSize>('md');

  readonly fieldDisabled = signal(false);
  readonly fieldInvalid = signal(false);
  readonly fieldRequired = signal(false);
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const control = element.querySelector<HTMLButtonElement>('[role="switch"]')!;
  return {
    click: () => {
      control.click();
      fixture.detectChanges();
    },
    control,
    fixture,
    host: fixture.componentInstance,
    label: element.querySelector<HTMLLabelElement>('label')!,
    settle: () => fixture.detectChanges(),
  };
}

describe('SlSwitch', () => {
  it('is a switch on a button, off, at the middle size', () => {
    const { control } = mount();
    expect(control.tagName).toBe('BUTTON');
    expect(control.getAttribute('type')).toBe('button');
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(control.getAttribute('data-size')).toBe('md');
    expect(control.hasAttribute('data-checked')).toBe(false);
  });

  it('renders the thumb it moves', () => {
    const { control } = mount();
    expect(control.querySelector('[data-part="thumb"]')).not.toBeNull();
  });

  it('turns itself on and off, and reports each change', () => {
    const { click, control, host } = mount();

    click();
    expect(host.checked()).toBe(true);
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.getAttribute('data-checked')).toBe('');

    click();
    expect(host.checked()).toBe(false);
  });

  it('binds no keys, because a button already answers Space and Enter', () => {
    const { control } = mount();
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' });
    control.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not turn while disabled', () => {
    const { click, control, host, settle } = mount();
    host.disabled.set(true);
    settle();
    expect(control.hasAttribute('disabled')).toBe(true);

    click();
    expect(host.checked()).toBe(false);
  });

  it('takes the field’s identifier and description', () => {
    const { control, label } = mount();
    expect(control.getAttribute('id')).toBe('alerts-control');
    expect(label.getAttribute('for')).toBe('alerts-control');
    expect(control.getAttribute('aria-describedby')).toBe('alerts-description');
  });

  it('takes disabled, invalid and required from the field', () => {
    const { control, host, settle } = mount();
    host.fieldDisabled.set(true);
    host.fieldInvalid.set(true);
    host.fieldRequired.set(true);
    settle();

    expect(control.hasAttribute('disabled')).toBe(true);
    expect(control.getAttribute('data-invalid')).toBe('');
    expect(control.getAttribute('aria-required')).toBe('true');
    expect(control.hasAttribute('required')).toBe(false);
  });

  it('lets its own value win over the field’s, in both directions', () => {
    const { control, host, settle } = mount();
    host.fieldDisabled.set(true);
    host.disabled.set(false);
    settle();
    expect(control.hasAttribute('disabled')).toBe(false);
  });

  it('registers with the field, so the missing-control warning stays true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('carries the size it was given, and the class the consumer added', () => {
    const { control, host, settle } = mount();
    host.size.set('lg');
    settle();
    expect(control.getAttribute('data-size')).toBe('lg');
    expect(control.classList.contains('slotted-switch')).toBe(true);
    expect(control.classList.contains('app-switch')).toBe(true);
  });
});
