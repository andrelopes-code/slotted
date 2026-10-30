import { createContext, useContext } from 'react';

import type {
  DashboardGridDefaults,
  DashboardGridDefaultsProviderProps,
} from './dashboard-grid.types';

export const DASHBOARD_GRID_FALLBACK: DashboardGridDefaults = {
  columns: 12,
  editBar: true,
  headingLevel: 'auto',
};

const DashboardGridDefaultsContext = createContext<DashboardGridDefaults>(DASHBOARD_GRID_FALLBACK);

/** What a dashboard renders as here, before it states anything of its own. */
export function useDashboardGridDefaults(): DashboardGridDefaults {
  return useContext(DashboardGridDefaultsContext);
}

/**
 * An application decides once how many columns its dashboards have, whether
 * the family draws the edit bar and the level of a widget's title. A grid that
 * states any of it itself still wins, and a nested provider overrides only what
 * it names. Its words come from the language in force (`SlottedProvider`).
 */
export function DashboardGridDefaultsProvider({
  children,
  ...rest
}: DashboardGridDefaultsProviderProps) {
  const inherited = useDashboardGridDefaults();
  return (
    <DashboardGridDefaultsContext.Provider
      value={{
        columns: rest.columns ?? inherited.columns,
        editBar: rest.editBar ?? inherited.editBar,
        headingLevel: rest.headingLevel ?? inherited.headingLevel,
      }}
    >
      {children}
    </DashboardGridDefaultsContext.Provider>
  );
}
