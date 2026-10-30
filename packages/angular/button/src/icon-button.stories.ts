import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBold,
  lucideEllipsis,
  lucideItalic,
  lucidePlus,
  lucideRefreshCw,
  lucideStar,
  lucideTrash2,
  lucideUnderline,
} from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  BUTTON_SHAPES,
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
  type ButtonShape,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button.constants';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';
import { SlIconButton } from './icon-button';

const icon = (name: string) => `<ng-icon aria-hidden="true" name="${name}"></ng-icon>`;

interface IconButtonStoryArgs {
  ariaLabel: string;
  disabled: boolean;
  loading: boolean;
  shape: ButtonShape;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta: Meta<IconButtonStoryArgs> = {
  title: 'Components/Button family/IconButton',
  component: SlIconButton,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlIconButton],
      providers: [
        provideIcons({
          lucideBold,
          lucideEllipsis,
          lucideItalic,
          lucidePlus,
          lucideRefreshCw,
          lucideStar,
          lucideTrash2,
          lucideUnderline,
        }),
      ],
    }),
  ],
  args: {
    ariaLabel: 'Add member',
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
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.iconButton,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template: `<button
      slIconButton
      [attr.aria-label]="ariaLabel"
      [tone]="tone"
      [variant]="variant"
      [size]="size"
      [shape]="shape"
      [disabled]="disabled"
      [loading]="loading"
    >${icon('lucidePlus')}</button>`,
  }),
};

export default meta;
type Story = StoryObj<IconButtonStoryArgs>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => ({
    template: `<div class="slotted-demo-row">${BUTTON_SHAPES.map(
      (shape) =>
        `<button slIconButton aria-label="Add, ${shape}" shape="${shape}" tone="accent" variant="solid">${icon('lucidePlus')}</button>` +
        `<button slIconButton aria-label="Refresh, ${shape}" shape="${shape}" variant="outline">${icon('lucideRefreshCw')}</button>`,
    ).join('')}</div>`,
  }),
};

/** The control height in both axes, so the target never falls below 24 by 24. */
export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `<div class="slotted-demo-row">${BUTTON_SIZES.map(
      (size) =>
        `<button slIconButton aria-label="Add, ${size}" size="${size}" tone="accent" variant="solid">${icon('lucidePlus')}</button>`,
    ).join('')}${BUTTON_SIZES.map(
      (size) =>
        `<button slIconButton aria-label="More, ${size}" size="${size}">${icon('lucideEllipsis')}</button>`,
    ).join('')}</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_VARIANTS.map(
      (variant) => `<div class="slotted-demo-row">
        <button slIconButton aria-label="Add, ${variant}" variant="${variant}">${icon('lucidePlus')}</button>
        <button slIconButton aria-label="Add, ${variant}, unavailable" variant="${variant}" disabled>${icon('lucidePlus')}</button>
        <button slIconButton aria-label="Add, ${variant}, waiting" variant="${variant}" loading>${icon('lucidePlus')}</button>
        <button slIconButton aria-label="Delete, ${variant}" variant="${variant}" tone="danger">${icon('lucideTrash2')}</button>
      </div>`,
    ).join('')}</div>`,
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: `<div class="slotted-demo-row">
      <button slIconButton aria-label="Refresh" variant="outline" loading>${icon('lucideRefreshCw')}</button>
      <button slIconButton aria-label="Refresh" shape="circle" tone="accent" variant="solid" loading>${icon('lucideRefreshCw')}</button>
    </div>`,
  }),
};

/**
 * An icon toggle takes `pressed` directly. The name is an attribute already,
 * so it cannot drift with the state the way a visible label could.
 */
export const Pressed: Story = {
  parameters: scenario('pressed'),
  render: () => ({
    template: `<div class="slotted-demo-stack">
      <div class="slotted-demo-row">
        <button slIconButton aria-label="Bold" defaultPressed>${icon('lucideBold')}</button>
        <button slIconButton aria-label="Italic" [defaultPressed]="false">${icon('lucideItalic')}</button>
        <button slIconButton aria-label="Underline" [defaultPressed]="false">${icon('lucideUnderline')}</button>
      </div>
      <div class="slotted-demo-row">
        <button slIconButton aria-label="Favorite" defaultPressed shape="circle" tone="warning">${icon('lucideStar')}</button>
        <button slIconButton aria-label="Favorite, unavailable" defaultPressed disabled shape="circle">${icon('lucideStar')}</button>
      </div>
    </div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<div class="slotted-demo-stack">
      <div class="slotted-demo-row">
        <button slIconButton aria-describedby="delete-help" aria-label="Delete invoice" tone="danger">${icon('lucideTrash2')}</button>
        <span id="delete-help">Deletes the invoice. This cannot be undone.</span>
      </div>
      <div class="slotted-demo-row">
        <span id="refresh-name">Refresh the report</span>
        <button slIconButton aria-labelledby="refresh-name" variant="outline">${icon('lucideRefreshCw')}</button>
      </div>
    </div>`,
  }),
};
