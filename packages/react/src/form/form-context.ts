import { createContext, useContext } from 'react';

import type { FormContextValue, FormDefaults } from './form.types';

export const FORM_DEFAULTS: FormDefaults = {
  align: 'end',
  errorFocus: 'summary',
  nativeValidation: false,
  summary: 'auto',
  summaryDescription: undefined,
  validate: 'submit',
};

export const FormDefaultsContext = createContext<FormDefaults>(FORM_DEFAULTS);

/** What a form behaves like here, before it states anything of its own. */
export function useFormDefaults(): FormDefaults {
  return useContext(FormDefaultsContext);
}

export const FormContext = createContext<FormContextValue | undefined>(undefined);

/**
 * What the form holds: the errors, their order, and whether a submit is in
 * flight. `undefined` outside a form, so a part can say so rather than throw
 * inside a page that is still being assembled.
 */
export function useFormState(): FormContextValue | undefined {
  return useContext(FormContext);
}
