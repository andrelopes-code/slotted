import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/number-field/contract.json';
import { Field, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { NumberField, NumberFieldScrub } from './number-field';
import { NumberFieldDefaultsProvider } from './number-field-defaults';
import type { NumberFieldHandle } from './number-field.types';

const control = () => screen.getByRole('spinbutton') as HTMLInputElement;
const frameOf = (element: HTMLElement) => element.parentElement as HTMLElement;
const stepper = (part: 'increment' | 'decrement') =>
  frameOf(control()).querySelector(`[data-part="${part}"]`) as HTMLButtonElement;

/** What the reader typed, without a commit. */
function type(value: string) {
  fireEvent.change(control(), { target: { value } });
}

/**
 * The element's own setter rather than the property. React keeps a tracker
 * beside the node and skips `change` when the value it recorded is the value
 * it sees, and assigning through the patched property updates that tracker —
 * so the event fires and the handler never runs.
 */
function setValue(element: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(element, value);
}

/**
 * One character, put in at the caret, the way a keyboard puts it in. The whole
 * point of the caret rule is that it survives a sequence of these, which
 * setting the value whole cannot show.
 */
function keystroke(element: HTMLInputElement, character: string) {
  const at = element.selectionStart ?? element.value.length;
  setValue(element, element.value.slice(0, at) + character + element.value.slice(at));
  element.setSelectionRange(at + 1, at + 1);
  fireEvent(element, new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

/** A backward deletion of one character, already applied, the way a browser applies it. */
function backspace(element: HTMLInputElement, at: number) {
  setValue(element, element.value.slice(0, at - 1) + element.value.slice(at));
  element.setSelectionRange(at - 1, at - 1);
  fireEvent(
    element,
    new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }),
  );
}

describe('NumberField', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<NumberField className="page-amount" defaultValue={12} end="un" start="R$" />);

    const root = frameOf(control());
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-ui', 'number-field');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root).toHaveClass('page-amount');
    expect(control()).toHaveAttribute('data-part', 'input');
    expect(root.querySelector('[data-part="start"]')).toHaveTextContent('R$');
    expect(root.querySelector('[data-part="end"]')).toHaveTextContent('un');
    expect(root.querySelector('[data-part="stepper"]')).not.toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<NumberField defaultValue={1} />);
    const root = frameOf(control());

    expect(root).toHaveAttribute('data-size', contract.members.numberField.defaults.size);
    expect(root).toHaveAttribute('data-variant', contract.members.numberField.defaults.variant);
    expect(root).toHaveAttribute('data-stepper', contract.members.numberField.defaults.stepper);
  });

  /**
   * `type="number"` empties itself whenever the text is not a valid
   * floating-point number, so no grouping separator and no currency affix
   * survives it. The role is the APG's, applied to a text input.
   */
  it('holds the value in a text input carrying the spinbutton role', () => {
    render(<NumberField defaultValue={12} max={20} min={0} />);

    expect(control()).toHaveAttribute('type', 'text');
    expect(control()).toHaveAttribute('role', contract.controlRole);
    expect(control()).toHaveAttribute('aria-valuenow', '12');
    expect(control()).toHaveAttribute('aria-valuemin', '0');
    expect(control()).toHaveAttribute('aria-valuemax', '20');
    expect(control()).toHaveAttribute('aria-valuetext', '12');
  });

  /** The frame carries no role: a spinbutton may hold no interactive children. */
  it('leaves the frame out of the accessibility tree', () => {
    render(<NumberField defaultValue={1} />);
    expect(frameOf(control())).not.toHaveAttribute('role');
    expect(contract.rootRole).toBeNull();
  });

  it('formats the value for the locale it was given', () => {
    render(<NumberField defaultValue={1480.5} locale="pt-BR" />);
    expect(control()).toHaveValue('1.480,5');
  });

  it('reads back a value pasted in the locale’s own writing', () => {
    const onValueChange = vi.fn();
    render(
      <NumberField
        format={{ currency: 'BRL', style: 'currency' }}
        locale="pt-BR"
        onValueChange={onValueChange}
      />,
    );

    type('R$ 1.480,00');
    expect(onValueChange).toHaveBeenCalledWith(
      1480,
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  /** Empty is a value: a required amount left blank and an amount of nought differ. */
  it('reads an empty control as empty rather than as nought', () => {
    const onValueChange = vi.fn();
    render(<NumberField defaultValue={12} onValueChange={onValueChange} />);

    type('');
    expect(onValueChange).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ reason: 'keyboard' }),
    );
    /* No value, so nothing to announce as one: the property is absent rather
       than nought, which is a number the field does not hold. */
    expect(control()).not.toHaveAttribute('aria-valuenow');
  });

  /**
   * Grouping is what makes a long number scannable, and the moment a reader
   * most needs to check a magnitude is the moment they are getting it wrong.
   * The family formatted only at the commit for its first release, which left
   * the reader looking at `1234567` until they tabbed away.
   */
  it('gives the text the locale’s shape on the keystroke that changed it', () => {
    render(<NumberField locale="en-US" />);

    type('1234');
    expect(control()).toHaveValue('1,234');

    type('1234.50');
    /* Padding and rounding belong to the commit: the nought the reader has
       just typed is still theirs. */
    expect(control()).toHaveValue('1,234.50');
  });

  it('holds the reader’s own text until a commit when asked to', () => {
    render(<NumberField formatOn="commit" locale="en-US" />);

    type('1234.5');
    expect(control()).toHaveValue('1234.5');

    fireEvent.blur(control());
    expect(control()).toHaveValue('1,234.5');
  });

  /**
   * The whole cost of formatting while typing. A separator appears between two
   * keystrokes and every string index after it moves, so a caret restored to
   * the index it was at lands on a different character and the next keystroke
   * goes in the wrong place — `1234` then `5` came out as `12,354`.
   */
  it('leaves the caret on the character it was on, not the index it was at', () => {
    render(<NumberField locale="en-US" />);
    const element = control();
    /* The family puts the caret back only in the control the reader is in:
       moving the selection of an element nobody is typing in scrolls it into
       view on some engines. */
    element.focus();

    keystroke(element, '1');
    keystroke(element, '2');
    keystroke(element, '3');
    keystroke(element, '4');
    expect(element).toHaveValue('1,234');
    expect(element.selectionStart).toBe(5);

    keystroke(element, '5');
    expect(element).toHaveValue('12,345');
  });

  /**
   * Backspace against a separator the family inserted removes punctuation that
   * the next regrouping puts straight back, so the key does nothing and the
   * reader presses it twice to lose one digit. The digit they meant is taken
   * instead.
   */
  it('deletes the digit behind a grouping separator rather than the separator', () => {
    render(<NumberField defaultValue={1234} locale="en-US" />);
    const element = control();
    element.focus();
    expect(element).toHaveValue('1,234');

    /* The caret sits after the comma, so the browser removes the comma. */
    backspace(element, 2);

    expect(element).toHaveValue('234');
    expect(element.selectionStart).toBe(0);
  });

  /**
   * `-` is on its way to a number without being one, so the text keeps it and
   * the number stays where it was. Nothing is emitted, because a request for
   * the value the family already holds has nothing to decide and nothing to
   * cancel — the rule `docs/state-and-events.md` states.
   */
  it('holds a partly typed value without destroying the number', () => {
    const onValueChange = vi.fn();
    render(<NumberField locale="en-US" onValueChange={onValueChange} />);

    type('-');
    expect(control()).toHaveValue('-');
    expect(onValueChange).not.toHaveBeenCalled();

    type('-12');
    expect(onValueChange).toHaveBeenCalledWith(-12, expect.anything());
  });

  describe('the state model', () => {
    it('moves its own value when nobody owns it', () => {
      render(<NumberField defaultValue={4} />);
      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(control()).toHaveValue('5');
    });

    it('never moves a value the consumer owns', () => {
      const onValueChange = vi.fn();
      render(<NumberField onValueChange={onValueChange} value={4} />);

      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(onValueChange).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ reason: 'keyboard' }),
      );
      expect(control()).toHaveValue('4');
    });

    it('takes the consumer’s new value back into the text', () => {
      function Controlled() {
        const [value, setValue] = useState<number | null>(4);
        return <NumberField onValueChange={setValue} value={value} />;
      }
      render(<Controlled />);

      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(control()).toHaveValue('5');
    });

    it('commits nothing when the request is refused', () => {
      render(<NumberField defaultValue={4} onValueChange={(_, request) => request.cancel()} />);
      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(control()).toHaveValue('4');
    });

    it('carries the reason the pointer, the keyboard and the commit each produce', () => {
      const onValueChange = vi.fn();
      render(<NumberField defaultValue={4} max={10} onValueChange={onValueChange} />);

      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(onValueChange).toHaveBeenLastCalledWith(
        5,
        expect.objectContaining({ reason: 'keyboard' }),
      );

      fireEvent.pointerDown(stepper('increment'), { button: 0, detail: 1 });
      expect(onValueChange).toHaveBeenLastCalledWith(
        6,
        expect.objectContaining({ reason: 'pointer' }),
      );

      /* The commit is what clamps, so it is where a value the reader typed
         past the maximum moves — and it moves with reason `blur`. */
      type('40');
      fireEvent.blur(control());
      expect(onValueChange).toHaveBeenLastCalledWith(
        10,
        expect.objectContaining({ reason: 'blur' }),
      );
    });

    it('emits only the reasons the contract declares', () => {
      const seen: string[] = [];
      render(
        <NumberField defaultValue={4} onValueChange={(_, request) => seen.push(request.reason)} />,
      );

      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      fireEvent.pointerDown(stepper('decrement'), { button: 0, detail: 1 });
      type('7');
      fireEvent.blur(control());

      for (const reason of seen) expect(contract.stateModel.value.reasons).toContain(reason);
    });
  });

  describe('the keyboard the pattern lists', () => {
    it('steps by one on the arrows', () => {
      render(<NumberField defaultValue={4} step={2} />);
      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(control()).toHaveValue('6');
      fireEvent.keyDown(control(), { key: 'ArrowDown' });
      expect(control()).toHaveValue('4');
    });

    it('steps by the large amount with Shift and by the small one with Alt', () => {
      render(<NumberField defaultValue={0} step={1} />);

      fireEvent.keyDown(control(), { key: 'ArrowUp', shiftKey: true });
      expect(control()).toHaveValue('10');

      fireEvent.keyDown(control(), { key: 'ArrowDown', altKey: true });
      expect(control()).toHaveValue('9.9');
    });

    it('steps by the large amount on the page keys', () => {
      render(<NumberField defaultValue={0} largeStep={25} step={1} />);

      fireEvent.keyDown(control(), { key: 'PageUp' });
      expect(control()).toHaveValue('25');
      fireEvent.keyDown(control(), { key: 'PageDown' });
      expect(control()).toHaveValue('0');
    });

    it('reaches the bounds on Home and End, and only when they exist', () => {
      const { rerender } = render(<NumberField defaultValue={5} max={80} min={2} />);

      fireEvent.keyDown(control(), { key: 'Home' });
      expect(control()).toHaveValue('2');
      fireEvent.keyDown(control(), { key: 'End' });
      expect(control()).toHaveValue('80');

      /* A new instance, because `defaultValue` is read once: re-rendering does
         not hand an uncontrolled component a second starting value. */
      rerender(<NumberField defaultValue={5} key="unbounded" />);
      fireEvent.keyDown(control(), { key: 'Home' });
      expect(control()).toHaveValue('5');
      fireEvent.keyDown(control(), { key: 'End' });
      expect(control()).toHaveValue('5');
    });

    /**
     * A single-line control submits its form. The commit runs first, so the
     * value the form reads is the formatted, clamped one.
     */
    it('commits on Enter without intercepting the submit', () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <NumberField locale="en-US" max={10} name="quantity" />
        </form>,
      );

      type('40');
      fireEvent.keyDown(control(), { key: 'Enter' });
      expect(control()).toHaveValue('10');

      fireEvent.submit(control().form as HTMLFormElement);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('binds nothing to Escape', () => {
      render(<NumberField defaultValue={4} />);
      const event = fireEvent.keyDown(control(), { key: 'Escape' });
      expect(event).toBe(true);
      expect(control()).toHaveValue('4');
      expect(contract.escapeBound).toBe(false);
    });

    it('lets the consumer’s own handler refuse a key before the family acts', () => {
      render(<NumberField defaultValue={4} onKeyDown={(event) => event.preventDefault()} />);
      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(control()).toHaveValue('4');
    });
  });

  describe('the two steppers', () => {
    it('keeps them out of the tab order and in the accessibility tree', () => {
      render(<NumberField defaultValue={1} messages={{ decrement: 'Less', increment: 'More' }} />);

      for (const part of ['increment', 'decrement'] as const) {
        const button = stepper(part);
        expect(button).toHaveAttribute('tabindex', String(contract.stepperTabIndex));
        expect(button).toHaveAttribute('type', 'button');
        expect(button.getAttribute('aria-label')).not.toBe('');
      }
      expect(stepper('increment')).toHaveAttribute('aria-label', 'More');
      expect(stepper('decrement')).toHaveAttribute('aria-label', 'Less');
    });

    it('points each one at the control it moves', () => {
      render(
        <Field>
          <FieldLabel>Quantidade</FieldLabel>
          <NumberField defaultValue={1} />
        </Field>,
      );
      expect(stepper('increment')).toHaveAttribute('aria-controls', control().id);
    });

    it('disables the one that would leave the range', () => {
      render(<NumberField defaultValue={10} max={10} min={0} />);
      expect(stepper('increment')).toBeDisabled();
      expect(stepper('decrement')).not.toBeDisabled();
    });

    it('disables both when the control cannot be changed', () => {
      const { rerender } = render(<NumberField defaultValue={1} readOnly />);
      expect(stepper('increment')).toBeDisabled();
      expect(stepper('decrement')).toBeDisabled();

      rerender(<NumberField defaultValue={1} disabled />);
      expect(stepper('increment')).toBeDisabled();
    });

    it('returns focus to the value rather than keeping it on the button', () => {
      render(<NumberField defaultValue={1} />);
      fireEvent.pointerDown(stepper('increment'), { button: 0, detail: 1 });
      expect(document.activeElement).toBe(control());
    });

    it('starts an empty control at the value it was told to start from', () => {
      render(<NumberField stepFrom={5} />);
      fireEvent.pointerDown(stepper('increment'), { button: 0, detail: 1 });
      expect(control()).toHaveValue('5');
    });

    it('renders the split arrangement in the order it is painted', () => {
      render(<NumberField defaultValue={3} stepper="split" />);
      const parts = [...frameOf(control()).children].map((child) =>
        child.getAttribute('data-part'),
      );
      expect(parts).toEqual(['decrement', 'input', 'increment']);
    });

    it('draws a chevron in each stacked half and the minus and plus when split', () => {
      const glyph = (part: 'increment' | 'decrement') =>
        stepper(part).querySelector('svg[data-glyph]')?.getAttribute('data-glyph');
      const { unmount } = render(<NumberField defaultValue={3} />);
      expect(glyph('increment')).toBe('chevron-down');
      expect(glyph('decrement')).toBe('chevron-down');
      unmount();

      render(<NumberField defaultValue={3} stepper="split" />);
      expect(glyph('increment')).toBe('plus');
      expect(glyph('decrement')).toBe('minus');
    });

    it('withdraws them entirely when the arrangement says none', () => {
      render(<NumberField defaultValue={3} stepper="none" />);
      expect(frameOf(control()).querySelector('[data-part="increment"]')).toBeNull();
    });
  });

  describe('the range policies', () => {
    it('returns a value outside the range at the commit', () => {
      render(<NumberField clamp="blur" max={10} min={0} />);
      type('40');
      fireEvent.blur(control());
      expect(control()).toHaveValue('10');
    });

    it('leaves a value outside the range where the reader put it', () => {
      render(<NumberField clamp="none" max={10} min={0} />);
      type('40');
      fireEvent.blur(control());
      expect(control()).toHaveValue('40');
    });

    it('reports a value it leaves outside the range as invalid', () => {
      render(<NumberField clamp="none" max={10} min={0} />);
      type('40');
      fireEvent.blur(control());
      expect(control()).toHaveAttribute('aria-invalid', 'true');
      expect(frameOf(control())).toHaveAttribute('data-invalid', '');

      type('5');
      expect(control()).not.toHaveAttribute('aria-invalid');
      expect(frameOf(control())).not.toHaveAttribute('data-invalid');
    });

    it('lets a stated invalid={false} win over the range report', () => {
      render(<NumberField clamp="none" defaultValue={40} invalid={false} max={10} min={0} />);
      expect(control()).not.toHaveAttribute('aria-invalid');
    });

    it('snaps to the multiples measured from the minimum when asked', () => {
      render(<NumberField defaultValue={4} min={2} snapToStep step={3} />);
      fireEvent.keyDown(control(), { key: 'ArrowUp' });
      expect(control()).toHaveValue('5');
    });

    it('commits a typed value to the nearest multiple, not one step past it', () => {
      render(<NumberField min={2} snapToStep step={3} />);
      type('7');
      fireEvent.blur(control());
      expect(control()).toHaveValue('8');

      type('11');
      fireEvent.blur(control());
      expect(control()).toHaveValue('11');
    });
  });

  describe('the wheel', () => {
    it('does not move the value unless it was asked to', () => {
      render(<NumberField defaultValue={4} />);
      control().focus();
      fireEvent.wheel(control(), { deltaY: -100 });
      expect(control()).toHaveValue('4');
    });

    it('moves the value when it was, and only while the control has focus', () => {
      render(<NumberField defaultValue={4} wheel />);

      fireEvent.wheel(control(), { deltaY: -100 });
      expect(control()).toHaveValue('4');

      control().focus();
      fireEvent.wheel(control(), { deltaY: -100 });
      expect(control()).toHaveValue('5');
    });
  });

  describe('the field around it', () => {
    it('takes its identity, its description and its state without a wrapper', () => {
      render(
        <Field invalid required>
          <FieldLabel>Discount</FieldLabel>
          <NumberField defaultValue={120} />
          <FieldError>The discount cannot exceed 100%.</FieldError>
        </Field>,
      );

      const input = control();
      expect(input.id).not.toBe('');
      expect(screen.getByText('Discount')).toHaveAttribute('for', input.id);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input.getAttribute('aria-describedby')).toContain(
        screen.getByText('The discount cannot exceed 100%.').id,
      );
      expect(frameOf(input)).toHaveAttribute('data-invalid', '');
    });

    it('never writes the native required attribute', () => {
      render(
        <Field required>
          <NumberField />
        </Field>,
      );
      expect(control()).not.toHaveAttribute('required');
      expect(contract.requiredAttribute).toBe('aria-required');
    });

    it('lets a stated value win over the field', () => {
      render(
        <Field disabled>
          <NumberField disabled={false} />
        </Field>,
      );
      expect(control()).not.toBeDisabled();
    });

    it('takes the field’s step before its own default', () => {
      render(
        <Field size="lg">
          <NumberField />
        </Field>,
      );
      expect(frameOf(control())).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('forms', () => {
    it('submits the raw number rather than the formatted string', () => {
      render(
        <NumberField
          defaultValue={1480}
          format={{ currency: 'BRL', style: 'currency' }}
          locale="pt-BR"
          name="amount"
        />,
      );

      expect(control().value).toContain('1.480,00');
      const hidden = frameOf(control()).querySelector('input[type="hidden"]') as HTMLInputElement;
      expect(hidden.name).toBe('amount');
      expect(hidden.value).toBe('1480');
      expect(control()).not.toHaveAttribute('name');
    });

    it('commits the number it shows, at the precision the format states', () => {
      render(<NumberField format={{ maximumFractionDigits: 2 }} name="amount" />);
      type('10.555');
      fireEvent.blur(control());
      expect(control()).toHaveValue('10.56');
      const hidden = frameOf(control()).querySelector('input[type="hidden"]') as HTMLInputElement;
      expect(hidden.value).toBe('10.56');
      expect(control()).toHaveAttribute('aria-valuenow', '10.56');
    });

    it('submits nothing for an empty control', () => {
      render(<NumberField name="amount" />);
      const hidden = frameOf(control()).querySelector('input[type="hidden"]') as HTMLInputElement;
      expect(hidden.value).toBe('');
    });

    it('restores what it started from when the form resets', () => {
      render(
        <form>
          <NumberField defaultValue={7} name="amount" />
        </form>,
      );

      type('40');
      fireEvent.reset(control().form as HTMLFormElement);
      expect(control()).toHaveValue('7');
    });
  });

  describe('what a consumer reaches past the props', () => {
    it('hands the native element to a ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<NumberField defaultValue={1} ref={ref} />);
      expect(ref.current).toBe(control());
    });

    it('exposes only the two actions a value cannot express', () => {
      const handle = createRef<NumberFieldHandle>();
      const onValueChange = vi.fn();
      render(<NumberField defaultValue={4} handle={handle} onValueChange={onValueChange} />);

      handle.current?.increment();
      expect(onValueChange).toHaveBeenLastCalledWith(
        5,
        expect.objectContaining({ reason: 'programmatic' }),
      );
      expect(Object.keys(handle.current ?? {}).sort()).toEqual([...contract.imperative].sort());
    });

    it('renders the frame into the consumer’s own element', () => {
      render(<NumberField defaultValue={1} render={(props) => <label {...props} />} />);
      expect(frameOf(control()).tagName).toBe('LABEL');
    });

    it('lets an application decide once what its number fields look like', () => {
      render(
        <NumberFieldDefaultsProvider stepper="split" variant="subtle">
          <NumberField defaultValue={1480.5} />
        </NumberFieldDefaultsProvider>,
      );

      expect(frameOf(control())).toHaveAttribute('data-variant', 'subtle');
      expect(frameOf(control())).toHaveAttribute('data-stepper', 'split');
    });

    it('writes and speaks in the language in force', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <NumberField defaultValue={1480.5} />
        </SlottedProvider>,
      );

      expect(control()).toHaveValue('1.480,5');
      expect(stepper('increment')).toHaveAttribute('aria-label', 'Aumentar');
      expect(stepper('decrement')).toHaveAttribute('aria-label', 'Diminuir');
    });

    it('passes every native attribute through to the element that owns it', () => {
      render(<NumberField enterKeyHint="done" placeholder="0,00" />);
      expect(control()).toHaveAttribute('placeholder', '0,00');
      expect(control()).toHaveAttribute('enterkeyhint', 'done');
    });

    it('composes with the consumer’s own change handler rather than replacing it', () => {
      const onChange = vi.fn();
      render(<NumberField onChange={onChange} />);
      type('7');
      expect(onChange).toHaveBeenCalled();
      expect(control()).toHaveValue('7');
    });
  });

  describe('the software keyboard', () => {
    it('asks for the keypad the format admits and never sniffs the device', () => {
      const { rerender } = render(<NumberField format={{ maximumFractionDigits: 0 }} min={0} />);
      expect(control()).toHaveAttribute('inputmode', contract.inputMode.integer);

      rerender(<NumberField min={0} />);
      expect(control()).toHaveAttribute('inputmode', contract.inputMode.fractional);

      rerender(<NumberField />);
      expect(control()).toHaveAttribute('inputmode', contract.inputMode.negative);
    });

    it('lets a consumer who knows better state it', () => {
      render(<NumberField inputMode="numeric" />);
      expect(control()).toHaveAttribute('inputmode', 'numeric');
    });
  });
});

