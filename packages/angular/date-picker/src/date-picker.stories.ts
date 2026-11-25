import { signal } from '@angular/core';
import { plainDate, plainYearMonth } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import type { CalendarValue } from '@slotted/angular/calendar';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import type { DatePickerSize, DatePickerVariant } from './date-picker-defaults';
import { SlDatePickerFooter } from './date-picker-parts';
import { SlDatePicker } from './date-picker';
import { ANGULAR_DATE_PICKER_DOCS, ANGULAR_DATE_PICKER_TOKENS } from './date-picker.docs';

interface DatePickerStoryArgs {
  size: DatePickerSize;
  variant: DatePickerVariant;
}

const props = () => ({
  date: signal<CalendarValue>(plainDate(2026, 11, 30)),
  december: plainYearMonth(2026, 12),
  december1: plainDate(2026, 12, 1),
  firstDay: plainDate(2026, 10, 1),
  isWeekend: (date: PlainDate) =>
    new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() % 6 === 0,
  lastDay: plainDate(2026, 12, 31),
  presets: [
    { label: 'End of month', value: plainDate(2026, 11, 30) },
    { label: 'End of quarter', value: plainDate(2026, 12, 31) },
    { label: 'Renewal', value: plainDate(2027, 3, 1) },
  ],
  run: { start: plainDate(2026, 11, 23), end: plainDate(2026, 11, 27) },
  thirtieth: plainDate(2026, 11, 30),
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATE_PICKER_DOCS.datePicker.scenes, {
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

const meta: Meta<DatePickerStoryArgs> = {
  title: 'Components/Date Picker',
  component: SlDatePicker,
  decorators: [
    moduleMetadata({ imports: [SlDatePicker, SlDatePickerFooter, SlField, SlFieldLabel] }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Picker',
        description:
          'A date field with a month behind it: the value in words, shortcuts with the date they write, and the twelve months of the year a press away.',
        framework: 'Angular',
        ...ANGULAR_DATE_PICKER_DOCS.datePicker,
        tokens: ANGULAR_DATE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DatePickerStoryArgs>;

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
    template: `<div class="slotted-demo-stage" data-layout="block"><div slDatePicker [defaultValue]="thirtieth" [size]="size" [variant]="variant"></div></div>`,
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'A deadline',
        'Today, three shortcuts, and the months of the year.',
        `<div slDatePicker [defaultValue]="thirtieth" [presets]="presets"></div>`,
      ),
    ),
  }),
};

export const RangeAndSet: Story = {
  parameters: scenario('range-and-set'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'A run',
        'Two presses, or a week number.',
        `<div slDatePicker [defaultValue]="run" selectionMode="range" weekNumbers></div>`,
      ) +
        scene(
          'A set',
          'Every press adds a date, or takes it out.',
          `<div slDatePicker selectionMode="multiple"></div>`,
        ),
    ),
  }),
};

export const Month: Story = {
  parameters: scenario('month'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'A statement',
        'One press, and the month is written.',
        `<div slDatePicker [defaultValue]="december" granularity="month"></div>`,
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
        'Without',
        'A press finishes it.',
        `<div slDatePicker [defaultValue]="thirtieth"></div>`,
      ) +
        scene(
          'With Apply',
          'Escape leaves the value as it was.',
          `<div slDatePicker [defaultValue]="thirtieth" confirm></div>`,
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
        'This quarter',
        'October to December.',
        `<div slDatePicker [defaultValue]="thirtieth" [max]="lastDay" [min]="firstDay"></div>`,
      ) +
        scene(
          'Outside them',
          'The control is invalid.',
          `<div slDatePicker [defaultValue]="thirtieth" [min]="december1"></div>`,
        ),
    ),
  }),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'Weekends',
        'Nothing on a Saturday or a Sunday.',
        `<div slDatePicker [defaultValue]="thirtieth" [isDateUnavailable]="isWeekend"></div>`,
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
        `<div slDatePicker [defaultValue]="thirtieth" size="sm"></div>`,
      ) +
        scene(
          'md',
          'The panel is the same at the three.',
          `<div slDatePicker [defaultValue]="thirtieth" size="md"></div>`,
        ) +
        scene(
          'lg',
          'The panel is the same at the three.',
          `<div slDatePicker [defaultValue]="thirtieth" size="lg"></div>`,
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
        `<div slDatePicker [defaultValue]="thirtieth" variant="outline"></div>`,
      ) +
        scene(
          'subtle',
          'The frame the fields beside it draw.',
          `<div slDatePicker [defaultValue]="thirtieth" variant="subtle"></div>`,
        ) +
        scene(
          'plain',
          'The frame the fields beside it draw.',
          `<div slDatePicker [defaultValue]="thirtieth" variant="plain"></div>`,
        ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Bottom, end',
        'Under the end of the control.',
        `<div slDatePicker [defaultValue]="thirtieth" placement="bottom-end"></div>`,
      ) +
        scene(
          'Top, start',
          'Over its start.',
          `<div slDatePicker [defaultValue]="thirtieth" placement="top-start"></div>`,
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
        `<div slDatePicker [defaultValue]="thirtieth" disabled></div>`,
      ) +
        scene(
          'Read only',
          'Readable.',
          `<div slDatePicker [defaultValue]="thirtieth" readOnly></div>`,
        ) +
        scene(
          'Invalid',
          'Stated by the consumer.',
          `<div slDatePicker [defaultValue]="thirtieth" invalid></div>`,
        ) +
        scene('Required', 'The form needs it.', `<div slDatePicker required></div>`),
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
        'Delivery',
        'Named by its field.',
        `<div slField><label slFieldLabel>Delivery</label><div slDatePicker name="delivery"></div></div>`,
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
        'The month keeps its six rows.',
        `<div slDatePicker [defaultValue]="thirtieth" [presets]="presets"></div>`,
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
        `<div slDatePicker [value]="date()" (valueChange)="date.set($event.value)"><span slDatePickerFooter>Closed on Sundays</span></div>`,
      ) + scene('A provider', 'A draft for every picker.', `<div slDatePicker confirm></div>`),
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
        'Opens the panel from a segment.',
        `<div slDatePicker [defaultValue]="thirtieth"></div>`,
      ),
    ),
  }),
};
