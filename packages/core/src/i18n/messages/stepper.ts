import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `stepper` writes on its own. */
export interface StepperMessages {
  readonly complete: Message;
  readonly current: Message;
  /** The name of the list when the instance gives none. */
  readonly label: Message;
  readonly invalid: Message;
  readonly loading: Message;
  /** `{index}` counted from one. */
  readonly position: Message<{ index: number; count: number }>;
  readonly unavailable: Message;
}

export const en: StepperMessages = {
  complete: 'completed',
  current: 'current',
  label: 'Progress',
  invalid: 'needs attention',
  loading: 'checking',
  position: 'Step {index} of {count}',
  unavailable: 'unavailable',
};

export const stepperMessages: MessageFamily<'stepper', StepperMessages> = {
  name: 'stepper',
  base: en,
};
