import { createContext, useContext } from 'react';

import type {
  CurrencyFieldDefaults,
  CurrencyFieldDefaultsProviderProps,
} from './currency-field.types';

const FALLBACK: CurrencyFieldDefaults = {
  align: 'end',
  clamp: 'blur',
  currency: undefined,
  currencyDisplay: 'symbol',
  entry: 'cents',
  formatOn: 'change',
  size: 'md',
  stepper: 'none',
  unit: 'major',
  variant: 'outline',
};

const CurrencyFieldDefaultsContext = createContext<CurrencyFieldDefaults>(FALLBACK);

/** What a currency field renders as here, before it states anything of its own. */
export function useCurrencyFieldDefaults(): CurrencyFieldDefaults {
  return useContext(CurrencyFieldDefaultsContext);
}

/**
 * An application decides once which currency it charges in and how its
 * amounts are typed, rather than repeating the same props on every amount in a
 * form. A control that states any of them itself still wins. The locale and the
 * two buttons' words come from the language in force (`SlottedProvider`).
 *
 * `currency` is the one worth setting first, and the only one a field cannot be
 * built without: a product has one currency in nine screens out of ten, and the
 * tenth states its own.
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a control
 * inside a field takes the field's step and this provider answers only outside
 * one.
 */
export function CurrencyFieldDefaultsProvider({
  children,
  ...defaults
}: CurrencyFieldDefaultsProviderProps) {
  const inherited = useCurrencyFieldDefaults();

  return (
    <CurrencyFieldDefaultsContext.Provider
      value={{
        align: defaults.align ?? inherited.align,
        clamp: defaults.clamp ?? inherited.clamp,
        currency: defaults.currency ?? inherited.currency,
        currencyDisplay: defaults.currencyDisplay ?? inherited.currencyDisplay,
        entry: defaults.entry ?? inherited.entry,
        formatOn: defaults.formatOn ?? inherited.formatOn,
        size: defaults.size ?? inherited.size,
        stepper: defaults.stepper ?? inherited.stepper,
        unit: defaults.unit ?? inherited.unit,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </CurrencyFieldDefaultsContext.Provider>
  );
}
