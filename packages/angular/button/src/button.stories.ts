import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlButton } from './button';

interface ButtonStoryArgs {
  disabled: boolean;
  fullWidth: boolean;
  label: string;
  loading: boolean;
  size: 'sm' | 'md' | 'lg';
  tone: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  variant: 'solid' | 'outline' | 'ghost';
}
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta: Meta<ButtonStoryArgs> = {
  title: 'Components/Button family/Button',
  component: SlButton,
  decorators: [moduleMetadata({ imports: [SlButton] })],
  args: {
    disabled: false,
    fullWidth: false,
    label: 'Save changes',
    loading: false,
    size: 'md',
    tone: 'accent',
    variant: 'solid',
  },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline', 'ghost'] },
    tone: { control: 'select', options: ['neutral', 'accent', 'success', 'warning', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Button',
        description: 'Native action control with controlled loading.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.button,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template:
      '<button slButton [variant]="variant" [tone]="tone" [size]="size" [disabled]="disabled" [loading]="loading" [fullWidth]="fullWidth">{{ label }}</button>',
  }),
};
export default meta;
type Story = StoryObj<ButtonStoryArgs>;
export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template:
      '<div style="display:flex;gap:12px"><button slButton>Default</button><button slButton disabled>Disabled</button><button slButton loading>Loading</button></div>',
  }),
};
export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template:
      '<button slButton><span slButtonLeading aria-hidden="true">+</span>Save<span slButtonTrailing aria-hidden="true">⌘S</span></button>',
  }),
};
export const FullWidth: Story = {
  parameters: scenario('fullWidth'),
  render: () => ({ template: '<button slButton fullWidth>Full width action</button>' }),
};
export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({ template: '<button slButton loading loadingText="Saving">Save</button>' }),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template:
      '<button slButton aria-describedby="save-help">Save</button><p id="save-help">Saves the current document.</p>',
  }),
};
