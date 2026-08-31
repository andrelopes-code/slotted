import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DescriptionDetails } from './description-details';
import { DescriptionList } from './description-list';
import {
  REACT_DESCRIPTION_LIST_DOCS,
  REACT_DESCRIPTION_LIST_TOKENS,
} from './description-list.docs';
import { DescriptionTerm } from './description-term';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta = {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'DescriptionList',
        description: 'Terms and their values, laid out without losing the pairing.',
        framework: 'React',
        ...REACT_DESCRIPTION_LIST_DOCS.descriptionList,
        tokens: REACT_DESCRIPTION_LIST_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

const invoice = (
  <>
    <DescriptionTerm>Invoice</DescriptionTerm>
    <DescriptionDetails>INV-0042</DescriptionDetails>
    <DescriptionTerm>Issued</DescriptionTerm>
    <DescriptionDetails>1 August 2026</DescriptionDetails>
    <DescriptionTerm>Amount</DescriptionTerm>
    <DescriptionDetails>£1,240.00</DescriptionDetails>
  </>
);

export const Playground: Story = {
  args: { orientation: 'vertical' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <DescriptionList {...args}>{invoice}</DescriptionList>
    </div>
  ),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">vertical</span>
          <span className="slotted-demo-scene__note">
            The term above its value; survives a narrow column.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <DescriptionList>{invoice}</DescriptionList>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">horizontal</span>
          <span className="slotted-demo-scene__note">
            Two columns, with the terms aligned down the start edge.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <DescriptionList orientation="horizontal">{invoice}</DescriptionList>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <DescriptionList orientation="horizontal">
        <DescriptionTerm>Maintainers</DescriptionTerm>
        <DescriptionDetails>Ada Lovelace</DescriptionDetails>
        <DescriptionDetails>Grace Hopper</DescriptionDetails>
        <DescriptionTerm>Licence</DescriptionTerm>
        <DescriptionDetails>MIT</DescriptionDetails>
      </DescriptionList>
      <p>
        Two values under one term is valid HTML and stays under that term here: each part is pinned
        to a column, so the second value cannot take the next term&rsquo;s cell.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <DescriptionList orientation="horizontal">
          <DescriptionTerm>Status</DescriptionTerm>
          <DescriptionDetails>Paid in full on 12 August 2026</DescriptionDetails>
        </DescriptionList>
        <p>
          A screen reader reads the term and then its value, because dl, dt and dd say so. Nothing
          here sets a role: the pairing is the platform&rsquo;s, and a role would only restate it.
        </p>
      </div>
    </div>
  ),
};
