import { createContext, useContext } from 'react';

import type { NumberFieldDefaults, NumberFieldDefaultsProviderProps } from './number-field.types';

const FALLBACK: NumberFieldDefaults = {
  clamp: 'blur',
  formatOn: 'change',
  size: 'md',
  stepper: 'stacked',
  variant: 'outline',
};

const NumberFieldDefaultsContext = createContext<NumberFieldDefaults>(FALLBACK);

/** What a number field renders as here, before it states anything of its own. */
export function useNumberFieldDefaults(): NumberFieldDefaults {
  return useContext(NumberFieldDefaultsContext);
}

/**
 * An application decides once what its number fields look like, rather than
 * repeating the same props on every amount in a form. A control that states any
 * of them itself still wins.
 *
 * The locale and the two buttons' words come from the language in force
 * (`SlottedProvider`): one locale for the whole application decides the decimal
 * separator, the grouping and the numbering system, and a form where one field
 * reads `1.234` as a thousand and another as one point two three four is a form
 * that loses money.
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a control
 * inside a field takes the field's step and this provider answers only outside
 * one.
 */
export function NumberFieldDefaultsProvider({
  children,
  ...defaults
}: NumberFieldDefaultsProviderProps) {
  const inherited = useNumberFieldDefaults();

  return (
    <NumberFieldDefaultsContext.Provider
      value={{
        clamp: defaults.clamp ?? inherited.clamp,
        formatOn: defaults.formatOn ?? inherited.formatOn,
        size: defaults.size ?? inherited.size,
        stepper: defaults.stepper ?? inherited.stepper,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </NumberFieldDefaultsContext.Provider>
  );
}
