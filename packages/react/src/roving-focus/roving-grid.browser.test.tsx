import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { useRovingGrid } from './roving-grid';
import type { UseRovingGridOptions } from './roving-grid';

const ITEMS = ['a', 'b', 'c', 'd'];

/** Questions with a text field in their head, and a button to answer each item with. */
function Matrix({ dir, ...options }: Partial<UseRovingGridOptions> & { dir?: string }) {
  const [rows, setRows] = useState(['1', '2', '3']);
  const grid = useRovingGrid({ rows: rows.length, columns: ITEMS.length, ...options });

  return (
    <div dir={dir}>
      <button>before</button>

      <div role="grid">
        {rows.map((row, at) => (
          <div key={row} role="row">
            <span role="rowheader">
              <input aria-label={`question ${row}`} defaultValue="text" tabIndex={-1} />
            </span>
            {ITEMS.map((item, column) => (
              <span key={item} role="gridcell">
                <button {...grid.cellProps(at, column)}>{`${row}${item}`}</button>
              </span>
            ))}
          </div>
        ))}
      </div>

      <button>after</button>
      <button onClick={() => setRows((held) => held.slice(1))} tabIndex={-1}>
        remove the first row
      </button>
      <button onClick={() => setRows((held) => held.slice(0, -1))} tabIndex={-1}>
        remove the last row
      </button>
    </div>
  );
}

const focused = () => document.activeElement?.textContent;
const stops = () =>
  [...document.querySelectorAll<HTMLElement>('[role="gridcell"] > button')]
    .filter((cell) => cell.tabIndex === 0)
    .map((cell) => cell.textContent);
const press = (keys: string) => userEvent.keyboard(keys);

async function enter(props: Parameters<typeof Matrix>[0] = {}) {
  render(<Matrix {...props} />);
  screen.getByText('before').focus();
  await press('{Tab}');
}

describe('a grid of controls with one tab stop', () => {
  it('is reached by one Tab and left by the next, from the cell last focused', async () => {
    await enter();
    expect(focused()).toBe('1a');

    await press('{ArrowDown}{ArrowRight}');
    expect(focused()).toBe('2b');
    expect(stops()).toEqual(['2b']);

    await press('{Tab}');
    expect(focused()).toBe('after');

    await press('{Shift>}{Tab}{/Shift}');
    expect(focused()).toBe('2b');
  });

  it('moves with the keys of a grid, and stops at its edges', async () => {
    await enter({ page: 2 });

    await press('{ArrowUp}{ArrowLeft}');
    expect(focused()).toBe('1a');
    await press('{End}');
    expect(focused()).toBe('1d');
    await press('{PageDown}');
    expect(focused()).toBe('3d');
    await press('{Home}');
    expect(focused()).toBe('3a');
    await press('{Control>}{End}{/Control}');
    expect(focused()).toBe('3d');
    await press('{Control>}{Home}{/Control}');
    expect(focused()).toBe('1a');
  });

  it('reads the columns right to left in right-to-left text', async () => {
    await enter({ dir: 'rtl' });

    await press('{ArrowLeft}');
    expect(focused()).toBe('1b');
    await press('{ArrowRight}');
    expect(focused()).toBe('1a');
  });

  it('leaves a text field in a row head its own arrows', async () => {
    await enter();
    const field = screen.getByLabelText<HTMLInputElement>('question 2');
    field.focus();
    field.setSelectionRange(2, 2);

    await press('{ArrowRight}');
    expect(document.activeElement).toBe(field);
    expect(field.selectionStart).toBe(3);

    await press('{ArrowDown}{Home}');
    expect(document.activeElement).toBe(field);
    expect(stops()).toEqual(['1a']);
  });

  it('takes the stop to a cell pressed by the pointer', async () => {
    await enter();

    await userEvent.click(screen.getByText('3c'));

    expect(stops()).toEqual(['3c']);
  });

  it('keeps the stop on the cell whose row moved, and on the nearest one when it leaves', async () => {
    await enter();
    await press('{Control>}{End}{/Control}');

    await userEvent.click(screen.getByText('remove the first row'));
    expect(stops()).toEqual(['3d']);

    await userEvent.click(screen.getByText('remove the last row'));
    expect(stops()).toEqual(['2d']);
  });

  it('passes a cell that takes no focus, the first one included', async () => {
    await enter({ isDisabled: ({ column, row }) => (row === 0 && column === 0) || column === 2 });
    expect(focused()).toBe('1b');

    await press('{ArrowRight}');
    expect(focused()).toBe('1d');
  });
});
