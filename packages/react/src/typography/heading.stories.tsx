import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Heading } from './heading';
import { HeadingLevel } from './heading-level';
import { Text } from './text';
import { REACT_TYPOGRAPHY_DOCS, REACT_TYPOGRAPHY_TOKENS } from './typography.docs';
import type { HeadingLevelValue } from './typography.types';

const LEVELS: readonly HeadingLevelValue[] = [1, 2, 3, 4, 5, 6];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Levels as never,
});

const meta = {
  title: 'Components/Heading',
  component: Heading,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Heading',
        description: 'A rank in the document outline, and a size on the page.',
        framework: 'React',
        ...REACT_TYPOGRAPHY_DOCS.heading,
        tokens: REACT_TYPOGRAPHY_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: 'Billing and invoices for the current workspace', level: 2 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Heading {...args} />
    </div>
  ),
};

export const Levels: Story = {
  parameters: scenario('levels'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Rank and size</span>
          <span className="slotted-demo-scene__note">
            The size follows the rank until it is asked for separately. The last row is a second
            rank that reads at body size.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            {LEVELS.map((level) => (
              <Heading key={level} level={level}>
                Level {level}
              </Heading>
            ))}
            <Heading level={2} size="md">
              Level 2, at the body size
            </Heading>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Hierarchy: Story = {
  parameters: scenario('hierarchy'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Heading>Billing</Heading>
        <Text size="sm" tone="muted">
          No section around it, so this is the first rank.
        </Text>
        <HeadingLevel>
          <Heading>Invoices</Heading>
          <Text size="sm" tone="muted">
            One section deeper, so the heading is a level two. Nothing was passed to it.
          </Text>
          <HeadingLevel>
            <Heading>History</Heading>
            <Text size="sm" tone="muted">
              Two deep, so a level three. Nesting steps by one, which is why an inferred rank cannot
              skip.
            </Text>
          </HeadingLevel>
        </HeadingLevel>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Heading id="payment-method" level={2}>
          Payment method
        </Heading>
        <Text render={(props) => <p {...props} />} size="sm" tone="muted">
          The rank is the element, so the outline a screen reader announces is the one the page has.
          The identifier is a native attribute, which is what an anchor to this section needs.
        </Text>
        <Heading level={3} size="sm" transform="uppercase">
          A quiet third rank
        </Heading>
        <Text render={(props) => <p {...props} />} size="sm" tone="muted">
          Size and rank are separate props: a heading may read quietly and still hold its place in
          the outline.
        </Text>
      </div>
    </div>
  ),
};
