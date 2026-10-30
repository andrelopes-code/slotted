import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { ButtonGroup } from '../button-group';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { IconButtonLink } from './icon-button-link';

const PreviousIcon = () => <ChevronLeft aria-hidden="true" focusable="false" strokeWidth={1.75} />;
const NextIcon = () => <ChevronRight aria-hidden="true" focusable="false" strokeWidth={1.75} />;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta = {
  title: 'Components/Button family/IconButtonLink',
  component: IconButtonLink,
  args: {
    'aria-label': 'Next record',
    children: <NextIcon />,
    disabled: false,
    href: '/records/2',
    shape: 'square',
    size: 'md',
    tone: 'secondary',
    variant: 'ghost',
  },
  argTypes: {
    size: { control: 'select', options: [...BUTTON_SIZES] },
    tone: { control: 'select', options: [...BUTTON_TONES] },
    variant: { control: 'select', options: [...BUTTON_VARIANTS] },
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'IconButtonLink',
        description: 'An icon-only control that navigates, on a real anchor.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.iconButtonLink,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof IconButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/** A disabled link keeps its place in the tab sequence and loses its destination. */
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_VARIANTS.map((variant) => (
        <div className="slotted-demo-row" key={variant}>
          <IconButtonLink aria-label="Next record" href="/records/2" variant={variant}>
            <NextIcon />
          </IconButtonLink>
          <IconButtonLink aria-label="Next record" disabled href="/records/2" variant={variant}>
            <NextIcon />
          </IconButtonLink>
        </div>
      ))}
    </div>
  ),
};

/** The router owns the navigation; the family owns only the surface. */
export const RouterIntegration: Story = {
  parameters: scenario('routerIntegration'),
  render: () => (
    <ButtonGroup aria-label="Records">
      <IconButtonLink
        aria-label="Previous record"
        render={(props) => <a {...props} data-router-link="true" href="/records/1" />}
      >
        <PreviousIcon />
      </IconButtonLink>
      <IconButtonLink
        aria-label="Next record"
        render={(props) => <a {...props} data-router-link="true" href="/records/3" />}
      >
        <NextIcon />
      </IconButtonLink>
    </ButtonGroup>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <IconButtonLink aria-label="Next record: ENC-4522" href="/records/2" shape="circle">
      <NextIcon />
    </IconButtonLink>
  ),
};
