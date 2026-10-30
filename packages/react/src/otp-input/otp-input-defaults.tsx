import { createContext, useContext } from 'react';

import type { OtpInputDefaults, OtpInputDefaultsProviderProps } from './otp-input.types';

const FALLBACK: OtpInputDefaults = {
  attached: false,
  length: 6,
  placeholder: '',
  size: 'md',
  type: 'numeric',
  variant: 'outline',
};

const OtpInputDefaultsContext = createContext<OtpInputDefaults>(FALLBACK);

/** What a code field renders as here, before it states anything of its own. */
export function useOtpInputDefaults(): OtpInputDefaults {
  return useContext(OtpInputDefaultsContext);
}

/**
 * An application decides once what its code fields look like — and how long
 * its codes are — rather than repeating the same props on every verification
 * screen. A control that states any of them itself still wins.
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a control
 * inside a field takes the field's step and this provider answers only outside
 * one.
 */
export function OtpInputDefaultsProvider({ children, ...defaults }: OtpInputDefaultsProviderProps) {
  const inherited = useOtpInputDefaults();

  return (
    <OtpInputDefaultsContext.Provider
      value={{
        attached: defaults.attached ?? inherited.attached,
        length: defaults.length ?? inherited.length,
        placeholder: defaults.placeholder ?? inherited.placeholder,
        size: defaults.size ?? inherited.size,
        type: defaults.type ?? inherited.type,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </OtpInputDefaultsContext.Provider>
  );
}
