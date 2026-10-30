import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { NumberField } from '../number-field';
import { Slider } from './slider';
import { SliderDefaultsProvider } from './slider-defaults';
import { Grid, Measure, Scene } from './slider-demo';
import { REACT_SLIDER_DOCS, REACT_SLIDER_TOKENS } from './slider.docs';
import type { SliderHandle } from './slider.types';

const QUALITY = [
  { value: 0, label: 'Low' },
  { value: 25, label: 'Reduced' },
  { value: 50, label: 'Medium' },
  { value: 75, label: 'High' },
  { value: 100, label: 'Maximum' },
];

const DELIVERY = [
  { value: 0, label: 'Economy' },
  { value: 1, label: 'Standard' },
  { value: 2, label: 'Same-day express' },
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SLIDER_DOCS.slider.scenes, {
    playground: Playground,
    sizes: Sizes,
    orientation: Orientation,
    range: Range,
    marks: Marks,
    origin: Origin,
    format: Format,
    valueLabel: ValueLabel,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Slider',
        description:
          'One value or several on a scale, held in a real input[type=range] under every thumb, moved by the pointer or by the whole APG keyboard table, and written for a locale by Intl.NumberFormat.',
        framework: 'React',
        ...REACT_SLIDER_DOCS.slider,
        tokens: REACT_SLIDER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    max: 100,
    min: 0,
    orientation: 'horizontal',
    size: 'md',
    step: 1,
    valueLabel: 'auto',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Volume</FieldLabel>
        <Slider {...args} defaultValue={40} />
        <FieldDescription>Applies to all app alerts.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The three steps on their own"
        layout="stack"
        note="The thumb, the type and the target grow with the step; the rail keeps its weight, because a rail is a line and not a control."
      >
        <Slider aria-label="Small" defaultValue={25} size="sm" />
        <Slider aria-label="Medium" defaultValue={50} size="md" />
        <Slider aria-label="Large" defaultValue={75} size="lg" />
      </Scene>
      <Scene
        label="Inside a field, the field decides"
        layout="stack"
        note="A small field holding a medium control is a field and a control disagreeing about one row, so the slider reads the field’s step before its own provider’s."
      >
        <Field size="sm">
          <FieldLabel>Compression</FieldLabel>
          <Slider defaultValue={30} />
        </Field>
        <Field size="lg">
          <FieldLabel>Nitidez</FieldLabel>
          <Slider defaultValue={70} />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A mixing desk"
        layout="row"
        note="Three vertical scales, each with its minimum at the bottom — where the browser’s own vertical range input puts it, and where a fader’s zero belongs."
      >
        <Slider aria-label="Treble" defaultValue={70} orientation="vertical" valueLabel="always" />
        <Slider aria-label="Mids" defaultValue={35} orientation="vertical" valueLabel="always" />
        <Slider aria-label="Bass" defaultValue={50} orientation="vertical" valueLabel="none" />
      </Scene>
      <Scene
        label="The same scale, lying down"
        layout="stack"
        note="Up and Down mean more and less in both orientations. Only Right and Left mirror, because they name a side and a side changes with the reading direction."
      >
        <Slider aria-label="Horizontal" defaultValue={70} />
        <Slider aria-label="Horizontal com marcas" defaultValue={50} marks={[0, 50, 100]} />
      </Scene>
    </Grid>
  ),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A price band"
        layout="stack"
        note="Each thumb’s min and max follow its neighbour, so the two cannot cross — and a screen reader is told the range each one actually has rather than the scale’s."
      >
        <Slider
          defaultValue={[240, 780]}
          format={{ currency: 'BRL', style: 'currency' }}
          locale="pt-BR"
          max={1000}
          name="price"
          step={10}
          thumbLabels={['Minimum price', 'Maximum price']}
        />
      </Scene>
      <Scene
        label="Two steps apart, always"
        layout="stack"
        note="minStepsBetween keeps a gap the reader cannot close. Drag the left thumb into the right one: it stops two steps short, and the announced maximum stops with it."
      >
        <Slider
          defaultValue={[40, 60]}
          minStepsBetween={2}
          step={5}
          thumbLabels={['Start', 'End']}
          valueLabel="always"
        />
      </Scene>
    </Grid>
  ),
};

