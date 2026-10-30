import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `status-indicator` writes on its own. */
export interface StatusIndicatorMessages {
  readonly danger: Message;
  readonly info: Message;
  readonly neutral: Message;
  readonly success: Message;
  readonly unknown: Message;
  readonly warning: Message;
}

export const en: StatusIndicatorMessages = {
  danger: 'Error',
  info: 'Information',
  neutral: 'Neutral',
  success: 'Success',
  unknown: 'Unknown',
  warning: 'Warning',
};

export const statusIndicatorMessages: MessageFamily<'statusIndicator', StatusIndicatorMessages> = {
  name: 'statusIndicator',
  base: en,
};
