import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldLabel } from '../field';
import { TimePicker } from './time-picker';
import { TimePickerDefaultsProvider } from './time-picker-defaults';
import { Grid, Scene } from './time-picker-demo';
import { REACT_TIME_PICKER_DOCS, REACT_TIME_PICKER_TOKENS } from './time-picker.docs';

const HALF_PAST_TWO = plainTime(14, 30);
const BASE = { hourCycle: 24, locale: 'en-US', referenceTime: plainTime(10, 20) } as const;
const CLINIC = [
  plainTime(8, 40),
  plainTime(9),
  plainTime(9, 20),
  plainTime(13, 45),
  plainTime(18, 30),
];
const PRESETS = [
  { label: 'Start of shift', value: plainTime(8) },
  { label: 'Lunch', value: plainTime(12) },
  { label: 'End of shift', value: plainTime(18) },
];

const isLunch = (time: PlainTime) => time.hour === 12;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TIME_PICKER_DOCS.timePicker.scenes, {
    playground: Playground,
    panel: Panel,
    explicit: Explicit,
    seconds: Seconds,
    step: Step,
    'range-bounds': RangeBounds,
    unavailable: Unavailable,
    offsets: Offsets,
    relative: Relative,
    presets: Presets,
    confirm: Confirm,
    sizes: Sizes,
    variants: Variants,
    placement: Placement,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Time Picker',
  component: TimePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Picker',
        description:
          'A time field with a clock behind it: every hour of the day and every minute of the step in view, shortcuts with the time they write, and a draft that Apply writes.',
        framework: 'React',
        ...REACT_TIME_PICKER_DOCS.timePicker,
        tokens: REACT_TIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { ...BASE, granularity: 'minute', size: 'md', step: 900, variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <TimePicker {...args} defaultValue={HALF_PAST_TWO} />
    </div>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene label="A shift" note="Each shortcut says the time it writes.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Appointments" note="Whole times under the part of the day.">
        <TimePicker {...BASE} options={CLINIC} />
      </Scene>

      <Scene label="A slot that says more" note="renderSlot draws what is in the button.">
        <TimePicker {...BASE} options={CLINIC} renderSlot={(slot) => slot.label} />
      </Scene>
    </Grid>
  ),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => (
    <Grid columns={2}>
      <Scene label="A cue" note="Every five seconds.">
        <TimePicker {...BASE} granularity="second" step={5} />
      </Scene>

      <Scene label="The hour alone" note="One press is the whole time.">
        <TimePicker {...BASE} granularity="hour" />
      </Scene>
    </Grid>
  ),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Five minutes" note="Twelve minutes to an hour.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} step={300} />
      </Scene>

      <Scene label="From ten past" note="min 08:10 and half an hour: :10 and :40.">
        <TimePicker {...BASE} min={plainTime(8, 10)} step={1800} />
      </Scene>
    </Grid>
  ),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Business hours" note="08:10 to 18:00.">
        <TimePicker {...BASE} max={plainTime(18)} min={plainTime(8, 10)} />
      </Scene>

      <Scene label="Outside them" note="The control is invalid, and so is Apply.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} min={plainTime(18)} />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Lunch" note="Nothing between twelve and one.">
        <TimePicker {...BASE} isTimeUnavailable={isLunch} />
      </Scene>
    </Grid>
  ),
};

export const Offsets: Story = {
  parameters: scenario('offsets'),
  render: () => (
    <Grid columns={2}>
      <Scene label="A courier" note="A quarter of an hour, and an hour.">
        <TimePicker {...BASE} offsets={[900, 3600]} />
      </Scene>

      <Scene label="None" note="The clock alone.">
        <TimePicker {...BASE} offsets={[]} />
      </Scene>
    </Grid>
  ),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Type +45m" note="From a segment.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} relative />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Shifts" note="Now, and three times of the day.">
        <TimePicker {...BASE} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => (
    <Grid columns={2}>
      <Scene label="With Apply" note="Escape leaves the value as it was.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} />
      </Scene>

      <Scene label="Without" note="The minute writes, and closes.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} confirm={false} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene label="sm" note="The panel is the same at the three.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} size="sm" />
      </Scene>

      <Scene label="md" note="The panel is the same at the three.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} size="md" />
      </Scene>

      <Scene label="lg" note="The panel is the same at the three.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={3}>
      <Scene label="outline" note="The frame the fields beside it draw.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} variant="outline" />
      </Scene>

      <Scene label="subtle" note="The frame the fields beside it draw.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} variant="subtle" />
      </Scene>

      <Scene label="plain" note="The frame the fields beside it draw.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Bottom, end" note="Under the end of the control.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} placement="bottom-end" />
      </Scene>

      <Scene label="Top, start" note="Over its start.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} placement="top-start" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Disabled" note="Answers nothing.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} disabled />
      </Scene>

      <Scene label="Read only" note="Readable.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} readOnly />
      </Scene>

      <Scene label="Invalid" note="Stated by the consumer.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} invalid />
      </Scene>

      <Scene label="Required" note="The form needs it.">
        <TimePicker {...BASE} required />
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Departure" note="Named by its field.">
        <Field>
          <FieldLabel>Departure</FieldLabel>
          <TimePicker {...BASE} name="departure" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Narrow the window" note="The clock keeps its four rows.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [time, setTime] = useState<PlainTime | null>(HALF_PAST_TWO);

    return (
      <Grid columns={2}>
        <Scene label="An owned value" note="The picker asks.">
          <TimePicker {...BASE} footer="Gate B" onValueChange={setTime} value={time} />
        </Scene>

        <Scene label="A provider" note="Twenty minutes to a slot.">
          <TimePickerDefaultsProvider step={1200}>
            <TimePicker {...BASE} />
          </TimePickerDefaultsProvider>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Alt and ArrowDown" note="Opens, and leaves focus in the field.">
        <TimePicker {...BASE} defaultValue={HALF_PAST_TWO} />
      </Scene>
    </Grid>
  ),
};
