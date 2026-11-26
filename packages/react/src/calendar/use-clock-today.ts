import { isSameDate, todayIn } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { useCallback, useRef, useSyncExternalStore } from 'react';

/**
 * Which day the clock says it is in `timeZone`: `null` on the server and
 * while the server's markup is hydrated, the day itself in every other
 * render. A server and a browser in different zones disagree about today,
 * so the markup they share holds no day; a calendar mounted later, as the one
 * a picker opens, knows the day from its first render and opens on its month.
 */
export function useClockToday(timeZone: string | undefined): PlainDate | null {
  const held = useRef<{ day: PlainDate; zone: string | undefined } | null>(null);

  const read = useCallback(() => {
    const day = todayIn(timeZone);
    const last = held.current;
    /* The same day is the same snapshot, or every render would see a change. */
    if (last !== null && last.zone === timeZone && isSameDate(last.day, day)) return last.day;

    held.current = { day, zone: timeZone };

    return day;
  }, [timeZone]);

  return useSyncExternalStore(subscribe, read, server);
}

/** The clock is read at each render; nothing announces midnight. */
function subscribe() {
  return () => undefined;
}

function server(): PlainDate | null {
  return null;
}
