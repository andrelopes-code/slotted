import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldLabel } from '../field';
import { DateTimeRangePicker } from './datetime-range-picker';
import { DateTimeRangePickerDefaultsProvider } from './datetime-range-picker-defaults';
import { Grid, Scene } from './datetime-range-picker-demo';
import {
  REACT_DATETIME_RANGE_PICKER_DOCS,
  REACT_DATETIME_RANGE_PICKER_TOKENS,
} from './datetime-range-picker.docs';
import type { DateTimeRange } from './datetime-range-picker.types';

const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));
const BASE = { hourCycle: 24, locale: 'en-US', referenceDateTime: at(10, 10, 20) } as const;
const RENTAL: DateTimeRange = { start: at(14, 17), end: at(17, 10, 30) };
const OPEN: DateTimeRange = { start: at(14, 17), end: null };
const OPENS = at(14, 14);
const CLOSES = at(25, 12);
const EIGHT = plainTime(8);
const EIGHT_PM = plainTime(20);
const DESK = [plainTime(8), plainTime(10, 30), plainTime(14), plainTime(17)];
const PRESETS = [
  { label: 'Weekend', value: { start: at(18, 18), end: at(20, 20) } },
  { label: 'One week', value: { start: at(14, 9), end: at(21, 9) } },
];

const isTaken = ({ day }: PlainDate) => day === 19;
const inDays = (seconds: number) => `${String(Math.ceil(seconds / 86_400))} billable days`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker.scenes, {
    playground: Playground,
    panel: Panel,
    length: Length,
    durations: Durations,
    limits: Limits,
    'day-window': DayWindow,
    unavailable: Unavailable,
    explicit: Explicit,
    months: Months,
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
  title: 'Components/Datetime Range Picker',
  component: DateTimeRangePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Datetime Range Picker',
        description:
          'A one-line frame that holds a run of moments, with its months over a clock for each end behind it, and a draft that Apply writes.',
        framework: 'React',
        ...REACT_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker,
        tokens: REACT_DATETIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateTimeRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { ...BASE, size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <DateTimeRangePicker {...args} defaultValue={RENTAL} />
    </div>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Open" note="Three days, from five to half past ten.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} defaultOpen />
      </Scene>
    </Grid>
  ),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Days and hours" note="The locale’s own.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} />
      </Scene>

      <Scene label="In the product’s words" note="Billable days, rounded up.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} lengthLabel={inDays} />
      </Scene>
    </Grid>
  ),
};

export const Durations: Story = {
  parameters: scenario('durations'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Three" note="Half a day, a day, a week.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} durations={[43200, 86400, 604800]} />
      </Scene>

      <Scene label="None" note="The shortcuts alone.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} durations={[]} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => (
    <Grid columns={2}>
      <Scene label="One day to seven" note="The footer says it.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} maxLength={604800} minLength={86400} />
      </Scene>

      <Scene label="Over" note="Two days at most.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} maxLength={172800} />
      </Scene>
    </Grid>
  ),
};

export const DayWindow: Story = {
  parameters: scenario('day-window'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Every day" note="Eight to eight.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} maxTime={EIGHT_PM} minTime={EIGHT} />
      </Scene>

      <Scene label="A whole range" note="From the first day at two.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} max={CLOSES} min={OPENS} />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Contiguous" note="The run stops before it.">
        <DateTimeRangePicker {...BASE} isDateUnavailable={isTaken} />
      </Scene>

      <Scene label="Not contiguous" note="Only the two ends are checked.">
        <DateTimeRangePicker {...BASE} contiguous={false} isDateUnavailable={isTaken} />
      </Scene>
    </Grid>
  ),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => (
    <Grid columns={1}>
      <Scene label="The desk" note="Four in a day.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} options={DESK} />
      </Scene>
    </Grid>
  ),
};

export const Months: Story = {
  parameters: scenario('months'),
  render: () => (
    <Grid columns={1}>
      <Scene label="One" note="A run inside a month.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} months={1} />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Rentals" note="Two of the product’s own.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => (
    <Grid columns={2}>
      <Scene label="With Apply" note="Escape leaves the run as it was.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} />
      </Scene>

      <Scene label="Without" note="The minute writes, and closes.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} confirm={false} />
      </Scene>
    </Grid>
  ),
};

export const OpenEnd: Story = {
  parameters: scenario('open-end'),
  render: () => (
    <Grid columns={1}>
      <Scene label="From September 14" note="No end yet.">
        <DateTimeRangePicker {...BASE} defaultPosition="end" defaultValue={OPEN} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene label="sm" note="The panel is the same at the three.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} size="sm" />
      </Scene>

      <Scene label="md" note="The panel is the same at the three.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} size="md" />
      </Scene>

      <Scene label="lg" note="The panel is the same at the three.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={3}>
      <Scene label="outline" note="The frame the fields beside it draw.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} variant="outline" />
      </Scene>

      <Scene label="subtle" note="The frame the fields beside it draw.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} variant="subtle" />
      </Scene>

      <Scene label="plain" note="The frame the fields beside it draw.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Disabled" note="Answers nothing.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} disabled />
      </Scene>

      <Scene label="Read only" note="Readable.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} readOnly />
      </Scene>

      <Scene label="Invalid" note="Stated by the consumer.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} invalid />
      </Scene>

      <Scene label="Clearable" note="One clear for both ends.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} clearable />
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Rental" note="Named by its field.">
        <Field>
          <FieldLabel>Rental</FieldLabel>
          <DateTimeRangePicker {...BASE} endName="to" startName="from" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Narrow the window" note="One month, or one clock.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [run, setRun] = useState<DateTimeRange | null>(RENTAL);

    return (
      <Grid columns={2}>
        <Scene label="An owned value" note="The picker asks.">
          <DateTimeRangePicker
            {...BASE}
            footer="Keys at the desk"
            onValueChange={setRun}
            value={run}
          />
        </Scene>

        <Scene label="A provider" note="Half hours, for every picker.">
          <DateTimeRangePickerDefaultsProvider step={1800}>
            <DateTimeRangePicker {...BASE} defaultValue={RENTAL} />
          </DateTimeRangePickerDefaultsProvider>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Enter on the frame" note="Opens on the day of the current end.">
        <DateTimeRangePicker {...BASE} defaultValue={RENTAL} />
      </Scene>
    </Grid>
  ),
};
