import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Pagination } from './pagination';
import { PaginationEllipsis } from './pagination-ellipsis';
import { PaginationItem } from './pagination-item';
import { PaginationList } from './pagination-list';
import { PaginationPage } from './pagination-page';
import { REACT_PAGINATION_DOCS, REACT_PAGINATION_TOKENS } from './pagination.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Pagination',
        description: 'Moving across pages of results, one page at a time or by number.',
        framework: 'React',
        ...REACT_PAGINATION_DOCS.pagination,
        tokens: REACT_PAGINATION_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function Pages() {
  const [page, setPage] = useState(1);
  const last = 9;

  return (
    <Pagination>
      <PaginationList>
        <PaginationItem>
          <PaginationPage disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </PaginationPage>
        </PaginationItem>
        {[1, 2, 3].map((number) => (
          <PaginationItem key={number}>
            <PaginationPage current={page === number} onClick={() => setPage(number)}>
              {number}
            </PaginationPage>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationPage current={page === last} onClick={() => setPage(last)}>
            {last}
          </PaginationPage>
        </PaginationItem>
        <PaginationItem>
          <PaginationPage disabled={page === last} onClick={() => setPage(page + 1)}>
            Next
          </PaginationPage>
        </PaginationItem>
      </PaginationList>
    </Pagination>
  );
}

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: () => (
    <div className="slotted-demo-measure">
      <Pages />
    </div>
  ),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">First page</span>
          <span className="slotted-demo-scene__note">Previous is disabled, not removed.</span>
        </header>
        <div className="slotted-demo-stage">
          <Pagination aria-label="Results, first page">
            <PaginationList>
              <PaginationItem>
                <PaginationPage disabled>Previous</PaginationPage>
              </PaginationItem>
              <PaginationItem>
                <PaginationPage current>1</PaginationPage>
              </PaginationItem>
              <PaginationItem>
                <PaginationPage>2</PaginationPage>
              </PaginationItem>
              <PaginationItem>
                <PaginationPage>Next</PaginationPage>
              </PaginationItem>
            </PaginationList>
          </Pagination>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Middle</span>
          <span className="slotted-demo-scene__note">Both ends reachable, one page marked.</span>
        </header>
        <div className="slotted-demo-stage">
          <Pagination aria-label="Results, middle page">
            <PaginationList>
              <PaginationItem>
                <PaginationPage>Previous</PaginationPage>
              </PaginationItem>
              <PaginationItem>
                <PaginationPage>1</PaginationPage>
              </PaginationItem>
              <PaginationItem>
                <PaginationPage current>2</PaginationPage>
              </PaginationItem>
              <PaginationItem>
                <PaginationPage>Next</PaginationPage>
              </PaginationItem>
            </PaginationList>
          </Pagination>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <Pagination aria-label="Results, addressed pages">
        <PaginationList>
          <PaginationItem>
            <PaginationPage render={(props) => <a {...props} href="?page=1" />}>1</PaginationPage>
          </PaginationItem>
          <PaginationItem>
            <PaginationPage current render={(props) => <a {...props} href="?page=2" />}>
              2
            </PaginationPage>
          </PaginationItem>
          <PaginationItem>
            <PaginationPage render={(props) => <a {...props} href="?page=3" />}>3</PaginationPage>
          </PaginationItem>
        </PaginationList>
      </Pagination>
      <p>
        These pages have addresses, so they are links: a reader can bookmark page two and open page
        three in a new tab, neither of which a button allows.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <h2 id="pagination-a11y-heading">Invoices</h2>
        <Pagination aria-labelledby="pagination-a11y-heading">
          <PaginationList>
            <PaginationItem>
              <PaginationPage disabled>Previous</PaginationPage>
            </PaginationItem>
            <PaginationItem>
              <PaginationPage current>1</PaginationPage>
            </PaginationItem>
            <PaginationItem>
              <PaginationPage>2</PaginationPage>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationPage>9</PaginationPage>
            </PaginationItem>
            <PaginationItem>
              <PaginationPage>Next</PaginationPage>
            </PaginationItem>
          </PaginationList>
        </Pagination>
        <p>
          The landmark takes its name from the heading, so the default label steps aside. Previous
          is disabled rather than removed, which keeps the row the same length as the reader moves
          through it, and the gap is hidden because it goes nowhere.
        </p>
      </div>
    </div>
  ),
};
