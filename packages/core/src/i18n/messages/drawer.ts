import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `drawer` writes on its own. */
export interface DrawerMessages {
  readonly close: Message;
}

export const en: DrawerMessages = {
  close: 'Close',
};

export const drawerMessages: MessageFamily<'drawer', DrawerMessages> = { name: 'drawer', base: en };
