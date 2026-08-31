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

export const REACT_PAGINATION_TOKENS = paginationTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Pagination decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_PAGINATION_DOCS = {
  pagination: {
    api: apiRows([
      ['aria-label', 'string', 'Pagination', 'Pagination', 'Names the navigation landmark'],
      ['render', '(props) => ReactNode', '—', 'Pagination', 'Renders a different root element'],
      ...wiringApi,
    ]),
    accessibility: [
      'The root is a nav landmark named "Pagination" by default, because a page with pagination almost always has other navigation on it too.',
      'The list is a ul: the pages are siblings a reader may visit in any order, unlike a breadcrumb, whose order is the information.',
      'The page the reader is on carries aria-current="page", and only that one.',
      'A page control with an address should be a link, through render. Bookmarking page four and opening page five in a new tab are things a button cannot do.',
      'The previous and next controls at the ends are disabled rather than removed, so the row does not change length and nothing moves under the pointer.',
      'The gap is hidden from assistive technology: "…" between four and nine is not a destination.',
    ],
    snippets: [
      defineSnippet({
        id: 'pagination-react-links',
        language: 'tsx',
        label: 'Pages that have addresses',
        source:
          '<PaginationPage current render={(props) => <a {...props} href="?page=3" />}>\n  3\n</PaginationPage>;',
      }),
    ],
  },
  paginationList: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  paginationItem: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  paginationPage: {
    api: apiRows([
      ['current', 'boolean', 'false', 'PaginationPage', 'Marks the page the reader is on'],
      ['disabled', 'boolean', 'false', 'PaginationPage', 'Blocks a move that cannot be made'],
      ['render', '(props) => ReactNode', '—', 'PaginationPage', 'Renders a link instead'],
      ...wiringApi,
    ]),
    accessibility: [],
    snippets: [],
  },
  paginationEllipsis: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
