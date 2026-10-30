import { nestOutline } from '@slotted/core/outline';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Page, PageBody } from '../page';
import { Viewport } from '../page/page-demo';
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderArea,
  PageHeaderContent,
  PageHeaderHeading,
  PageHeaderSubheading,
  PageHeaderTabs,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from '../page-header';
import { Segment, SegmentedControl } from '../segmented-control';
import { Splitter } from '../splitter';
import { Stack } from '../stack';
import { Text } from '../typography';
import { TableOfContents } from './table-of-contents';
import {
  CONTRACT_ITEMS,
  ContractClauses,
  CUSTOMER_ITEMS,
  CustomerSections,
  PolicyArticle,
  Workspace,
} from './table-of-contents-demo';
import { TableOfContentsDefaultsProvider } from './table-of-contents-defaults';
import {
  TableOfContentsGroup,
  TableOfContentsItem,
  TableOfContentsLink,
} from './table-of-contents-parts';
import {
  REACT_TABLE_OF_CONTENTS_DOCS,
  REACT_TABLE_OF_CONTENTS_TOKENS,
} from './table-of-contents.docs';
import type { TableOfContentsHandle, TableOfContentsHistory } from './table-of-contents.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TABLE_OF_CONTENTS_DOCS.tableOfContents.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    source: Source,
    items: Items,
    sticky: Sticky,
    horizontal: Horizontal,
    collapsed: Collapsed,
    numbered: Numbered,
    size: Size,
    states: States,
    content: Content,
    loading: Loading,
    history: History,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  });

const meta = {
  title: 'Components/TableOfContents',
  component: TableOfContents,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Table of contents',
        description:
          'A list of links into the document the reader is in, with the link of the place in view marked. A column beside a record, a bar under a page title, or a phone’s trigger — over one anatomy and one state model — that reads where the page’s chrome ends, scrolls a section under it, and lands focus on it.',
        framework: 'React',
        ...REACT_TABLE_OF_CONTENTS_DOCS.tableOfContents,
        tokens: REACT_TABLE_OF_CONTENTS_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    history: 'push',
    label: 'On this page',
    layout: 'vertical',
    numbered: false,
    size: 'md',
  },
  argTypes: {
    history: { control: 'select', options: ['push', 'replace', 'none'] },
    layout: { control: 'select', options: ['vertical', 'horizontal', 'collapsed'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Workspace aside={<TableOfContents {...args} items={CUSTOMER_ITEMS} />}>
      <CustomerSections />
    </Workspace>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Workspace
      aside={
        <TableOfContents label="On this page">
          <TableOfContentsItem value="dados-gerais">
            <TableOfContentsLink>General information</TableOfContentsLink>
          </TableOfContentsItem>
          <TableOfContentsItem value="enderecos">
            <TableOfContentsLink>Addresses</TableOfContentsLink>
            <TableOfContentsGroup>
              <TableOfContentsItem value="faturacao">
                <TableOfContentsLink>Billing</TableOfContentsLink>
              </TableOfContentsItem>
              <TableOfContentsItem value="shipping">
                <TableOfContentsLink>Shipping</TableOfContentsLink>
              </TableOfContentsItem>
            </TableOfContentsGroup>
          </TableOfContentsItem>
          <TableOfContentsItem value="contactos">
            <TableOfContentsLink>Contactos</TableOfContentsLink>
          </TableOfContentsItem>
          <TableOfContentsItem value="condicoes">
            <TableOfContentsLink>Commercial terms</TableOfContentsLink>
            <TableOfContentsGroup>
              <TableOfContentsItem value="payment-terms">
                <TableOfContentsLink>Payment terms</TableOfContentsLink>
              </TableOfContentsItem>
              <TableOfContentsItem value="credit-limit">
                <TableOfContentsLink>Credit limit</TableOfContentsLink>
              </TableOfContentsItem>
            </TableOfContentsGroup>
          </TableOfContentsItem>
          <TableOfContentsItem value="invoices">
            <TableOfContentsLink>Invoices</TableOfContentsLink>
          </TableOfContentsItem>
          <TableOfContentsItem value="support">
            <TableOfContentsLink>Suporte</TableOfContentsLink>
          </TableOfContentsItem>
        </TableOfContents>
      }
      size="tall"
    >
      <CustomerSections />
    </Workspace>
  ),
};

function FromArticle() {
  const article = useRef<HTMLElement>(null);
  return (
    <Workspace aside={<TableOfContents label="Neste artigo" source={article} />}>
      <div ref={article as React.RefObject<HTMLDivElement>}>
        <PolicyArticle />
      </div>
    </Workspace>
  );
}

export const Source: Story = {
  parameters: scenario('source'),
  render: () => <FromArticle />,
};

const FLAT_OUTLINE = [
  { id: 'dados-gerais', label: 'General information', level: 2 },
  { id: 'addresses', label: 'Addresses', level: 2 },
  { id: 'billing', label: 'Billing', level: 3 },
  { id: 'shipping', label: 'Shipping', level: 3 },
  { id: 'contacts', label: 'Contacts', level: 2 },
  { id: 'commercial-terms', label: 'Commercial terms', level: 2 },
  { id: 'payment-terms', label: 'Payment terms', level: 3 },
  { id: 'credit-limit', label: 'Credit limit', level: 3 },
  { id: 'invoices', label: 'Invoices', level: 2 },
  { id: 'support', label: 'Support', level: 2 },
];

export const Items: Story = {
  parameters: scenario('items'),
  render: () => (
    <Workspace
      aside={<TableOfContents items={nestOutline(FLAT_OUTLINE)} label="On this page" />}
      size="tall"
    >
      <CustomerSections />
    </Workspace>
  ),
};

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => (
    <Viewport>
      <Page>
        <PageBody>
          <div className="slotted-demo-grid" data-columns="2">
            <TableOfContents items={CUSTOMER_ITEMS} label="On this page" sticky />
            <CustomerSections />
          </div>
        </PageBody>
      </Page>
    </Viewport>
  ),
};

