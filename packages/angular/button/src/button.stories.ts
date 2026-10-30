import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideSave, lucideTrash2 } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from './button';
import { SlButtonEnd, SlButtonStart } from './button-appearance';
import { provideButtonDefaults } from './button-defaults';
import {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button.constants';
import { ANGULAR_BUTTON_DOCS, ANGULAR_BUTTON_TOKENS } from './button.docs';

/**
 * A slot marker is a component, so it cannot sit on `ng-icon` — two components
 * on one element is NG0300. It goes on an element the template writes, which
 * is also the tree the React binding renders: the glyph inside `[data-part]`.
 */
const icon = (name: string, marker = '') => {
  const glyph = `<ng-icon aria-hidden="true" name="${name}"></ng-icon>`;
  return marker ? `<span ${marker}>${glyph}</span>` : glyph;
};

interface ButtonStoryArgs {
  disabled: boolean;
  fullWidth: boolean;
  label: string;
  loading: boolean;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Variants as never,
});

const decorators = [
  moduleMetadata({
    imports: [NgIcon, SlButton, SlButtonEnd, SlButtonStart],
    providers: [provideIcons({ lucideChevronDown, lucideSave, lucideTrash2 })],
  }),
];

const meta: Meta<ButtonStoryArgs> = {
  title: 'Components/Button family/Button',
  component: SlButton,
  decorators,
  args: {
    disabled: false,
    fullWidth: false,
    label: 'Save changes',
    loading: false,
    size: 'md',
    tone: 'accent',
    variant: 'solid',
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
        title: 'Button',
        description: 'A momentary action, on the platform’s own button element.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_DOCS.button,
        tokens: ANGULAR_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
  render: (args) => ({
    props: args,
    template: `<button
      slButton
      [tone]="tone"
      [variant]="variant"
      [size]="size"
      [disabled]="disabled"
      [loading]="loading"
      [fullWidth]="fullWidth"
    >{{ label }}</button>`,
  }),
};

export default meta;
type Story = StoryObj<ButtonStoryArgs>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/** The emphasis ladder: one primary action per region, and everything else below it. */
export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_TONES.map(
      (tone) =>
        `<div class="slotted-demo-row">${BUTTON_VARIANTS.map(
          (variant) => `<button slButton tone="${tone}" variant="${variant}">${tone}</button>`,
        ).join('')}</div>`,
    ).join('')}</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `<div class="slotted-demo-stage">
      <div class="slotted-demo-row">
        <button slButton>${icon('lucideSave', 'slButtonStart')}Save</button>
        <button slButton variant="outline">Save and…${icon('lucideChevronDown', 'slButtonEnd')}</button>
        <button slButton variant="ghost">${icon('lucideSave', 'slButtonStart')}Save${icon('lucideChevronDown', 'slButtonEnd')}</button>
      </div>
      <div class="slotted-demo-row">${BUTTON_SIZES.map(
        (size) =>
          `<button slButton size="${size}">${icon('lucideSave', 'slButtonStart')}${size}</button>`,
      ).join('')}</div>
    </div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `<div class="slotted-demo-stage">${BUTTON_VARIANTS.map(
      (variant) => `<div class="slotted-demo-row">
        <button slButton variant="${variant}">${variant}</button>
        <button slButton variant="${variant}" disabled>Disabled</button>
        <button slButton variant="${variant}" disabled focusableWhenDisabled>Disabled, reachable</button>
        <button slButton variant="${variant}" loading>Loading</button>
        <button slButton variant="${variant}" tone="danger">${icon('lucideTrash2', 'slButtonStart')}Delete</button>
      </div>`,
    ).join('')}</div>`,
  }),
};

/**
 * A band of the control's own ink crosses it for as long as it waits, and the
 * control keeps everything it was showing: the width is the same before and
 * after, the glyph stays in its slot, and the label a person just pressed
 * stays readable. The ring the band replaced had to be drawn over that label
 * whenever the control had no icon to lend it a box.
 *
 * The ring is still there. It is the element that carries `progressbar` and
 * the name of the wait, so it steps out of the flow rather than out of the
 * accessibility tree, and it is drawn again wherever the band cannot be: on an
 * icon-only control, which has no label to spare, and under reduced motion or
 * forced colours, where an engine has no band to give.
 *
 * The matrix is every tone against every variant, because `currentColor` is
 * what paints the band: the ink the control is already writing its label with
 * contrasts with that control's ground by construction, at every tone, in
 * every scheme.
 */
export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    template: `<div class="slotted-demo-stage">
      <div class="slotted-demo-row">
        <button slButton>${icon('lucideSave', 'slButtonStart')}Save changes</button>
        <button slButton loading [messages]="{ loading: 'Saving' }">${icon('lucideSave', 'slButtonStart')}Save changes</button>
        <button slButton loading [messages]="{ loading: 'Adding' }" variant="outline">Add member</button>
        <button slButton loading [loadingDelay]="400" [messages]="{ loading: 'Publishing' }" variant="outline">${icon('lucideSave', 'slButtonStart')}Delayed wait</button>
      </div>
      ${BUTTON_VARIANTS.map(
        (variant) => `<div class="slotted-demo-row">
        ${BUTTON_TONES.map(
          (tone) =>
            `<button slButton loading [messages]="{ loading: '${tone} ${variant}' }" tone="${tone}" variant="${variant}">${icon('lucideSave', 'slButtonStart')}${tone}</button>`,
        ).join('')}
        ${BUTTON_TONES.map(
          (tone) =>
            `<button slButton loading [messages]="{ loading: '${tone} ${variant}, no glyph' }" tone="${tone}" variant="${variant}">${tone}</button>`,
        ).join('')}
      </div>`,
      ).join('')}
      <div class="slotted-demo-row">
        ${BUTTON_SIZES.map(
          (size) =>
            `<button slButton loading [messages]="{ loading: '${size}' }" size="${size}">${icon('lucideSave', 'slButtonStart')}${size}</button>`,
        ).join('')}
        ${BUTTON_SIZES.map(
          (size) =>
            `<button slButton loading [messages]="{ loading: '${size}' }" size="${size}" variant="outline">${size}</button>`,
        ).join('')}
      </div>
    </div>`,
  }),
};

/**
 * Angular needs no `render`: every member is a directive on the element the
 * consumer wrote, so substituting the element is done by writing a different
 * one, and a `routerLink`, a `form` or a directive from another library goes on
 * that same element.
 */
export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `<div class="slotted-demo-row">
      <button slButton form="preferences" type="submit">${icon('lucideSave', 'slButtonStart')}Submits a form elsewhere</button>
      <button slButton data-analytics="save" variant="outline">Carries the consumer's own attributes</button>
    </div>`,
  }),
};

/**
 * An application decides once how its actions are painted. An axis the provider
 * leaves unset keeps each member its own default, and a button that states an
 * axis itself always wins.
 */
export const Defaults: Story = {
  parameters: scenario('defaults'),
  decorators: [
    moduleMetadata({ providers: [provideButtonDefaults({ size: 'sm', tone: 'success' })] }),
  ],
  render: () => ({
    template: `<div class="slotted-demo-row">
      <button slButton>Inherits size and tone</button>
      <button slButton variant="outline">And keeps its own paint</button>
      <button slButton size="lg" tone="danger">States both itself</button>
    </div>`,
  }),
};

export const FullWidth: Story = {
  parameters: scenario('fullWidth'),
  render: () => ({
    template: `<div class="slotted-demo-measure"><div class="slotted-demo-stack">
      <button slButton fullWidth>${icon('lucideSave', 'slButtonStart')}Confirm and continue</button>
      <button slButton fullWidth variant="outline">Export every invoice issued this quarter</button>
    </div></div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `<div class="slotted-demo-stack">
      <button slButton aria-describedby="save-help">Save</button>
      <p id="save-help">Saves the current document and stays on the page.</p>
      <button slButton aria-describedby="delete-help" tone="danger" variant="outline">Delete workspace</button>
      <p id="delete-help">Deletes the workspace and everything in it. This cannot be undone.</p>
    </div>`,
  }),
};
