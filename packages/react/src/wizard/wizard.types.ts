import type { FamilyTranslator, PartialMessages, WizardMessages } from '@slotted/core/i18n';
import type { FormErrorInput } from '@slotted/core/form';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type {
  StepValues,
  WizardPersistence,
  WizardSnapshot,
  WizardValue,
} from '@slotted/core/wizard';
import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';

import type { ButtonProps } from '../button';

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

/** What an application sets once for every wizard under it. */
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

export interface WizardDefaultsProviderProps extends Partial<WizardDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What a submission may answer instead of succeeding. `step` sends the reader
 * back to the step whose answers the server refused, and `errors` are
 * published to that step's form, keyed by control name.
 */
export interface WizardFailure {
  message?: ReactNode | undefined;
  step?: string | undefined;
  errors?: FormErrorInput | undefined;
}

/** What a submission is given beside the values. */
export interface WizardSubmitRequest {
  reason: 'submit';
  source: unknown;
  /** Every accepted answer, including steps that are not present any more. */
  value: WizardValue;
}

export interface WizardCancelRequest {
  /** Whether anything typed or accepted has not been submitted. */
  dirty: boolean;
  source: unknown;
}

export interface WizardDraftRequest {
  reason: WizardDraftReason;
  source: unknown;
}

/** What a step's own validation is given beside the step's values. */
export interface WizardValidateContext {
  /** The answers accepted so far. */
  value: WizardValue;
  /** Aborted when the reader leaves the step before the answer arrives. */
  signal: AbortSignal;
}

export type WizardValidate = (
  values: StepValues,
  context: WizardValidateContext,
) => FormErrorInput | void | Promise<FormErrorInput | void>;

/** The actions a consumer cannot express by passing a value. */
export interface WizardHandle {
  /** Submits the current step, as the next button does. */
  next(): void;
  previous(): void;
  /** Goes to a step: back freely, forward through a submission of this one. */
  goTo(name: string): void;
  /** Goes to a step and comes back here once it is accepted. */
  edit(name: string): void;
  /** Accepts an optional step with no answers. */
  skip(): void;
  /** Submits the current step; on the last one, the whole flow. */
  submit(): void;
  saveDraft(): void;
  clearDraft(): void;
  /** Back to the first step, with no answers, no draft and no error. */
  reset(): void;
  /** Moves focus to the current step's heading. */
  focus(): void;
}

export interface WizardRootProps extends ComponentPropsWithRef<'div'> {
  'data-complete'?: '' | undefined;
  'data-disabled'?: '' | undefined;
  'data-invalid'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-part': 'root';
  'data-progress': WizardProgress;
  'data-scroll': WizardScroll;
  'data-ui': 'wizard';
}

export interface WizardProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'onSubmit'
> {
  /** Present means the consumer owns the step, for the life of the component. */
  step?: string | undefined;
  /** The step an uncontrolled wizard starts on, read once and clamped to one in reach. */
  defaultStep?: string | undefined;
  onStepChange?: ((step: string, request: ChangeRequest<string>) => void) | undefined;
  /** Present means the consumer owns the accepted answers. */
  value?: WizardValue | undefined;
  defaultValue?: WizardValue | undefined;
  onValueChange?: ((value: WizardValue, request: ChangeRequest<WizardValue>) => void) | undefined;
  /** Whether the compact list of steps is open. */
  progressOpen?: boolean | undefined;
  defaultProgressOpen?: boolean | undefined;
  onProgressOpenChange?: ((open: boolean, request: ChangeRequest<boolean>) => void) | undefined;
  /** Called with the answers of the steps present, once the last step is accepted. */
  onSubmit?:
    | ((
        values: WizardValue,
        request: WizardSubmitRequest,
      ) => void | WizardFailure | Promise<void | WizardFailure>)
    | undefined;
  /** Asked by the cancel action; the family closes nothing itself. */
  onCancel?: ((request: WizardCancelRequest) => void) | undefined;
  /** Called with the draft when one is saved, before `persistence` keeps it. */
  onSaveDraft?:
    ((snapshot: WizardSnapshot, request: WizardDraftRequest) => void | Promise<void>) | undefined;
  /** Where drafts are kept and restored from. */
  persistence?: WizardPersistence | undefined;
  /** The flow's version; a draft of another version is not restored. */
  version?: string | number | undefined;
  /** Defaults to `step` when `persistence` is given, `none` otherwise. */
  autosave?: WizardAutosave | undefined;
  /** Registers a `beforeunload` guard while anything is unsubmitted. */
  guardUnsaved?: boolean | undefined;
  /** An error of the consumer's own, shown above the step; it wins over a failed submission. */
  error?: ReactNode | undefined;
  disabled?: boolean | undefined;
  progress?: WizardProgress | undefined;
  scroll?: WizardScroll | undefined;
  linear?: boolean | undefined;
  level?: WizardLevel | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * name of the list of steps (`progress`), the position, the actions, the
   * draft status and the failures.
   */
  messages?: PartialMessages<WizardMessages> | undefined;
  delay?: number | undefined;
  minDuration?: number | undefined;
  /** The row of actions. Defaults to `<WizardActions />`. */
  actions?: ReactNode | undefined;
  handle?: Ref<WizardHandle> | undefined;
  render?: ((props: WizardRootProps) => ReactNode) | undefined;
}

