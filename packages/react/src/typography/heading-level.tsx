import { createContext, useContext } from 'react';

import type { HeadingLevelProps, HeadingLevelValue } from './typography.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

const HeadingLevelContext = createContext<HeadingLevelValue>(1);

/** The rank a heading takes here when it states none of its own. */
export function useHeadingLevel(): HeadingLevelValue {
  return useContext(HeadingLevelContext);
}

/**
 * One section deeper. A heading inside takes the next rank, which is how the
 * outline stays correct in a tree the consumer assembles from components that
 * cannot see each other: the HTML Standard requires each heading to be less
 * than, equal to, or one greater than the heading before it, and stepping by
 * exactly one is the only way to guarantee that without reading the document.
 */
export function HeadingLevel({ children }: HeadingLevelProps) {
  const level = useHeadingLevel();
  const next = Math.min(level + 1, 6) as HeadingLevelValue;

  if (isDevelopment && level === 6) {
    console.warn(
      'HeadingLevel nested past level 6. The platform has six ranks, so the heading inside stays at 6 and the outline stops recording depth here.',
    );
  }

  return <HeadingLevelContext.Provider value={next}>{children}</HeadingLevelContext.Provider>;
}
