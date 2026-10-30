import { createContext, useContext } from 'react';

import type { TreeContextValue } from './tree.types';

export const TreeContext = createContext<TreeContextValue | undefined>(undefined);

/**
 * What the tree around this part says. A part outside one has no hierarchy to
 * belong to and no key to be chosen by, so this throws rather than rendering
 * something that looks right and answers nothing.
 */
export function useTree(): TreeContextValue {
  const context = useContext(TreeContext);
  if (context === undefined) {
    throw new Error('This part must be rendered inside a Tree.');
  }
  return context;
}

/**
 * How deep the node being rendered sits, counted by the nodes above it rather
 * than stated by the consumer.
 *
 * A depth a consumer writes is a depth a consumer can get wrong, and it would
 * have to be rewritten every time a branch moves. Each node raises it by one
 * for the nodes inside it, so the number is a fact about the markup.
 */
export const TreeDepthContext = createContext(0);

export function useTreeDepth(): number {
  return useContext(TreeDepthContext);
}
