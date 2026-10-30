import { createContext, useContext } from 'react';

import type { ImageDefaults, ImageDefaultsProviderProps } from './image.types';

const FALLBACK: ImageDefaults = {
  bordered: false,
  decoding: 'async',
  fit: 'cover',
  layout: 'intrinsic',
  loading: 'lazy',
  placeholder: 'surface',
  position: 'center',
  radius: 'none',
};

const ImageDefaultsContext = createContext<ImageDefaults>(FALLBACK);

/** What an image renders as here, before it states anything of its own. */
export function useImageDefaults(): ImageDefaults {
  return useContext(ImageDefaultsContext);
}

/**
 * An application decides once how its pictures are cut, cornered, edged and
 * held before they arrive, rather than repeating the same props on every
 * thumbnail in every grid. An image that states any of them itself still
 * wins: an explicit value is never overridden by context.
 */
export function ImageDefaultsProvider({ children, ...defaults }: ImageDefaultsProviderProps) {
  const inherited = useImageDefaults();

  return (
    <ImageDefaultsContext.Provider
      value={{
        bordered: defaults.bordered ?? inherited.bordered,
        decoding: defaults.decoding ?? inherited.decoding,
        fit: defaults.fit ?? inherited.fit,
        layout: defaults.layout ?? inherited.layout,
        loading: defaults.loading ?? inherited.loading,
        placeholder: defaults.placeholder ?? inherited.placeholder,
        position: defaults.position ?? inherited.position,
        radius: defaults.radius ?? inherited.radius,
      }}
    >
      {children}
    </ImageDefaultsContext.Provider>
  );
}
