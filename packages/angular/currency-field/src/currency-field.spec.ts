import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import type { CurrencyChangeRequest } from '@slotted/core/currency';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/currency-field/contract.json';
import { SlCurrencyField } from './currency-field';
import { provideCurrencyFieldDefaults } from './currency-field-defaults';
import { SlCurrencyFieldInput } from './currency-field-input';
import {
  SlCurrencyFieldEnd,
  SlCurrencyFieldScrub,
  SlCurrencyFieldStart,
} from './currency-field-parts';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlCurrencyField,
    SlCurrencyFieldEnd,
    SlCurrencyFieldInput,
    SlCurrencyFieldScrub,
    SlCurrencyFieldStart,
    SlField,
    SlFieldError,
    SlFieldLabel,
  ],
  template: `<div slCurrencyField></div>`,
})
class Host {
  readonly value = signal<number | null | undefined>(undefined);
  readonly seen = signal<CurrencyChangeRequest[]>([]);
  readonly control = new FormControl<number | null>(1480);

  record(request: CurrencyChangeRequest) {
    this.seen.update((all) => [...all, request]);
    if (this.value() !== undefined) this.value.set(request.value);
  }

  refuse(request: CurrencyChangeRequest) {
    request.cancel();
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

const query = (fixture: Fixture, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;

const input = (fixture: Fixture) => query(fixture, '[data-part="input"]') as HTMLInputElement;
const stepper = (fixture: Fixture, part: 'increment' | 'decrement') =>
  query(fixture, `[data-part="${part}"]`) as HTMLButtonElement;

/**
 * `Intl` separates a symbol from its amount with a non-breaking space, and the
 * normalization runs over the value the control holds rather than over the
 * expectation: a test that wrote the invisible character itself would compare
 * two strings a reader cannot tell apart.
 */
const plain = (text: string) => text.replace(/\u00a0/g, ' ');

function type(element: HTMLInputElement, value: string, inputType = 'insertText') {
  element.value = value;
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType }));
}

/** What a reader typing digit by digit produces, under cents-first entry. */
function typeDigits(fixture: Fixture, digits: string) {
  for (const digit of digits) {
    type(input(fixture), input(fixture).value + digit);
    fixture.detectChanges();
  }
}

function beforeInput(element: HTMLInputElement, data: string, inputType = 'insertText') {
  const event = new InputEvent('beforeinput', { bubbles: true, cancelable: true, data, inputType });
  element.dispatchEvent(event);
  return event;
}

function key(element: HTMLElement, init: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  element.dispatchEvent(event);
  return event;
}

function press(button: HTMLButtonElement) {
  button.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }),
  );
  button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
}

