import { createContext, useContext } from 'react';

import type { SplitterContextValue } from './splitter.types';

export const SplitterContext = createContext<SplitterContextValue | undefined>(undefined);

export function useSplitter() {
  return useContext(SplitterContext);
}

export function clampPosition(value: number, min: number, max: number) {
  return Number(Math.min(Math.max(value, min), max).toFixed(2));
}
