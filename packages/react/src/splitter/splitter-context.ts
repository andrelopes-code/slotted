import { clamp, roundTo } from '@slotted/core/measure';
import { createContext, useContext } from 'react';

import type { SplitterContextValue } from './splitter.types';

export const SplitterContext = createContext<SplitterContextValue | undefined>(undefined);

export function useSplitter() {
  return useContext(SplitterContext);
}

export function clampPosition(value: number, min: number, max: number) {
  return roundTo(clamp(value, min, max), 2);
}
