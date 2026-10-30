import { createContext, useContext } from 'react';

import type { StepperDefaults, StepperDefaultsProviderProps } from './stepper.types';

const StepperDefaultsContext = createContext<StepperDefaults>({});

export function useStepperDefaults(): StepperDefaults {
  return useContext(StepperDefaultsContext);
}

/**
 * An application decides once which way its flows run, where the labels sit,
 * whether a header can be pressed, and whether the order is enforced. A
 * stepper that states any of those itself still wins: an explicit prop is
 * never overridden by context. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function StepperDefaultsProvider({ children, ...defaults }: StepperDefaultsProviderProps) {
  const inherited = useStepperDefaults();

  return (
    <StepperDefaultsContext.Provider
      value={{
        labelPlacement: defaults.labelPlacement ?? inherited.labelPlacement,
        linear: defaults.linear ?? inherited.linear,
        navigation: defaults.navigation ?? inherited.navigation,
        orientation: defaults.orientation ?? inherited.orientation,
      }}
    >
      {children}
    </StepperDefaultsContext.Provider>
  );
}