describe('SlCurrencyField', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField stepper="stacked">
        <span slCurrencyFieldStart>$</span>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="1480" />
        <span slCurrencyFieldEnd>per month</span>
      </div>`);

    const root = query(fixture, '[data-ui="currency-field"]');
    expect(root.getAttribute('data-part')).toBe('root');
    expect(input(fixture).getAttribute('data-part')).toBe('input');
    expect(query(fixture, '[data-part="start"]').textContent).toContain('$');
    expect(query(fixture, '[data-part="end"]').textContent).toContain('per month');
    expect(query(fixture, '[data-part="stepper"]')).not.toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);
    const root = query(fixture, '[data-ui="currency-field"]');
    const { defaults } = contract.members.currencyField;

    expect(root.getAttribute('data-size')).toBe(defaults.size);
    expect(root.getAttribute('data-variant')).toBe(defaults.variant);
    expect(root.getAttribute('data-align')).toBe(defaults.align);
    expect(root.getAttribute('data-entry')).toBe(defaults.entry);
    expect(root.getAttribute('data-stepper')).toBe(defaults.stepper);
  });

  it('holds the amount in a text input carrying the spinbutton role', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          defaultValue="1480"
          min="0"
          max="5000"
        />
      </div>`);

    expect(input(fixture).getAttribute('type')).toBe('text');
    expect(input(fixture).getAttribute('role')).toBe(contract.controlRole);
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('1480');
    expect(input(fixture).getAttribute('aria-valuemin')).toBe('0');
    expect(input(fixture).getAttribute('aria-valuemax')).toBe('5000');
    expect(plain(input(fixture).getAttribute('aria-valuetext') ?? '')).toBe('R$ 1.480,00');
  });

  it('writes the symbol the currency names and the separators the locale writes', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="USD" locale="pt-BR" defaultValue="1480" />
      </div>`);

    expect(plain(input(fixture).value)).toBe('US$ 1.480,00');
  });

  it('refuses to render without a currency', () => {
    expect(() =>
      renderTemplate(`
        <div slCurrencyField>
          <input slCurrencyFieldInput locale="pt-BR" />
        </div>`),
    ).toThrow(/currency/i);
  });

  /**
   * The arrangement `Intl` has no option for: the symbol beside the amount
   * rather than inside it, with the currency still deciding the shift.
   */
  it('writes no currency at all under the display that has none', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <span slCurrencyFieldStart>R$</span>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" currencyDisplay="none" />
      </div>`);

    typeDigits(fixture, '1234');
    expect(input(fixture).value).toBe('12,34');
    expect(query(fixture, '[data-part="start"]').textContent).toContain('R$');
  });

  it('takes the currency an application set once', () => {
    const fixture = renderTemplate(
      `<div slCurrencyField>
        <input slCurrencyFieldInput defaultValue="1480" />
      </div>`,
      [provideSlotted({ locale: 'ja-JP' }), provideCurrencyFieldDefaults({ currency: 'JPY' })],
    );

    expect(input(fixture).value).toBe('￥1,480');
  });

  it('writes and speaks in the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slCurrencyField stepper="split">
        <input slCurrencyFieldInput currency="BRL" defaultValue="1480" />
      </div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );

    expect(plain(input(fixture).value)).toBe('R$ 1.480,00');
    expect(stepper(fixture, 'increment').getAttribute('aria-label')).toBe('Aumentar');

    locale.set('en-US');
    fixture.detectChanges();
    expect(stepper(fixture, 'increment').getAttribute('aria-label')).toBe('Increase');
    expect(stepper(fixture, 'decrement').getAttribute('aria-label')).toBe('Decrease');
  });
});

