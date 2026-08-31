import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { Divider } from '../divider';
import { Card } from './card';
import { CardBody } from './card-body';
import { CardFooter } from './card-footer';
import { CardHeader } from './card-header';
import { REACT_CARD_DOCS, REACT_CARD_TOKENS } from './card.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Anatomy as never,
});

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Card',
        description: 'A bordered surface with a header, a body and a footer, all optional.',
        framework: 'React',
        ...REACT_CARD_DOCS.card,
        tokens: REACT_CARD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Card {...args}>
        <CardHeader>
          <strong>INV-0042</strong>
          <span>Acme Inc.</span>
        </CardHeader>
        <CardBody>Issued on 1 August 2026, due within thirty days.</CardBody>
        <CardFooter>
          <Badge fill="subtle" size="sm" variant="warning">
            Awaiting payment
          </Badge>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">All three</span>
          <span className="slotted-demo-scene__note">Header, body, footer.</span>
        </header>
        <div className="slotted-demo-stage">
          <Card>
            <CardHeader>
              <strong>Header</strong>
            </CardHeader>
            <CardBody>Body</CardBody>
            <CardFooter>Footer</CardFooter>
          </Card>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Body only</span>
          <span className="slotted-demo-scene__note">
            Takes the padding the others would have carried.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Card>
            <CardBody>Body</CardBody>
          </Card>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">No footer</span>
          <span className="slotted-demo-scene__note">The body closes the card instead.</span>
        </header>
        <div className="slotted-demo-stage">
          <Card>
            <CardHeader>
              <strong>Header</strong>
            </CardHeader>
            <CardBody>Body</CardBody>
          </Card>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <Card>
        <CardHeader>
          <strong>Workspace members</strong>
        </CardHeader>
        <Divider decorative />
        <CardBody>
          <div className="slotted-demo-stack">
            <span>Ada Lovelace</span>
            <span>Grace Hopper</span>
          </div>
        </CardBody>
        <Divider decorative />
        <CardFooter>Two of five seats used.</CardFooter>
      </Card>
      <p>
        The rules between regions are Dividers the consumer placed, marked decorative because the
        regions are already separated by their spacing.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Card render={(props) => <article {...props} aria-labelledby="card-a11y-title" />}>
          <CardHeader>
            <h3 id="card-a11y-title">INV-0042</h3>
          </CardHeader>
          <CardBody>Due in thirty days.</CardBody>
        </Card>
        <p>
          The card became an article and takes its accessible name from the heading in its own
          header, so a screen reader can list it as a region worth landing on. A card that sets no
          role and no name is a group of text, which is correct when it is one of many in a list.
        </p>
      </div>
    </div>
  ),
};
