import { inject, Injectable, InjectionToken } from '@angular/core';
import { DEFAULT_AUTOPLAY_DELAY } from '@slotted/core/carousel';
import type {
  CarouselAlign,
  CarouselOrientation,
  CarouselTransition,
} from '@slotted/core/carousel';

export type {
  CarouselAlign,
  CarouselOrientation,
  CarouselSlidesPerMove,
  CarouselTransition,
} from '@slotted/core/carousel';

/** Where previous and next stand when they are children of the root. */
export type CarouselArrows = 'inset' | 'outside';

/** The step of the control scale the round controls take. */
export type CarouselSize = 'sm' | 'md' | 'lg';

/** What the indicators draw: a dot per page, a segment per page, or the consumer's picture. */
export type CarouselIndicatorsVariant = 'dots' | 'line' | 'thumbnails';

/** Where the bar stands: under the viewport, or over its foot. */
export type CarouselControlsPlacement = 'below' | 'overlay';

export interface CarouselDefaults {
  orientation: CarouselOrientation;
  transition: CarouselTransition;
  align: CarouselAlign;
  arrows: CarouselArrows;
  size: CarouselSize;
  loop: boolean;
  draggable: boolean;
  /** The rotation's wait on a page, in milliseconds, when `autoplay` is `true`. */
  autoplayDelay: number;
}

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

export const CAROUSEL_DEFAULTS = new InjectionToken<CarouselDefaults>('slotted carousel defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its carousels look and move; a carousel that
 * states anything itself still wins. Its words come from the language in force
 * (`provideSlotted`).
 */
export function provideCarouselDefaults(defaults: Partial<CarouselDefaults>) {
  return {
    provide: CAROUSEL_DEFAULTS,
    useFactory: (): CarouselDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a carousel renders as here, before it states anything of its own. */
export function injectCarouselDefaults(): CarouselDefaults {
  return inject(CAROUSEL_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlCarouselIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-carousel-${this.count}`;
  }
}
