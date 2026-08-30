import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import type { ButtonFill, ButtonSize, ButtonVariant } from './button.constants';
import { SlIconButton } from './icon-button';

const plusIcon = '<ng-icon aria-hidden="true" name="lucidePlus"></ng-icon>';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

interface IconButtonStoryArgs {
  ariaLabel: string;
  disabled: boolean;
  fill: ButtonFill;
  loading: boolean;
  size: ButtonSize;
  variant: ButtonVariant;
}

const meta: Meta<IconButtonStoryArgs> = {
  title: 'Components/Button family/IconButton',
  component: SlIconButton,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlIconButton],
      providers: [provideIcons({ lucidePlus })],
    }),
  ],
  args: {
    ariaLabel: 'Add',
    disabled: false,
    fill: 'ghost',
    loading: false,
    size: 'md',
    variant: 'secondary',
  },
  argTypes: {
    fill: { control: 'select', options: ['solid', 'outline', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['accent', 'secondary', 'success', 'warning', 'danger'],
    },
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'IconButton',
        description: 'Named icon-only native action.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.iconButton,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template: `<button slIconButton [attr.aria-label]="ariaLabel" [disabled]="disabled" [fill]="fill" [loading]="loading" [size]="size" [variant]="variant">${plusIcon}</button>`,
  }),
};
export default meta;
type Story = StoryObj<IconButtonStoryArgs>;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `<div class="slotted-demo-row"><button slIconButton aria-label="Add small" size="sm">${plusIcon}</button><button slIconButton aria-label="Add medium" size="md">${plusIcon}</button><button slIconButton aria-label="Add large" size="lg">${plusIcon}</button></div>`,
  }),
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `<div class="slotted-demo-row"><button slIconButton aria-label="Add item">${plusIcon}</button><button slIconButton aria-label="Add item disabled" disabled>${plusIcon}</button></div>`,
  }),
};
export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: `<button slIconButton aria-label="Saving" loading>${plusIcon}</button>`,
  }),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<button slIconButton aria-label="Add item">${plusIcon}</button>`,
  }),
};
