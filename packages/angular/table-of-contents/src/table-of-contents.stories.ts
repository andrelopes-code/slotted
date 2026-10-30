import { nestOutline } from '@slotted/core/outline';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderHeading,
  SlPageHeaderSubheading,
  SlPageHeaderTabs,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlSplitter } from '@slotted/angular/splitter';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import type { ChangeRequest } from '@slotted/core/state';

import {
  SlTableOfContents,
  SlTableOfContentsLabel,
  SlTableOfContentsLink,
} from './table-of-contents';
import {
  CONTRACT_ITEMS,
  CUSTOMER_ITEMS,
  SlTocContractDemo,
  SlTocCustomerDemo,
  SlTocCustomerStickyDemo,
  SlTocPolicyDemo,
} from './table-of-contents-demo';
import { provideTableOfContentsDefaults } from './table-of-contents-defaults';
import type {
  TableOfContentsHistory,
  TableOfContentsLayout,
  TableOfContentsSize,
} from './table-of-contents-defaults';
import {
  ANGULAR_TABLE_OF_CONTENTS_DOCS,
  ANGULAR_TABLE_OF_CONTENTS_TOKENS,
} from './table-of-contents.docs';

interface TableOfContentsStoryArgs {
  history: TableOfContentsHistory;
  label: string;
  layout: TableOfContentsLayout;
  numbered: boolean;
  size: TableOfContentsSize;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TABLE_OF_CONTENTS_DOCS.tableOfContents.scenes, {
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
  }) as never;

/** The page holds the value and the list asks. */
@Component({
  selector: 'sl-toc-controlled-demo',
  standalone: true,
  imports: [SlStack, SlTableOfContents, SlText],
  template: `
    <div slStack [gap]="4">
      <nav slTableOfContents [items]="items" [(value)]="section"></nav>
      <p slText size="sm" tone="muted">The page keeps: {{ section() ?? 'none' }}</p>
    </div>
  `,
})
class ControlledDemo {
  readonly items = CUSTOMER_ITEMS;
  readonly section = signal<string | null>('enderecos');
}

/** The URL policy, chosen live. */
@Component({
  selector: 'sl-toc-history-demo',
  standalone: true,
  imports: [SlSegment, SlSegmentedControl, SlStack, SlTableOfContents, SlTocCustomerDemo],
  template: `
    <div class="slotted-demo-viewport" data-size="tall">
      <div class="slotted-demo-workspace">
        <div class="slotted-demo-workspace__region">
          <div slStack [gap]="5">
            <div
              slSegmentedControl
              aria-label="What a click does to the URL"
              size="sm"
              [value]="history()"
              (valueChange)="choose($event)"
            >
              <button slSegment value="push">push</button>
              <button slSegment value="replace">replace</button>
              <button slSegment value="none">none</button>
            </div>
            <nav slTableOfContents [items]="items" label="On this page" [history]="history()"></nav>
          </div>
        </div>
        <div class="slotted-demo-workspace__body"><sl-toc-customer-demo /></div>
      </div>
    </div>
  `,
})
class HistoryDemo {
  readonly items = CUSTOMER_ITEMS;
  readonly history = signal<TableOfContentsHistory>('replace');
  choose(request: ChangeRequest<string | undefined>) {
    this.history.set((request.value ?? 'push') as TableOfContentsHistory);
  }
}

