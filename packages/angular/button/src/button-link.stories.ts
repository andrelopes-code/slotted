import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideExternalLink } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButtonEnd } from './button-appearance';
import { SlButtonLink } from './button-link';
import {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button.constants';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';

const arrow =
  '<span slButtonEnd><ng-icon aria-hidden="true" name="lucideArrowRight"></ng-icon></span>';
const external =
  '<span slButtonEnd><ng-icon aria-hidden="true" name="lucideExternalLink"></ng-icon></span>';

interface ButtonLinkStoryArgs {
  disabled: boolean;
  fullWidth: boolean;
  href: string;
  label: string;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta: Meta<ButtonLinkStoryArgs> = {
  title: 'Components/Button family/ButtonLink',
  component: SlButtonLink,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlButtonEnd, SlButtonLink],
      providers: [provideIcons({ lucideArrowRight, lucideExternalLink })],
    }),
  ],
  args: {
    disabled: false,
    fullWidth: false,
    href: '/settings',
    label: 'Open settings',
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
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.buttonLink,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template: `<a
      slButtonLink
      [href]="href"
      [tone]="tone"
      [variant]="variant"
      [size]="size"
      [disabled]="disabled"
      [fullWidth]="fullWidth"
    >{{ label }}</a>`,
  }),
};

export default meta;
type Story = StoryObj<ButtonLinkStoryArgs>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/**
 * The disabled link keeps its place in the tab sequence and loses its
 * destination, so no click of any kind navigates.
 */
export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_VARIANTS.map(
      (variant) => `<div class="slotted-demo-row">
        <a slButtonLink href="/settings" variant="${variant}">${variant}${arrow}</a>
        <a slButtonLink href="/settings" variant="${variant}" disabled>Unavailable${arrow}</a>
      </div>`,
    ).join('')}
      <div class="slotted-demo-row">
        <a slButtonLink href="https://example.com" rel="noreferrer" target="_blank">Open the status page${external}</a>
      </div>
    </div>`,
  }),
};

/**
 * The router owns the navigation; the family owns only the surface. A
 * `routerLink` on the same anchor writes the `href` itself, so `[href]` stays
 * unset — the attribute below stands in for it outside a routed application.
 */
export const RouterIntegration: Story = {
  parameters: scenario('routerIntegration'),
  render: () => ({
    template: `<a slButtonLink href="/settings" data-router-link="true" variant="outline">
      Navigate with the router${arrow}
    </a>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<div class="slotted-demo-stack">
      <a slButtonLink href="/settings" aria-describedby="settings-help">Open settings</a>
      <span data-ui="visually-hidden" data-ui-visually-hidden="" id="settings-help">Opens account settings.</span>
      <a slButtonLink href="https://example.com" rel="noreferrer" target="_blank">
        Documentation<span data-ui="visually-hidden" data-ui-visually-hidden=""> (opens in a new tab)</span>${external}
      </a>
    </div>`,
  }),
};
