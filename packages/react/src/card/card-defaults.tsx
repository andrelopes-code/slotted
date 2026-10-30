import { createContext, useContext } from 'react';

import type { CardDefaults, CardDefaultsProviderProps } from './card.types';

const FALLBACK: CardDefaults = { fill: 'outline', orientation: 'vertical', size: 'md' };

const CardDefaultsContext = createContext<CardDefaults>(FALLBACK);

/** What a card renders as here, before it states anything of its own. */
export function useCardDefaults(): CardDefaults {
  return useContext(CardDefaultsContext);
}

/**
 * An application decides once how its cards are bounded and how far they are
 * inset, rather than repeating two props on every card. A card that states
 * either itself still wins: an explicit value is never overridden by context.
 */
export function CardDefaultsProvider({ children, ...defaults }: CardDefaultsProviderProps) {
  const inherited = useCardDefaults();

  return (
    <CardDefaultsContext.Provider
      value={{
        fill: defaults.fill ?? inherited.fill,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </CardDefaultsContext.Provider>
  );
}
