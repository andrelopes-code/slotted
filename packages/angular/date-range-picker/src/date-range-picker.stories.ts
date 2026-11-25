import { signal } from '@angular/core';
import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type {
  DateRange,
  DateRangePickerCount,
  DateRangePickerSize,
  DateRangePickerVariant,
} from './date-range-picker-defaults';
import { SlDateRangePickerFooter } from './date-range-picker-parts';
import { SlDateRangePicker } from './date-range-picker';
import {
  ANGULAR_DATE_RANGE_PICKER_DOCS,
  ANGULAR_DATE_RANGE_PICKER_TOKENS,
} from './date-range-picker.docs';

interface DateRangePickerStoryArgs {
  count: DateRangePickerCount;
  size: DateRangePickerSize;
  variant: DateRangePickerVariant;
}

const day = (date: number) => plainDate(2026, 9, date);

const props = () => ({
  isTaken: (date: PlainDate) => date.day === 15,
  open: { start: day(7), end: null },
  over: { start: day(7), end: day(18) },
  presets: [
    { label: 'Weekend', value: { start: day(11), end: day(13) } },
    { label: 'One week', value: { start: day(7), end: day(14) } },
    { label: 'Two weeks', value: { start: day(7), end: day(21) } },
  ],
  run: signal<DateRange | null>({ start: day(7), end: day(11) }),
  stay: { start: day(7), end: day(11) },
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATE_RANGE_PICKER_DOCS.dateRangePicker.scenes, {
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

const meta: Meta<DateRangePickerStoryArgs> = {
  title: 'Components/Date Range Picker',
  component: SlDateRangePicker,
  decorators: [
    moduleMetadata({
      imports: [SlDateRangePicker, SlDateRangePickerFooter, SlField, SlFieldLabel],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Range Picker',
        description:
          'Two date fields in one frame with the months of a run behind them: each end in words, the length between them as a control, and a draft that Apply writes.',
        framework: 'Angular',
        ...ANGULAR_DATE_RANGE_PICKER_DOCS.dateRangePicker,
        tokens: ANGULAR_DATE_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateRangePickerStoryArgs>;

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
  args: { count: 'nights', size: 'md', variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...props(), ...args },
    template: `<div class="slotted-demo-stage" data-layout="block"><div slDateRangePicker [defaultValue]="stay" [count]="count" [size]="size" [variant]="variant"></div></div>`,
  }),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Nights',
        'The gaps between the two ends.',
        `<div slDateRangePicker [defaultValue]="stay" count="nights"></div>`,
      ) +
        scene(
          'Days',
          'Both ends included.',
          `<div slDateRangePicker [defaultValue]="stay" count="days"></div>`,
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
        'Two to seven nights',
        'The footer says it.',
        `<div slDateRangePicker [defaultValue]="stay" count="nights" maxLength="7" minLength="2"></div>`,
      ) +
        scene(
          'Over',
          'Typed past the limit.',
          `<div slDateRangePicker count="nights" maxLength="7" [defaultValue]="over"></div>`,
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
        'Stays',
        'Three of the product’s own.',
        `<div slDateRangePicker [defaultValue]="stay" count="nights" [presets]="presets"></div>`,
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
        `<div slDateRangePicker [defaultValue]="stay"></div>`,
      ) +
        scene(
          'Without',
          'The second press writes, and closes.',
          `<div slDateRangePicker [defaultValue]="stay" confirm="false"></div>`,
        ),
    ),
  }),
};

export const Weeks: Story = {
  parameters: scenario('weeks'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'Week numbers',
        'The ISO number of each row.',
        `<div slDateRangePicker [defaultValue]="stay" weekNumbers></div>`,
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
        `<div slDateRangePicker [isDateUnavailable]="isTaken"></div>`,
      ) +
        scene(
          'Not contiguous',
          'Only the two ends are checked.',
          `<div slDateRangePicker [contiguous]="false" [isDateUnavailable]="isTaken"></div>`,
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
        'From September 7',
        'No end yet.',
        `<div slDateRangePicker defaultPosition="end" [defaultValue]="open"></div>`,
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
        `<div slDateRangePicker [defaultValue]="stay" size="sm"></div>`,
      ) +
        scene(
          'md',
          'The panel is the same at the three.',
          `<div slDateRangePicker [defaultValue]="stay" size="md"></div>`,
        ) +
        scene(
          'lg',
          'The panel is the same at the three.',
          `<div slDateRangePicker [defaultValue]="stay" size="lg"></div>`,
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
        `<div slDateRangePicker [defaultValue]="stay" variant="outline"></div>`,
      ) +
        scene(
          'subtle',
          'The frame the fields beside it draw.',
          `<div slDateRangePicker [defaultValue]="stay" variant="subtle"></div>`,
        ) +
        scene(
          'plain',
          'The frame the fields beside it draw.',
          `<div slDateRangePicker [defaultValue]="stay" variant="plain"></div>`,
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
        `<div slDateRangePicker [defaultValue]="stay" disabled></div>`,
      ) +
        scene(
          'Read only',
          'Readable.',
          `<div slDateRangePicker [defaultValue]="stay" readOnly></div>`,
        ) +
        scene(
          'Invalid',
          'Stated by the consumer.',
          `<div slDateRangePicker [defaultValue]="stay" invalid></div>`,
        ) +
        scene(
          'Clearable',
          'One clear for both ends.',
          `<div slDateRangePicker [defaultValue]="stay" clearable></div>`,
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
        'Leave',
        'Named by its field.',
        `<div slField><label slFieldLabel>Leave</label><div slDateRangePicker endName="to" startName="from"></div></div>`,
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
        'The two halves keep the head.',
        `<div slDateRangePicker [defaultValue]="stay" [presets]="presets"></div>`,
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
        `<div slDateRangePicker [value]="run()" (valueChange)="run.set($event.value)"><span slDateRangePickerFooter>Returns by noon</span></div>`,
      ) +
        scene(
          'A provider',
          'Nights, for every picker.',
          `<div slDateRangePicker [defaultValue]="stay" count="nights"></div>`,
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
        'Alt and ArrowDown',
        'Opens, and leaves focus in the field.',
        `<div slDateRangePicker [defaultValue]="stay"></div>`,
      ),
    ),
  }),
};
