import { createContext, useContext } from 'react';

import type { ActionBarDefaults, ActionBarDefaultsProviderProps } from './action-bar.types';

const FALLBACK: ActionBarDefaults = {
  align: 'end',
  size: 'md',
  sticky: false,
  variant: 'plain',
};

const ActionBarDefaultsContext = createContext<ActionBarDefaults>(FALLBACK);

/** What a bar renders as here, before it states anything of its own. */
export function useActionBarDefaults(): ActionBarDefaults {
  return useContext(ActionBarDefaultsContext);
}

/**
 * An application decides once how its action bars are drawn — a product whose
 * bars are all raised, compact and stuck to the bottom of the page says so in
 * one place rather than on every bar. A bar that states any of them itself
 * still wins.
 */
export function ActionBarDefaultsProvider({
  children,
  ...defaults
}: ActionBarDefaultsProviderProps) {
  const inherited = useActionBarDefaults();

  return (
    <ActionBarDefaultsContext.Provider
      value={{
        align: defaults.align ?? inherited.align,
        size: defaults.size ?? inherited.size,
        sticky: defaults.sticky ?? inherited.sticky,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </ActionBarDefaultsContext.Provider>
  );
}
