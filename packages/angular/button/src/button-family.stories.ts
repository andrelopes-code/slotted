import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { scenario } from '@slotted/storybook-workbench';
import { SlButton } from './button';
import { SlButtonGroup } from './button-group';
import { SlIconButton } from './icon-button';

const meta: Meta = {
  title: 'Components/Button family/Overview',
  decorators: [moduleMetadata({ imports: [SlButton, SlButtonGroup, SlIconButton] })],
  parameters: { controls: { disable: true } },
};
export default meta;
type Story = StoryObj;
export const Matrix: Story = {
  parameters: scenario('matrix'),
  render: () => ({
    template: `
<div aria-label="Component comparison" class="slotted-matrix-scroll" role="region" tabindex="0"><table class="slotted-matrix" style="--slotted-columns: 5"><thead><tr><th aria-hidden="true" class="slotted-matrix__corner"></th><th class="slotted-matrix__heading" scope="col">Neutral</th><th class="slotted-matrix__heading" scope="col">Accent</th><th class="slotted-matrix__heading" scope="col">Success</th><th class="slotted-matrix__heading" scope="col">Warning</th><th class="slotted-matrix__heading" scope="col">Danger</th></tr></thead><tbody>
<tr><th class="slotted-matrix__row-label" scope="row">Solid</th><td class="slotted-matrix__cell"><button slButton variant="solid" tone="neutral">neutral</button></td><td class="slotted-matrix__cell"><button slButton variant="solid" tone="accent">accent</button></td><td class="slotted-matrix__cell"><button slButton variant="solid" tone="success">success</button></td><td class="slotted-matrix__cell"><button slButton variant="solid" tone="warning">warning</button></td><td class="slotted-matrix__cell"><button slButton variant="solid" tone="danger">danger</button></td></tr>
<tr><th class="slotted-matrix__row-label" scope="row">Outline</th><td class="slotted-matrix__cell"><button slButton variant="outline" tone="neutral">neutral</button></td><td class="slotted-matrix__cell"><button slButton variant="outline" tone="accent">accent</button></td><td class="slotted-matrix__cell"><button slButton variant="outline" tone="success">success</button></td><td class="slotted-matrix__cell"><button slButton variant="outline" tone="warning">warning</button></td><td class="slotted-matrix__cell"><button slButton variant="outline" tone="danger">danger</button></td></tr>
<tr><th class="slotted-matrix__row-label" scope="row">Ghost</th><td class="slotted-matrix__cell"><button slButton variant="ghost" tone="neutral">neutral</button></td><td class="slotted-matrix__cell"><button slButton variant="ghost" tone="accent">accent</button></td><td class="slotted-matrix__cell"><button slButton variant="ghost" tone="success">success</button></td><td class="slotted-matrix__cell"><button slButton variant="ghost" tone="warning">warning</button></td><td class="slotted-matrix__cell"><button slButton variant="ghost" tone="danger">danger</button></td></tr>
</tbody></table></div><div style="display:grid;gap:12px;margin-top:16px"><div><button slButton size="sm">sm</button> <button slButton size="md">md</button> <button slButton size="lg">lg</button></div><div><button slButton disabled>Disabled</button> <button slButton loading>Loading</button></div><button slButton><span slButtonLeading aria-hidden="true">+</span>Save<span slButtonTrailing aria-hidden="true">⌘S</span></button><button slIconButton aria-label="Save draft">+</button><div style="max-inline-size:360px"><button slButton fullWidth>Full-width save</button></div><div slButtonGroup aria-label="Save actions"><button slButton>Save</button><button slIconButton aria-label="More save options">⌄</button></div></div>`,
  }),
};
export const Themes: Story = {
  parameters: scenario('themes'),
  render: () => ({
    template:
      '<div style="display:flex;gap:12px"><div data-slotted-scheme="light"><button slButton>Light</button></div><div data-slotted-scheme="dark"><button slButton>Dark</button></div></div>',
  }),
};
export const Densities: Story = {
  parameters: scenario('densities'),
  render: () => ({
    template:
      '<div style="display:flex;gap:12px"><div data-slotted-density="comfortable"><button slButton>Comfortable</button></div><div data-slotted-density="compact"><button slButton>Compact</button></div></div>',
  }),
};
