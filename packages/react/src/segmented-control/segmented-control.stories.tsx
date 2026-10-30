import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BarChart3,
  Columns3,
  LayoutGrid,
  List,
  Map,
  Table,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldLabel } from '../field';
import { Grid, Measure, Scene } from '../field/field-demo';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { SegmentedControl } from './segmented-control';
import { SegmentedControlDefaultsProvider } from './segmented-control-defaults';
import { Segment } from './segmented-control-parts';
import {
  REACT_SEGMENTED_CONTROL_DOCS,
  REACT_SEGMENTED_CONTROL_TOKENS,
} from './segmented-control.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SEGMENTED_CONTROL_DOCS.segmentedControl.scenes, {
    playground: Playground,
    sizes: Sizes,
    orientation: Orientation,
    states: States,
    iconOnly: IconOnly,
    variants: Variants,
    condense: Condense,
    width: Width,
    field: InsideAField,
    form: InAForm,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  });

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Segmented Control',
        description:
          'One choice out of a few, applied at once, on a track. Every segment is a real radio sharing one name, so the platform supplies the whole keyboard, the submitted value and the position a screen reader announces — and the thumb’s place is arithmetic rather than measured.',
        framework: 'React',
        ...REACT_SEGMENTED_CONTROL_DOCS.segmentedControl,
        tokens: REACT_SEGMENTED_CONTROL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'aria-label': 'Chart period',
    condense: 'none',
    defaultValue: 'week',
    disabled: false,
    fullWidth: false,
    invalid: false,
    orientation: 'horizontal',
    readOnly: false,
    required: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <SegmentedControl {...args}>
        <Segment value="day">Day</Segment>
        <Segment value="week">Week</Segment>
        <Segment value="month">Month</Segment>
      </SegmentedControl>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The three steps"
        note="Side by side rather than stacked: thirty, thirty-four and thirty-eight pixels is four pixels between neighbours, and a control stretched across the page hides a difference that small."
        layout="row"
      >
        <SegmentedControl aria-label="View, small" defaultValue="grid" size="sm">
          <Segment value="grid">Grid</Segment>
          <Segment value="list">List</Segment>
        </SegmentedControl>
        <SegmentedControl aria-label="View, medium" defaultValue="grid" size="md">
          <Segment value="grid">Grid</Segment>
          <Segment value="list">List</Segment>
        </SegmentedControl>
        <SegmentedControl aria-label="View, large" defaultValue="grid" size="lg">
          <Segment value="grid">Grid</Segment>
          <Segment value="list">List</Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="In the row it shares with a field and a button"
        note="This is the reason the height is measured back rather than added to: a control two pixels prouder than the field beside it is the defect nobody can name and everybody sees."
        layout="row"
      >
        <Measure>
          <TextField aria-label="Invoice number" defaultValue="INV-2048" />
        </Measure>
        <SegmentedControl aria-label="Currency" defaultValue="brl">
          <Segment value="brl">BRL</Segment>
          <Segment value="usd">USD</Segment>
        </SegmentedControl>
        <Button tone="secondary" variant="outline">
          Save invoice
        </Button>
      </Scene>
    </Grid>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Along the line"
        note="aria-orientation is written here because radiogroup already implies vertical, so the attribute says something exactly when the set flows the other way."
        layout="block"
      >
        <SegmentedControl aria-label="Period, inline" defaultValue="week">
          <Segment value="day">Day</Segment>
          <Segment value="week">Week</Segment>
          <Segment value="month">Month</Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="Down the page"
        note="The thumb travels in the block axis and the rules between the segments turn with it. The platform moves the choice with both pairs of arrows either way."
        layout="block"
      >
        <SegmentedControl aria-label="Payment" defaultValue="invoice" orientation="vertical">
          <Segment value="card">Card</Segment>
          <Segment value="transfer">Wire transfer</Segment>
          <Segment value="invoice">ACH transfer</Segment>
        </SegmentedControl>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One segment out of action"
        note="An unavailable segment loses its ink and keeps its place. Point at the two beside it: a live segment answers with a neutral ground, and the chosen one does not answer at all."
        layout="block"
      >
        <SegmentedControl aria-label="Plan, one unavailable" defaultValue="starter">
          <Segment value="starter">Starter</Segment>
          <Segment value="team">Team</Segment>
          <Segment disabled value="enterprise">
            Corporativo
          </Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="The whole control out of action"
        note="The track keeps its ground so the thumb still reads against it: a reader learns which of the three was chosen even in a control they cannot change."
        layout="block"
      >
        <SegmentedControl aria-label="Plan, unavailable" defaultValue="team" disabled>
          <Segment value="starter">Starter</Segment>
          <Segment value="team">Team</Segment>
          <Segment value="enterprise">Corporativo</Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="Read-only"
        note="It keeps every colour and every tab stop and refuses the change on the click a pointer and Space share, because a radio has no readonly and it must not be mistaken for a disabled control."
        layout="block"
      >
        <SegmentedControl aria-label="Plano, somente leitura" defaultValue="team" readOnly>
          <Segment value="starter">Inicial</Segment>
          <Segment value="team">Equipe</Segment>
          <Segment value="enterprise">Corporativo</Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="Invalid, with nothing chosen"
        note="The track takes the danger edge and the focus ring is pointed at the same step, so the outline and its shadow move together instead of being repainted rule by rule."
        layout="block"
      >
        <SegmentedControl aria-label="Plan, invalid" invalid required>
          <Segment value="starter">Starter</Segment>
          <Segment value="team">Team</Segment>
          <Segment value="enterprise">Corporativo</Segment>
        </SegmentedControl>
      </Scene>
    </Grid>
  ),
};

