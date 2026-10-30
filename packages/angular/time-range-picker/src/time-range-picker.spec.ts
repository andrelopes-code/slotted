import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-range-picker/contract.json';
import { SlTimeRangePicker, SlTimeRangePickerPreset } from './time-range-picker';
import { provideTimeRangePickerDefaults } from './time-range-picker-defaults';
import type {
  TimeRange,
  TimeRangePickerHighlight,
  TimeRangePickerPosition,
} from './time-range-picker-defaults';
import {
  SlTimeRangePickerFooter,
  SlTimeRangePickerOption,
  SlTimeRangePickerPresets,
} from './time-range-picker-parts';

const t = (hour: number, minute = 0) => plainTime(hour, minute);
const RUN: TimeRange = { start: t(14), end: t(16, 30) };

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlTimeRangePicker,
    SlTimeRangePickerFooter,
    SlTimeRangePickerOption,
    SlTimeRangePickerPresets,
    SlTimeRangePickerPreset,
  ],
  template: `<div slTimeRangePicker></div>`,
})
class Host {
  readonly run = RUN;
  readonly openRun: TimeRange = { start: t(14), end: null };
  readonly openEnd: TimeRange = { start: null, end: t(16) };
  readonly reversed: TimeRange = { start: t(22), end: t(6) };
  readonly late: TimeRange = { start: t(17), end: null };
  readonly sameLate: TimeRange = { start: t(17), end: t(17) };
  readonly morning: TimeRange = { start: t(9), end: t(12) };
  readonly earlyOpen: TimeRange = { start: t(9), end: null };
  readonly noon = t(12);
  readonly five = t(17);
  readonly control = new FormControl<TimeRange | null>(RUN);
  readonly values: (TimeRange | null)[] = [];
  readonly opens: boolean[] = [];
  readonly positions: TimeRangePickerPosition[] = [];
  readonly highlights: TimeRangePickerHighlight[] = [];
  readonly onValue = vi.fn((request: ChangeRequest<TimeRange | null>) => {
    this.values.push(request.value);
  });
  readonly onOpen = vi.fn((request: ChangeRequest<boolean>) => {
    this.opens.push(request.value);
  });
  readonly onPosition = vi.fn((request: ChangeRequest<TimeRangePickerPosition>) => {
    this.positions.push(request.value);
  });
  readonly onHighlight = vi.fn((request: ChangeRequest<TimeRangePickerHighlight>) => {
    this.highlights.push(request.value);
  });
  readonly refuseThree = (time: PlainTime) => time.hour === 15 && time.minute === 0;
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

/** Every scene writes 24-hour English times, so a row can be found by its text. */
const BASE = `slTimeRangePicker locale="en" [hourCycle]="24"`;

const root = (fixture: Fixture) =>
  fixture.nativeElement.querySelector(
    '[data-ui="time-range-picker"][data-part="root"]',
  ) as HTMLElement;
const part = (fixture: Fixture, name: string) =>
  fixture.nativeElement.querySelector(`[data-part="${name}"]`) as HTMLElement;
const text = (fixture: Fixture, name: string) => (part(fixture, name)?.textContent ?? '').trim();
const trigger = (fixture: Fixture) => part(fixture, 'trigger') as HTMLButtonElement;
const surface = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-part="content"]') as HTMLElement | null;
const tab = (fixture: Fixture, position: TimeRangePickerPosition) =>
  fixture.nativeElement.querySelector(
    `[data-part="tab"][data-position="${position}"]`,
  ) as HTMLElement;
/** The one panel, which is the current end's; asking for the other end swaps the tab. */
const panel = (fixture: Fixture, position: TimeRangePickerPosition) => {
  if (!tab(fixture, position).hasAttribute('data-current')) {
    tab(fixture, position).click();
    fixture.detectChanges();
  }
  return fixture.nativeElement.querySelector(
    `[data-part="panel"][data-position="${position}"]`,
  ) as HTMLElement;
};
const list = (fixture: Fixture, position: TimeRangePickerPosition) =>
  panel(fixture, position).querySelector('[data-part="list"]') as HTMLElement;
