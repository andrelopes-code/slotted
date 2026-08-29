import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlIconButton } from './icon-button';

const plusIcon = '<ng-icon aria-hidden="true" name="lucidePlus"></ng-icon>';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta: Meta = {
  title: 'Components/Button family/IconButton',
  component: SlIconButton,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlIconButton],
      providers: [provideIcons({ lucidePlus })],
    }),
  ],
  args: { 'aria-label': 'Add' },
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
  render: () => ({ template: `<button slIconButton aria-label="Add">${plusIcon}</button>` }),
};
export default meta;
type Story = StoryObj;
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
