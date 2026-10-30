import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlPagination,
  SlPaginationFirst,
  SlPaginationItems,
  SlPaginationLast,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
} from './pagination';
import { ANGULAR_PAGINATION_DOCS, ANGULAR_PAGINATION_TOKENS } from './pagination.docs';

interface PaginationStoryArgs {
  boundaryCount: number;
  count: number;
  defaultPage: number;
  disabled: boolean;
  loading: boolean;
  siblingCount: number;
}

const PARTS = [
  SlPagination,
  SlPaginationFirst,
  SlPaginationItems,
  SlPaginationLast,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_PAGINATION_DOCS.pagination.scenes, {
    playground: Playground,
    numbered: Numbered,
    cursor: Cursor,
    range: Range,
    pageSize: PageSize,
    links: Links,
    compact: Compact,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<PaginationStoryArgs> = {
  title: 'Components/Pagination',
  component: SlPagination,
  decorators: [moduleMetadata({ imports: PARTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Pagination',
        description:
          'Moving between pages of a collection the consumer owns, in whichever arrangement the page needs.',
        framework: 'Angular',
        ...ANGULAR_PAGINATION_DOCS.pagination,
        tokens: ANGULAR_PAGINATION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<PaginationStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

const numbered = (attributes = '') => `
    <nav slPagination [count]="482" ${attributes}>
      <button slPaginationFirst type="button"></button>
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
      <button slPaginationLast type="button"></button>
    </nav>`;

export const Playground: Story = {
  args: {
    boundaryCount: 1,
    count: 482,
    defaultPage: 7,
    disabled: false,
    loading: false,
    siblingCount: 1,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <nav
    slPagination
    [count]="count"
    [defaultPage]="defaultPage"
    [siblingCount]="siblingCount"
    [boundaryCount]="boundaryCount"
    [disabled]="disabled"
    [loading]="loading"
  >
    <button slPaginationFirst type="button"></button>
    <button slPaginationPrevious type="button"></button>
    <sl-pagination-items />
    <button slPaginationNext type="button"></button>
    <button slPaginationLast type="button"></button>
    <p slPaginationStatus></p>
  </nav>
</div>`,
  }),
};

export const Numbered: Story = {
  parameters: scenario('numbered'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'The default row',
    'A boundary, a gap, the current page and one sibling either side, a gap, a boundary. Seven items at page 7 and seven at page 20.',
    numbered('[defaultPage]="7"'),
  )}
  ${scene(
    'siblingCount and boundaryCount',
    'Widening either one widens the row and keeps it constant again: what changes is how many numbers a reader can reach without a second press.',
    numbered('[defaultPage]="10" [siblingCount]="2" [boundaryCount]="2"'),
  )}
  ${scene(
    'A collection short enough to draw whole',
    'Below the length a gap could save anything, every page is drawn and no ellipsis appears at all.',
    `
    <nav slPagination [count]="120">
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
    </nav>`,
  )}
</div>`,
  }),
};

export const Cursor: Story = {
  parameters: scenario('cursor'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'No count at all',
    'The server did not say how many rows there are, so there is no last page to offer and no total to invent. Next stays available because there may be more.',
    `
    <nav slPagination>
      <button slPaginationPrevious type="button"></button>
      <p slPaginationStatus>Showing the first 20 results</p>
      <button slPaginationNext type="button"></button>
    </nav>`,
  )}
</div>`,
  }),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'The range, announced',
    'A polite live region: pressing a trigger moves the page, and the new range is read once the change settles rather than on every keystroke.',
    `
    <nav slPagination [count]="482" [defaultPage]="7">
      <button slPaginationPrevious type="button"></button>
      <p slPaginationStatus></p>
      <button slPaginationNext type="button"></button>
    </nav>`,
  )}
  ${scene(
    'An empty collection',
    'Nought items is a sentence rather than a blank: the paginator still renders, and both triggers are unavailable because there is nowhere to go.',
    `
    <nav slPagination [count]="0">
      <button slPaginationPrevious type="button"></button>
      <p slPaginationStatus></p>
      <button slPaginationNext type="button"></button>
    </nav>`,
  )}
</div>`,
  }),
};

export const PageSize: Story = {
  parameters: scenario('pageSize'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'The paginator bar a table carries',
    'How many rows a page holds, which rows this page is, and the two triggers. Change the size and the range follows the item you were already looking at.',
    `
    <nav slPagination [count]="482" [defaultPage]="7">
      <sl-pagination-page-size />
      <p slPaginationStatus></p>
      <button slPaginationPrevious type="button"></button>
      <button slPaginationNext type="button"></button>
    </nav>`,
  )}
  ${scene(
    'Your own options and wording',
    'The options are an input and the visible name is projected content, so a table that pages by 25 says so in the language the application ships.',
    `
    <nav slPagination [count]="482" [pageSizeOptions]="[25, 50, 100]">
      <sl-pagination-page-size>Rows per page</sl-pagination-page-size>
      <p slPaginationStatus></p>
    </nav>`,
  )}
</div>`,
  }),
};

export const Links: Story = {
  parameters: scenario('links'),
  render: () => ({
    props: { pageUrl: (page: number) => `?page=${page}` },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'itemHref',
    'Every page and every trigger becomes an anchor with a destination, so a middle click opens a page in a tab and the row is crawlable. The trigger at a bound loses its href rather than its place.',
    `
    <nav slPagination [count]="482" [defaultPage]="1" [itemHref]="pageUrl">
      <a slPaginationPrevious></a>
      <sl-pagination-items />
      <a slPaginationNext></a>
    </nav>`,
  )}
</div>`,
  }),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Below 22rem',
    'The same markup in a narrow column. The numbered row gives way to the page summary and the triggers stay, and the viewport never changed — the family measured itself.',
    `<div class="slotted-demo-measure">${numbered('[defaultPage]="7"')}</div>`,
  )}
  ${scene(
    'A cursor paginator, narrow',
    'With no summary to replace it, the range is kept instead: hiding it would leave two chevrons and no sentence at all.',
    `
    <div class="slotted-demo-measure">
      <nav slPagination>
        <button slPaginationPrevious type="button"></button>
        <p slPaginationStatus>First 20 results</p>
        <button slPaginationNext type="button"></button>
      </nav>
    </div>`,
  )}
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'At the first page',
    'First and previous are unavailable and stay where they were, so the row does not reflow under the pointer the moment a reader reaches an end.',
    numbered('[defaultPage]="1" [count]="60"'),
  )}
  ${scene(
    'loading',
    'A page change in flight. Every control refuses, the row keeps its size, the root says aria-busy, and the current chip drops to the disabled palette without losing its shape.',
    numbered('[defaultPage]="3" [count]="60" loading'),
  )}
  ${scene(
    'disabled',
    'The whole paginator taken away by the application, page size included. It stays in the page rather than disappearing, because a control that vanishes is one a reader has to look for.',
    `
    <nav slPagination [count]="60" [defaultPage]="2" disabled>
      <sl-pagination-page-size />
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
    </nav>`,
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Ten thousand pages',
    'Tabular figures and a box at least as wide as it is tall: page 8 942 is the same target as page 9, and stepping between them moves nothing beside them.',
    `
    <nav slPagination [count]="200000" [defaultPage]="8942">
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
      <p slPaginationStatus></p>
    </nav>`,
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'exportAs="slPagination"',
    'The instance in a template. goToPage, next, previous, reset and setPageSize are the moves a consumer cannot express as an input, and nothing else is exposed.',
    `
    <nav slPagination #pager="slPagination" [count]="482" [defaultPage]="12">
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
    </nav>
    <button
      data-ui="button" data-ui-button=""
      data-part="root" data-part-root=""
      data-tone="secondary"
      data-variant="outline"
      data-size="md"
      type="button"
      (click)="pager.reset()"
    >
      <span data-part="label" data-part-label="">Back to the first page</span>
    </button>`,
  )}
  ${scene(
    'Projected wording',
    'The range sentence and the page-size name are projected content, so an application replaces the words without replacing the element or its live region.',
    `
    <nav slPagination [count]="482" [defaultPage]="3">
      <sl-pagination-page-size>Records per page</sl-pagination-page-size>
      <p slPaginationStatus>Showing 41–60 of 482</p>
      <button slPaginationNext type="button"></button>
    </nav>`,
  )}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Tab, Enter, Space',
    'Tab reaches every control in reading order; Enter and Space activate one. The family binds no key of its own, so nothing here surprises a reader who knows the platform.',
    `
    <nav slPagination aria-label="Invoices" [count]="482" [defaultPage]="7">
      <button slPaginationFirst type="button"></button>
      <button slPaginationPrevious type="button"></button>
      <sl-pagination-items />
      <button slPaginationNext type="button"></button>
      <button slPaginationLast type="button"></button>
      <p slPaginationStatus></p>
    </nav>`,
  )}
</div>`,
  }),
};
