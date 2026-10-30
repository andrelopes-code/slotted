import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `page-header` writes on its own. */
export interface PageHeaderMessages {
  readonly collapse: Message;
  readonly expand: Message;
  readonly headerArea: Message;
  readonly pin: Message;
  /** The name of the bar drawn on the chrome's edge while the page's data is refreshed. */
  readonly progress: Message;
  readonly unpin: Message;
}

export const en: PageHeaderMessages = {
  collapse: 'Collapse header',
  expand: 'Expand header',
  headerArea: 'Page header',
  pin: 'Pin header',
  progress: 'Updating page',
  unpin: 'Unpin header',
};

export const pageHeaderMessages: MessageFamily<'pageHeader', PageHeaderMessages> = {
  name: 'pageHeader',
  base: en,
};
