import { createContext, useContext } from 'react';

import type { HoverCardDefaults, HoverCardDefaultsProviderProps } from './hover-card.types';

/**
 * 600 to open is the number `tooltip` holds and the one Base UI reached; 300
 * to close is Radix's and Base UI's. The card is not navigable until a
 * consumer says it holds controls. The panel's own defaults are the popover's,
 * and `PopoverDefaultsProvider` is where an application sets those.
 */
export const HOVER_CARD_FALLBACK: HoverCardDefaults = {
  closeDelay: 300,
  disabled: false,
  navigable: false,
  openDelay: 600,
};

const HoverCardDefaultsContext = createContext<HoverCardDefaults>(HOVER_CARD_FALLBACK);

export function useHoverCardDefaults(): HoverCardDefaults {
  return useContext(HoverCardDefaultsContext);
}

/** The decisions an application takes once, in its bootstrap. */
export function HoverCardDefaultsProvider({
  children,
  ...overrides
}: HoverCardDefaultsProviderProps) {
  const inherited = useHoverCardDefaults();

  const value: HoverCardDefaults = {
    closeDelay: overrides.closeDelay ?? inherited.closeDelay,
    disabled: overrides.disabled ?? inherited.disabled,
    navigable: overrides.navigable ?? inherited.navigable,
    openDelay: overrides.openDelay ?? inherited.openDelay,
  };

  return (
    <HoverCardDefaultsContext.Provider value={value}>{children}</HoverCardDefaultsContext.Provider>
  );
}
