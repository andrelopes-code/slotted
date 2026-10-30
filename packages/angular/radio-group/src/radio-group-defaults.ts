import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the group and every item inside it sit at. */
export type RadioGroupSize = 'sm' | 'md' | 'lg';

/** How the choices flow. `horizontal` wraps; a set of options is not a scroll region. */
export type RadioGroupOrientation = 'vertical' | 'horizontal';

/**
 * Whether the choice is a box beside a line of text or a framed surface whose
 * whole area is the target. `tile` is the name Carbon and Cloudscape give the
 * framed choice; Mantine and Chakra call it a card, which is a family here.
 */
export type RadioGroupVariant = 'plain' | 'tile';

/**
 * Which side of its own label the circle is on. It is never inherited from a
 * `field`: that family's `labelPlacement` answers where a field's label sits
 * relative to its control, and a radio's label is its own.
 */
export type RadioGroupLabelPlacement = 'end' | 'start';

export interface RadioGroupDefaults {
  labelPlacement: RadioGroupLabelPlacement;
  variant: RadioGroupVariant;
  orientation: RadioGroupOrientation;
  size: RadioGroupSize;
}

const FALLBACK: RadioGroupDefaults = {
  labelPlacement: 'end',
  orientation: 'vertical',
  size: 'md',
  variant: 'plain',
};

export const RADIO_GROUP_DEFAULTS = new InjectionToken<RadioGroupDefaults>(
  'slotted radio group defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its sets of choices flow, rather than
 * repeating the same inputs on every group in a form. A group that states any
 * of them itself still wins, and a field around it outranks this token for
 * `size`.
 */
export function provideRadioGroupDefaults(defaults: Partial<RadioGroupDefaults>) {
  return {
    provide: RADIO_GROUP_DEFAULTS,
    useFactory: (): RadioGroupDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a radio group renders as here, before it states anything of its own. */
export function injectRadioGroupDefaults(): RadioGroupDefaults {
  return inject(RADIO_GROUP_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 *
 * It answers for the group's generated `name` as well as for each item's
 * identifier, because both have to be stable across the two renders.
 */
@Injectable({ providedIn: 'root' })
export class SlRadioGroupIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-radio-group-${this.count}`;
  }
}
