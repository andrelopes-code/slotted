import { createContext, useContext } from 'react';

import type { WizardDefaults, WizardDefaultsProviderProps } from './wizard.types';

/**
 * `linear` is on: the wave's scope says direct navigation depends on the
 * steps already completed. `delay` and `minDuration` are the loading-states
 * pair, so a restore that answers in eighty milliseconds draws nothing.
 */
export const WIZARD_FALLBACK: WizardDefaults = {
  delay: 200,
  level: 2,
  linear: true,
  minDuration: 400,
  progress: 'start',
  scroll: 'ancestor',
};

const WizardDefaultsContext = createContext<WizardDefaults>(WIZARD_FALLBACK);

/** What a wizard behaves like here, before it states anything of its own. */
export function useWizardDefaults(): WizardDefaults {
  return useContext(WizardDefaultsContext);
}

/**
 * An application decides once how its wizards lay out. A wizard that states
 * any of it itself still wins. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function WizardDefaultsProvider({ children, ...defaults }: WizardDefaultsProviderProps) {
  const inherited = useWizardDefaults();
  const value: WizardDefaults = { ...inherited, ...stated(defaults) };
  return <WizardDefaultsContext.Provider value={value}>{children}</WizardDefaultsContext.Provider>;
}

/** A provider that states nothing must not overwrite what it inherited with `undefined`. */
function stated<T extends object>(values: T): Partial<T> {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}
