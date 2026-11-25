import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlClockSlot } from '@slotted/angular/clock';
import { provideSlotted } from '@slotted/angular/i18n';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/datetime-range-picker/contract.json';
import { SlDateTimeRangePicker } from './datetime-range-picker';
import { provideDateTimeRangePickerDefaults } from './datetime-range-picker-defaults';
import type { DateTimeRange } from './datetime-range-picker-defaults';
import { SlDateTimeRangePickerFooter } from './datetime-range-picker-parts';

const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));

/** A Thursday. Stated rather than read from the clock, so every assertion is fixed. */
const NOW = at(10, 10, 20);
const RUN: DateTimeRange = { start: at(14, 17), end: at(17, 10, 30) };

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SlClockSlot, SlDateTimeRangePicker, SlDateTimeRangePickerFooter],
  template: `<div slDateTimeRangePicker></div>`,
})
class Host {
  readonly run = RUN;
  readonly openRun: DateTimeRange = { start: at(14, 17), end: null };
  readonly sameDay: DateTimeRange = { start: at(14, 17), end: at(14, 20) };
  readonly reversed: DateTimeRange = { start: RUN.end, end: RUN.start };
  readonly now = NOW;
  readonly closes = at(17, 12);
  readonly listed = [plainTime(9), plainTime(17)];
  readonly trips = [{ label: 'Next week', value: () => RUN }];
  readonly words = { start: 'Pickup' };
  readonly closed = ({ day }: PlainDate) => day === 16;
  readonly control = new FormControl<DateTimeRange | null>(RUN);
  readonly onValue = vi.fn();
  readonly onPosition = vi.fn();
}

afterEach(() => vi.unstubAllGlobals());

describe('what it is made of', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    const fixture = draw('clearable defaultOpen [defaultValue]="run"');

    for (const name of contract.members.dateTimeRangePicker.parts) {
      expect(part(fixture, name), name).not.toBeNull();
    }
    expect(root(fixture).dataset['ui']).toBe(contract.ui);
    expect(all(fixture, '[data-kind="datetime-range"]')).toHaveLength(1);
    expect(all(fixture, '[data-part="half"] [data-ui="datetime-field"]')).toHaveLength(2);
    expect(all(fixture, '[data-ui="clock"]')).toHaveLength(2);
    expect(all(fixture, '[role="grid"]')).toHaveLength(2);
  });

  it('is a one-line frame: the run in words, and its name with the length', () => {
    const fixture = draw('[defaultValue]="run"');

    expect(texts(fixture, '[data-part="summary"]')).toEqual(['Sep 14, 17:00 – Sep 17, 10:30']);
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(
      /^Change range, .*, 2 days 17 hr 30 min$/,
    );
  });

  it('writes how far each end is, and the days of each shortcut', () => {
    const fixture = draw('defaultOpen [defaultValue]="run" [presets]="trips"');

    expect(texts(fixture, '[data-part="range-head"] > * > [data-part="half-meta"]')).toEqual([
      'Mon, in 4 days',
      'Thu, in 7 days',
    ]);
    expect(texts(fixture, '[data-part="preset-result"]')).toEqual(['Sep 14 – 17']);
    expect(texts(fixture, '[data-part="chip"]')).toHaveLength(6);
  });

  it('draws a stated list the consumer’s own way, per end and day', () => {
    const fixture = draw(
      'defaultOpen [defaultValue]="run" [options]="listed"',
      '<ng-template slClockSlot let-date="date" let-position="position" let-state="state">{{ position }} {{ date?.day }} {{ state.label }}</ng-template>',
    );

    expect(texts(fixture, '[data-ui="clock"] [role="option"]')).toEqual([
      'start 14 09:00',
      'start 14 17:00',
      'end 17 09:00',
      'end 17 17:00',
    ]);
  });
});

