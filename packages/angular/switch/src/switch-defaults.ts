import { inject, Injectable, InjectionToken } from '@angular/core';

/** The step the control sits at, matching the field around it. */
export type SwitchSize = 'sm' | 'md' | 'lg';

/**
 * What the thumb carries. `mark` draws a check when the switch is on and
 * nothing when it is off, which is what makes the state readable beyond colour
 * and beyond position. `none` withdraws it, and is only correct where
 * something else carries the state.
 */
export type SwitchIndicator = 'mark' | 'none';

/**
 * Which side of its label the pill sits on. `start` is the settings row every
 * product writes: the label takes the free width and the control sits at the
 * end of it.
 */
export type SwitchLabelPlacement = 'end' | 'start';

/**
 * How long a pending switch stays silent. A save that returns in two hundred
 * milliseconds should say nothing at all, and a live region that spoke on
 * every toggle would make a settings page unusable with a screen reader.
 * Primer measured the same number against the same problem.
 *
 * It is a constant of the family rather than an input: an application that
 * needs longer sets a `loading` message a reader can wait for.
 */
export const SWITCH_LOADING_ANNOUNCE_DELAY = 2000;

export interface SwitchDefaults {
  indicator: SwitchIndicator;
  labelPlacement: SwitchLabelPlacement;
  size: SwitchSize;
}

const FALLBACK: SwitchDefaults = {
  indicator: 'mark',
  labelPlacement: 'end',
  size: 'md',
};

export const SWITCH_DEFAULTS = new InjectionToken<SwitchDefaults>('slotted switch defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once what its switches look like, rather than
 * repeating the same inputs on every row of a settings page. A switch that
 * states any of them itself still wins. What a pending switch announces comes
 * from the language in force (`provideSlotted`).
 *
 * `size` is the one the field outranks: a `size="sm"` field holding an `md`
 * control is a field and a control disagreeing about one row, so a switch
 * inside a field takes the field's step and this token answers only outside
 * one.
 */
export function provideSwitchDefaults(defaults: Partial<SwitchDefaults>) {
  return {
    provide: SWITCH_DEFAULTS,
    useFactory: (): SwitchDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a switch renders as here, before it states anything of its own. */
export function injectSwitchDefaults(): SwitchDefaults {
  return inject(SWITCH_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` and
 * `checkbox` both record: a module-level counter produces colliding sequences
 * when two applications render in one server process, and the server and the
 * client sequences must match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlSwitchIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-switch-${this.count}`;
  }
}
