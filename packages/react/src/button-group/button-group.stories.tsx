import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronDown, Redo2, Trash2, Undo2 } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { Button, IconButton, ToggleButton } from '../button';
import { ButtonGroup } from './button-group';
import { ButtonGroupSeparator } from './button-group-separator';
import { REACT_BUTTON_GROUP_DOCS, REACT_BUTTON_GROUP_TOKENS } from './button-group.docs';
import type { ButtonGroupJustify, ButtonGroupOrientation } from './button-group.types';

function Caption({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--slotted-text-muted)', fontSize: '11px' }}>{children}</span>;
}

function Frame({ children, width }: { children: ReactNode; width?: string | undefined }) {
  return (
    <div
      style={{
        border: '1px dashed var(--slotted-border-strong)',
        borderRadius: 'var(--slotted-radius-md)',
        inlineSize: width ?? '100%',
        maxInlineSize: '100%',
        padding: 'var(--slotted-space-3)',
      }}
    >
      {children}
    </div>
  );
}

/** Consumer content, and it is Lucide's, so the page needs no icon family to read. */
const UNDO = <Undo2 aria-hidden="true" focusable="false" />;
const REDO = <Redo2 aria-hidden="true" focusable="false" />;
const TRASH = <Trash2 aria-hidden="true" focusable="false" />;
const CHEVRON = <ChevronDown aria-hidden="true" focusable="false" />;

const column: CSSProperties = {
  display: 'grid',
  gap: 'var(--slotted-space-8)',
  gridTemplateColumns: 'minmax(0, 1fr)',
  inlineSize: '100%',
};
const row: CSSProperties = { ...column, gap: 'var(--slotted-space-3)', justifyItems: 'start' };

interface ButtonGroupStoryArgs {
  fullWidth: boolean;
  justify: ButtonGroupJustify | undefined;
  orientation: ButtonGroupOrientation;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Shape as never,
});

const meta = {
  title: 'Components/Button group',
  component: ButtonGroup,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Button group',
        description:
          'Related actions joined into one shape: shared edges, one border in each shared column, corners on the ends of the bar only.',
        framework: 'React',
        ...REACT_BUTTON_GROUP_DOCS.buttonGroup,
        tokens: REACT_BUTTON_GROUP_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof ButtonGroup>;

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
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start">
      <ButtonGroup {...args} aria-label="Record actions" tone="secondary" variant="outline">
        <Button>Duplicate</Button>
        <Button>Archive</Button>
        <Button>Export</Button>
      </ButtonGroup>
    </div>
  ),
};

