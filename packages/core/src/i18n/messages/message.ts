import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `message` writes on its own. */
export interface MessageMessages {
  readonly actions: Message;
  readonly delivered: Message;
  readonly failed: Message;
  readonly less: Message;
  readonly more: Message;
  readonly nextVersion: Message;
  readonly previousVersion: Message;
  readonly reactions: Message;
  readonly read: Message;
  readonly retry: Message;
  readonly sending: Message;
  readonly sent: Message;
  readonly streaming: Message;
  readonly typing: Message;
  readonly versionLabel: Message<{ current: number; total: number }>;
  readonly versions: Message;
}

export const en: MessageMessages = {
  actions: 'Message actions',
  delivered: 'Delivered',
  failed: 'Not sent',
  less: 'Show less',
  more: 'Show more',
  nextVersion: 'Next version',
  previousVersion: 'Previous version',
  reactions: 'Reactions',
  read: 'Read',
  retry: 'Try sending again',
  sending: 'Sending',
  sent: 'Sent',
  streaming: 'Responding',
  typing: 'Typing',
  versionLabel: '{current} of {total}',
  versions: 'Versions',
};

export const messageMessages: MessageFamily<'message', MessageMessages> = {
  name: 'message',
  base: en,
};
