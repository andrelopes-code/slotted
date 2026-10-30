import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, ExternalLink } from 'lucide-react';

import { ButtonLink } from './button-link';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';

const ExternalIcon = () => <ExternalLink aria-hidden="true" focusable="false" strokeWidth={1.75} />;
const ArrowIcon = () => <ArrowRight aria-hidden="true" focusable="false" strokeWidth={1.75} />;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta = {
  title: 'Components/Button family/ButtonLink',
  component: ButtonLink,
  args: {
    children: 'Open settings',
    disabled: false,
    fullWidth: false,
    href: '/settings',
    size: 'md',
    tone: 'accent',
    variant: 'solid',
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
        title: 'ButtonLink',
        description: 'Navigation wearing the action surface, on a real anchor.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.buttonLink,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/**
 * The disabled link keeps its place in the tab sequence and loses its
 * destination, so no click of any kind navigates.
 */
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_VARIANTS.map((variant) => (
        <div className="slotted-demo-row" key={variant}>
          <ButtonLink end={<ArrowIcon />} href="/settings" variant={variant}>
            {variant}
          </ButtonLink>
          <ButtonLink disabled end={<ArrowIcon />} href="/settings" variant={variant}>
            Unavailable
          </ButtonLink>
        </div>
      ))}
      <div className="slotted-demo-row">
        <ButtonLink
          end={<ExternalIcon />}
          href="https://example.com"
          rel="noreferrer"
          target="_blank"
        >
          Open the status page
        </ButtonLink>
      </div>
    </div>
  ),
};

/** The router owns the navigation; the family owns only the surface. */
export const RouterIntegration: Story = {
  parameters: scenario('routerIntegration'),
  render: () => (
    <ButtonLink
      end={<ArrowIcon />}
      render={(props) => <a {...props} data-router-link="true" href="/settings" />}
      variant="outline"
    >
      Navigate with the router
    </ButtonLink>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-stack">
      <ButtonLink aria-describedby="settings-help" href="/settings">
        Open settings
      </ButtonLink>
      <span data-ui="visually-hidden" data-ui-visually-hidden="" id="settings-help">
        Opens account settings.
      </span>
      <ButtonLink
        end={<ExternalIcon />}
        href="https://example.com"
        rel="noreferrer"
        target="_blank"
      >
        Documentation
        <span data-ui="visually-hidden" data-ui-visually-hidden="">
          {' '}
          (opens in a new tab)
        </span>
      </ButtonLink>
    </div>
  ),
};
