import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/currency-field/contract.json';
import { Field, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { CurrencyField, CurrencyFieldScrub } from './currency-field';
import { CurrencyFieldDefaultsProvider } from './currency-field-defaults';
import type { CurrencyFieldHandle } from './currency-field.types';

const control = () => screen.getByRole('spinbutton') as HTMLInputElement;
const frameOf = (element: HTMLElement) => element.parentElement as HTMLElement;
const stepper = (part: 'increment' | 'decrement') =>
  frameOf(control()).querySelector(`[data-part="${part}"]`) as HTMLButtonElement;

/**
 * `Intl` separates a symbol from its amount with a non-breaking space, and the
 * normalization runs over the value the control holds rather than over the
 * expectation: a test that wrote the invisible character itself would compare
 * two strings a reader cannot tell apart.
 */
const plain = (text: string) => text.replace(/\u00a0/g, ' ');

/** One keystroke, as the browser delivers it: the whole new text. */
function type(value: string) {
  fireEvent.change(control(), { target: { value } });
}

/** What a reader typing digit by digit produces, under cents-first entry. */
function typeDigits(digits: string) {
  for (const digit of digits) type(control().value + digit);
}

/**
 * A raw `dispatchEvent` leaves React's state update unflushed, so the event
 * goes through `fireEvent`, which wraps the dispatch in `act`.
 */
function beforeInput(data: string, inputType = 'insertText') {
  const event = new InputEvent('beforeinput', { bubbles: true, cancelable: true, data, inputType });
  fireEvent(control(), event);
  return event;
}

describe('CurrencyField', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <CurrencyField
        className="page-amount"
        currency="BRL"
        defaultValue={1480}
        end="per month"
        locale="pt-BR"
        start="R$"
        stepper="stacked"
      />,
    );

    const root = frameOf(control());
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-ui', 'currency-field');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root).toHaveClass('page-amount');
    expect(control()).toHaveAttribute('data-part', 'input');
    expect(root.querySelector('[data-part="start"]')).toHaveTextContent('R$');
    expect(root.querySelector('[data-part="end"]')).toHaveTextContent('per month');
    expect(root.querySelector('[data-part="stepper"]')).not.toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<CurrencyField currency="BRL" defaultValue={1} locale="pt-BR" />);
    const root = frameOf(control());
    const { defaults } = contract.members.currencyField;

    expect(root).toHaveAttribute('data-size', defaults.size);
    expect(root).toHaveAttribute('data-variant', defaults.variant);
    expect(root).toHaveAttribute('data-stepper', defaults.stepper);
    expect(root).toHaveAttribute('data-align', defaults.align);
    expect(root).toHaveAttribute('data-entry', defaults.entry);
  });

  /**
   * `type="number"` empties itself whenever the text is not a valid
   * floating-point number, so no grouping separator and no currency symbol
   * survives it. The role is the APG's, applied to a text input.
   */
  it('holds the amount in a text input carrying the spinbutton role', () => {
    render(<CurrencyField currency="BRL" defaultValue={1480} locale="pt-BR" max={5000} min={0} />);

    expect(control()).toHaveAttribute('type', 'text');
    expect(control()).toHaveAttribute('role', contract.controlRole);
    expect(control()).toHaveAttribute('aria-valuenow', '1480');
    expect(control()).toHaveAttribute('aria-valuemin', '0');
    expect(control()).toHaveAttribute('aria-valuemax', '5000');
    expect(plain(control().getAttribute('aria-valuetext') ?? '')).toBe('R$ 1.480,00');
  });

  it('writes the symbol the currency names and the separators the locale writes', () => {
    render(<CurrencyField currency="USD" defaultValue={1480} locale="pt-BR" />);

    expect(plain(control().value)).toBe('US$ 1.480,00');
  });

  /**
   * A currency field cannot decide how many digits a cent has, and one that
   * guessed two would write `¥12,34`.
   */
  it('refuses to render without a currency, in the place it was written', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<CurrencyField defaultValue={1} />)).toThrow(/currency/i);

    quiet.mockRestore();
  });

  /**
   * The arrangement `Intl` has no option for: the symbol beside the amount
   * rather than inside it, with the currency still deciding the shift.
   */
  it('writes no currency at all under the display that has none', () => {
    render(<CurrencyField currency="BRL" currencyDisplay="none" locale="pt-BR" start="R$" />);

    typeDigits('1234');
    expect(control().value).toBe('12,34');
    expect(frameOf(control()).querySelector('[data-part="start"]')).toHaveTextContent('R$');
  });

  it('takes the currency from an application that set one once', () => {
    render(
      <SlottedProvider locale="ja-JP">
        <CurrencyFieldDefaultsProvider currency="JPY">
          <CurrencyField defaultValue={1480} />
        </CurrencyFieldDefaultsProvider>
      </SlottedProvider>,
    );

    expect(control().value).toBe('￥1,480');
  });

  it('writes and speaks in the language in force', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <CurrencyField currency="BRL" defaultValue={1480} stepper="split" />
      </SlottedProvider>,
    );

    expect(plain(control().value)).toBe('R$ 1.480,00');
    expect(stepper('increment')).toHaveAccessibleName('Aumentar');
    expect(stepper('decrement')).toHaveAccessibleName('Diminuir');
  });
});