/** Under a provider, and one list that states its own step. */
@Component({
  selector: 'sl-toc-defaults-demo',
  standalone: true,
  imports: [SlTableOfContents],
  providers: [
    provideTableOfContentsDefaults({
      history: 'replace',
      numbered: true,
      size: 'sm',
    }),
  ],
  template: `
    <div class="slotted-demo-grid" data-columns="2">
      <section class="slotted-demo-scene">
        <header class="slotted-demo-scene__header">
          <span class="slotted-demo-scene__label">from the provider</span>
          <span class="slotted-demo-scene__note"
            >Small, numbered, replacing the URL — none of it stated here. The name comes from the
            language in force.</span
          >
        </header>
        <div class="slotted-demo-stage" data-layout="block">
          <nav slTableOfContents [items]="items" value="enderecos"></nav>
        </div>
      </section>
      <section class="slotted-demo-scene">
        <header class="slotted-demo-scene__header">
          <span class="slotted-demo-scene__label">the list wins</span>
          <span class="slotted-demo-scene__note"
            >The same provider, and a list that states lg and no numbers for itself.</span
          >
        </header>
        <div class="slotted-demo-stage" data-layout="block">
          <nav
            slTableOfContents
            [items]="items"
            [numbered]="false"
            size="lg"
            value="enderecos"
          ></nav>
        </div>
      </section>
    </div>
  `,
})
class DefaultsDemo {
  readonly items = CUSTOMER_ITEMS.slice(0, 3);
}

const DIRECTIVES = [
  ControlledDemo,
  DefaultsDemo,
  HistoryDemo,
  SlButton,
  SlPage,
  SlPageBody,
  SlPageHeader,
  SlPageHeaderActions,
  SlPageHeaderArea,
  SlPageHeaderContent,
  SlPageHeaderHeading,
  SlPageHeaderSubheading,
  SlPageHeaderTabs,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
  SlSplitter,
  SlStack,
  SlTableOfContents,
  SlTableOfContentsLabel,
  SlTableOfContentsLink,
  SlText,
  SlTocContractDemo,
  SlTocCustomerDemo,
  SlTocCustomerStickyDemo,
  SlTocPolicyDemo,
];

const meta: Meta<TableOfContentsStoryArgs> = {
  title: 'Components/TableOfContents',
  component: SlTableOfContents,
  decorators: [moduleMetadata({ imports: DIRECTIVES })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Table of contents',
        description:
          'A list of links into the document the reader is in, with the link of the place in view marked. A column beside a record, a bar under a page title, or a phone’s trigger — over one anatomy and one state model — that reads where the page’s chrome ends, scrolls a section under it, and lands focus on it.',
        framework: 'Angular',
        ...ANGULAR_TABLE_OF_CONTENTS_DOCS.tableOfContents,
        tokens: ANGULAR_TABLE_OF_CONTENTS_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TableOfContentsStoryArgs>;

const scene = (label: string, note: string, body: string, layout = 'block') => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/** A column beside a document: the list in the region, the document in the body. */
const workspace = (aside: string, body: string, size = 'screen') => `
  <div class="slotted-demo-viewport" data-size="${size}">
    <div class="slotted-demo-workspace">
      <div class="slotted-demo-workspace__region">${aside}</div>
      <div class="slotted-demo-workspace__body">${body}</div>
    </div>
  </div>`;

const viewport = (body: string, size = 'screen') =>
  `<div class="slotted-demo-viewport" data-layout="page" data-scroll data-size="${size}">${body}</div>`;

const SHORT = CUSTOMER_ITEMS.slice(0, 3);

const FLAT_OUTLINE = [
  { id: 'general-details', label: 'General details', level: 2 },
  { id: 'addresses', label: 'Addresses', level: 2 },
  { id: 'billing', label: 'Billing', level: 3 },
  { id: 'delivery', label: 'Delivery', level: 3 },
  { id: 'contacts', label: 'Contacts', level: 2 },
  { id: 'terms', label: 'Commercial terms', level: 2 },
  { id: 'payment-terms', label: 'Payment terms', level: 3 },
  { id: 'credit-limit', label: 'Credit limit', level: 3 },
  { id: 'invoices', label: 'Invoices', level: 2 },
  { id: 'support', label: 'Support', level: 2 },
];

const LONG_ITEMS = [
  { id: 'scope', label: 'Scope of application and definitions used in this document' },
  {
    id: 'return-periods',
    label: 'Return periods by product category',
    children: [
      { id: 'ref', label: 'REF-2026-09-16-INDUSTRIAL-RETURN-000482915' },
      { id: 'perishables', label: 'Perishables' },
    ],
  },
  { id: 'rtl', label: 'سياسة الإرجاع والاسترداد' },
  { id: 'exceptions', label: 'Exceptions' },
];

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
  render: (args) => ({
    props: { ...args, items: CUSTOMER_ITEMS },
    template: workspace(
      `<nav
        slTableOfContents
        [items]="items"
        [history]="history"
        [label]="label"
        [layout]="layout"
        [numbered]="numbered"
        [size]="size"
      ></nav>`,
      '<sl-toc-customer-demo />',
    ),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    props: { items: CUSTOMER_ITEMS, section: signal<string | null>('enderecos') },
    template: workspace(
      `<nav slTableOfContents [items]="items" [(value)]="section">
        <ng-template slTableOfContentsLabel>On this page</ng-template>
      </nav>`,
      '<sl-toc-customer-demo />',
      'tall',
    ),
  }),
};

export const Source: Story = {
  parameters: scenario('source'),
  render: () => ({
    template: workspace(
      `<nav slTableOfContents label="Neste artigo" [source]="article"></nav>`,
      '<div #article><sl-toc-policy-demo /></div>',
    ),
  }),
};

export const Items: Story = {
  parameters: scenario('items'),
  render: () => ({
    props: { items: nestOutline(FLAT_OUTLINE) },
    template: workspace(
      `<nav slTableOfContents [items]="items" label="On this page"></nav>`,
      '<sl-toc-customer-demo />',
      'tall',
    ),
  }),
};

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => ({
    props: { items: CUSTOMER_ITEMS },
    template: viewport(`
      <div slPage>
        <div slPageBody>
          <div class="slotted-demo-grid" data-columns="2">
            <nav slTableOfContents [items]="items" label="On this page" sticky></nav>
            <sl-toc-customer-demo />
          </div>
        </div>
      </div>`),
  }),
};

