import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  LayoutGrid,
  List,
  Map,
  Mountain,
  Strikethrough,
  TrafficCone,
  Underline,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { TextField } from '../text-field';
import { Toolbar, ToolbarSeparator } from '../toolbar';
import { Text } from '../typography';
import { ToggleGroup } from './toggle-group';
import { ToggleGroupDefaultsProvider } from './toggle-group-defaults';
import { ToggleGroupItem } from './toggle-group-parts';
import { REACT_TOGGLE_GROUP_DOCS, REACT_TOGGLE_GROUP_TOKENS } from './toggle-group.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TOGGLE_GROUP_DOCS.toggleGroup.scenes, {
    playground: Playground,
    selection: Selection,
    variant: Variant,
    sizes: Sizes,
    orientation: Orientation,
    attached: Attached,
    states: States,
    iconOnly: IconOnly,
    width: Width,
    toolbar: InsideAToolbar,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  });

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toggle Group',
        description:
          'A set of two-state buttons sharing one value. The arrows move focus and never toggle, because each item is the APG Button pattern’s toggle button — the family whose arrows move the value is Segmented Control, and it is a radio group.',
        framework: 'React',
        ...REACT_TOGGLE_GROUP_DOCS.toggleGroup,
        tokens: REACT_TOGGLE_GROUP_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    'aria-label': 'Chart period',
    attached: true,
    defaultValue: ['week'],
    deselectable: true,
    disabled: false,
    fullWidth: false,
    loop: true,
    multiple: false,
    orientation: 'horizontal',
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="stack">
      <ToggleGroup {...args}>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One at a time"
        note="The value is an array of one. Press the item that is already on and the set empties, because a toggle group is allowed to hold nothing — which is what separates it from a radio group."
        layout="stack"
      >
        <ToggleGroup aria-label="Chart period" defaultValue={['week']}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Several at once"
        note="multiple caps the array at every item instead of at one, so a formatting bar holds bold and italic together. Nothing about the value's type changes with the mode."
        layout="stack"
      >
        <ToggleGroup aria-label="Estilo do texto" defaultValue={['bold', 'italic']} multiple>
          <ToggleGroupItem icon={<Bold size={16} />} value="bold">
            Negrito
          </ToggleGroupItem>
          <ToggleGroupItem icon={<Italic size={16} />} value="italic">
            Italic
          </ToggleGroupItem>
          <ToggleGroupItem icon={<Underline size={16} />} value="underline">
            Sublinhado
          </ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="A set that always holds one"
        note="deselectable={false} refuses the press that would empty the set, for a bar whose value a view depends on. It is ignored while multiple is true, where a set may always empty."
        layout="stack"
      >
        <ToggleGroup
          aria-label="Period, always filled"
          defaultValue={['week']}
          deselectable={false}
        >
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Framed"
        note="outline draws the bar's own edge, made by the items between them: they overlap by one border so the shared column holds one line rather than two, which is what keeps it even at fractional zoom."
        layout="stack"
      >
        <ToggleGroup aria-label="Density, framed" defaultValue={['compact']}>
          <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          <ToggleGroupItem value="dense">Dense</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Bare"
        note="ghost draws no frame, for a bar that sits inside something already framed. The item that is on keeps the same accent ground and edge, because “on” is one colour across the system."
        layout="stack"
      >
        <ToggleGroup aria-label="Density, unframed" defaultValue={['compact']} variant="ghost">
          <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          <ToggleGroupItem value="dense">Dense</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The three steps"
        note="The height, the padding, the type and the glyph all come from the control scales, so switching a page to dense shrinks each step whole rather than in parts."
        layout="stack"
      >
        <ToggleGroup aria-label="Sorting, small" defaultValue={['newest']} size="sm">
          <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
          <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup aria-label="Sorting, medium" defaultValue={['newest']} size="md">
          <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
          <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup aria-label="Sorting, large" defaultValue={['newest']} size="lg">
          <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
          <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Beside the controls it shares a row with"
        note="The bar states no frame of its own, so it is exactly one control tall — and a form row holding a field, a toggle group and a button lines up on all three edges."
        layout="row"
      >
        <Measure>
          <TextField aria-label="Report title" defaultValue="Quarterly report" />
        </Measure>
        <ToggleGroup aria-label="Text style, on one line" defaultValue={['bold']} multiple>
          <ToggleGroupItem aria-label="Bold" icon={<Bold size={16} />} value="bold" />
          <ToggleGroupItem aria-label="Italic" icon={<Italic size={16} />} value="italic" />
          <ToggleGroupItem
            aria-label="Underline"
            icon={<Underline size={16} />}
            value="underline"
          />
          <ToggleGroupItem aria-label="Tachado" icon={<Strikethrough size={16} />} value="strike" />
        </ToggleGroup>
        <Button tone="secondary" variant="outline">
          Publish changes
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
        note="ArrowLeft and ArrowRight move focus, mirrored in a right-to-left document, and the cross axis is left to the page so it keeps scrolling with focus inside the bar."
        layout="stack"
      >
        <ToggleGroup aria-label="Alignment, inline" defaultValue={['center']}>
          <ToggleGroupItem aria-label="Start" icon={<AlignLeft size={16} />} value="start" />
          <ToggleGroupItem aria-label="Center" icon={<AlignCenter size={16} />} value="center" />
          <ToggleGroupItem aria-label="End" icon={<AlignRight size={16} />} value="end" />
        </ToggleGroup>
      </Scene>
      <Scene
        label="Down the page"
        note="A vertical bar moves with ArrowUp and ArrowDown and writes aria-orientation, because role=group carries no implied direction of its own for a reader to assume."
        layout="stack"
      >
        <ToggleGroup
          aria-label="Alinhamento, empilhado"
          defaultValue={['center']}
          orientation="vertical"
        >
          <ToggleGroupItem value="start">Align left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="end">Align right</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};

