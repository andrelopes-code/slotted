import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `pagination` writes on its own. */
export interface PaginationMessages {
  /** The name of the navigation when the instance gives none. */
  readonly label: Message;
  readonly first: Message;
  readonly last: Message;
  readonly next: Message;
  readonly page: Message<{ page: number }>;
  readonly pageSize: Message;
  readonly previous: Message;
  readonly range: Message<{ start: number; end: number; count: number }>;
  readonly summary: Message<{ page: number; pages: number }>;
}

export const en: PaginationMessages = {
  label: 'Pagination',
  first: 'First page',
  last: 'Last page',
  next: 'Next page',
  page: 'Page {page}',
  pageSize: 'Rows per page',
  previous: 'Previous page',
  range: '{count, plural, =0 {No results} other {{start}–{end} of {count}}}',
  summary: 'Page {page} of {pages}',
};

export const paginationMessages: MessageFamily<'pagination', PaginationMessages> = {
  name: 'pagination',
  base: en,
};
