import { createContext, useContext } from 'react';

import type { ContextMenuDefaults, ContextMenuDefaultsProviderProps } from './context-menu.types';

/**
 * A long press opens on touch and pen, after the delay `tooltip` already holds
 * as `touchDelay`; nothing is disabled. The surface's own defaults are the
 * menu's, and `MenuDefaultsProvider` is where an application sets those.
 */
export const CONTEXT_MENU_FALLBACK: ContextMenuDefaults = {
  disabled: false,
  longPress: true,
  longPressDelay: 500,
};

const ContextMenuDefaultsContext = createContext<ContextMenuDefaults>(CONTEXT_MENU_FALLBACK);

export function useContextMenuDefaults(): ContextMenuDefaults {
  return useContext(ContextMenuDefaultsContext);
}

/** The decisions an application takes once, in its bootstrap. */
export function ContextMenuDefaultsProvider({
  children,
  ...overrides
}: ContextMenuDefaultsProviderProps) {
  const inherited = useContextMenuDefaults();

  const value: ContextMenuDefaults = {
    disabled: overrides.disabled ?? inherited.disabled,
    longPress: overrides.longPress ?? inherited.longPress,
    longPressDelay: overrides.longPressDelay ?? inherited.longPressDelay,
  };

  return (
    <ContextMenuDefaultsContext.Provider value={value}>
      {children}
    </ContextMenuDefaultsContext.Provider>
  );
}