export const Horizontal: Story = {
  parameters: scenario('horizontal'),
  render: () => (
    <Viewport>
      <Page>
        <PageHeader>
          <PageHeaderTitleArea>
            <PageHeaderTitleRow>
              <PageHeaderTitle>
                <PageHeaderHeading>Aurora Distribution Inc.</PageHeaderHeading>
                <PageHeaderSubheading>Customer · EIN 12-3456789</PageHeaderSubheading>
              </PageHeaderTitle>
              <PageHeaderActions>
                <Button size="sm" tone="accent">
                  Nova encomenda
                </Button>
              </PageHeaderActions>
            </PageHeaderTitleRow>
          </PageHeaderTitleArea>
          <PageHeaderArea>
            <PageHeaderContent>
              <Text size="sm" tone="muted">
                Grocery retail · 14 stores · account manager Rachel Sullivan · last order September
                12, 2026
              </Text>
            </PageHeaderContent>
          </PageHeaderArea>
          <PageHeaderTabs>
            <TableOfContents
              aria-label="Customer sections"
              items={CUSTOMER_ITEMS}
              layout="horizontal"
            />
          </PageHeaderTabs>
        </PageHeader>
        <PageBody>
          <CustomerSections sticky />
        </PageBody>
      </Page>
    </Viewport>
  ),
};

export const Collapsed: Story = {
  parameters: scenario('collapsed'),
  render: () => (
    <div className="slotted-demo-room" data-room="phone">
      <Viewport size="tall">
        <Page>
          <PageBody>
            <Stack gap={6}>
              <TableOfContents items={CUSTOMER_ITEMS} label="On this page" layout="collapsed" />
              <CustomerSections />
            </Stack>
          </PageBody>
        </Page>
      </Viewport>
    </div>
  ),
};

export const Numbered: Story = {
  parameters: scenario('numbered'),
  render: () => (
    <Workspace aside={<TableOfContents items={CONTRACT_ITEMS} label="Clauses" numbered />}>
      <ContractClauses />
    </Workspace>
  ),
};

const SHORT = CUSTOMER_ITEMS.slice(0, 3);

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="sm"
        note="The row of a small toolbar: 30 pixels at comfortable, 24 at dense."
        layout="block"
      >
        <TableOfContents items={SHORT} label="On this page" size="sm" value="enderecos" />
      </Scene>
      <Scene
        label="md"
        note="The default, on the same step as a text field beside it."
        layout="block"
      >
        <TableOfContents items={SHORT} label="On this page" size="md" value="enderecos" />
      </Scene>
      <Scene
        label="lg"
        note="The step a page title is read at; the inset grows with the type."
        layout="block"
      >
        <TableOfContents items={SHORT} label="On this page" size="lg" value="enderecos" />
      </Scene>
    </Grid>
  ),
};

function ControlledCurrent() {
  const [section, setSection] = useState<string | null>('enderecos');
  return (
    <Stack gap={4}>
      <TableOfContents items={CUSTOMER_ITEMS} onValueChange={setSection} value={section} />
      <Text size="sm" tone="muted">
        The page stores: {section ?? 'none'}
      </Text>
    </Stack>
  );
}

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="rest, hover, current"
        note="The page holds the value and the list asks. Hover a link that is not current: the ink darkens and the row keeps its place."
        layout="block"
      >
        <ControlledCurrent />
      </Scene>
      <Scene
        label="focus-visible"
        note="Tab into the list: the ring is drawn inside the row, two pixels in, so it never crosses the track or leaves the column."
        layout="block"
      >
        <TableOfContents items={SHORT} label="On this page" value="dados-gerais" />
      </Scene>
    </Grid>
  ),
};

