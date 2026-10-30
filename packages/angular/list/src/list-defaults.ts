import { inject, Injectable, InjectionToken } from '@angular/core';

/** How the rows are told apart. The vocabulary is `accordion`'s. */
export type ListVariant = 'plain' | 'ruled' | 'framed' | 'separated';

/** The room a row gets. Density is the application's choice; this is not. */
export type ListSize = 'sm' | 'md' | 'lg';

/**
 * What is painted in the marker column. It is a separate question from
 * `ordered`: an ordered set whose rows carry their own badges paints no number
 * and still reads in order.
 */
export type ListMarker = 'none' | 'bullet' | 'number';

export interface ListDefaults {
  inset: boolean;
  marker: ListMarker;
  size: ListSize;
  variant: ListVariant;
}

const FALLBACK: ListDefaults = { inset: false, marker: 'none', size: 'md', variant: 'plain' };

export const LIST_DEFAULTS = new InjectionToken<ListDefaults>('slotted list defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its lists are told apart and how much room a
 * row gets, rather than repeating four inputs on every list. A list that states
 * any of them itself still wins: an explicit input is never overridden by the
 * token.
 */
export function provideListDefaults(defaults: Partial<ListDefaults>) {
  return {
    provide: LIST_DEFAULTS,
    useFactory: (): ListDefaults => ({
      inset: defaults.inset ?? FALLBACK.inset,
      marker: defaults.marker ?? FALLBACK.marker,
      size: defaults.size ?? FALLBACK.size,
      variant: defaults.variant ?? FALLBACK.variant,
    }),
  };
}

/** What a list renders as here, before it states anything of its own. */
export function injectListDefaults(): ListDefaults {
  return inject(LIST_DEFAULTS);
}

/**
 * A group's heading names its own nested list, so the heading needs an id and
 * the id has to be the same string on the server and in the browser. A counter
 * held by the injector produces one; `Math.random` would not match for
 * hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlListIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-list-${this.count}`;
  }
}