const optionFor = (fixture: Fixture, position: TimeRangePickerPosition, label: string) =>
  [...list(fixture, position).querySelectorAll<HTMLElement>('[data-part="option"]')].find((row) =>
    (row.textContent ?? '').trim().startsWith(label),
  ) as HTMLElement;
const segments = (fixture: Fixture, position: TimeRangePickerPosition) => {
  panel(fixture, position);
  return [...part(fixture, 'field').querySelectorAll<HTMLElement>('[role="spinbutton"]')];
};

const click = (fixture: Fixture, element: HTMLElement) => {
  element.click();
  fixture.detectChanges();
};
const key = (fixture: Fixture, element: HTMLElement, name: string) => {
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
  fixture.detectChanges();
};
const escape = (fixture: Fixture) => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  fixture.detectChanges();
};

describe('what it is made of', () => {
  it('renders a one-line frame, and two tabs, one field and one list behind it', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="run"></div>`);
    expect(root(fixture).getAttribute('data-ui')).toBe(contract.ui);
    expect(part(fixture, 'control').querySelectorAll('[data-ui="time-field"]')).toHaveLength(0);
    expect(surface(fixture)?.querySelectorAll('[data-ui="time-field"]')).toHaveLength(1);
    expect(surface(fixture)?.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    expect(surface(fixture)?.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(text(fixture, 'summary')).toBe('14:00 – 16:30');
    expect(tab(fixture, 'start').textContent).toContain('14:00');
    expect(tab(fixture, 'end').textContent).toContain('16:30');
  });

  it('declares every part the contract names', () => {
    /* The grip is drawn in the sheet presentation only. */
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen clearable defaultPosition="end" [defaultValue]="sameLate" [max]="five" [minLength]="900" [maxLength]="14400" unavailableOptions="hide">
         <div slTimeRangePickerPresets>
           <button [slTimeRangePickerPreset]="run">Afternoon</button>
         </div>
         <div slTimeRangePickerFooter><button type="button">Aplicar</button></div>
       </div>`,
    );
    /* One end at a time: the empty end and the list of the other are two tabs. */
    const collect = () =>
      [...fixture.nativeElement.querySelectorAll('[data-part]')].map(
        (element: Element) => (element as HTMLElement).dataset['part'],
      );
    const present = new Set(collect());
    click(fixture, tab(fixture, 'start'));
    for (const name of collect()) present.add(name);
    for (const name of contract.members.timeRangePicker.parts) {
      expect(present, `${name} is not rendered`).toContain(name);
    }

    vi.unstubAllGlobals();
  });

  it('carries the dialog role, and names the list by the current tab', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [messages]="{ start: 'Start', end: 'End' }"></div>`,
    );
    expect(surface(fixture)?.getAttribute('role')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(trigger(fixture).getAttribute('aria-controls')).toBe(surface(fixture)?.id);
    expect(part(fixture, 'tabs').getAttribute('role')).toBe('tablist');
    expect(tab(fixture, 'start').getAttribute('aria-selected')).toBe('true');
    const label = list(fixture, 'start').getAttribute('aria-labelledby') ?? '';
    expect(document.getElementById(label)).toBe(tab(fixture, 'start'));
    expect(part(fixture, 'field').querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Start',
    );
    const end = list(fixture, 'end');
    expect(document.getElementById(end.getAttribute('aria-labelledby') ?? '')).toBe(
      tab(fixture, 'end'),
    );
  });

  it('says what to choose, and what is wrong', () => {
    const empty = renderTemplate(
      `<div ${BASE} defaultOpen [messages]="{ start: 'Start', end: 'End' }"></div>`,
    );
    expect(text(empty, 'hint')).toBe('Start: choose a time');
    expect(list(empty, 'start').getAttribute('aria-describedby')).toBe(part(empty, 'hint').id);

    const reversed = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="reversed"></div>`);
    expect(text(reversed, 'hint')).toBe('The end must come after the start');
    expect(part(reversed, 'hint').hasAttribute('data-invalid')).toBe(true);

    const whole = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="run"></div>`);
    expect(text(whole, 'hint')).toBe('');
  });

  it('opens on the first end that is missing', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="openRun" (positionChange)="onPosition($event)"></div>`,
    );
    expect(tab(fixture, 'end').hasAttribute('data-current')).toBe(true);
    expect(fixture.componentInstance.onPosition.mock.calls.at(-1)?.[0].reason).toBe('programmatic');
  });

  it('submits two named values from the frame, whether the panel is open or not', () => {
    const fixture = renderTemplate(
      `<div ${BASE} [defaultValue]="run" startName="start" endName="end"></div>`,
    );
    expect(
      (fixture.nativeElement.querySelector('input[name="start"]') as HTMLInputElement).value,
    ).toBe('14:00:00');
    expect(
      (fixture.nativeElement.querySelector('input[name="end"]') as HTMLInputElement).value,
    ).toBe('16:30:00');
    expect(surface(fixture)).toBeNull();
  });

  /** Both marks are `Glyph` elements inside an `Icon` box, never masks. */
  it('draws the clock and the cross as glyph elements', () => {
    const fixture = renderTemplate(`<div ${BASE} clearable [defaultValue]="run"></div>`);
    const glyph = (name: string) =>
      part(fixture, name)
        ?.querySelector("[data-ui='icon'] > svg[data-glyph]")
        ?.getAttribute('data-glyph');
    expect(glyph('trigger')).toBe(contract.triggerIcon);
    expect(glyph('clear')).toBe('x');
  });
});

