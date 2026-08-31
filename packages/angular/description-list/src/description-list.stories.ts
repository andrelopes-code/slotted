import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDescriptionDetails } from './description-details';
import { SlDescriptionList } from './description-list';
import type { DescriptionListOrientation } from './description-list';
import {
  ANGULAR_DESCRIPTION_LIST_DOCS,
  ANGULAR_DESCRIPTION_LIST_TOKENS,
} from './description-list.docs';
import { SlDescriptionTerm } from './description-term';

interface DescriptionListStoryArgs {
  orientation: DescriptionListOrientation;
}

const INVOICE = `
  <dt slDescriptionTerm>Invoice</dt>
  <dd slDescriptionDetails>INV-0042</dd>
  <dt slDescriptionTerm>Issued</dt>
  <dd slDescriptionDetails>1 August 2026</dd>
  <dt slDescriptionTerm>Amount</dt>
  <dd slDescriptionDetails>&pound;1,240.00</dd>`;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta: Meta<DescriptionListStoryArgs> = {
  title: 'Components/DescriptionList',
  component: SlDescriptionList,
  decorators: [
    moduleMetadata({ imports: [SlDescriptionDetails, SlDescriptionList, SlDescriptionTerm] }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'DescriptionList',
        description: 'Terms and their values, laid out without losing the pairing.',
        framework: 'Angular',
        ...ANGULAR_DESCRIPTION_LIST_DOCS.descriptionList,
        tokens: ANGULAR_DESCRIPTION_LIST_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DescriptionListStoryArgs>;

export const Playground: Story = {
  args: { orientation: 'vertical' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <dl slDescriptionList [orientation]="orientation">${INVOICE}
  </dl>
</div>`,
  }),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">vertical</span>
      <span class="slotted-demo-scene__note">The term above its value; survives a narrow column.</span>
    </header>
    <div class="slotted-demo-stage">
      <dl slDescriptionList>${INVOICE}
      </dl>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">horizontal</span>
      <span class="slotted-demo-scene__note">Two columns, with the terms aligned down the start edge.</span>
    </header>
    <div class="slotted-demo-stage">
      <dl slDescriptionList orientation="horizontal">${INVOICE}
      </dl>
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
  <dl slDescriptionList orientation="horizontal">
    <dt slDescriptionTerm>Maintainers</dt>
    <dd slDescriptionDetails>Ada Lovelace</dd>
    <dd slDescriptionDetails>Grace Hopper</dd>
    <dt slDescriptionTerm>Licence</dt>
    <dd slDescriptionDetails>MIT</dd>
  </dl>
  <p>
    Two values under one term is valid HTML and stays under that term here: each part is pinned to
    a column, so the second value cannot take the next term&rsquo;s cell.
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
    <dl slDescriptionList orientation="horizontal">
      <dt slDescriptionTerm>Status</dt>
      <dd slDescriptionDetails>Paid in full on 12 August 2026</dd>
    </dl>
    <p>
      A screen reader reads the term and then its value, because dl, dt and dd say so. Nothing here
      sets a role: the pairing is the platform&rsquo;s, and a role would only restate it.
    </p>
  </div>
</div>`,
  }),
};
