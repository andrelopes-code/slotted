import { createContext, useContext } from 'react';

import type { SkeletonAnimation } from './skeleton.types';

/**
 * What a region tells the placeholders inside it. `null` outside one, so a box
 * can tell "no region said anything" from "a region said false" — the first
 * falls through to the provider and then to `true`, and the second is an
 * answer.
 */
export interface SkeletonRegionValue {
  animation: SkeletonAnimation | undefined;
  loading: boolean;
}

const SkeletonRegionContext = createContext<SkeletonRegionValue | null>(null);

export const SkeletonRegionProvider = SkeletonRegionContext.Provider;

export function useSkeletonRegion(): SkeletonRegionValue | null {
  return useContext(SkeletonRegionContext);
}