describe('what the frame says', () => {
  it('shows the placeholder and names itself for choosing while nothing is chosen', () => {
    const fixture = renderTemplate(`<div ${BASE} [messages]="{ choose: 'Choose time' }"></div>`);
    expect(trigger(fixture).getAttribute('aria-label')).toBe('Choose time');
    expect(part(fixture, 'summary').hasAttribute('data-placeholder')).toBe(true);
    expect(text(fixture, 'summary')).toBe('Choose time');
  });

  it('carries both ends and the duration once the run is whole', () => {
    const fixture = renderTemplate(
      `<div ${BASE} [messages]="{ change: 'Change time, {start} – {end}, {length}' }" [defaultValue]="run"></div>`,
    );
    const name = trigger(fixture).getAttribute('aria-label') ?? '';
    expect(name).toMatch(/^Change time, /);
    expect(name).toContain('2 hr 30 min');
  });
});

describe('the duration, said while the run is drawn', () => {
  it('says the duration of a whole value, and the pending one under the pointer', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="openRun"></div>`);
    expect(text(fixture, 'length')).toBe('');
    optionFor(fixture, 'end', '15:00').dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(text(fixture, 'length')).toBe('1 hr');
    expect(part(fixture, 'length').hasAttribute('data-pending')).toBe(true);
    expect(part(fixture, 'length').getAttribute('aria-live')).toBe('polite');
  });

  it('writes the duration beside every row the other end allows', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="run"></div>`);
    expect(
      optionFor(fixture, 'end', '15:00').querySelector('[data-part="option-duration"]')
        ?.textContent,
    ).toBe('1 hr');
    expect(
      optionFor(fixture, 'start', '13:00').querySelector('[data-part="option-duration"]')
        ?.textContent,
    ).toBe('3 hr 30 min');
    const refused = optionFor(fixture, 'end', '13:00');
    expect(refused.getAttribute('aria-disabled')).toBe('true');
    expect(refused.querySelector('[data-part="option-duration"]')).toBeNull();
  });

  it('names a limit while one is set', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [minLength]="1800" [maxLength]="14400"></div>`,
    );
    expect(text(fixture, 'limit')).toBe('30 min to 4 hr');
  });
});

describe('what each list refuses', () => {
  it('refuses, in the end list, the times a duration limit rules out', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="openRun" [minLength]="1800" [maxLength]="7200"></div>`,
    );
    expect(optionFor(fixture, 'end', '14:15').getAttribute('aria-disabled')).toBe('true');
    expect(optionFor(fixture, 'end', '14:30').hasAttribute('aria-disabled')).toBe(false);
    expect(optionFor(fixture, 'end', '16:15').getAttribute('aria-disabled')).toBe('true');
  });

  it('refuses the times beyond the first unavailable one while the run must be contiguous', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="openRun" [isTimeUnavailable]="refuseThree"></div>`,
    );
    expect(optionFor(fixture, 'end', '14:45').hasAttribute('aria-disabled')).toBe(false);
    expect(optionFor(fixture, 'end', '16:00').getAttribute('aria-disabled')).toBe('true');

    const loose = renderTemplate(
      `<div ${BASE} defaultOpen [contiguous]="false" [defaultValue]="openRun" [isTimeUnavailable]="refuseThree"></div>`,
    );
    expect(optionFor(loose, 'end', '16:00').hasAttribute('aria-disabled')).toBe(false);
  });

  it('refuses, in the start list, the times after a chosen end', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="openEnd"></div>`);
    expect(optionFor(fixture, 'start', '16:15').getAttribute('aria-disabled')).toBe('true');
    expect(optionFor(fixture, 'start', '15:45').hasAttribute('aria-disabled')).toBe(false);
  });

  it('draws the empty state when an end has no time at all', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="late" [max]="five" [minLength]="900" unavailableOptions="hide" [messages]="{ empty: 'Nada depois' }"></div>`,
    );
    expect(panel(fixture, 'end').querySelector('[data-part="empty"]')?.textContent?.trim()).toBe(
      'Nada depois',
    );
  });
});

describe('choosing a run', () => {
  it('holds the first press as work and carries the position to the other end', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen (valueChange)="onValue($event)" (positionChange)="onPosition($event)"></div>`,
    );
    const host = fixture.componentInstance;
    click(fixture, optionFor(fixture, 'start', '14:00'));
    expect(host.values).toEqual([]);
    expect(host.positions.at(-1)).toBe('end');
    expect(tab(fixture, 'end').hasAttribute('data-current')).toBe(true);
    expect(part(fixture, 'panel').getAttribute('data-position')).toBe('end');
    expect(optionFor(fixture, 'start', '14:00').hasAttribute('data-selected')).toBe(true);

    click(fixture, optionFor(fixture, 'end', '16:30'));
    expect(host.values).toEqual([{ start: t(14), end: t(16, 30) }]);
    expect(host.onValue.mock.calls.at(-1)?.[0].reason).toBe('select');
  });

  it('closes when the press completes the work, and stays open when it changes a whole one', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="openRun" (openChange)="onOpen($event)"></div>`,
    );
    click(fixture, optionFor(fixture, 'end', '16:00'));
    expect(fixture.componentInstance.opens).toEqual([false]);
    expect(document.activeElement).toBe(trigger(fixture));

    const whole = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="run" (openChange)="onOpen($event)" (valueChange)="onValue($event)"></div>`,
    );
    click(whole, optionFor(whole, 'end', '17:00'));
    expect(whole.componentInstance.values).toEqual([{ start: t(14), end: t(17) }]);
    expect(whole.componentInstance.opens).toEqual([]);
  });

  it('abandons the work on Escape and keeps the previous value', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="run" (valueChange)="onValue($event)"></div>`,
    );
    click(fixture, optionFor(fixture, 'start', '13:00'));
    expect(fixture.componentInstance.values).toHaveLength(1);
    escape(fixture);
    expect(root(fixture).hasAttribute('data-open')).toBe(false);
    expect(fixture.componentInstance.values).toHaveLength(1);
    expect(text(fixture, 'summary')).toBe('13:00 – 16:30');
  });

  it('writes now into the current end', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="earlyOpen" [referenceTime]="noon" (valueChange)="onValue($event)"></div>`,
    );
    panel(fixture, 'end');
    click(fixture, part(fixture, 'now'));
    expect(fixture.componentInstance.values.at(-1)).toEqual({ start: t(9), end: t(12) });
  });

  it('closes from done, emitting a whole work first', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen closeOnSelect="never" (valueChange)="onValue($event)" (openChange)="onOpen($event)"></div>`,
    );
    click(fixture, optionFor(fixture, 'start', '14:00'));
    click(fixture, optionFor(fixture, 'end', '16:00'));
    const host = fixture.componentInstance;
    expect(host.values).toHaveLength(1);
    click(fixture, part(fixture, 'done'));
    expect(host.values).toHaveLength(1);
    expect(host.opens).toEqual([false]);
    expect(host.onOpen.mock.calls.at(-1)?.[0].reason).toBe('pointer');
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('writes a preset whole, marks it selected, and closes', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen (valueChange)="onValue($event)" (openChange)="onOpen($event)">
         <div slTimeRangePickerPresets>
           <button [slTimeRangePickerPreset]="run">Afternoon</button>
           <button [slTimeRangePickerPreset]="morning">Morning</button>
         </div>
       </div>`,
    );
    const preset = [...fixture.nativeElement.querySelectorAll('[data-part="preset"]')].find(
      (element: Element) => element.textContent?.trim() === 'Afternoon',
    ) as HTMLElement;
    click(fixture, preset);
    expect(fixture.componentInstance.values).toEqual([RUN]);
    expect(fixture.componentInstance.opens).toEqual([false]);
  });

  it('empties both ends from the clear on the frame', () => {
    const fixture = renderTemplate(
      `<div ${BASE} clearable [defaultValue]="run" (valueChange)="onValue($event)"></div>`,
    );
    click(fixture, part(fixture, 'clear'));
    expect(fixture.componentInstance.values).toEqual([null]);
    expect(fixture.componentInstance.onValue.mock.calls[0]?.[0].reason).toBe('clear');
    expect(part(fixture, 'summary').hasAttribute('data-placeholder')).toBe(true);
  });

  it('draws a consumer template inside each row', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="run">
         <ng-template slTimeRangePickerOption let-time let-duration="duration" let-position="position">
           <em>{{ position }} {{ time.hour }} {{ duration }}</em>
         </ng-template>
       </div>`,
    );
    expect(optionFor(fixture, 'end', 'end 15').querySelector('em')?.textContent?.trim()).toBe(
      'end 15 1 hr',
    );
  });
});

describe('typing in the band', () => {
  it('writes an end typed in a field as a value on its own', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen (valueChange)="onValue($event)"></div>`,
    );
    const [hour, minute] = segments(fixture, 'start');
    key(fixture, hour as HTMLElement, '1');
    key(fixture, hour as HTMLElement, '4');
    key(fixture, minute as HTMLElement, '3');
    key(fixture, minute as HTMLElement, '0');
    expect(fixture.componentInstance.values.at(-1)).toEqual({ start: t(14, 30), end: null });
    expect(fixture.componentInstance.onValue.mock.calls.at(-1)?.[0].reason).toBe('keyboard');
  });

  it('names the end field invalid when it comes before the start, and swaps nothing', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen [defaultValue]="reversed"></div>`);
    expect(root(fixture).hasAttribute('data-invalid')).toBe(true);
    panel(fixture, 'end');
    expect(
      part(fixture, 'field').querySelector('[data-ui="time-field"]')?.hasAttribute('data-invalid'),
    ).toBe(true);
    panel(fixture, 'start');
    expect(
      part(fixture, 'field').querySelector('[data-ui="time-field"]')?.hasAttribute('data-invalid'),
    ).toBe(false);
    expect(text(fixture, 'summary')).toBe('22:00 – 06:00');
  });

  it('moves the current end from the tabs, by a press and by the arrows', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen (positionChange)="onPosition($event)"></div>`,
    );
    const host = fixture.componentInstance;
    click(fixture, tab(fixture, 'end'));
    expect(host.positions.at(-1)).toBe('end');
    expect(host.onPosition.mock.calls.at(-1)?.[0].reason).toBe('pointer');
    expect(part(fixture, 'field').getAttribute('data-position')).toBe('end');
    key(fixture, tab(fixture, 'end'), 'ArrowLeft');
    expect(host.positions.at(-1)).toBe('start');
    expect(host.onPosition.mock.calls.at(-1)?.[0].reason).toBe('keyboard');
    expect(part(fixture, 'panel').getAttribute('data-position')).toBe('start');
  });
});