describe('NumberFieldScrub', () => {
  const scrubPart = () => document.querySelector('[data-part="scrub"]') as HTMLElement;
  const drag = (from: number, ...moves: { clientX: number; shiftKey?: boolean }[]) => {
    fireEvent.pointerDown(scrubPart(), { button: 0, clientX: from, pointerId: 1 });
    for (const move of moves) fireEvent.pointerMove(scrubPart(), { pointerId: 1, ...move });
    fireEvent.pointerUp(scrubPart(), { pointerId: 1 });
  };

  it('moves the number one step per two pixels towards the inline end', () => {
    const onValueChange = vi.fn();
    render(
      <NumberField
        aria-label="Largura"
        defaultValue={10}
        onValueChange={onValueChange}
        start={<NumberFieldScrub>L</NumberFieldScrub>}
      />,
    );
    drag(100, { clientX: 101 }, { clientX: 106 }, { clientX: 104 });
    expect(control().value).toBe('12');
    expect(onValueChange.mock.calls.map(([value, request]) => [value, request.reason])).toEqual([
      [13, 'pointer'],
      [12, 'pointer'],
    ]);
  });

  it('counts every move even when they arrive before a render', () => {
    render(
      <NumberField
        aria-label="Largura"
        defaultValue={0}
        start={<NumberFieldScrub sensitivity={1}>L</NumberFieldScrub>}
      />,
    );
    drag(0, { clientX: 1 }, { clientX: 2 }, { clientX: 3 });
    expect(control().value).toBe('3');
  });

  it('moves by the large step under Shift and stays inside the range', () => {
    render(
      <NumberField
        aria-label="Opacidade"
        defaultValue={50}
        max={100}
        start={<NumberFieldScrub>O</NumberFieldScrub>}
      />,
    );
    drag(0, { clientX: 2, shiftKey: true }, { clientX: 20, shiftKey: true });
    expect(control().value).toBe('100');
  });

  it('marks the drag on the frame and on the part, and focuses the value', () => {
    render(<NumberField aria-label="Angle" start={<NumberFieldScrub>A</NumberFieldScrub>} />);
    fireEvent.pointerDown(scrubPart(), { button: 0, clientX: 0, pointerId: 1 });
    expect(frameOf(control())).toHaveAttribute('data-scrubbing');
    expect(scrubPart()).toHaveAttribute('data-scrubbing');
    expect(control()).toHaveFocus();
    fireEvent.pointerUp(scrubPart(), { pointerId: 1 });
    expect(frameOf(control())).not.toHaveAttribute('data-scrubbing');
  });

  it('does nothing on a read-only or disabled control', () => {
    render(
      <NumberField
        aria-label="Largura"
        defaultValue={5}
        readOnly
        start={<NumberFieldScrub>L</NumberFieldScrub>}
      />,
    );
    drag(0, { clientX: 40 });
    expect(control().value).toBe('5');
  });

  it('is hidden from assistive technology and keeps native props', () => {
    render(
      <NumberField
        aria-label="Largura"
        start={
          <NumberFieldScrub className="mark" title="Arraste">
            L
          </NumberFieldScrub>
        }
      />,
    );
    expect(scrubPart()).toHaveAttribute('aria-hidden', 'true');
    expect(scrubPart()).toHaveClass('mark');
    expect(scrubPart()).toHaveAttribute('title', 'Arraste');
  });
});