export const Horizontal: Story = {
  parameters: scenario('horizontal'),
  render: () => ({
    props: { items: CUSTOMER_ITEMS },
    template: viewport(`
      <div slPage>
        <header slPageHeader>
          <div slPageHeaderTitleArea>
            <div slPageHeaderTitleRow>
              <div slPageHeaderTitle>
                <h1 slPageHeaderHeading>Aurora Distribution Co.</h1>
                <p slPageHeaderSubheading>Customer · EIN 12-3456789</p>
              </div>
              <div slPageHeaderActions>
                <button slButton size="sm" tone="accent">Nova encomenda</button>
              </div>
            </div>
          </div>
          <div slPageHeaderArea>
            <div slPageHeaderContent>
              <p slText size="sm" tone="muted">
                Grocery retail · 14 stores · account manager Rita Sanders · last order
                September 12, 2026
              </p>
            </div>
          </div>
          <div slPageHeaderTabs>
            <nav slTableOfContents aria-label="Customer sections" [items]="items" layout="horizontal"></nav>
          </div>
        </header>
        <div slPageBody><sl-toc-customer-sticky-demo /></div>
      </div>`),
  }),
};

export const Collapsed: Story = {
  parameters: scenario('collapsed'),
  render: () => ({
    props: { items: CUSTOMER_ITEMS },
    template: `<div class="slotted-demo-room" data-room="phone">${viewport(
      `<div slPage>
        <div slPageBody>
          <div slStack [gap]="6">
            <nav slTableOfContents [items]="items" label="On this page" layout="collapsed"></nav>
            <sl-toc-customer-demo />
          </div>
        </div>
      </div>`,
      'tall',
    )}</div>`,
  }),
};

