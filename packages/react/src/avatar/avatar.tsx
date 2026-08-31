import '@slotted/styles/avatar/avatar.css';

import { useCallback, useMemo, useState } from 'react';

import { AvatarContext } from './avatar-context';
import type { AvatarContextValue, AvatarProps, AvatarRootProps } from './avatar.types';

export function Avatar({ className, render, size = 'md', ...nativeProps }: AvatarProps) {
  const [loaded, setLoadedState] = useState(false);
  const setLoaded = useCallback((next: boolean) => setLoadedState(next), []);
  const value = useMemo<AvatarContextValue>(() => ({ setLoaded }), [setLoaded]);

  const rootProps: AvatarRootProps = {
    ...nativeProps,
    className: ['slotted-avatar', className].filter(Boolean).join(' '),
    'data-loaded': loaded ? '' : undefined,
    'data-part': 'root',
    'data-size': size,
    'data-slotted-component': 'avatar',
  };

  return (
    <AvatarContext.Provider value={value}>
      {render === undefined ? <span {...rootProps} /> : render(rootProps)}
    </AvatarContext.Provider>
  );
}
