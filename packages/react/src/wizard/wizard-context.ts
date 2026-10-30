import { createContext, useContext } from 'react';

import type { WizardContextValue, WizardStepContextValue } from './wizard.types';

export const WizardContext = createContext<WizardContextValue | undefined>(undefined);
export const WizardStepContext = createContext<WizardStepContextValue | undefined>(undefined);

/**
 * What the wizard around this part says, and the moves a custom footer or a
 * review step makes. Outside a wizard it throws, because every part of the
 * family is meaningless without one.
 */
export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (context === undefined) throw new Error('Wizard parts must be rendered inside a Wizard.');
  return context;
}

/** What the step being rendered is told: its name and the answers to show. */
export function useWizardStep(): WizardStepContextValue | undefined {
  return useContext(WizardStepContext);
}