export const IconOnly: Story = {
  parameters: scenario('iconOnly'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Marks without words"
        note="A segment with only a mark draws square and takes its name from the aria-label on its radio. The rules between them still give way around the thumb."
        layout="block"
      >
        <SegmentedControl aria-label="Alignment" defaultValue="center">
          <Segment aria-label="Start" icon={<AlignLeft size={16} />} value="start" />
          <Segment aria-label="Center" icon={<AlignCenter size={16} />} value="center" />
          <Segment aria-label="End" icon={<AlignRight size={16} />} value="end" />
        </SegmentedControl>
      </Scene>
      <Scene
        label="At the smallest step"
        note="The thumb is shorter than the control, so the radio reaches the track's own edge: the target stays the control's full height even where the thumb is eighteen pixels."
        layout="block"
      >
        <SegmentedControl aria-label="Alignment, small" defaultValue="center" size="sm">
          <Segment aria-label="Start" icon={<AlignLeft size={14} />} value="start" />
          <Segment aria-label="Center" icon={<AlignCenter size={14} />} value="center" />
        </SegmentedControl>
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A track"
        note="The box with a thumb behind the chosen segment, every segment as wide as the widest."
        layout="block"
      >
        <SegmentedControl aria-label="Period, track" defaultValue="month">
          <Segment value="day">Day</Segment>
          <Segment value="week">Week</Segment>
          <Segment value="month">Month</Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="The words alone"
        note="The same radio group with no track: the chosen word in the text colour and underlined, the others muted."
        layout="block"
      >
        <SegmentedControl aria-label="Period, underline" defaultValue="month" variant="underline">
          <Segment value="day">Day</Segment>
          <Segment value="week">Week</Segment>
          <Segment value="month">Month</Segment>
        </SegmentedControl>
      </Scene>
    </Grid>
  ),
};

