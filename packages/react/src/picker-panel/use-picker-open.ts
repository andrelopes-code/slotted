import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { useCallback, useState } from 'react';

export type PickerOpenReason = 'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select';

export interface PickerOpenOptions {
  readonly defaultOpen: boolean;
  readonly onOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  readonly open?: boolean | undefined;
}

export interface PickerOpen {
  readonly isOpen: boolean;
  readonly setOpen: (next: boolean, reason: PickerOpenReason, source: unknown) => void;
}

/** Whether the panel is showing, owned by the consumer or by the picker. */
export function usePickerOpen({ defaultOpen, onOpenChange, open }: PickerOpenOptions): PickerOpen {
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;

  const setOpen = useCallback(
    (next: boolean, reason: PickerOpenReason, source: unknown) => {
      const state = createControllable<boolean>({
        controlled: open,
        initial: isOpen,
        onRequest: (request) => onOpenChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwn(next);
    },
    [isOpen, onOpenChange, open],
  );

  return { isOpen, setOpen };
}
