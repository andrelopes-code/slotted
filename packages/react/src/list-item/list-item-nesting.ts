import { createContext, useContext, useEffect } from 'react';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/** Set by the box — `ListItemContent`, `ListItemLink`, `ListItemButton` — for the text parts inside it. */
export const ListItemBoxContext = createContext(false);
/** Set by `ListItemBody`, so a box written inside it can say so. */
export const ListItemBodyContext = createContext(false);

const warned = new Set<string>();

/**
 * In development, one `console.error` per part the first time it is written
 * where the stylesheet cannot lay it out. The check reads the parts' context,
 * not the DOM, so it holds under `render`; a production build drops it.
 */
export function useNestingCheck(part: string, misplaced: boolean, message: string): void {
  useEffect(() => {
    if (!isDevelopment || !misplaced || warned.has(part)) return;
    warned.add(part);
    console.error(message);
  }, [part, misplaced, message]);
}

const BOXES = 'ListItemContent, ListItemLink or ListItemButton';

/** A text part — body, label, description — outside the box. */
export function useInsideBox(part: string): void {
  const inside = useContext(ListItemBoxContext);
  useNestingCheck(part, !inside, `${part} must be inside ${BOXES}`);
}

/** A box written inside a body: the reverse of the intended nesting. */
export function useOutsideBody(part: string): void {
  const inBody = useContext(ListItemBodyContext);
  useNestingCheck(
    part,
    inBody,
    `${part} must not be inside ListItemBody; ListItemBody goes inside ${part}`,
  );
}
