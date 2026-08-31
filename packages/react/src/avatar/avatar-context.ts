import { createContext, useContext } from 'react';

import type { AvatarContextValue } from './avatar.types';

export const AvatarContext = createContext<AvatarContextValue | undefined>(undefined);

export function useAvatar() {
  return useContext(AvatarContext);
}
