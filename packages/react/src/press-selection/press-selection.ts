import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export interface PressSelection<T> {
  /** What the navigation shows as current: the pressed value until `current` moves, else `current`. */
  selected: T | undefined;
  /**
   * Marks `value` selected and paints it, then runs `commit` — the router's
   * navigation — once the browser has painted. A newer press supersedes this
   * one, and its `commit` does not run.
   */
  select: (value: T, commit: () => void) => void;
}

/**
 * A selection that paints before the route renders. A navigation whose
 * current item follows the router location paints the press only after the
 * destination has rendered and laid out — hundreds of milliseconds on a heavy
 * page, seconds on a mid-range phone — and the tap reads as ignored.
 *
 * `select` commits the pressed value synchronously (`flushSync`), lets the
 * browser paint (an animation frame, then a task), and only then runs the
 * navigation the caller passes. The pressed value holds until `current`
 * moves, to it or anywhere else.
 */
export function usePressSelection<T>(current: T | undefined): PressSelection<T> {
  const [pending, setPending] = useState<{ value: T; from: T | undefined } | null>(null);
  const press = useRef(0);
  const timers = useRef<{ frame: number; task: ReturnType<typeof setTimeout> | undefined }>({
    frame: 0,
    task: undefined,
  });

  /* The router answered: what it says is current from here on. */
  const settled = pending !== null && !Object.is(current, pending.from);
  useEffect(() => {
    if (settled) setPending(null);
  }, [settled]);

  useEffect(
    () => () => {
      cancelAnimationFrame(timers.current.frame);
      clearTimeout(timers.current.task);
    },
    [],
  );

  const select = (value: T, commit: () => void) => {
    const id = ++press.current;
    cancelAnimationFrame(timers.current.frame);
    clearTimeout(timers.current.task);
    flushSync(() => setPending({ value, from: current }));
    timers.current.frame = requestAnimationFrame(() => {
      timers.current.task = setTimeout(() => {
        if (id === press.current) commit();
      }, 0);
    });
  };

  return { selected: pending === null || settled ? current : pending.value, select };
}
