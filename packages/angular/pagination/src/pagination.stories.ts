import { signal } from '@angular/core';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlPagination } from './pagination';
import { SlPaginationEllipsis } from './pagination-ellipsis';
import { SlPaginationItem } from './pagination-item';
import { SlPaginationList } from './pagination-list';
import { SlPaginationPage } from './pagination-page';
import { ANGULAR_PAGINATION_DOCS, ANGULAR_PAGINATION_TOKENS } from './pagination.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta: Meta = {
  title: 'Components/Pagination',
  component: SlPagination,
  decorators: [
    moduleMetadata({
      imports: [
        SlPagination,
        SlPaginationEllipsis,
        SlPaginationItem,
        SlPaginationList,
        SlPaginationPage,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Pagination',
        description: 'Moving across pages of results, one page at a time or by number.',
        framework: 'Angular',
        ...ANGULAR_PAGINATION_DOCS.pagination,
        tokens: ANGULAR_PAGINATION_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: () => {
    const page = signal(1);
    const last = 9;
    return {
      props: { last, page, pages: [1, 2, 3], go: (next: number) => page.set(next) },
      template: `
<div class="slotted-demo-measure">
  <nav slPagination>
    <ul slPaginationList>
      <li slPaginationItem>
        <button slPaginationPage [disabled]="page() === 1" (click)="go(page() - 1)">Previous</button>
      </li>
      @for (number of pages; track number) {
        <li slPaginationItem>
          <button slPaginationPage [current]="page() === number" (click)="go(number)">
            {{ number }}
          </button>
        </li>
      }
      <li slPaginationItem><span slPaginationEllipsis>&hellip;</span></li>
      <li slPaginationItem>
        <button slPaginationPage [current]="page() === last" (click)="go(last)">{{ last }}</button>
      </li>
      <li slPaginationItem>
        <button slPaginationPage [disabled]="page() === last" (click)="go(page() + 1)">Next</button>
      </li>
    </ul>
  </nav>
</div>`,
    };
  },
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">First page</span>
      <span class="slotted-demo-scene__note">Previous is disabled, not removed.</span>
    </header>
    <div class="slotted-demo-stage">
      <nav slPagination aria-label="Results, first page">
        <ul slPaginationList>
          <li slPaginationItem><button slPaginationPage disabled>Previous</button></li>
          <li slPaginationItem><button slPaginationPage current>1</button></li>
          <li slPaginationItem><button slPaginationPage>2</button></li>
          <li slPaginationItem><button slPaginationPage>Next</button></li>
        </ul>
      </nav>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Middle</span>
      <span class="slotted-demo-scene__note">Both ends reachable, one page marked.</span>
    </header>
    <div class="slotted-demo-stage">
      <nav slPagination aria-label="Results, middle page">
        <ul slPaginationList>
          <li slPaginationItem><button slPaginationPage>Previous</button></li>
          <li slPaginationItem><button slPaginationPage>1</button></li>
          <li slPaginationItem><button slPaginationPage current>2</button></li>
          <li slPaginationItem><button slPaginationPage>Next</button></li>
        </ul>
      </nav>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <nav slPagination aria-label="Results, addressed pages">
    <ul slPaginationList>
      <li slPaginationItem><a slPaginationPage href="?page=1">1</a></li>
      <li slPaginationItem><a slPaginationPage current href="?page=2">2</a></li>
      <li slPaginationItem><a slPaginationPage href="?page=3">3</a></li>
    </ul>
  </nav>
  <p>
    These pages have addresses, so they are links: a reader can bookmark page two and open page
    three in a new tab, neither of which a button allows.
  </p>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <h2 id="pagination-a11y-heading">Invoices</h2>
    <nav slPagination aria-labelledby="pagination-a11y-heading">
      <ul slPaginationList>
        <li slPaginationItem><button slPaginationPage disabled>Previous</button></li>
        <li slPaginationItem><button slPaginationPage current>1</button></li>
        <li slPaginationItem><button slPaginationPage>2</button></li>
        <li slPaginationItem><span slPaginationEllipsis>&hellip;</span></li>
        <li slPaginationItem><button slPaginationPage>9</button></li>
        <li slPaginationItem><button slPaginationPage>Next</button></li>
      </ul>
    </nav>
    <p>
      The landmark takes its name from the heading, so the default label steps aside. Previous is
      disabled rather than removed, which keeps the row the same length as the reader moves through
      it, and the gap is hidden because it goes nowhere.
    </p>
  </div>
</div>`,
  }),
};
