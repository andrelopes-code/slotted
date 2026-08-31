import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './badge';
import { REACT_BADGE_DOCS, REACT_BADGE_TOKENS } from './badge.docs';
import type { BadgeFill, BadgeVariant } from './badge.types';

const VARIANTS: readonly BadgeVariant[] = ['accent', 'secondary', 'success', 'warning', 'danger'];
const FILLS: readonly BadgeFill[] = ['solid', 'outline', 'subtle'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Badge',
        description: 'A short status or count, painted in one of the library tones.',
        framework: 'React',
        ...REACT_BADGE_DOCS.badge,
        tokens: REACT_BADGE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: 'Paid', fill: 'solid', size: 'md', variant: 'secondary' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Badge {...args} />
      </div>
    </div>
  ),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      {FILLS.map((fill) => (
        <section className="slotted-demo-scene" key={fill}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{fill}</span>
            <span className="slotted-demo-scene__note">
              The five tones the library names, in one fill.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-row">
              {VARIANTS.map((variant) => (
                <Badge fill={fill} key={variant} variant={variant}>
                  {variant}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">sm</span>
          <span className="slotted-demo-scene__note">Beside text, inside a dense row.</span>
        </header>
        <div className="slotted-demo-stage">
          <span>
            INV-0042{' '}
            <Badge size="sm" variant="success">
              Paid
            </Badge>
          </span>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">md</span>
          <span className="slotted-demo-scene__note">On its own, as a heading's companion.</span>
        </header>
        <div className="slotted-demo-stage">
          <Badge variant="success">Paid</Badge>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <div className="slotted-demo-row">
          <strong>Quarterly report</strong>
          <Badge fill="outline" size="sm" variant="warning">
            Draft
          </Badge>
        </div>
        <div className="slotted-demo-row">
          <span>Unread</span>
          <Badge aria-label="3 unread messages" size="sm" variant="danger">
            3
          </Badge>
        </div>
        <p>
          The count carries an accessible name of its own, because &ldquo;3&rdquo; on its own tells
          a screen reader user nothing about what there are three of.
        </p>
      </div>
    </div>
  ),
};
