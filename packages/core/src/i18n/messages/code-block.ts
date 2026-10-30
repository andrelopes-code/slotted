import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `code-block` writes on its own. */
export interface CodeBlockMessages {
  readonly collapse: Message;
  readonly copied: Message;
  readonly copy: Message;
  readonly copyFailed: Message;
  readonly loading: Message;
  readonly region: Message;
  readonly reveal: Message<{ count: number }>;
  readonly unwrap: Message;
  readonly wrap: Message;
}

export const en: CodeBlockMessages = {
  collapse: 'Show less',
  copied: 'Copied',
  copy: 'Copy code',
  copyFailed: 'Copy failed',
  loading: 'Loading code',
  region: 'Code',
  reveal: '{count, plural, one {Show # more line} other {Show # more lines}}',
  unwrap: 'Unwrap lines',
  wrap: 'Wrap lines',
};

export const codeBlockMessages: MessageFamily<'codeBlock', CodeBlockMessages> = {
  name: 'codeBlock',
  base: en,
};
