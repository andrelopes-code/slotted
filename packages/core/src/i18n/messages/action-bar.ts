import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `action-bar` writes on its own. */
export interface ActionBarMessages {
  /** The overflow control's name: how many actions it holds. */
  readonly more: Message<{ count: number }>;
}

export const en: ActionBarMessages = {
  more: '{count, plural, one {# more action} other {# more actions}}',
};

export const actionBarMessages: MessageFamily<'actionBar', ActionBarMessages> = {
  name: 'actionBar',
  base: en,
};
