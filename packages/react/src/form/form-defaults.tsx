import { FormDefaultsContext, useFormDefaults } from './form-context';
import type { FormDefaultsProviderProps } from './form.types';

/**
 * An application decides once how its forms behave: when they validate, where
 * focus goes after a failed submit, and how its action row is arranged. A form
 * that states any of them itself still wins. The summary's heading comes from
 * the language in force (`SlottedProvider`).
 */
export function FormDefaultsProvider({ children, ...defaults }: FormDefaultsProviderProps) {
  const inherited = useFormDefaults();

  return (
    <FormDefaultsContext.Provider
      value={{
        align: defaults.align ?? inherited.align,
        errorFocus: defaults.errorFocus ?? inherited.errorFocus,
        nativeValidation: defaults.nativeValidation ?? inherited.nativeValidation,
        summary: defaults.summary ?? inherited.summary,
        summaryDescription: defaults.summaryDescription ?? inherited.summaryDescription,
        validate: defaults.validate ?? inherited.validate,
      }}
    >
      {children}
    </FormDefaultsContext.Provider>
  );
}
