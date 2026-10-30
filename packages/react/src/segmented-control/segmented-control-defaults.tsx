import { createContext, useContext } from 'react';

import type {
  SegmentedControlDefaults,
  SegmentedControlDefaultsProviderProps,
} from './segmented-control.types';

const FALLBACK: SegmentedControlDefaults = {
  condense: 'none',
  fullWidth: false,
  orientation: 'horizontal',
  size: 'md',
  variant: 'track',
};

const SegmentedControlDefaultsContext = createContext<SegmentedControlDefaults>(FALLBACK);

/** What a segmented control renders as here, before it states anything of its own. */
export function useSegmentedControlDefaults(): SegmentedControlDefaults {
  return useContext(SegmentedControlDefaultsContext);
}

/**
 * An application decides once how its segmented controls are drawn, rather
 * than repeating the same props on every one of them. A control that states
 * any of them itself still wins, and a field around it outranks this provider
 * for `size`.
 */
export function SegmentedControlDefaultsProvider({
  children,
  ...defaults
}: SegmentedControlDefaultsProviderProps) {
  const inherited = useSegmentedControlDefaults();

  return (
    <SegmentedControlDefaultsContext.Provider
      value={{
        condense: defaults.condense ?? inherited.condense,
        fullWidth: defaults.fullWidth ?? inherited.fullWidth,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </SegmentedControlDefaultsContext.Provider>
  );
}
