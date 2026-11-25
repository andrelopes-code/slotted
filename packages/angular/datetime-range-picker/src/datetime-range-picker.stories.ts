import { signal } from '@angular/core';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type {
  DateTimeRange,
  DateTimeRangePickerSize,
  DateTimeRangePickerVariant,
} from './datetime-range-picker-defaults';
import { SlDateTimeRangePickerFooter } from './datetime-range-picker-parts';
import { SlDateTimeRangePicker } from './datetime-range-picker';
import {
  ANGULAR_DATETIME_RANGE_PICKER_DOCS,
  ANGULAR_DATETIME_RANGE_PICKER_TOKENS,
} from './datetime-range-picker.docs';

interface DateTimeRangePickerStoryArgs {
  size: DateTimeRangePickerSize;
  variant: DateTimeRangePickerVariant;
}

const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));
const RENTAL: DateTimeRange = { start: at(14, 17), end: at(17, 10, 30) };

const props = () => ({
  closes: at(25, 12),
  desk: [plainTime(8), plainTime(10, 30), plainTime(14), plainTime(17)],
  eight: plainTime(8),
  eightPm: plainTime(20),
  inDays: (seconds: number) => `${String(Math.ceil(seconds / 86_400))} billable days`,
  isTaken: ({ day }: PlainDate) => day === 19,
  open: { start: at(14, 17), end: null },
  opens: at(14, 14),
  presets: [
    { label: 'Weekend', value: { start: at(18, 18), end: at(20, 20) } },
    { label: 'One week', value: { start: at(14, 9), end: at(21, 9) } },
  ],
  rental: RENTAL,
  run: signal<DateTimeRange | null>(RENTAL),
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker.scenes, {
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

const meta: Meta<DateTimeRangePickerStoryArgs> = {
  title: 'Components/Datetime Range Picker',
  component: SlDateTimeRangePicker,
  decorators: [
    moduleMetadata({
      imports: [SlDateTimeRangePicker, SlDateTimeRangePickerFooter, SlField, SlFieldLabel],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Datetime Range Picker',
        description:
          'A one-line frame that holds a run of moments, with its months over a clock for each end behind it, and a draft that Apply writes.',
        framework: 'Angular',
        ...ANGULAR_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker,
        tokens: ANGULAR_DATETIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateTimeRangePickerStoryArgs>;

/** One demonstration: what it is called, what to look at, and the stage it stands on. */
const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

export const Playground: Story = {
  args: { size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...props(), ...args },
    template: `<div class="slotted-demo-stage" data-layout="block"><div slDateTimeRangePicker [defaultValue]="rental" [size]="size" [variant]="variant"></div></div>`,
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'Open',
        'Three days, from five to half past ten.',
        `<div slDateTimeRangePicker [defaultValue]="rental" defaultOpen></div>`,
      ),
    ),
  }),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Days and hours',
        'The locale’s own.',
        `<div slDateTimeRangePicker [defaultValue]="rental"></div>`,
      ) +
        scene(
          'In the product’s words',
          'Billable days, rounded up.',
          `<div slDateTimeRangePicker [defaultValue]="rental" [lengthLabel]="inDays"></div>`,
        ),
    ),
  }),
};

export const Durations: Story = {
  parameters: scenario('durations'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Three',
        'Half a day, a day, a week.',
        `<div slDateTimeRangePicker [defaultValue]="rental" [durations]="[43200, 86400, 604800]"></div>`,
      ) +
        scene(
          'None',
          'The shortcuts alone.',
          `<div slDateTimeRangePicker [defaultValue]="rental" [durations]="[]" [presets]="presets"></div>`,
        ),
    ),
  }),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'One day to seven',
        'The footer says it.',
        `<div slDateTimeRangePicker [defaultValue]="rental" maxLength="604800" minLength="86400"></div>`,
      ) +
        scene(
          'Over',
          'Two days at most.',
          `<div slDateTimeRangePicker [defaultValue]="rental" maxLength="172800"></div>`,
        ),
    ),
  }),
};

