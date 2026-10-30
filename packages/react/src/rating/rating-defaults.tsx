import { RATING_INSIGHT_THRESHOLDS } from '@slotted/core/rating';
import { createContext, useContext } from 'react';

import type { RatingDefaults, RatingProviderProps } from './rating.types';

const FALLBACK: RatingDefaults = {
  size: 'md',
  tone: 'warning',
  max: 5,
  clearable: true,
  insightThresholds: RATING_INSIGHT_THRESHOLDS,
};

const RatingDefaultsContext = createContext<RatingDefaults>(FALLBACK);

/** What a rating renders as here, before it states anything of its own. */
export function useRatingDefaults(): RatingDefaults {
  return useContext(RatingDefaultsContext);
}

/**
 * An application decides once the step, the tone, the scale, whether a press
 * on the checked symbol clears it and the insight thresholds. An instance that
 * states any of them still wins; `insightThresholds` merges key by key. The
 * words and the locale come from the language in force (`SlottedProvider`).
 */
export function RatingProvider({ children, ...defaults }: RatingProviderProps) {
  const inherited = useRatingDefaults();

  return (
    <RatingDefaultsContext.Provider
      value={{
        size: defaults.size ?? inherited.size,
        tone: defaults.tone ?? inherited.tone,
        max: defaults.max ?? inherited.max,
        clearable: defaults.clearable ?? inherited.clearable,
        insightThresholds: { ...inherited.insightThresholds, ...defaults.insightThresholds },
      }}
    >
      {children}
    </RatingDefaultsContext.Provider>
  );
}
