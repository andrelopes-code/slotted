import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `wizard` writes on its own. */
export interface WizardMessages {
  readonly cancel: Message;
  readonly draftFailed: Message;
  readonly edit: Message;
  readonly incomplete: Message;
  readonly next: Message;
  readonly optional: Message;
  /** `{index}` counted from one. */
  readonly position: Message<{ index: number; count: number }>;
  readonly previous: Message;
  readonly progress: Message;
  readonly restoring: Message;
  readonly return: Message;
  /** `{time}` is the hour and minute the draft was saved, written in the locale. */
  readonly saved: Message<{ time: string }>;
  readonly saveDraft: Message;
  readonly saving: Message;
  readonly skip: Message;
  readonly submit: Message;
  readonly submitFailed: Message;
}

export const en: WizardMessages = {
  cancel: 'Cancel',
  draftFailed: 'The draft could not be saved',
  edit: 'Change',
  incomplete: 'Complete this step to submit',
  next: 'Next',
  optional: 'Optional',
  position: 'Step {index} of {count}',
  previous: 'Back',
  progress: 'Progress',
  restoring: 'Restoring your draft',
  return: 'Save and return',
  saved: 'Draft saved at {time}',
  saveDraft: 'Save draft',
  saving: 'Saving draft…',
  skip: 'Skip',
  submit: 'Submit',
  submitFailed: 'The submission did not go through',
};

export const wizardMessages: MessageFamily<'wizard', WizardMessages> = { name: 'wizard', base: en };
