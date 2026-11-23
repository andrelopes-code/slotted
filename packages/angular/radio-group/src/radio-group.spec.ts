import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideFieldDefaults, SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/radio-group/contract.json';
import type {
  RadioGroupLabelPlacement,
  RadioGroupOrientation,
  RadioGroupSize,
  RadioGroupVariant,
} from './public-api';
import { SlRadioGroup } from './radio-group';
import { provideRadioGroupDefaults } from './radio-group-defaults';
import { SlRadio, SlRadioDescription } from './radio-group-parts';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlFieldLabel,
    SlRadio,
    SlRadioDescription,
    SlRadioGroup,
  ],
  template: `<div slRadioGroup></div>`,
})
class Host {
  readonly control = new FormControl<string | null>(null);
  readonly requests: unknown[] = [];
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof renderTemplate>;

const group = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="radio-group"]') as HTMLElement;
const items = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="control"]')] as HTMLInputElement[];

function click(element: HTMLInputElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

const SET = `<div slRadio value="standard">Standard</div>
             <div slRadio value="express">Express</div>
             <div slRadio value="pickup">Pickup</div>`;

describe('SlRadioGroup', () => {
  it('names every axis the contract lists as a type the entry point exports', () => {
    const axes: {
      size: readonly RadioGroupSize[];
      variant: readonly RadioGroupVariant[];
      orientation: readonly RadioGroupOrientation[];
      labelPlacement: readonly RadioGroupLabelPlacement[];
    } = {
      size: ['sm', 'md', 'lg'],
      variant: ['plain', 'tile'],
      orientation: ['vertical', 'horizontal'],
      labelPlacement: ['end', 'start'],
    };
    expect(axes).toEqual(contract.axes);
  });

  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<div slRadioGroup aria-label="Envio">${SET}</div>`);

    expect(group(fixture).getAttribute('data-ui')).toBe('radio-group');
    expect(group(fixture).getAttribute('data-part')).toBe('root');
    expect(group(fixture).getAttribute('role')).toBe('radiogroup');

    const item = items(fixture)[0]?.parentElement as HTMLElement;
    expect(item.getAttribute('data-part')).toBe('item');
    expect(
      item.querySelector('[data-part="indicator"] svg[data-glyph]')?.getAttribute('data-glyph'),
    ).toBe('dot');
    expect(item.querySelector('[data-part="label"]')?.textContent).toContain('Standard');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<div slRadioGroup>${SET}</div>`);
    const defaults = contract.members.radioGroup.defaults;

    expect(group(fixture).getAttribute('data-size')).toBe(defaults.size);
    expect(group(fixture).getAttribute('data-orientation')).toBe(defaults.orientation);
    expect(group(fixture).getAttribute('data-label-placement')).toBe(defaults.labelPlacement);
  });

  /**
   * The whole keyboard model is the platform's, and a shared `name` within the
   * form owner is what buys it. An unnamed group is not a group, so one is
   * generated.
   */
  it('groups its items by one name, generating one when the consumer writes none', () => {
    const fixture = renderTemplate(`<div slRadioGroup>${SET}</div>`);
    const names = new Set(items(fixture).map((item) => item.getAttribute('name')));

    expect(names.size).toBe(1);
    expect([...names][0]).toMatch(/^slotted-radio-group-/);
    expect(contract.grouping).toBe('name');
    expect(contract.generatesName).toBe(true);
  });

  it('takes the submission name a consumer wrote', () => {
    const fixture = renderTemplate(`<div slRadioGroup name="shipping">${SET}</div>`);
    for (const item of items(fixture)) expect(item.getAttribute('name')).toBe('shipping');
  });

  it('asks before it moves, and says whether the pointer or the keyboard asked', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup (valueChange)="requests.push($event)">${SET}</div>`,
    );

    click(items(fixture)[1] as HTMLInputElement, 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: undefined,
      reason: 'pointer',
      value: 'express',
    });
    expect(items(fixture)[1]?.checked).toBe(true);

    click(items(fixture)[2] as HTMLInputElement, 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: 'express',
      reason: 'keyboard',
      value: 'pickup',
    });
  });

  it('keeps the value a controlled group was given until the consumer moves it', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup value="standard" (valueChange)="requests.push($event)">${SET}</div>`,
    );

    click(items(fixture)[1] as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(items(fixture)[0]?.checked).toBe(true);
    expect(items(fixture)[1]?.checked).toBe(false);
  });

  it('commits nothing when the request is cancelled', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup (valueChange)="$event.cancel()">${SET}</div>`,
    );

    click(items(fixture)[1] as HTMLInputElement);
    fixture.detectChanges();
    expect(items(fixture)[1]?.checked).toBe(false);
  });

  it('emits nothing when the item asked for is already the chosen one', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup defaultValue="standard" (valueChange)="requests.push($event)">
         ${SET}
       </div>`,
    );

    click(items(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(0);
  });

  it('mirrors the chosen item onto its own root', () => {
    const fixture = renderTemplate(`<div slRadioGroup defaultValue="express">${SET}</div>`);

    expect(items(fixture)[1]?.parentElement?.getAttribute('data-checked')).toBe('');
    expect(items(fixture)[0]?.parentElement?.getAttribute('data-checked')).toBeNull();
  });

  it('refuses every change while it is read-only, and stays reachable', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup readOnly defaultValue="standard" (valueChange)="requests.push($event)">
         ${SET}
       </div>`,
    );

    click(items(fixture)[1] as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(0);
    expect(items(fixture)[0]?.checked).toBe(true);
    expect(group(fixture).getAttribute('aria-readonly')).toBe('true');
    expect(items(fixture)[1]?.disabled).toBe(false);
  });

  it('disables every item through the platform, and one item on its own', () => {
    const whole = renderTemplate(`<div slRadioGroup disabled>${SET}</div>`);
    for (const item of items(whole)) expect(item.disabled).toBe(true);

    const one = renderTemplate(
      `<div slRadioGroup>
         <div slRadio value="a">Available</div>
         <div slRadio value="b" disabled>Unavailable</div>
       </div>`,
    );
    expect(items(one)[0]?.disabled).toBe(false);
    expect(items(one)[1]?.disabled).toBe(true);
    expect(items(one)[1]?.parentElement?.getAttribute('data-disabled')).toBe('');
  });

  it('describes one item without describing the whole set', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup>
         <div slRadio value="monthly">Mensal<p slRadioDescription>Cobrado todo dia 5.</p></div>
         <div slRadio value="yearly">Anual</div>
       </div>`,
    );

    const description = fixture.nativeElement.querySelector('[data-part="description"]');
    expect(items(fixture)[0]?.getAttribute('aria-describedby')).toBe(
      description.getAttribute('id'),
    );
    expect(items(fixture)[1]?.getAttribute('aria-describedby')).toBeNull();
  });

  it('says which way it flows only where it owns the role', () => {
    const horizontal = renderTemplate(`<div slRadioGroup orientation="horizontal">${SET}</div>`);
    expect(group(horizontal).getAttribute('aria-orientation')).toBe('horizontal');

    const vertical = renderTemplate(`<div slRadioGroup orientation="vertical">${SET}</div>`);
    expect(group(vertical).getAttribute('aria-orientation')).toBeNull();
  });

  it('withdraws its role where a field group already grouped the set', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup>
         <legend slFieldGroupLegend>Envio</legend>
         <div slRadioGroup>${SET}</div>
       </fieldset>`,
    );

    expect(group(fixture).getAttribute('role')).toBeNull();
    expect(contract.roleWithdrawnInside).toBe('field-group');
  });

  it('takes disabled and read-only from the field group around it', () => {
    const readOnly = renderTemplate(
      `<fieldset slFieldGroup readOnly>
         <legend slFieldGroupLegend>Envio</legend>
         <div slRadioGroup defaultValue="standard" (valueChange)="requests.push($event)">${SET}</div>
       </fieldset>`,
    );

    click(items(readOnly)[1] as HTMLInputElement);
    readOnly.detectChanges();
    expect(group(readOnly).getAttribute('data-readonly')).toBe('');
    expect(group(readOnly).getAttribute('aria-readonly')).toBe('true');
    expect(readOnly.componentInstance.requests).toHaveLength(0);
    expect(items(readOnly)[0]?.checked).toBe(true);

    const disabled = renderTemplate(
      `<fieldset slFieldGroup disabled>
         <legend slFieldGroupLegend>Envio</legend>
         <div slRadioGroup>${SET}</div>
       </fieldset>`,
    );

    expect(group(disabled).getAttribute('data-disabled')).toBe('');
    expect(items(disabled).every((item) => item.hasAttribute('disabled'))).toBe(true);
  });

  /** An unset state defers to the group (2026-09-02 field design), `invalid` as `required` does. */
  it('takes invalid and required from the field group around it', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup invalid required>
         <legend slFieldGroupLegend>Envio</legend>
         <div slRadioGroup>${SET}</div>
       </fieldset>`,
    );

    expect(group(fixture).getAttribute('data-invalid')).toBe('');
    expect(group(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(group(fixture).getAttribute('aria-required')).toBe('true');
  });

  it('takes disabled and read-only from the application’s field defaults', () => {
    const fixture = renderTemplate(`<div slRadioGroup>${SET}</div>`, [
      provideFieldDefaults({ disabled: true, readOnly: true }),
    ]);

    expect(group(fixture).getAttribute('data-disabled')).toBe('');
    expect(group(fixture).getAttribute('data-readonly')).toBe('');
  });

  it('takes its state from the field around it and never its identifier', () => {
    const fixture = renderTemplate(
      `<div slField invalid required>
         <label slFieldLabel>Envio</label>
         <div slRadioGroup>${SET}</div>
       </div>`,
    );

    expect(group(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(group(fixture).getAttribute('aria-required')).toBe('true');
    expect(items(fixture)[0]?.getAttribute('id')).toMatch(/^slotted-radio-group-/);
    expect(contract.wiring.id).toBe('never');
  });

  it('takes its name from the label of the field around it', () => {
    const fixture = renderTemplate(
      `<div slField id="shipping">
         <label slFieldLabel>Envio</label>
         <div slRadioGroup>${SET}</div>
       </div>`,
    );

    expect(group(fixture).getAttribute('aria-labelledby')).toBe('shipping-label');
    expect(fixture.nativeElement.querySelector('#shipping-label')?.textContent?.trim()).toBe(
      'Envio',
    );
  });

  it('keeps a name the consumer wrote over the field’s label', () => {
    const fixture = renderTemplate(
      `<div slField id="shipping">
         <label slFieldLabel>Envio</label>
         <div slRadioGroup aria-label="Forma de envio">${SET}</div>
       </div>`,
    );

    expect(group(fixture).hasAttribute('aria-labelledby')).toBe(false);
    expect(group(fixture).getAttribute('aria-label')).toBe('Forma de envio');
  });

  it('lets an application decide once how its sets of choices flow', () => {
    const fixture = renderTemplate(`<div slRadioGroup>${SET}</div>`, [
      provideRadioGroupDefaults({ labelPlacement: 'start', orientation: 'horizontal', size: 'lg' }),
    ]);

    expect(group(fixture).getAttribute('data-orientation')).toBe('horizontal');
    expect(group(fixture).getAttribute('data-size')).toBe('lg');
    expect(group(fixture).getAttribute('data-label-placement')).toBe('start');
  });

  it('reaches one item’s native element through exportAs', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup>
         <div slRadio value="a" #first="slRadio">A</div>
       </div>
       <button type="button" (click)="0">focar</button>`,
    );

    items(fixture)[0]?.focus();
    expect(document.activeElement).toBe(items(fixture)[0]);
  });

  /** The integration point React has no equivalent of. */
  it('belongs in a reactive form, and owns validity over the set', () => {
    const fixture = renderTemplate(
      `<div slRadioGroup required [formControl]="control">${SET}</div>`,
    );
    const host = fixture.componentInstance;

    expect(host.control.errors).toEqual({ required: true });

    click(items(fixture)[1] as HTMLInputElement);
    fixture.detectChanges();
    expect(host.control.value).toBe('express');
    expect(host.control.errors).toBeNull();

    host.control.setValue('pickup');
    fixture.detectChanges();
    expect(items(fixture)[2]?.checked).toBe(true);

    host.control.disable();
    fixture.detectChanges();
    expect(items(fixture)[0]?.disabled).toBe(true);
  });

  it('marks a form control touched when an item loses focus', () => {
    const fixture = renderTemplate(`<div slRadioGroup [formControl]="control">${SET}</div>`);
    expect(fixture.componentInstance.control.touched).toBe(false);

    items(fixture)[0]?.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.touched).toBe(true);
  });
});
