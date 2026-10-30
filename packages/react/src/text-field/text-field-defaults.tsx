import { createContext, useContext } from 'react';

import type { TextFieldDefaults, TextFieldDefaultsProviderProps } from './text-field.types';

const FALLBACK: TextFieldDefaults = {
  mono: false,
  size: 'md',
  variant: 'outline',
};

const TextFieldDefaultsContext = createContext<TextFieldDefaults>(FALLBACK);

/** What a text field renders as here, before it states anything of its own. */
export function useTextFieldDefaults(): TextFieldDefaults {
  return useContext(TextFieldDefaultsContext);
}

/**
 * An application decides once what its text fields look like, rather than
 * repeating the same props on every control in a form. A control that states
 * any of them itself still wins. What the buttons and marks say comes from the
 * language in force (`SlottedProvider`).
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a control
 * inside a field takes the field's step and this provider answers only outside
 * one. Among the surveyed implementations only Angular Material ships
 * application-wide defaults, and only for Angular.
 */
export function TextFieldDefaultsProvider({
  children,
  ...defaults
}: TextFieldDefaultsProviderProps) {
  const inherited = useTextFieldDefaults();

  return (
    <TextFieldDefaultsContext.Provider
      value={{
        mono: defaults.mono ?? inherited.mono,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TextFieldDefaultsContext.Provider>
  );
}
