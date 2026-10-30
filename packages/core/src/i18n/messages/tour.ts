import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `tour` writes on its own. */
export interface TourMessages {
  readonly close: Message;
  readonly done: Message;
  readonly next: Message;
  readonly preparing: Message;
  readonly prev: Message;
  /** Where the reader is: `{position}` counted from one among the `{total}` steps that apply. */
  readonly progress: Message<{ position: number; total: number }>;
  readonly skip: Message;
}

export const en: TourMessages = {
  close: 'Close tour',
  done: 'Done',
  next: 'Next',
  preparing: 'Preparing the next step',
  prev: 'Back',
  progress: '{position} of {total}',
  skip: 'Skip tour',
};

export const tourMessages: MessageFamily<'tour', TourMessages> = { name: 'tour', base: en };
