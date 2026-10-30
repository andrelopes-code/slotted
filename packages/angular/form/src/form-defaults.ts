import { inject, InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';
import type { FormErrorEntry, FormErrors } from '@slotted/core/form';

/**
 * When the form checks its own controls. `submit` is the default and
 * re-validates on every change afterwards: telling a reader an answer is wrong
 * before they have finished writing it is noise, and telling them nothing after
 * they have fixed it is worse.
 */
export type FormValidate = 'submit' | 'blur' | 'change' | 'none';

/** Where focus goes after a submit that found something wrong. */
export type FormErrorFocus = 'summary' | 'control' | 'none';

/** Whether the family renders the summary itself. */
export type FormSummaryMode = 'auto' | 'none';

/** How the action row is arranged along the inline axis. */
export type FormActionsAlign = 'end' | 'start' | 'between' | 'stretch';

export interface FormDefaults {
  align: FormActionsAlign;
  errorFocus: FormErrorFocus;
  nativeValidation: boolean;
  summary: FormSummaryMode;
  summaryDescription: string | undefined;
  validate: FormValidate;
}

const FALLBACK: FormDefaults = {
  align: 'end',
  errorFocus: 'summary',
  nativeValidation: false,
  summary: 'auto',
  summaryDescription: undefined,
  validate: 'submit',
};

export const FORM_DEFAULTS = new InjectionToken<FormDefaults>('slotted form defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its forms behave: when they validate, where
 * focus goes after a failed submit, and how its action row is arranged. A form
 * that states any of them itself still wins. The summary's heading comes from
 * the language in force (`provideSlotted`).
 */
export function provideFormDefaults(defaults: Partial<FormDefaults>) {
  return {
    provide: FORM_DEFAULTS,
    useFactory: (): FormDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectFormDefaults(): FormDefaults {
  return inject(FORM_DEFAULTS);
}

/** One validation failure Angular reported, as the registry receives it. */
export interface FormErrorMessageContext {
  /** The `name` the control is submitted under, which is the key in the group. */
  name: string;
  /** The key `AbstractControl.errors` used — `required`, `minlength`, and so on. */
  key: string;
  /** Whatever the validator put beside the key. */
  detail: unknown;
}

/**
 * How a Reactive Forms validation failure the application's own validator
 * reports becomes a sentence.
 *
 * Angular's validators report a key and a shape — `{ required: true }`,
 * `{ minlength: { requiredLength: 8, actualLength: 3 } }` — and never a
 * message. The built-in keys (`required`, `email`, `min`, `max`, `minlength`,
 * `maxlength`, `pattern`) are written by the `form` catalog's `errors.*`
 * messages in the language in force; a validator the application adds names
 * its own message here, and an entry for a built-in key replaces the catalog's.
 */
export type FormErrorMessages = Record<string, (context: FormErrorMessageContext) => string>;

export const SL_FORM_ERROR_MESSAGES = new InjectionToken<FormErrorMessages>(
  'slotted form error messages',
  { providedIn: 'root', factory: () => ({}) },
);

/** Names the sentences the application's own validators are written as. */
export function provideFormErrorMessages(messages: FormErrorMessages) {
  return { provide: SL_FORM_ERROR_MESSAGES, useValue: messages };
}

export function injectFormErrorMessages(): FormErrorMessages {
  return inject(SL_FORM_ERROR_MESSAGES);
}

/**
 * What the summary needs from the form around it.
 *
 * It is an abstract class rather than an import so the two classes can depend
 * on each other without a cycle — the shape `field` and `text-field` already
 * have.
 */
export abstract class SlFormOwner {
  abstract readonly entries: Signal<readonly FormErrorEntry[]>;
  abstract readonly errors: Signal<FormErrors>;
  abstract readonly summaryId: Signal<string>;
  abstract readonly resolvedSummaryTitle: Signal<string>;
  abstract readonly resolvedSummaryDescription: Signal<string | undefined>;
  abstract readonly resolvedAlign: Signal<FormActionsAlign>;
  /** Called by whichever summary is on the page, so focus can reach the region. */
  abstract registerSummary(element: HTMLElement | null): void;
}