describe('cents-first entry', () => {
  it('shifts each digit left by the currency minor units', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    typeDigits(fixture, '1234');
    expect(plain(input(fixture).value)).toBe('R$ 12,34');
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('12.34');
  });

  it('shifts by nothing in a currency with no cent, and by three in one with three', () => {
    const yen = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="JPY" locale="pt-BR" />
      </div>`);
    typeDigits(yen, '1234');
    expect(yen.componentInstance).toBeDefined();
    expect(input(yen).getAttribute('aria-valuenow')).toBe('1234');

    const dinar = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="KWD" locale="pt-BR" />
      </div>`);
    typeDigits(dinar, '1234');
    expect(input(dinar).getAttribute('aria-valuenow')).toBe('1.234');
  });

  /**
   * The caret is not where a digit lands. A cash register takes the digit at
   * the minor unit whatever the reader is pointing at, and this is the whole
   * of `entry="cents"`.
   */
  it('takes every edit at the right, wherever the caret was', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    typeDigits(fixture, '1234');

    /* `9` typed against the first digit. */
    type(input(fixture), 'R$\u00a0912,34');
    fixture.detectChanges();
    expect(plain(input(fixture).value)).toBe('R$ 123,49');

    /* Backspace pressed against the second whole digit. */
    type(input(fixture), 'R$\u00a012,49', 'deleteContentBackward');
    fixture.detectChanges();
    expect(plain(input(fixture).value)).toBe('R$ 12,34');

    /* `5` typed over `2,3`. */
    type(input(fixture), 'R$\u00a0154');
    fixture.detectChanges();
    expect(plain(input(fixture).value)).toBe('R$ 1,25');
  });

  it('puts the caret back after the last digit', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    input(fixture).focus();
    typeDigits(fixture, '1234');
    input(fixture).setSelectionRange(3, 3);
    type(input(fixture), 'R$\u00a0912,34');
    fixture.detectChanges();

    expect(plain(input(fixture).value)).toBe('R$ 123,49');
    expect(input(fixture).selectionStart).toBe(input(fixture).value.length);
  });

  /**
   * Both shapes the item names, each read by the locale it is pasted into. In
   * a locale that groups with a full stop, `1234.56` is one hundred and
   * twenty-three thousand — the group separator is what a full stop is there.
   */
  it('parses a pasted amount by the locale it is pasted into', () => {
    const brazil = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    type(input(brazil), '1.234,56', 'insertFromPaste');
    brazil.detectChanges();
    expect(input(brazil).getAttribute('aria-valuenow')).toBe('1234.56');

    type(input(brazil), '1234.56', 'insertFromPaste');
    brazil.detectChanges();
    expect(input(brazil).getAttribute('aria-valuenow')).toBe('123456');

    const states = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="USD" locale="en-US" />
      </div>`);
    type(input(states), '1234.56', 'insertFromPaste');
    states.detectChanges();
    expect(input(states).getAttribute('aria-valuenow')).toBe('1234.56');
  });

  /**
   * Backspace shifts the digits right, and the last one leaves nought rather
   * than nothing: an amount is not an optional number.
   */
  it('empties to nought, and to nothing only when nothing is allowed', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    typeDigits(fixture, '12');
    type(input(fixture), '', 'deleteContentBackward');
    fixture.detectChanges();

    expect(plain(input(fixture).value)).toBe('R$ 0,00');
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('0');

    const allowed = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" allowEmpty />
      </div>`);
    typeDigits(allowed, '12');
    type(input(allowed), '', 'deleteContentBackward');
    allowed.detectChanges();

    expect(input(allowed).value).toBe('');
    expect(input(allowed).hasAttribute('aria-valuenow')).toBe(false);
  });

  /** An amount that holds nothing reads as nought before anything is typed. */
  it('shows nought in a control nobody has touched, and nothing under allowEmpty', () => {
    const nought = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" name="total" />
      </div>`);
    expect(plain(input(nought).value)).toBe('R$ 0,00');
    expect((query(nought, 'input[type="hidden"]') as unknown as HTMLInputElement).value).toBe('0');

    const allowed = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" name="total" allowEmpty />
      </div>`);
    expect(input(allowed).value).toBe('');
    expect((query(allowed, 'input[type="hidden"]') as unknown as HTMLInputElement).value).toBe('');
  });

  it('parses a paste instead of accumulating its digits', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    type(input(fixture), 'R$\u00a01.480,00', 'insertFromPaste');
    fixture.detectChanges();

    expect(input(fixture).getAttribute('aria-valuenow')).toBe('1480');
  });

  it('reads an accounting negative back as a negative when it is pasted', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="USD" locale="en-US" min="-100000" />
      </div>`);

    type(input(fixture), '($1,234.56)', 'insertFromPaste');
    fixture.detectChanges();

    expect(input(fixture).getAttribute('aria-valuenow')).toBe('-1234.56');
  });

  it('refuses a separator and every other character that is not a digit', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    expect(beforeInput(input(fixture), ',').defaultPrevented).toBe(true);
    expect(beforeInput(input(fixture), 'a').defaultPrevented).toBe(true);
    expect(beforeInput(input(fixture), '7').defaultPrevented).toBe(false);
    expect(beforeInput(input(fixture), 'R$ 1.480,00', 'insertFromPaste').defaultPrevented).toBe(
      false,
    );
  });

  it('stops at the digit a double could not hold', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    typeDigits(fixture, '123456789012345');
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('1234567890123.45');
    expect(beforeInput(input(fixture), '6').defaultPrevented).toBe(true);
  });

  it('sets the sign with a key rather than with a digit', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    typeDigits(fixture, '1234');
    beforeInput(input(fixture), '-');
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('-12.34');

    beforeInput(input(fixture), '+');
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('12.34');
  });

  it('remembers a sign typed into an empty amount', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" />
      </div>`);

    beforeInput(input(fixture), '-');
    typeDigits(fixture, '5');
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('-0.05');
  });

  it('refuses a sign the range does not admit', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12.34" min="0" />
      </div>`);

    beforeInput(input(fixture), '-');
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('12.34');
  });

  it('asks for the numeric keypad, whatever the range admits', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" min="-100" />
      </div>`);

    expect(input(fixture).getAttribute('inputmode')).toBe('numeric');
  });
});

