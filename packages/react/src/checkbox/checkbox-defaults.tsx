import { createContext, useContext } from 'react';

import type { CheckboxDefaults, CheckboxDefaultsProviderProps } from './checkbox.types';

const FALLBACK: CheckboxDefaults = {
  labelPlacement: 'end',
  size: 'md',
  variant: 'plain',
};

const CheckboxDefaultsContext = createContext<CheckboxDefaults>(FALLBACK);

/** What a checkbox renders as here, before it states anything of its own. */
export function useCheckboxDefaults(): CheckboxDefaults {
  return useContext(CheckboxDefaultsContext);
}

/**
 * An application decides once what its checkboxes look like, rather than
 * repeating the same props on every box in a form. A box that states either of
 * them itself still wins, and so does the group or field around it for `size`.
 */
export function CheckboxDefaultsProvider({ children, ...defaults }: CheckboxDefaultsProviderProps) {
  const inherited = useCheckboxDefaults();

  return (
    <CheckboxDefaultsContext.Provider
      value={{
        labelPlacement: defaults.labelPlacement ?? inherited.labelPlacement,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </CheckboxDefaultsContext.Provider>
  );
}