export interface WizardStepProps {
  /** The step's identity: the key of its answers, of a URL segment, of a draft. */
  name: string;
  label: ReactNode;
  description?: ReactNode | undefined;
  optional?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Runs after the platform's own validation passes. */
  validate?: WizardValidate | undefined;
  /**
   * The answers to accept instead of the form's `FormData`: typed values a
   * consumer holds in its own state.
   */
  values?: StepValues | undefined;
  children?: ReactNode;
}

export interface WizardCompleteProps extends ComponentPropsWithRef<'div'> {
  children?: ReactNode;
}

/** What the wizard tells its parts, and what `useWizard` returns. */
export interface WizardContextValue {
  step: string | undefined;
  /** The steps present, in order. */
  steps: readonly { name: string; label: ReactNode; optional: boolean; disabled: boolean }[];
  /** One-based position among the steps present. */
  position: { index: number; count: number };
  value: WizardValue;
  phase: 'editing' | 'submitting' | 'complete';
  /** Whether a step validation or a submission is pending. */
  busy: boolean;
  disabled: boolean;
  isFirst: boolean;
  /** Whether accepting the current step submits the flow. */
  isFinal: boolean;
  /** Whether an edit started from a review step is open. */
  returning: boolean;
  optional: boolean;
  canSaveDraft: boolean;
  canCancel: boolean;
  draftState: 'idle' | 'saving' | 'saved' | 'failed';
  savedAt: Date | undefined;
  /** The family's words in the language in force, with this wizard's `messages` laid over them. */
  t: FamilyTranslator<WizardMessages>;
  formId: string;
  next: (source?: unknown) => void;
  previous: (source?: unknown) => void;
  goTo: (name: string, reason?: WizardStepReason, source?: unknown) => void;
  edit: (name: string, source?: unknown) => void;
  skip: (source?: unknown) => void;
  cancel: (source?: unknown) => void;
  saveDraft: (reason?: WizardDraftReason, source?: unknown) => void;
  reset: () => void;
}

/** What one step's content is told. */
export interface WizardStepContextValue {
  name: string;
  /** The answers to show: typed and not yet accepted, else accepted, else none. */
  values: StepValues;
  complete: boolean;
  optional: boolean;
}

export interface WizardActionsProps extends ComponentPropsWithRef<'div'> {
  /** What leaves the flow. Defaults to cancel, save draft and the draft status. */
  start?: ReactNode | undefined;
  /** What moves it. Defaults to skip, previous and next. */
  end?: ReactNode | undefined;
}

export type WizardActionProps = Omit<ButtonProps, 'children'> & { children?: ReactNode };

export interface WizardEditProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** The step to change. */
  step: string;
  children?: ReactNode;
}
