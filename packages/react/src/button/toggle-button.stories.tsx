import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pin } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { ToggleButton } from './toggle-button';

const PinIcon = () => <Pin aria-hidden="true" focusable="false" strokeWidth={1.75} />;

/**
 * The controlled toggle a story and a test both need: the consumer owns the
 * value, the component only asks for a new one.
 */
export function ToggleButtonStoryAdapter({ children }: { children: ReactNode }) {
  const [pressed, setPressed] = useState(false);
  return (
    <ToggleButton
      onPressedChange={(next) => setPressed(next)}
      pressed={pressed}
      start={<PinIcon />}
    >
      {children}
    </ToggleButton>
  );
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta = {
  title: 'Components/Button family/ToggleButton',
  component: ToggleButton,
  /* The adapter is a helper a story and a test share, not a story of its own. */
  excludeStories: ['ToggleButtonStoryAdapter'],
  args: {
    children: 'Pin',
    defaultPressed: false,
    disabled: false,
    fullWidth: false,
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

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/** Both modes, side by side: the component owns one value and the consumer the other. */
export const Pressed: Story = {
  parameters: scenario('pressed'),
  render: function PressedStory() {
    const [reason, setReason] = useState('nothing yet');
    return (
      <div className="slotted-demo-stack">
        <div className="slotted-demo-row">
          <ToggleButton defaultPressed start={<PinIcon />}>
            Uncontrolled
          </ToggleButton>
          <ToggleButtonStoryAdapter>Controlled</ToggleButtonStoryAdapter>
          <ToggleButton
            defaultPressed
            onPressedChange={(pressed, request) => setReason(`${request.reason} → ${pressed}`)}
            start={<PinIcon />}
          >
            Reports the reason
          </ToggleButton>
        </div>
        <p>Last request: {reason}</p>
      </div>
    );
  },
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_VARIANTS.map((variant) => (
        <div className="slotted-demo-row" key={variant}>
          <ToggleButton variant={variant}>Off</ToggleButton>
          <ToggleButton defaultPressed variant={variant}>
            On
          </ToggleButton>
          <ToggleButton disabled variant={variant}>
            Off, unavailable
          </ToggleButton>
          <ToggleButton defaultPressed disabled variant={variant}>
            On, unavailable
          </ToggleButton>
        </div>
      ))}
    </div>
  ),
};

/**
 * A toggle that persists reaches a server before the state is true. It holds
 * the state it still has while it waits, so nobody is shown a value that has
 * not been agreed to, and the ring takes the icon's own box so the row of
 * controls does not move.
 */
export const Loading: Story = {
  parameters: scenario('loading'),
  render: function LoadingStory() {
    const [following, setFollowing] = useState(false);
    const [saving, setSaving] = useState(false);

    return (
      <div className="slotted-demo-row">
        <ToggleButton
          loading={saving}
          messages={{ loading: 'Saving' }}
          onPressedChange={(next) => {
            setSaving(true);
            window.setTimeout(() => {
              setFollowing(next);
              setSaving(false);
            }, 1200);
          }}
          pressed={following}
          start={<PinIcon />}
        >
          Follow
        </ToggleButton>
        <ToggleButton defaultPressed loading messages={{ loading: 'Unpinning' }}>
          Pinned
        </ToggleButton>
      </div>
    );
  },
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-stack">
      <ToggleButton aria-describedby="pin-help" defaultPressed>
        Pin
      </ToggleButton>
      <p id="pin-help">
        The label stays “Pin” whether the item is pinned or not; the state is announced beside it.
      </p>
    </div>
  ),
};
