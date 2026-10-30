import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `side-navigation` writes on its own. */
export interface SideNavigationMessages {
  readonly navigation: Message;
}

export const en: SideNavigationMessages = {
  navigation: 'Navigation',
};

export const sideNavigationMessages: MessageFamily<'sideNavigation', SideNavigationMessages> = {
  name: 'sideNavigation',
  base: en,
};
