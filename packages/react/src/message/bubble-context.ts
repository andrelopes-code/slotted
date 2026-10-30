import { createContext, useContext } from 'react';

import type { BubbleContextValue } from './message.types';

export const BubbleContext = createContext<BubbleContextValue | null>(null);

/** Whether a receipt stands inside a bubble's meta, where it is a mark and not a word. */
export const BubbleMetaContext = createContext(false);

export function useBubble(): BubbleContextValue {
  const context = useContext(BubbleContext);
  if (context === null) throw new Error('A Bubble part is rendered outside a Bubble.');
  return context;
}
