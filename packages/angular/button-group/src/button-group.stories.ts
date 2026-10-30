import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideRedo2, lucideTrash2, lucideUndo2 } from '@ng-icons/lucide';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlButton, SlIconButton, SlToggleButton } from '@slotted/angular/button';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButtonGroup } from './button-group';
import { SlButtonGroupSeparator } from './button-group-separator';
import { ANGULAR_BUTTON_GROUP_DOCS, ANGULAR_BUTTON_GROUP_TOKENS } from './button-group.docs';
import type { ButtonGroupJustify, ButtonGroupOrientation } from './button-group.types';

interface ButtonGroupStoryArgs {
  fullWidth: boolean;
  justify: ButtonGroupJustify | undefined;
  orientation: ButtonGroupOrientation;
}

/**
 * Captions and frames are demonstration devices of the reference page and
 * never part of the family.
 */
const demo = {
  caption: 'color: var(--slotted-text-muted); font-size: 11px',
  frame: [
    'border: 1px dashed var(--slotted-border-strong)',
    'border-radius: var(--slotted-radius-md)',
    'inline-size: 100%',
    'max-inline-size: 100%',
    'padding: var(--slotted-space-3)',
  ].join('; '),
  narrow: [
    'border: 1px dashed var(--slotted-border-strong)',
    'border-radius: var(--slotted-radius-md)',
    'inline-size: 240px',
    'max-inline-size: 100%',
    'padding: var(--slotted-space-3)',
  ].join('; '),
  column:
    'display: grid; gap: var(--slotted-space-8); grid-template-columns: minmax(0, 1fr); inline-size: 100%',
  row: 'display: grid; gap: var(--slotted-space-3); grid-template-columns: minmax(0, 1fr); justify-items: start',
};

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Shape as never,
});

