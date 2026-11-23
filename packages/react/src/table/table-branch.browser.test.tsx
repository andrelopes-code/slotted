import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { Avatar } from '../avatar';
import { paint } from '../test/ink';
import {
  Table,
  TableBody,
  TableCell,
  TableContent,
  TableExpander,
  TableMark,
  TableRow,
  type TableAlign,
} from './index';

/**
 * A rail leaves the foot of the parent's mark, each child has a branch from it
 * to its own mark, and the rail turns into the branch of the last child. Read
 * on the painted pixels: what is drawn is gradients of the cell's own box.
 */
describe.each([
  ['light', '#fff', '#111'],
  ['dark', '#111', '#f5f5f5'],
])('the branches of a table in %s', (_, ground, text) => {
  it.each(['center', 'start', 'end'] as const)(
    'run from the mark of a parent to the mark of its last child (%s)',
    async (cellAlign) => {
      mount({ cellAlign, ground, text });
      const ink = await reader();
      const rail = center(mark('loans')).x;

      expect(ink.column(rail, foot('loans') + 1, center(mark('car')).y)).toBe(true);
      expect(ink.any(rail, center(mark('car')).y + 2, top('cards') - 1)).toBe(false);
      for (const child of ['home', 'car']) {
        const to = mark(child).getBoundingClientRect().left;
        expect(ink.line(center(mark(child)).y, rail + 1, to - 3), child).toBe(true);
      }
      expect(
        ink.line(center(mark('visa')).y, rail + 1, mark('visa').getBoundingClientRect().left - 3),
      ).toBe(true);
      expect(ink.any(rail, center(mark('visa')).y + 2, top('cash') - 1)).toBe(false);
    },
  );

  it('carry the rail of a parent past the children of a child that is not its last', async () => {
    mount({ deep: true, ground, text });
    await userEvent.click(document.querySelector('[data-value="home"] [data-part="expander"]')!);
    const ink = await reader();
    const rail = center(mark('loans')).x;
    const inner = center(mark('home')).x;

    expect(ink.column(rail, foot('loans') + 1, center(mark('car')).y)).toBe(true);
    expect(ink.column(inner, foot('home') + 1, center(mark('flat')).y)).toBe(true);
    expect(ink.any(inner, center(mark('flat')).y + 2, top('car') - 1)).toBe(false);
  });
});

describe('the marks of a table with branches', () => {
  it('stand in one column per level, folding or not, a step smaller at a child', () => {
    mount({});
    const left = (value: string) => mark(value).getBoundingClientRect().left;
    const size = (value: string) =>
      mark(value).querySelector('[data-ui="avatar"]')!.getBoundingClientRect().width;

    expect(left('loans')).toBe(left('cash'));
    expect(left('home')).toBe(left('visa'));
    expect(size('home')).toBeLessThan(size('loans'));
  });

  it('leave the rows of one height', () => {
    mount({});
    const heights = [...document.querySelectorAll('[data-level]')].map(
      (row) => row.getBoundingClientRect().height,
    );

    expect(Math.max(...heights.slice(2)) - Math.min(...heights.slice(2))).toBeLessThan(1.1);
  });

  it('keep the column when the expander is written after the mark or outside the cell', () => {
    mount({ expander: 'after' });
    const left = (value: string) => mark(value).getBoundingClientRect().left;
    const cell = document.querySelector('[data-value="cash"] > td')!.getBoundingClientRect();

    expect(left('loans')).toBe(left('cash'));
    expect(left('cash') - cell.left).toBeLessThan(24);
  });

  it('start the rail at the expander of a row with no mark', async () => {
    mount({ marks: false });
    const ink = await reader();
    const expander = document.querySelector('[data-value="loans"] [data-part="expander"]')!;
    const box = expander.getBoundingClientRect();
    const last = document.querySelector('[data-value="car"]')!.getBoundingClientRect();

    expect(
      ink.column(box.left + box.width / 2, box.bottom + 1, last.top + last.height / 2 - 1),
    ).toBe(true);
    expect(ink.any(box.left + box.width / 2, last.top + last.height / 2 + 2, last.bottom - 2)).toBe(
      false,
    );
  });

  it('mirror in a right to left table', async () => {
    document.documentElement.dir = 'rtl';
    mount({});
    const ink = await reader();
    const rail = center(mark('loans')).x;
    const to = mark('car').getBoundingClientRect().right;
    document.documentElement.dir = '';

    expect(ink.column(rail, foot('loans') + 1, center(mark('car')).y)).toBe(true);
    expect(ink.line(center(mark('car')).y, to + 3, rail - 1)).toBe(true);
  });
});

