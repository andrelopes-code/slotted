import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlBadge } from '../../badge/src/badge';
import { SlDivider } from '../../divider/src/divider';
import { SlCard } from './card';
import { SlCardBody } from './card-body';
import { SlCardFooter } from './card-footer';
import { SlCardHeader } from './card-header';
import { ANGULAR_CARD_DOCS, ANGULAR_CARD_TOKENS } from './card.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Anatomy as never,
});

const meta: Meta = {
  title: 'Components/Card',
  component: SlCard,
  decorators: [
    moduleMetadata({
      imports: [SlBadge, SlCard, SlCardBody, SlCardFooter, SlCardHeader, SlDivider],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Card',
        description: 'A bordered surface with a header, a body and a footer, all optional.',
        framework: 'Angular',
        ...ANGULAR_CARD_DOCS.card,
        tokens: ANGULAR_CARD_TOKENS,
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
  <div slCard>
    <div slCardHeader>
      <strong>INV-0042</strong>
      <span>Acme Inc.</span>
    </div>
    <div slCardBody>Issued on 1 August 2026, due within thirty days.</div>
    <div slCardFooter>
      <span slBadge fill="subtle" size="sm" variant="warning">Awaiting payment</span>
    </div>
  </div>
</div>`,
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">All three</span>
      <span class="slotted-demo-scene__note">Header, body, footer.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slCard>
        <div slCardHeader><strong>Header</strong></div>
        <div slCardBody>Body</div>
        <div slCardFooter>Footer</div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Body only</span>
      <span class="slotted-demo-scene__note">Takes the padding the others would have carried.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slCard><div slCardBody>Body</div></div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">No footer</span>
      <span class="slotted-demo-scene__note">The body closes the card instead.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slCard>
        <div slCardHeader><strong>Header</strong></div>
        <div slCardBody>Body</div>
      </div>
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
  <div slCard>
    <div slCardHeader><strong>Workspace members</strong></div>
    <hr slDivider decorative />
    <div slCardBody>
      <div class="slotted-demo-stack">
        <span>Ada Lovelace</span>
        <span>Grace Hopper</span>
      </div>
    </div>
    <hr slDivider decorative />
    <div slCardFooter>Two of five seats used.</div>
  </div>
  <p>
    The rules between regions are Dividers the consumer placed, marked decorative because the
    regions are already separated by their spacing.
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
    <article slCard aria-labelledby="card-a11y-title">
      <div slCardHeader><h3 id="card-a11y-title">INV-0042</h3></div>
      <div slCardBody>Due in thirty days.</div>
    </article>
    <p>
      The card sits on an article and takes its accessible name from the heading in its own header,
      so a screen reader can list it as a region worth landing on. A card that sets no role and no
      name is a group of text, which is correct when it is one of many in a list.
    </p>
  </div>
</div>`,
  }),
};
