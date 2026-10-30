import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `text-field` writes on its own. */
export interface TextFieldMessages {
  readonly capsLock: Message;
  readonly clear: Message;
  readonly copied: Message;
  readonly copy: Message;
  readonly copyFailed: Message;
  readonly reveal: Message;
}

export const en: TextFieldMessages = {
  capsLock: 'Caps Lock is on',
  clear: 'Clear',
  copied: 'Copied',
  copy: 'Copy',
  copyFailed: 'Copy failed',
  reveal: 'Show password',
};

export const textFieldMessages: MessageFamily<'textField', TextFieldMessages> = {
  name: 'textField',
  base: en,
};
