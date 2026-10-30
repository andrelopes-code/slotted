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

export const ANGULAR_PAGINATION_TOKENS = paginationTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Pagination decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlPagination,\n  SlPaginationFirst,\n  SlPaginationItems,\n  SlPaginationLast,\n  SlPaginationNext,\n  SlPaginationPageSize,\n  SlPaginationPrevious,\n  SlPaginationStatus,\n  providePaginationDefaults,\n} from '@slotted/angular/pagination';",
  selector:
    'nav[slPagination], [slPaginationFirst], [slPaginationPrevious], [slPaginationNext], [slPaginationLast], sl-pagination-items, p[slPaginationStatus], sl-pagination-page-size',
  exportAs:
    'slPagination, slPaginationFirst, slPaginationPrevious, slPaginationNext, slPaginationLast, slPaginationItems, slPaginationStatus, slPaginationPageSize',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'nav',
    required: true,
    purpose:
      'The consumer’s own nav, named as a landmark. Carries data-ui="pagination", data-disabled and data-loading, holds the page and the page size, and declares the container every part measures itself against.',
  },
  {
    part: 'list',
    element: 'ul',
    required: false,
    purpose:
      'The row of page numbers, rendered by sl-pagination-items. It is not drawn at all when the server did not give a count.',
  },
  {
    part: 'item',
    element: 'li',
    required: false,
    purpose:
      'One page or one ellipsis, so the row keeps list semantics rather than being a bag of buttons.',
  },
  {
    part: 'page',
    element: 'button, or a in link mode',
    required: false,
    purpose:
      'One page. The page being read carries aria-current="page", which is what paints its fill.',
  },
  {
    part: 'ellipsis',
    element: 'span',
    required: false,
    purpose:
      'The pages the row does not draw. Announced to nobody: the two triggers and the four boundary pages already reach every page it hides.',
  },
  {
    part: 'summary',
    element: 'span',
    required: false,
    purpose:
      '"Page 3 of 24" — what the numbered row becomes below the family’s own breakpoint. Rendered beside the list and displayed instead of it.',
  },
  {
    part: 'first',
    element: 'button, or a in link mode',
    required: false,
    purpose:
      'Jump to page one. Unavailable on the first page, and it says so rather than vanishing.',
  },
  {
    part: 'previous',
    element: 'button, or a in link mode',
    required: false,
    purpose: 'One page back, and the whole of a cursor paginator together with next.',
  },
  {
    part: 'next',
    element: 'button, or a in link mode',
    required: false,
    purpose:
      'One page forward. It stays available while the total is unknown, because there may be more.',
  },
  {
    part: 'last',
    element: 'button, or a in link mode',
    required: false,
    purpose:
      'Jump to the last page. It cannot exist without a count, so a cursor paginator omits it.',
  },
  {
    part: 'status',
    element: 'p',
    required: false,
    purpose:
      '"21–40 of 482", and the polite live region that announces a page change. Its text is replaceable by projecting your own.',
  },
  {
    part: 'page-size',
    element: 'select',
    required: false,
    purpose:
      'How many items a page holds. A native select, so its popup follows the color scheme the theme already emits.',
  },
  {
    part: 'page-size-label',
    element: 'label',
    required: false,
    purpose:
      'Wraps the select rather than pointing at it, which is what gives the control its accessible name from the platform and no generated id.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every input on one paginator, driven by the controls below the canvas. Change count and watch the row keep its length while the numbers inside it move.',
    snippet: defineSnippet({
      id: 'pagination-angular-playground',
      language: 'angular',
      label: 'A numbered paginator',
      source:
        '<nav slPagination [count]="482" (pageChange)="load($event.value)">\n  <button slPaginationPrevious type="button"></button>\n  <sl-pagination-items />\n  <button slPaginationNext type="button"></button>\n</nav>',
    }),
  },
  {
    id: 'numbered',
    title: 'The row of pages',
    note: 'Seven items at every page: a boundary, a gap, the current page and its siblings, a gap, a boundary. Walk through it and nothing moves except the numbers.',
    snippet: defineSnippet({
      id: 'pagination-angular-numbered',
      language: 'angular',
      label: 'Widening the row',
      source:
        '<nav slPagination [count]="482" [siblingCount]="2" [boundaryCount]="2">\n  <sl-pagination-items />\n</nav>',
    }),
  },
  {
    id: 'cursor',
    title: 'A total the server does not know',
    note: 'No count, so there are no page numbers to draw and the family invents none. Two triggers and a sentence are the whole paginator.',
    snippet: defineSnippet({
      id: 'pagination-angular-cursor',
      language: 'angular',
      label: 'Previous and next only',
      source:
        '<nav slPagination (pageChange)="fetch($event.value)">\n  <button slPaginationPrevious type="button"></button>\n  <p slPaginationStatus>Showing the first 20 results</p>\n  <button slPaginationNext type="button"></button>\n</nav>',
    }),
  },
  {
    id: 'range',
    title: 'Which items this page holds',
    note: 'The sentence the numbers do not say, in a polite live region: a reader who cannot see the row hears the new range once, after the page settles.',
    snippet: defineSnippet({
      id: 'pagination-angular-range',
      language: 'angular',
      label: 'The range, and silencing it',
      source:
        '<nav slPagination [count]="482">\n  <p slPaginationStatus></p>\n</nav>\n\n<nav slPagination [count]="482" live="off">\n  <p slPaginationStatus></p>\n</nav>',
    }),
  },
  {
    id: 'pageSize',
    title: 'How many rows a page holds',
    note: 'Changing it keeps the reader’s first item visible rather than clamping them to the end or resetting them to page one, and the page that follows is reported as programmatic.',
    snippet: defineSnippet({
      id: 'pagination-angular-page-size',
      language: 'angular',
      label: 'The page size, and its options',
      source:
        '<nav slPagination [count]="482" [pageSizeOptions]="[25, 50, 100]">\n  <sl-pagination-page-size />\n  <p slPaginationStatus></p>\n</nav>',
    }),
  },
  {
    id: 'links',
    title: 'Pages a crawler can follow',
    note: 'One input turns every page and every trigger into an anchor with a real destination, so a middle click opens page four in a tab and a bookmark still works.',
    snippet: defineSnippet({
      id: 'pagination-angular-links',
      language: 'angular',
      label: 'Real destinations',
      source:
        '<nav slPagination [count]="482" [itemHref]="pageUrl">\n  <a slPaginationPrevious></a>\n  <sl-pagination-items />\n  <a slPaginationNext></a>\n</nav>',
    }),
  },
  {
    id: 'compact',
    title: 'Narrow enough to lose the row',
    note: 'Below 22rem of its own inline size the numbered row gives way to "Page 3 of 24" and the triggers stay. Resize the column and watch the swap happen without the viewport changing.',
    snippet: defineSnippet({
      id: 'pagination-angular-compact',
      language: 'angular',
      label: 'Nothing to write for it',
      source:
        '<!-- The compaction is the family’s own container query.\n     A paginator in a split pane compacts; the same one on a full page does not. -->\n<nav slPagination [count]="482">\n  <sl-pagination-items />\n</nav>',
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'A trigger at a bound is unavailable rather than absent, a page change in flight refuses every press, and a disabled paginator keeps its current chip in the disabled palette.',
    snippet: defineSnippet({
      id: 'pagination-angular-states',
      language: 'angular',
      label: 'Loading, disabled, and at a bound',
      source:
        '<nav slPagination [count]="482" [loading]="pending()">\n  <sl-pagination-items />\n</nav>\n\n<nav slPagination [count]="482" disabled>\n  <sl-pagination-items />\n</nav>',
    }),
  },
  {
    id: 'content',
    title: 'Content the paginator did not choose',
    note: 'Ten thousand pages. The figures are tabular and each box is at least as wide as it is tall, so page 9 and page 8 942 are the same target and the row does not move.',
    snippet: defineSnippet({
      id: 'pagination-angular-content',
      language: 'angular',
      label: 'A very large collection',
      source:
        '<nav slPagination [count]="200000" [pageSize]="20" [page]="8942">\n  <sl-pagination-items />\n</nav>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'providePaginationDefaults decides the row width for a whole injector, provideSlotted the language, and exportAs reaches the instance for goToPage, next, previous and reset.',
    snippet: defineSnippet({
      id: 'pagination-angular-composition',
      language: 'angular',
      label: 'Defaults once, and the instance in a template',
      source:
        '<nav slPagination #pager="slPagination" [count]="482">\n  <sl-pagination-items />\n</nav>\n<button type="button" (click)="pager.reset()">Back to the first page</button>',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard and announcement',
    note: 'Tab reaches every control in reading order and Enter or Space activates it; the family binds no key of its own, because a list of controls inside a landmark is a list of tab stops.',
    snippet: defineSnippet({
      id: 'pagination-angular-keyboard',
      language: 'angular',
      label: 'What each control announces',
      source:
        '<!-- The landmark is named, each trigger says which page it moves to,\n     and the range announces the new page once it settles. -->\n<nav slPagination aria-label="Invoices" [count]="482">\n  <button slPaginationPrevious type="button"></button>\n  <sl-pagination-items />\n  <button slPaginationNext type="button"></button>\n  <p slPaginationStatus></p>\n</nav>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'pageChange',
    payload: 'ChangeRequest<number>',
    when: 'Before the page moves. The request carries the page it replaces, the reason — pointer, keyboard or programmatic — and the originating event, and cancelling it commits nothing. programmatic is the family’s own move: the collection shrank under a reader who was past its new end, or the page size changed and the page followed the reader’s first item.',
  },
  {
    name: 'pageSizeChange',
    payload: 'ChangeRequest<number>',
    when: 'Before the page size moves, with the reason select. The page that follows arrives as a second pageChange carrying programmatic, because nobody asked for it directly and a consumer holding both values has to be told about both.',
  },
];

export const ANGULAR_PAGINATION_DOCS = {
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
        'slPagination',
        'How many items the collection holds. It has no default on purpose: left out entirely, the total is unknown, no page numbers are drawn, and the family invents none',
      ],
      [
        'page',
        'number',
        '—',
        'slPagination',
        'Present means controlled, for the life of the component',
      ],
      [
        'defaultPage',
        'number',
        '1',
        'slPagination',
        'The page an uncontrolled paginator starts from, read once',
      ],
      [
        'pageSize',
        'number',
        '—',
        'slPagination',
        'Present means controlled, for the life of the component',
      ],
      [
        'defaultPageSize',
        'number',
        '20',
        'slPagination',
        'The page size it starts from, read once',
      ],
      ['siblingCount', 'number', '1', 'slPagination', 'Pages drawn either side of the current one'],
      ['boundaryCount', 'number', '1', 'slPagination', 'Pages drawn at each end of the row'],
      [
        'pageSizeOptions',
        'readonly number[]',
        '[10, 20, 50, 100]',
        'slPagination',
        'What the page-size control offers',
      ],
      [
        'itemHref',
        '(page: number) => string',
        '—',
        'slPagination',
        'Turns every page and every trigger into an anchor with a real destination',
      ],
      [
        'messages',
        'Partial<PaginationMessages>',
        '—',
        'slPagination',
        'Words laid over the language in force, key by key: the landmark’s name (label), every control and both sentences',
      ],
      [
        'live',
        "'polite' | 'off'",
        'polite',
        'slPagination',
        'Whether the range announces a page change',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slPagination',
        'Takes every control away without taking the row out of the page',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slPagination',
        'A page change in flight: the controls refuse, the row keeps its size, and the root says aria-busy',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs="slPagination"',
        'template reference',
        '—',
        'Template',
        'Reaches the instance for goToPage, next, previous, reset and setPageSize, plus the arithmetic they were derived from',
      ],
      [
        'providePaginationDefaults',
        'siblingCount | boundaryCount | defaultPageSize | pageSizeOptions | live',
        '—',
        'Application',
        'Sets those five once for the whole injector; an input on the paginator still wins',
      ],
      [
        'aria-label',
        'attribute',
        '—',
        'The nav',
        'A static label written straight onto the element survives the host binding, so the consumer’s own name is never rewritten',
      ],
      [
        'ng-content',
        'projection',
        '—',
        'slPaginationStatus, sl-pagination-page-size',
        'Replaces the range sentence and the page-size label with your own wording, without replacing the element or its live region',
      ],
    ]),
    accessibility: [
      'The rendered root is the consumer’s own nav, named so a page carrying several landmarks can tell them apart. Nothing here is a widget: a row of controls inside a landmark is a row of tab stops, so the family binds no key of its own and Tab, Enter and Space are the platform’s.',
      'The page being read carries aria-current="page" — the value the ARIA specification names for a link within a set of pagination links — and that attribute is also what paints its fill, so what a screen reader announces and what the eye sees are one fact rather than two.',
      'The range is a polite live region, and it is the only one: a paginator that also announced its label would say the same thing twice. It reports the new range after the page settles, and live="off" silences it where an application announces the page itself.',
      'A trigger at a bound stays in the page rather than disappearing, so the row does not reflow under the pointer. In button mode it takes the native disabled; in link mode it loses its href and says aria-disabled, because an anchor has no disabled attribute and one that kept its destination would still navigate on a middle click.',
      'The page size is a native select wrapped by its own label, which gives the control its accessible name from the platform with no generated id, and its popup follows the color scheme the theme already emits.',
      'Below 22rem of the family’s own inline size the numbered row is replaced by "Page 3 of 24". Both are rendered and exactly one is displayed, so neither is announced twice — and where no summary exists to replace it, as in a cursor paginator, the range is kept instead.',
      'A disabled or loading paginator mutes the current page’s chip into the disabled palette while keeping its shape: the reader still sees which page they are on, and nothing in a greyed row reads as the one thing still operable.',
    ],
    snippets: [
      defineSnippet({
        id: 'pagination-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<nav aria-label="Pagination" data-part="root" data-ui="pagination">\n  <button aria-label="Previous page" data-part="previous" type="button"></button>\n  <ul data-part="list">\n    <li data-part="item">\n      <button aria-current="page" aria-label="Page 1" data-part="page" type="button">1</button>\n    </li>\n    <li data-part="item"><span aria-hidden="true" data-part="ellipsis">…</span></li>\n  </ul>\n  <span data-part="summary">Page 1 of 25</span>\n  <button aria-label="Next page" data-part="next" type="button"></button>\n  <p aria-live="polite" data-part="status">1–20 of 482</p>\n</nav>',
      }),
      defineSnippet({
        id: 'pagination-angular-defaults',
        language: 'ts',
        label: 'Defaults for the whole application',
        source: 'providePaginationDefaults({ siblingCount: 2 });',
      }),
      defineSnippet({
        id: 'pagination-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='pagination'] {\n  --slotted-pagination-gap: 0.25rem;\n  --slotted-pagination-target: 40px;\n}",
      }),
    ],
  },
} as const;
