import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the control and every segment inside it sit at. */
export type SegmentedControlSize = 'sm' | 'md' | 'lg';

/** How the segments flow. The thumb travels along the same axis. */
export type SegmentedControlOrientation = 'horizontal' | 'vertical';

/**
 * What the control does when it is narrower than its labels need. `icons`
 * keeps the marks and hides the words — hidden, never removed, so the
 * accessible name of every segment is the same at every width.
 */
export type SegmentedControlCondense = 'none' | 'icons';

/**
 * How the choice is drawn. `track` is a box with a thumb behind the chosen
 * segment; `underline` is the words alone, the chosen one in the text color
 * and underlined. The semantics are the same radio group in both.
 */
export type SegmentedControlVariant = 'track' | 'underline';

export interface SegmentedControlDefaults {
  condense: SegmentedControlCondense;
  fullWidth: boolean;
  orientation: SegmentedControlOrientation;
  size: SegmentedControlSize;
  variant: SegmentedControlVariant;
}

const FALLBACK: SegmentedControlDefaults = {
  condense: 'none',
  fullWidth: false,
  orientation: 'horizontal',
  size: 'md',
  variant: 'track',
};

export const SEGMENTED_CONTROL_DEFAULTS = new InjectionToken<SegmentedControlDefaults>(
  'slotted segmented control defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its segmented controls are drawn, rather
 * than repeating the same inputs on every one of them. A control that states
 * any of them itself still wins, and a field around it outranks this token for
 * `size`.
 */
export function provideSegmentedControlDefaults(defaults: Partial<SegmentedControlDefaults>) {
  return {
    provide: SEGMENTED_CONTROL_DEFAULTS,
    useFactory: (): SegmentedControlDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a segmented control renders as here, before it states anything of its own. */
export function injectSegmentedControlDefaults(): SegmentedControlDefaults {
  return inject(SEGMENTED_CONTROL_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field`
 * records: a module-level counter produces colliding sequences when two
 * applications render in one server process, and the server and the client
 * sequences must match for hydration.
 *
 * It answers for the control's generated `name` as well as for each segment's
 * identifier, because both have to be stable across the two renders.
 */
@Injectable({ providedIn: 'root' })
export class SlSegmentedControlIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-segmented-control-${this.count}`;
  }
}
