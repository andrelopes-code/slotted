import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `attachment` writes on its own. */
export interface AttachmentMessages {
  /** What a card's tile prints for a file whose name has no extension. */
  readonly noExtension: Message;
  /** The remove control's name; `{name}` is the file's name. */
  readonly remove: Message<{ name: string }>;
}

export const en: AttachmentMessages = {
  noExtension: 'FILE',
  remove: 'Remove {name}',
};

export const attachmentMessages: MessageFamily<'attachment', AttachmentMessages> = {
  name: 'attachment',
  base: en,
};