describe('keys', () => {
  it('walks a list with the listbox keys and selects with Enter', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [defaultValue]="openRun" (valueChange)="onValue($event)" (highlightedChange)="onHighlight($event)"></div>`,
    );
    const end = list(fixture, 'end');
    key(fixture, end, 'ArrowDown');
    expect(fixture.componentInstance.highlights.at(-1)?.end).not.toBeNull();
    key(fixture, end, 'PageDown');
    key(fixture, end, 'Enter');
    expect(fixture.componentInstance.values).toHaveLength(1);
    expect(fixture.componentInstance.values[0]?.start).toEqual(t(14));
  });

  it('opens from the trigger and returns focus to it on Escape', () => {
    const fixture = renderTemplate(
      `<div ${BASE} [defaultValue]="run" (openChange)="onOpen($event)"></div>`,
    );
    key(fixture, trigger(fixture), 'ArrowDown');
    expect(fixture.componentInstance.opens).toEqual([true]);
    expect(surface(fixture)).not.toBeNull();
    escape(fixture);
    expect(fixture.componentInstance.opens).toEqual([true, false]);
    expect(document.activeElement).toBe(trigger(fixture));
  });
});

describe('forms and ownership', () => {
  it("belongs in a reactive form, and reports the family's own errors", () => {
    const fixture = renderTemplate(
      `<div ${BASE} [formControl]="control" [minLength]="14400"></div>`,
    );
    const control = fixture.componentInstance.control;
    expect(text(fixture, 'summary')).toBe('14:00 – 16:30');
    expect(control.errors).toEqual({
      slottedTimeRangeLength: { minLength: 14400, maxLength: undefined, actual: RUN },
    });
    control.setValue({ start: t(22), end: t(6) });
    fixture.detectChanges();
    expect(control.errors?.['slottedTimeRangeOrder']).toBeDefined();
    expect(text(fixture, 'summary')).toBe('22:00 – 06:00');
  });

  it('leaves a controlled value where the consumer put it', () => {
    const fixture = renderTemplate(
      `<div ${BASE} defaultOpen [value]="run" (valueChange)="onValue($event)"></div>`,
    );
    click(fixture, optionFor(fixture, 'end', '17:00'));
    expect(fixture.componentInstance.values).toHaveLength(1);
    expect(text(fixture, 'summary')).toBe('14:00 – 16:30');
  });

  it('reads the defaults an application provided once', () => {
    const fixture = renderTemplate(`<div ${BASE} defaultOpen></div>`, [
      provideTimeRangePickerDefaults({ step: 1800 }),
    ]);
    expect(optionFor(fixture, 'start', '00:15')).toBeUndefined();
    expect(optionFor(fixture, 'start', '00:30')).toBeDefined();
  });

  it('changes its words and its time format together with the language in force', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(`<div slTimeRangePicker [defaultValue]="run"></div>`, [
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);

    // language: pt-BR
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(/^Alterar período, /);
    // language: en-US
    expect(text(fixture, 'summary')).toBe('14:00 – 16:30');

    locale.set('en-US');
    fixture.detectChanges();
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(/^Change range, /);
    expect(text(fixture, 'summary')).toMatch(/0?2:00\sPM – 0?4:30\sPM/);
  });

  it('names the limit in the language in force', () => {
    const fixture = renderTemplate(
      `<div slTimeRangePicker defaultOpen [minLength]="1800" [maxLength]="14400"></div>`,
      [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    );
    expect(text(fixture, 'limit')).toMatch(/^de 30 min a 4 h/);
  });

  it('mutes, locks and marks the frame', () => {
    const fixture = renderTemplate(`<div ${BASE} disabled required></div>`);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
    expect(root(fixture).hasAttribute('data-required')).toBe(true);
    expect(trigger(fixture).disabled).toBe(true);
  });
});
