import { createContext, useContext } from 'react';

import type {
  CheckboxGroupDefaults,
  CheckboxGroupDefaultsProviderProps,
} from './checkbox-group.types';

const FALLBACK: CheckboxGroupDefaults = {
  labelPlacement: 'end',
  variant: 'plain',
  orientation: 'vertical',
  size: 'md',
};

const CheckboxGroupDefaultsContext = createContext<CheckboxGroupDefaults>(FALLBACK);

/** What a checkbox group renders as here, before it states anything of its own. */
export function useCheckboxGroupDefaults(): CheckboxGroupDefaults {
  return useContext(CheckboxGroupDefaultsContext);
}

/**
 * An application decides once how its sets of choices flow, rather than
 * repeating the same props on every group in a form. A group that states any of
 * them itself still wins, and a field around the group outranks this provider
 * for `size` — a `sm` field holding an `md` set is a field and a control
 * disagreeing about one row.
 */
export function CheckboxGroupDefaultsProvider({
  children,
  ...defaults
}: CheckboxGroupDefaultsProviderProps) {
  const inherited = useCheckboxGroupDefaults();

  return (
    <CheckboxGroupDefaultsContext.Provider
      value={{
        labelPlacement: defaults.labelPlacement ?? inherited.labelPlacement,
        variant: defaults.variant ?? inherited.variant,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </CheckboxGroupDefaultsContext.Provider>
  );
}
