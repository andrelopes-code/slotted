import { render } from '@testing-library/react';
import { useState } from 'react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { CurrencyField } from './index';
import type { CurrencyFieldProps } from './index';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const control = () => document.querySelector<HTMLInputElement>('[role="spinbutton"]')!;

let minor: number | null = null;

function Amount({ start, ...props }: Partial<CurrencyFieldProps> & { start: number }) {
  const [value, setValue] = useState<number | null>(start);
  minor = value;

  return (
    <>
      <button type="button">Before</button>
      <CurrencyField
        aria-label="Amount"
        currency="BRL"
        locale="pt-BR"
        onValueChange={setValue}
        unit="minor"
        value={value}
        {...props}
      />
    </>
  );
}

/** The text of the control, with `|` where the caret is. */
function caretText() {
  const { selectionEnd, selectionStart, value } = control();
  const plain = `${value.slice(0, selectionStart!)}|${value.slice(selectionStart!)}`;

  expect(selectionEnd).toBe(selectionStart);
  return plain.replace('\u00a0', ' ');
}

async function place(marked: string) {
  control().focus();
  const caret = marked.indexOf('|');
  control().setSelectionRange(caret, caret);
  await frame();
}

async function press(keys: string) {
  await userEvent.keyboard(keys);
  await frame();
}

/**
 * An edit was applied to the last digit, wherever the caret was: an amount was
 * corrected only by erasing it from the right.
 */
describe('the caret of a currency field under cents-first entry', () => {
  it('edits the digit it is against, and lets the first one be exchanged', async () => {
    render(<Amount start={1000000} />);
    await place('R$ 1|0.000,00');

    await press('{Backspace}');
    expect(caretText()).toBe('R$ |0.000,00');

    await press('2');
    expect(caretText()).toBe('R$ 2|0.000,00');
    expect(minor).toBe(2000000);

    await place('R$ 2|0.000,00');
    await press('5');
    expect(caretText()).toBe('R$ 25|0.000,00');
  });

  it('is the cash register at the end', async () => {
    render(<Amount start={0} />);
    await place('R$ 0,00|');
    await press('1234');

    expect(caretText()).toBe('R$ 12,34|');

    await press('{Backspace}');
    expect(caretText()).toBe('R$ 1,23|');
  });

  it('drops the zeros it kept when the field is left', async () => {
    render(<Amount start={1000000} />);
    await place('R$ 1|0.000,00');
    await press('{Backspace}');
    control().blur();
    await frame();

    expect(control().value.replace('\u00a0', ' ')).toBe('R$ 0,00');
    expect(minor).toBe(0);
  });

  it('erases the digit beside a separator', async () => {
    render(<Amount start={123456} />);
    await place('R$ 1.|234,56');
    await press('{Backspace}');
    expect(caretText()).toBe('R$ |234,56');
    expect(minor).toBe(23456);

    await place('R$ 234|,56');
    await press('{Delete}');
    expect(caretText()).toBe('R$ 23,4|6');
  });

  it('refuses a digit past the length limit and keeps the ones on its right', async () => {
    render(<Amount start={123456789012345} />);
    await place('R$ 1|.234.567.890.123,45');
    await press('9');

    expect(caretText()).toBe('R$ 1|.234.567.890.123,45');
    expect(minor).toBe(123456789012345);
  });

  it('is at the end on a focus by keyboard', async () => {
    render(<Amount start={1000000} />);
    document.querySelector('button')!.focus();
    await userEvent.tab();
    await frame();

    expect(caretText()).toBe('R$ 10.000,00|');
  });

  it('is at the end on a press of an amount that is nought, and where it lands on another', async () => {
    const { unmount } = render(<Amount align="start" start={0} />);
    await userEvent.click(control(), { position: { x: 4, y: 8 } });
    await frame();
    expect(caretText()).toBe('R$ 0,00|');
    unmount();

    render(<Amount align="start" start={1000000} />);
    await userEvent.click(control(), { position: { x: 4, y: 8 } });
    await frame();
    expect(control().selectionStart).toBeLessThan(control().value.length);
  });
});