interface SceneProps {
  readonly cellAlign?: TableAlign;
  readonly deep?: boolean;
  readonly expander?: 'before' | 'after';
  readonly ground?: string;
  readonly marks?: boolean;
  readonly text?: string;
}

function mount({
  cellAlign = 'center',
  deep = false,
  expander = 'before',
  ground = '#fff',
  marks = true,
  text = '#111',
}: SceneProps) {
  const lead = (value: string, folds: boolean) => (
    <>
      {folds && expander === 'before' && <TableExpander />}
      {marks && (
        <TableMark>
          <Avatar name={value} size="xs" />
        </TableMark>
      )}
      {folds && expander === 'after' && <TableExpander />}
    </>
  );
  const row = (value: string, level: number, parent?: string, folds = false) => (
    <TableRow level={level} value={value} {...(parent === undefined ? {} : { parent })}>
      <TableCell>
        {lead(value, folds)}
        {value}
      </TableCell>
      <TableCell>
        1,500.00
        {value === 'home' && (
          <>
            <br />a second line
          </>
        )}
      </TableCell>
    </TableRow>
  );

  render(
    <div
      style={
        {
          inlineSize: 400,
          '--slotted-surface': ground,
          '--slotted-text': text,
        } as CSSProperties
      }
    >
      <Table cellAlign={cellAlign} columns={2} defaultExpanded={['loans', 'cards']} guides="branch">
        <TableContent>
          <TableBody>
            {row('loans', 0, undefined, true)}
            {row('home', 1, 'loans', deep)}
            {deep && row('flat', 2, 'home')}
            {row('car', 1, 'loans')}
            {row('cards', 0, undefined, true)}
            {row('visa', 1, 'cards')}
            {row('cash', 0)}
          </TableBody>
        </TableContent>
      </Table>
    </div>,
  );
}

function mark(value: string) {
  return document.querySelector(`[data-value="${value}"] [data-part="mark"]`)!;
}

function top(value: string) {
  return mark(value).getBoundingClientRect().top;
}

function foot(value: string) {
  return mark(value).getBoundingClientRect().bottom;
}

function center(element: Element) {
  const box = element.getBoundingClientRect();

  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/** Where the painted page is not its ground, read with a pixel of slack for the snap. */
async function reader() {
  const { data, origin, width } = await paint();
  const luminance = (x: number, y: number) => {
    const at = (Math.floor(y + origin.y) * width + Math.floor(x + origin.x)) * 4;
    return 0.2126 * data[at]! + 0.7152 * data[at + 1]! + 0.0722 * data[at + 2]!;
  };
  const table = document.querySelector('[data-ui="table"]')!.getBoundingClientRect();
  const ground = luminance(table.right - 4, table.top + 4);
  const inked = (x: number, y: number) => Math.abs(luminance(x, y) - ground) > 25;
  const steps = (from: number, to: number) =>
    Array.from({ length: Math.max(0, Math.floor(to - from)) }, (_, step) => from + step);

  return {
    column: (x: number, from: number, to: number) =>
      [x - 1, x, x + 0.5].some((at) => steps(from, to).every((y) => inked(at, y))),
    line: (y: number, from: number, to: number) =>
      [y - 1, y, y + 0.5].some((at) => steps(from, to).every((x) => inked(x, at))),
    any: (x: number, from: number, to: number) =>
      [x - 1, x, x + 0.5].some((at) =>
        // The rule between two rows is not a rail.
        steps(from, to).some((y) => inked(at, y) && !inked(at - 4, y)),
      ),
  };
}
