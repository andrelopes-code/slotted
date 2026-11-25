import { clockMove, clockStop } from '@slotted/core/date';
import type { ClockCell, ClockStep } from '@slotted/core/date';
import { useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, RefObject } from 'react';

interface ClockGridOptions {
  readonly cells: readonly ClockCell[];
  readonly disabled: boolean;
  /** How many cells stand in each row, in order. */
  readonly rows: readonly number[];
}

interface ClockGridItemProps {
  readonly onFocus: () => void;
  readonly tabIndex: 0 | -1;
}

export interface ClockGrid {
  readonly itemProps: (index: number) => ClockGridItemProps;
  readonly listProps: {
    readonly onBlur: (event: FocusEvent<HTMLElement>) => void;
    readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    readonly ref: RefObject<HTMLDivElement | null>;
  };
}

const STEPS: Partial<Record<string, ClockStep>> = {
  ArrowDown: 'down',
  ArrowUp: 'up',
  End: 'rowEnd',
  Home: 'rowStart',
  PageDown: 'lastRow',
  PageUp: 'firstRow',
};

/**
 * One tab stop over the cells of a grid. The arrows move the focus and choose
 * nothing: a press does. The stop rests on the chosen cell whenever focus is
 * elsewhere, so a value that moves from outside moves it.
 */
export function useClockGrid({ cells, disabled, rows }: ClockGridOptions): ClockGrid {
  const ref = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState<number | null>(null);
  const stop = Math.min(held ?? clockStop(cells), Math.max(0, cells.length - 1));

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    const step = stepOf(event);
    if (step === undefined) return;

    event.preventDefault();
    event.stopPropagation();
    const options = ref.current?.querySelectorAll<HTMLElement>('[role="option"]');
    options?.[clockMove(rows, stop, step)]?.focus();
  }

  return {
    itemProps: (index) => ({
      onFocus: () => setHeld(index),
      tabIndex: !disabled && index === stop ? 0 : -1,
    }),
    listProps: {
      onBlur: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(null);
      },
      onKeyDown: handleKeyDown,
      ref,
    },
  };
}

function stepOf(event: KeyboardEvent<HTMLElement>): ClockStep | undefined {
  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
  if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) return 'next';
  if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) return 'previous';

  return STEPS[event.key];
}
