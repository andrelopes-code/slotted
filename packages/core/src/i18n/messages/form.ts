import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/**
 * The words a form writes: the error summary's title and the message of each
 * built-in validator. A validator the application adds names its own message.
 */
export interface FormMessages {
  readonly summaryTitle: Message;
  readonly errors: {
    readonly required: Message;
    readonly email: Message;
    readonly min: Message<{ min: number }>;
    readonly max: Message<{ max: number }>;
    readonly minlength: Message<{ length: number }>;
    readonly maxlength: Message<{ length: number }>;
    readonly pattern: Message;
  };
}

export const en: FormMessages = {
  summaryTitle: 'There is a problem',
  errors: {
    required: 'Please fill in this field.',
    email: 'Please enter an email address.',
    min: 'Please enter a value of {min} or more.',
    max: 'Please enter a value of {max} or less.',
    minlength: 'Please use at least {length, plural, one {# character} other {# characters}}.',
    maxlength: 'Please use {length, plural, one {# character} other {# characters}} or fewer.',
    pattern: 'Please match the requested format.',
  },
};

export const formMessages: MessageFamily<'form', FormMessages> = { name: 'form', base: en };
