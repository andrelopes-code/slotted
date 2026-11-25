import { plainDate, plainYearMonth } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldLabel } from '../field';
import { DatePicker } from './date-picker';
import { DatePickerDefaultsProvider } from './date-picker-defaults';
import { Grid, Scene } from './date-picker-demo';
import { REACT_DATE_PICKER_DOCS, REACT_DATE_PICKER_TOKENS } from './date-picker.docs';
import type { CalendarValue } from '../calendar';

const BASE = { locale: 'en-US' } as const;
const THIRTIETH = plainDate(2026, 11, 30);
const RUN = { start: plainDate(2026, 11, 23), end: plainDate(2026, 11, 27) };
const PRESETS = [
  { label: 'End of month', value: THIRTIETH },
  { label: 'End of quarter', value: plainDate(2026, 12, 31) },
  { label: 'Renewal', value: plainDate(2027, 3, 1) },
];

const isWeekend = (date: PlainDate) =>
  new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() % 6 === 0;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATE_PICKER_DOCS.datePicker.scenes, {
    playground: Playground,
    presets: Presets,
    'range-and-set': RangeAndSet,
    month: Month,
    confirm: Confirm,
    'range-bounds': RangeBounds,
    unavailable: Unavailable,
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
  title: 'Components/Date Picker',
  component: DatePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Picker',
        description:
          'A date field with a month behind it: the value in words, shortcuts with the date they write, and the twelve months of the year a press away.',
        framework: 'React',
        ...REACT_DATE_PICKER_DOCS.datePicker,
        tokens: REACT_DATE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { ...BASE, size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <DatePicker {...args} defaultValue={THIRTIETH} />
    </div>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene label="A deadline" note="Today, three shortcuts, and the months of the year.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const RangeAndSet: Story = {
  parameters: scenario('range-and-set'),
  render: () => (
    <Grid columns={2}>
      <Scene label="A run" note="Two presses, or a week number.">
        <DatePicker {...BASE} defaultValue={RUN} selectionMode="range" weekNumbers />
      </Scene>

      <Scene label="A set" note="Every press adds a date, or takes it out.">
        <DatePicker {...BASE} selectionMode="multiple" />
      </Scene>
    </Grid>
  ),
};

export const Month: Story = {
  parameters: scenario('month'),
  render: () => (
    <Grid columns={1}>
      <Scene label="A statement" note="One press, and the month is written.">
        <DatePicker {...BASE} defaultValue={plainYearMonth(2026, 12)} granularity="month" />
      </Scene>
    </Grid>
  ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Without" note="A press finishes it.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} />
      </Scene>

      <Scene label="With Apply" note="Escape leaves the value as it was.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} confirm />
      </Scene>
    </Grid>
  ),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => (
    <Grid columns={2}>
      <Scene label="This quarter" note="October to December.">
        <DatePicker
          {...BASE}
          defaultValue={THIRTIETH}
          max={plainDate(2026, 12, 31)}
          min={plainDate(2026, 10, 1)}
        />
      </Scene>

      <Scene label="Outside them" note="The control is invalid.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} min={plainDate(2026, 12, 1)} />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Weekends" note="Nothing on a Saturday or a Sunday.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} isDateUnavailable={isWeekend} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene label="sm" note="The panel is the same at the three.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} size="sm" />
      </Scene>

      <Scene label="md" note="The panel is the same at the three.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} size="md" />
      </Scene>

      <Scene label="lg" note="The panel is the same at the three.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={3}>
      <Scene label="outline" note="The frame the fields beside it draw.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} variant="outline" />
      </Scene>

      <Scene label="subtle" note="The frame the fields beside it draw.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} variant="subtle" />
      </Scene>

      <Scene label="plain" note="The frame the fields beside it draw.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Bottom, end" note="Under the end of the control.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} placement="bottom-end" />
      </Scene>

      <Scene label="Top, start" note="Over its start.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} placement="top-start" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Disabled" note="Answers nothing.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} disabled />
      </Scene>

      <Scene label="Read only" note="Readable.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} readOnly />
      </Scene>

      <Scene label="Invalid" note="Stated by the consumer.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} invalid />
      </Scene>

      <Scene label="Required" note="The form needs it.">
        <DatePicker {...BASE} required />
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Delivery" note="Named by its field.">
        <Field>
          <FieldLabel>Delivery</FieldLabel>
          <DatePicker {...BASE} name="delivery" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Narrow the window" note="The month keeps its six rows.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} presets={PRESETS} />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [date, setDate] = useState<CalendarValue>(THIRTIETH);

    return (
      <Grid columns={2}>
        <Scene label="An owned value" note="The picker asks.">
          <DatePicker {...BASE} footer="Closed on Sundays" onValueChange={setDate} value={date} />
        </Scene>

        <Scene label="A provider" note="A draft for every picker.">
          <DatePickerDefaultsProvider confirm>
            <DatePicker {...BASE} />
          </DatePickerDefaultsProvider>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Alt and ArrowDown" note="Opens the panel from a segment.">
        <DatePicker {...BASE} defaultValue={THIRTIETH} />
      </Scene>
    </Grid>
  ),
};
