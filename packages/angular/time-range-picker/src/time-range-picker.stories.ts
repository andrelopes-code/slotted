import { signal } from '@angular/core';
import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type {
  TimeRange,
  TimeRangePickerSize,
  TimeRangePickerVariant,
} from './time-range-picker-defaults';
import { SlTimeRangePickerFooter } from './time-range-picker-parts';
import { SlTimeRangePicker } from './time-range-picker';
import {
  ANGULAR_TIME_RANGE_PICKER_DOCS,
  ANGULAR_TIME_RANGE_PICKER_TOKENS,
} from './time-range-picker.docs';

interface TimeRangePickerStoryArgs {
  size: TimeRangePickerSize;
  variant: TimeRangePickerVariant;
}

const BOOKING: TimeRange = { start: plainTime(9), end: plainTime(11, 45) };

const props = () => ({
  booking: BOOKING,
  changes: [6, 9, 12, 14, 18, 22].map((hour) => plainTime(hour)),
  inUnits: (seconds: number) => `${String(Math.round(seconds / 360))} units`,
  isNoon: ({ hour }: PlainTime) => hour === 12,
  open: { start: plainTime(9), end: null },
  presets: [
    { label: 'Morning', value: { start: plainTime(8), end: plainTime(12) } },
    { label: 'Afternoon', value: { start: plainTime(13), end: plainTime(18) } },
    { label: 'Work day', value: { start: plainTime(9), end: plainTime(18) } },
  ],
  run: signal<TimeRange | null>(BOOKING),
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TIME_RANGE_PICKER_DOCS.timeRangePicker.scenes, {
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

const meta: Meta<TimeRangePickerStoryArgs> = {
  title: 'Components/Time Range Picker',
  component: SlTimeRangePicker,
  decorators: [
    moduleMetadata({
      imports: [SlTimeRangePicker, SlTimeRangePickerFooter, SlField, SlFieldLabel],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Range Picker',
        description:
          'A one-line frame that holds a run of times, with the day as one axis and a clock for each end behind it, and a draft that Apply writes.',
        framework: 'Angular',
        ...ANGULAR_TIME_RANGE_PICKER_DOCS.timeRangePicker,
        tokens: ANGULAR_TIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TimeRangePickerStoryArgs>;

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
    template: `<div class="slotted-demo-stage" data-layout="block"><div slTimeRangePicker [defaultValue]="booking" [size]="size" [variant]="variant"></div></div>`,
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
        'From nine to a quarter to twelve.',
        `<div slTimeRangePicker [defaultValue]="booking" defaultOpen></div>`,
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
        'Hours and minutes',
        'The locale’s own.',
        `<div slTimeRangePicker [defaultValue]="booking"></div>`,
      ) +
        scene(
          'In the product’s words',
          'Billable units of six minutes.',
          `<div slTimeRangePicker [defaultValue]="booking" [lengthLabel]="inUnits"></div>`,
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
        'A slot, two, or a half day.',
        `<div slTimeRangePicker [defaultValue]="booking" [durations]="[1800, 3600, 14400]"></div>`,
      ) +
        scene(
          'None',
          'The shortcuts alone.',
          `<div slTimeRangePicker [defaultValue]="booking" [durations]="[]" [presets]="presets"></div>`,
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
        'Half an hour to four',
        'The footer says it.',
        `<div slTimeRangePicker [defaultValue]="booking" maxLength="14400" minLength="1800"></div>`,
      ) +
        scene(
          'Over',
          'Two hours at most.',
          `<div slTimeRangePicker [defaultValue]="booking" maxLength="7200"></div>`,
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
        'The run stops at noon.',
        `<div slTimeRangePicker [defaultValue]="booking" [isTimeUnavailable]="isNoon"></div>`,
      ) +
        scene(
          'Not contiguous',
          'Only the two ends are checked.',
          `<div slTimeRangePicker [defaultValue]="booking" contiguous="false" [isTimeUnavailable]="isNoon"></div>`,
        ),
    ),
  }),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Five minutes',
        'Twelve in an hour.',
        `<div slTimeRangePicker [defaultValue]="booking" step="300"></div>`,
      ) +
        scene(
          'An hour',
          'No minutes to press.',
          `<div slTimeRangePicker [defaultValue]="booking" step="3600"></div>`,
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
      scene('Shift changes', 'Six in a day.', `<div slTimeRangePicker [options]="changes"></div>`),
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
        'Shifts',
        'Three of the product’s own.',
        `<div slTimeRangePicker [defaultValue]="booking" [presets]="presets"></div>`,
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
        `<div slTimeRangePicker [defaultValue]="booking"></div>`,
      ) +
        scene(
          'Without',
          'The minute writes, and closes.',
          `<div slTimeRangePicker [defaultValue]="booking" confirm="false"></div>`,
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
        'From nine',
        'No end yet.',
        `<div slTimeRangePicker defaultPosition="end" [defaultValue]="open"></div>`,
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
        `<div slTimeRangePicker [defaultValue]="booking" size="sm"></div>`,
      ) +
        scene(
          'md',
          'The panel is the same at the three.',
          `<div slTimeRangePicker [defaultValue]="booking" size="md"></div>`,
        ) +
        scene(
          'lg',
          'The panel is the same at the three.',
          `<div slTimeRangePicker [defaultValue]="booking" size="lg"></div>`,
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
        `<div slTimeRangePicker [defaultValue]="booking" variant="outline"></div>`,
      ) +
        scene(
          'subtle',
          'The frame the fields beside it draw.',
          `<div slTimeRangePicker [defaultValue]="booking" variant="subtle"></div>`,
        ) +
        scene(
          'plain',
          'The frame the fields beside it draw.',
          `<div slTimeRangePicker [defaultValue]="booking" variant="plain"></div>`,
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
        `<div slTimeRangePicker [defaultValue]="booking" disabled></div>`,
      ) +
        scene(
          'Read only',
          'Readable.',
          `<div slTimeRangePicker [defaultValue]="booking" readOnly></div>`,
        ) +
        scene(
          'Invalid',
          'Stated by the consumer.',
          `<div slTimeRangePicker [defaultValue]="booking" invalid></div>`,
        ) +
        scene(
          'Clearable',
          'One clear for both ends.',
          `<div slTimeRangePicker [defaultValue]="booking" clearable></div>`,
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
        'Booking',
        'Named by its field.',
        `<div slField><label slFieldLabel>Booking</label><div slTimeRangePicker endName="to" startName="from"></div></div>`,
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
        'A press on an end brings its clock.',
        `<div slTimeRangePicker [defaultValue]="booking" [presets]="presets"></div>`,
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
        `<div slTimeRangePicker [value]="run()" (valueChange)="run.set($event.value)"><span slTimeRangePickerFooter>The room closes at 6</span></div>`,
      ) +
        scene(
          'A provider',
          'Half hours, for every picker.',
          `<div slTimeRangePicker [defaultValue]="booking" step="1800"></div>`,
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
        'Opens on the clock of the current end.',
        `<div slTimeRangePicker [defaultValue]="booking"></div>`,
      ),
    ),
  }),
};
