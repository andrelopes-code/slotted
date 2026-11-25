import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlDateTimeRangePicker } from '@slotted/angular/datetime-range-picker';
import { SlTimePicker } from '@slotted/angular/time-picker';
import { SlTimeRangePicker } from '@slotted/angular/time-range-picker';
import { describe, expect, it } from 'vitest';

const day = (date: number) => plainDate(2026, 11, date);
const at = (date: number, hour: number) => plainDateTime(day(date), plainTime(hour));

@Component({
  standalone: true,
  imports: [
    SlDatePicker,
    SlDateRangePicker,
    SlDateTimePicker,
    SlDateTimeRangePicker,
    SlTimePicker,
    SlTimeRangePicker,
  ],
  template: '',
})
class Host {
  readonly date = day(25);
  readonly time = plainTime(9);
  readonly days = { start: day(25), end: day(27) };
  readonly moment = at(25, 9);
  readonly times = { start: plainTime(9), end: plainTime(17) };
  readonly moments = { start: at(25, 9), end: at(27, 17) };
  readonly values: unknown[] = [];
}

/* Each picker open on a value, the value written at once: no confirmation. */
const PICKERS: [string, string][] = [
  ['date', 'slDatePicker [defaultValue]="date"'],
  ['time', 'slTimePicker [confirm]="false" [defaultValue]="time"'],
  ['date-range', 'slDateRangePicker [confirm]="false" [defaultValue]="days"'],
  ['datetime', 'slDateTimePicker [confirm]="false" [defaultValue]="moment"'],
  ['time-range', 'slTimeRangePicker [confirm]="false" [defaultValue]="times"'],
  ['datetime-range', 'slDateTimeRangePicker [confirm]="false" [defaultValue]="moments"'],
];

describe('the Clear of a panel', () => {
  it.each(PICKERS)('%s draws none when the picker is not clearable', (_, picker) => {
    const fixture = draw(picker);

    expect(clearIn(fixture)).toBeNull();
  });

  it.each(PICKERS)('%s requests null with clearable', (_, picker) => {
    const fixture = draw(`${picker} clearable`);

    clearIn(fixture)!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values.at(-1)).toBeNull();
  });

  it.each(PICKERS)('%s draws none when the value is required', (_, picker) => {
    const fixture = draw(`${picker} clearable required`);

    expect(clearIn(fixture)).toBeNull();
  });
});

function draw(attributes: string) {
  TestBed.resetTestingModule();
  TestBed.overrideComponent(Host, {
    set: {
      template: `<div ${attributes} defaultOpen (valueChange)="values.push($event.value)"></div>`,
    },
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();

  return fixture;
}

function clearIn(fixture: ReturnType<typeof draw>) {
  const panel = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');

  return panel?.querySelector<HTMLButtonElement>('[data-part="clear"]') ?? null;
}
