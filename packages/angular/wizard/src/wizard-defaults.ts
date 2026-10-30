import { inject, InjectionToken } from '@angular/core';
import type { Provider } from '@angular/core';
import type { FormErrorInput } from '@slotted/core/form';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type {
  StepValues,
  WizardPersistence,
  WizardSnapshot,
  WizardValue,
} from '@slotted/core/wizard';

export type { StepValues, WizardPersistence, WizardSnapshot, WizardValue };

/** Where the list of steps stands: beside the step, above it, or nowhere. */
export type WizardProgress = 'start' | 'top' | 'none';
/** What scrolls: the page around the wizard, or the wizard's own step. */
export type WizardScroll = 'ancestor' | 'self';
/** When a draft is written without the reader asking. */
export type WizardAutosave = 'none' | 'step';
export type WizardLevel = 2 | 3 | 4;

export type WizardStepReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'submit' | 'programmatic'
>;
export type WizardValueReason = Extract<ChangeReason, 'submit' | 'clear' | 'programmatic'>;
export type WizardProgressOpenReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'select' | 'escape' | 'programmatic'
>;
export type WizardDraftReason = Extract<ChangeReason, 'pointer' | 'submit' | 'programmatic'>;

export interface WizardStepRequest extends ChangeRequest<string> {
  readonly reason: WizardStepReason;
}
export interface WizardValueRequest extends ChangeRequest<WizardValue> {
  readonly reason: WizardValueReason;
}
export interface WizardProgressOpenRequest extends ChangeRequest<boolean> {
  readonly reason: WizardProgressOpenReason;
}

export interface WizardDefaults {
  progress: WizardProgress;
  linear: boolean;
  level: WizardLevel;
  scroll: WizardScroll;
  /** How long an asynchronous restore may take before its skeleton is drawn. */
  delay: number;
  /** How long a drawn skeleton stays, so it does not flash. */
  minDuration: number;
}

/**
 * What a submission may answer instead of succeeding. `step` sends the reader
 * back to the step whose answers the server refused, and `errors` are
 * published to that step's form, keyed by control name.
 */
export interface WizardFailure {
  message?: string | undefined;
  step?: string | undefined;
  errors?: FormErrorInput | undefined;
}

export interface WizardSubmitRequest {
  reason: 'submit';
  source: unknown;
  /** Every accepted answer, including steps that are not present any more. */
  value: WizardValue;
}

export type WizardSubmit = (
  values: WizardValue,
  request: WizardSubmitRequest,
) => void | WizardFailure | Promise<void | WizardFailure>;

export interface WizardCancelRequest {
  /** Whether anything typed or accepted has not been submitted. */
  dirty: boolean;
  source: unknown;
}

export interface WizardDraftRequest {
  snapshot: WizardSnapshot;
  reason: WizardDraftReason;
  source: unknown;
}

export interface WizardValidateContext {
  value: WizardValue;
  signal: AbortSignal;
}

export type WizardValidate = (
  values: StepValues,
  context: WizardValidateContext,
) => FormErrorInput | void | Promise<FormErrorInput | void>;

/**
 * `linear` is on: the wave's scope says direct navigation depends on the
 * steps already completed. `delay` and `minDuration` are the loading-states
 * pair, so a restore that answers in eighty milliseconds draws nothing.
 */
export const WIZARD_FALLBACK: WizardDefaults = {
  delay: 200,
  level: 2,
  linear: true,
  minDuration: 400,
  progress: 'start',
  scroll: 'ancestor',
};

export const WIZARD_DEFAULTS = new InjectionToken<WizardDefaults>('slotted wizard defaults', {
  providedIn: 'root',
  factory: () => WIZARD_FALLBACK,
});

/**
 * An application decides once how its wizards lay out. A wizard that states
 * any of it itself still wins. Its words come from the language in force
 * (`provideSlotted`).
 */
export function provideWizardDefaults(defaults: Partial<WizardDefaults>): Provider {
  return {
    provide: WIZARD_DEFAULTS,
    useFactory: (): WizardDefaults => ({ ...WIZARD_FALLBACK, ...defaults }),
  };
}

export function injectWizardDefaults(): WizardDefaults {
  return inject(WIZARD_DEFAULTS);
}
