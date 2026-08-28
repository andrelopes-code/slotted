import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import type { ButtonSize, ButtonTone, ButtonVariant } from './button.constants';
import { SlButton } from './button';

interface ButtonStoryArgs {
  disabled: boolean;
  label: string;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const meta: Meta<ButtonStoryArgs> = {
  title: 'Components/Button',
  component: SlButton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [SlButton] })],
  args: {
    disabled: false,
    label: 'Save changes',
    size: 'md',
    tone: 'accent',
    variant: 'solid',
  },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline', 'ghost'] },
    tone: { control: 'select', options: ['accent', 'neutral', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => ({
    props: args,
    template: `<button slButton [variant]="variant" [tone]="tone" [size]="size" [disabled]="disabled">{{ label }}</button>`,
  }),
};

export default meta;
type Story = StoryObj<ButtonStoryArgs>;

export const Overview: Story = {};

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px">
        <button slButton variant="solid">solid</button>
        <button slButton variant="outline">outline</button>
        <button slButton variant="ghost">ghost</button>
      </div>
    `,
  }),
};

export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px">
        <button slButton tone="accent">accent</button>
        <button slButton tone="neutral">neutral</button>
        <button slButton tone="danger">danger</button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px">
        <button slButton size="sm">sm</button>
        <button slButton size="md">md</button>
        <button slButton size="lg">lg</button>
      </div>
    `,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px">
        <button slButton>Enabled</button>
        <button slButton disabled>Disabled</button>
      </div>
    `,
  }),
};

export const Content: Story = {
  render: () => ({
    template: `
      <button slButton>
        <span slButtonLeading aria-hidden="true">+</span>
        Create
        <span slButtonTrailing aria-hidden="true">⌘S</span>
      </button>
    `,
  }),
};

export const Densities: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px">
        <div data-slotted-density="comfortable"><button slButton>Comfortable</button></div>
        <div data-slotted-density="compact"><button slButton>Compact</button></div>
      </div>
    `,
  }),
};

export const Schemes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px">
        <div data-slotted-scheme="light" style="padding:16px;background:#f8fafc">
          <button slButton>Light</button>
        </div>
        <div data-slotted-scheme="dark" style="padding:16px;background:#111827">
          <button slButton>Dark</button>
        </div>
      </div>
    `,
  }),
};

export const Accessibility: Story = {
  render: () => ({
    template: `
      <div>
        <button slButton aria-describedby="save-help">Save</button>
        <p id="save-help">Saves the current document.</p>
      </div>
    `,
  }),
};
