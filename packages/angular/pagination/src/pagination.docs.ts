import paginationTokens from '@slotted/styles/pagination/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_PAGINATION_TOKENS = paginationTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Pagination decision',
}));

export const ANGULAR_PAGINATION_DOCS = {
  pagination: {
    api: apiRows([
      ['aria-label', 'string', 'Pagination', 'slPagination', 'Names the navigation landmark'],
    ]),
    accessibility: [
      'The root is a nav landmark named "Pagination" by default, because a page with pagination almost always has other navigation on it too.',
      'The list is a ul: the pages are siblings a reader may visit in any order, unlike a breadcrumb, whose order is the information.',
      'The page the reader is on carries aria-current="page", and only that one.',
      'A page control with an address should be a link: put slPaginationPage on an anchor. Bookmarking page four and opening page five in a new tab are things a button cannot do.',
      'The previous and next controls at the ends are disabled rather than removed, so the row does not change length and nothing moves under the pointer.',
      'The gap is hidden from assistive technology: "…" between four and nine is not a destination.',
    ],
    snippets: [
      defineSnippet({
        id: 'pagination-angular-links',
        language: 'angular',
        label: 'Pages that have addresses',
        source: '<a slPaginationPage current href="?page=3">3</a>',
      }),
    ],
  },
  paginationList: { api: [], accessibility: [], snippets: [] },
  paginationItem: { api: [], accessibility: [], snippets: [] },
  paginationPage: {
    api: apiRows([
      ['current', 'boolean', 'false', 'slPaginationPage', 'Marks the page the reader is on'],
      ['disabled', 'boolean', 'false', 'slPaginationPage', 'Blocks a move that cannot be made'],
    ]),
    accessibility: [],
    snippets: [],
  },
  paginationEllipsis: { api: [], accessibility: [], snippets: [] },
} as const;
