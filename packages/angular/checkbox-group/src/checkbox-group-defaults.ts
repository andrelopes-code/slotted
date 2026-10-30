import { inject, InjectionToken } from '@angular/core';

/** The type step the group and every box inside it sit at. */
export type CheckboxGroupSize = 'sm' | 'md' | 'lg';

/** How the choices flow. `horizontal` wraps; a set of options is not a scroll region. */
export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

/**
 * Whether the choice is a box beside a line of text or a framed surface whose
 * whole area is the target. `tile` is the name Carbon and Cloudscape give the
 * framed choice; Mantine and Chakra call it a card, which is a family here.
 */
export type CheckboxGroupVariant = 'plain' | 'tile';

/** Which side of its own label a box is on. */
export type CheckboxGroupLabelPlacement = 'end' | 'start';

export interface CheckboxGroupDefaults {
  labelPlacement: CheckboxGroupLabelPlacement;
  variant: CheckboxGroupVariant;
  orientation: CheckboxGroupOrientation;
  size: CheckboxGroupSize;
}

const FALLBACK: CheckboxGroupDefaults = {
  labelPlacement: 'end',
  orientation: 'vertical',
  size: 'md',
  variant: 'plain',
};

export const CHECKBOX_GROUP_DEFAULTS = new InjectionToken<CheckboxGroupDefaults>(
  'slotted checkbox group defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its sets of choices flow, rather than
 * repeating the same inputs on every group in a form. A group that states any
 * of them itself still wins, and a field around the group outranks this token
 * for `size`.
 */
export function provideCheckboxGroupDefaults(defaults: Partial<CheckboxGroupDefaults>) {
  return {
    provide: CHECKBOX_GROUP_DEFAULTS,
    useFactory: (): CheckboxGroupDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a checkbox group renders as here, before it states anything of its own. */
export function injectCheckboxGroupDefaults(): CheckboxGroupDefaults {
  return inject(CHECKBOX_GROUP_DEFAULTS);
}
