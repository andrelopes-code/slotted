import { createContext, useContext } from 'react';

import type { VirtualListContextValue } from './virtual-list.types';

export const VirtualListContext = createContext<VirtualListContextValue | undefined>(undefined);

export function useVirtualList() {
  return useContext(VirtualListContext);
}