describe('an amount held in minor units', () => {
  it('reports the integer of the minor unit for what the reader types', () => {
    const onValueChange = vi.fn();
    render(
      <CurrencyField currency="BRL" locale="pt-BR" onValueChange={onValueChange} unit="minor" />,
    );

    typeDigits('12345');

    expect(plain(control().value)).toBe('R$ 123,45');
    expect(onValueChange).toHaveBeenLastCalledWith(
      12345,
      expect.objectContaining({ value: 12345, previous: 1234, minorUnits: 12345 }),
    );
  });

  it('reads the value, the range, the step and the submitted amount in minor units', () => {
    const onValueChange = vi.fn();
    render(
      <CurrencyField
        currency="BRL"
        locale="pt-BR"
        max={20000}
        name="amount"
        onValueChange={onValueChange}
        step={50}
        unit="minor"
        value={12345}
      />,
    );

    expect(plain(control().value)).toBe('R$ 123,45');
    expect(control()).toHaveAttribute('aria-valuemax', '200');
    expect(document.querySelector<HTMLInputElement>('input[name="amount"]')!.value).toBe('12345');
    fireEvent.keyDown(control(), { key: 'ArrowUp' });
    expect(onValueChange).toHaveBeenLastCalledWith(12395, expect.anything());
  });

  it('takes the minor unit from fractionDigits when it is set', () => {
    const onValueChange = vi.fn();
    render(
      <CurrencyField
        currency="BRL"
        fractionDigits={3}
        locale="pt-BR"
        onValueChange={onValueChange}
        unit="minor"
      />,
    );

    typeDigits('1234');

    expect(plain(control().value)).toBe('R$ 1,234');
    expect(onValueChange).toHaveBeenLastCalledWith(1234, expect.anything());
  });
});

