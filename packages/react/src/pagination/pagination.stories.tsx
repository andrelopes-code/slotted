import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pagination, usePagination } from './pagination';
import { PaginationDefaultsProvider } from './pagination-defaults';
import {
  PaginationFirst,
  PaginationItems,
  PaginationLast,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
  PaginationStatus,
} from './pagination-parts';
import { REACT_PAGINATION_DOCS, REACT_PAGINATION_TOKENS } from './pagination.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_PAGINATION_DOCS.pagination.scenes, {
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

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Pagination',
        description:
          'Moving between pages of a collection the consumer owns, in whichever arrangement the page needs.',
        framework: 'React',
        ...REACT_PAGINATION_DOCS.pagination,
        tokens: REACT_PAGINATION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function Scene({
  children,
  label,
  layout = 'stack',
  note,
}: {
  children: React.ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

/** The numbered row a listing page carries, between its four triggers. */
function Row(props: React.ComponentProps<typeof Pagination>) {
  return (
    <Pagination count={482} {...props}>
      <PaginationFirst />
      <PaginationPrevious />
      <PaginationItems />
      <PaginationNext />
      <PaginationLast />
    </Pagination>
  );
}

/** The bar a table carries: a page size, a range and the two triggers. */
function Bar(props: React.ComponentProps<typeof Pagination>) {
  return (
    <Pagination count={482} {...props}>
      <PaginationPageSize />
      <PaginationStatus />
      <PaginationPrevious />
      <PaginationNext />
    </Pagination>
  );
}

export const Playground: Story = {
  args: {
    boundaryCount: 1,
    count: 482,
    defaultPage: 7,
    defaultPageSize: 20,
    disabled: false,
    live: 'polite',
    loading: false,
    siblingCount: 1,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <Pagination {...args}>
        <PaginationFirst />
        <PaginationPrevious />
        <PaginationItems />
        <PaginationNext />
        <PaginationLast />
        <PaginationStatus />
      </Pagination>
    </div>
  ),
};

export const Numbered: Story = {
  parameters: scenario('numbered'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="siblingCount={1} boundaryCount={1}"
        note="The default row: one page at each end, one either side of the current page, and an ellipsis wherever a run was skipped."
      >
        <Row defaultPage={12} />
      </Scene>
      <Scene
        layout="block"
        label="siblingCount={2} boundaryCount={2}"
        note="Wider on both counts. The row is longer but still constant, so it does not change width as the reader walks through the collection."
      >
        <Row boundaryCount={2} defaultPage={12} siblingCount={2} />
      </Scene>
      <Scene
        layout="block"
        label="Near a bound"
        note="At the ends one gap has nothing to hide, so the item it would have taken is spent on another neighbour rather than left empty."
      >
        <Row defaultPage={1} />
      </Scene>
    </div>
  ),
};

export const Cursor: Story = {
  parameters: scenario('cursor'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="No count"
        note="A collection whose total the server does not know. There are no page numbers, no last trigger and no invented total — two controls and a sentence."
      >
        <Pagination>
          <PaginationPrevious />
          <PaginationStatus>Showing the first 20 results</PaginationStatus>
          <PaginationNext />
        </Pagination>
      </Scene>
    </div>
  ),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        layout="block"
        label="The default sentence"
        note="Which items this page holds, in a polite live region. Moving the page re-announces this one sentence and nothing else."
      >
        <Bar defaultPage={7} />
      </Scene>
      <Scene
        layout="block"
        label="messages.range"
        note="The sentence is a message with three numbers in it, so a translated application writes its own order of words rather than reordering strings."
      >
        <Bar defaultPage={7} messages={{ range: '{start}–{end} de {count}' }} />
      </Scene>
      <Scene
        layout="block"
        label="An empty collection"
        note="Nought items is a real answer, not a missing one, and the range says so instead of reading one to nought."
      >
        <Bar count={0} />
      </Scene>
      <Scene
        layout="block"
        label="live='off'"
        note="An application that announces the table itself silences the region here, so the same page change is not read out twice."
      >
        <Bar defaultPage={7} live="off" />
      </Scene>
    </div>
  ),
};

export const PageSize: Story = {
  parameters: scenario('pageSize'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        layout="block"
        label="PaginationPageSize"
        note="A native select wrapped by its own label. Change it and watch the range follow: the first item of the page you were on stays visible."
      >
        <Bar defaultPage={7} />
      </Scene>
      <Scene
        layout="block"
        label="pageSizeOptions"
        note="The sizes offered are the application's, and the visible name beside the control is replaceable per instance."
      >
        <Pagination count={482} pageSizeOptions={[25, 50, 100]}>
          <PaginationPageSize label="Rows per page" />
          <PaginationStatus />
        </Pagination>
      </Scene>
    </div>
  ),
};

export const Links: Story = {
  parameters: scenario('links'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="itemHref"
        note="Every page and every trigger is an anchor with a real destination, so a middle click opens a page in a tab. Hover one and read the status bar."
      >
        <Row defaultPage={3} itemHref={(page) => `/invoices?page=${page}`} />
      </Scene>
      <Scene
        layout="block"
        label="At a bound"
        note="An anchor has no disabled attribute, so an unavailable trigger renders without a destination and says aria-disabled — which also stops the middle click."
      >
        <Row defaultPage={1} itemHref={(page) => `/invoices?page=${page}`} />
      </Scene>
    </div>
  ),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        layout="block"
        label="Wide enough"
        note="Above 22rem of its own inline size the paginator draws the numbered row, and the summary beside it stays out of sight."
      >
        <Row defaultPage={7} />
      </Scene>
      <Scene
        layout="block"
        label="Below the breakpoint"
        note="The same markup in a narrow column: the row gives way to Page 7 of 25 and the triggers stay, because the query measures the family rather than the viewport."
      >
        <div className="slotted-demo-measure">
          <Row defaultPage={7} />
        </div>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="At each bound"
        note="First and Previous are unavailable on page one, Next and Last on the last page. Nothing moves and nothing is removed from the row."
      >
        <Row defaultPage={1} />
      </Scene>
      <Scene
        layout="block"
        label="loading"
        note="A page change in flight. Every control refuses, the row keeps its size so nothing moves under the pointer, and the current chip keeps its shape while losing its accent."
      >
        <Row defaultPage={7} loading />
      </Scene>
      <Scene
        layout="block"
        label="disabled"
        note="The whole paginator taken away, page size included. The current page is still legible, because a reader still needs to know where they are."
      >
        <Bar defaultPage={7} disabled />
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="Ten thousand pages"
        note="Four digits and one digit in the same row. The figures are tabular and the cells hold a minimum width, so walking from 9 to 10 shifts nothing."
      >
        <Row count={200000} defaultPage={8942} />
      </Scene>
      <Scene
        layout="block"
        label="One page"
        note="A collection that fits on a single page still renders, with every trigger unavailable. Whether to hide it is the consumer's decision, not the family's."
      >
        <Row count={12} />
      </Scene>
    </div>
  ),
};

