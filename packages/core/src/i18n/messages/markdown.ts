import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `markdown` writes on its own. */
export interface MarkdownMessages {
  readonly alerts: {
    readonly caution: Message;
    readonly important: Message;
    readonly note: Message;
    readonly tip: Message;
    readonly warning: Message;
  };
  readonly anchor: Message<{ heading: string }>;
  /** `{occurrence}` counts the references to one footnote from one. */
  readonly backReference: Message<{ number: number; occurrence: number }>;
  readonly empty: Message;
  readonly error: Message;
  readonly footnotes: Message;
  readonly loading: Message;
  readonly retry: Message;
}

export const en: MarkdownMessages = {
  alerts: {
    caution: 'Caution',
    important: 'Important',
    note: 'Note',
    tip: 'Tip',
    warning: 'Warning',
  },
  anchor: 'Link to section: {heading}',
  backReference:
    '{occurrence, plural, =1 {Back to reference {number}} other {Back to reference {number}-{occurrence}}}',
  empty: 'This document has no content yet.',
  error: 'The document could not be loaded.',
  footnotes: 'Footnotes',
  loading: 'Loading document',
  retry: 'Try again',
};

export const markdownMessages: MessageFamily<'markdown', MarkdownMessages> = {
  name: 'markdown',
  base: en,
};
