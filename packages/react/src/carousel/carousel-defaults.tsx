import { DEFAULT_AUTOPLAY_DELAY } from '@slotted/core/carousel';
import { createContext, useContext } from 'react';

import type { CarouselDefaults, CarouselDefaultsProviderProps } from './carousel.types';

const FALLBACK: CarouselDefaults = {
  align: 'start',
  arrows: 'inset',
  autoplayDelay: DEFAULT_AUTOPLAY_DELAY,
  draggable: true,
  loop: false,
  orientation: 'horizontal',
  size: 'md',
  transition: 'slide',
};

const CarouselDefaultsContext = createContext<CarouselDefaults>(FALLBACK);

/** What a carousel renders as here, before it states anything of its own. */
export function useCarouselDefaults(): CarouselDefaults {
  return useContext(CarouselDefaultsContext);
}

/**
 * An application decides once how its carousels look and move. A carousel
 * that states any of it itself still wins. Its words come from the language in
 * force (`SlottedProvider`).
 */
export function CarouselDefaultsProvider({ children, ...defaults }: CarouselDefaultsProviderProps) {
  const inherited = useCarouselDefaults();

  return (
    <CarouselDefaultsContext.Provider
      value={{
        align: defaults.align ?? inherited.align,
        arrows: defaults.arrows ?? inherited.arrows,
        autoplayDelay: defaults.autoplayDelay ?? inherited.autoplayDelay,
        draggable: defaults.draggable ?? inherited.draggable,
        loop: defaults.loop ?? inherited.loop,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
        transition: defaults.transition ?? inherited.transition,
      }}
    >
      {children}
    </CarouselDefaultsContext.Provider>
  );
}
