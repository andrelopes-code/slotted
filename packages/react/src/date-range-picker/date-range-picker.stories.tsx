import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldLabel } from '../field';
import { DateRangePicker } from './date-range-picker';
import { DateRangePickerDefaultsProvider } from './date-range-picker-defaults';
import { Grid, Scene } from './date-range-picker-demo';
import {
  REACT_DATE_RANGE_PICKER_DOCS,
  REACT_DATE_RANGE_PICKER_TOKENS,
} from './date-range-picker.docs';
import type { DateRange } from './date-range-picker.types';

const BASE = { locale: 'en-US' } as const;
const day = (date: number) => plainDate(2026, 9, date);
const STAY: DateRange = { start: day(7), end: day(11) };
const OVER: DateRange = { start: day(7), end: day(18) };
const OPEN: DateRange = { start: day(7), end: null };
const PRESETS = [
  { label: 'Weekend', value: { start: day(11), end: day(13) } },
  { label: 'One week', value: { start: day(7), end: day(14) } },
  { label: 'Two weeks', value: { start: day(7), end: day(21) } },
];

const isTaken = (date: PlainDate) => date.day === 15;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATE_RANGE_PICKER_DOCS.dateRangePicker.scenes, {
    playground: Playground,
    length: Length,
    limits: Limits,
    presets: Presets,
    confirm: Confirm,
    weeks: Weeks,
    unavailable: Unavailable,
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
  title: 'Components/Date Range Picker',
  component: DateRangePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Range Picker',
        description:
          'Two date fields in one frame with the months of a run behind them: each end in words, the length between them as a control, and a draft that Apply writes.',
        framework: 'React',
        ...REACT_DATE_RANGE_PICKER_DOCS.dateRangePicker,
        tokens: REACT_DATE_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { ...BASE, count: 'nights', size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <DateRangePicker {...args} defaultValue={STAY} />
    </div>
  ),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Nights" note="The gaps between the two ends.">
        <DateRangePicker {...BASE} defaultValue={STAY} count="nights" />
      </Scene>

      <Scene label="Days" note="Both ends included.">
        <DateRangePicker {...BASE} defaultValue={STAY} count="days" />
      </Scene>
    </Grid>
  ),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Two to seven nights" note="The footer says it.">
        <DateRangePicker {...BASE} defaultValue={STAY} count="nights" maxLength={7} minLength={2} />
      </Scene>

      <Scene label="Over" note="Typed past the limit.">
        <DateRangePicker {...BASE} count="nights" defaultValue={OVER} maxLength={7} />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Stays" note="Three of the product’s own.">
        <DateRangePicker {...BASE} defaultValue={STAY} count="nights" presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => (
    <Grid columns={2}>
      <Scene label="With Apply" note="Escape leaves the run as it was.">
        <DateRangePicker {...BASE} defaultValue={STAY} />
      </Scene>

      <Scene label="Without" note="The second press writes, and closes.">
        <DateRangePicker {...BASE} defaultValue={STAY} confirm={false} />
      </Scene>
    </Grid>
  ),
};

export const Weeks: Story = {
  parameters: scenario('weeks'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Week numbers" note="The ISO number of each row.">
        <DateRangePicker {...BASE} defaultValue={STAY} weekNumbers />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Contiguous" note="The run stops before it.">
        <DateRangePicker {...BASE} isDateUnavailable={isTaken} />
      </Scene>

      <Scene label="Not contiguous" note="Only the two ends are checked.">
        <DateRangePicker {...BASE} contiguous={false} isDateUnavailable={isTaken} />
      </Scene>
    </Grid>
  ),
};

export const OpenEnd: Story = {
  parameters: scenario('open-end'),
  render: () => (
    <Grid columns={1}>
      <Scene label="From September 7" note="No end yet.">
        <DateRangePicker {...BASE} defaultPosition="end" defaultValue={OPEN} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene label="sm" note="The panel is the same at the three.">
        <DateRangePicker {...BASE} defaultValue={STAY} size="sm" />
      </Scene>

      <Scene label="md" note="The panel is the same at the three.">
        <DateRangePicker {...BASE} defaultValue={STAY} size="md" />
      </Scene>

      <Scene label="lg" note="The panel is the same at the three.">
        <DateRangePicker {...BASE} defaultValue={STAY} size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={3}>
      <Scene label="outline" note="The frame the fields beside it draw.">
        <DateRangePicker {...BASE} defaultValue={STAY} variant="outline" />
      </Scene>

      <Scene label="subtle" note="The frame the fields beside it draw.">
        <DateRangePicker {...BASE} defaultValue={STAY} variant="subtle" />
      </Scene>

      <Scene label="plain" note="The frame the fields beside it draw.">
        <DateRangePicker {...BASE} defaultValue={STAY} variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Disabled" note="Answers nothing.">
        <DateRangePicker {...BASE} defaultValue={STAY} disabled />
      </Scene>

      <Scene label="Read only" note="Readable.">
        <DateRangePicker {...BASE} defaultValue={STAY} readOnly />
      </Scene>

      <Scene label="Invalid" note="Stated by the consumer.">
        <DateRangePicker {...BASE} defaultValue={STAY} invalid />
      </Scene>

      <Scene label="Clearable" note="One clear for both ends.">
        <DateRangePicker {...BASE} defaultValue={STAY} clearable />
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Leave" note="Named by its field.">
        <Field>
          <FieldLabel>Leave</FieldLabel>
          <DateRangePicker {...BASE} endName="to" startName="from" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Narrow the window" note="The two halves keep the head.">
        <DateRangePicker {...BASE} defaultValue={STAY} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [run, setRun] = useState<DateRange | null>(STAY);

    return (
      <Grid columns={2}>
        <Scene label="An owned value" note="The picker asks.">
          <DateRangePicker {...BASE} footer="Returns by noon" onValueChange={setRun} value={run} />
        </Scene>

        <Scene label="A provider" note="Nights, for every picker.">
          <DateRangePickerDefaultsProvider count="nights">
            <DateRangePicker {...BASE} defaultValue={STAY} />
          </DateRangePickerDefaultsProvider>
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
        <DateRangePicker {...BASE} defaultValue={STAY} />
      </Scene>
    </Grid>
  ),
};