describe('natural entry', () => {
  /**
   * `number-field`'s model, and `number-field`'s axis with it: an amount is
   * scannable while it is being typed, and the padding to the currency's own
   * minor units still belongs to the commit.
   */
  it('gives the text the locale’s shape on the keystroke that changed it', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" entry="natural" />
      </div>`);

    type(input(fixture), '1234,5');
    fixture.detectChanges();
    expect(plain(input(fixture).value)).toBe('R$ 1.234,5');
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('1234.5');

    input(fixture).dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(plain(input(fixture).value)).toBe('R$ 1.234,50');
  });

  it('leaves the text alone until a commit when asked to', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          entry="natural"
          formatOn="commit"
        />
      </div>`);

    type(input(fixture), '1234,5');
    fixture.detectChanges();
    expect(input(fixture).value).toBe('1234,5');
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('1234.5');

    input(fixture).dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(plain(input(fixture).value)).toBe('R$ 1.234,50');
  });

  it('paints the model the control resolved onto the frame', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" entry="natural" />
      </div>`);

    expect(query(fixture, '[data-ui="currency-field"]').getAttribute('data-entry')).toBe('natural');
  });
});

describe('an amount held in minor units', () => {
  it('reports the integer of the minor unit for what the reader types', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          unit="minor"
          (valueChange)="record($event)"
        />
      </div>`);

    typeDigits(fixture, '12345');

    expect(plain(input(fixture).value)).toBe('R$ 123,45');
    const [last] = fixture.componentInstance.seen().slice(-1);
    expect(last?.value).toBe(12345);
    expect(last?.previous).toBe(1234);
    expect(last?.minorUnits).toBe(12345);
  });

  it('reads the value, the range, the step, the form model and the submitted amount in minor units', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          max="20000"
          name="total"
          step="50"
          unit="minor"
          [formControl]="control"
          (valueChange)="record($event)"
        />
      </div>`);
    fixture.componentInstance.control.setValue(12345);
    fixture.detectChanges();

    expect(plain(input(fixture).value)).toBe('R$ 123,45');
    expect(input(fixture).getAttribute('aria-valuemax')).toBe('200');
    expect((query(fixture, 'input[name="total"]') as HTMLInputElement).value).toBe('12345');
    key(input(fixture), { key: 'ArrowUp' });
    fixture.detectChanges();
    expect(fixture.componentInstance.seen().at(-1)?.value).toBe(12395);
    expect(fixture.componentInstance.control.value).toBe(12395);
  });

  it('takes the minor unit from fractionDigits when it is set', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          fractionDigits="3"
          locale="pt-BR"
          unit="minor"
          (valueChange)="record($event)"
        />
      </div>`);

    typeDigits(fixture, '1234');

    expect(plain(input(fixture).value)).toBe('R$ 1,234');
    expect(fixture.componentInstance.seen().at(-1)?.value).toBe(1234);
  });
});

