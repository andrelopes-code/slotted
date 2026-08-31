import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlLink } from './link';
import type { LinkUnderline } from './link';
import { ANGULAR_LINK_DOCS, ANGULAR_LINK_TOKENS } from './link.docs';

interface LinkStoryArgs {
  content: string;
  external: boolean;
  underline: LinkUnderline;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Underline as never,
});

const meta: Meta<LinkStoryArgs> = {
  title: 'Components/Link',
  component: SlLink,
  decorators: [moduleMetadata({ imports: [SlLink] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Link',
        description:
          'Navigation inside a sentence, underlined by default and honest about where it goes.',
        framework: 'Angular',
        ...ANGULAR_LINK_DOCS.link,
        tokens: ANGULAR_LINK_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<LinkStoryArgs>;

export const Playground: Story = {
  args: { content: 'the terms of service', external: false, underline: 'always' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <p>
    Read <a slLink href="/terms" [external]="external" [underline]="underline">{{ content }}</a>
    before continuing.
  </p>
</div>`,
  }),
};

const underlineScene = (underline: string, note: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${underline}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">
      <a slLink href="/invoices" underline="${underline}">Invoices</a>
    </div>
  </section>`;

export const Underline: Story = {
  parameters: scenario('underline'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${underlineScene('always', 'Prose, where a link has to be recognizable without colour.')}
  ${underlineScene('hover', 'Dense navigation, where a column of underlines is noise.')}
  ${underlineScene('none', 'A link already framed as one by its surroundings.')}
</div>`,
  }),
};

export const External: Story = {
  parameters: scenario('external'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <p>
      The full specification lives at
      <a slLink external href="https://www.w3.org/TR/wai-aria-1.2/">the WAI-ARIA specification</a>.
      Nothing about the link looks different, and a screen reader reads a warning that it leaves
      the page.
    </p>
    <p>
      The wording is an input, so an application in another language reads
      <a slLink external externalHint="(abre numa nova aba)" href="https://www.w3.org/TR/wai-aria-1.2/">a hint of its own</a>.
    </p>
  </div>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">In prose</span>
      <span class="slotted-demo-scene__note">Underlined, and coloured by the theme.</span>
    </header>
    <div class="slotted-demo-stage">
      <p>
        Invoices are archived after seven years. See the
        <a slLink href="/retention">retention policy</a> for the exceptions.
      </p>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">In a list of destinations</span>
      <span class="slotted-demo-scene__note">Underline on hover, so the column reads as one block.</span>
    </header>
    <div class="slotted-demo-stage">
      <nav aria-label="Workspace">
        <div class="slotted-demo-stack">
          <a slLink href="/invoices" underline="hover">Invoices</a>
          <a slLink href="/members" underline="hover">Members</a>
          <a slLink external href="https://example.com/status" underline="hover">Service status</a>
        </div>
      </nav>
    </div>
  </section>
</div>`,
  }),
};
