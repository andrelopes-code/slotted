import { dayOfWeek, plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldLabel } from '../field';
import { DateTimePicker } from './datetime-picker';
import { DateTimePickerDefaultsProvider } from './datetime-picker-defaults';
import { Grid, Scene } from './datetime-picker-demo';
import { REACT_DATETIME_PICKER_DOCS, REACT_DATETIME_PICKER_TOKENS } from './datetime-picker.docs';

const BASE = {
  locale: 'en-US',
  referenceDateTime: plainDateTime(plainDate(2026, 9, 10), plainTime(10, 20)),
} as const;
const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));
const DEPARTURE = at(17, 14, 30);
const OPENS = at(14, 14);
const CLOSES = at(25, 12);
const EIGHT = plainTime(8);
const SIX = plainTime(18);
const VISITS = [plainTime(9), plainTime(9, 20), plainTime(13, 45)];
const PRESETS = [
  { label: 'Tomorrow early', value: at(11, 9) },
  { label: 'Monday afternoon', value: at(14, 14, 30) },
];

const isSaturday = (date: PlainDate) => dayOfWeek(date) === 6;
const isNoon = ({ hour }: PlainTime) => hour === 12;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATETIME_PICKER_DOCS.dateTimePicker.scenes, {
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
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Datetime Picker',
  component: DateTimePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Datetime Picker',
        description:
          'A segmented date-time field with a month beside a clock behind its trigger: the day in words, the time typed or pressed, and a draft that Apply writes.',
        framework: 'React',
        ...REACT_DATETIME_PICKER_DOCS.dateTimePicker,
        tokens: REACT_DATETIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { ...BASE, size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <DateTimePicker {...args} defaultValue={DEPARTURE} />
    </div>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Open" note="The hours are the ones the day in the draft is open for.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} defaultOpen />
      </Scene>
    </Grid>
  ),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => (
    <Grid columns={1}>
      <Scene label="A clinic" note="Three times a day.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} options={VISITS} />
      </Scene>
    </Grid>
  ),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Hour" note="No minutes.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} granularity="hour" />
      </Scene>

      <Scene label="Second" note="A third grid.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} granularity="second" step={15} />
      </Scene>
    </Grid>
  ),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Five minutes" note="Twelve in an hour.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} step={300} />
      </Scene>

      <Scene label="An hour" note="No minutes to press.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} step={3600} />
      </Scene>
    </Grid>
  ),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => (
    <Grid columns={2}>
      <Scene label="A whole range" note="From the first day at two.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} max={CLOSES} min={OPENS} />
      </Scene>

      <Scene label="Every day" note="Eight to six.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} maxTime={SIX} minTime={EIGHT} />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Days" note="The office closes on Saturdays.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} isDateUnavailable={isSaturday} />
      </Scene>

      <Scene label="Times" note="Noon is taken.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} isTimeUnavailable={isNoon} />
      </Scene>
    </Grid>
  ),
};

export const Offsets: Story = {
  parameters: scenario('offsets'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Two" note="Half a day and two days.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} offsets={[43200, 172800]} />
      </Scene>

      <Scene label="None" note="The clock alone.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} offsets={[]} />
      </Scene>
    </Grid>
  ),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Relative" note="Type + in a segment.">
        <DateTimePicker {...BASE} relative />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Departures" note="Two of the product’s own.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => (
    <Grid columns={2}>
      <Scene label="With Apply" note="Escape leaves the moment as it was.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} />
      </Scene>

      <Scene label="Without" note="The minute writes, and closes.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} confirm={false} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene label="sm" note="The panel is the same at the three.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} size="sm" />
      </Scene>

      <Scene label="md" note="The panel is the same at the three.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} size="md" />
      </Scene>

      <Scene label="lg" note="The panel is the same at the three.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={3}>
      <Scene label="outline" note="The frame the fields beside it draw.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} variant="outline" />
      </Scene>

      <Scene label="subtle" note="The frame the fields beside it draw.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} variant="subtle" />
      </Scene>

      <Scene label="plain" note="The frame the fields beside it draw.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Disabled" note="Answers nothing.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} disabled />
      </Scene>

      <Scene label="Read only" note="Readable.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} readOnly />
      </Scene>

      <Scene label="Invalid" note="Stated by the consumer.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} invalid />
      </Scene>

      <Scene label="Clearable" note="One clear for both halves.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} clearable />
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
          <DateTimePicker {...BASE} name="departure" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Narrow the window" note="A press on a day moves to the clock.">
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [moment, setMoment] = useState<PlainDateTime | null>(DEPARTURE);

    return (
      <Grid columns={2}>
        <Scene label="An owned value" note="The picker asks.">
          <DateTimePicker
            {...BASE}
            footer="Doors close at 6"
            onValueChange={setMoment}
            value={moment}
          />
        </Scene>

        <Scene label="A provider" note="Half hours, for every picker.">
          <DateTimePickerDefaultsProvider step={1800}>
            <DateTimePicker {...BASE} defaultValue={DEPARTURE} />
          </DateTimePickerDefaultsProvider>
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
        <DateTimePicker {...BASE} defaultValue={DEPARTURE} />
      </Scene>
    </Grid>
  ),
};