describe('cents-first entry', () => {
  it('shifts each digit left by the currency minor units', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    type('1');
    expect(plain(control().value)).toBe('R$ 0,01');
    type(`${control().value}2`);
    expect(plain(control().value)).toBe('R$ 0,12');
    typeDigits('34');
    expect(plain(control().value)).toBe('R$ 12,34');
  });

  it('shifts by nothing in a currency with no cent', () => {
    render(<CurrencyField currency="JPY" locale="ja-JP" />);

    typeDigits('1480');
    expect(control().value).toBe('￥1,480');
  });

  it('shifts by three in a currency with three', () => {
    render(<CurrencyField currency="KWD" locale="pt-BR" />);

    typeDigits('1234');
    expect(plain(control().value)).toBe('KWD 1,234');
  });

  /**
   * Backspace shifts the digits right, and the last one leaves nought rather
   * than nothing: an amount is not an optional number.
   */
  it('empties to nought, and to nothing only when nothing is allowed', () => {
    const onValueChange = vi.fn();
    const { unmount } = render(
      <CurrencyField currency="BRL" locale="pt-BR" onValueChange={onValueChange} />,
    );

    typeDigits('12');
    type('R$ 0,1');
    expect(plain(control().value)).toBe('R$ 0,01');

    type('');
    expect(plain(control().value)).toBe('R$ 0,00');
    expect(onValueChange).toHaveBeenLastCalledWith(0, expect.objectContaining({ value: 0 }));
    unmount();

    const allowed = vi.fn();
    render(<CurrencyField allowEmpty currency="BRL" locale="pt-BR" onValueChange={allowed} />);
    typeDigits('12');
    type('');
    expect(control().value).toBe('');
    expect(allowed).toHaveBeenLastCalledWith(null, expect.objectContaining({ value: null }));
  });

  /** An amount that holds nothing reads as nought before anything is typed. */
  it('shows nought in a control nobody has touched, and nothing under allowEmpty', () => {
    const { unmount } = render(<CurrencyField currency="BRL" locale="pt-BR" />);
    expect(plain(control().value)).toBe('R$ 0,00');
    unmount();

    render(<CurrencyField allowEmpty currency="BRL" locale="pt-BR" />);
    expect(control().value).toBe('');
  });

  /**
   * The caret is not where a digit lands. A cash register takes the digit at
   * the minor unit whatever the reader is pointing at, and this is the whole
   * of `entry="cents"`.
   */
  it('takes a digit typed against the first character at the right anyway', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    typeDigits('0');
    expect(plain(control().value)).toBe('R$ 0,00');

    /* What the browser produces for `2` typed with the caret before the nought. */
    type('R$\u00a020,00');
    expect(plain(control().value)).toBe('R$ 0,02');
  });

  it('takes a digit typed into the middle of the amount at the right anyway', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);
    typeDigits('1234');
    expect(plain(control().value)).toBe('R$ 12,34');

    /* `9` typed with the caret between the two whole digits. */
    type('R$\u00a012,934');
    expect(plain(control().value)).toBe('R$ 123,49');
  });

  /**
   * A selection is not a place either. Two digits went and one came, so two
   * come off the right and one goes on it.
   */
  it('replaces a selection at the right rather than where it stood', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);
    typeDigits('1234');

    /* `5` typed over `2,3`. */
    type('R$\u00a0154');
    expect(plain(control().value)).toBe('R$ 1,25');
  });

  it('takes the digit at the right off, whatever the caret was against', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);
    typeDigits('1234');

    /* Backspace pressed against the second whole digit. */
    type('R$\u00a01,34');
    expect(plain(control().value)).toBe('R$ 1,23');
  });

  /** The caret has one legal position, and every keystroke returns it there. */
  it('puts the caret back after the last digit', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);
    control().focus();
    typeDigits('1234');

    control().setSelectionRange(3, 3);
    /* `9` typed against the first digit. */
    type('R$\u00a0912,34');
    expect(plain(control().value)).toBe('R$ 123,49');
    expect(control().selectionStart).toBe(control().value.length);
  });

  it('keeps a nought a reader actually typed', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    type('0');
    expect(plain(control().value)).toBe('R$ 0,00');
  });

  /**
   * The one case where the cash-register rule would lose the reader's data: an
   * amount copied from a bank statement is not a run of digits.
   */
  it('parses a paste instead of accumulating its digits', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    fireEvent.input(control(), {
      target: { value: 'R$\u00a01.480,00' },
      inputType: 'insertFromPaste',
    });

    expect(plain(control().value)).toBe('R$ 1.480,00');
    expect(control()).toHaveAttribute('aria-valuenow', '1480');
  });

  /**
   * Both shapes the item names, each read by the locale it is pasted into. In
   * a locale that groups with a full stop, `1234.56` is one hundred and
   * twenty-three thousand — the group separator is what a full stop is there,
   * and a field that guessed otherwise would read `1.234` as one and a bit.
   */
  it('parses a pasted amount by the locale it is pasted into', () => {
    const { unmount } = render(<CurrencyField currency="BRL" locale="pt-BR" />);
    fireEvent.input(control(), {
      target: { value: '1.234,56' },
      inputType: 'insertFromPaste',
    });
    expect(control()).toHaveAttribute('aria-valuenow', '1234.56');

    fireEvent.input(control(), {
      target: { value: '1234.56' },
      inputType: 'insertFromPaste',
    });
    expect(control()).toHaveAttribute('aria-valuenow', '123456');
    unmount();

    render(<CurrencyField currency="USD" locale="en-US" />);
    fireEvent.input(control(), {
      target: { value: '1234.56' },
      inputType: 'insertFromPaste',
    });
    expect(control()).toHaveAttribute('aria-valuenow', '1234.56');
  });

  it('reads an accounting negative back as a negative when it is pasted', () => {
    render(<CurrencyField currency="USD" locale="en-US" min={-1000000} />);

    fireEvent.input(control(), {
      target: { value: '($1,234.56)' },
      inputType: 'insertFromPaste',
    });

    expect(control()).toHaveAttribute('aria-valuenow', '-1234.56');
  });

  /** The digits are the value, so nothing else may be typed into them. */
  it('refuses a separator, a letter and every other character', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);
    control().focus();

    expect(beforeInput(',').defaultPrevented).toBe(true);
    expect(beforeInput('.').defaultPrevented).toBe(true);
    expect(beforeInput('a').defaultPrevented).toBe(true);
    expect(beforeInput('7').defaultPrevented).toBe(false);
  });

  it('lets a paste through the filter that refuses a keystroke', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    expect(beforeInput('R$ 1.480,00', 'insertFromPaste').defaultPrevented).toBe(false);
  });

  /** Fifteen digits is where a double stops holding a cent. */
  it('stops at the digit a double could not hold', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    typeDigits('123456789012345');
    expect(control()).toHaveAttribute('aria-valuenow', '1234567890123.45');

    expect(beforeInput('6').defaultPrevented).toBe(true);
  });

  it('sets the sign with a key rather than with a digit', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    typeDigits('1234');
    beforeInput('-');
    expect(control()).toHaveAttribute('aria-valuenow', '-12.34');

    beforeInput('+');
    expect(control()).toHaveAttribute('aria-valuenow', '12.34');
  });

  it('remembers a sign typed into an empty amount', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" />);

    beforeInput('-');
    typeDigits('5');
    expect(control()).toHaveAttribute('aria-valuenow', '-0.05');
  });

  /** `min={0}` is what says a debit is impossible, and it says it once. */
  it('refuses a sign the range does not admit', () => {
    render(<CurrencyField currency="BRL" defaultValue={12.34} locale="pt-BR" min={0} />);

    beforeInput('-');
    expect(control()).toHaveAttribute('aria-valuenow', '12.34');
  });

  it('asks the numeric keypad for, and never the full keyboard', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" min={-100} />);

    expect(control()).toHaveAttribute('inputmode', 'numeric');
  });
});

