import { createContext, useContext } from 'react';

import type { FieldContextValue, FieldIds } from './field.types';

export const FieldContext = createContext<FieldContextValue | undefined>(undefined);

export function useField() {
  return useContext(FieldContext);
}

export function deriveIds(base: string): FieldIds {
  return {
    control: `${base}-control`,
    description: `${base}-description`,
    error: `${base}-error`,
    label: `${base}-label`,
  };
}

export function fieldClassName(className?: string) {
  return ['slotted-field', className].filter(Boolean).join(' ');
}
