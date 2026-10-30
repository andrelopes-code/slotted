import { createContext, useContext } from 'react';

import type { RadioGroupDefaults, RadioGroupDefaultsProviderProps } from './radio-group.types';

const FALLBACK: RadioGroupDefaults = {
  labelPlacement: 'end',
  variant: 'plain',
  orientation: 'vertical',
  size: 'md',
};

const RadioGroupDefaultsContext = createContext<RadioGroupDefaults>(FALLBACK);

/** What a radio group renders as here, before it states anything of its own. */
export function useRadioGroupDefaults(): RadioGroupDefaults {
  return useContext(RadioGroupDefaultsContext);
}

/**
 * An application decides once how its sets of choices flow, rather than
 * repeating the same props on every group in a form. A group that states any of
 * them itself still wins, and a field around it outranks this provider for
 * `size`.
 */
export function RadioGroupDefaultsProvider({
  children,
  ...defaults
}: RadioGroupDefaultsProviderProps) {
  const inherited = useRadioGroupDefaults();

  return (
    <RadioGroupDefaultsContext.Provider
      value={{
        labelPlacement: defaults.labelPlacement ?? inherited.labelPlacement,
        variant: defaults.variant ?? inherited.variant,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </RadioGroupDefaultsContext.Provider>
  );
}