describe('natural entry', () => {
  /**
   * `number-field`'s model, and `number-field`'s axis with it: an amount is
   * scannable while it is being typed, and the padding to the currency's own
   * minor units still belongs to the commit.
   */
  it('gives the text the locale’s shape on the keystroke that changed it', () => {
    render(<CurrencyField currency="BRL" entry="natural" locale="pt-BR" />);

    type('1234,5');
    expect(plain(control().value)).toBe('R$ 1.234,5');
    expect(control()).toHaveAttribute('aria-valuenow', '1234.5');

    fireEvent.blur(control());
    expect(plain(control().value)).toBe('R$ 1.234,50');
  });

  it('leaves the text alone until a commit when asked to', () => {
    render(<CurrencyField currency="BRL" entry="natural" formatOn="commit" locale="pt-BR" />);

    type('1234,5');
    expect(control().value).toBe('1234,5');
    expect(control()).toHaveAttribute('aria-valuenow', '1234.5');

    fireEvent.blur(control());
    expect(plain(control().value)).toBe('R$ 1.234,50');
  });

  it('derives its keypad from what the format admits', () => {
    render(<CurrencyField currency="BRL" entry="natural" locale="pt-BR" min={0} />);

    expect(control()).toHaveAttribute('inputmode', 'decimal');
  });

  it('takes the full keyboard when a debit is possible', () => {
    render(<CurrencyField currency="BRL" entry="natural" locale="pt-BR" />);

    expect(control()).toHaveAttribute('inputmode', 'text');
  });
});

