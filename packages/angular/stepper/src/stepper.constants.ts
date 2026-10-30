import { InjectionToken, inject } from '@angular/core';
import type { StepOrientation } from '@slotted/core/steps';

export type StepperOrientation = StepOrientation;
export type StepperLabelPlacement = 'end' | 'bottom';
/** What a step header is: a control, a destination, or neither. */
export type StepperNavigation = 'button' | 'link' | 'none';
export type StepperStepReason = 'pointer' | 'keyboard' | 'programmatic';

export const STEPPER_DEFAULT_ORIENTATION: StepperOrientation = 'horizontal';
export const STEPPER_DEFAULT_LABEL_PLACEMENT: StepperLabelPlacement = 'end';
export const STEPPER_DEFAULT_NAVIGATION: StepperNavigation = 'button';

export interface StepperDefaults {
  labelPlacement?: StepperLabelPlacement;
  linear?: boolean;
  navigation?: StepperNavigation;
  orientation?: StepperOrientation;
}

export const STEPPER_DEFAULTS_TOKEN = new InjectionToken<StepperDefaults>(
  'slotted stepper defaults',
  { providedIn: 'root', factory: (): StepperDefaults => ({}) },
);

/**
 * An application decides once which way its flows run, where the labels sit,
 * whether a header can be pressed, and whether the order is enforced. A
 * stepper that states any of those itself still wins: an explicit input is
 * never overridden by the token. Its words come from the language in force
 * (`provideSlotted`).
 */
export function provideStepperDefaults(defaults: StepperDefaults) {
  return { provide: STEPPER_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectStepperDefaults(): StepperDefaults {
  return inject(STEPPER_DEFAULTS_TOKEN);
}
