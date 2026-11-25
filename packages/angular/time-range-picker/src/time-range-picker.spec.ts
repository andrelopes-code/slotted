import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlClockSlot } from '@slotted/angular/clock';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { plainTime as t } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/time-range-picker/contract.json';
import { SlTimeRangePicker } from './time-range-picker';
import { provideTimeRangePickerDefaults } from './time-range-picker-defaults';
import type { TimeRange } from './time-range-picker-defaults';
import { SlTimeRangePickerFooter } from './time-range-picker-parts';

const RUN: TimeRange = { start: t(9), end: t(11, 45) };

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlClockSlot,
    SlField,
    SlFieldLabel,
    SlTimeRangePicker,
    SlTimeRangePickerFooter,
  ],
  template: `<div slTimeRangePicker></div>`,
})
class Host {
  readonly run = RUN;
  readonly openRun: TimeRange = { start: t(9), end: null };
  readonly reversed: TimeRange = { start: t(22), end: t(6) };
  readonly now = t(8, 20);
  readonly listed = [t(9), t(13)];
  readonly shifts = [{ label: 'Work day', value: () => ({ start: t(9), end: t(18) }) }];
  readonly words = { start: 'From' };
  readonly noon = ({ hour }: PlainTime) => hour === 12;
  readonly inMinutes = (seconds: number) => `${String(seconds / 60)} minutes`;
  readonly control = new FormControl<TimeRange | null>(RUN);
  readonly onValue = vi.fn();
  readonly onPosition = vi.fn();
}

afterEach(() => vi.unstubAllGlobals());

describe('what it is made of', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    const fixture = draw('clearable defaultOpen [defaultValue]="run"');

    for (const name of contract.members.timeRangePicker.parts) {
      expect(part(fixture, name), name).not.toBeNull();
    }
    expect(root(fixture).dataset['ui']).toBe(contract.ui);
    expect(all(fixture, '[data-kind="time-range"]')).toHaveLength(1);
    expect(all(fixture, '[data-part="half"] [data-ui="time-field"]')).toHaveLength(2);
    expect(all(fixture, '[data-ui="clock"]')).toHaveLength(2);
    expect(all(fixture, '[role="slider"]')).toHaveLength(2);
  });

  it('is a one-line frame: the run in words, and its name with the length', () => {
    const fixture = draw('[defaultValue]="run"');

    expect(text(fixture, 'summary')).toBe('09:00 – 11:45');
    expect(root(fixture).querySelector('[data-ui="time-field"]')).toBeNull();
    expect(trigger(fixture).getAttribute('aria-label')).toMatch(/^Change range, .*, 2 hr 45 min$/);
  });

  it('writes the part of the day of each end, and the run of each shortcut', () => {
    const fixture = draw('defaultOpen [defaultValue]="run" [presets]="shifts"');

    expect(texts(fixture, '[data-part="half-meta"]')).toEqual(['morning', 'morning']);
    expect(texts(fixture, '[data-part="preset-result"]')).toEqual(['09:00 – 18:00']);
    expect(texts(fixture, '[data-part="chip"]')).toHaveLength(8);
  });

  it('draws a stated list the consumer’s own way, for both ends', () => {
    const fixture = draw(
      'defaultOpen [options]="listed"',
      '<ng-template slClockSlot let-state="state">{{ state.label }} free</ng-template>',
    );

    expect(texts(fixture, '[data-ui="clock"] [role="option"]')).toEqual([
      '09:00 free',
      '13:00 free',
      '09:00 free',
      '13:00 free',
    ]);
  });
});

