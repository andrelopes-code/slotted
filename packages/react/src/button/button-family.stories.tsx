import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario, WorkbenchMatrix } from '@slotted/storybook-workbench';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { IconButton } from './icon-button';
const SaveIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16">
    <path d="M3 2h10v12H3zM5 2v4h6V2M5 12h6" fill="none" stroke="currentColor" />
  </svg>
);
const meta = {
  title: 'Components/Button family/Overview',
  parameters: { controls: { disable: true } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const tones = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;
export const Matrix: Story = {
  parameters: scenario('matrix'),
  render: () => (
    <>
      <WorkbenchMatrix
        columns={['Neutral', 'Accent', 'Success', 'Warning', 'Danger']}
        rows={(['solid', 'outline', 'ghost'] as const).map((variant) => ({
          label: variant.charAt(0).toUpperCase() + variant.slice(1),
          cells: tones.map((tone) => (
            <Button key={tone} tone={tone} variant={variant}>
              {tone}
            </Button>
          )),
        }))}
      />
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <div>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
        </div>
        <div>
          <Button disabled>Disabled</Button> <Button loading>Loading</Button>
        </div>
        <Button leading={<SaveIcon />} trailing={<span aria-hidden="true">⌘S</span>}>
          Save
        </Button>
        <IconButton aria-label="Save draft">
          <SaveIcon />
        </IconButton>
        <div style={{ maxInlineSize: 360 }}>
          <Button fullWidth leading={<SaveIcon />}>
            Full-width save
          </Button>
        </div>
        <ButtonGroup aria-label="Save actions">
          <Button leading={<SaveIcon />}>Save</Button>
          <IconButton aria-label="More save options">⌄</IconButton>
        </ButtonGroup>
      </div>
    </>
  ),
};
export const Themes: Story = {
  parameters: scenario('themes'),
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <div data-slotted-scheme="light">
        <Button>Light</Button>
      </div>
      <div data-slotted-scheme="dark">
        <Button>Dark</Button>
      </div>
    </div>
  ),
};
export const Densities: Story = {
  parameters: scenario('densities'),
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <div data-slotted-density="comfortable">
        <Button>Comfortable</Button>
      </div>
      <div data-slotted-density="compact">
        <Button>Compact</Button>
      </div>
    </div>
  ),
};
