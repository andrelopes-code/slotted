import type { ChangeRequest } from '@slotted/core/state';
import { inject, Injectable, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';

/** The width and type step the panel sits at. */
export type PopoverSize = 'sm' | 'md' | 'lg';

/**
 * How wide the panel is. `anchor` makes it exactly as wide as the element it
 * hangs from, which is what a filter panel under a search field wants.
 */
export type PopoverWidth = 'auto' | 'anchor';

/** The edge of the anchor the layer prefers. The two logical values mirror. */
export type PopoverSide = 'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right';

/** Where the layer sits along the side it took. */
export type PopoverAlign = 'start' | 'center' | 'end';

/** When the layer exists. `lazy` is what a panel holding an expensive form wants. */
export type PopoverMount = 'active' | 'lazy' | 'eager';

/** `fixed` for a layer inside `overflow: hidden`, `absolute` for one inside a transform. */
export type PopoverStrategy = 'absolute' | 'fixed';

/** Why the panel opened or closed. */
export type PopoverOpenReason = Extract<
  ChangeRequest<boolean>['reason'],
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'dismiss' | 'programmatic'
>;

/** The request `openChangeRequest` emits before the panel moves, as React's `PopoverChangeRequest`. */
export type PopoverChangeRequest = ChangeRequest<boolean>;

/** Somewhere to put the focus: an element, or a selector read inside the panel. */
export type PopoverFocusTarget = Element | string;

/** What an application sets once for every popover under it. */
export interface PopoverDefaults {
  align: PopoverAlign;
  alignOffset: number;
  arrow: boolean;
  arrowPadding: number;
  autoFocus: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePress: boolean;
  collisionPadding: number;
  flip: boolean;
  hideWhenDetached: boolean;
  mount: PopoverMount;
  portal: boolean;
  shift: boolean;
  side: PopoverSide;
  sideOffset: number;
  size: PopoverSize;
  strategy: PopoverStrategy;
  width: PopoverWidth;
}

/**
 * `arrowPadding` is larger than the tooltip's because the panel's corner radius
 * is larger. `hideWhenDetached` is off: a task the reader is halfway through
 * must not blink because the row behind it scrolled.
 */
export const POPOVER_FALLBACK: PopoverDefaults = {
  align: 'center',
  alignOffset: 0,
  arrow: true,
  arrowPadding: 12,
  autoFocus: true,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  collisionPadding: 8,
  flip: true,
  hideWhenDetached: false,
  mount: 'active',
  portal: true,
  shift: true,
  side: 'bottom',
  sideOffset: 0,
  size: 'md',
  strategy: 'absolute',
  width: 'auto',
};

export const POPOVER_DEFAULTS = new InjectionToken<PopoverDefaults>('slotted popover defaults', {
  providedIn: 'root',
  factory: () => POPOVER_FALLBACK,
});

/**
 * An application decides once how its popovers behave and look. The close
 * control's accessible name comes from the language in force
 * (`provideSlotted`).
 *
 * What is stated here is written over the defaults already in force rather than
 * over the fallback, which is what React's provider does: a section that sets
 * `width` for itself keeps the application's `size`.
 */
export function providePopoverDefaults(defaults: Partial<PopoverDefaults>): Provider {
  return {
    provide: POPOVER_DEFAULTS,
    useFactory: (): PopoverDefaults => ({
      ...(inject(POPOVER_DEFAULTS, { optional: true, skipSelf: true }) ?? POPOVER_FALLBACK),
      ...defaults,
    }),
  };
}

/** What a popover renders as here, before it states anything of its own. */
export function injectPopoverDefaults(): PopoverDefaults {
  return inject(POPOVER_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the two sequences have to match for
 * hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlPopoverIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-popover-${this.count}`;
  }
}
