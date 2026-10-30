import { DEFAULT_LEVELS } from '@slotted/core/outline';
import { createContext, useContext, useMemo } from 'react';

import type {
  TableOfContentsDefaults,
  TableOfContentsDefaultsProviderProps,
} from './table-of-contents.types';

/** The contract's defaults. */
export const TABLE_OF_CONTENTS_FALLBACK: TableOfContentsDefaults = {
  history: 'push',
  landmark: true,
  layout: 'vertical',
  levels: DEFAULT_LEVELS,
  numbered: false,
  offset: 0,
  size: 'md',
  sticky: false,
};

const TableOfContentsDefaultsContext = createContext<TableOfContentsDefaults>(
  TABLE_OF_CONTENTS_FALLBACK,
);

/** What a list renders as here, before it states anything of its own. */
export function useTableOfContentsDefaults(): TableOfContentsDefaults {
  return useContext(TableOfContentsDefaultsContext);
}

/**
 * An application decides once how its lists read — the levels a document
 * outlines, whether the column pins, what a press does to the URL — rather
 * than repeating it on every page. A list that states any of them itself
 * still wins. Its words come from the language in force (`SlottedProvider`).
 */
export function TableOfContentsDefaultsProvider({
  children,
  ...defaults
}: TableOfContentsDefaultsProviderProps) {
  const inherited = useTableOfContentsDefaults();

  const value = useMemo<TableOfContentsDefaults>(
    () => ({
      history: defaults.history ?? inherited.history,
      landmark: defaults.landmark ?? inherited.landmark,
      layout: defaults.layout ?? inherited.layout,
      levels: defaults.levels ?? inherited.levels,
      numbered: defaults.numbered ?? inherited.numbered,
      offset: defaults.offset ?? inherited.offset,
      size: defaults.size ?? inherited.size,
      sticky: defaults.sticky ?? inherited.sticky,
    }),
    [
      defaults.history,
      defaults.landmark,
      defaults.layout,
      defaults.levels,
      defaults.numbered,
      defaults.offset,
      defaults.size,
      defaults.sticky,
      inherited,
    ],
  );

  return (
    <TableOfContentsDefaultsContext.Provider value={value}>
      {children}
    </TableOfContentsDefaultsContext.Provider>
  );
}