describe('the four halves', () => {
  it('are chosen one after the other, each press bringing the next grid', async () => {
    const fixture = draw('defaultOpen');

    click(fixture, day(fixture, 14));
    await fixture.whenStable();
    expect(options(fixture, 'Start', 'Hours')).toContain(document.activeElement);

    click(fixture, options(fixture, 'Start', 'Hours')[17]!);
    click(fixture, options(fixture, 'Start', 'Minutes')[0]!);
    expect(fixture.componentInstance.onPosition).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'end' }),
    );

    click(fixture, day(fixture, 17));
    await fixture.whenStable();
    expect(options(fixture, 'End', 'Hours')).toContain(document.activeElement);
    expect((part(fixture, 'apply') as HTMLButtonElement).disabled).toBe(true);

    click(fixture, options(fixture, 'End', 'Hours')[10]!);
    expect(written(fixture)).toEqual([]);
    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([{ start: at(14, 17), end: at(17, 10) }]);
    expect(part(fixture, 'content')).toBeNull();
  });

  it('are written in words while one of an end is missing', () => {
    const fixture = draw('defaultOpen');

    click(fixture, day(fixture, 14));
    expect(texts(fixture, '[data-part="half-day"]')).toEqual(['Mon, Sep 14']);
    expect(texts(fixture, '[data-part="half-time"]')).toEqual(['Time']);
  });

  it('keep their times under new days, and are typed in the head', () => {
    const fixture = draw('defaultOpen [defaultValue]="run"');

    click(fixture, day(fixture, 24));
    click(fixture, day(fixture, 21));
    key(fixture, all(fixture, '[data-part="half"] [role="spinbutton"]')[3]!, 'ArrowUp');
    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([{ start: at(21, 18), end: at(24, 10, 30) }]);
  });
});

describe('the draft', () => {
  it('takes a step, a length and a shortcut', () => {
    const fixture = draw('defaultOpen [defaultValue]="run" [presets]="trips"');

    click(fixture, all(fixture, '[data-part="span"] [data-part="step"]')[1]!);
    expect(text(fixture, 'span-text')).toBe('3 days 17 hr 30 min');
    click(fixture, all(fixture, '[data-part="chip"]')[4]!);
    expect(text(fixture, 'span-text')).toBe('7 days');
    click(fixture, part(fixture, 'preset'));
    key(fixture, part(fixture, 'content'), 'Enter', { ctrlKey: true });
    expect(text(fixture, 'summary')).toContain('Sep 17');
  });

  it('says the days of the run the pointer would draw', () => {
    const fixture = draw('defaultOpen [defaultValue]="run"');

    click(fixture, day(fixture, 21));
    day(fixture, 26).dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(text(fixture, 'span-text')).toBe('4 days 17 hr 30 min');
  });

  it('is discarded by Escape, and emptied by Clear', () => {
    const fixture = draw('defaultOpen [defaultValue]="run"');

    click(fixture, all(fixture, '[data-part="chip"]')[0]!);
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    fixture.detectChanges();
    click(fixture, trigger(fixture));
    expect(text(fixture, 'span-text')).toBe('2 days 17 hr 30 min');

    click(fixture, all(fixture, '[data-part="footer"] [data-part="clear"]')[0]!);
    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([null]);
  });

  it('is written as it goes, without a confirmation', () => {
    const fixture = draw('confirm="false" defaultOpen [defaultValue]="run"');

    click(fixture, all(fixture, '[data-part="span"] [data-part="step"]')[1]!);
    expect(written(fixture)).toEqual([{ ...RUN, end: at(18, 10, 30) }]);

    key(fixture, all(fixture, '[data-part="half"] [role="spinbutton"]')[3]!, 'ArrowUp');
    expect(written(fixture).at(-1)).toEqual({ start: at(14, 18), end: at(18, 10, 30) });

    click(fixture, options(fixture, 'End', 'Minutes')[0]!);
    expect(written(fixture).at(-1)).toEqual({ start: at(14, 18), end: at(18, 10) });
    expect(part(fixture, 'content')).toBeNull();
  });
});