export const Attached: Story = {
  parameters: scenario('attached'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Joined into one bar"
        note="The default. Look at the seam beside the item that is on: it states its own edge and the neighbour gives up the line that would be painted over it, so no grey touches the accent."
        layout="stack"
      >
        <ToggleGroup aria-label="Camadas, unidas" defaultValue={['terrain']} multiple>
          <ToggleGroupItem icon={<Map size={16} />} value="roads">
            Ruas
          </ToggleGroupItem>
          <ToggleGroupItem icon={<Mountain size={16} />} value="terrain">
            Relevo
          </ToggleGroupItem>
          <ToggleGroupItem icon={<TrafficCone size={16} />} value="traffic">
            Traffic
          </ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Spaced apart"
        note="Each item keeps its own four corners and the group states the distance between them: twice the control gap, so two choices read as further apart than a mark is from its own word."
        layout="stack"
      >
        <ToggleGroup
          aria-label="Camadas, separadas"
          attached={false}
          defaultValue={['terrain']}
          multiple
        >
          <ToggleGroupItem icon={<Map size={16} />} value="roads">
            Ruas
          </ToggleGroupItem>
          <ToggleGroupItem icon={<Mountain size={16} />} value="terrain">
            Relevo
          </ToggleGroupItem>
          <ToggleGroupItem icon={<TrafficCone size={16} />} value="traffic">
            Traffic
          </ToggleGroupItem>
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One item out of action"
        note="An unavailable item loses its ink and keeps its place; hover it and nothing answers, because a weaker state holds itself back for every stronger one."
        layout="stack"
      >
        <ToggleGroup aria-label="Format, one unavailable" defaultValue={['csv']}>
          <ToggleGroupItem value="csv">CSV</ToggleGroupItem>
          <ToggleGroupItem disabled value="xlsx">
            XLSX
          </ToggleGroupItem>
          <ToggleGroupItem value="pdf">PDF</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Unavailable while on"
        note="The ground says unavailable and the edge says on, so a reader still learns which of the three was chosen in a control they cannot change. In high contrast the edge is all that carries it."
        layout="stack"
      >
        <ToggleGroup aria-label="Format, unavailable" defaultValue={['pdf']}>
          <ToggleGroupItem disabled value="csv">
            CSV
          </ToggleGroupItem>
          <ToggleGroupItem disabled value="xlsx">
            XLSX
          </ToggleGroupItem>
          <ToggleGroupItem disabled value="pdf">
            PDF
          </ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="The whole group out of action"
        note="disabled on the group reaches every item as the native attribute, which is also what makes the browser refuse focus and what makes the arrow ring skip them."
        layout="stack"
      >
        <ToggleGroup aria-label="Formato, grupo inteiro" defaultValue={['csv']} disabled>
          <ToggleGroupItem value="csv">CSV</ToggleGroupItem>
          <ToggleGroupItem value="xlsx">XLSX</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Pointed at, and pressed"
        note="An item that is off takes the neutral ground; one that is on answers the pointer on the accent ground's own steps, so the two states share no surface in any scheme."
        layout="stack"
      >
        <ToggleGroup aria-label="Format, interaction" defaultValue={['xlsx']}>
          <ToggleGroupItem value="csv">CSV</ToggleGroupItem>
          <ToggleGroupItem value="xlsx">XLSX</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};

export const IconOnly: Story = {
  parameters: scenario('iconOnly'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A formatting bar"
        note="An item with only a mark draws square, and its accessible name is the aria-label the consumer wrote — the one thing the family cannot supply for artwork it did not choose."
        layout="stack"
      >
        <ToggleGroup aria-label="Text style" defaultValue={['bold']} multiple>
          <ToggleGroupItem aria-label="Bold" icon={<Bold size={16} />} value="bold" />
          <ToggleGroupItem aria-label="Italic" icon={<Italic size={16} />} value="italic" />
          <ToggleGroupItem
            aria-label="Underline"
            icon={<Underline size={16} />}
            value="underline"
          />
          <ToggleGroupItem aria-label="Tachado" icon={<Strikethrough size={16} />} value="strike" />
        </ToggleGroup>
      </Scene>
      <Scene
        label="The same bar at the smallest step"
        note="At sm and the dense density the item is twenty-four pixels, which is the WCAG minimum exactly — and a coarse pointer grows every control to forty-four through the theme."
        layout="stack"
      >
        <ToggleGroup
          aria-label="Estilo do texto, pequeno"
          defaultValue={['bold']}
          multiple
          size="sm"
        >
          <ToggleGroupItem aria-label="Bold" icon={<Bold size={14} />} value="bold" />
          <ToggleGroupItem aria-label="Italic" icon={<Italic size={14} />} value="italic" />
          <ToggleGroupItem
            aria-label="Underline"
            icon={<Underline size={14} />}
            value="underline"
          />
          <ToggleGroupItem aria-label="Tachado" icon={<Strikethrough size={14} />} value="strike" />
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="As wide as its labels"
        note="Left alone the bar shrinks to its content, which is what a set of toggles beside a paragraph needs and what every surveyed implementation defaults to."
        layout="stack"
      >
        <ToggleGroup aria-label="Billing, content width" defaultValue={['monthly']}>
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Sharing the whole line"
        note="fullWidth gives every item an equal share of the line the bar was given. The labels stay centred, so the bar reads as one control rather than as two stretched buttons."
        layout="block"
      >
        <ToggleGroup aria-label="Billing, full row" defaultValue={['monthly']} fullWidth>
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};

export const InsideAToolbar: Story = {
  parameters: scenario('toolbar'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A bar owns the keyboard the group would have held"
        note="Tab once and the whole toolbar is the stop; the arrows then cross the toggle group and the button alike. The group sees the bar in the DOM and stands down — nothing is passed to it."
        layout="block"
      >
        <Toolbar aria-label="Formatting">
          <ToggleGroup aria-label="Text style" defaultValue={['bold']} multiple variant="ghost">
            <ToggleGroupItem aria-label="Bold" icon={<Bold size={16} />} value="bold" />
            <ToggleGroupItem aria-label="Italic" icon={<Italic size={16} />} value="italic" />
            <ToggleGroupItem
              aria-label="Underline"
              icon={<Underline size={16} />}
              value="underline"
            />
          </ToggleGroup>
          <ToolbarSeparator />
          <ToggleGroup aria-label="Alignment" defaultValue={['start']} variant="ghost">
            <ToggleGroupItem aria-label="Start" icon={<AlignLeft size={16} />} value="start" />
            <ToggleGroupItem aria-label="Center" icon={<AlignCenter size={16} />} value="center" />
          </ToggleGroup>
          <ToolbarSeparator />
          <Button size="sm" tone="secondary" variant="ghost">
            Publicar
          </Button>
        </Toolbar>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A label nine words long"
        note="In a column narrower than the words, each item gives way rather than pushing the layout, and the label clips at the ellipsis with its whole string still in the DOM."
        layout="block"
      >
        <Measure>
          <ToggleGroup aria-label="Frequency" defaultValue={['now']} fullWidth>
            <ToggleGroupItem value="now">Immediately</ToggleGroupItem>
            <ToggleGroupItem value="digest">Once a day, in the evening digest</ToggleGroupItem>
          </ToggleGroup>
        </Measure>
      </Scene>
      <Scene
        label="One unbroken token, and a mirrored label"
        note="An identifier with nowhere to break clips like any other string, and an Arabic label reads right to left inside a page that reads the other way without the bar mirroring around it."
        layout="block"
      >
        <Measure>
          <ToggleGroup aria-label="Ambiente" defaultValue={['staging']} fullWidth>
            <ToggleGroupItem value="staging">staging-eu-west-1a</ToggleGroupItem>
            <ToggleGroupItem value="prod">prod</ToggleGroupItem>
          </ToggleGroup>
        </Measure>
        <ToggleGroup aria-label="Idioma" defaultValue={['ar']}>
          <ToggleGroupItem value="ar">
            <span dir="rtl">العربية</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="en">English</ToggleGroupItem>
        </ToggleGroup>
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
        note="The provider sets the six decisions for a whole subtree; the group beside it states its own size and wins, because a consumer's explicit value always outranks a default."
        layout="stack"
      >
        <ToggleGroupDefaultsProvider attached={false} size="sm" variant="ghost">
          <ToggleGroup aria-label="Camadas, do provider" defaultValue={['roads']} multiple>
            <ToggleGroupItem value="roads">Ruas</ToggleGroupItem>
            <ToggleGroupItem value="terrain">Terrain</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup aria-label="Layers, with its own size" defaultValue={['roads']} size="lg">
            <ToggleGroupItem value="roads">Roads</ToggleGroupItem>
            <ToggleGroupItem value="terrain">Terrain</ToggleGroupItem>
          </ToggleGroup>
        </ToggleGroupDefaultsProvider>
      </Scene>
      <Scene
        label="A controlled bar, and a handler that refuses"
        note="The consumer owns the value: the group asks, and paints nothing until the new array comes back. Refuse the request in onValueChange and the bar stays exactly where it was."
        layout="stack"
      >
        <ControlledBar />
      </Scene>
    </Grid>
  ),
};

function ControlledBar() {
  const [value, setValue] = useState<readonly string[]>(['grid']);

  return (
    <>
      <ToggleGroup
        aria-label="Controlled view"
        onValueChange={(next, request) => {
          if (next.includes('list')) {
            request.cancel();
            return;
          }
          setValue(next);
        }}
        value={value}
      >
        <ToggleGroupItem icon={<LayoutGrid size={16} />} value="grid">
          Grade
        </ToggleGroupItem>
        <ToggleGroupItem icon={<List size={16} />} value="list">
          Lista
        </ToggleGroupItem>
      </ToggleGroup>
      <Text size="sm" tone="muted">
        The list is refused in onValueChange: the request is canceled before any commit.
      </Text>
    </>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One stop, and the arrows inside it"
        note="Tab reaches the bar once and lands on the item that is on; the arrows move focus without toggling anything, and Home and End reach the ends of the set."
        layout="stack"
      >
        <ToggleGroup aria-label="Period, with wrap" defaultValue={['week']}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
      <Scene
        label="Wrapping turned off"
        note="With loop={false} the ring stops at the ends instead of coming round, which is what a bar inside a longer row of controls wants so that Tab is the way out."
        layout="stack"
      >
        <ToggleGroup aria-label="Period, without wrap" defaultValue={['week']} loop={false}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      </Scene>
    </Grid>
  ),
};
