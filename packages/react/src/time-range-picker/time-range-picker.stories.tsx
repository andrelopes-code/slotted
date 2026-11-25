import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldLabel } from '../field';
import { TimeRangePicker } from './time-range-picker';
import { TimeRangePickerDefaultsProvider } from './time-range-picker-defaults';
import { Grid, Scene } from './time-range-picker-demo';
import {
  REACT_TIME_RANGE_PICKER_DOCS,
  REACT_TIME_RANGE_PICKER_TOKENS,
} from './time-range-picker.docs';
import type { TimeRange } from './time-range-picker.types';

const BASE = { hourCycle: 24, locale: 'en-US', referenceTime: plainTime(8, 20) } as const;
const BOOKING: TimeRange = { start: plainTime(9), end: plainTime(11, 45) };
const OPEN: TimeRange = { start: plainTime(9), end: null };
const CHANGES = [6, 9, 12, 14, 18, 22].map((hour) => plainTime(hour));
const PRESETS = [
  { label: 'Morning', value: { start: plainTime(8), end: plainTime(12) } },
  { label: 'Afternoon', value: { start: plainTime(13), end: plainTime(18) } },
  { label: 'Work day', value: { start: plainTime(9), end: plainTime(18) } },
];

const isNoon = ({ hour }: PlainTime) => hour === 12;
const inUnits = (seconds: number) => `${String(Math.round(seconds / 360))} units`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TIME_RANGE_PICKER_DOCS.timeRangePicker.scenes, {
    playground: Playground,
    panel: Panel,
    length: Length,
    durations: Durations,
    limits: Limits,
    unavailable: Unavailable,
    step: Step,
    explicit: Explicit,
    presets: Presets,
    confirm: Confirm,
    'open-end': OpenEnd,
    sizes: Sizes,
    variants: Variants,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Time Range Picker',
  component: TimeRangePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Range Picker',
        description:
          'A one-line frame that holds a run of times, with the day as one axis and a clock for each end behind it, and a draft that Apply writes.',
        framework: 'React',
        ...REACT_TIME_RANGE_PICKER_DOCS.timeRangePicker,
        tokens: REACT_TIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TimeRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { ...BASE, size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <TimeRangePicker {...args} defaultValue={BOOKING} />
    </div>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Open" note="From nine to a quarter to twelve.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} defaultOpen />
      </Scene>
    </Grid>
  ),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Hours and minutes" note="The locale’s own.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} />
      </Scene>

      <Scene label="In the product’s words" note="Billable units of six minutes.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} lengthLabel={inUnits} />
      </Scene>
    </Grid>
  ),
};

export const Durations: Story = {
  parameters: scenario('durations'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Three" note="A slot, two, or a half day.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} durations={[1800, 3600, 14400]} />
      </Scene>

      <Scene label="None" note="The shortcuts alone.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} durations={[]} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Half an hour to four" note="The footer says it.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} maxLength={14400} minLength={1800} />
      </Scene>

      <Scene label="Over" note="Two hours at most.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} maxLength={7200} />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Contiguous" note="The run stops at noon.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} isTimeUnavailable={isNoon} />
      </Scene>

      <Scene label="Not contiguous" note="Only the two ends are checked.">
        <TimeRangePicker
          {...BASE}
          defaultValue={BOOKING}
          contiguous={false}
          isTimeUnavailable={isNoon}
        />
      </Scene>
    </Grid>
  ),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Five minutes" note="Twelve in an hour.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} step={300} />
      </Scene>

      <Scene label="An hour" note="No minutes to press.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} step={3600} />
      </Scene>
    </Grid>
  ),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Shift changes" note="Six in a day.">
        <TimeRangePicker {...BASE} options={CHANGES} />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Shifts" note="Three of the product’s own.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => (
    <Grid columns={2}>
      <Scene label="With Apply" note="Escape leaves the run as it was.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} />
      </Scene>

      <Scene label="Without" note="The minute writes, and closes.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} confirm={false} />
      </Scene>
    </Grid>
  ),
};

export const OpenEnd: Story = {
  parameters: scenario('open-end'),
  render: () => (
    <Grid columns={1}>
      <Scene label="From nine" note="No end yet.">
        <TimeRangePicker {...BASE} defaultPosition="end" defaultValue={OPEN} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene label="sm" note="The panel is the same at the three.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} size="sm" />
      </Scene>

      <Scene label="md" note="The panel is the same at the three.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} size="md" />
      </Scene>

      <Scene label="lg" note="The panel is the same at the three.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={3}>
      <Scene label="outline" note="The frame the fields beside it draw.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} variant="outline" />
      </Scene>

      <Scene label="subtle" note="The frame the fields beside it draw.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} variant="subtle" />
      </Scene>

      <Scene label="plain" note="The frame the fields beside it draw.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Disabled" note="Answers nothing.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} disabled />
      </Scene>

      <Scene label="Read only" note="Readable.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} readOnly />
      </Scene>

      <Scene label="Invalid" note="Stated by the consumer.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} invalid />
      </Scene>

      <Scene label="Clearable" note="One clear for both ends.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} clearable />
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Booking" note="Named by its field.">
        <Field>
          <FieldLabel>Booking</FieldLabel>
          <TimeRangePicker {...BASE} endName="to" startName="from" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Narrow the window" note="A press on an end brings its clock.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [run, setRun] = useState<TimeRange | null>(BOOKING);

    return (
      <Grid columns={2}>
        <Scene label="An owned value" note="The picker asks.">
          <TimeRangePicker
            {...BASE}
            footer="The room closes at 6"
            onValueChange={setRun}
            value={run}
          />
        </Scene>

        <Scene label="A provider" note="Half hours, for every picker.">
          <TimeRangePickerDefaultsProvider step={1800}>
            <TimeRangePicker {...BASE} defaultValue={BOOKING} />
          </TimeRangePickerDefaultsProvider>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Enter on the frame" note="Opens on the clock of the current end.">
        <TimeRangePicker {...BASE} defaultValue={BOOKING} />
      </Scene>
    </Grid>
  ),
};