describe('the rules', () => {
  it('strike in the clock of the end what a start of the same day refuses', () => {
    const fixture = draw('defaultOpen step="3600" [defaultValue]="sameDay"');

    expect(offered(fixture, 'Start')).toHaveLength(24);
    expect(offered(fixture, 'End')).toEqual([18, 19, 20, 21, 22, 23]);
  });

  it('bound each clock on its own day', () => {
    const fixture = draw('defaultOpen step="3600" [defaultValue]="run" [max]="closes"');

    expect(offered(fixture, 'End').at(-1)).toBe(12);
  });

  it('stop the days of a run at an unavailable one, unless it may cross it', () => {
    const rules = 'defaultOpen [defaultValue]="openRun" [isDateUnavailable]="closed"';

    expect(day(draw(rules), 17).getAttribute('aria-disabled')).toBe('true');
    expect(day(draw(`contiguous="false" ${rules}`), 17).getAttribute('aria-disabled')).toBeNull();
  });

  it('say why a run is refused, and by how much', () => {
    const reversed = draw('defaultOpen [defaultValue]="reversed"');
    expect(text(reversed, 'hint')).toBe('The end must come after the start');

    const over = draw('defaultOpen maxLength="172800" [defaultValue]="run"');
    expect(text(over, 'hint')).toBe('17 hr 30 min over the limit');
    expect(texts(over, '[data-part="cell"][data-over]')).toEqual(['17']);
    expect((part(over, 'apply') as HTMLButtonElement).disabled).toBe(true);
  });

  it('name the limits in the footer, and the zone without one', () => {
    expect(text(draw('defaultOpen minLength="86400"'), 'hint')).toBe('at least 1 day');
    expect(text(draw('defaultOpen timeZone="Europe/Lisbon"'), 'hint')).toBe('Europe/Lisbon');
  });
});

describe('one part at a time', () => {
  it('shows the day or the time of one end, and the halves bring them', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      addEventListener: () => undefined,
      matches: query.includes('760px'),
      removeEventListener: () => undefined,
    }));
    const fixture = draw('defaultOpen [defaultValue]="run"');
    const showing = () => all(fixture, '[data-kind]')[0]!.dataset['showing'];
    expect(showing()).toBe('day');
    expect(all(fixture, '[role="grid"]')).toHaveLength(1);

    click(fixture, all(fixture, '[data-part="half-time"]')[1]!);
    expect(showing()).toBe('time');
    expect(all(fixture, '[data-ui="clock"]')[1]!.hasAttribute('data-current')).toBe(true);

    click(fixture, all(fixture, '[data-part="half-day"]')[0]!);
    expect(showing()).toBe('day');
  });
});

describe('what a form sees', () => {
  it('is the whole range, with the family’s own errors', () => {
    const fixture = draw('defaultOpen [formControl]="control" [minLength]="604800"');
    const { control } = fixture.componentInstance;
    expect(control.errors).toEqual({
      slottedDateTimeRangeLength: { actual: RUN, maxLength: undefined, minLength: 604800 },
    });

    click(fixture, all(fixture, '[data-part="chip"]')[4]!);
    click(fixture, part(fixture, 'apply'));
    expect(control.value).toEqual({ ...RUN, end: at(21, 17) });
    expect(control.errors).toBeNull();

    control.setValue({ start: RUN.end, end: RUN.start });
    expect(control.errors?.['slottedDateTimeRangeOrder']).toBeDefined();

    control.disable();
    fixture.detectChanges();
    expect(trigger(fixture).disabled).toBe(true);
  });

  it('is two named inputs, which a reset takes back to the first run', () => {
    const fixture = draw(
      'defaultOpen endName="to" startName="from" [defaultValue]="run"',
      '',
      (picker) => `<form>${picker}</form>`,
    );
    const posted = () =>
      (
        all(fixture, '[data-part="control"] > [data-part="hidden-input"]') as HTMLInputElement[]
      ).map((input) => [input.name, input.value]);

    click(fixture, all(fixture, '[data-part="chip"]')[4]!);
    click(fixture, part(fixture, 'apply'));
    expect(posted()).toEqual([
      ['from', '2026-09-14T17:00:00'],
      ['to', '2026-09-21T17:00:00'],
    ]);

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).reset();
    fixture.detectChanges();
    expect(posted()[1]).toEqual(['to', '2026-09-17T10:30:00']);
  });

  it('is emptied by the clear on the frame', () => {
    const fixture = draw('clearable [defaultValue]="run"');

    click(fixture, part(fixture, 'clear'));
    expect(written(fixture)).toEqual([null]);
    expect(document.activeElement).toBe(trigger(fixture));
  });
});

