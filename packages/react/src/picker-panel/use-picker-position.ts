import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { useState } from 'react';

/** The two ends of a run. */
export type PickerPosition = 'start' | 'end';

interface PickerPositionOptions {
  readonly defaultPosition?: PickerPosition | undefined;
  readonly onPositionChange?:
    ((position: PickerPosition, request: ChangeRequest<PickerPosition>) => void) | undefined;
  readonly position?: PickerPosition | undefined;
}

/** The end being edited, owned by the consumer or by the picker. */
export function usePickerPosition({
  defaultPosition = 'start',
  onPositionChange,
  position,
}: PickerPositionOptions) {
  const [own, setOwn] = useState<PickerPosition>(defaultPosition);
  const current = position ?? own;

  function request(next: PickerPosition, reason: ChangeReason, source: unknown) {
    const state = createControllable<PickerPosition>({
      controlled: position,
      initial: current,
      onRequest: (asked) => onPositionChange?.(asked.value, asked),
    });
    if (state.request(next, reason, source)) setOwn(next);
  }

  return [current, request] as const;
}
