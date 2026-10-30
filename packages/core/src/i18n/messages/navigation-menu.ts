import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `navigation-menu` writes on its own. */
export interface NavigationMenuMessages {
  /** The landmark's accessible name when the instance gives none. */
  readonly navigation: Message;
}

export const en: NavigationMenuMessages = {
  navigation: 'Navigation',
};

export const navigationMenuMessages: MessageFamily<'navigationMenu', NavigationMenuMessages> = {
  name: 'navigationMenu',
  base: en,
};