describe('what the application states once', () => {
  it('is the months, the step and the confirmation', () => {
    const fixture = draw('defaultOpen [defaultValue]="run"', '', undefined, [
      provideDateTimeRangePickerDefaults({ confirm: false, months: 1, step: 3600 }),
    ]);

    expect(all(fixture, '[role="grid"]')).toHaveLength(1);
    expect(options(fixture, 'Start', 'Minutes')).toHaveLength(0);
    expect(part(fixture, 'apply')).toBeNull();
  });

  it('is laid over by its own messages and footer', () => {
    const fixture = draw(
      'defaultOpen [defaultValue]="run" [messages]="words"',
      '<span slDateTimeRangePickerFooter>Keys at the desk</span>',
    );

    expect(texts(fixture, '[data-part="half-label"]')).toEqual(['Pickup', 'End']);
    expect(text(fixture, 'hint')).toBe('Keys at the desk');
  });

  it('is the language in force', () => {
    const fixture = draw(
      'defaultOpen minLength="86400" [defaultValue]="run"',
      '',
      (picker) => picker.replace('locale="en-US"', ''),
      [provideSlotted({ catalogs: { 'pt-BR': PT_BR }, locale: 'pt-BR' })],
    );

    // language: pt-BR
    expect(text(fixture, 'hint')).toBe('pelo menos 1 dia');
    expect(text(fixture, 'half-meta')).toBe('seg., em 4 dias');
    // language: en-US
  });
});

function draw(
  attributes: string,
  content = '',
  wrap: (picker: string) => string = (picker) => picker,
  providers: unknown[] = [],
) {
  const picker = `<div slDateTimeRangePicker locale="en-US" [hourCycle]="24" [referenceDateTime]="now" ${attributes} (valueChange)="onValue($event)" (positionChange)="onPosition($event)">${content}</div>`;
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template: wrap(picker) } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();

  return fixture;
}

type Fixture = ReturnType<typeof draw>;

function all(fixture: Fixture, selector: string) {
  return [...fixture.nativeElement.querySelectorAll(selector)] as HTMLElement[];
}

function texts(fixture: Fixture, selector: string) {
  return all(fixture, selector).map((element) =>
    (element.textContent ?? '').trim().replaceAll(/\s/g, ' '),
  );
}

function part(fixture: Fixture, name: string) {
  return fixture.nativeElement.querySelector(`[data-part="${name}"]`) as HTMLElement;
}

function text(fixture: Fixture, name: string) {
  return (part(fixture, name)?.textContent ?? '').trim();
}

function root(fixture: Fixture) {
  return fixture.nativeElement.querySelector(
    '[data-ui="datetime-range-picker"][data-part="root"]',
  ) as HTMLElement;
}

function trigger(fixture: Fixture) {
  return part(fixture, 'trigger') as HTMLButtonElement;
}

function day(fixture: Fixture, date: number) {
  return all(fixture, '[data-part="day"]').find(
    (element) =>
      element.textContent?.trim() === String(date) &&
      element.closest('[data-part="cell"]')?.hasAttribute('data-outside-month') === false,
  )!;
}

function options(fixture: Fixture, end: string, unit: string) {
  return all(
    fixture,
    `[data-ui="clock"][aria-label="${end}"] [role="listbox"][aria-label="${unit}"] [role="option"]`,
  );
}

/** The hours the clock of an end accepts. */
function offered(fixture: Fixture, end: string) {
  return options(fixture, end, 'Hours').flatMap((hour, index) =>
    hour.getAttribute('aria-disabled') === 'true' ? [] : [index],
  );
}

function written(fixture: Fixture) {
  return fixture.componentInstance.onValue.mock.calls.map(([request]) => request.value);
}

function click(fixture: Fixture, element: HTMLElement) {
  element.click();
  fixture.detectChanges();
}

function key(fixture: Fixture, element: HTMLElement, name: string, init: KeyboardEventInit = {}) {
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: name, ...init }));
  fixture.detectChanges();
}