export const DayWindow: Story = {
  parameters: scenario('day-window'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Every day',
        'Eight to eight.',
        `<div slDateTimeRangePicker [defaultValue]="rental" [maxTime]="eightPm" [minTime]="eight"></div>`,
      ) +
        scene(
          'A whole range',
          'From the first day at two.',
          `<div slDateTimeRangePicker [defaultValue]="rental" [max]="closes" [min]="opens"></div>`,
        ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Contiguous',
        'The run stops before it.',
        `<div slDateTimeRangePicker [isDateUnavailable]="isTaken"></div>`,
      ) +
        scene(
          'Not contiguous',
          'Only the two ends are checked.',
          `<div slDateTimeRangePicker contiguous="false" [isDateUnavailable]="isTaken"></div>`,
        ),
    ),
  }),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'The desk',
        'Four in a day.',
        `<div slDateTimeRangePicker [defaultValue]="rental" [options]="desk"></div>`,
      ),
    ),
  }),
};

export const Months: Story = {
  parameters: scenario('months'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'One',
        'A run inside a month.',
        `<div slDateTimeRangePicker [defaultValue]="rental" months="1"></div>`,
      ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'Rentals',
        'Two of the product’s own.',
        `<div slDateTimeRangePicker [defaultValue]="rental" [presets]="presets"></div>`,
      ),
    ),
  }),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'With Apply',
        'Escape leaves the run as it was.',
        `<div slDateTimeRangePicker [defaultValue]="rental"></div>`,
      ) +
        scene(
          'Without',
          'The minute writes, and closes.',
          `<div slDateTimeRangePicker [defaultValue]="rental" confirm="false"></div>`,
        ),
    ),
  }),
};

export const OpenEnd: Story = {
  parameters: scenario('open-end'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'From September 14',
        'No end yet.',
        `<div slDateTimeRangePicker defaultPosition="end" [defaultValue]="open"></div>`,
      ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: props(),
    template: grid(
      3,
      scene(
        'sm',
        'The panel is the same at the three.',
        `<div slDateTimeRangePicker [defaultValue]="rental" size="sm"></div>`,
      ) +
        scene(
          'md',
          'The panel is the same at the three.',
          `<div slDateTimeRangePicker [defaultValue]="rental" size="md"></div>`,
        ) +
        scene(
          'lg',
          'The panel is the same at the three.',
          `<div slDateTimeRangePicker [defaultValue]="rental" size="lg"></div>`,
        ),
    ),
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    props: props(),
    template: grid(
      3,
      scene(
        'outline',
        'The frame the fields beside it draw.',
        `<div slDateTimeRangePicker [defaultValue]="rental" variant="outline"></div>`,
      ) +
        scene(
          'subtle',
          'The frame the fields beside it draw.',
          `<div slDateTimeRangePicker [defaultValue]="rental" variant="subtle"></div>`,
        ) +
        scene(
          'plain',
          'The frame the fields beside it draw.',
          `<div slDateTimeRangePicker [defaultValue]="rental" variant="plain"></div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Disabled',
        'Answers nothing.',
        `<div slDateTimeRangePicker [defaultValue]="rental" disabled></div>`,
      ) +
        scene(
          'Read only',
          'Readable.',
          `<div slDateTimeRangePicker [defaultValue]="rental" readOnly></div>`,
        ) +
        scene(
          'Invalid',
          'Stated by the consumer.',
          `<div slDateTimeRangePicker [defaultValue]="rental" invalid></div>`,
        ) +
        scene(
          'Clearable',
          'One clear for both ends.',
          `<div slDateTimeRangePicker [defaultValue]="rental" clearable></div>`,
        ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'Rental',
        'Named by its field.',
        `<div slField><label slFieldLabel>Rental</label><div slDateTimeRangePicker endName="to" startName="from"></div></div>`,
      ),
    ),
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'Narrow the window',
        'One month, or one clock.',
        `<div slDateTimeRangePicker [defaultValue]="rental" [presets]="presets"></div>`,
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'An owned value',
        'The picker asks.',
        `<div slDateTimeRangePicker [value]="run()" (valueChange)="run.set($event.value)"><span slDateTimeRangePickerFooter>Keys at the desk</span></div>`,
      ) +
        scene(
          'A provider',
          'Half hours, for every picker.',
          `<div slDateTimeRangePicker [defaultValue]="rental" step="1800"></div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'Enter on the frame',
        'Opens on the day of the current end.',
        `<div slDateTimeRangePicker [defaultValue]="rental"></div>`,
      ),
    ),
  }),
};
