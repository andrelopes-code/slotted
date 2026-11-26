import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `menu` writes on its own. */
export interface MenuMessages {
  /** The control at the head of a submenu shown as the second step of a sheet. */
  readonly back: Message;
}

export const en: MenuMessages = {
  back: 'Back',
};

export const menuMessages: MessageFamily<'menu', MenuMessages> = {
  name: 'menu',
  base: en,
};
