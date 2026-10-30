import { inject, InjectionToken } from '@angular/core';

/** Which of the five semantic colours the badge speaks in. */
export type BadgeTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** How that colour is painted. `soft` is the tinted chip a badge usually is. */
export type BadgeVariant = 'solid' | 'soft' | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

/** `dot` is the same badge, tone and hidden text, drawn without a value. */
export type BadgeShape = 'pill' | 'square' | 'dot';

/** Whether a changing badge is announced, and how urgently. */
export type BadgeLive = 'off' | 'polite' | 'assertive';

export type BadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

/** The shape of the host, which decides how far in from the corner to sit. */
export type BadgeOverlap = 'rectangle' | 'circle';

/**
 * The page's own correction of the corner, in CSS pixels.
 *
 * `x` runs along the inline axis, from the leading edge towards the trailing
 * one, so it mirrors with the document: a badge moved two pixels back along it
 * keeps the same relation to its host in a right-to-left page. `y` runs down
 * the block axis. Both default to nought.
 */
export interface BadgeOffset {
  x?: number | undefined;
  y?: number | undefined;
}

export interface BadgeDefaults {
  /** BCP 47. Absent, the runtime's own default writes the digits. */
  locale: string | undefined;
  max: number | false;
  shape: BadgeShape;
  size: BadgeSize;
  tone: BadgeTone;
  variant: BadgeVariant;
}

const FALLBACK: BadgeDefaults = {
  locale: undefined,
  max: 99,
  shape: 'pill',
  size: 'md',
  tone: 'secondary',
  variant: 'soft',
};

export const BADGE_DEFAULTS = new InjectionToken<BadgeDefaults>('slotted badge defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its badges are painted, how large they are
 * and — the one that matters most — which locale writes their digits, rather
 * than repeating five inputs on every badge. A badge that states any of them
 * itself still wins: an explicit input is never overridden by the token.
 */
export function provideBadgeDefaults(defaults: Partial<BadgeDefaults>) {
  return {
    provide: BADGE_DEFAULTS,
    useFactory: (): BadgeDefaults => ({
      locale: defaults.locale ?? FALLBACK.locale,
      max: defaults.max ?? FALLBACK.max,
      shape: defaults.shape ?? FALLBACK.shape,
      size: defaults.size ?? FALLBACK.size,
      tone: defaults.tone ?? FALLBACK.tone,
      variant: defaults.variant ?? FALLBACK.variant,
    }),
  };
}

/** What a badge renders as here, before it states anything of its own. */
export function injectBadgeDefaults(): BadgeDefaults {
  return inject(BADGE_DEFAULTS);
}
