import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `floating-panel` writes on its own. */
export interface FloatingPanelMessages {
  readonly close: Message;
  readonly move: Message;
}

export const en: FloatingPanelMessages = {
  close: 'Close',
  move: 'Move',
};

export const floatingPanelMessages: MessageFamily<'floatingPanel', FloatingPanelMessages> = {
  name: 'floatingPanel',
  base: en,
};
