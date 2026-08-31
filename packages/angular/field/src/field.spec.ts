import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlField } from './field';
import { SlFieldControl } from './field-control';
import { SlFieldDescription } from './field-description';
import { SlFieldError } from './field-error';
import { SlFieldLabel } from './field-label';

@Component({
  imports: [SlField, SlFieldControl, SlFieldDescription, SlFieldError, SlFieldLabel],
  template: `
    <div
      slField
      id="email"
      [disabled]="disabled()"
      [invalid]="invalid()"
      [readOnly]="readOnly()"
      [required]="required()"
    >
      <label slFieldLabel>Email</label>
      <input slFieldControl />
      @if (showDescription()) {
        <p slFieldDescription>Used for sign-in</p>
      }
      @if (showError()) {
        <p slFieldError>Email is not valid</p>
      }
    </div>
  `,
})
class BoundHost {
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly readOnly = signal(false);
  readonly required = signal(false);
  readonly showDescription = signal(true);
  readonly showError = signal(false);
}

@Component({
  imports: [SlField, SlFieldControl, SlFieldDescription],
  template: `
    <div slField id="email">
      <input slFieldControl aria-describedby="external" aria-required="false" id="mine" />
      <p slFieldDescription>Used for sign-in</p>
    </div>
  `,
})
class ExplicitHost {}

@Component({
  imports: [SlField, SlFieldControl, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Email</label>
      <textarea slFieldControl></textarea>
    </div>
  `,
})
class GeneratedHost {}

function render<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return fixture;
}

describe('SlField', () => {
  it('derives every identifier from one base', () => {
    const fixture = render(BoundHost);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('input')?.getAttribute('id')).toBe('email-control');
    expect(element.querySelector('label')?.getAttribute('for')).toBe('email-control');
    expect(element.querySelector('p')?.getAttribute('id')).toBe('email-description');
  });

  it('composes aria-describedby as description then error', () => {
    const fixture = render(BoundHost);
    fixture.componentInstance.showError.set(true);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('input')
        ?.getAttribute('aria-describedby'),
    ).toBe('email-description email-error');
  });

  it('omits an absent part from aria-describedby', () => {
    const fixture = render(BoundHost);
    fixture.componentInstance.showDescription.set(false);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('input')
        ?.hasAttribute('aria-describedby'),
    ).toBe(false);
  });

  it('marks state on the root and on the control', () => {
    const fixture = render(BoundHost);
    for (const state of [
      fixture.componentInstance.disabled,
      fixture.componentInstance.invalid,
      fixture.componentInstance.readOnly,
      fixture.componentInstance.required,
    ]) {
      state.set(true);
    }
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const root = element.querySelector('[data-slotted-component="field"]');
    for (const attribute of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(root?.getAttribute(attribute)).toBe('');
    }

    const control = element.querySelector('input');
    expect(control?.getAttribute('aria-invalid')).toBe('true');
    expect(control?.getAttribute('aria-required')).toBe('true');
    expect(control?.hasAttribute('disabled')).toBe(true);
    expect(control?.hasAttribute('readonly')).toBe(true);
    expect(control?.hasAttribute('required')).toBe(false);
  });

  it('leaves state attributes off when the field is neutral', () => {
    const element = render(BoundHost).nativeElement as HTMLElement;
    const root = element.querySelector('[data-slotted-component="field"]');

    for (const attribute of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(root?.hasAttribute(attribute)).toBe(false);
    }
    expect(element.querySelector('input')?.hasAttribute('aria-invalid')).toBe(false);
  });

  it('keeps a consumer value ahead of the field value and never overwrites one', () => {
    const control = (render(ExplicitHost).nativeElement as HTMLElement).querySelector('input');

    expect(control?.getAttribute('aria-describedby')).toBe('external email-description');
    expect(control?.getAttribute('aria-required')).toBe('false');
    expect(control?.getAttribute('id')).toBe('mine');
  });

  it('wires a control that is not an input, and generates an identifier when none is given', () => {
    const element = render(GeneratedHost).nativeElement as HTMLElement;
    const control = element.querySelector('textarea');

    expect(control?.getAttribute('id')).toMatch(/^slotted-field-\d+-control$/);
    expect(element.querySelector('label')?.getAttribute('for')).toBe(control?.getAttribute('id'));
  });
});
