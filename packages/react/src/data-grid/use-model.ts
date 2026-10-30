import { createControllable, type ChangeReason, type ChangeRequest } from '@slotted/core/state';
import { useCallback, useRef, useState } from 'react';

/**
 * One mutable value in the library's two modes, as a hook. The consumer's
 * value wins whenever it is present; otherwise the hook holds the value and
 * moves it when a request is neither redundant nor cancelled. `extra` rides
 * on the request, for the `change` a query or column-state request carries.
 */
export function useModel<T, Extra extends object = Record<never, never>>(
  controlled: T | undefined,
  initial: T,
  onRequest: ((value: T, request: ChangeRequest<T> & Extra) => void) | undefined,
  equals: (a: T, b: T) => boolean = Object.is,
): [T, (next: T, reason: ChangeReason, source?: unknown, extra?: Extra) => boolean] {
  const [own, setOwn] = useState<T>(initial);
  const value = controlled === undefined ? own : controlled;
  const latest = useRef({ controlled, value, onRequest, equals });
  latest.current = { controlled, value, onRequest, equals };

  const request = useCallback((next: T, reason: ChangeReason, source?: unknown, extra?: Extra) => {
    const { controlled: owned, value: current, onRequest: ask, equals: same } = latest.current;
    const model = createControllable<T>({
      controlled: owned,
      initial: current,
      equals: same,
      onRequest: (change) =>
        ask?.(change.value, Object.assign(change, extra ?? {}) as ChangeRequest<T> & Extra),
    });
    const moved = model.request(next, reason, source);
    if (moved) setOwn(next);
    return moved;
  }, []);

  return [value, request];
}
