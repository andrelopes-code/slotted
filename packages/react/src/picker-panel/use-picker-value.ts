import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

interface PickerValueOptions<V> {
  readonly defaultValue: V;
  readonly equals: (a: V, b: V) => boolean;
  readonly onValueChange?: ((value: V, request: ChangeRequest<V>) => void) | undefined;
  readonly rootRef: RefObject<HTMLElement | null>;
  readonly value: V | undefined;
}

interface PickerValue<V> {
  readonly held: V;
  readonly requestValue: (next: V, reason: ChangeReason, source: unknown) => void;
}

/**
 * The value of a picker, owned by the consumer or by the picker. A native
 * reset of the form around it returns it to `defaultValue`.
 */
export function usePickerValue<V>(options: PickerValueOptions<V>): PickerValue<V> {
  const { defaultValue, equals, onValueChange, rootRef, value } = options;
  /* Read once, and what a reset returns to. */
  const [initial] = useState(defaultValue);
  const [own, setOwn] = useState(defaultValue);
  const held = value === undefined ? own : value;

  const requestValue = useCallback(
    (next: V, reason: ChangeReason, source: unknown) => {
      const state = createControllable<V>({
        controlled: value,
        initial: held,
        equals,
        onRequest: (request) => onValueChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwn(next);
    },
    [equals, held, onValueChange, value],
  );

  useEffect(() => {
    const form = rootRef.current?.closest('form');
    if (form == null) return;

    const reset = (event: Event) => requestValue(initial, 'programmatic', event);
    form.addEventListener('reset', reset);

    return () => form.removeEventListener('reset', reset);
  }, [initial, requestValue, rootRef]);

  return { held, requestValue };
}