describe('the request an amount carries', () => {
  it('carries the reason, the currency and the exact integer of minor units', () => {
    const onValueChange = vi.fn();
    render(<CurrencyField currency="BRL" locale="pt-BR" onValueChange={onValueChange} />);

    typeDigits('1234');

    expect(onValueChange).toHaveBeenLastCalledWith(
      12.34,
      expect.objectContaining({ currency: 'BRL', minorUnits: 1234, reason: 'keyboard' }),
    );
  });

  it('reports the integer a payment API is charged in, without a float in between', () => {
    const onValueChange = vi.fn();
    render(
      <CurrencyField currency="USD" entry="natural" locale="en-US" onValueChange={onValueChange} />,
    );

    type('1.005');
    expect(onValueChange).toHaveBeenLastCalledWith(
      1.005,
      expect.objectContaining({ minorUnits: 101 }),
    );
  });

  it('can be refused before anything commits', () => {
    render(
      <CurrencyField
        currency="BRL"
        locale="pt-BR"
        onValueChange={(_value, request) => request.cancel()}
      />,
    );

    typeDigits('1234');
    expect(plain(control().value)).toBe('R$ 0,00');
  });

  it('never asks for the value it already holds', () => {
    const onValueChange = vi.fn();
    render(
      <CurrencyField
        currency="BRL"
        defaultValue={12.34}
        locale="pt-BR"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.blur(control());
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('the two modes', () => {
  it('holds its own amount when nobody owns it', () => {
    render(<CurrencyField currency="BRL" defaultValue={12.34} locale="pt-BR" />);

    typeDigits('5');
    expect(plain(control().value)).toBe('R$ 123,45');
  });

  it('waits for the consumer in controlled mode', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" value={12.34} />);

    typeDigits('5');
    expect(plain(control().value)).toBe('R$ 12,34');
  });

  it('shows the amount the consumer moves it to', () => {
    function Controlled() {
      const [amount, setAmount] = useState<number | null>(null);
      return (
        <CurrencyField currency="BRL" locale="pt-BR" onValueChange={setAmount} value={amount} />
      );
    }

    render(<Controlled />);
    typeDigits('1234');
    expect(plain(control().value)).toBe('R$ 12,34');
  });
});

describe('the range', () => {
  it('returns an amount to the range at the commit', () => {
    render(<CurrencyField currency="BRL" locale="pt-BR" max={100} />);

    typeDigits('999999');
    fireEvent.blur(control());
    expect(plain(control().value)).toBe('R$ 100,00');
  });

  it('refuses the keystroke that would leave the range under strict clamping', () => {
    render(<CurrencyField clamp="strict" currency="BRL" locale="pt-BR" max={1} />);

    typeDigits('99');
    expect(plain(control().value)).toBe('R$ 0,99');
    expect(beforeInput('9').defaultPrevented).toBe(true);
  });

  it('keeps an amount outside the range when nothing clamps it', () => {
    render(<CurrencyField clamp="none" currency="BRL" locale="pt-BR" max={100} />);

    typeDigits('999999');
    fireEvent.blur(control());
    expect(control()).toHaveAttribute('aria-valuenow', '9999.99');
  });
});

describe('the keyboard', () => {
  it('steps by the amounts the contract declares', () => {
    render(<CurrencyField currency="BRL" defaultValue={100} locale="pt-BR" step={1} />);

    fireEvent.keyDown(control(), { key: 'ArrowUp' });
    expect(control()).toHaveAttribute('aria-valuenow', '101');

    fireEvent.keyDown(control(), { key: 'ArrowDown' });
    expect(control()).toHaveAttribute('aria-valuenow', '100');

    fireEvent.keyDown(control(), { key: 'ArrowUp', shiftKey: true });
    expect(control()).toHaveAttribute('aria-valuenow', '110');

    fireEvent.keyDown(control(), { key: 'ArrowDown', altKey: true });
    expect(control()).toHaveAttribute('aria-valuenow', '109.9');

    fireEvent.keyDown(control(), { key: 'PageUp' });
    expect(control()).toHaveAttribute('aria-valuenow', '119.9');
  });

  it('goes to the bounds the pattern names, and only when they exist', () => {
    render(<CurrencyField currency="BRL" defaultValue={100} locale="pt-BR" max={500} min={10} />);

    fireEvent.keyDown(control(), { key: 'Home' });
    expect(control()).toHaveAttribute('aria-valuenow', '10');

    fireEvent.keyDown(control(), { key: 'End' });
    expect(control()).toHaveAttribute('aria-valuenow', '500');
  });

  it('commits on Enter without intercepting the submit', () => {
    const onSubmit = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <CurrencyField currency="BRL" entry="natural" locale="pt-BR" />
      </form>,
    );

    type('1234');
    fireEvent.keyDown(control(), { key: 'Enter' });
    expect(plain(control().value)).toBe('R$ 1.234,00');
  });

  it('binds nothing to Escape', () => {
    render(<CurrencyField currency="BRL" defaultValue={12} locale="pt-BR" />);

    fireEvent.keyDown(control(), { key: 'Escape' });
    expect(control()).toHaveAttribute('aria-valuenow', '12');
  });
});

describe('the two steppers', () => {
  it('are withdrawn until a product asks for them', () => {
    render(<CurrencyField currency="BRL" defaultValue={12} locale="pt-BR" />);

    expect(frameOf(control()).querySelector('[data-part="increment"]')).toBeNull();
  });

  it('step the amount and keep focus on the value', () => {
    render(<CurrencyField currency="BRL" defaultValue={100} locale="pt-BR" stepper="stacked" />);

    fireEvent.pointerDown(stepper('increment'), { button: 0 });
    expect(control()).toHaveAttribute('aria-valuenow', '101');
    fireEvent.pointerUp(stepper('increment'));

    expect(document.activeElement).toBe(control());
  });

  it('stay out of the tab order with names and a control to point at', () => {
    render(
      <CurrencyField
        currency="BRL"
        defaultValue={100}
        id="total"
        locale="pt-BR"
        messages={{ decrement: 'Less', increment: 'More' }}
        stepper="stacked"
      />,
    );

    expect(stepper('increment')).toHaveAttribute('tabindex', '-1');
    expect(stepper('increment')).toHaveAccessibleName('More');
    expect(stepper('decrement')).toHaveAccessibleName('Less');
    expect(stepper('increment')).toHaveAttribute('aria-controls', 'total');
  });

  it('are disabled at the bound they would cross', () => {
    render(
      <CurrencyField
        currency="BRL"
        defaultValue={100}
        locale="pt-BR"
        max={100}
        min={0}
        stepper="stacked"
      />,
    );

    expect(stepper('increment')).toBeDisabled();
    expect(stepper('decrement')).not.toBeDisabled();
  });

  it('draw a chevron in each stacked half and the minus and plus when split', () => {
    const glyph = (part: 'increment' | 'decrement') =>
      stepper(part).querySelector('svg[data-glyph]')?.getAttribute('data-glyph');
    const { unmount } = render(
      <CurrencyField currency="BRL" defaultValue={100} locale="pt-BR" stepper="stacked" />,
    );
    expect(glyph('increment')).toBe('chevron-down');
    expect(glyph('decrement')).toBe('chevron-down');
    unmount();

    render(<CurrencyField currency="BRL" defaultValue={100} locale="pt-BR" stepper="split" />);
    expect(glyph('increment')).toBe('plus');
    expect(glyph('decrement')).toBe('minus');
  });
});

describe('the field around it', () => {
  it('takes its identity, its description and its states from the field', () => {
    render(
      <Field invalid>
        <FieldLabel>Total</FieldLabel>
        <CurrencyField currency="BRL" defaultValue={12} locale="pt-BR" />
        <FieldError>Informe um valor maior.</FieldError>
      </Field>,
    );

    expect(control()).toHaveAccessibleName('Total');
    expect(control()).toHaveAccessibleDescription(/Informe um valor maior\./);
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(frameOf(control())).toHaveAttribute('data-invalid', '');
  });

  it('lets a stated value win over the field', () => {
    render(
      <Field disabled>
        <FieldLabel>Total</FieldLabel>
        <CurrencyField currency="BRL" defaultValue={12} disabled={false} locale="pt-BR" />
      </Field>,
    );

    expect(control()).not.toBeDisabled();
  });
});

describe('forms', () => {
  it('submits the raw number rather than the formatted amount', () => {
    render(
      <form data-testid="form">
        <CurrencyField currency="BRL" defaultValue={1480.5} locale="pt-BR" name="total" />
      </form>,
    );

    const hidden = screen
      .getByTestId('form')
      .querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden.value).toBe('1480.5');
    expect(hidden.name).toBe('total');
  });

  /** What is submitted is what the control reads, and never a blank beside a nought. */
  it('submits the nought an untouched control shows, and nothing under allowEmpty', () => {
    const { unmount } = render(
      <form data-testid="form">
        <CurrencyField currency="BRL" locale="pt-BR" name="total" />
      </form>,
    );
    const hidden = () =>
      screen.getByTestId('form').querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden().value).toBe('0');
    unmount();

    render(
      <form data-testid="form">
        <CurrencyField allowEmpty currency="BRL" locale="pt-BR" name="total" />
      </form>,
    );
    expect(hidden().value).toBe('');
  });

  it('goes back to where it started when the form resets', () => {
    render(
      <form data-testid="form">
        <CurrencyField currency="BRL" defaultValue={12} locale="pt-BR" name="total" />
      </form>,
    );

    typeDigits('5');
    fireEvent.reset(screen.getByTestId('form'));
    expect(plain(control().value)).toBe('R$ 12,00');
  });
});

describe('the escape hatches', () => {
  it('hands the native element to a ref and the two actions to a handle', () => {
    const ref = createRef<HTMLInputElement>();
    const handle = createRef<CurrencyFieldHandle>();
    render(
      <CurrencyField
        currency="BRL"
        defaultValue={100}
        handle={handle}
        locale="pt-BR"
        ref={ref}
        step={5}
      />,
    );

    expect(ref.current).toBe(control());
    act(() => handle.current?.increment());
    expect(control()).toHaveAttribute('aria-valuenow', '105');
  });

  it('renders the frame into another element', () => {
    render(
      <CurrencyField
        currency="BRL"
        defaultValue={12}
        locale="pt-BR"
        render={(props) => <label {...props} />}
      />,
    );

    expect(frameOf(control()).tagName).toBe('LABEL');
  });

  it('runs the consumer’s own handler as well as its own', () => {
    const onChange = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <CurrencyField currency="BRL" locale="pt-BR" onChange={onChange} onKeyDown={onKeyDown} />,
    );

    typeDigits('1');
    fireEvent.keyDown(control(), { key: 'ArrowUp' });

    expect(onChange).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
    expect(control()).toHaveAttribute('aria-valuenow', '1.01');
  });

  it('lets a consumer stop the family from acting on a key', () => {
    render(
      <CurrencyField
        currency="BRL"
        defaultValue={12}
        locale="pt-BR"
        onKeyDown={(event) => event.preventDefault()}
      />,
    );

    fireEvent.keyDown(control(), { key: 'ArrowUp' });
    expect(control()).toHaveAttribute('aria-valuenow', '12');
  });

  it('keeps a native attribute the consumer wrote', () => {
    render(
      <CurrencyField
        autoComplete="transaction-amount"
        currency="BRL"
        defaultValue={12}
        locale="pt-BR"
        placeholder="R$ 0,00"
      />,
    );

    expect(control()).toHaveAttribute('autocomplete', 'transaction-amount');
    expect(control()).toHaveAttribute('placeholder', 'R$ 0,00');
  });
});

