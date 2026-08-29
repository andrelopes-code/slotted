import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideRedo2,
  lucideSave,
  lucideTrash2,
  lucideUndo2,
} from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';

import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlButton } from './button';
import { SlButtonGroup } from './button-group';
import { SlIconButton } from './icon-button';

const demoIconNames = {
  'chevron-down': 'lucideChevronDown',
  redo: 'lucideRedo2',
  save: 'lucideSave',
  trash: 'lucideTrash2',
  undo: 'lucideUndo2',
} as const;
const demoIcon = (name: keyof typeof demoIconNames, marker = '') =>
  `<ng-icon ${marker} aria-hidden="true" name="${demoIconNames[name]}"></ng-icon>`;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta: Meta = {
  title: 'Components/Button family/ButtonGroup',
  component: SlButtonGroup,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlButton, SlButtonGroup, SlIconButton],
      providers: [
        provideIcons({
          lucideChevronDown,
          lucideRedo2,
          lucideSave,
          lucideTrash2,
          lucideUndo2,
        }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ButtonGroup',
        description: 'Related controls share geometry while keeping their own native semantics.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.buttonGroup,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: () => ({
    template: `<div slButtonGroup aria-label="Editing history"><button slIconButton aria-label="Undo" tone="neutral" variant="outline">${demoIcon('undo')}</button><button slIconButton aria-label="Redo" tone="neutral" variant="outline">${demoIcon('redo')}</button></div>`,
  }),
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header"><span class="slotted-demo-scene__label">Horizontal toolbar</span><span class="slotted-demo-scene__note">Compact icon actions share one outline.</span></header>
    <div class="slotted-demo-stage"><div slButtonGroup aria-label="Editing history"><button slIconButton aria-label="Undo" tone="neutral" variant="outline">${demoIcon('undo')}</button><button slIconButton aria-label="Redo" tone="neutral" variant="outline">${demoIcon('redo')}</button><button slIconButton aria-label="Delete" tone="neutral" variant="outline">${demoIcon('trash')}</button></div></div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header"><span class="slotted-demo-scene__label">Vertical actions</span><span class="slotted-demo-scene__note">A stacked set keeps its edge treatment.</span></header>
    <div class="slotted-demo-stage"><div slButtonGroup aria-label="Document actions" orientation="vertical"><button slButton tone="neutral" variant="outline">${demoIcon('save', 'slButtonLeading')}Save draft</button><button slButton tone="neutral" variant="outline">Duplicate</button></div></div>
  </section>
</div>`,
  }),
};

export const SplitAction: Story = {
  parameters: scenario('splitAction'),
  render: () => ({
    template: `<div class="slotted-demo-stage"><div slButtonGroup aria-label="Publish actions" class="slotted-split-action"><button slButton size="md" tone="accent" variant="solid">${demoIcon('save', 'slButtonLeading')}Publish</button><button slIconButton aria-label="More publish options" size="md" tone="accent" variant="solid">${demoIcon('chevron-down')}</button></div></div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<div slButtonGroup aria-label="Editing history"><button slIconButton aria-label="Undo" tone="neutral" variant="outline">${demoIcon('undo')}</button><button slIconButton aria-label="Redo" tone="neutral" variant="outline">${demoIcon('redo')}</button></div>`,
  }),
};
