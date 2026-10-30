import { inject, InjectionToken } from '@angular/core';

export type CardOrientation = 'vertical' | 'horizontal';

/** How the surface is bounded: by an edge, by elevation, or by a fill. */
export type CardFill = 'outline' | 'elevated' | 'subtle';

/** The card's own inset. Density is the application's choice; this is not. */
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardDefaults {
  fill: CardFill;
  orientation: CardOrientation;
  size: CardSize;
}

export const CARD_DEFAULTS = new InjectionToken<CardDefaults>('slotted card defaults', {
  providedIn: 'root',
  factory: () => ({ fill: 'outline', orientation: 'vertical', size: 'md' }),
});

/**
 * An application decides once how its cards are bounded and how far they are
 * inset, rather than repeating two inputs on every card. A card that states
 * either itself still wins: an explicit input is never overridden by the token.
 */
export function provideCardDefaults(defaults: Partial<CardDefaults>) {
  return {
    provide: CARD_DEFAULTS,
    useFactory: (): CardDefaults => ({
      fill: defaults.fill ?? 'outline',
      orientation: defaults.orientation ?? 'vertical',
      size: defaults.size ?? 'md',
    }),
  };
}

/** What a card renders as here, before it states anything of its own. */
export function injectCardDefaults(): CardDefaults {
  return inject(CARD_DEFAULTS);
}