describe('an application that decides once', () => {
  it('sets every axis from the provider, and a control still wins', () => {
    render(
      <CurrencyFieldDefaultsProvider
        align="start"
        currency="USD"
        entry="natural"
        size="sm"
        stepper="split"
        variant="subtle"
      >
        <CurrencyField defaultValue={12} />
        <CurrencyField align="end" defaultValue={12} />
      </CurrencyFieldDefaultsProvider>,
    );

    const [first, second] = screen.getAllByRole('spinbutton').map((input) => frameOf(input));
    expect(first).toHaveAttribute('data-align', 'start');
    expect(first).toHaveAttribute('data-entry', 'natural');
    expect(first).toHaveAttribute('data-size', 'sm');
    expect(first).toHaveAttribute('data-stepper', 'split');
    expect(first).toHaveAttribute('data-variant', 'subtle');
    expect(second).toHaveAttribute('data-align', 'end');
  });
});

describe('CurrencyFieldScrub', () => {
  const scrubPart = () => document.querySelector('[data-part="scrub"]') as HTMLElement;
  const drag = (from: number, ...moves: { clientX: number; shiftKey?: boolean }[]) => {
    fireEvent.pointerDown(scrubPart(), { button: 0, clientX: from, pointerId: 1 });
    for (const move of moves) fireEvent.pointerMove(scrubPart(), { pointerId: 1, ...move });
    fireEvent.pointerUp(scrubPart(), { pointerId: 1 });
  };
  const mark = <CurrencyFieldScrub>R$</CurrencyFieldScrub>;

  it('moves the amount one step per two pixels and carries its minor units', () => {
    const onValueChange = vi.fn();
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        currencyDisplay="none"
        defaultValue={10}
        locale="pt-BR"
        onValueChange={onValueChange}
        start={mark}
      />,
    );
    drag(100, { clientX: 101 }, { clientX: 106 }, { clientX: 104 });
    expect(control().value).toBe('12,00');
    expect(
      onValueChange.mock.calls.map(([value, request]) => [
        value,
        request.reason,
        request.minorUnits,
      ]),
    ).toEqual([
      [13, 'pointer', 1300],
      [12, 'pointer', 1200],
    ]);
  });

  it('counts every move even when they arrive before a render', () => {
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        currencyDisplay="none"
        defaultValue={0}
        locale="pt-BR"
        start={<CurrencyFieldScrub sensitivity={1}>R$</CurrencyFieldScrub>}
      />,
    );
    drag(0, { clientX: 1 }, { clientX: 2 }, { clientX: 3 });
    expect(control().value).toBe('3,00');
  });

  it('moves by the large step under Shift and stays inside the range', () => {
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        currencyDisplay="none"
        defaultValue={50}
        locale="pt-BR"
        max={100}
        start={mark}
      />,
    );
    drag(0, { clientX: 2, shiftKey: true }, { clientX: 20, shiftKey: true });
    expect(control().value).toBe('100,00');
  });

  it('marks the drag on the frame and on the part, and focuses the amount', () => {
    render(<CurrencyField aria-label="Valor" currency="BRL" locale="pt-BR" start={mark} />);
    fireEvent.pointerDown(scrubPart(), { button: 0, clientX: 0, pointerId: 1 });
    expect(frameOf(control())).toHaveAttribute('data-scrubbing');
    expect(scrubPart()).toHaveAttribute('data-scrubbing');
    expect(control()).toHaveFocus();
    fireEvent.pointerUp(scrubPart(), { pointerId: 1 });
    expect(frameOf(control())).not.toHaveAttribute('data-scrubbing');
  });

  it('does nothing on a read-only control', () => {
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        currencyDisplay="none"
        defaultValue={5}
        locale="pt-BR"
        readOnly
        start={mark}
      />,
    );
    drag(0, { clientX: 40 });
    expect(control().value).toBe('5,00');
  });

  it('is hidden from assistive technology and keeps native props', () => {
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        locale="pt-BR"
        start={
          <CurrencyFieldScrub className="mark" title="Arraste">
            R$
          </CurrencyFieldScrub>
        }
      />,
    );
    expect(scrubPart()).toHaveAttribute('aria-hidden', 'true');
    expect(scrubPart()).toHaveClass('mark');
    expect(scrubPart()).toHaveAttribute('title', 'Arraste');
  });
});

