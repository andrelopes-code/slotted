import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { MediaViewerDefaults } from './media-viewer.types';

export interface MediaViewerDefaultsProviderProps extends MediaViewerDefaults {
  children?: ReactNode | undefined;
}

export interface ResolvedMediaViewerDefaults extends MediaViewerDefaults {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  loop: boolean;
}

const FALLBACK: ResolvedMediaViewerDefaults = {
  minZoom: 1,
  maxZoom: 4,
  zoomStep: 0.25,
  loop: false,
};

const MediaViewerDefaultsContext = createContext<ResolvedMediaViewerDefaults>(FALLBACK);

export function useMediaViewerDefaults(): ResolvedMediaViewerDefaults {
  return useContext(MediaViewerDefaultsContext);
}

/** Sets the viewer's limits, its loop and its words once, for every viewer under it. */
export function MediaViewerDefaultsProvider({
  children,
  ...defaults
}: MediaViewerDefaultsProviderProps) {
  const inherited = useMediaViewerDefaults();

  return (
    <MediaViewerDefaultsContext.Provider
      value={{
        minZoom: defaults.minZoom ?? inherited.minZoom,
        maxZoom: defaults.maxZoom ?? inherited.maxZoom,
        zoomStep: defaults.zoomStep ?? inherited.zoomStep,
        loop: defaults.loop ?? inherited.loop,
        messages: defaults.messages ?? inherited.messages,
      }}
    >
      {children}
    </MediaViewerDefaultsContext.Provider>
  );
}
