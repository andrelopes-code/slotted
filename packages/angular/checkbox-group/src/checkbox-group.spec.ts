import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/checkbox-group/contract.json';
import { SlCheckboxGroup } from './checkbox-group';
import { provideCheckboxGroupDefaults } from './checkbox-group-defaults';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlCheckbox,
    SlCheckboxGroup,
    SlField,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlFieldLabel,
  ],
  template: `<div slCheckboxGroup></div>`,
})
class Host {
  readonly days = ['mon', 'tue', 'wed'];
  readonly control = new FormControl<readonly string[]>([]);
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
  fixture.nativeElement.querySelector('[data-ui="checkbox-group"]') as HTMLElement;
const boxes = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="control"]')] as HTMLInputElement[];

function click(element: HTMLInputElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

const SET = `<div slCheckbox value="mon">Monday</div>
             <div slCheckbox value="tue">Tuesday</div>
             <div slCheckbox value="wed">Wednesday</div>`;

describe('SlCheckboxGroup', () => {
  it('is selected in public by the family identifier and its one part', () => {
    const fixture = renderTemplate(`<div slCheckboxGroup>${SET}</div>`);

    expect(group(fixture).getAttribute('data-ui')).toBe('checkbox-group');
    expect(group(fixture).getAttribute('data-part')).toBe('root');
    expect(group(fixture).getAttribute('role')).toBe('group');
    expect(contract.members.checkboxGroup.parts).toEqual(['root']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<div slCheckboxGroup>${SET}</div>`);
    const defaults = contract.members.checkboxGroup.defaults;

    expect(group(fixture).getAttribute('data-size')).toBe(defaults.size);
    expect(group(fixture).getAttribute('data-orientation')).toBe(defaults.orientation);
  });

  it('holds the selection as an array and asks before it moves', () => {
    const fixture = renderTemplate(
      `<div slCheckboxGroup [allValues]="days" [defaultValue]="['tue']"
            (valueChange)="requests.push($event)">${SET}</div>`,
    );

    expect(boxes(fixture)[1]?.checked).toBe(true);

    click(boxes(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      previous: ['tue'],
      reason: 'pointer',
      value: ['mon', 'tue'],
    });
    expect(boxes(fixture)[0]?.checked).toBe(true);
  });

  /**
   * A selection that grew in click order would submit in click order, so two
   * readers who chose the same options would send two different arrays.
   */
  it('keeps the selection in the order the set was declared', () => {
    const fixture = renderTemplate(
      `<div slCheckboxGroup [allValues]="days" [defaultValue]="['wed']"
            (valueChange)="requests.push($event)">${SET}</div>`,
    );

    click(boxes(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({ value: ['mon', 'wed'] });
  });

  it('keeps the selection a controlled group was given until the consumer moves it', () => {
    const fixture = renderTemplate(
      `<div slCheckboxGroup [allValues]="days" [value]="[]"
            (valueChange)="requests.push($event)">${SET}</div>`,
    );

    click(boxes(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(boxes(fixture)[0]?.checked).toBe(false);
  });

  it('commits nothing when the request is cancelled', () => {
    const fixture = renderTemplate(
      `<div slCheckboxGroup [allValues]="days" (valueChange)="$event.cancel()">${SET}</div>`,
    );

    click(boxes(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(boxes(fixture)[0]?.checked).toBe(false);
  });

  it('derives the parent box from the set it commands', () => {
    const fixture = renderTemplate(
      `<div slCheckboxGroup [allValues]="days" [defaultValue]="['mon']"
            (valueChange)="requests.push($event)">
         <div slCheckbox parent>Todos</div>
         ${SET}
       </div>`,
    );

    const [parent, ...children] = boxes(fixture);
    expect(parent?.indeterminate).toBe(true);
    expect(parent?.checked).toBe(false);

    click(parent as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({
      value: ['mon', 'tue', 'wed'],
    });
    expect(children.every((child) => child.checked)).toBe(true);

    click(boxes(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests.at(-1)).toMatchObject({ value: [] });
  });

  it('hands its state to every box in the set', () => {
    const fixture = renderTemplate(`<div slCheckboxGroup disabled invalid readOnly>${SET}</div>`);

    expect(group(fixture).getAttribute('data-disabled')).toBe('');
    expect(group(fixture).getAttribute('data-invalid')).toBe('');
    expect(group(fixture).getAttribute('data-readonly')).toBe('');
    for (const box of boxes(fixture)) {
      expect(box.disabled).toBe(true);
      expect(box.getAttribute('aria-invalid')).toBe('true');
      expect(box.getAttribute('aria-readonly')).toBe('true');
    }
  });

  it('takes read-only and disabled from the field group around it', () => {
    const readOnly = renderTemplate(
      `<fieldset slFieldGroup readOnly>
         <legend slFieldGroupLegend>Dias</legend>
         <div slCheckboxGroup [defaultValue]="['mon']">${SET}</div>
       </fieldset>`,
    );

    expect(group(readOnly).getAttribute('data-readonly')).toBe('');
    for (const box of boxes(readOnly)) expect(box.getAttribute('aria-readonly')).toBe('true');
    click(boxes(readOnly)[1] as HTMLInputElement);
    readOnly.detectChanges();
    expect(boxes(readOnly)[1]?.checked).toBe(false);

    const disabled = renderTemplate(
      `<fieldset slFieldGroup disabled>
         <legend slFieldGroupLegend>Dias</legend>
         <div slCheckboxGroup>${SET}</div>
       </fieldset>`,
    );

    expect(group(disabled).getAttribute('data-disabled')).toBe('');
  });

  it('takes invalid and required from the field group around it', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup invalid required>
         <legend slFieldGroupLegend>Dias</legend>
         <div slCheckboxGroup>${SET}</div>
       </fieldset>`,
    );

    expect(group(fixture).getAttribute('data-invalid')).toBe('');
    expect(group(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(group(fixture).getAttribute('aria-required')).toBe('true');
    for (const box of boxes(fixture)) expect(box.getAttribute('aria-invalid')).toBe('true');
  });

  it('hands its submission name to every box in the set', () => {
    const fixture = renderTemplate(`<div slCheckboxGroup name="days">${SET}</div>`);
    for (const box of boxes(fixture)) expect(box.getAttribute('name')).toBe('days');
  });

  it('withdraws its role where a field group already grouped the set', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup>
         <legend slFieldGroupLegend>Dias</legend>
         <div slCheckboxGroup>${SET}</div>
       </fieldset>`,
    );

    expect(group(fixture).getAttribute('role')).toBeNull();
    expect(contract.roleWithdrawnInside).toBe('field-group');
  });

  it('keeps a role the consumer wrote as a static attribute', () => {
    const fixture = renderTemplate(`<div slCheckboxGroup role="presentation">${SET}</div>`);
    expect(group(fixture).getAttribute('role')).toBe('presentation');
  });

  it('publishes how many are selected where the field already draws a count', () => {
    const fixture = renderTemplate(
      `<div slField>
         <label slFieldLabel>Dias</label>
         <div slCheckboxGroup showCount [allValues]="days" [defaultValue]="['mon','tue']">
           ${SET}
         </div>
       </div>`,
    );

    expect(
      (fixture.nativeElement.querySelector('[data-part="counter"]') as HTMLElement).textContent,
    ).toContain('2/3');
    expect(contract.counter.placedBy).toBe('field');
  });

  it('takes its name from the label of the field around it', () => {
    const fixture = renderTemplate(
      `<div slField id="days">
         <label slFieldLabel>Dias</label>
         <div slCheckboxGroup>${SET}</div>
       </div>`,
    );

    expect(group(fixture).getAttribute('aria-labelledby')).toBe('days-label');
    expect(fixture.nativeElement.querySelector('#days-label')?.textContent).toBe('Dias');
  });

  it('keeps a name the consumer wrote over the field’s label', () => {
    const fixture = renderTemplate(
      `<div slField id="days">
         <label slFieldLabel>Dias</label>
         <div slCheckboxGroup aria-label="Dias de coleta">${SET}</div>
       </div>`,
    );

    expect(group(fixture).getAttribute('aria-labelledby')).toBeNull();
    expect(group(fixture).getAttribute('aria-label')).toBe('Dias de coleta');
  });

  it('lets an application decide once how its sets of choices flow', () => {
    const fixture = renderTemplate(`<div slCheckboxGroup>${SET}</div>`, [
      provideCheckboxGroupDefaults({ orientation: 'horizontal', size: 'lg' }),
    ]);

    expect(group(fixture).getAttribute('data-orientation')).toBe('horizontal');
    expect(group(fixture).getAttribute('data-size')).toBe('lg');
  });

  /** The integration point React has no equivalent of. */
  it('belongs in a reactive form, and owns validity over the set', () => {
    const fixture = renderTemplate(
      `<div slCheckboxGroup required [allValues]="days" [formControl]="control">${SET}</div>`,
    );
    const host = fixture.componentInstance;

    expect(host.control.errors).toEqual({ required: true });

    click(boxes(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(host.control.value).toEqual(['mon']);
    expect(host.control.errors).toBeNull();

    host.control.setValue(['mon', 'tue']);
    fixture.detectChanges();
    expect(boxes(fixture)[1]?.checked).toBe(true);

    host.control.disable();
    fixture.detectChanges();
    expect(boxes(fixture)[0]?.disabled).toBe(true);
  });
});
