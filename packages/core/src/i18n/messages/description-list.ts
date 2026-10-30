import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `description-list` writes on its own. */
export interface DescriptionListMessages {
  readonly collapse: Message;
  readonly copied: Message;
  readonly copy: Message;
  readonly copyBlocked: Message;
  readonly placeholder: Message;
  readonly reveal: Message;
}

export const en: DescriptionListMessages = {
  collapse: 'Show less',
  copied: 'Copied',
  copy: 'Copy',
  copyBlocked: 'Value selected — copy it with your keyboard',
  placeholder: 'Not provided',
  reveal: 'Show more',
};

export const descriptionListMessages: MessageFamily<'descriptionList', DescriptionListMessages> = {
  name: 'descriptionList',
  base: en,
};
