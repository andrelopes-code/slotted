import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `fullscreen` writes on its own. */
export interface FullscreenMessages {
  readonly enter: Message;
  readonly entered: Message;
  readonly exit: Message;
  readonly exited: Message;
}

export const en: FullscreenMessages = {
  enter: 'Full screen',
  entered: 'Full screen. Press Escape to exit.',
  exit: 'Exit full screen',
  exited: 'Exited full screen',
};

export const fullscreenMessages: MessageFamily<'fullscreen', FullscreenMessages> = {
  name: 'fullscreen',
  base: en,
};
