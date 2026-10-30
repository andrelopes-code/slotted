import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `breadcrumb` writes on its own. */
export interface BreadcrumbMessages {
  /** The accessible name when the instance gives none. */
  readonly label: Message;
  /** The ellipsis that reveals the crumbs a collapse folded. */
  readonly showHidden: Message<{ count: number }>;
}

export const en: BreadcrumbMessages = {
  label: 'Breadcrumb',
  showHidden: '{count, plural, one {Show # hidden level} other {Show # hidden levels}}',
};

export const breadcrumbMessages: MessageFamily<'breadcrumb', BreadcrumbMessages> = {
  name: 'breadcrumb',
  base: en,
};