const LONG_ITEMS = [
  { id: 'ambito', label: 'Scope and definitions used in this document' },
  {
    id: 'prazos-devolucao',
    label: 'Return deadlines by product category',
    children: [
      { id: 'ref', label: 'REF-2026-09-16-INDUSTRIAL-RETURN-000482915' },
      { id: 'pereciveis', label: 'Perishables' },
    ],
  },
  { id: 'rtl', label: 'سياسة الإرجاع والاسترداد' },
  { id: 'excecoes', label: 'Exceptions' },
];

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="the column wraps"
        note="Eleven words on three lines and an unbroken reference broken inside itself; the marker measures the row it lands on, however tall."
        layout="block"
      >
        <Measure>
          <TableOfContents items={LONG_ITEMS} label="Returns policy" value="prazos-devolucao" />
        </Measure>
      </Scene>
      <Scene
        label="the bar scrolls"
        note="Seven sections in a phone’s width: the line scrolls sideways, the edge fades where it continues, and the current link is brought into view."
        layout="block"
      >
        <div className="slotted-demo-room" data-room="phone">
          <TableOfContents
            aria-label="Sections"
            items={CUSTOMER_ITEMS}
            layout="horizontal"
            value="invoices"
          />
        </div>
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="loading"
        note="Four rows of skeleton with an item’s geometry, under the title, while the record is fetched."
        layout="block"
      >
        <TableOfContents items={[]} label="On this page" loading />
      </Scene>
      <Scene
        label="empty"
        note="The record arrived with no sections. The list draws nothing — not even its title — because a title over nothing is a broken column."
        layout="block"
      >
        <TableOfContents items={[]} label="On this page" />
        <Text size="sm" tone="muted">
          (nothing is drawn above this line)
        </Text>
      </Scene>
    </Grid>
  ),
};

function HistoryChoice() {
  const [history, setHistory] = useState<TableOfContentsHistory>('replace');
  return (
    <Workspace
      aside={
        <Stack gap={5}>
          <SegmentedControl
            aria-label="What a click does to the URL"
            onValueChange={(value) => setHistory(value as TableOfContentsHistory)}
            size="sm"
            value={history}
          >
            <Segment value="push">push</Segment>
            <Segment value="replace">replace</Segment>
            <Segment value="none">none</Segment>
          </SegmentedControl>
          <TableOfContents history={history} items={CUSTOMER_ITEMS} label="On this page" />
        </Stack>
      }
      size="tall"
    >
      <CustomerSections />
    </Workspace>
  );
}

export const History: Story = {
  parameters: scenario('history'),
  render: () => <HistoryChoice />,
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <TableOfContentsDefaultsProvider history="replace" numbered size="sm">
      <Grid columns={2}>
        <Scene
          label="from the provider"
          note="Small, numbered, replacing the URL — none of it stated here. The name comes from the language in force."
          layout="block"
        >
          <TableOfContents items={SHORT} value="enderecos" />
        </Scene>
        <Scene
          label="the list wins"
          note="The same provider, and a list that states lg and no numbers for itself."
          layout="block"
        >
          <TableOfContents items={SHORT} numbered={false} size="lg" value="enderecos" />
        </Scene>
      </Grid>
    </TableOfContentsDefaultsProvider>
  ),
};

function Resizable() {
  const region = useRef<HTMLElement>(null);
  return (
    <div className="slotted-demo-viewport" data-size="screen">
      <div className="slotted-demo-workspace">
        <aside
          className="slotted-demo-workspace__region"
          ref={region as React.RefObject<HTMLElement>}
        >
          <TableOfContents label="On this page">
            {CUSTOMER_ITEMS.map((item) => (
              <TableOfContentsItem key={item.id} value={item.id}>
                <TableOfContentsLink render={(props) => <a {...props} data-analytics="toc" />}>
                  {item.label}
                </TableOfContentsLink>
                {item.children ? (
                  <TableOfContentsGroup>
                    {item.children.map((child) => (
                      <TableOfContentsItem key={child.id} value={child.id}>
                        <TableOfContentsLink
                          render={(props) => <a {...props} data-analytics="toc" />}
                        >
                          {child.label}
                        </TableOfContentsLink>
                      </TableOfContentsItem>
                    ))}
                  </TableOfContentsGroup>
                ) : null}
              </TableOfContentsItem>
            ))}
          </TableOfContents>
        </aside>
        <Splitter
          aria-label="Contents width"
          defaultValue={0.26}
          for={region}
          max={0.45}
          min="180px"
        />
        <main className="slotted-demo-workspace__body">
          <CustomerSections />
        </main>
      </div>
    </div>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => <Resizable />,
};

function WithHandle() {
  const list = useRef<TableOfContentsHandle>(null);
  return (
    <Workspace
      aside={
        <Stack gap={5}>
          <Button onClick={() => list.current?.focus()} size="sm" variant="outline">
            Focus the contents
          </Button>
          <TableOfContents items={CUSTOMER_ITEMS} label="On this page" ref={list} />
        </Stack>
      }
      size="tall"
    >
      <CustomerSections />
    </Workspace>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => <WithHandle />,
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Workspace aside={<TableOfContents items={CUSTOMER_ITEMS} label="On this page" />} size="tall">
      <CustomerSections />
    </Workspace>
  ),
};