describe('the request an amount carries', () => {
  it('carries the reason, the currency and the exact integer of minor units', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          (valueChange)="record($event)"
        />
      </div>`);

    typeDigits(fixture, '1234');

    const [last] = fixture.componentInstance.seen().slice(-1);
    expect(last?.value).toBe(12.34);
    expect(last?.currency).toBe('BRL');
    expect(last?.minorUnits).toBe(1234);
    expect(last?.reason).toBe('keyboard');
  });

  it('can be refused before anything commits', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          (valueChange)="refuse($event)"
        />
      </div>`);

    typeDigits(fixture, '1234');
    expect(plain(input(fixture).value)).toBe('R$ 0,00');
  });
});

describe('the range and the keyboard', () => {
  it('returns an amount to the range at the commit', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" max="100" />
      </div>`);

    typeDigits(fixture, '999999');
    input(fixture).dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(plain(input(fixture).value)).toBe('R$ 100,00');
  });

  it('refuses the keystroke that would leave the range under strict clamping', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" clamp="strict" max="1" />
      </div>`);

    typeDigits(fixture, '99');
    expect(beforeInput(input(fixture), '9').defaultPrevented).toBe(true);
  });

  it('steps by the amounts the contract declares', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="100" step="1" />
      </div>`);

    key(input(fixture), { key: 'ArrowUp' });
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('101');

    key(input(fixture), { key: 'ArrowUp', shiftKey: true });
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('111');

    key(input(fixture), { key: 'ArrowDown', altKey: true });
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('110.9');
  });

  it('goes to the bounds the pattern names', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          defaultValue="100"
          min="10"
          max="500"
        />
      </div>`);

    key(input(fixture), { key: 'Home' });
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('10');

    key(input(fixture), { key: 'End' });
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('500');
  });

  it('binds nothing to Escape', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12" />
      </div>`);

    expect(key(input(fixture), { key: 'Escape' }).defaultPrevented).toBe(false);
    expect(input(fixture).getAttribute('aria-valuenow')).toBe('12');
  });
});

describe('the two steppers', () => {
  it('are withdrawn until a product asks for them', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12" />
      </div>`);

    expect(query(fixture, '[data-part="increment"]')).toBeNull();
  });

  it('step the amount, stay out of the tab order and announce themselves', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField stepper="stacked" [messages]="{ increment: 'More', decrement: 'Less' }">
        <input
          slCurrencyFieldInput
          id="total"
          currency="BRL"
          locale="pt-BR"
          defaultValue="100"
          step="1"
        />
      </div>`);

    press(stepper(fixture, 'increment'));
    fixture.detectChanges();

    expect(input(fixture).getAttribute('aria-valuenow')).toBe('101');
    expect(stepper(fixture, 'increment').getAttribute('tabindex')).toBe('-1');
    expect(stepper(fixture, 'increment').getAttribute('aria-label')).toBe('More');
    expect(stepper(fixture, 'decrement').getAttribute('aria-label')).toBe('Less');
    expect(stepper(fixture, 'increment').getAttribute('aria-controls')).toBe('total');
  });

  it('are disabled at the bound they would cross', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField stepper="stacked">
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          defaultValue="100"
          min="0"
          max="100"
        />
      </div>`);

    expect(stepper(fixture, 'increment').disabled).toBe(true);
    expect(stepper(fixture, 'decrement').disabled).toBe(false);
  });

  it('draw a chevron in each stacked half and the minus and plus when split', () => {
    const glyph = (fixture: Fixture, part: 'increment' | 'decrement') =>
      stepper(fixture, part).querySelector('svg[data-glyph]')?.getAttribute('data-glyph');
    const stacked = renderTemplate(`
      <div slCurrencyField stepper="stacked">
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="100" />
      </div>`);
    expect(glyph(stacked, 'increment')).toBe('chevron-down');
    expect(glyph(stacked, 'decrement')).toBe('chevron-down');

    const split = renderTemplate(`
      <div slCurrencyField stepper="split">
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="100" />
      </div>`);
    expect(glyph(split, 'increment')).toBe('plus');
    expect(glyph(split, 'decrement')).toBe('minus');
  });
});

