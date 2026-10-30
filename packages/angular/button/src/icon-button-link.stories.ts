import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
  type ButtonShape,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button.constants';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlIconButtonLink } from './icon-button-link';

const next = '<ng-icon aria-hidden="true" name="lucideChevronRight"></ng-icon>';
const previous = '<ng-icon aria-hidden="true" name="lucideChevronLeft"></ng-icon>';

interface IconButtonLinkStoryArgs {
  disabled: boolean;
  href: string;
  label: string;
  shape: ButtonShape;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta: Meta<IconButtonLinkStoryArgs> = {
  title: 'Components/Button family/IconButtonLink',
  component: SlIconButtonLink,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlIconButtonLink],
      providers: [provideIcons({ lucideChevronLeft, lucideChevronRight })],
    }),
  ],
  args: {
    disabled: false,
    href: '/records/2',
    label: 'Next record',
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
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.iconButtonLink,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template: `<a
      slIconButtonLink
      [attr.aria-label]="label"
      [href]="href"
      [shape]="shape"
      [tone]="tone"
      [variant]="variant"
      [size]="size"
      [disabled]="disabled"
    >${next}</a>`,
  }),
};

export default meta;
type Story = StoryObj<IconButtonLinkStoryArgs>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/** A disabled link keeps its place in the tab sequence and loses its destination. */
export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_VARIANTS.map(
      (variant) => `<div class="slotted-demo-row">
        <a slIconButtonLink aria-label="Next record" href="/records/2" variant="${variant}">${next}</a>
        <a slIconButtonLink aria-label="Next record" href="/records/2" variant="${variant}" disabled>${next}</a>
      </div>`,
    ).join('')}
    </div>`,
  }),
};

/**
 * The router owns the navigation; the family owns only the surface. A
 * `routerLink` on the same anchor writes the `href` itself — the attribute
 * below stands in for it outside a routed application.
 */
export const RouterIntegration: Story = {
  parameters: scenario('routerIntegration'),
  render: () => ({
    template: `<div class="slotted-demo-row">
      <a slIconButtonLink aria-label="Previous record" href="/records/1" data-router-link="true">${previous}</a>
      <a slIconButtonLink aria-label="Next record" href="/records/3" data-router-link="true">${next}</a>
    </div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<a slIconButtonLink aria-label="Next record: ENC-4522" href="/records/2" shape="circle">${next}</a>`,
  }),
};
