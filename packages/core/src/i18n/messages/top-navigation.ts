import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `top-navigation` writes on its own. */
export interface TopNavigationMessages {
  readonly account: Message;
  readonly closeSearch: Message;
  readonly help: Message;
  readonly more: Message;
  /** The panel button while items are folded into it, with how many. */
  readonly moreCount: Message<{ count: number }>;
  readonly navigation: Message;
  readonly notifications: Message;
  readonly search: Message;
  readonly skip: Message;
}

export const en: TopNavigationMessages = {
  account: 'Account',
  closeSearch: 'Close search',
  help: 'Help',
  more: 'More',
  moreCount: 'More, {count}',
  navigation: 'Navigation',
  notifications: 'Notifications',
  search: 'Search',
  skip: 'Skip to content',
};

export const topNavigationMessages: MessageFamily<'topNavigation', TopNavigationMessages> = {
  name: 'topNavigation',
  base: en,
};
