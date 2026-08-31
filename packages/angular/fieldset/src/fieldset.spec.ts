import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInput } from '@slotted/angular/input';
import { describe, expect, it } from 'vitest';

import { SlFieldset } from './fieldset';
import type { FieldsetOrientation } from './fieldset';
import { SlFieldsetLegend } from './fieldset-legend';

@Component({
  imports: [SlField, SlFieldLabel, SlFieldset, SlFieldsetLegend, SlInput],
  template: `
    <fieldset
      slFieldset
      class="app-group"
      [disabled]="disabled()"
      [invalid]="invalid()"
      [orientation]="orientation()"
    >
      <legend slFieldsetLegend>Notifications</legend>
      <div slField>
        <label slFieldLabel>Email</label>
        <input slInput />
      </div>
    </fieldset>
  `,
})
class Host {
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly orientation = signal<FieldsetOrientation>('vertical');
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fieldset: element.querySelector<HTMLFieldSetElement>('fieldset')!,
    fixture,
    host: fixture.componentInstance,
    input: element.querySelector<HTMLInputElement>('input')!,
    legend: element.querySelector<HTMLLegendElement>('legend')!,
    settle: () => fixture.detectChanges(),
  };
}

describe('SlFieldset', () => {
  it('is the native grouping element, named by its legend', () => {
    const { fieldset, legend } = mount();
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(legend.textContent?.trim()).toBe('Notifications');
    expect(fieldset.getAttribute('data-orientation')).toBe('vertical');
  });

  it('adds no ARIA, because the elements already carry the semantics', () => {
    const { fieldset } = mount();
    expect(fieldset.hasAttribute('role')).toBe(false);
    expect(fieldset.hasAttribute('aria-label')).toBe(false);
    expect(fieldset.hasAttribute('aria-labelledby')).toBe(false);
  });

  /**
   * `input.disabled` reflects the control's own attribute and stays false, by
   * specification, however the fieldset around it is set. What changes is that
   * the control becomes *actually* disabled: it matches `:disabled`, which is
   * both what makes it inert and what the stylesheet keys its appearance on.
   */
  it('disables every control inside through the native attribute alone', () => {
    const { fieldset, host, input, settle } = mount();
    host.disabled.set(true);
    settle();
    expect(fieldset.hasAttribute('disabled')).toBe(true);
    expect(fieldset.getAttribute('data-disabled')).toBe('');
    expect(input.matches(':disabled')).toBe(true);
    expect(input.hasAttribute('disabled')).toBe(false);
  });

  it('leaves the controls alone when it is not disabled', () => {
    const { input } = mount();
    expect(input.matches(':disabled')).toBe(false);
  });

  it('carries the orientation it was given', () => {
    const { fieldset, host, settle } = mount();
    host.orientation.set('horizontal');
    settle();
    expect(fieldset.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('marks itself invalid without touching what it groups', () => {
    const { fieldset, host, input, settle } = mount();
    host.invalid.set(true);
    settle();
    expect(fieldset.getAttribute('data-invalid')).toBe('');
    expect(input.hasAttribute('data-invalid')).toBe(false);
  });

  it('keeps the class the consumer added, and marks the legend as its part', () => {
    const { fieldset, legend } = mount();
    expect(fieldset.classList.contains('slotted-fieldset')).toBe(true);
    expect(fieldset.classList.contains('app-group')).toBe(true);
    expect(legend.getAttribute('data-part')).toBe('legend');
  });
});
