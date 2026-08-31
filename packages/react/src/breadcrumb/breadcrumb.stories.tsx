import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from '../link';
import { Breadcrumb } from './breadcrumb';
import { BreadcrumbItem } from './breadcrumb-item';
import { BreadcrumbLink } from './breadcrumb-link';
import { BreadcrumbList } from './breadcrumb-list';
import { REACT_BREADCRUMB_DOCS, REACT_BREADCRUMB_TOKENS } from './breadcrumb.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Breadcrumb',
        description: 'The path to the page the reader is on.',
        framework: 'React',
        ...REACT_BREADCRUMB_DOCS.breadcrumb,
        tokens: REACT_BREADCRUMB_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Breadcrumb {...args}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/invoices">Invoices</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink current href="/invoices/42">
              INV-0042
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Marked</span>
          <span className="slotted-demo-scene__note">
            aria-current=&quot;page&quot;, and still a link.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink current href="/invoices">
                  Invoices
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Unmarked</span>
          <span className="slotted-demo-scene__note">
            Every crumb equal: nothing says where you are.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Breadcrumb aria-label="Breadcrumb without a current page">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="/invoices">Invoices</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link external href="https://example.com/status" underline="hover">
              Service status
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink current href="/invoices/42">
              INV-0042
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p>
        A crumb that leaves the application is a Link, not a BreadcrumbLink: it needs the warning
        that it opens a new tab, which the breadcrumb link has no business carrying.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <h2 id="breadcrumb-a11y-heading">Where you are</h2>
        <Breadcrumb aria-labelledby="breadcrumb-a11y-heading">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink current href="/invoices">
                Invoices
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p>
          The landmark takes its name from the heading above it, so the default label steps aside
          and the page does not carry two names for one region. The slashes between crumbs are drawn
          by the stylesheet and are read by nobody.
        </p>
      </div>
    </div>
  ),
};
