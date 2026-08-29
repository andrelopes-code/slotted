import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucidePlus,
  lucideRedo2,
  lucideSave,
  lucideTrash2,
  lucideUndo2,
} from '@ng-icons/lucide';
import { scenario } from '@slotted/storybook-workbench';

import { SlButton } from './button';
import { SlButtonGroup } from './button-group';
import { SlIconButton } from './icon-button';

const demoIconNames = {
  'chevron-down': 'lucideChevronDown',
  plus: 'lucidePlus',
  redo: 'lucideRedo2',
  save: 'lucideSave',
  trash: 'lucideTrash2',
  undo: 'lucideUndo2',
} as const;

const demoIcon = (name: keyof typeof demoIconNames, marker = '') =>
  `<ng-icon ${marker} aria-hidden="true" name="${demoIconNames[name]}"></ng-icon>`;

const scene = (label: string, note: string, content: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">${content}</div>
  </section>`;

const tones = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;
const variants = ['solid', 'outline', 'ghost'] as const;
const matrixRows = variants
  .map(
    (variant) => `<tr>
      <th class="slotted-matrix__row-label" scope="row">${variant.charAt(0).toUpperCase() + variant.slice(1)}</th>
      ${tones
        .map(
          (tone) =>
            `<td class="slotted-matrix__cell"><button slButton variant="${variant}" tone="${tone}">${tone.charAt(0).toUpperCase() + tone.slice(1)}</button></td>`,
        )
        .join('')}
    </tr>`,
  )
  .join('');

const meta: Meta = {
  title: 'Components/Button family/Overview',
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlButton, SlButtonGroup, SlIconButton],
      providers: [
        provideIcons({
          lucideChevronDown,
          lucidePlus,
          lucideRedo2,
          lucideSave,
          lucideTrash2,
          lucideUndo2,
        }),
      ],
    }),
  ],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Matrix: Story = {
  parameters: scenario('matrix'),
  render: () => ({
    template: `
<main class="slotted-component-lab">
  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>Appearance</h2>
      <p>Every tone and variant on one stable comparison plane.</p>
    </header>
    <div class="slotted-component-lab__body">
      <div aria-label="Component comparison" class="slotted-matrix-scroll" role="region" tabindex="0">
        <table class="slotted-matrix">
          <thead><tr>
            <th aria-hidden="true" class="slotted-matrix__corner"></th>
            ${tones.map((tone) => `<th class="slotted-matrix__heading" scope="col">${tone.charAt(0).toUpperCase() + tone.slice(1)}</th>`).join('')}
          </tr></thead>
          <tbody>${matrixRows}</tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>Scale and state</h2>
      <p>Scale and interaction states stay aligned without isolated samples.</p>
    </header>
    <div class="slotted-component-lab__body slotted-demo-grid" data-columns="3">
      ${scene(
        'Sizes',
        'Three explicit control heights.',
        '<div class="slotted-demo-row"><button slButton size="sm">Small</button><button slButton size="md">Medium</button><button slButton size="lg">Large</button></div>',
      )}
      ${scene(
        'States',
        'Default, unavailable, and in progress.',
        '<div class="slotted-demo-row"><button slButton>Default</button><button slButton disabled>Disabled</button><button slButton loading loadingText="Saving">Save</button></div>',
      )}
      ${scene(
        'Density',
        'Layout changes without API changes.',
        '<div class="slotted-demo-row"><span data-slotted-density="comfortable"><button slButton>Comfortable</button></span><span data-slotted-density="compact"><button slButton>Compact</button></span></div>',
      )}
    </div>
  </section>

  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>Composition</h2>
      <p>Consumer content, toolbars, and split actions remain composition, not special cases.</p>
    </header>
    <div class="slotted-component-lab__body slotted-demo-grid" data-columns="3">
      ${scene(
        'Content',
        'Replaceable icons and full-width layout.',
        `<div class="slotted-demo-stack slotted-demo-measure"><button slButton>${demoIcon('save', 'slButtonLeading')}Save draft${demoIcon('chevron-down', 'slButtonTrailing')}</button><button slButton fullWidth>${demoIcon('plus', 'slButtonLeading')}Create document</button></div>`,
      )}
      ${scene(
        'Inside ButtonGroup',
        'A compact editing toolbar with one seam system.',
        `<div slButtonGroup aria-label="Editing history"><button slIconButton aria-label="Undo" tone="neutral" variant="outline">${demoIcon('undo')}</button><button slIconButton aria-label="Redo" tone="neutral" variant="outline">${demoIcon('redo')}</button><button slIconButton aria-label="Delete" tone="neutral" variant="outline">${demoIcon('trash')}</button></div>`,
      )}
      ${scene(
        'Split action',
        'One primary action and its related options.',
        `<div slButtonGroup aria-label="Publish actions" class="slotted-split-action"><button slButton size="md" tone="accent" variant="solid">${demoIcon('save', 'slButtonLeading')}Publish</button><button slIconButton aria-label="More publish options" size="md" tone="accent" variant="solid">${demoIcon('chevron-down')}</button></div>`,
      )}
    </div>
  </section>
</main>`,
  }),
};

export const Themes: Story = {
  parameters: scenario('themes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  ${(['light', 'dark'] as const)
    .map(
      (scheme) => `<section class="slotted-demo-scene">
        <header class="slotted-demo-scene__header"><span class="slotted-demo-scene__label">${scheme.charAt(0).toUpperCase() + scheme.slice(1)} scheme</span><span class="slotted-demo-scene__note">The same semantic contract.</span></header>
        <div class="slotted-demo-stage" data-slotted-scheme="${scheme}"><div class="slotted-demo-row"><button slButton>${demoIcon('save', 'slButtonLeading')}Save draft</button><button slIconButton aria-label="Add item" variant="outline">${demoIcon('plus')}</button></div></div>
      </section>`,
    )
    .join('')}
</div>`,
  }),
};

export const Densities: Story = {
  parameters: scenario('densities'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  ${(['comfortable', 'compact'] as const)
    .map(
      (density) => `<section class="slotted-demo-scene" data-slotted-density="${density}">
        <header class="slotted-demo-scene__header"><span class="slotted-demo-scene__label">${density.charAt(0).toUpperCase() + density.slice(1)}</span><span class="slotted-demo-scene__note">Spacing changes, semantics do not.</span></header>
        <div class="slotted-demo-stage"><div class="slotted-demo-row"><button slButton>${demoIcon('save', 'slButtonLeading')}Save</button><button slButton variant="outline">Cancel</button></div></div>
      </section>`,
    )
    .join('')}
</div>`,
  }),
};
