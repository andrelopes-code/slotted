import { createContext, useContext, useMemo } from 'react';

import type { FieldDefaults, FieldDefaultsProviderProps } from './field.types';

const FALLBACK: FieldDefaults = {
  disabled: undefined,
  labelPlacement: 'top',
  necessity: 'mark',
  readOnly: undefined,
  size: 'md',
};

const FieldDefaultsContext = createContext<FieldDefaults>(FALLBACK);

/** What a field renders as here, before it states anything of its own. */
export function useFieldDefaults(): FieldDefaults {
  return useContext(FieldDefaultsContext);
}

/**
 * An application decides once what its fields look like, rather than repeating
 * the same props on every field in a form. Their words come from the language
 * in force (`SlottedProvider`).
 * `FieldGroup` renders one of these for the fields inside it, so a compact
 * section — or a disabled one — is one attribute rather than one per field.
 *
 * Among the surveyed implementations only Angular Material ships
 * application-wide defaults, and only for Angular.
 *
 * `disabled` and `readOnly` are here and `invalid` and `required` are not. The
 * first two describe a context a whole section can be in; the second two are
 * facts about one value, and a provider that set them would mark every field in
 * a section as required for a reason no field could name.
 */
export function FieldDefaultsProvider({
  children,
  disabled,
  labelPlacement,
  necessity,
  readOnly,
  size,
}: FieldDefaultsProviderProps) {
  const inherited = useFieldDefaults();
  const value = useMemo<FieldDefaults>(
    () => ({
      disabled: disabled ?? inherited.disabled,
      labelPlacement: labelPlacement ?? inherited.labelPlacement,
      necessity: necessity ?? inherited.necessity,
      readOnly: readOnly ?? inherited.readOnly,
      size: size ?? inherited.size,
    }),
    [disabled, inherited, labelPlacement, necessity, readOnly, size],
  );

  return <FieldDefaultsContext.Provider value={value}>{children}</FieldDefaultsContext.Provider>;
}
