import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { ToggleButton } from './toggle-button';
const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});
const meta = {
  title: 'Components/Button family/ToggleButton',
  component: ToggleButton,
  args: { children: 'Pin' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ToggleButton',
        description: 'Controlled native pressed action.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.toggleButton,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof ToggleButton>;
export default meta;
type Story = StoryObj<typeof meta>;
const row = { display: 'flex', gap: 12 } as const;

export function ToggleButtonStoryAdapter({
  onPressedChange,
  pressed = false,
  ...props
}: ComponentProps<typeof ToggleButton>) {
  const [isPressed, setIsPressed] = useState(pressed);

  useEffect(() => {
    setIsPressed(pressed);
  }, [pressed]);

  return (
    <ToggleButton
      {...props}
      pressed={isPressed}
      onPressedChange={(next) => {
        setIsPressed(next);
        onPressedChange?.(next);
      }}
    />
  );
}

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <ToggleButtonStoryAdapter {...args} />,
};
export const Pressed: Story = {
  parameters: scenario('pressed'),
  args: { pressed: true },
  render: (args) => <ToggleButtonStoryAdapter {...args} />,
};
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div style={row}>
      <ToggleButton>Default</ToggleButton>
      <ToggleButton pressed>Pressed</ToggleButton>
      <ToggleButton disabled>Disabled</ToggleButton>
    </div>
  ),
};
export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <>
      <ToggleButton pressed aria-describedby="pin-help">
        Pin
      </ToggleButton>
      <span className="slotted-visually-hidden" id="pin-help">
        Indicates whether the item is pinned.
      </span>
    </>
  ),
};
