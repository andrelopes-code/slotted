import { createContext, useContext } from 'react';

import type {
  ImportExportCenterDefaults,
  ImportExportCenterDefaultsProviderProps,
} from './import-export-center.types';

const FALLBACK: ImportExportCenterDefaults = {
  growing: 'none',
  level: '2',
  size: 'md',
  timeFormat: 'relative',
};

const ImportExportCenterDefaultsContext = createContext<ImportExportCenterDefaults>(FALLBACK);

/** What a job center renders as here, before it states anything of its own. */
export function useImportExportCenterDefaults(): ImportExportCenterDefaults {
  return useContext(ImportExportCenterDefaultsContext);
}

/**
 * An application decides once how its job center reads — the size, the rank,
 * how history loads, how time is written and in which zone — rather than on
 * every screen. A center that states any of them still wins. Its words and the
 * locale come from the language in force (`SlottedProvider`).
 */
export function ImportExportCenterDefaultsProvider({
  children,
  ...defaults
}: ImportExportCenterDefaultsProviderProps) {
  const inherited = useImportExportCenterDefaults();

  return (
    <ImportExportCenterDefaultsContext.Provider
      value={{
        growing: defaults.growing ?? inherited.growing,
        level: defaults.level ?? inherited.level,
        size: defaults.size ?? inherited.size,
        timeFormat: defaults.timeFormat ?? inherited.timeFormat,
        timeZone: defaults.timeZone ?? inherited.timeZone,
      }}
    >
      {children}
    </ImportExportCenterDefaultsContext.Provider>
  );
}