export const Numbered: Story = {
  parameters: scenario('numbered'),
  render: () => ({
    props: { items: CONTRACT_ITEMS },
    template: workspace(
      `<nav slTableOfContents [items]="items" label="Clauses" numbered></nav>`,
      '<sl-toc-contract-demo />',
    ),
  }),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    props: { items: SHORT },
    template: grid(
      3,
      scene(
        'sm',
        'The row of a small toolbar: 30 pixels at comfortable, 24 at dense.',
        `<nav slTableOfContents [items]="items" label="On this page" size="sm" value="addresses"></nav>`,
      ) +
        scene(
          'md',
          'The default, on the same step as a text field beside it.',
          `<nav slTableOfContents [items]="items" label="On this page" size="md" value="addresses"></nav>`,
        ) +
        scene(
          'lg',
          'The step a page title is read at; the inset grows with the type.',
          `<nav slTableOfContents [items]="items" label="On this page" size="lg" value="addresses"></nav>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { items: SHORT },
    template: grid(
      2,
      scene(
        'rest, hover, current',
        'The page holds the value and the list asks. Hover a link that is not current: the ink darkens and the row keeps its place.',
        '<sl-toc-controlled-demo />',
      ) +
        scene(
          'focus-visible',
          'Tab into the list: the ring is drawn inside the row, two pixels in, so it never crosses the track or leaves the column.',
          `<nav slTableOfContents [items]="items" label="On this page" value="general-details"></nav>`,
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { long: LONG_ITEMS, items: CUSTOMER_ITEMS },
    template: grid(
      2,
      scene(
        'the column wraps',
        'Eleven words on three lines and an unbroken reference broken inside itself; the marker measures the row it lands on, however tall.',
        `<div class="slotted-demo-measure">
          <nav slTableOfContents [items]="long" label="Returns policy" value="return-periods"></nav>
        </div>`,
      ) +
        scene(
          'the bar scrolls',
          'Seven sections in a phone’s width: the line scrolls sideways, the edge fades where it continues, and the current link is brought into view.',
          `<div class="slotted-demo-room" data-room="phone">
            <nav slTableOfContents aria-label="Sections" [items]="items" layout="horizontal" value="invoices"></nav>
          </div>`,
        ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    props: { none: [] },
    template: grid(
      2,
      scene(
        'loading',
        'Four rows of skeleton with an item’s geometry, under the title, while the record is fetched.',
        `<nav slTableOfContents [items]="none" label="On this page" loading></nav>`,
      ) +
        scene(
          'empty',
          'The record arrived with no sections. The list draws nothing — not even its title — because a title over nothing is a broken column.',
          `<nav slTableOfContents [items]="none" label="On this page"></nav>
          <p slText size="sm" tone="muted">(nothing is drawn above this line)</p>`,
        ),
    ),
  }),
};

export const History: Story = {
  parameters: scenario('history'),
  render: () => ({ template: '<sl-toc-history-demo />' }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => ({ template: '<sl-toc-defaults-demo />' }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { items: CUSTOMER_ITEMS },
    template: `
      <div class="slotted-demo-viewport" data-size="screen">
        <div class="slotted-demo-workspace">
          <aside #region class="slotted-demo-workspace__region">
            <nav slTableOfContents [items]="items" label="On this page">
              <ng-template slTableOfContentsLink let-entry let-current="current">
                <span slText [weight]="current ? 'semibold' : 'regular'">{{ entry.label }}</span>
              </ng-template>
            </nav>
          </aside>
          <div slSplitter aria-label="Index width" [for]="region" [max]="0.45" min="180px" [value]="0.26"></div>
          <main class="slotted-demo-workspace__body"><sl-toc-customer-demo /></main>
        </div>
      </div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { items: CUSTOMER_ITEMS },
    template: workspace(
      `<div slStack [gap]="5">
        <button slButton size="sm" variant="outline" (click)="list.focus()">Focus the index</button>
        <nav slTableOfContents #list="slTableOfContents" [items]="items" label="On this page"></nav>
      </div>`,
      '<sl-toc-customer-demo />',
      'tall',
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { items: CUSTOMER_ITEMS },
    template: workspace(
      `<nav slTableOfContents [items]="items" label="On this page"></nav>`,
      '<sl-toc-customer-demo />',
      'tall',
    ),
  }),
};