describe('the field around it', () => {
  it('takes its identity, its description and its states from the field', () => {
    const fixture = renderTemplate(`
      <div slField invalid>
        <label slFieldLabel>Total</label>
        <div slCurrencyField>
          <input slCurrencyFieldInput currency="BRL" locale="pt-BR" defaultValue="12" />
        </div>
        <p slFieldError>Informe um valor maior.</p>
      </div>`);

    expect(input(fixture).id).not.toBe('');
    expect(query(fixture, '[data-part="label"]').getAttribute('for')).toBe(input(fixture).id);
    expect(input(fixture).getAttribute('aria-describedby')).toContain('-error');
    expect(input(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(query(fixture, '[data-ui="currency-field"]').getAttribute('data-invalid')).toBe('');
  });

  it('lets a stated value win over the field', () => {
    const fixture = renderTemplate(`
      <div slField disabled>
        <div slCurrencyField>
          <input
            slCurrencyFieldInput
            currency="BRL"
            locale="pt-BR"
            defaultValue="12"
            [disabled]="false"
          />
        </div>
      </div>`);

    expect(input(fixture).hasAttribute('disabled')).toBe(false);
  });
});

describe('reactive forms', () => {
  it('writes the form’s amount and reports the reader’s', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" [formControl]="control" />
      </div>`);

    expect(plain(input(fixture).value)).toBe('R$ 1.480,00');

    typeDigits(fixture, '5');
    expect(fixture.componentInstance.control.value).toBe(14800.05);
  });

  it('answers a form that disables it', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input slCurrencyFieldInput currency="BRL" locale="pt-BR" [formControl]="control" />
      </div>`);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    expect(input(fixture).hasAttribute('disabled')).toBe(true);
    expect(query(fixture, '[data-ui="currency-field"]').getAttribute('data-disabled')).toBe('');
  });
});

describe('forms and escape hatches', () => {
  it('submits the raw number rather than the formatted amount', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          name="total"
          currency="BRL"
          locale="pt-BR"
          defaultValue="1480.5"
        />
      </div>`);

    const hidden = query(fixture, 'input[type="hidden"]') as HTMLInputElement;
    expect(hidden.value).toBe('1480.5');
    expect(hidden.getAttribute('name')).toBe('total');
    expect(input(fixture).hasAttribute('name')).toBe(false);
  });

  it('keeps a static attribute the consumer wrote', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          autocomplete="transaction-amount"
          inputmode="decimal"
          placeholder="R$ 0,00"
        />
      </div>`);

    expect(input(fixture).getAttribute('autocomplete')).toBe('transaction-amount');
    expect(input(fixture).getAttribute('inputmode')).toBe('decimal');
    expect(input(fixture).getAttribute('placeholder')).toBe('R$ 0,00');
  });

  it('hands the element and the two actions to a template', () => {
    const fixture = renderTemplate(`
      <div slCurrencyField>
        <input
          #amount="slCurrencyFieldInput"
          slCurrencyFieldInput
          currency="BRL"
          locale="pt-BR"
          defaultValue="100"
          step="5"
        />
        <button type="button" (click)="amount.increment()">Mais</button>
      </div>`);

    (query(fixture, 'button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(input(fixture).getAttribute('aria-valuenow')).toBe('105');
  });
});

