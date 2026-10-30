import type { FamilyTranslator, PartialMessages, StepperMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { StepOrientation, StepStatus } from '@slotted/core/steps';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type StepperOrientation = StepOrientation;
export type StepperLabelPlacement = 'end' | 'bottom';
/** What a step header is: a control, a destination, or neither. */
export type StepperNavigation = 'button' | 'link' | 'none';
export type StepperStepReason = 'pointer' | 'keyboard' | 'programmatic';
export type StepperChangeRequest = ChangeRequest<number>;
export type { StepStatus };

export interface StepperDefaults {
  labelPlacement?: StepperLabelPlacement | undefined;
  linear?: boolean | undefined;
  navigation?: StepperNavigation | undefined;
  orientation?: StepperOrientation | undefined;
}

export interface StepperDefaultsProviderProps extends StepperDefaults {
  children?: ReactNode;
}

export interface StepperRootProps extends ComponentPropsWithRef<'div'> {
  'data-label-placement': StepperLabelPlacement;
  'data-navigation': StepperNavigation;
  'data-orientation': StepperOrientation;
  'data-part': string;
  'data-ui': string;
}

export interface StepperProps extends ComponentPropsWithRef<'div'> {
  /**
   * Whether reaching a later step means the earlier ones are finished. Off,
   * because walking past a step is not the same as completing it, and a family
   * that assumed otherwise would report work as done that never was.
   */
  autoComplete?: boolean | undefined;
  /** The step an uncontrolled stepper starts from, read once. */
  defaultStep?: number | undefined;
  /** `end` beside the marker, `bottom` under it. */
  labelPlacement?: StepperLabelPlacement | undefined;
  /** Requires every earlier step to be complete before a later one is reached. */
  linear?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * list's name (`label`), the position, and the status each step announces.
   */
  messages?: PartialMessages<StepperMessages> | undefined;
  /** What a header is. `none` is a read-only progress indicator. */
  navigation?: StepperNavigation | undefined;
  /** Called before the step moves, with the request that carries the reason. */
  onStepChange?: ((step: number, request: StepperChangeRequest) => void) | undefined;
  orientation?: StepperOrientation | undefined;
  render?: ((props: StepperRootProps) => ReactNode) | undefined;
  /** Present means controlled, for the life of the component. */
  step?: number | undefined;
}

export interface StepperListProps extends ComponentPropsWithRef<'ol'> {
  render?: ((props: StepperListRootProps) => ReactNode) | undefined;
}

export interface StepperListRootProps extends ComponentPropsWithRef<'ol'> {
  'data-part': string;
}

export interface StepperStepRootProps extends ComponentPropsWithRef<'li'> {
  'data-complete': '' | undefined;
  'data-current': '' | undefined;
  'data-disabled': '' | undefined;
  'data-invalid': '' | undefined;
  'data-loading': '' | undefined;
  'data-part': string;
}

export interface StepperStepProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  children?: ReactNode;
  /** Whether the consumer says the work on this step is done. */
  complete?: boolean | undefined;
  /** The second line under the step's name. */
  description?: ReactNode | undefined;
  /** Takes the header out of reach, in a linear flow or outside one. */
  disabled?: boolean | undefined;
  /** The destination, when `navigation="link"`. */
  href?: string | undefined;
  /** Whether the work on this step failed. Outranks `complete`. */
  invalid?: boolean | undefined;
  /** The step's name. */
  label?: ReactNode | undefined;
  /** Whether this step is waiting on something; the header stops answering. */
  loading?: boolean | undefined;
  /** What the marker shows in place of the index. */
  marker?: ReactNode | undefined;
  render?: ((props: StepperStepRootProps) => ReactNode) | undefined;
}

export interface StepperPanelProps extends ComponentPropsWithRef<'div'> {
  render?: ((props: StepperPanelRootProps) => ReactNode) | undefined;
}

export interface StepperPanelRootProps extends ComponentPropsWithRef<'div'> {
  'data-part': string;
  role: 'group';
}

/** What the stepper tells the parts inside it, and what `useStepper` returns. */
export interface StepperContextValue {
  canGoNext: boolean;
  canGoPrevious: boolean;
  count: number;
  /** The status one index is in, from `@slotted/core/steps`. */
  statusOf: (index: number) => StepStatus;
  goToStep: (step: number, reason?: StepperStepReason, source?: unknown) => void;
  ids: { panel: (index: number) => string; trigger: (index: number) => string };
  labelPlacement: StepperLabelPlacement;
  linear: boolean;
  /** The locale in force: what the descriptors a step announces are listed in. */
  locale: string;
  navigation: StepperNavigation;
  next: (reason?: StepperStepReason, source?: unknown) => void;
  orientation: StepperOrientation;
  /** How far along the row the reader has travelled, nought to a hundred. */
  percent: number;
  previous: (reason?: StepperStepReason, source?: unknown) => void;
  /** Back to the step the stepper started from. */
  reset: (source?: unknown) => void;
  step: number;
  /** Whether a linear flow lets the reader jump to an index. */
  reachable: (index: number) => boolean;
  /** The family's words in the language in force, with this stepper's `messages` laid over them. */
  t: FamilyTranslator<StepperMessages>;
}

/** What one step is told by the list that laid it out. */
export interface StepperStepContextValue {
  index: number;
  last: boolean;
  /** Whether the reader has walked past the connector after this step. */
  travelled: boolean;
}
