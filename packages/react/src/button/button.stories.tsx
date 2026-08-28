import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Save changes' },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline', 'ghost'] },
    tone: { control: 'select', options: ['accent', 'neutral', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const rowStyle = { display: 'flex', flexWrap: 'wrap', gap: 12 } as const;

export const Overview: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={rowStyle}>
      {(['solid', 'outline', 'ghost'] as const).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div style={rowStyle}>
      {(['accent', 'neutral', 'danger'] as const).map((tone) => (
        <Button key={tone} tone={tone}>
          {tone}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={rowStyle}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={rowStyle}>
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const Content: Story = {
  render: () => (
    <Button
      leading={<span aria-hidden="true">+</span>}
      trailing={<span aria-hidden="true">⌘S</span>}
    >
      Create
    </Button>
  ),
};

export const Densities: Story = {
  render: () => (
    <div style={rowStyle}>
      <div data-slotted-density="comfortable">
        <Button>Comfortable</Button>
      </div>
      <div data-slotted-density="compact">
        <Button>Compact</Button>
      </div>
    </div>
  ),
};

export const Schemes: Story = {
  render: () => (
    <div style={rowStyle}>
      <div
        data-slotted-scheme="light"
        style={{ padding: 16, background: '#f8fafc' }}
      >
        <Button>Light</Button>
      </div>
      <div
        data-slotted-scheme="dark"
        style={{ padding: 16, background: '#111827' }}
      >
        <Button>Dark</Button>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div>
      <Button aria-describedby="save-help">Save</Button>
      <p id="save-help">Saves the current document.</p>
    </div>
  ),
};
