import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucidePlus,
  lucideRedo2,
  lucideSave,
  lucideTrash2,
  lucideUndo2,
} from '@ng-icons/lucide';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { scenario } from '@slotted/storybook-workbench';

import { SlButton } from './button';
import { SlButtonGroup } from './button-group';
import { SlButtonLink } from './button-link';
import { SlIconButton } from './icon-button';
import { SlToggleButton } from './toggle-button';

const demoIconNames = {
  'chevron-down': 'lucideChevronDown',
  plus: 'lucidePlus',
  redo: 'lucideRedo2',
  save: 'lucideSave',
  trash: 'lucideTrash2',
  undo: 'lucideUndo2',
} as const;
const variants = ['accent', 'secondary', 'success', 'warning', 'danger'] as const;
const fills = ['solid', 'outline', 'ghost'] as const;

type Variant = (typeof variants)[number];
type Fill = (typeof fills)[number];

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

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

const matrix = (
  name: string,
  rows: readonly string[],
  renderCell: (column: Variant, row: string) => string,
) => `
  <div data-slotted-matrix="${name}">
    <div aria-label="${titleCase(name)} comparison" class="slotted-matrix-scroll" role="region" tabindex="0">
      <table class="slotted-matrix">
        <thead><tr>
          <th aria-hidden="true" class="slotted-matrix__corner"></th>
          ${variants.map((variant) => `<th class="slotted-matrix__heading" scope="col">${titleCase(variant)}</th>`).join('')}
        </tr></thead>
        <tbody>${rows
          .map(
            (row) => `<tr>
              <th class="slotted-matrix__row-label" scope="row">${titleCase(row)}</th>
              ${variants
                .map(
                  (variant) => `<td class="slotted-matrix__cell">${renderCell(variant, row)}</td>`,
                )
                .join('')}
            </tr>`,
          )
          .join('')}</tbody>
      </table>
    </div>
  </div>`;

const appearanceScene = (
  name: string,
  note: string,
  renderCell: (variant: Variant, fill: Fill) => string,
) =>
  scene(
    'Appearance matrix',
    note,
    matrix(name, fills, (variant, fill) => renderCell(variant, fill as Fill)),
  );

const meta: Meta = {
  title: 'Components/Button family/Overview',
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlButton, SlButtonGroup, SlButtonLink, SlIconButton, SlToggleButton],
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
      <h2>Button</h2>
      <p>Every semantic variant and fill on the native action primitive.</p>
    </header>
    <div class="slotted-component-lab__body">
      ${appearanceScene(
        'button',
        'Five variants across all three fills.',
        (variant, fill) =>
          `<button slButton fill="${fill}" variant="${variant}">${titleCase(variant)}</button>`,
      )}
    </div>
  </section>

  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>ButtonLink</h2>
      <p>Navigation receives the same hierarchy without losing native link semantics.</p>
    </header>
    <div class="slotted-component-lab__body">
      ${appearanceScene(
        'button-link',
        'The complete link appearance contract.',
        (variant, fill) =>
          `<a slButtonLink fill="${fill}" href="/${variant}/${fill}" variant="${variant}">${titleCase(variant)}</a>`,
      )}
    </div>
  </section>

  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>IconButton</h2>
      <p>Icon-only actions expose the full appearance system with an accessible name.</p>
    </header>
    <div class="slotted-component-lab__body">
      ${appearanceScene(
        'icon-button',
        'Every control contains a real Lucide icon.',
        (variant, fill) =>
          `<button slIconButton aria-label="${titleCase(variant)} ${fill} action" fill="${fill}" variant="${variant}">${demoIcon('plus')}</button>`,
      )}
    </div>
  </section>

  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>ToggleButton</h2>
      <p>Persistent actions use the same variants and fills as momentary actions.</p>
    </header>
    <div class="slotted-component-lab__body">
      ${appearanceScene(
        'toggle-button',
        'Unpressed controls across every appearance.',
        (variant, fill) =>
          `<button slToggleButton fill="${fill}" variant="${variant}">${titleCase(variant)}</button>`,
      )}
    </div>
  </section>

  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>Toggle state</h2>
      <p>Pressed and unpressed controls remain distinguishable for every semantic variant.</p>
    </header>
    <div class="slotted-component-lab__body">
      ${scene(
        'State matrix',
        'Each variant is paired across both values.',
        matrix('toggle-state', ['unpressed', 'pressed'], (variant, state) => {
          const pressed = state === 'pressed';
          return `<button slToggleButton [pressed]="${String(pressed)}" variant="${variant}">${titleCase(variant)}</button>`;
        }),
      )}
    </div>
  </section>

  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>Usage and composition</h2>
      <p>Scale, interaction state, consumer content, and grouped actions in context.</p>
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
        'Hierarchy',
        'Primary and secondary actions remain unmistakable.',
        '<div class="slotted-demo-row"><button slButton>Primary action</button><button slButton variant="secondary">Secondary action</button></div>',
      )}
      ${scene(
        'Content',
        'Replaceable icons and full-width layout.',
        `<div class="slotted-demo-stack slotted-demo-measure"><button slButton>${demoIcon('save', 'slButtonLeading')}Save draft${demoIcon('chevron-down', 'slButtonTrailing')}</button><button slButton fullWidth>${demoIcon('plus', 'slButtonLeading')}Create document</button></div>`,
      )}
      ${scene(
        'Inside ButtonGroup',
        'A compact editing toolbar with one seam system.',
        `<div slButtonGroup aria-label="Editing history"><button slIconButton aria-label="Undo" fill="outline" variant="secondary">${demoIcon('undo')}</button><button slIconButton aria-label="Redo" fill="outline" variant="secondary">${demoIcon('redo')}</button><button slIconButton aria-label="Delete" fill="outline" variant="secondary">${demoIcon('trash')}</button></div>`,
      )}
      ${scene(
        'Split action',
        'One primary action and its related options.',
        `<div slButtonGroup aria-label="Publish actions" class="slotted-split-action"><button slButton fill="solid" size="md" variant="accent">${demoIcon('save', 'slButtonLeading')}Publish</button><button slIconButton aria-label="More publish options" fill="solid" size="md" variant="accent">${demoIcon('chevron-down')}</button></div>`,
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
        <header class="slotted-demo-scene__header"><span class="slotted-demo-scene__label">${titleCase(scheme)} scheme</span><span class="slotted-demo-scene__note">The same semantic contract.</span></header>
        <div class="slotted-demo-stage" data-slotted-scheme="${scheme}"><div class="slotted-demo-row"><button slButton>${demoIcon('save', 'slButtonLeading')}Save draft</button><button slButton variant="secondary">Explore</button><button slIconButton aria-label="Add item" fill="outline" variant="secondary">${demoIcon('plus')}</button></div></div>
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
        <header class="slotted-demo-scene__header"><span class="slotted-demo-scene__label">${titleCase(density)}</span><span class="slotted-demo-scene__note">Spacing changes, semantics do not.</span></header>
        <div class="slotted-demo-stage"><div class="slotted-demo-row"><button slButton>${demoIcon('save', 'slButtonLeading')}Save</button><button slButton fill="outline" variant="secondary">Cancel</button></div></div>
      </section>`,
    )
    .join('')}
</div>`,
  }),
};
