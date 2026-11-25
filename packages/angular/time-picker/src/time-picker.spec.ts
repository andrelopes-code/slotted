import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlClockSlot } from '@slotted/angular/clock';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { plainTime, toISOTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import type { PlainTime } from '@slotted/core/date';
import { afterEach, describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/time-picker/contract.json';
import { SlTimePicker } from './time-picker';
import { provideTimePickerDefaults } from './time-picker-defaults';
import { SlTimePickerFooter } from './time-picker-parts';

const t = plainTime;

describe('what it is made of', () => {
  it('declares every part the contract names, and opens the shared panel', () => {
    const fixture = render(picker('defaultOpen'));

    for (const part of contract.members.timePicker.parts) {
      expect(query(fixture, `[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(query(fixture, '[data-ui="picker-panel"][data-part="root"]')?.dataset['kind']).toBe(
      'time',
    );
  });

  it('is a dialog, and the trigger says so', () => {
    const fixture = render(picker('defaultOpen'));

    expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger(fixture).getAttribute('aria-controls')).toBe(dialog(fixture)?.id);
  });

  it('draws the whole day, the shortcuts and the steps from now', () => {
    const fixture = render(picker('defaultOpen [presets]="lunch"'));

    expect(options(fixture, 'Hours')).toHaveLength(24);
    expect(texts(queryAll(fixture, '[data-part="preset-label"]'))).toEqual(['Now', 'Lunch']);
    expect(texts(queryAll(fixture, '[data-part="preset-result"]'))).toEqual(['10:20', '12:00']);
    expect(texts(queryAll(fixture, '[data-part="chip"]'))).toEqual([
      '+15 min',
      '+30 min',
      '+1 hr',
      '+2 hr',
      '+4 hr',
      '+8 hr',
    ]);
  });

  it('is the clock alone when there is nothing to put in the rail', () => {
    expect(query(render(picker('defaultOpen [offsets]="[]"')), '[data-part="rail"]')).toBeNull();
  });

  it('draws whole times from a stated list, with no Now and no steps', () => {
    const fixture = render(
      picker(
        'defaultOpen [options]="clinic"',
        '<ng-template slClockSlot let-state="state">{{ state.label }} free</ng-template>',
      ),
    );

    expect(texts(options(fixture, 'Times'))).toEqual(['09:00 free', '09:20 free']);
    expect(query(fixture, '[data-part="rail"]')).toBeNull();
  });

  it('says how far the time is from now, and what the footer is given', () => {
    const fixture = render(
      picker('defaultOpen [defaultValue]="halfPastTwo"', '<span slTimePickerFooter>Gate B</span>'),
    );

    expect(text(fixture, 'time-meta')).toBe('in 4 hr 10 min');
    expect(text(fixture, 'hint')).toBe('Gate B');
    press(fixture, options(fixture, 'Hours')[9]!);
    expect(text(fixture, 'time-meta')).toBe('50 min ago');
  });

  it('says the step in the footer when the consumer says nothing', () => {
    expect(text(render(picker('defaultOpen')), 'hint')).toBe('Every 15 min');
  });
});

describe('the draft', () => {
  it('reaches the field only on Apply, which closes the panel', () => {
    const fixture = render(picker('defaultOpen [defaultValue]="halfPastTwo"'));

    press(fixture, options(fixture, 'Hours')[9]!);
    press(fixture, options(fixture, 'Minutes')[1]!);
    expect(written(fixture)).toEqual([]);

    press(fixture, action(fixture, 'apply'));
    expect(written(fixture)).toEqual(['09:15']);
    expect(dialog(fixture)).toBeNull();
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('is dropped by Escape', () => {
    const fixture = render(picker('defaultOpen [defaultValue]="halfPastTwo"'));

    press(fixture, options(fixture, 'Hours')[9]!);
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    fixture.detectChanges();
    expect(dialog(fixture)).toBeNull();

    press(fixture, trigger(fixture));
    expect(selected(fixture)).toEqual(['14', ':30']);
    expect(written(fixture)).toEqual([]);
  });

  it('follows what is typed in the field, and Apply keeps the typed time', () => {
    const fixture = render(picker('defaultOpen [defaultValue]="halfPastTwo"'));
    press(fixture, options(fixture, 'Hours')[9]!);

    const hour = query(fixture, '[data-part="control"] [data-field="hour"]')!;
    hour.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(written(fixture)).toEqual(['15:30']);
    expect(selected(fixture)).toEqual(['15', ':30']);

    press(fixture, action(fixture, 'apply'));
    expect(written(fixture)).toEqual(['15:30']);
  });

  it('is applied by Ctrl and Enter from anywhere in the panel', () => {
    const fixture = render(picker('defaultOpen'));

    press(fixture, options(fixture, 'Hours')[9]!);
    options(fixture, 'Hours')[9]!.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, ctrlKey: true, key: 'Enter' }),
    );
    expect(written(fixture)).toEqual(['09:00']);
  });

  it('is emptied by Clear, and Apply writes the empty value', () => {
    const fixture = render(picker('defaultOpen [defaultValue]="halfPastTwo"'));

    press(fixture, action(fixture, 'clear'));
    expect(written(fixture)).toEqual([]);
    press(fixture, action(fixture, 'apply'));
    expect(written(fixture)).toEqual([null]);
  });

  it('keeps Apply off while nothing is chosen, and says why a time is refused', () => {
    expect(action(render(picker('defaultOpen')), 'apply').disabled).toBe(true);

    const fixture = render(picker('defaultOpen [value]="halfPastTwo" [min]="evening"'));
    expect(action(fixture, 'apply').disabled).toBe(true);
    expect(text(fixture, 'hint')).toBe('Not an accepted time');
  });

  it('waits for the consumer who owns the value', () => {
    const fixture = render(picker('defaultOpen [value]="halfPastTwo"'));

    press(fixture, options(fixture, 'Hours')[9]!);
    press(fixture, action(fixture, 'apply'));
    press(fixture, trigger(fixture));
    expect(selected(fixture)).toEqual(['14', ':30']);
  });
});

describe('without a confirmation', () => {
  it('writes and closes on the press that completes the time', () => {
    const fixture = render(picker('defaultOpen confirm="false"'));

    press(fixture, options(fixture, 'Hours')[9]!);
    expect(written(fixture)).toEqual([]);
    press(fixture, options(fixture, 'Minutes')[1]!);
    expect(written(fixture)).toEqual(['09:15']);
    expect(dialog(fixture)).toBeNull();
  });

  it('completes on the hour where the step is whole hours', () => {
    const fixture = render(picker('defaultOpen confirm="false" step="3600"'));

    press(fixture, options(fixture, 'Hours')[9]!);
    expect(written(fixture)).toEqual(['09:00']);
  });

  it('is what the application says once for every picker, and writes a shortcut at once', () => {
    const fixture = render(picker('defaultOpen'), [provideTimePickerDefaults({ confirm: false })]);

    expect(query(fixture, '[data-part="apply"]')).toBeNull();
    press(fixture, query(fixture, '[data-part="preset"]')!);
    expect(written(fixture)).toEqual(['10:20']);
  });
});

describe('the shortcuts', () => {
  it('step from now, and refuse past midnight or out of bounds', () => {
    const fixture = render(
      picker('defaultOpen [max]="evening"').replace('tenTwenty', 'fiveInTheAfternoon'),
    );
    const chips = queryAll(fixture, '[data-part="chip"]') as HTMLButtonElement[];

    expect(chips.map((chip) => chip.disabled)).toEqual([false, false, false, true, true, true]);
    press(fixture, chips[2]!);
    press(fixture, action(fixture, 'apply'));
    expect(written(fixture)).toEqual(['18:00']);
  });

  it('mark the one the draft is, and refuse the one the rules refuse', () => {
    const fixture = render(picker('defaultOpen [presets]="lunch"'));
    const lunch = queryAll(fixture, '[data-part="preset"]')[1] as HTMLButtonElement;
    press(fixture, lunch);
    expect(lunch.getAttribute('aria-pressed')).toBe('true');
    expect(selected(fixture)).toEqual(['12', ':00']);

    const refused = render(picker('defaultOpen [min]="halfPastTwo" [presets]="lunch"'));
    expect((queryAll(refused, '[data-part="preset"]')[1] as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('opening', () => {
  it('takes focus to the chosen hour from the trigger', () => {
    const fixture = render(picker('[defaultValue]="halfPastTwo"'));

    press(fixture, trigger(fixture));
    expect(document.activeElement).toBe(options(fixture, 'Hours')[14]);
  });

  it('leaves focus in the field from the chord', () => {
    const fixture = render(picker('[defaultValue]="halfPastTwo"'));
    const hour = query(fixture, '[data-part="control"] [data-field="hour"]')!;
    hour.focus();

    hour.dispatchEvent(
      new KeyboardEvent('keydown', { altKey: true, bubbles: true, key: 'ArrowDown' }),
    );
    fixture.detectChanges();
    expect(dialog(fixture)).not.toBeNull();
    expect(document.activeElement).toBe(hour);
  });

  it('asks before moving the open state the consumer owns', () => {
    const fixture = render(picker('[open]="false" (openChange)="opens.push($event)"'));

    press(fixture, trigger(fixture));
    expect(fixture.componentInstance.opens[0]?.value).toBe(true);
    expect(dialog(fixture)).toBeNull();
  });

  it('answers no press at all while it is disabled', () => {
    expect(trigger(render(picker('disabled'))).disabled).toBe(true);
  });
});

describe('what is around it', () => {
  it('returns to the first value on a reset of the form', () => {
    const fixture = render(`<form>${picker('defaultOpen [defaultValue]="halfPastTwo"')}</form>`);
    press(fixture, options(fixture, 'Hours')[9]!);
    press(fixture, action(fixture, 'apply'));

    query(fixture, 'form')!.dispatchEvent(new Event('reset'));
    expect(written(fixture)).toEqual(['09:30', '14:30']);
  });

  it('names the control by the field around it, and not the panel', () => {
    const fixture = render(
      `<div slField><label slFieldLabel>Departure</label>${picker('defaultOpen')}</div>`,
    );
    const label = query(fixture, 'label')!;
    const named = queryAll(fixture, `[aria-labelledby~="${label.id}"]`);

    expect(named).toHaveLength(1);
    expect(dialog(fixture)?.contains(named[0]!)).toBe(false);
  });

  it('is invalid on a time the bounds refuse', () => {
    const fixture = render(picker('[defaultValue]="halfPastTwo" [min]="evening"'));

    expect(query(fixture, '[data-ui="time-picker"]')?.hasAttribute('data-invalid')).toBe(true);
  });

  it('changes its words with the language in force', () => {
    const fixture = render('<div slTimePicker defaultOpen [referenceTime]="tenTwenty"></div>', [
      provideSlotted({ catalogs: { 'pt-BR': PT_BR }, locale: 'pt-BR' }),
    ]);

    // language: pt-BR
    expect(action(fixture, 'apply').textContent?.trim()).toBe('Aplicar');
    expect(options(fixture, 'Minutos')).toHaveLength(4);
    // language: en-US
  });

  it('names the trigger with the time written', () => {
    const fixture = render(picker('[defaultValue]="halfPastTwo"'));

    expect(trigger(fixture).getAttribute('aria-label')).toBe('Change time, 14:30');
  });
});

@Component({
  standalone: true,
  imports: [SlClockSlot, SlField, SlFieldLabel, SlTimePicker, SlTimePickerFooter],
  template: '',
})
class Host {
  readonly clinic = [t(9), t(9, 20)];
  readonly evening = t(18);
  readonly fiveInTheAfternoon = t(17);
  readonly halfPastTwo = t(14, 30);
  readonly lunch = [{ label: 'Lunch', value: () => t(12) }];
  readonly opens: ChangeRequest<boolean>[] = [];
  readonly requests: ChangeRequest<PlainTime | null>[] = [];
  readonly tenTwenty = t(10, 20);
}

afterEach(() => document.body.replaceChildren());

function render(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement as Node);
  fixture.detectChanges();

  return fixture;
}

type Fixture = ReturnType<typeof render>;

function picker(attributes = '', content = '') {
  return `<div slTimePicker locale="en-US" [hourCycle]="24" [referenceTime]="tenTwenty" ${attributes} (valueChange)="requests.push($event)">${content}</div>`;
}

function queryAll(fixture: Fixture, selector: string) {
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(selector)];
}

function query(fixture: Fixture, selector: string) {
  return queryAll(fixture, selector)[0] ?? null;
}

function options(fixture: Fixture, name: string) {
  return queryAll(fixture, `[role="listbox"][aria-label="${name}"] [role="option"]`);
}

function texts(elements: readonly HTMLElement[]) {
  return elements.map((element) => element.textContent?.trim());
}

function text(fixture: Fixture, part: string) {
  return query(fixture, `[data-part="${part}"]`)?.textContent?.trim();
}

function press(fixture: Fixture, element: HTMLElement) {
  element.click();
  fixture.detectChanges();
}

function written(fixture: Fixture) {
  return fixture.componentInstance.requests.map(({ value }) => value && toISOTime(value, 'minute'));
}

const trigger = (fixture: Fixture) => query(fixture, '[data-part="trigger"]') as HTMLButtonElement;
const dialog = (fixture: Fixture) => query(fixture, '[role="dialog"]');
const action = (fixture: Fixture, part: 'apply' | 'clear') =>
  query(fixture, `[data-part="${part}"]`) as HTMLButtonElement;
const selected = (fixture: Fixture) => texts(queryAll(fixture, '[aria-selected="true"]'));