describe('slCurrencyFieldScrub', () => {
  const scrubTemplate = (attributes = '', sensitivity = '') =>
    `<div slCurrencyField>
       <span slCurrencyFieldStart><span slCurrencyFieldScrub ${sensitivity}>R$</span></span>
       <input
         slCurrencyFieldInput
         aria-label="Valor"
         currency="BRL"
         currencyDisplay="none"
         locale="pt-BR"
         ${attributes}
         (valueChange)="record($event)"
       />
     </div>`;
  const pointer = (type: string, init: PointerEventInit = {}) =>
    new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, ...init });
  const drag = (fixture: Fixture, from: number, ...moves: PointerEventInit[]) => {
    const part = query(fixture, '[data-part="scrub"]');
    part.dispatchEvent(pointer('pointerdown', { clientX: from }));
    for (const move of moves) part.dispatchEvent(pointer('pointermove', move));
    part.dispatchEvent(pointer('pointerup'));
    fixture.detectChanges();
  };

  it('moves the amount one step per two pixels and carries its minor units', () => {
    const fixture = renderTemplate(scrubTemplate('[defaultValue]="10"'));
    drag(fixture, 100, { clientX: 101 }, { clientX: 106 }, { clientX: 104 });
    expect(input(fixture).value).toBe('12,00');
    expect(
      fixture.componentInstance
        .seen()
        .map(({ value, reason, minorUnits }) => [value, reason, minorUnits]),
    ).toEqual([
      [13, 'pointer', 1300],
      [12, 'pointer', 1200],
    ]);
  });

  it('takes its sensitivity and the large step under Shift', () => {
    const fixture = renderTemplate(
      scrubTemplate('[defaultValue]="0" [max]="100"', '[sensitivity]="10"'),
    );
    drag(fixture, 0, { clientX: 10, shiftKey: true }, { clientX: 200, shiftKey: true });
    expect(input(fixture).value).toBe('100,00');
  });

  it('marks the drag on the frame and on the part, and focuses the amount', () => {
    const fixture = renderTemplate(scrubTemplate());
    const part = query(fixture, '[data-part="scrub"]');
    part.dispatchEvent(pointer('pointerdown', { clientX: 0 }));
    fixture.detectChanges();
    expect(query(fixture, '[data-ui="currency-field"]').hasAttribute('data-scrubbing')).toBe(true);
    expect(part.hasAttribute('data-scrubbing')).toBe(true);
    expect(document.activeElement).toBe(input(fixture));
    part.dispatchEvent(pointer('pointerup'));
    fixture.detectChanges();
    expect(query(fixture, '[data-ui="currency-field"]').hasAttribute('data-scrubbing')).toBe(false);
    expect(part.getAttribute('aria-hidden')).toBe('true');
  });

  it('does nothing on a read-only control', () => {
    const fixture = renderTemplate(scrubTemplate('[defaultValue]="5" readOnly'));
    drag(fixture, 0, { clientX: 40 });
    expect(input(fixture).value).toBe('5,00');
  });
});

@Component({
  standalone: true,
  imports: [SlCurrencyField, SlCurrencyFieldInput, SlField, SlFieldLabel],
  template: `<div slField [invalid]="invalid">
    <label slFieldLabel>Valor</label>
    <div slCurrencyField appearance="display">
      <input slCurrencyFieldInput currency="BRL" locale="pt-BR" [value]="12.34" />
    </div>
  </div>`,
})
class DisplayHost {
  invalid = false;
}

describe('the display appearance', () => {
  it('draws the mark apart from the digits and carries it in the value text', () => {
    TestBed.configureTestingModule({ imports: [DisplayHost] });
    const fixture = TestBed.createComponent(DisplayHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="currency-field"]') as HTMLElement;
    const input = root.querySelector('input[data-part="input"]') as HTMLInputElement;
    const mark = root.querySelector('[data-part="symbol"]') as HTMLElement;

    expect(root.getAttribute('data-appearance')).toBe('display');
    expect(input.value.replace(/\u00a0/g, ' ')).toBe('12,34');
    expect(mark.textContent).toBe('R$');
    expect(mark.nextElementSibling).toBe(input);
    expect(input.getAttribute('aria-valuetext')?.replace(/\u00a0/g, ' ')).toBe('R$ 12,34');
  });
});