const meta: Meta<ButtonGroupStoryArgs> = {
  title: 'Components/Button group',
  component: SlButtonGroup,
  decorators: [
    moduleMetadata({
      imports: [
        NgIcon,
        SlButtonGroup,
        SlButtonGroupSeparator,
        SlButton,
        SlIconButton,
        SlToggleButton,
      ],
      providers: [provideIcons({ lucideChevronDown, lucideRedo2, lucideTrash2, lucideUndo2 })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Button group',
        description:
          'Related actions joined into one shape: shared edges, one border in each shared column, corners on the ends of the bar only.',
        framework: 'Angular',
        ...ANGULAR_BUTTON_GROUP_DOCS.buttonGroup,
        tokens: ANGULAR_BUTTON_GROUP_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ButtonGroupStoryArgs>;

export const Playground: Story = {
  args: {
    fullWidth: false,
    justify: undefined,
    orientation: 'horizontal',
  },
  argTypes: {
    justify: { control: 'inline-radio', options: [undefined, 'start', 'center', 'end', 'between'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, demo },
    template: `
<div class="slotted-demo-stage" data-align="start">
  <div
    slButtonGroup
    aria-label="Record actions"
    [orientation]="orientation"
    [justify]="justify"
    [fullWidth]="fullWidth"
    tone="secondary"
    variant="outline"
  >
    <button slButton>Duplicate</button>
    <button slButton>Archive</button>
    <button slButton>Export</button>
  </div>
</div>`,
  }),
};

export const Shape: Story = {
  parameters: scenario('shape'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">One shape</span>
      <span class="slotted-demo-scene__note">
        The buttons share their edges and only the two ends of the bar are rounded. The edge belongs
        to the group, not to each control: a filled control's border is its own fill, so two of them
        overlapped would be one uninterrupted rectangle, and the seam between them is the darkest
        step of the control's own tone. A group of buttons that stand apart is not this family — it
        is an inline or a stack holding buttons.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column">
        <div [style]="demo.row">
          <span [style]="demo.caption">outline</span>
          <div slButtonGroup aria-label="Range" tone="secondary" variant="outline">
            <button slButton>Day</button>
            <button slButton>Week</button>
            <button slButton>Month</button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">solid, with a split action at the end</span>
          <div slButtonGroup aria-label="Publish">
            <button slButton>Publish</button>
            <button slButton>Schedule</button>
            <button slIconButton aria-label="More publish options" tone="accent" variant="solid">
              <ng-icon aria-hidden="true" name="lucideChevronDown"></ng-icon>
            </button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">ghost · an icon bar with no frame</span>
          <div slButtonGroup aria-label="Editor tools" tone="secondary" variant="ghost">
            <button slIconButton aria-label="Undo">
              <ng-icon aria-hidden="true" name="lucideUndo2"></ng-icon>
            </button>
            <button slIconButton aria-label="Redo">
              <ng-icon aria-hidden="true" name="lucideRedo2"></ng-icon>
            </button>
            <button slIconButton aria-label="Delete">
              <ng-icon aria-hidden="true" name="lucideTrash2"></ng-icon>
            </button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">one action keeps all four corners</span>
          <div slButtonGroup aria-label="Only one" tone="secondary" variant="outline">
            <button slButton>Alone</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A row, and a column</span>
      <span class="slotted-demo-scene__note">
        A column stretches its controls to one width, because a column at their natural widths is a
        ragged edge rather than a group. The corners turn with the axis, and they are logical, so a
        right-to-left document is the same bar mirrored.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column">
        <div [style]="demo.row">
          <span [style]="demo.caption">vertical · outline</span>
          <div slButtonGroup aria-label="Sort order" orientation="vertical" tone="secondary" variant="outline">
            <button slButton>Newest first</button>
            <button slButton>Oldest first</button>
            <button slButton>Most edited</button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">vertical · solid, so the seam has to carry it</span>
          <div slButtonGroup aria-label="Export" orientation="vertical">
            <button slButton>Export CSV</button>
            <button slButton>Export PDF</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Separator: Story = {
  parameters: scenario('separator'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Runs and rules</span>
      <span class="slotted-demo-scene__note">
        A rule takes no room of its own: the bar stays one shape, and the boundary is painted in the
        column the shared edge already occupies, one step stronger than the seams around it. A nested
        group is a run of the bar with a name of its own, which says what is on either side of the
        boundary where a rule only says that one exists.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column">
        <div [style]="demo.row">
          <span [style]="demo.caption">a rule inside an icon bar</span>
          <div slButtonGroup aria-label="Editor tools" tone="secondary" variant="ghost">
            <button slIconButton aria-label="Undo">
              <ng-icon aria-hidden="true" name="lucideUndo2"></ng-icon>
            </button>
            <button slIconButton aria-label="Redo">
              <ng-icon aria-hidden="true" name="lucideRedo2"></ng-icon>
            </button>
            <div slButtonGroupSeparator></div>
            <button slIconButton aria-label="Delete" tone="danger">
              <ng-icon aria-hidden="true" name="lucideTrash2"></ng-icon>
            </button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">a rule inside a framed bar</span>
          <div slButtonGroup aria-label="View" tone="secondary" variant="outline">
            <button slButton>Day</button>
            <button slButton>Week</button>
            <div slButtonGroupSeparator></div>
            <button slButton>Today</button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">two named runs · the destructive action has a group of its own</span>
          <div slButtonGroup aria-label="Record">
            <div slButtonGroup aria-label="Edit" tone="secondary" variant="outline">
              <button slButton>Duplicate</button>
              <button slButton>Archive</button>
            </div>
            <div slButtonGroupSeparator></div>
            <div slButtonGroup aria-label="Destructive" tone="danger" variant="outline">
              <button slButton>Delete</button>
            </div>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">vertical · a rule across the column</span>
          <div slButtonGroup aria-label="Record actions" orientation="vertical" tone="secondary" variant="outline">
            <button slButton>Duplicate</button>
            <button slButton>Archive</button>
            <div slButtonGroupSeparator></div>
            <button slButton tone="danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">The line, and a narrow one</span>
      <span class="slotted-demo-scene__note">
        A bar does not wrap and does not stack: its shape is the whole point of it. A label that
        outgrows the bar wraps inside its own control, which is the button family's rule. Asking for
        justify or fullWidth makes the group hold the line; fullWidth shares it in equal segments,
        whatever the labels weigh.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column">
        <div [style]="demo.row">
          <span [style]="demo.caption">justify · the bar holds the line and sits at its end</span>
          <div [style]="demo.frame">
            <div slButtonGroup aria-label="Dialog actions" justify="end">
              <button slButton tone="secondary" variant="outline">Cancel</button>
              <button slButton>Publish now</button>
            </div>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">fullWidth · equal segments</span>
          <div [style]="demo.frame">
            <div slButtonGroup aria-label="Range" fullWidth tone="secondary" variant="outline">
              <button slButton>Day</button>
              <button slButton>This quarter</button>
            </div>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">240px · a long label wraps inside its control</span>
          <div [style]="demo.narrow">
            <div slButtonGroup aria-label="Long">
              <button slButton tone="secondary" variant="outline">Zusammenarbeitseinstellungen</button>
              <button slButton>Speichern</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">What the group hands down</span>
      <span class="slotted-demo-scene__note">
        tone, variant and size travel through the button family's own defaults token, so a button
        that states one itself still wins. Every other state belongs to the control: the group does
        not disable, does not wait, and does not press. What the group does own is the bar's edge —
        a control that is on, or unavailable, keeps the frame it sits in and changes only its fill,
        so the bar never has a hole where that control is.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column">
        <div [style]="demo.row">
          <span [style]="demo.caption">the group paints, the button overrules</span>
          <div slButtonGroup aria-label="Painted" size="sm" tone="secondary" variant="outline">
            <button slButton>Inherits</button>
            <button slButton>Inherits</button>
            <button slButton tone="danger" variant="solid">States its own</button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">
            one toggle among actions · the frame stays whole around it, in the middle and at the
            end — an exclusive set of toggles is toggle-group
          </span>
          <div slButtonGroup aria-label="Record" tone="secondary" variant="outline">
            <button slButton>Duplicate</button>
            <button slToggleButton [defaultPressed]="true">Pin</button>
            <button slButton>Archive</button>
          </div>
          <div slButtonGroup aria-label="Record, pinned last" tone="secondary" variant="outline">
            <button slButton>Duplicate</button>
            <button slButton>Archive</button>
            <button slToggleButton [defaultPressed]="true">Pin</button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">
            two variants joined · the seam is the filled control's own edge
          </span>
          <div slButtonGroup aria-label="Save or cancel">
            <button slButton tone="secondary" variant="outline">Cancel</button>
            <button slButton>Save</button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">one control waiting, one unavailable</span>
          <div slButtonGroup aria-label="Review" tone="secondary" variant="outline">
            <button slButton>Approve</button>
            <button slButton loading [messages]="{ loading: 'Reassigning' }">Reassign</button>
            <button slButton disabled>Reject</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { demo },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Several tab stops, and a name</span>
      <span class="slotted-demo-scene__note">
        Tab through the bar below. Every control is its own stop and its focus ring is painted over
        its neighbours rather than under them, which is the whole reason the group raises the
        control being touched. The arrow-key model — one tab stop, Left and Right between controls —
        is the toolbar family, not this one.
      </span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div [style]="demo.column">
        <div [style]="demo.row">
          <span [style]="demo.caption">aria-label names the group</span>
          <div slButtonGroup aria-label="Text alignment" tone="secondary" variant="outline">
            <button slButton>Day</button>
            <button slButton>Week</button>
            <button slButton>Month</button>
          </div>
        </div>
        <div [style]="demo.row">
          <span [style]="demo.caption">a named run says more than a rule can</span>
          <div slButtonGroup aria-label="Record">
            <div slButtonGroup aria-label="Edit" tone="secondary" variant="outline">
              <button slButton>Duplicate</button>
              <button slButton>Archive</button>
            </div>
            <div slButtonGroup aria-label="Destructive" tone="danger" variant="outline">
              <button slButton>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};
