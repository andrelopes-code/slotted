import { createContext, useContext } from 'react';

import type { TabsContextValue } from './tabs.types';

export const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export function useTabs() {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error('TabList, Tab and TabPanel must be rendered inside Tabs');
  }
  return context;
}

export function tabsClassName(base: string, className?: string) {
  return [base, className].filter(Boolean).join(' ');
}
