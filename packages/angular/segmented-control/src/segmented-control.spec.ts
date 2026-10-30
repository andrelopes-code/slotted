import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlFieldGroup, SlFieldGroupLegend } from '@slotted/angular/field-group';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/segmented-control/contract.json';
import { SlSegmentedControl } from './segmented-control';
import { provideSegmentedControlDefaults } from './segmented-control-defaults';
import { SlSegment, SlSegmentIcon } from './segmented-control-parts';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldGroup,
    SlFieldGroupLegend,
    SlFieldLabel,
    SlSegment,
    SlSegmentIcon,
    SlSegmentedControl,
  ],
  template: `<div slSegmentedControl></div>`,
})
class Host {
  readonly control = new FormControl<string | null>(null);
  readonly requests: { value: string | undefined; reason: string }[] = [];
  cancel = false;

  record(request: { value: string | undefined; reason: string; cancel: () => void }) {
    this.requests.push({ value: request.value, reason: request.reason });
    if (this.cancel) request.cancel();
  }
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

const control = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="segmented-control"]') as HTMLElement;
const radios = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="control"]')] as HTMLInputElement[];
const segments = (fixture: Fixture) =>
  [...fixture.nativeElement.querySelectorAll('[data-part="item"]')] as HTMLElement[];
const thumb = (fixture: Fixture) => control(fixture).querySelector('[data-part="indicator"]');

function click(element: HTMLInputElement, detail = 1) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
}

const SET = `<label slSegment value="day">Day</label>
             <label slSegment value="week">Week</label>
             <label slSegment value="month">Month</label>`;