/** Reads the arithmetic out of the family, which is what the hook is for. */
function PageReadout() {
  const pagination = usePagination();
  return (
    <p>
      {`page ${pagination.page} of ${pagination.pages}, items ${pagination.range.start}–${pagination.range.end}`}
    </p>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="Two arrangements"
        note="The row a listing page carries and the bar a table carries are the same family with different parts placed, not two components."
      >
        <Row defaultPage={7} />
        <Bar defaultPage={7} />
      </Scene>
      <Scene
        layout="block"
        label="PaginationDefaultsProvider"
        note="One decision for every paginator below it: how wide the row is, and how many rows a page holds by default. The words come from the language in force."
      >
        <PaginationDefaultsProvider siblingCount={2}>
          <Row defaultPage={12} />
        </PaginationDefaultsProvider>
      </Scene>
      <Scene
        layout="block"
        label="usePagination()"
        note="The arithmetic a prop cannot express, for a control of your own: the page, the total, and the range this page covers."
      >
        <Pagination count={482} defaultPage={7}>
          <PaginationPrevious />
          <PageReadout />
          <PaginationNext />
        </Pagination>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="Tab, Enter, Space"
        note="Every control is a tab stop in reading order. Tab to Next and press it repeatedly: focus moves to Previous the moment Next becomes unavailable."
      >
        <Row defaultPage={24} />
      </Scene>
    </div>
  ),
};