describe('the draft', () => {
  it('takes a start, moves to the end, and Apply writes both', async () => {
    const fixture = draw('defaultOpen');

    click(fixture, options(fixture, 'Start', 'Hours')[9]!);
    expect((part(fixture, 'apply') as HTMLButtonElement).disabled).toBe(true);
    click(fixture, options(fixture, 'Start', 'Minutes')[0]!);
    await fixture.whenStable();
    expect(fixture.componentInstance.onPosition).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'end' }),
    );
    expect(options(fixture, 'End', 'Hours')).toContain(document.activeElement);

    click(fixture, options(fixture, 'End', 'Hours')[11]!);
    expect(written(fixture)).toEqual([]);
    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([{ start: t(9), end: t(11) }]);
    expect(part(fixture, 'content')).toBeNull();
  });

  it('takes a step, a length, a handle and a typed end', () => {
    const fixture = draw('defaultOpen [defaultValue]="run"');
    const [, longer] = all(fixture, '[data-part="span"] [data-part="step"]');
    const [start] = all(fixture, '[role="slider"]');

    click(fixture, longer!);
    expect(text(fixture, 'span-text')).toBe('3 hr');
    key(fixture, start!, 'PageUp');
    expect(text(fixture, 'span-text')).toBe('2 hr');
    key(fixture, all(fixture, '[data-part="half"] [role="spinbutton"]')[2]!, 'ArrowUp');
    expect(text(fixture, 'span-text')).toBe('3 hr');
    click(fixture, all(fixture, '[data-part="chip"]')[0]!);
    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([{ start: t(10), end: t(10, 15) }]);
  });

  it('takes a shortcut, and is applied by Ctrl and Enter', () => {
    const fixture = draw('defaultOpen [presets]="shifts"');

    click(fixture, part(fixture, 'preset'));
    expect(part(fixture, 'preset').getAttribute('aria-pressed')).toBe('true');
    key(fixture, part(fixture, 'content'), 'Enter', { ctrlKey: true });
    expect(written(fixture)).toEqual([{ start: t(9), end: t(18) }]);
  });

  it('is discarded by Escape, and emptied by Clear', () => {
    const fixture = draw('clearable defaultOpen [defaultValue]="run"');

    click(fixture, all(fixture, '[data-part="chip"]')[0]!);
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    fixture.detectChanges();
    click(fixture, trigger(fixture));
    expect(text(fixture, 'span-text')).toBe('2 hr 45 min');

    click(fixture, all(fixture, '[data-part="footer"] [data-part="clear"]')[0]!);
    click(fixture, part(fixture, 'apply'));
    expect(written(fixture)).toEqual([null]);
  });

  it('is written as it goes, without a confirmation', () => {
    const fixture = draw('confirm="false" defaultOpen [defaultValue]="run"');

    click(fixture, all(fixture, '[data-part="span"] [data-part="step"]')[1]!);
    expect(written(fixture)).toEqual([{ start: t(9), end: t(12) }]);
    expect(part(fixture, 'apply')).toBeNull();

    key(fixture, all(fixture, '[data-part="half"] [role="spinbutton"]')[0]!, 'ArrowUp');
    expect(written(fixture).at(-1)).toEqual({ start: t(10), end: t(12) });

    click(fixture, options(fixture, 'End', 'Minutes')[1]!);
    expect(written(fixture).at(-1)).toEqual({ start: t(10), end: t(12, 15) });
    expect(part(fixture, 'content')).toBeNull();
  });
});

describe('the rules', () => {
  it('strike in the clock of the end what the start refuses', () => {
    const fixture = draw(
      'defaultOpen step="3600" [defaultValue]="openRun" [isTimeUnavailable]="noon"',
    );
    expect(offered(fixture, 'End')).toEqual([10, 11]);

    const free = draw(
      'contiguous="false" defaultOpen step="3600" [defaultValue]="openRun" [isTimeUnavailable]="noon"',
    );
    expect(offered(free, 'End').at(-1)).toBe(23);
  });

  it('say why a run is refused, and by how much', () => {
    const reversed = draw('defaultOpen [defaultValue]="reversed"');
    expect(text(reversed, 'hint')).toBe('The end must come after the start');
    expect((part(reversed, 'apply') as HTMLButtonElement).disabled).toBe(true);

    const over = draw('defaultOpen maxLength="7200" [defaultValue]="run"');
    expect(text(over, 'hint')).toBe('45 min over the limit');
  });

  it('name the limits in the footer', () => {
    const fixture = draw('defaultOpen minLength="1800" [defaultValue]="run"');

    expect(text(fixture, 'hint')).toBe('at least 30 min');
  });
});

describe('the end being edited', () => {
  it('is the half the reader is in, and its clock', () => {
    const fixture = draw('defaultOpen [defaultValue]="run"');
    const [, end] = all(fixture, '[data-part="half"]');

    end!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(end!.hasAttribute('data-current')).toBe(true);
    expect(all(fixture, '[data-ui="clock"]')[1]!.hasAttribute('data-current')).toBe(true);
  });

  it('is a button in one column', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      addEventListener: () => undefined,
      matches: query.includes('760px'),
      removeEventListener: () => undefined,
    }));
    const fixture = draw('defaultOpen [defaultValue]="run"');

    expect(all(fixture, '[data-part="half"] [data-ui="time-field"]')).toHaveLength(0);
    click(fixture, all(fixture, '[data-part="half-time"]')[1]!);
    expect(all(fixture, '[data-ui="clock"]')[1]!.hasAttribute('data-current')).toBe(true);
  });
});

