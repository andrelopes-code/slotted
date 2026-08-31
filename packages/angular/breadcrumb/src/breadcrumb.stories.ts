import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlLink } from '../../link/src/link';
import { SlBreadcrumb } from './breadcrumb';
import { SlBreadcrumbItem } from './breadcrumb-item';
import { SlBreadcrumbLink } from './breadcrumb-link';
import { SlBreadcrumbList } from './breadcrumb-list';
import { ANGULAR_BREADCRUMB_DOCS, ANGULAR_BREADCRUMB_TOKENS } from './breadcrumb.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta: Meta = {
  title: 'Components/Breadcrumb',
  component: SlBreadcrumb,
  decorators: [
    moduleMetadata({
      imports: [SlBreadcrumb, SlBreadcrumbItem, SlBreadcrumbLink, SlBreadcrumbList, SlLink],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Breadcrumb',
        description: 'The path to the page the reader is on.',
        framework: 'Angular',
        ...ANGULAR_BREADCRUMB_DOCS.breadcrumb,
        tokens: ANGULAR_BREADCRUMB_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <nav slBreadcrumb>
    <ol slBreadcrumbList>
      <li slBreadcrumbItem><a slBreadcrumbLink href="/">Workspace</a></li>
      <li slBreadcrumbItem><a slBreadcrumbLink href="/invoices">Invoices</a></li>
      <li slBreadcrumbItem><a slBreadcrumbLink current href="/invoices/42">INV-0042</a></li>
    </ol>
  </nav>
</div>`,
  }),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Marked</span>
      <span class="slotted-demo-scene__note">aria-current="page", and still a link.</span>
    </header>
    <div class="slotted-demo-stage">
      <nav slBreadcrumb>
        <ol slBreadcrumbList>
          <li slBreadcrumbItem><a slBreadcrumbLink href="/">Workspace</a></li>
          <li slBreadcrumbItem><a slBreadcrumbLink current href="/invoices">Invoices</a></li>
        </ol>
      </nav>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Unmarked</span>
      <span class="slotted-demo-scene__note">Every crumb equal: nothing says where you are.</span>
    </header>
    <div class="slotted-demo-stage">
      <nav slBreadcrumb aria-label="Breadcrumb without a current page">
        <ol slBreadcrumbList>
          <li slBreadcrumbItem><a slBreadcrumbLink href="/">Workspace</a></li>
          <li slBreadcrumbItem><a slBreadcrumbLink href="/invoices">Invoices</a></li>
        </ol>
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
  <nav slBreadcrumb>
    <ol slBreadcrumbList>
      <li slBreadcrumbItem><a slBreadcrumbLink href="/">Workspace</a></li>
      <li slBreadcrumbItem>
        <a slLink external underline="hover" href="https://example.com/status">Service status</a>
      </li>
      <li slBreadcrumbItem><a slBreadcrumbLink current href="/invoices/42">INV-0042</a></li>
    </ol>
  </nav>
  <p>
    A crumb that leaves the application is a Link, not a BreadcrumbLink: it needs the warning that
    it opens a new tab, which the breadcrumb link has no business carrying.
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
    <h2 id="breadcrumb-a11y-heading">Where you are</h2>
    <nav slBreadcrumb aria-labelledby="breadcrumb-a11y-heading">
      <ol slBreadcrumbList>
        <li slBreadcrumbItem><a slBreadcrumbLink href="/">Workspace</a></li>
        <li slBreadcrumbItem><a slBreadcrumbLink current href="/invoices">Invoices</a></li>
      </ol>
    </nav>
    <p>
      The landmark takes its name from the heading above it, so the default label steps aside and
      the page does not carry two names for one region. The slashes between crumbs are drawn by the
      stylesheet and are read by nobody.
    </p>
  </div>
</div>`,
  }),
};