describe('SlSegmentedControl', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`<div slSegmentedControl defaultValue="week">${SET}</div>`);

    expect(control(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(control(fixture)?.getAttribute('data-part')).toBe('root');
    expect(control(fixture)?.getAttribute('role')).toBe('radiogroup');
    expect(segments(fixture)[1]?.tagName).toBe('LABEL');
    expect(radios(fixture)[1]?.type).toBe('radio');
    expect(segments(fixture)[1]?.querySelector('[data-part="label"]')?.textContent?.trim()).toBe(
      'Week',
    );
  });

  it('is a radio group in the DOM, sharing one generated name', () => {
    const fixture = renderTemplate(`<div slSegmentedControl>${SET}</div>`);

    const name = radios(fixture)[0]?.name;
    expect(name).toBeTruthy();
    for (const radio of radios(fixture)) expect(radio.name).toBe(name);
    expect(control(fixture)?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  /** Index and count are known while the markup is written, never measured. */
  it('states the count and the checked index on its own element', () => {
    const fixture = renderTemplate(`<div slSegmentedControl defaultValue="month">${SET}</div>`);

    expect(control(fixture).style.getPropertyValue('--slotted-segmented-control-count')).toBe('3');
    expect(control(fixture).style.getPropertyValue('--slotted-segmented-control-index')).toBe('2');
    expect(thumb(fixture)).not.toBeNull();
  });

  it('paints no thumb while nothing is checked', () => {
    const fixture = renderTemplate(`<div slSegmentedControl>${SET}</div>`);

    expect(thumb(fixture)).toBeNull();
    expect(control(fixture).style.getPropertyValue('--slotted-segmented-control-index')).toBe('');
  });

  it('moves its own value and marks the segment it moved to', () => {
    const fixture = renderTemplate(`<div slSegmentedControl defaultValue="day">${SET}</div>`);

    click(radios(fixture)[2] as HTMLInputElement);
    fixture.detectChanges();

    expect(radios(fixture)[2]?.checked).toBe(true);
    expect(segments(fixture)[2]?.getAttribute('data-checked')).toBe('');
    expect(control(fixture).style.getPropertyValue('--slotted-segmented-control-index')).toBe('2');
  });

  it('says why the value moved, and lets a consumer refuse it', () => {
    const fixture = renderTemplate(
      `<div slSegmentedControl defaultValue="day" (valueChange)="record($event)">${SET}</div>`,
    );

    click(radios(fixture)[1] as HTMLInputElement, 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests[0]).toEqual({ value: 'week', reason: 'pointer' });

    click(radios(fixture)[2] as HTMLInputElement, 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.requests[1]?.reason).toBe('keyboard');

    fixture.componentInstance.cancel = true;
    click(radios(fixture)[0] as HTMLInputElement);
    fixture.detectChanges();
    expect(radios(fixture)[2]?.checked).toBe(true);
    expect(radios(fixture)[0]?.checked).toBe(false);
  });

  /**
   * The platform restores only the element that was clicked, so the neighbour
   * the browser had already unchecked is put back by the family.
   */
  it('puts every element back when a controlled consumer does not move', () => {
    const fixture = renderTemplate(
      `<div slSegmentedControl value="day" (valueChange)="record($event)">${SET}</div>`,
    );

    click(radios(fixture)[1] as HTMLInputElement);
    fixture.detectChanges();

    expect(radios(fixture)[0]?.checked).toBe(true);
    expect(radios(fixture)[1]?.checked).toBe(false);
  });

  it('refuses a change while it is read-only, and does not look disabled', () => {
    const fixture = renderTemplate(
      `<div slSegmentedControl defaultValue="day" readOnly (valueChange)="record($event)">${SET}</div>`,
    );

    click(radios(fixture)[1] as HTMLInputElement);
    fixture.detectChanges();

    expect(radios(fixture)[0]?.checked).toBe(true);
    expect(fixture.componentInstance.requests).toHaveLength(0);
    expect(control(fixture)?.getAttribute('aria-readonly')).toBe('true');
    for (const radio of radios(fixture)) expect(radio.disabled).toBe(false);
  });

  it('disables every segment when the control is disabled, and one when it is not', () => {
    const whole = renderTemplate(`<div slSegmentedControl disabled>${SET}</div>`);
    for (const radio of radios(whole)) expect(radio.disabled).toBe(true);
    expect(control(whole)?.getAttribute('data-disabled')).toBe('');

    const one = renderTemplate(
      `<div slSegmentedControl>
         <label slSegment value="day">Day</label>
         <label slSegment value="week" disabled>Week</label>
       </div>`,
    );
    expect(radios(one)[0]?.disabled).toBe(false);
    expect(radios(one)[1]?.disabled).toBe(true);
    expect(segments(one)[1]?.getAttribute('data-disabled')).toBe('');
  });

  it('announces invalid and required without inventing a second way to say it', () => {
    const fixture = renderTemplate(`<div slSegmentedControl invalid required>${SET}</div>`);

    expect(control(fixture)?.getAttribute('aria-invalid')).toBe('true');
    expect(control(fixture)?.getAttribute('data-invalid')).toBe('');
    expect(control(fixture)?.getAttribute('aria-required')).toBe('true');
  });

  it('belongs in a reactive form, and reports its own validity', () => {
    const fixture = renderTemplate(
      `<div slSegmentedControl required [formControl]="control">${SET}</div>`,
    );
    const host = fixture.componentInstance;

    expect(host.control.valid).toBe(false);

    click(radios(fixture)[1] as HTMLInputElement);
    fixture.detectChanges();

    expect(host.control.value).toBe('week');
    expect(host.control.valid).toBe(true);

    host.control.setValue('month');
    fixture.detectChanges();
    expect(radios(fixture)[2]?.checked).toBe(true);

    host.control.disable();
    fixture.detectChanges();
    expect(radios(fixture)[0]?.disabled).toBe(true);
  });

  it('takes its size and its state from the field around it', () => {
    const fixture = renderTemplate(
      `<div slField size="lg" invalid>
         <label slFieldLabel>Period</label>
         <div slSegmentedControl>${SET}</div>
       </div>`,
    );

    expect(control(fixture)?.getAttribute('data-size')).toBe('lg');
    expect(control(fixture)?.getAttribute('data-invalid')).toBe('');
  });

  it('withdraws its role inside a field group', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup>
         <legend slFieldGroupLegend>Period</legend>
         <div slSegmentedControl>${SET}</div>
       </fieldset>`,
    );

    expect(control(fixture).hasAttribute('role')).toBe(false);
    expect(radios(fixture)).toHaveLength(3);
  });

  it('lets an application state its axes once, and one control outrank it', () => {
    const fixture = renderTemplate(`<div slSegmentedControl>${SET}</div>`, [
      provideSegmentedControlDefaults({ condense: 'icons', fullWidth: true, size: 'sm' }),
    ]);

    expect(control(fixture)?.getAttribute('data-size')).toBe('sm');
    expect(control(fixture)?.getAttribute('data-condense')).toBe('icons');
    expect(control(fixture)?.getAttribute('data-full-width')).toBe('');

    const own = renderTemplate(`<div slSegmentedControl size="lg">${SET}</div>`, [
      provideSegmentedControlDefaults({ size: 'sm' }),
    ]);
    expect(control(own)?.getAttribute('data-size')).toBe('lg');
  });

  it('keeps a role and an identifier the consumer wrote on the host', () => {
    const fixture = renderTemplate(
      `<div slSegmentedControl role="group">
         <label slSegment value="day" id="day-segment">Day</label>
       </div>`,
    );

    expect(control(fixture)?.getAttribute('role')).toBe('group');
    expect(radios(fixture)[0]?.id).toBe('day-segment');
  });

  it('names a segment whose content is only a mark', () => {
    const fixture = renderTemplate(
      `<div slSegmentedControl>
         <label slSegment value="start" aria-label="Start"><span slSegmentIcon></span></label>
       </div>`,
    );

    expect(radios(fixture)[0]?.getAttribute('aria-label')).toBe('Start');
    const icon = segments(fixture)[0]?.querySelector('[data-part="icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });
});

@Component({
  standalone: true,
  imports: [SlSegmentedControl, SlSegment, SlField, SlFieldLabel],
  template: `<div slField>
    <label slFieldLabel>Period</label>
    <div slSegmentedControl variant="underline" defaultValue="Week">
      <label slSegment value="day">Day</label>
      <label slSegment value="week">Week</label>
      <label slSegment value="month">Month</label>
    </div>
  </div>`,
})
class UnderlineHost {}

describe('the underline variant', () => {
  it('draws the radio group as words, keeps its semantics and is named by the field label', () => {
    TestBed.configureTestingModule({ imports: [UnderlineHost] });
    const fixture = TestBed.createComponent(UnderlineHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '[data-ui="segmented-control"]',
    ) as HTMLElement;
    const label = fixture.nativeElement.querySelector('[data-ui="field"] label') as HTMLElement;
    const radios = [...root.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];

    expect(root.getAttribute('data-variant')).toBe('underline');
    expect(root.getAttribute('role')).toBe('radiogroup');
    expect(root.getAttribute('aria-labelledby')).toBe(label.id);
    expect(radios).toHaveLength(3);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
  });
});
