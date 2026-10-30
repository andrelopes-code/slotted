import type { FormErrorEntry, FormErrorInput, FormErrors } from '@slotted/core/form';
import type { FormMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, FormEvent, HTMLAttributes, ReactNode, Ref } from 'react';

export type { FormErrorEntry, FormErrorInput, FormErrors };

/**
 * When the form checks its own controls.
 *
 * `submit` is the default and re-validates on every change afterwards, which is
 * the behavior the surveyed field converged on: telling a reader an answer is
 * wrong before they have finished writing it is noise, and telling them nothing
 * after they have fixed it is worse.
 */
export type FormValidate = 'submit' | 'blur' | 'change' | 'none';

/** Where focus goes after a submit that found something wrong. */
export type FormErrorFocus = 'summary' | 'control' | 'none';

/** Whether the family renders the summary itself. */
export type FormSummaryMode = 'auto' | 'none';

/** How the action row is arranged along the inline axis. */
export type FormActionsAlign = 'end' | 'start' | 'between' | 'stretch';

/** Why the error map moved. */
export type FormErrorsReason = Extract<
  ChangeRequest<FormErrors>['reason'],
  'submit' | 'keyboard' | 'clear' | 'programmatic'
>;

/** What a submit handler is given, beside the values. */
export interface FormSubmitRequest {
  /** The native event, already prevented when the family is handling the submit. */
  event: FormEvent<HTMLFormElement>;
  /** The values the form holds, read from `FormData` in document order. */
  values: Record<string, FormDataEntryValue | FormDataEntryValue[]>;
}

/** The four actions a consumer cannot express by passing a value. */
export interface FormHandle {
  /** Runs constraint validation now and publishes what it found. */
  validate(): FormErrors;
  /** Submits as though the submit button had been pressed. */
  submit(): void;
  /** Resets the controls and clears the errors. */
  reset(): void;
  /** Moves focus where a failed submit would have moved it. */
  focusFirstError(): void;
}

/** What an application sets once for every form under it. */
export interface FormDefaults {
  align: FormActionsAlign;
  errorFocus: FormErrorFocus;
  nativeValidation: boolean;
  summary: FormSummaryMode;
  summaryDescription: ReactNode | undefined;
  validate: FormValidate;
}

export interface FormDefaultsProviderProps extends Partial<FormDefaults> {
  children?: ReactNode | undefined;
}

/** What the parts of a form read, and what `useFormState()` hands a consumer. */
export interface FormContextValue {
  align: FormActionsAlign;
  /** Every error, in document order, with the identifier the summary links to. */
  entries: readonly FormErrorEntry[];
  errors: FormErrors;
  /** Whether a submit is in flight. A second one is refused while it is. */
  submitting: boolean;
  /** Whether the form has been submitted at least once. */
  submitted: boolean;
  summaryDescription: ReactNode | undefined;
  summaryId: string;
  summaryTitle: ReactNode;
  /** Called by the summary the family renders, so the region can take focus. */
  registerSummary: (element: HTMLElement | null) => void;
}

/** What `render` receives for the root. */
export interface FormRootProps extends HTMLAttributes<HTMLElement> {
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-part': string;
  'data-ui': string;
}

export interface FormProps extends Omit<ComponentPropsWithRef<'form'>, 'onSubmit'> {
  /** How the action row this form renders is arranged. Defaults to the provider, then `end`. */
  align?: FormActionsAlign | undefined;
  /** The errors an uncontrolled form starts from, read once. */
  defaultErrors?: FormErrorInput | undefined;
  /** Marks the form and every control in it as unavailable. */
  disabled?: boolean | undefined;
  /**
   * Present means the consumer owns the error map, for the life of the
   * component. Keyed by the `name` attribute of the control each error is about.
   */
  errors?: FormErrorInput | undefined;
  /** Where focus goes after a failed submit. Defaults to the provider, then `summary`. */
  errorFocus?: FormErrorFocus | undefined;
  /**
   * Registers a `beforeunload` guard while anything in the form has been
   * edited. Off by default: a guard nobody asked for is a trap.
   */
  guardUnsaved?: boolean | undefined;
  /** Reaches `validate()`, `submit()`, `reset()` and `focusFirstError()`. */
  handle?: Ref<FormHandle> | undefined;
  /**
   * Marks the form busy for work the family did not start — a mutation a
   * consumer's own client is running. It is merged with the family's own
   * submission, so either one puts the root in its busy state and refuses a
   * second submit.
   */
  loading?: boolean | undefined;
  /** Words laid over the catalog of the language in force: the summary's heading (`summaryTitle`). */
  messages?: PartialMessages<FormMessages> | undefined;
  /**
   * Lets the browser draw its own validation bubble. Off by default, because
   * the `field` around each control already draws the message.
   */
  nativeValidation?: boolean | undefined;
  /** Called before the error map moves, with the request that carries the reason. */
  onErrorsChange?: ((errors: FormErrors, request: ChangeRequest<FormErrors>) => void) | undefined;
  /**
   * Called when the form submits and nothing is wrong with it. Returning an
   * error map — or a promise of one — publishes those errors and moves focus;
   * returning a promise puts the form in its busy state until it settles.
   */
  onSubmit?:
    | ((
        values: FormSubmitRequest['values'],
        request: FormSubmitRequest,
      ) => void | FormErrorInput | Promise<void | FormErrorInput>)
    | undefined;
  /** Whether the family renders the summary itself. Defaults to the provider, then `auto`. */
  summary?: FormSummaryMode | undefined;
  /** A sentence under the summary's heading. */
  summaryDescription?: ReactNode | undefined;
  /** The summary's heading, replacing the `summaryTitle` message. */
  summaryTitle?: ReactNode | undefined;
  /** When the form checks its controls. Defaults to the provider, then `submit`. */
  validate?: FormValidate | undefined;
}

export interface FormSummaryProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface FormActionsProps extends HTMLAttributes<HTMLElement> {
  /** Defaults to the form's own `align`, then to the provider, then `end`. */
  align?: FormActionsAlign | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface FormAsideProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLDivElement> | undefined;
}
