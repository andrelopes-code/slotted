import { useCallback, useState } from 'react';

interface PickerDraftOptions<V> {
  readonly equals: (a: V, b: V) => boolean;
  readonly isOpen: boolean;
  /** The value held, which the draft starts from and falls back to. */
  readonly value: V;
}

interface PickerDraft<V> {
  readonly draft: V;
  readonly setDraft: (next: V) => void;
}

/**
 * What the panel is composing. It starts from the value each time the panel
 * opens, and a value that moves from outside — typed in the field, set by the
 * application — takes its place.
 */
export function usePickerDraft<V>({
  equals,
  isOpen,
  value,
}: PickerDraftOptions<V>): PickerDraft<V> {
  const [held, setHeld] = useState({ base: value, draft: value, isOpen });
  const current = isOpen === held.isOpen && equals(held.base, value);
  /* Adjusted while rendering, so no frame shows the draft of another opening. */
  if (!current) setHeld({ base: value, draft: value, isOpen });

  const setDraft = useCallback((draft: V) => setHeld((previous) => ({ ...previous, draft })), []);

  return { draft: current ? held.draft : value, setDraft };
}