export const Marks: Story = {
  parameters: scenario('marks'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A five-step scale"
        layout="stack"
        note="Ticks stand beside the rail rather than on it, so none of them has to be legible against the fill and against the empty channel at once. The first and last labels align inside the control."
      >
        <Slider aria-label="Qualidade" defaultValue={50} marks={QUALITY} step={25} />
      </Scene>
      <Scene
        label="A ruler, and the same scale at 360 pixels"
        layout="stack"
        note="Numbers alone draw ticks and reserve no room for labels. Narrow the column and the rail shrinks with it: a slider is fluid rather than reflowing, so the thumb and the type keep their size."
      >
        <Slider aria-label="Parcelas" defaultValue={6} marks={[2, 4, 6, 8]} max={10} />
        <Measure>
          <Slider aria-label="Qualidade estreita" defaultValue={50} marks={QUALITY} step={25} />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Origin: Story = {
  parameters: scenario('origin'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A gain that fills from nought"
        layout="stack"
        note="A balance control is not a volume: nought is in the middle, and the fill runs outward from it in whichever direction the value went."
      >
        <Slider
          aria-label="Ganho"
          defaultValue={3}
          marks={[{ value: 0, label: '0' }]}
          max={10}
          min={-10}
          origin={0}
        />
        <Slider
          aria-label="Correction"
          defaultValue={-6}
          marks={[{ value: 0, label: '0' }]}
          max={10}
          min={-10}
          origin={0}
        />
      </Scene>
      <Scene
        label="And the same scale filling from an end"
        layout="stack"
        note="origin defaults to min, which is what a volume wants: the fill is how much there is, measured from nothing."
      >
        <Slider aria-label="Volume" defaultValue={3} max={10} min={-10} />
        <Slider aria-label="Restante" defaultValue={3} max={10} min={-10} origin="max" />
      </Scene>
    </Grid>
  ),
};

export const Format: Story = {
  parameters: scenario('format'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A currency and a percentage"
        layout="stack"
        note="The number is the domain value and the string is a formatting of it, through the same Intl.NumberFormat the number field uses. The read-out, the bubble and aria-valuetext all read the same one."
      >
        <Slider
          aria-label="Budget"
          defaultValue={1480}
          format={{ currency: 'BRL', style: 'currency' }}
          locale="pt-BR"
          max={4000}
          step={20}
        />
        <Slider
          aria-label="Stake"
          defaultValue={0.4}
          format={{ style: 'percent' }}
          max={1}
          step={0.01}
        />
      </Scene>
      <Scene
        label="One value, two locales"
        layout="stack"
        note="The separator, the grouping and the numbering system are the locale’s. A form where one scale reads 1.480 as a thousand and another as one point four eight is a form that loses money."
      >
        <Slider
          aria-label="In Portuguese"
          defaultValue={1480}
          format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }}
          locale="pt-BR"
          max={4000}
          step={20}
        />
        <Slider
          aria-label="In English"
          defaultValue={1480}
          format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }}
          locale="en-US"
          max={4000}
          step={20}
        />
      </Scene>
    </Grid>
  ),
};

