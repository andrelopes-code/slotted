import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { describe, expect, it, vi } from 'vitest';

import { SlInput } from './input';
import type { InputSize } from './input';

@Component({
  imports: [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlInput],
  template: `
    <div
      slField
      id="account"
      [disabled]="fieldDisabled()"
      [invalid]="fieldInvalid()"
      [readOnly]="fieldReadOnly()"
      [required]="fieldRequired()"
    >
      <label slFieldLabel>Email</label>
      <input
        slInput
        class="app-input"
        [disabled]="disabled()"
        [invalid]="invalid()"
        [readOnly]="readOnly()"
        [required]="required()"
        [size]="size()"
      />
      <p slFieldDescription>We only use it to sign you in.</p>
      <p slFieldError>That address is not valid.</p>
    </div>
  `,
})
class Host {
  readonly disabled = signal<boolean | undefined>(undefined);
  readonly invalid = signal<boolean | undefined>(undefined);
  readonly readOnly = signal<boolean | undefined>(undefined);
  readonly required = signal<boolean | undefined>(undefined);
  readonly size = signal<InputSize>('md');

  readonly fieldDisabled = signal(false);
  readonly fieldInvalid = signal(false);
  readonly fieldReadOnly = signal(false);
  readonly fieldRequired = signal(false);
}

@Component({
  imports: [SlInput],
  template: `
    <input
      slInput
      id="bare"
      [disabled]="disabled()"
      [invalid]="invalid()"
      [readOnly]="readOnly()"
      [required]="required()"
    />
  `,
})
class BareHost {
  readonly disabled = signal<boolean | undefined>(undefined);
  readonly invalid = signal<boolean | undefined>(undefined);
  readonly readOnly = signal<boolean | undefined>(undefined);
  readonly required = signal<boolean | undefined>(undefined);
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    input: element.querySelector<HTMLInputElement>('input')!,
    label: element.querySelector<HTMLLabelElement>('label')!,
    settle: () => fixture.detectChanges(),
  };
}

function mountBare() {
  const fixture = TestBed.createComponent(BareHost);
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    input: (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!,
  };
}

describe('SlInput', () => {
  it('is the native control, with the size the contract defaults to', () => {
    const { input } = mount();
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('data-size')).toBe('md');
    expect(input.classList.contains('slotted-input')).toBe(true);
  });

  it('works outside a field, which is what mirroring the state is for', () => {
    const { fixture, host, input } = mountBare();
    host.disabled.set(true);
    host.invalid.set(true);
    host.readOnly.set(true);
    host.required.set(true);
    fixture.detectChanges();

    expect(input.getAttribute('data-disabled')).toBe('');
    expect(input.getAttribute('data-invalid')).toBe('');
    expect(input.getAttribute('data-readonly')).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.disabled).toBe(true);
  });

  it('takes the field’s identifier, so the label resolves to it', () => {
    const { input, label } = mount();
    expect(input.getAttribute('id')).toBe('account-control');
    expect(label.getAttribute('for')).toBe('account-control');
  });

  it('is described by the field’s description and error, in that order', () => {
    const { input } = mount();
    expect(input.getAttribute('aria-describedby')).toBe('account-description account-error');
  });

  it('takes every shared state from the field when it sets none itself', () => {
    const { host, input, settle } = mount();
    host.fieldDisabled.set(true);
    host.fieldInvalid.set(true);
    host.fieldReadOnly.set(true);
    host.fieldRequired.set(true);
    settle();

    expect(input.disabled).toBe(true);
    expect(input.getAttribute('data-disabled')).toBe('');
    expect(input.getAttribute('data-invalid')).toBe('');
    expect(input.getAttribute('data-readonly')).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('lets its own value win over the field’s, in both directions', () => {
    const { host, input, settle } = mount();
    host.fieldDisabled.set(true);
    host.fieldInvalid.set(true);
    host.disabled.set(false);
    host.invalid.set(false);
    settle();

    expect(input.disabled).toBe(false);
    expect(input.hasAttribute('data-disabled')).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('describes itself as required with aria, never with the native attribute', () => {
    const { host, input, settle } = mount();
    host.fieldRequired.set(true);
    settle();
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('required')).toBe(false);
  });

  it('registers with the field, so the missing-control warning stays true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('carries the size it was given, and the class the consumer added', () => {
    const { host, input, settle } = mount();
    host.size.set('lg');
    settle();
    expect(input.getAttribute('data-size')).toBe('lg');
    expect(input.classList.contains('slotted-input')).toBe(true);
    expect(input.classList.contains('app-input')).toBe(true);
  });

  it('keeps the identifier the consumer put on the element', () => {
    const { input } = mountBare();
    expect(input.getAttribute('id')).toBe('bare');
  });
});