/**
 * The headline amount of an entry sheet: the figure at the display step, the
 * currency's mark apart from it so it can be muted at a smaller step, a rule
 * under it instead of a box — and the same cents-first typing, the same
 * request and the same field around it.
 */
describe('the display appearance', () => {
  it('draws the mark apart from the digits, on the side the locale writes it', () => {
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        defaultValue={12.34}
        locale="pt-BR"
        appearance="display"
      />,
    );
    const root = frameOf(control());
    expect(root).toHaveAttribute('data-appearance', 'display');
    expect(plain(control().value)).toBe('12,34');
    const mark = root.querySelector('[data-part="symbol"]') as HTMLElement;
    expect(mark).toHaveTextContent('R$');
    expect(mark.nextElementSibling).toBe(control());
    expect(plain(control().getAttribute('aria-valuetext') ?? '')).toBe('R$ 12,34');
  });

  it('puts the mark after the amount where the locale does', () => {
    render(
      <CurrencyField
        aria-label="Betrag"
        currency="EUR"
        defaultValue={5}
        locale="de-DE"
        appearance="display"
      />,
    );
    const mark = frameOf(control()).querySelector('[data-part="symbol"]') as HTMLElement;
    expect(mark.previousElementSibling).toBe(control());
  });

  it('types cents first and carries the integer of minor units at the display appearance', () => {
    const onValueChange = vi.fn();
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        locale="pt-BR"
        onValueChange={onValueChange}
        appearance="display"
      />,
    );
    typeDigits('5840');
    expect(plain(control().value)).toBe('58,40');
    expect(onValueChange).toHaveBeenLastCalledWith(
      58.4,
      expect.objectContaining({ currency: 'BRL', minorUnits: 5840, reason: 'keyboard' }),
    );
  });

  it('is named by the field and states invalid from it', () => {
    render(
      <Field invalid>
        <FieldLabel>Valor</FieldLabel>
        <CurrencyField currency="BRL" locale="pt-BR" appearance="display" />
        <FieldError>Informe um valor</FieldError>
      </Field>,
    );
    expect(control()).toHaveAccessibleName('Valor');
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(frameOf(control())).toHaveAttribute('data-invalid');
  });

  it('draws no separate mark under none', () => {
    render(
      <CurrencyField
        aria-label="Valor"
        currency="BRL"
        currencyDisplay="none"
        locale="pt-BR"
        appearance="display"
      />,
    );
    expect(frameOf(control()).querySelector('[data-part="symbol"]')).toBeNull();
  });
});