export const ValueLabel: Story = {
  parameters: scenario('valueLabel'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="While it moves, or always"
        layout="stack"
        note="The room the bubble stands in is reserved either way, so the rail does not move down when a drag begins. Focus one of these and the number appears without anything shifting."
      >
        <Slider aria-label="Automatic" defaultValue={40} valueLabel="auto" />
        <Slider aria-label="Always" defaultValue={70} valueLabel="always" />
      </Scene>
      <Scene
        label="And a scale whose values are words"
        layout="stack"
        note="A bubble is for a number. A value that is a sentence belongs in a label of the consumer’s own, so none withdraws both the bubble and the read-out."
      >
        <Field>
          <FieldLabel>Delivery</FieldLabel>
          <Slider defaultValue={2} marks={DELIVERY} max={2} valueLabel="none" />
          <FieldDescription>Same-day express.</FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="At rest, and in error"
        layout="stack"
        note="Invalid reddens the fill and the thumb and retargets the focus ring; it is never colour alone, because aria-invalid announces it and the field says it in words."
      >
        <Slider aria-label="Normal" defaultValue={62} />
        <Field invalid>
          <FieldLabel>Stake</FieldLabel>
          <Slider defaultValue={96} />
          <FieldError>The stake cannot exceed ninety percent.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Read-only is not disabled"
        layout="stack"
        note="Read-only keeps the ink at full strength and steps the scale onto a neutral tone: the value is real and still submitted. Disabled mutes all of it, answers no key and lifts nothing off the page."
      >
        <Slider aria-label="Somente leitura" defaultValue={30} readOnly />
        <Slider aria-label="Desativado" defaultValue={30} disabled />
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A label of four words, and a scale at 360 pixels"
        layout="stack"
        note="Nothing is truncated and nothing leaves the DOM: a label longer than the space between two ticks wraps, and the one at the end of the scale aligns inside the control rather than hanging off it."
      >
        <Slider aria-label="Delivery" defaultValue={2} marks={DELIVERY} max={2} valueLabel="none" />
        <Measure>
          <Slider
            aria-label="Narrow delivery"
            defaultValue={1}
            marks={DELIVERY}
            max={2}
            valueLabel="none"
          />
        </Measure>
      </Scene>
      <Scene
        label="A negative range, written for a locale"
        layout="stack"
        note="The value is its own bidi run, so a minus sign stays in front of the amount in a right-to-left document. Switch the toolbar to rtl and read the read-out again."
      >
        <Slider
          defaultValue={[-1480, 2960]}
          format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }}
          locale="pt-BR"
          max={4000}
          min={-4000}
          step={20}
          thumbLabels={['Minimum balance', 'Maximum balance']}
          valueLabel="always"
        />
      </Scene>
    </Grid>
  ),
};

function Paired() {
  const [value, setValue] = useState(1480);

  return (
    <>
      <Slider
        aria-label="Budget"
        format={{ currency: 'BRL', style: 'currency' }}
        locale="pt-BR"
        max={4000}
        onValueChange={(next) => setValue(next as number)}
        step={20}
        value={value}
      />
      <NumberField
        aria-label="Exact budget"
        format={{ currency: 'BRL', style: 'currency' }}
        locale="pt-BR"
        max={4000}
        min={0}
        onValueChange={(next) => setValue(next ?? 0)}
        step={20}
        value={value}
      />
    </>
  );
}

function Handled() {
  const handle = useRef<SliderHandle>(null);

  return (
    <>
      <Slider
        defaultValue={[20, 80]}
        handle={handle}
        thumbLabels={['Minimum', 'Maximum']}
        valueLabel="always"
      />
      <Button onClick={() => handle.current?.focusThumb(1)} size="sm" variant="outline">
        Focus the maximum
      </Button>
    </>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Beside a number, when precision matters"
        layout="stack"
        note="The guide recommends the pairing rather than a second control inside the family. One value, two ways in: drag the scale and the number follows, type the number and the scale follows."
      >
        <Paired />
      </Scene>
      <Scene
        label="A provider, a field and a handle"
        layout="stack"
        note="The provider carries the decisions an application takes once, SlottedProvider the locale; the field supplies the label and the identifier; the handle reaches the one action a value cannot express."
      >
        <SlottedProvider locale="pt-BR">
          <SliderDefaultsProvider valueLabel="always">
            <Handled />
          </SliderDefaultsProvider>
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Every key the pattern lists"
        layout="stack"
        note="Tab to a thumb: arrows step by one, Shift and the page keys by ten, Home and End reach this thumb’s own bounds. In the range below, Home on the upper thumb stops at the lower one."
      >
        <Slider aria-label="A value" defaultValue={40} valueLabel="always" />
        <Slider defaultValue={[20, 80]} thumbLabels={['Minimum', 'Maximum']} valueLabel="always" />
      </Scene>
      <Scene
        label="Which arrows mirror"
        layout="stack"
        note="Switch the toolbar to rtl and press Right: the thumb moves toward the end of the track you can see, which is the left. Up and Down never mirror — a scale has a direction and bidi is not it."
      >
        <Slider aria-label="Direction" defaultValue={40} marks={[0, 50, 100]} valueLabel="always" />
      </Scene>
    </Grid>
  ),
};
