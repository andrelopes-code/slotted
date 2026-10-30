import { createContext, useContext } from 'react';

import type { ListboxContextValue } from './listbox.types';

export const ListboxContext = createContext<ListboxContextValue | undefined>(undefined);

/**
 * What the listbox around this part says. A part outside one has no collection
 * to belong to and no key to be chosen by, so this throws rather than rendering
 * something that looks right and answers nothing.
 */
export function useListbox(): ListboxContextValue {
  const context = useContext(ListboxContext);
  if (context === undefined) {
    throw new Error('This part must be rendered inside a Listbox.');
  }
  return context;
}
