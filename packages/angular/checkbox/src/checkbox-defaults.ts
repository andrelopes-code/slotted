import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the control sits at, matching the group or field around it. */
export type CheckboxSize = 'sm' | 'md' | 'lg';

/**
 * Whether the choice is a box beside a line of text or a framed surface whose
 * whole area is the target. `tile` is the name Carbon and Cloudscape give the
 * framed choice; Mantine and Chakra call it a card, which is a family here.
 */
export type CheckboxVariant = 'plain' | 'tile';

/**
 * Which side of its own label the box is on. It is never inherited from a
 * `field`: that family's `labelPlacement` answers where a field's label sits
 * relative to its control, and a checkbox's label is its own.
 */
export type CheckboxLabelPlacement = 'end' | 'start';

export interface CheckboxDefaults {
  labelPlacement: CheckboxLabelPlacement;
  variant: CheckboxVariant;
  size: CheckboxSize;
}

const FALLBACK: CheckboxDefaults = { labelPlacement: 'end', size: 'md', variant: 'plain' };

export const CHECKBOX_DEFAULTS = new InjectionToken<CheckboxDefaults>('slotted checkbox defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once what its checkboxes look like, rather than
 * repeating the same inputs on every box in a form. A box that states either of
 * them itself still wins, and so does the group or field around it.
 */
export function provideCheckboxDefaults(defaults: Partial<CheckboxDefaults>) {
  return {
    provide: CHECKBOX_DEFAULTS,
    useFactory: (): CheckboxDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a checkbox renders as here, before it states anything of its own. */
export function injectCheckboxDefaults(): CheckboxDefaults {
  return inject(CHECKBOX_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlCheckboxIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-checkbox-${this.count}`;
  }
}
