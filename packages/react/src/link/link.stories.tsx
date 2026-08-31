import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from './link';
import { REACT_LINK_DOCS, REACT_LINK_TOKENS } from './link.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Underline as never,
});

const meta = {
  title: 'Components/Link',
  component: Link,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Link',
        description:
          'Navigation inside a sentence, underlined by default and honest about where it goes.',
        framework: 'React',
        ...REACT_LINK_DOCS.link,
        tokens: REACT_LINK_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: 'the terms of service', external: false, underline: 'always' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <p>
        Read <Link {...args} href="/terms" /> before continuing.
      </p>
    </div>
  ),
};

export const Underline: Story = {
  parameters: scenario('underline'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {(
        [
          ['always', 'Prose, where a link has to be recognizable without colour.'],
          ['hover', 'Dense navigation, where a column of underlines is noise.'],
          ['none', 'A link already framed as one by its surroundings.'],
        ] as const
      ).map(([underline, note]) => (
        <section className="slotted-demo-scene" key={underline}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{underline}</span>
            <span className="slotted-demo-scene__note">{note}</span>
          </header>
          <div className="slotted-demo-stage">
            <Link href="/invoices" underline={underline}>
              Invoices
            </Link>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const External: Story = {
  parameters: scenario('external'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <p>
          The full specification lives at{' '}
          <Link external href="https://www.w3.org/TR/wai-aria-1.2/">
            the WAI-ARIA specification
          </Link>
          . Nothing about the link looks different, and a screen reader reads a warning that it
          leaves the page.
        </p>
        <p>
          The wording is a prop, so an application in another language reads{' '}
          <Link
            external
            externalHint="(abre numa nova aba)"
            href="https://www.w3.org/TR/wai-aria-1.2/"
          >
            a hint of its own
          </Link>
          .
        </p>
      </div>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">In prose</span>
          <span className="slotted-demo-scene__note">Underlined, and coloured by the theme.</span>
        </header>
        <div className="slotted-demo-stage">
          <p>
            Invoices are archived after seven years. See the{' '}
            <Link href="/retention">retention policy</Link> for the exceptions.
          </p>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">In a list of destinations</span>
          <span className="slotted-demo-scene__note">
            Underline on hover, so the column reads as one block.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <nav aria-label="Workspace">
            <div className="slotted-demo-stack">
              <Link href="/invoices" underline="hover">
                Invoices
              </Link>
              <Link href="/members" underline="hover">
                Members
              </Link>
              <Link external href="https://example.com/status" underline="hover">
                Service status
              </Link>
            </div>
          </nav>
        </div>
      </section>
    </div>
  ),
};
