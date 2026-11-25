import { signal } from '@angular/core';
import { dayOfWeek, plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type { DateTimePickerSize, DateTimePickerVariant } from './datetime-picker-defaults';
import { SlDateTimePickerFooter } from './datetime-picker-parts';
import { SlDateTimePicker } from './datetime-picker';
import {
  ANGULAR_DATETIME_PICKER_DOCS,
  ANGULAR_DATETIME_PICKER_TOKENS,
} from './datetime-picker.docs';

interface DateTimePickerStoryArgs {
  size: DateTimePickerSize;
  variant: DateTimePickerVariant;
}

const at = (day: number, hour: number, minute = 0) =>
  plainDateTime(plainDate(2026, 9, day), plainTime(hour, minute));

const props = () => ({
  closes: at(25, 12),
  departure: at(17, 14, 30),
  eight: plainTime(8),
  isNoon: ({ hour }: PlainTime) => hour === 12,
  isSaturday: (date: PlainDate) => dayOfWeek(date) === 6,
  moment: signal<PlainDateTime | null>(at(17, 14, 30)),
  opens: at(14, 14),
  presets: [
    { label: 'Tomorrow early', value: at(11, 9) },
    { label: 'Monday afternoon', value: at(14, 14, 30) },
  ],
  six: plainTime(18),
  visits: [plainTime(9), plainTime(9, 20), plainTime(13, 45)],
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATETIME_PICKER_DOCS.dateTimePicker.scenes, {
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

const meta: Meta<DateTimePickerStoryArgs> = {
  title: 'Components/Datetime Picker',
  component: SlDateTimePicker,
  decorators: [
    moduleMetadata({ imports: [SlDateTimePicker, SlDateTimePickerFooter, SlField, SlFieldLabel] }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Datetime Picker',
        description:
          'A segmented date-time field with a month beside a clock behind its trigger: the day in words, the time typed or pressed, and a draft that Apply writes.',
        framework: 'Angular',
        ...ANGULAR_DATETIME_PICKER_DOCS.dateTimePicker,
        tokens: ANGULAR_DATETIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DateTimePickerStoryArgs>;

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
    template: `<div class="slotted-demo-stage" data-layout="block"><div slDateTimePicker [defaultValue]="departure" [size]="size" [variant]="variant"></div></div>`,
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
        'The hours are the ones the day in the draft is open for.',
        `<div slDateTimePicker [defaultValue]="departure" defaultOpen></div>`,
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
        'A clinic',
        'Three times a day.',
        `<div slDateTimePicker [defaultValue]="departure" [options]="visits"></div>`,
      ),
    ),
  }),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Hour',
        'No minutes.',
        `<div slDateTimePicker [defaultValue]="departure" granularity="hour"></div>`,
      ) +
        scene(
          'Second',
          'A third grid.',
          `<div slDateTimePicker [defaultValue]="departure" granularity="second" step="15"></div>`,
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
        `<div slDateTimePicker [defaultValue]="departure" step="300"></div>`,
      ) +
        scene(
          'An hour',
          'No minutes to press.',
          `<div slDateTimePicker [defaultValue]="departure" step="3600"></div>`,
        ),
    ),
  }),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'A whole range',
        'From the first day at two.',
        `<div slDateTimePicker [defaultValue]="departure" [max]="closes" [min]="opens"></div>`,
      ) +
        scene(
          'Every day',
          'Eight to six.',
          `<div slDateTimePicker [defaultValue]="departure" [maxTime]="six" [minTime]="eight"></div>`,
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
        'Days',
        'The office closes on Saturdays.',
        `<div slDateTimePicker [defaultValue]="departure" [isDateUnavailable]="isSaturday"></div>`,
      ) +
        scene(
          'Times',
          'Noon is taken.',
          `<div slDateTimePicker [defaultValue]="departure" [isTimeUnavailable]="isNoon"></div>`,
        ),
    ),
  }),
};

export const Offsets: Story = {
  parameters: scenario('offsets'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Two',
        'Half a day and two days.',
        `<div slDateTimePicker [defaultValue]="departure" [offsets]="[43200, 172800]"></div>`,
      ) +
        scene(
          'None',
          'The clock alone.',
          `<div slDateTimePicker [defaultValue]="departure" [offsets]="[]"></div>`,
        ),
    ),
  }),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene('Relative', 'Type + in a segment.', `<div slDateTimePicker relative></div>`),
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
        'Departures',
        'Two of the product’s own.',
        `<div slDateTimePicker [defaultValue]="departure" [presets]="presets"></div>`,
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
        'Escape leaves the moment as it was.',
        `<div slDateTimePicker [defaultValue]="departure"></div>`,
      ) +
        scene(
          'Without',
          'The minute writes, and closes.',
          `<div slDateTimePicker [defaultValue]="departure" confirm="false"></div>`,
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
        `<div slDateTimePicker [defaultValue]="departure" size="sm"></div>`,
      ) +
        scene(
          'md',
          'The panel is the same at the three.',
          `<div slDateTimePicker [defaultValue]="departure" size="md"></div>`,
        ) +
        scene(
          'lg',
          'The panel is the same at the three.',
          `<div slDateTimePicker [defaultValue]="departure" size="lg"></div>`,
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
        `<div slDateTimePicker [defaultValue]="departure" variant="outline"></div>`,
      ) +
        scene(
          'subtle',
          'The frame the fields beside it draw.',
          `<div slDateTimePicker [defaultValue]="departure" variant="subtle"></div>`,
        ) +
        scene(
          'plain',
          'The frame the fields beside it draw.',
          `<div slDateTimePicker [defaultValue]="departure" variant="plain"></div>`,
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
        `<div slDateTimePicker [defaultValue]="departure" disabled></div>`,
      ) +
        scene(
          'Read only',
          'Readable.',
          `<div slDateTimePicker [defaultValue]="departure" readOnly></div>`,
        ) +
        scene(
          'Invalid',
          'Stated by the consumer.',
          `<div slDateTimePicker [defaultValue]="departure" invalid></div>`,
        ) +
        scene(
          'Clearable',
          'One clear for both halves.',
          `<div slDateTimePicker [defaultValue]="departure" clearable></div>`,
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
        'Departure',
        'Named by its field.',
        `<div slField><label slFieldLabel>Departure</label><div slDateTimePicker name="departure"></div></div>`,
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
        'A press on a day moves to the clock.',
        `<div slDateTimePicker [defaultValue]="departure" [presets]="presets"></div>`,
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
        `<div slDateTimePicker [value]="moment()" (valueChange)="moment.set($event.value)"><span slDateTimePickerFooter>Doors close at 6</span></div>`,
      ) +
        scene(
          'A provider',
          'Half hours, for every picker.',
          `<div slDateTimePicker [defaultValue]="departure" step="1800"></div>`,
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
        `<div slDateTimePicker [defaultValue]="departure"></div>`,
      ),
    ),
  }),
};
