import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bold,
  Italic,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Underline,
} from 'lucide-react';
import { useState } from 'react';

import { BUTTON_SHAPES, BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import { IconButton } from './icon-button';

const PlusIcon = () => <Plus aria-hidden="true" focusable="false" strokeWidth={1.75} />;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta = {
  title: 'Components/Button family/IconButton',
  component: IconButton,
  args: {
    'aria-label': 'Add member',
    children: <PlusIcon />,
    disabled: false,
    loading: false,
    shape: 'square',
    size: 'md',
    tone: 'secondary',
    variant: 'ghost',
  },
  argTypes: {
    shape: { control: 'select', options: [...BUTTON_SHAPES] },
    size: { control: 'select', options: [...BUTTON_SIZES] },
    tone: { control: 'select', options: [...BUTTON_TONES] },
    variant: { control: 'select', options: [...BUTTON_VARIANTS] },
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'IconButton',
        description: 'A square action with no room for a label, so the name is explicit.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.iconButton,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => (
    <div className="slotted-demo-row">
      {BUTTON_SHAPES.map((shape) => (
        <IconButton
          aria-label={`Add, ${shape}`}
          key={shape}
          shape={shape}
          tone="accent"
          variant="solid"
        >
          <PlusIcon />
        </IconButton>
      ))}
      {BUTTON_SHAPES.map((shape) => (
        <IconButton
          aria-label={`Refresh, ${shape}`}
          key={`${shape}-outline`}
          shape={shape}
          variant="outline"
        >
          <RefreshCw aria-hidden="true" focusable="false" strokeWidth={1.75} />
        </IconButton>
      ))}
    </div>
  ),
};

/** The control height in both axes, so the target never falls below 24 by 24. */
export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-row">
      {BUTTON_SIZES.map((size) => (
        <IconButton
          aria-label={`Add, ${size}`}
          key={size}
          size={size}
          tone="accent"
          variant="solid"
        >
          <PlusIcon />
        </IconButton>
      ))}
      {BUTTON_SIZES.map((size) => (
        <IconButton aria-label={`More, ${size}`} key={`${size}-ghost`} size={size}>
          <MoreHorizontal aria-hidden="true" focusable="false" strokeWidth={1.75} />
        </IconButton>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_VARIANTS.map((variant) => (
        <div className="slotted-demo-row" key={variant}>
          <IconButton aria-label={`Add, ${variant}`} variant={variant}>
            <PlusIcon />
          </IconButton>
          <IconButton aria-label={`Add, ${variant}, disabled`} disabled variant={variant}>
            <PlusIcon />
          </IconButton>
          <IconButton aria-label={`Add, ${variant}, waiting`} loading variant={variant}>
            <PlusIcon />
          </IconButton>
          <IconButton aria-label={`Delete, ${variant}`} tone="danger" variant={variant}>
            <Trash2 aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </IconButton>
        </div>
      ))}
    </div>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <div className="slotted-demo-row">
      <IconButton aria-label="Refresh" loading variant="outline">
        <RefreshCw aria-hidden="true" focusable="false" strokeWidth={1.75} />
      </IconButton>
      <IconButton aria-label="Refresh" loading shape="circle" tone="accent" variant="solid">
        <RefreshCw aria-hidden="true" focusable="false" strokeWidth={1.75} />
      </IconButton>
    </div>
  ),
};

/**
 * An icon toggle takes `pressed` directly. The name is an attribute already,
 * so it cannot drift with the state the way a visible label could.
 */
export const Pressed: Story = {
  parameters: scenario('pressed'),
  render: function PressedStory() {
    const [marks, setMarks] = useState({ bold: true, italic: false, underline: false });
    return (
      <div className="slotted-demo-stack">
        <div className="slotted-demo-row">
          <IconButton
            aria-label="Bold"
            onPressedChange={(bold) => setMarks((current) => ({ ...current, bold }))}
            pressed={marks.bold}
          >
            <Bold aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </IconButton>
          <IconButton
            aria-label="Italic"
            onPressedChange={(italic) => setMarks((current) => ({ ...current, italic }))}
            pressed={marks.italic}
          >
            <Italic aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </IconButton>
          <IconButton
            aria-label="Underline"
            onPressedChange={(underline) => setMarks((current) => ({ ...current, underline }))}
            pressed={marks.underline}
          >
            <Underline aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </IconButton>
        </div>
        <div className="slotted-demo-row">
          <IconButton aria-label="Favourite" defaultPressed shape="circle" tone="warning">
            <Star aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </IconButton>
          <IconButton aria-label="Favourite, unavailable" defaultPressed disabled shape="circle">
            <Star aria-hidden="true" focusable="false" strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>
    );
  },
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-stack">
      <div className="slotted-demo-row">
        <IconButton aria-describedby="delete-help" aria-label="Delete invoice" tone="danger">
          <Trash2 aria-hidden="true" focusable="false" strokeWidth={1.75} />
        </IconButton>
        <span id="delete-help">Deletes the invoice. This cannot be undone.</span>
      </div>
      <div className="slotted-demo-row">
        <span id="refresh-name">Refresh the report</span>
        <IconButton aria-labelledby="refresh-name" variant="outline">
          <RefreshCw aria-hidden="true" focusable="false" strokeWidth={1.75} />
        </IconButton>
      </div>
    </div>
  ),
};
