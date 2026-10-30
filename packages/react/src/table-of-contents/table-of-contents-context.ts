import { createContext, useContext } from 'react';
import type { MouseEvent } from 'react';

import type {
  TableOfContentsContextValue,
  TableOfContentsItemContextValue,
} from './table-of-contents.types';

export const TableOfContentsContext = createContext<TableOfContentsContextValue | undefined>(
  undefined,
);

/** What the list around this part says. Throws outside one. */
export function useTableOfContents(): TableOfContentsContextValue {
  const context = useContext(TableOfContentsContext);
  if (context === undefined) {
    throw new Error('Every table-of-contents part must be rendered inside TableOfContents.');
  }
  return context;
}

export const TableOfContentsItemContext = createContext<
  TableOfContentsItemContextValue | undefined
>(undefined);

/** What the item around this part says. Throws outside one. */
export function useTableOfContentsItem(): TableOfContentsItemContextValue {
  const context = useContext(TableOfContentsItemContext);
  if (context === undefined) {
    throw new Error('Every link must be rendered inside a TableOfContentsItem.');
  }
  return context;
}

/**
 * A click the platform should keep: a modifier for a new tab or window, or a
 * button other than the main one. The family scrolls nothing and writes
 * nothing for these; the anchor does what an anchor does.
 */
export function platformClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