export const Shape: Story = {
  parameters: scenario('shape'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">One shape</span>
          <span className="slotted-demo-scene__note">
            The buttons share their edges and only the two ends of the bar are rounded. The edge
            belongs to the group, not to each control: a filled control’s border is its own fill, so
            two of them overlapped would be one uninterrupted rectangle, and the seam between them
            is the darkest step of the control’s own tone. A group of buttons that stand apart is
            not this family — it is an inline or a stack holding buttons.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>outline</Caption>
              <ButtonGroup aria-label="Range" tone="secondary" variant="outline">
                <Button>Day</Button>
                <Button>Week</Button>
                <Button>Month</Button>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>solid, with a split action at the end</Caption>
              <ButtonGroup aria-label="Publish">
                <Button>Publish</Button>
                <Button>Schedule</Button>
                <IconButton aria-label="More publish options" tone="accent" variant="solid">
                  {CHEVRON}
                </IconButton>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>ghost · an icon bar with no frame</Caption>
              <ButtonGroup aria-label="Editor tools" tone="secondary" variant="ghost">
                <IconButton aria-label="Undo">{UNDO}</IconButton>
                <IconButton aria-label="Redo">{REDO}</IconButton>
                <IconButton aria-label="Delete">{TRASH}</IconButton>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>one action keeps all four corners</Caption>
              <ButtonGroup aria-label="Only one" tone="secondary" variant="outline">
                <Button>Alone</Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A row, and a column</span>
          <span className="slotted-demo-scene__note">
            A column stretches its controls to one width, because a column at their natural widths
            is a ragged edge rather than a group. The corners turn with the axis, and they are
            logical, so a right-to-left document is the same bar mirrored.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>vertical · outline</Caption>
              <ButtonGroup
                aria-label="Sort order"
                orientation="vertical"
                tone="secondary"
                variant="outline"
              >
                <Button>Newest first</Button>
                <Button>Oldest first</Button>
                <Button>Most edited</Button>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>vertical · solid, so the seam has to carry it</Caption>
              <ButtonGroup aria-label="Export" orientation="vertical">
                <Button>Export CSV</Button>
                <Button>Export PDF</Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Separator: Story = {
  parameters: scenario('separator'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Runs and rules</span>
          <span className="slotted-demo-scene__note">
            A rule takes no room of its own: the bar stays one shape, and the boundary is painted in
            the column the shared edge already occupies, one step stronger than the seams around it.
            A nested group is a run of the bar with a name of its own, which says what is on either
            side of the boundary where a rule only says that one exists.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>a rule inside an icon bar</Caption>
              <ButtonGroup aria-label="Editor tools" tone="secondary" variant="ghost">
                <IconButton aria-label="Undo">{UNDO}</IconButton>
                <IconButton aria-label="Redo">{REDO}</IconButton>
                <ButtonGroupSeparator />
                <IconButton aria-label="Delete" tone="danger">
                  {TRASH}
                </IconButton>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>a rule inside a framed bar</Caption>
              <ButtonGroup aria-label="View" tone="secondary" variant="outline">
                <Button>Day</Button>
                <Button>Week</Button>
                <ButtonGroupSeparator />
                <Button>Today</Button>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>two named runs · the destructive action has a group of its own</Caption>
              <ButtonGroup aria-label="Record">
                <ButtonGroup aria-label="Edit" tone="secondary" variant="outline">
                  <Button>Duplicate</Button>
                  <Button>Archive</Button>
                </ButtonGroup>
                <ButtonGroupSeparator />
                <ButtonGroup aria-label="Destructive" tone="danger" variant="outline">
                  <Button>Delete</Button>
                </ButtonGroup>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>vertical · a rule across the column</Caption>
              <ButtonGroup
                aria-label="Record actions"
                orientation="vertical"
                tone="secondary"
                variant="outline"
              >
                <Button>Duplicate</Button>
                <Button>Archive</Button>
                <ButtonGroupSeparator />
                <Button tone="danger">Delete</Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The line, and a narrow one</span>
          <span className="slotted-demo-scene__note">
            A bar does not wrap and does not stack: its shape is the whole point of it. A label that
            outgrows the bar wraps inside its own control, which is the button family’s rule. Asking
            for justify or fullWidth makes the group hold the line; fullWidth shares it in equal
            segments, whatever the labels weigh.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>justify · the bar holds the line and sits at its end</Caption>
              <Frame>
                <ButtonGroup aria-label="Dialog actions" justify="end">
                  <Button tone="secondary" variant="outline">
                    Cancel
                  </Button>
                  <Button>Publish now</Button>
                </ButtonGroup>
              </Frame>
            </div>
            <div style={row}>
              <Caption>fullWidth · equal segments</Caption>
              <Frame>
                <ButtonGroup aria-label="Range" fullWidth tone="secondary" variant="outline">
                  <Button>Day</Button>
                  <Button>This quarter</Button>
                </ButtonGroup>
              </Frame>
            </div>
            <div style={row}>
              <Caption>240px · a long label wraps inside its control</Caption>
              <Frame width="240px">
                <ButtonGroup aria-label="Long">
                  <Button tone="secondary" variant="outline">
                    Zusammenarbeitseinstellungen
                  </Button>
                  <Button>Speichern</Button>
                </ButtonGroup>
              </Frame>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">What the group hands down</span>
          <span className="slotted-demo-scene__note">
            tone, variant and size travel through the button family’s own defaults, so a button that
            states one itself still wins. Every other state belongs to the control: the group does
            not disable, does not wait, and does not press. What the group does own is the bar’s
            edge — a control that is on, or unavailable, keeps the frame it sits in and changes only
            its fill, so the bar never has a hole where that control is.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>the group paints, the button overrules</Caption>
              <ButtonGroup aria-label="Painted" size="sm" tone="secondary" variant="outline">
                <Button>Inherits</Button>
                <Button>Inherits</Button>
                <Button tone="danger" variant="solid">
                  States its own
                </Button>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>
                one toggle among actions · the frame stays whole around it, in the middle and at the
                end — an exclusive set of toggles is toggle-group
              </Caption>
              <ButtonGroup aria-label="Record" tone="secondary" variant="outline">
                <Button>Duplicate</Button>
                <ToggleButton defaultPressed>Pin</ToggleButton>
                <Button>Archive</Button>
              </ButtonGroup>
              <ButtonGroup aria-label="Record, pinned last" tone="secondary" variant="outline">
                <Button>Duplicate</Button>
                <Button>Archive</Button>
                <ToggleButton defaultPressed>Pin</ToggleButton>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>two variants joined · the seam is the filled control’s own edge</Caption>
              <ButtonGroup aria-label="Save or cancel">
                <Button tone="secondary" variant="outline">
                  Cancel
                </Button>
                <Button>Save</Button>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>one control waiting, one unavailable</Caption>
              <ButtonGroup aria-label="Review" tone="secondary" variant="outline">
                <Button>Approve</Button>
                <Button loading messages={{ loading: 'Reassigning' }}>
                  Reassign
                </Button>
                <Button disabled>Reject</Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Several tab stops, and a name</span>
          <span className="slotted-demo-scene__note">
            Tab through the bar below. Every control is its own stop and its focus ring is painted
            over its neighbours rather than under them, which is the whole reason the group raises
            the control being touched. The arrow-key model — one tab stop, Left and Right between
            controls — is the toolbar family, not this one.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>aria-label names the group</Caption>
              <ButtonGroup aria-label="Text alignment" tone="secondary" variant="outline">
                <Button>Day</Button>
                <Button>Week</Button>
                <Button>Month</Button>
              </ButtonGroup>
            </div>
            <div style={row}>
              <Caption>a named run says more than a rule can</Caption>
              <ButtonGroup aria-label="Record">
                <ButtonGroup aria-label="Edit" tone="secondary" variant="outline">
                  <Button>Duplicate</Button>
                  <Button>Archive</Button>
                </ButtonGroup>
                <ButtonGroup aria-label="Destructive" tone="danger" variant="outline">
                  <Button>Delete</Button>
                </ButtonGroup>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};