describe('what a form sees', () => {
  it('is the whole range, with the family’s own errors', () => {
    const fixture = draw('defaultOpen [formControl]="control" [minLength]="14400"');
    const { control } = fixture.componentInstance;
    expect(control.errors).toEqual({
      slottedTimeRangeLength: { actual: RUN, maxLength: undefined, minLength: 14400 },
    });

    click(fixture, all(fixture, '[data-part="chip"]')[7]!);
    click(fixture, part(fixture, 'apply'));
    expect(control.value).toEqual({ start: t(9), end: t(13) });
    expect(control.errors).toBeNull();

    control.setValue({ start: t(22), end: t(6) });
    fixture.detectChanges();
    expect(control.errors?.['slottedTimeRangeOrder']).toBeDefined();
    expect(text(fixture, 'summary')).toBe('22:00 – 06:00');

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
      (all(fixture, '[data-part="hidden-input"]') as HTMLInputElement[]).map((input) => [
        input.name,
        input.value,
      ]);

    click(fixture, all(fixture, '[data-part="chip"]')[3]!);
    click(fixture, part(fixture, 'apply'));
    expect(posted()).toEqual([
      ['from', '09:00:00'],
      ['to', '10:00:00'],
    ]);

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).reset();
    fixture.detectChanges();
    expect(posted()[1]).toEqual(['to', '11:45:00']);
  });

  it('is emptied by the clear on the frame', () => {
    const fixture = draw('clearable [defaultValue]="run"');

    click(fixture, part(fixture, 'clear'));
    expect(written(fixture)).toEqual([null]);
    expect(document.activeElement).toBe(trigger(fixture));
  });
});

describe('what the application states once', () => {
  it('is the step, the confirmation and the words of a length', () => {
    const fixture = draw('defaultOpen [defaultValue]="run"', '', undefined, [
      provideTimeRangePickerDefaults({
        confirm: false,
        lengthLabel: (seconds) => `${String(seconds / 60)} minutes`,
        step: 3600,
      }),
    ]);

    expect(text(fixture, 'span-text')).toBe('165 minutes');
    expect(options(fixture, 'Start', 'Minutes')).toHaveLength(0);
    expect(part(fixture, 'apply')).toBeNull();
  });

  it('is laid over by its own messages, length and footer', () => {
    const fixture = draw(
      'defaultOpen [defaultValue]="run" [lengthLabel]="inMinutes" [messages]="words"',
      '<span slTimeRangePickerFooter>The room closes at 6</span>',
    );

    expect(texts(fixture, '[data-part="half-label"]')).toEqual(['From', 'End']);
    expect(text(fixture, 'span-text')).toBe('165 minutes');
    expect(text(fixture, 'hint')).toBe('The room closes at 6');
  });

  it('is the language in force', () => {
    const fixture = draw(
      'defaultOpen minLength="3600" [defaultValue]="run"',
      '',
      (picker) => picker.replace('locale="en"', ''),
      [provideSlotted({ catalogs: { 'pt-BR': PT_BR }, locale: 'pt-BR' })],
    );

    // language: pt-BR
    expect(text(fixture, 'hint')).toBe('pelo menos 1 h');
    expect(texts(fixture, '[data-part="half-meta"]')).toEqual(['manhã', 'manhã']);
    // language: en-US
  });
});

function draw(
  attributes: string,
  content = '',
  wrap: (picker: string) => string = (picker) => picker,
  providers: unknown[] = [],
) {
  const picker = `<div slTimeRangePicker locale="en" [hourCycle]="24" [referenceTime]="now" ${attributes} (valueChange)="onValue($event)" (positionChange)="onPosition($event)">${content}</div>`;
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
    '[data-ui="time-range-picker"][data-part="root"]',
  ) as HTMLElement;
}

function trigger(fixture: Fixture) {
  return part(fixture, 'trigger') as HTMLButtonElement;
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
