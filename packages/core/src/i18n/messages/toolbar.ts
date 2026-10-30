import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `toolbar` writes on its own. */
export interface ToolbarMessages {
  /** The overflow control's name: how many units it holds. */
  readonly more: Message<{ count: number }>;
}

export const en: ToolbarMessages = {
  more: '{count, plural, one {# more action} other {# more actions}}',
};

export const toolbarMessages: MessageFamily<'toolbar', ToolbarMessages> = {
  name: 'toolbar',
  base: en,
};