export const Condense: Story = {
  parameters: scenario('condense'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Room for its words"
        note="Above the breakpoint the control shows the mark and the label together, which is what a page header has room for and what a reader reads fastest."
        layout="block"
      >
        <SegmentedControl aria-label="Report, wide" condense="icons" defaultValue="table">
          <Segment icon={<Table size={16} />} value="table">
            Table
          </Segment>
          <Segment icon={<BarChart3 size={16} />} value="chart">
            Chart
          </Segment>
          <Segment icon={<Map size={16} />} value="map">
            Mapa
          </Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="Narrower than its words"
        note="The same control in a sidebar keeps its marks and hides its words. They are hidden and not removed, so each segment is announced exactly as it was at the wider size."
        layout="block"
      >
        <Measure>
          <SegmentedControl aria-label="Report, narrow" condense="icons" defaultValue="table">
            <Segment icon={<Table size={16} />} value="table">
              Table
            </Segment>
            <Segment icon={<BarChart3 size={16} />} value="chart">
              Chart
            </Segment>
            <Segment icon={<Map size={16} />} value="map">
              Mapa
            </Segment>
          </SegmentedControl>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Every column is the widest label's"
        note="Left alone the track shrinks to its content and the columns stay equal, which is the rule Carbon states — taken from the layout here rather than measured by script."
        layout="block"
      >
        <SegmentedControl aria-label="Status" defaultValue="all">
          <Segment value="all">All</Segment>
          <Segment value="draft">Draft</Segment>
          <Segment value="sent">Sent</Segment>
          <Segment value="overdue">Overdue</Segment>
          <Segment value="paid">Paid</Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="Sharing the whole line"
        note="fullWidth spreads the same equal columns across the line the control was given, so a filter above a table lines up with the table's own edges."
        layout="block"
      >
        <SegmentedControl aria-label="Delivery" defaultValue="afternoon" fullWidth>
          <Segment value="morning">Morning</Segment>
          <Segment value="afternoon">Afternoon</Segment>
          <Segment value="evening">Evening</Segment>
        </SegmentedControl>
      </Scene>
    </Grid>
  ),
};

export const InsideAField: Story = {
  parameters: scenario('field'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Labelled and described by its field"
        note="The control takes its step and its state from the field and gives it back something to name: the label points at the set, and the description reaches it through aria-describedby."
        layout="block"
      >
        <Field>
          <FieldLabel>Invoice currency</FieldLabel>
          <SegmentedControl defaultValue="brl" name="currency">
            <Segment value="brl">BRL</Segment>
            <Segment value="usd">USD</Segment>
            <Segment value="eur">EUR</Segment>
          </SegmentedControl>
          <FieldDescription>
            The conversion uses the exchange rate of the issue date.
          </FieldDescription>
        </Field>
      </Scene>
      <Scene
        label="A field at the large step, and one in error"
        note="size comes from the field unless the control states its own, and invalid arrives the same way — one decision taken once, on the row that owns the label."
        layout="block"
      >
        <Field size="lg">
          <FieldLabel>Delivery time</FieldLabel>
          <SegmentedControl defaultValue="standard" name="speed-lg">
            <Segment value="standard">Standard</Segment>
            <Segment value="express">Express</Segment>
          </SegmentedControl>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Submitted with the rest of the form"
        note="The segments are real radios sharing one name, so the value reaches FormData with no wiring at all. Choose a currency and submit: the chosen value is printed below."
        layout="block"
      >
        <SubmittedControl />
      </Scene>
    </Grid>
  ),
};

