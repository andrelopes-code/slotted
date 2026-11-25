import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSlotted } from '@slotted/angular/i18n';
import { plainTime, toISOTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/clock/contract.json';
import { SlClock, SlClockSlot } from './clock';
import type { ClockChangeRequest } from './clock.types';

const t = plainTime;

describe('what it is made of', () => {
  it('declares every part the contract names', () => {
    const fixture = render(`
      <div slClock locale="en-US" granularity="second" step="15"></div>
      <div slClock locale="en-US" [options]="listed"></div>
      <div slClock locale="en-US" [options]="[]"></div>`);

    for (const part of contract.members.clock.parts) {
      expect(query(fixture, `[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(query(fixture, '[data-part="root"]')?.getAttribute('data-ui')).toBe(contract.ui);
  });

  it('draws the twenty-four hours and the minutes of the step', () => {
    const fixture = render(clock('[defaultValue]="halfPastTwo"'));

    expect(options(fixture, 'Hours')).toHaveLength(24);
    expect(texts(options(fixture, 'Minutes'))).toEqual([':00', ':15', ':30', ':45']);
    expect(selected(fixture)).toEqual(['14', ':30']);
  });

  it('draws as many columns as the step asks for', () => {
    const six = render(clock('step="300"'));
    expect(query(six, '[data-part="minutes"]')?.getAttribute('data-columns')).toBe('6');

    const ten = render(clock('step="60"'));
    expect(query(ten, '[data-part="minutes"]')?.getAttribute('data-columns')).toBe('10');
  });

  it('draws no minutes at the hour granularity, and the seconds at the second', () => {
    expect(options(render(clock('granularity="hour"')), 'Minutes')).toEqual([]);
    expect(options(render(clock('step="7200"')), 'Minutes')).toEqual([]);

    const fixture = render(clock('granularity="second" step="15"'));
    expect(texts(options(fixture, 'Seconds'))).toEqual([':00', ':15', ':30', ':45']);
  });

  it('names the parts of the day, and the halves of a twelve-hour clock', () => {
    expect(groups(render(clock()))).toEqual(['Night', 'Morning', 'Afternoon', 'Evening']);

    const fixture = render(
      `<div slClock locale="en-US" [hourCycle]="12" [defaultValue]="halfPastTwo"></div>`,
    );
    expect(groups(fixture)).toEqual(['AM', 'AM', 'PM', 'PM']);
    expect(query(fixture, '[aria-label="02 PM"][aria-selected="true"]')?.textContent?.trim()).toBe(
      '2',
    );
  });

  it('outlines the hour it is', () => {
    const fixture = render(clock('[now]="tenTwenty"'));

    expect(texts(queryAll(fixture, '[data-now]'))).toEqual(['10']);
  });

  it('writes the language in force', () => {
    const fixture = render(`<div slClock></div>`, [
      provideSlotted({ catalogs: { 'pt-BR': PT_BR }, locale: 'pt-BR' }),
    ]);

    // language: pt-BR
    expect(groups(fixture)).toEqual(['Madrugada', 'Manhã', 'Tarde', 'Noite']);
    expect(options(fixture, 'Minutos')).toHaveLength(4);
    // language: en-US
  });
});

describe('choosing', () => {
  it('writes a whole time from the first hour pressed', () => {
    const fixture = render(clock());

    press(fixture, hour(fixture, 14), 1);
    expect(last(fixture)).toEqual(['14:00', 'hour', 'pointer']);

    press(fixture, options(fixture, 'Minutes')[2]!, 1);
    expect(last(fixture)).toEqual(['14:30', 'minute', 'pointer']);
  });

  it('keeps the minutes when the hour changes', () => {
    const fixture = render(clock('[defaultValue]="halfPastTwo"'));

    press(fixture, hour(fixture, 9));
    expect(last(fixture)).toEqual(['09:30', 'hour', 'keyboard']);
  });

  it('takes the nearest accepted minute of an hour that refuses the one held', () => {
    const fixture = render(
      clock('[defaultValue]="halfPastTwo" [isTimeUnavailable]="halfPastNine"'),
    );

    press(fixture, hour(fixture, 9));
    expect(last(fixture)?.[0]).toBe('09:15');
  });

  it('counts the minutes from the minimum', () => {
    const fixture = render(clock('[min]="tenPastEight" step="1800"'));

    press(fixture, hour(fixture, 8));
    expect(texts(options(fixture, 'Minutes'))).toEqual([':10', ':40']);
  });

  it('refuses a press on an hour with no accepted time, and keeps it focusable', () => {
    const fixture = render(clock('[min]="tenPastEight"'));

    expect(hour(fixture, 3).getAttribute('aria-disabled')).toBe('true');
    press(fixture, hour(fixture, 3));
    expect(fixture.componentInstance.requests).toEqual([]);
    hour(fixture, 3).focus();
    expect(document.activeElement).toBe(hour(fixture, 3));
  });

  it('asks for nothing while disabled or read only', () => {
    const off = render(clock('disabled'));
    press(off, hour(off, 3));
    expect(query(off, '[role="option"][tabindex="0"]')).toBeNull();
    expect(off.componentInstance.requests).toEqual([]);

    const locked = render(clock('readOnly'));
    press(locked, hour(locked, 3));
    expect(locked.componentInstance.requests).toEqual([]);
  });

  it('waits for the consumer who owns the value', () => {
    const fixture = render(clock('[value]="halfPastTwo"'));

    press(fixture, hour(fixture, 9));
    expect(selected(fixture)).toEqual(['14', ':30']);
  });

  it('cancels when the consumer refuses the request', () => {
    const fixture = render(
      `<div slClock locale="en-US" [hourCycle]="24" (valueChange)="$event.cancel()"></div>`,
    );

    press(fixture, hour(fixture, 9));
    expect(selected(fixture)).toEqual([]);
  });
});

describe('a stated list', () => {
  it('draws whole times under the part of the day', () => {
    const fixture = render(clock('[options]="listed" [isTimeUnavailable]="lunch"'));

    expect(groups(fixture)).toEqual(['Morning', 'Afternoon']);
    press(fixture, options(fixture, 'Times')[1]!);
    expect(last(fixture)).toEqual(['09:20', 'slot', 'keyboard']);

    press(fixture, options(fixture, 'Times')[2]!);
    expect(fixture.componentInstance.requests).toHaveLength(1);
  });

  it('hands the state of a time to its template', () => {
    const fixture = render(`
      <div slClock locale="en-US" [hourCycle]="24" [options]="listed">
        <ng-template slClockSlot let-state="state">{{ state.label }}, free</ng-template>
      </div>`);

    expect(texts(options(fixture, 'Times'))[0]).toBe('09:00, free');
  });

  it('says so when it offers nothing', () => {
    expect(query(render(clock('[options]="[]"')), '[data-part="empty"]')?.textContent).toBe(
      'No time available',
    );
  });
});

describe('the keyboard', () => {
  it('moves on both axes and chooses nothing', () => {
    const fixture = render(clock('[defaultValue]="halfPastTwo"'));
    hour(fixture, 14).focus();

    for (const [key, landing] of [
      ['ArrowRight', '15'],
      ['ArrowDown', '21'],
      ['Home', '18'],
      ['End', '23'],
      ['PageUp', '05'],
      ['PageDown', '23'],
    ] as const) {
      key$(fixture, key);
      expect(document.activeElement?.textContent?.trim(), key).toBe(landing);
    }
    expect(fixture.componentInstance.requests).toEqual([]);
  });

  it('keeps one stop for the hours and one for the minutes', () => {
    const fixture = render(clock('[defaultValue]="halfPastTwo"'));

    expect(texts(queryAll(fixture, '[role="option"][tabindex="0"]'))).toEqual(['14', ':30']);
  });

  it('leaves a chord to the surface around it', () => {
    const fixture = render(clock('[defaultValue]="halfPastTwo"'));
    hour(fixture, 14).focus();

    key$(fixture, 'ArrowRight', { ctrlKey: true });
    expect(document.activeElement).toBe(hour(fixture, 14));
  });
});

@Component({ standalone: true, imports: [SlClock, SlClockSlot], template: '' })
class Host {
  readonly halfPastTwo = t(14, 30);
  readonly tenTwenty = t(10, 20);
  readonly tenPastEight = t(8, 10);
  readonly listed = [t(9), t(9, 20), t(13, 45)];
  readonly requests: ClockChangeRequest[] = [];
  readonly halfPastNine = (time: PlainTime) => time.hour === 9 && time.minute === 30;
  readonly lunch = (time: PlainTime) => time.hour === 13;
}

function render(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement as Node);

  return fixture;
}

type Fixture = ReturnType<typeof render>;

function clock(attributes = '') {
  return `<div slClock locale="en-US" [hourCycle]="24" ${attributes} (valueChange)="requests.push($event)"></div>`;
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

function hour(fixture: Fixture, value: number) {
  return options(fixture, 'Hours')[value]!;
}

function groups(fixture: Fixture) {
  return queryAll(fixture, '[role="listbox"] > [role="group"]').map((group) =>
    group.getAttribute('aria-label'),
  );
}

function texts(elements: readonly HTMLElement[]) {
  return elements.map((element) => element.textContent?.trim());
}

function selected(fixture: Fixture) {
  return texts(queryAll(fixture, '[aria-selected="true"]'));
}

function press(fixture: Fixture, element: HTMLElement, detail = 0) {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail }));
  fixture.detectChanges();
}

function key$(fixture: Fixture, key: string, init: KeyboardEventInit = {}) {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...init }),
  );
  fixture.detectChanges();
}

function last(fixture: Fixture) {
  const request = fixture.componentInstance.requests.at(-1);

  return (
    request && [request.value && toISOTime(request.value, 'minute'), request.unit, request.reason]
  );
}
