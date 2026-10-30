import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePin } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButtonStart } from './button-appearance';
import {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button.constants';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlToggleButton } from './toggle-button';

const pin = '<span slButtonStart><ng-icon aria-hidden="true" name="lucidePin"></ng-icon></span>';

interface ToggleButtonStoryArgs {
  defaultPressed: boolean;
  disabled: boolean;
  fullWidth: boolean;
  label: string;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta: Meta<ToggleButtonStoryArgs> = {
  title: 'Components/Button family/ToggleButton',
  component: SlToggleButton,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlButtonStart, SlToggleButton],
      providers: [provideIcons({ lucidePin })],
    }),
  ],
  args: {
    defaultPressed: false,
    disabled: false,
    fullWidth: false,
    label: 'Pin',
    size: 'md',
    tone: 'secondary',
    variant: 'outline',
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
        title: 'ToggleButton',
        description: 'A two-state action whose label never changes with its state.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.toggleButton,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template: `<button
      slToggleButton
      [tone]="tone"
      [variant]="variant"
      [size]="size"
      [disabled]="disabled"
      [fullWidth]="fullWidth"
      [defaultPressed]="defaultPressed"
    >{{ label }}</button>`,
  }),
};

export default meta;
type Story = StoryObj<ToggleButtonStoryArgs>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/** Both modes, side by side: the component owns one value and the consumer the other. */
export const Pressed: Story = {
  parameters: scenario('pressed'),
  render: () => ({
    props: { pinned: false, reason: 'nothing yet' },
    template: `<div class="slotted-demo-stack">
      <div class="slotted-demo-row">
        <button slToggleButton defaultPressed>${pin}Uncontrolled</button>
        <button
          slToggleButton
          [pressed]="pinned"
          (pressedChange)="pinned = $event.value; reason = $event.reason + ' → ' + $event.value"
        >${pin}Controlled</button>
      </div>
      <p>Last request: {{ reason }}</p>
    </div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_VARIANTS.map(
      (variant) => `<div class="slotted-demo-row">
        <button slToggleButton variant="${variant}">Off</button>
        <button slToggleButton variant="${variant}" defaultPressed>On</button>
        <button slToggleButton variant="${variant}" disabled>Off, unavailable</button>
        <button slToggleButton variant="${variant}" defaultPressed disabled>On, unavailable</button>
      </div>`,
    ).join('')}</div>`,
  }),
};

/**
 * A toggle that persists reaches a server before the state is true. It holds
 * the state it still has while it waits, so nobody is shown a value that has
 * not been agreed to.
 */
export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: `<div class="slotted-demo-row">
      <button slToggleButton loading [messages]="{ loading: 'Saving' }">Follow</button>
      <button slToggleButton defaultPressed loading [messages]="{ loading: 'Unpinning' }">Pinned</button>
    </div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<div class="slotted-demo-stack">
      <button slToggleButton aria-describedby="pin-help" defaultPressed>Pin</button>
      <p id="pin-help">
        The label stays “Pin” whether the item is pinned or not; the state is announced beside it.
      </p>
    </div>`,
  }),
};