function SubmittedControl() {
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmitted(String(data.get('currency') ?? ''));
        }}
      >
        {/* The form is one child of the stage, so the distance between the
            control and the button is this row's and not the stage's — without
            it the two sit against each other with no gap at all. */}
        <div className="slotted-demo-row">
          <SegmentedControl aria-label="Invoice currency" defaultValue="brl" name="currency">
            <Segment value="brl">BRL</Segment>
            <Segment value="usd">USD</Segment>
            <Segment value="eur">EUR</Segment>
          </SegmentedControl>
          <Button tone="secondary" type="submit" variant="outline">
            Send
          </Button>
        </div>
      </form>
      <Text size="sm" tone="muted">
        {submitted === null ? 'Nothing sent yet.' : `FormData.get('currency') = ${submitted}`}
      </Text>
    </>
  );
}

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A label longer than its column"
        note="Every column is equal, so the longer label clips at the ellipsis rather than making one segment wider than the rest — and its whole string stays in the DOM."
        layout="block"
      >
        <Measure>
          <SegmentedControl aria-label="Frequency" defaultValue="now" fullWidth>
            <Segment value="now">Immediately</Segment>
            <Segment value="digest">Once a day, in the evening digest</Segment>
          </SegmentedControl>
        </Measure>
      </Scene>
      <Scene
        label="A mirrored label inside a page that is not"
        note="An Arabic segment reads right to left without the control mirroring around it, because the direction belongs to the text and the thumb follows the reading direction of the track."
        layout="block"
      >
        <SegmentedControl aria-label="Idioma" defaultValue="ar">
          <Segment value="ar">
            <span dir="rtl">العربية</span>
          </Segment>
          <Segment value="en">English</Segment>
        </SegmentedControl>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="An application states its axes once"
        note="The provider sets the four decisions for a whole subtree; the control beside it states its own size and wins, because a consumer's explicit value always outranks a default."
        layout="block"
      >
        <SegmentedControlDefaultsProvider fullWidth size="sm">
          <SegmentedControl aria-label="View, from the provider" defaultValue="grid">
            <Segment icon={<LayoutGrid size={14} />} value="grid">
              Grid
            </Segment>
            <Segment icon={<List size={14} />} value="list">
              Lista
            </Segment>
            <Segment icon={<Columns3 size={14} />} value="board">
              Quadro
            </Segment>
          </SegmentedControl>
          <SegmentedControl aria-label="View, with its own size" defaultValue="grid" size="lg">
            <Segment value="grid">Grade</Segment>
            <Segment value="list">Lista</Segment>
          </SegmentedControl>
        </SegmentedControlDefaultsProvider>
      </Scene>
      <Scene
        label="A controlled control, and a handler that refuses"
        note="The consumer owns the value: the control asks and paints nothing until the new one comes back. Refuse the request and even the platform's own selection is put back."
        layout="block"
      >
        <ControlledView />
      </Scene>
    </Grid>
  ),
};

function ControlledView() {
  const [value, setValue] = useState('grid');

  return (
    <>
      <SegmentedControl
        aria-label="Controlled view"
        onValueChange={(next, request) => {
          if (next === 'board') {
            request.cancel();
            return;
          }
          setValue(next);
        }}
        value={value}
      >
        <Segment value="grid">Grade</Segment>
        <Segment value="list">Lista</Segment>
        <Segment value="board">Quadro</Segment>
      </SegmentedControl>
      <Text size="sm" tone="muted">
        The board is refused in onValueChange: the request is canceled before any commit.
      </Text>
    </>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Nothing chosen yet"
        note="Tab lands on the first segment and there is no thumb to see; press an arrow or Space and it fades in where it belongs rather than sliding from an edge nobody saw."
        layout="block"
      >
        <SegmentedControl aria-label="Shipping, no choice">
          <Segment value="standard">Standard</Segment>
          <Segment value="express">Express</Segment>
          <Segment value="overnight">Overnight</Segment>
        </SegmentedControl>
      </Scene>
      <Scene
        label="With a choice already made"
        note="Tab lands on the checked segment, and both pairs of arrows move focus and the choice together and wrap at the ends. Every row of that table is the platform's."
        layout="block"
      >
        <SegmentedControl aria-label="Shipping, with choice" defaultValue="express">
          <Segment value="standard">Standard</Segment>
          <Segment value="express">Express</Segment>
          <Segment value="overnight">Overnight</Segment>
        </SegmentedControl>
      </Scene>
    </Grid>
  ),
};
