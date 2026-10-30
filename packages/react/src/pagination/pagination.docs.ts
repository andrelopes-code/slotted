import paginationTokens from '@slotted/styles/pagination/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

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

const imports: ReferenceImport = {
  source:
    "import {\n  Pagination,\n  PaginationDefaultsProvider,\n  PaginationFirst,\n  PaginationItems,\n  PaginationLast,\n  PaginationNext,\n  PaginationPageSize,\n  PaginationPrevious,\n  PaginationStatus,\n  usePagination,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'nav',
    required: true,
    purpose:
      'The navigation landmark and its name. Carries data-ui="pagination", holds the page and the page size, runs the arithmetic, and is the container the compaction measures.',
  },
  {
    part: 'list',
    element: 'ul',
    required: false,
    purpose:
      'The row of page numbers, rendered by PaginationItems. It is not drawn at all when the total is unknown, because there are no numbers to draw.',
  },
  {
    part: 'item',
    element: 'li',
    required: false,
    purpose: 'One cell of that row: either a page or an ellipsis, never both.',
  },
  {
    part: 'page',
    element: 'button or a',
    required: false,
    purpose:
      'One page. Carries aria-current="page" when it is the one being read, and becomes an anchor the moment itemHref is given.',
  },
  {
    part: 'ellipsis',
    element: 'span',
    required: false,
    purpose:
      'The pages the row does not draw. It is announced to nobody, and it is the character U+2026 as text rather than artwork.',
  },
  {
    part: 'summary',
    element: 'span',
    required: false,
    purpose:
      '"Page 3 of 25", rendered beside the row and displayed instead of it below the family breakpoint. Always in the DOM, so the swap announces nothing twice.',
  },
  {
    part: 'first',
    element: 'button or a',
    required: false,
    purpose: 'Jump to page one. Unavailable on the first page.',
  },
  {
    part: 'previous',
    element: 'button or a',
    required: false,
    purpose: 'One page back, and the whole of a cursor paginator together with next.',
  },
  {
    part: 'next',
    element: 'button or a',
    required: false,
    purpose: 'One page forward. The only trigger a collection with no known total can enable.',
  },
  {
    part: 'last',
    element: 'button or a',
    required: false,
    purpose: 'Jump to the last page. It needs a total, so it is off in cursor mode.',
  },
  {
    part: 'status',
    element: 'p',
    required: false,
    purpose:
      '"21–40 of 482", and the polite live region that announces a page change. Give it children to say something else.',
  },
  {
    part: 'page-size',
    element: 'select',
    required: false,
    purpose:
      'How many items a page holds. A native select, so its popup follows the colour scheme the theme already emits.',
  },
  {
    part: 'page-size-label',
    element: 'label',
    required: false,
    purpose:
      'The visible name, wrapping the select rather than pointing at it — which is what gives the control its accessible name from the platform, with no generated id.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every input on one paginator, driven by the controls below the canvas. Change count and watch the row keep its length while the numbers inside it move.',
    snippet: defineSnippet({
      id: 'pagination-react-playground',
      language: 'tsx',
      label: 'A paginator under a table',
      source:
        '<Pagination count={482} page={page} onPageChange={setPage}>\n  <PaginationPrevious />\n  <PaginationItems />\n  <PaginationNext />\n</Pagination>;',
    }),
  },
  {
    id: 'numbered',
    title: 'The row of page numbers',
    note: 'siblingCount widens the run around the current page and boundaryCount the runs at each end. The row holds one length at every page, so nothing beside it shifts as the reader walks.',
    snippet: defineSnippet({
      id: 'pagination-react-numbered',
      language: 'tsx',
      label: 'Widening the row',
      source:
        '<Pagination boundaryCount={2} count={482} defaultPage={12} siblingCount={2}>\n  <PaginationItems />\n</Pagination>;',
    }),
  },
  {
    id: 'cursor',
    title: 'A total the server does not know',
    note: 'Leave count out and there are no page numbers to draw, so none are drawn. Two triggers and a sentence are the whole paginator, and the family invents no total.',
    snippet: defineSnippet({
      id: 'pagination-react-cursor',
      language: 'tsx',
      label: 'Previous and next, and nothing else',
      source:
        '<Pagination onPageChange={fetchPage}>\n  <PaginationPrevious />\n  <PaginationStatus>Showing the first 20 results</PaginationStatus>\n  <PaginationNext />\n</Pagination>;',
    }),
  },
  {
    id: 'range',
    title: 'Which items this page holds',
    note: 'The sentence the numbers do not say, in a polite live region so a page change is announced once. Replace the wording through messages, or the whole sentence with children.',
    snippet: defineSnippet({
      id: 'pagination-react-range',
      language: 'tsx',
      label: 'The range, and a translated one',
      source:
        "<PaginationStatus />;\n\n<Pagination count={482} messages={{ range: '{start}–{end} de {count}' }}>\n  <PaginationStatus />\n</Pagination>;",
    }),
  },
  {
    id: 'pageSize',
    title: 'How many rows a page holds',
    note: 'A native select wrapped by its own label. Changing it keeps the first item of the current page visible, so the reader is looking at the same rows through a different window.',
    snippet: defineSnippet({
      id: 'pagination-react-page-size',
      language: 'tsx',
      label: 'The page size, and the sizes offered',
      source:
        '<Pagination count={482} pageSizeOptions={[25, 50, 100]}>\n  <PaginationPageSize label="Rows per page" />\n</Pagination>;',
    }),
  },
  {
    id: 'links',
    title: 'Pages with real destinations',
    note: 'itemHref turns every page and every trigger into an anchor, so a middle click opens page four in a tab and a crawler can follow the row. Without it they are buttons.',
    snippet: defineSnippet({
      id: 'pagination-react-links',
      language: 'tsx',
      label: 'Turning the row into links',
      source:
        '<Pagination count={482} itemHref={(page) => `/invoices?page=${page}`}>\n  <PaginationItems />\n</Pagination>;',
    }),
  },
  {
    id: 'compact',
    title: 'Narrow enough that the row will not fit',
    note: 'Below 22rem of the paginator own inline size the numbered row gives way to the summary and the triggers stay. It is a container query, so the same paginator on a wide page never compacts.',
    snippet: defineSnippet({
      id: 'pagination-react-compact',
      language: 'tsx',
      label: 'Nothing to configure',
      source:
        '// The summary is always rendered beside the row; the container query\n// decides which of the two is displayed.\n<PaginationItems />;',
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'A trigger at a bound is unavailable, a page change in flight refuses every move and keeps the row width, and a disabled paginator mutes the current chip without losing its shape.',
    snippet: defineSnippet({
      id: 'pagination-react-states',
      language: 'tsx',
      label: 'Loading and disabled',
      source:
        '<Pagination count={482} loading>\n  <PaginationItems />\n</Pagination>;\n\n<Pagination count={482} disabled>\n  <PaginationItems />\n</Pagination>;',
    }),
  },
  {
    id: 'content',
    title: 'Ten thousand pages',
    note: 'The figures are tabular and every cell is at least as wide as it is tall, so page 9 and page 8 942 are the same target and the row does not move as the digits grow.',
    snippet: defineSnippet({
      id: 'pagination-react-content',
      language: 'tsx',
      label: 'A very long collection',
      source:
        '<Pagination count={200000} defaultPage={8942} pageSize={20}>\n  <PaginationItems />\n</Pagination>;',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'The same family in two arrangements — a numbered row, and the bar a table carries — plus the provider that sets the wording once and the hook that hands you the arithmetic.',
    snippet: defineSnippet({
      id: 'pagination-react-composition',
      language: 'tsx',
      label: 'Two arrangements, one family',
      source:
        '<Pagination count={482}>\n  <PaginationPageSize />\n  <PaginationStatus />\n  <PaginationPrevious />\n  <PaginationNext />\n</Pagination>;\n\n<PaginationDefaultsProvider siblingCount={2}>\n  <App />\n</PaginationDefaultsProvider>;',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and focus',
    note: 'Every control is a tab stop in reading order — no roving tab index, because a list of links inside a landmark is a list of tab stops. Enter and Space activate whichever element itemHref chose.',
    snippet: defineSnippet({
      id: 'pagination-react-keyboard',
      language: 'tsx',
      label: 'Where focus goes after a page change',
      source:
        '// Focus stays on the control that was pressed. When pressing it makes it\n// unavailable, it moves to the nearest control that survived.\n<PaginationNext />;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onPageChange',
    payload: '(page: number, request: ChangeRequest<number>)',
    when: 'Before the page moves. The request carries the page it replaces, the reason — pointer, keyboard or programmatic — and the originating event, and cancelling it commits nothing. programmatic arrives unasked twice: when the collection shrinks under a reader who was past its new end, and after a page-size change that moved the window they are looking through.',
  },
  {
    name: 'onPageSizeChange',
    payload: '(pageSize: number, request: ChangeRequest<number>)',
    when: 'Before the page size moves, with the reason select. It is followed by a programmatic onPageChange whenever keeping the first item of the current page visible means landing on a different page.',
  },
];

export const REACT_PAGINATION_DOCS = {
  pagination: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'count',
        'number',
        '—',
        'Pagination',
        'How many items the collection holds. It has no default: left out entirely, the total is unknown, no page numbers are drawn, and the family invents none',
      ],
      [
        'page',
        'number',
        '—',
        'Pagination',
        'Present means controlled, for the life of the component',
      ],
      [
        'defaultPage',
        'number',
        '1',
        'Pagination',
        'The page an uncontrolled paginator starts from, read once',
      ],
      ['pageSize', 'number', '—', 'Pagination', 'Present means controlled, like page'],
      ['defaultPageSize', 'number', '20', 'Pagination', 'The page size it starts from, read once'],
      [
        'pageSizeOptions',
        'readonly number[]',
        '[10, 20, 50, 100]',
        'Pagination',
        'What the page-size control offers',
      ],
      ['siblingCount', 'number', '1', 'Pagination', 'Pages drawn either side of the current one'],
      ['boundaryCount', 'number', '1', 'Pagination', 'Pages drawn at each end of the row'],
      [
        'itemHref',
        '(page: number) => string',
        '—',
        'Pagination',
        'Turns every page and every trigger into an anchor with a real destination',
      ],
      [
        'messages',
        'Partial<PaginationMessages>',
        '—',
        'Pagination',
        "Words laid over the language in force, key by key: the landmark's name (label), every control and both sentences",
      ],
      [
        'live',
        "'polite' | 'off'",
        'polite',
        'Pagination',
        'Whether the range announces a page change',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Pagination',
        'Takes every control away without taking the row out of the page',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Pagination',
        'A page change in flight: every move is refused, the row keeps its size, and the root says aria-busy',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes the rendered element. Every data attribute is handed to it, so a router link keeps them.',
      ],
      ['ref', 'Ref<HTMLElement>', '—', 'every part', 'Reaches the element, and focus() with it'],
      [
        'onClick',
        'MouseEventHandler',
        '—',
        'every trigger',
        'Composed rather than replaced. Call preventDefault to keep the page where it is.',
      ],
      [
        'usePagination()',
        '() => PaginationContextValue',
        '—',
        'inside a Pagination',
        'goToPage, next, previous, setPageSize, and the arithmetic they came from: page, pages, range, items',
      ],
      [
        'PaginationDefaultsProvider',
        'siblingCount | boundaryCount | defaultPageSize | pageSizeOptions | live',
        '—',
        'Application',
        'Sets those five once for everything below it; a prop on the paginator still wins',
      ],
    ]),
    accessibility: [
      'The current page carries aria-current="page", which is the value the ARIA specification names for a link within a set of pagination links — and it is the attribute that paints the fill, so what a reader hears and what the eye sees are one fact rather than two.',
      'The range is a polite live region, and it is the only one: one region announcing one sentence is the whole of the announcement, so a page change is not read out twice.',
      'In link mode a trigger at a bound renders an anchor with no destination and aria-disabled, rather than a disabled anchor — there is no such thing, and one that kept its href would still navigate on a middle click.',
      'The page size is a native select wrapped by its own label, which gives the control its accessible name from the platform and needs no generated id; its popup follows the colour scheme the theme already emits.',
      'Below the family own breakpoint the numbered row gives way to the summary. Both are always in the DOM and exactly one is displayed, so nothing is announced twice — and the range is only hidden where a summary exists to replace it.',
      'Focus stays on the control that was pressed. When pressing it makes it unavailable — Next on the second-to-last page — focus moves to the nearest control that survives, because losing focus to the body after activating a control is what the guide means by preserving position predictably.',
      'The figures are tabular and every cell is at least as wide as it is tall, so page 9 and page 8 942 are the same target and the row does not move under the pointer.',
    ],
    snippets: [
      defineSnippet({
        id: 'pagination-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<nav aria-label="Pagination" data-part="root" data-ui="pagination">\n  <button aria-label="Previous page" data-part="previous" type="button" />\n  <ul data-part="list">\n    <li data-part="item">\n      <button aria-current="page" aria-label="Page 1" data-part="page" type="button">\n        1\n      </button>\n    </li>\n    <li data-part="item">\n      <span aria-hidden="true" data-part="ellipsis">\n        …\n      </span>\n    </li>\n  </ul>\n  <span data-part="summary">Page 1 of 25</span>\n  <button aria-label="Next page" data-part="next" type="button" />\n  <p aria-live="polite" data-part="status">\n    1–20 of 482\n  </p>\n</nav>;',
      }),
      defineSnippet({
        id: 'pagination-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='pagination'] {\n  --slotted-pagination-target: 40px;\n  --slotted-pagination-item-gap: 0.25rem;\n  --slotted-pagination-radius: 9999px;\n}",
      }),
    ],
  },
} as const;
