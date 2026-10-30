import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `loading-overlay` writes on its own. */
export interface LoadingOverlayMessages {
  /** The accessible name when the instance gives none. */
  readonly label: Message;
  readonly cancel: Message;
}

export const en: LoadingOverlayMessages = {
  label: 'Loading…',
  cancel: 'Cancel',
};

export const loadingOverlayMessages: MessageFamily<'loadingOverlay', LoadingOverlayMessages> = {
  name: 'loadingOverlay',
  base: en,
};
