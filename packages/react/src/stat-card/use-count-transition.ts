import { playCount } from '@slotted/core/count';
import { useEffect, useRef, useState } from 'react';

export interface CountTransitionOptions {
  /** `false` shows the value as it is, and the next change starts from it. Defaults to `true`. */
  enabled?: boolean | undefined;
  /** The element whose theme the timing is read from. Defaults to the document's root. */
  source?: Element | null | undefined;
}

/**
 * The number to draw while `value` moves from the one it held to the one it
 * holds now, over the theme's `--slotted-duration-long` with the standard
 * easing. The first render returns `value` itself; only a change moves. A
 * change while a move is running starts from the number on screen.
 */
export function useCountTransition(value: number, options: CountTransitionOptions = {}): number {
  const { enabled = true, source } = options;
  const [shown, setShown] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const from = current.current;

    if (!enabled || from === value) {
      current.current = value;
      setShown(value);
      return undefined;
    }

    const element = source ?? document.documentElement;

    return playCount({
      element,
      from,
      to: value,
      onFrame: (next) => {
        current.current = next;
        setShown(next);
      },
    });
  }, [enabled, source, value]);

  return enabled ? shown : value;
}
