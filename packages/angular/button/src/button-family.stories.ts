import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBold,
  lucideChevronDown,
  lucideExternalLink,
  lucideItalic,
  lucidePlus,
  lucideRedo2,
  lucideSave,
  lucideTrash2,
  lucideUnderline,
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
  'arrow-right': 'lucideArrowRight',
  bold: 'lucideBold',
  'chevron-down': 'lucideChevronDown',
  'external-link': 'lucideExternalLink',
  italic: 'lucideItalic',
  plus: 'lucidePlus',
  redo: 'lucideRedo2',
  save: 'lucideSave',
  trash: 'lucideTrash2',
  underline: 'lucideUnderline',
  undo: 'lucideUndo2',
} as const;
const variants = ['accent', 'secondary', 'success', 'warning', 'danger'] as const;
const fills = ['solid', 'outline', 'ghost'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

type Variant = (typeof variants)[number];
type Fill = (typeof fills)[number];

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const sizeLabels = { sm: 'Small', md: 'Medium', lg: 'Large' } as const;

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

const section = (title: string, description: string, body: string, columns?: '2' | '3') => `
  <section class="slotted-component-lab__section">
    <header class="slotted-component-lab__intro">
      <h2>${title}</h2>
      <p>${description}</p>
    </header>
    <div class="slotted-component-lab__body${columns ? ' slotted-demo-grid' : ''}"${columns ? ` data-columns="${columns}"` : ''}>${body}</div>
  </section>`;

const matrix = (name: string, renderCell: (variant: Variant, fill: Fill) => string) => `
  <div data-slotted-matrix="${name}">
    <div aria-label="${titleCase(name)} comparison" class="slotted-matrix-scroll" role="region" tabindex="0">
      <table class="slotted-matrix">
        <thead><tr>
          <th aria-hidden="true" class="slotted-matrix__corner"></th>
          ${variants.map((variant) => `<th class="slotted-matrix__heading" scope="col">${titleCase(variant)}</th>`).join('')}
        </tr></thead>
        <tbody>${fills
          .map(
            (fill) => `<tr>
              <th class="slotted-matrix__row-label" scope="row">${titleCase(fill)}</th>
              ${variants
                .map(
                  (variant) => `<td class="slotted-matrix__cell">${renderCell(variant, fill)}</td>`,
                )
                .join('')}
            </tr>`,
          )
          .join('')}</tbody>
      </table>
    </div>
  </div>`;

const meta: Meta = {
  title: 'Components/Button family/Overview',
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlButton, SlButtonGroup, SlButtonLink, SlIconButton, SlToggleButton],
      providers: [
        provideIcons({
          lucideArrowRight,
          lucideBold,
          lucideChevronDown,
          lucideExternalLink,
          lucideItalic,
          lucidePlus,
          lucideRedo2,
          lucideSave,
          lucideTrash2,
          lucideUnderline,
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
  ${section(
    'Appearance system',
    'Five semantic variants across three fills. ButtonLink, IconButton and ToggleButton read from the same axes, so this matrix is shown once.',
    scene(
      'Appearance matrix',
      'Rendered with Button. The same tokens drive every component below.',
      matrix(
        'button',
        (variant, fill) =>
          `<button slButton fill="${fill}" variant="${variant}">${titleCase(variant)}</button>`,
      ),
    ),
  )}

  ${section(
    'Button',
    'The native action primitive: scale, interaction state, and consumer content.',
    [
      scene(
        'Sizes',
        'Three explicit control heights.',
        `<div class="slotted-demo-row">${sizes
          .map((size) => `<button slButton size="${size}">${sizeLabels[size]}</button>`)
          .join('')}</div>`,
      ),
      scene(
        'States',
        'Default, unavailable, and in progress.',
        '<div class="slotted-demo-row"><button slButton>Default</button><button slButton disabled>Disabled</button><button slButton loading loadingText="Saving">Save</button></div>',
      ),
      scene(
        'Content',
        'Replaceable icon slots and full-width layout.',
        `<div class="slotted-demo-stack slotted-demo-measure"><button slButton>${demoIcon('save', 'slButtonLeading')}Save draft${demoIcon('chevron-down', 'slButtonTrailing')}</button><button slButton fullWidth>${demoIcon('plus', 'slButtonLeading')}Create document</button></div>`,
      ),
      scene(
        'Hierarchy',
        'Primary and secondary actions remain unmistakable.',
        '<div class="slotted-demo-row"><button slButton>Primary action</button><button slButton fill="outline" variant="secondary">Secondary action</button></div>',
      ),
    ].join(''),
    '2',
  )}

  ${section(
    'ButtonLink',
    'Navigation that reads as an action. What differs from Button is the element it renders, not the appearance.',
    [
      scene(
        'Anchor semantics',
        'Renders a real anchor. Middle-click, copy link, and browser navigation all work.',
        `<div class="slotted-demo-row"><a slButtonLink href="/docs/button">Read the guide${demoIcon('arrow-right', 'slButtonTrailing')}</a><a slButtonLink fill="ghost" href="https://developer.mozilla.org/docs/Web/HTML/Element/a" rel="noreferrer" target="_blank" variant="secondary">MDN reference${demoIcon('external-link', 'slButtonTrailing')}</a></div>`,
      ),
      scene(
        'Unavailable',
        'disabled keeps the anchor in the DOM, sets aria-disabled, and removes it from the tab order.',
        '<div class="slotted-demo-row"><a slButtonLink disabled fill="outline" href="/billing/upgrade" variant="secondary">Upgrade plan</a></div>',
      ),
      scene(
        'Beside an action',
        'Submission stays a button; navigation stays a link at a quieter fill.',
        `<div class="slotted-demo-row"><button slButton>${demoIcon('save', 'slButtonLeading')}Save changes</button><a slButtonLink fill="ghost" href="/documents" variant="secondary">Back to documents</a></div>`,
      ),
    ].join(''),
    '3',
  )}

  ${section(
    'IconButton',
    'Icon-only actions. The footprint is square and the accessible name is mandatory.',
    [
      scene(
        'Square footprint',
        'Inline size tracks the control height at every size — no label padding.',
        `<div class="slotted-demo-row">${sizes
          .map(
            (size) =>
              `<button slIconButton aria-label="Add item (${size})" fill="outline" size="${size}" variant="secondary">${demoIcon('plus')}</button>`,
          )
          .join('')}</div>`,
      ),
      scene(
        'Fills',
        'The same three fills, carried without a text label.',
        `<div class="slotted-demo-row">${fills
          .map(
            (fill) =>
              `<button slIconButton aria-label="Save ${fill}" fill="${fill}" variant="accent">${demoIcon('save')}</button>`,
          )
          .join('')}</div>`,
      ),
      scene(
        'Accessible name',
        'aria-label is required; development builds throw when it is missing.',
        `<div class="slotted-demo-row"><button slIconButton aria-label="Undo">${demoIcon('undo')}</button><button slIconButton aria-label="Redo">${demoIcon('redo')}</button><button slIconButton aria-label="Delete" variant="danger">${demoIcon('trash')}</button></div>`,
      ),
    ].join(''),
    '3',
  )}

  ${section(
    'ToggleButton',
    'A persistent on/off action. Its contract is the pressed state, so every appearance is shown as an Off and On pair.',
    scene(
      'State matrix',
      'Off and On stay distinguishable in all fifteen appearances.',
      matrix(
        'toggle-state',
        (variant, fill) =>
          `<div class="slotted-demo-row"><button slToggleButton [pressed]="false" fill="${fill}" variant="${variant}">Off</button><button slToggleButton [pressed]="true" fill="${fill}" variant="${variant}">On</button></div>`,
      ),
    ),
  )}

  ${section(
    'Composition',
    'Grouped actions share one seam system across all four components.',
    [
      scene(
        'Formatting toolbar',
        'Independent toggles keep their pressed state inside a group.',
        `<div slButtonGroup aria-label="Text formatting"><button slToggleButton [pressed]="true">${demoIcon('bold', 'slButtonLeading')}Bold</button><button slToggleButton>${demoIcon('italic', 'slButtonLeading')}Italic</button><button slToggleButton>${demoIcon('underline', 'slButtonLeading')}Underline</button></div>`,
      ),
      scene(
        'Editing history',
        'A compact icon-only toolbar with one seam system.',
        `<div slButtonGroup aria-label="Editing history"><button slIconButton aria-label="Undo" fill="outline" variant="secondary">${demoIcon('undo')}</button><button slIconButton aria-label="Redo" fill="outline" variant="secondary">${demoIcon('redo')}</button><button slIconButton aria-label="Delete" fill="outline" variant="secondary">${demoIcon('trash')}</button></div>`,
      ),
      scene(
        'Split action',
        'One primary action and its related options.',
        `<div slButtonGroup aria-label="Publish actions" class="slotted-split-action"><button slButton fill="solid" size="md" variant="accent">${demoIcon('save', 'slButtonLeading')}Publish</button><button slIconButton aria-label="More publish options" fill="solid" size="md" variant="accent">${demoIcon('chevron-down')}</button></div>`,
      ),
    ].join(''),
    '3',
  )}
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
