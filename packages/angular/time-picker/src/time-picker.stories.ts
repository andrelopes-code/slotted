import { signal } from '@angular/core';
import { plainTime } from '@slotted/core/date';
import type { PlainTime, TimeGranularity } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlClockSlot } from '@slotted/angular/clock';
import type { TimePickerSize, TimePickerVariant } from './time-picker-defaults';
import { SlTimePickerFooter } from './time-picker-parts';
import { SlTimePicker } from './time-picker';
import { ANGULAR_TIME_PICKER_DOCS, ANGULAR_TIME_PICKER_TOKENS } from './time-picker.docs';

interface TimePickerStoryArgs {
  granularity: TimeGranularity;
  size: TimePickerSize;
  step: number;
  variant: TimePickerVariant;
}

const props = () => ({
  clinic: [plainTime(8, 40), plainTime(9), plainTime(9, 20), plainTime(13, 45), plainTime(18, 30)],
  courier: [900, 3600],
  evening: plainTime(18),
  halfPastTwo: plainTime(14, 30),
  isLunch: (time: PlainTime) => time.hour === 12,
  presets: [
    { label: 'Start of shift', value: plainTime(8) },
    { label: 'Lunch', value: plainTime(12) },
    { label: 'End of shift', value: plainTime(18) },
  ],
  tenPastEight: plainTime(8, 10),
  tenTwenty: plainTime(10, 20),
  time: signal<PlainTime | null>(plainTime(14, 30)),
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TIME_PICKER_DOCS.timePicker.scenes, {
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
    placement: Placement,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<TimePickerStoryArgs> = {
  title: 'Components/Time Picker',
  component: SlTimePicker,
  decorators: [
    moduleMetadata({
      imports: [SlClockSlot, SlField, SlFieldLabel, SlTimePicker, SlTimePickerFooter],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Picker',
        description:
          'A time field with a clock behind it: every hour of the day and every minute of the step in view, shortcuts with the time they write, and a draft that Apply writes.',
        framework: 'Angular',
        ...ANGULAR_TIME_PICKER_DOCS.timePicker,
        tokens: ANGULAR_TIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TimePickerStoryArgs>;

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
  args: { granularity: 'minute', size: 'md', step: 900, variant: 'outline' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...props(), ...args },
    template: `<div class="slotted-demo-stage" data-layout="block"><div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" [granularity]="granularity" [size]="size" [step]="step" [variant]="variant"></div></div>`,
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'A shift',
        'Each shortcut says the time it writes.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" [presets]="presets"></div>`,
      ),
    ),
  }),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Appointments',
        'Whole times under the part of the day.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [options]="clinic"></div>`,
      ) +
        scene(
          'A slot that says more',
          'renderSlot draws what is in the button.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [options]="clinic"><ng-template slClockSlot let-state="state">{{ state.label }}</ng-template></div>`,
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
        'A cue',
        'Every five seconds.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" granularity="second" step="5"></div>`,
      ) +
        scene(
          'The hour alone',
          'One press is the whole time.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" granularity="hour"></div>`,
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
        'Twelve minutes to an hour.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" step="300"></div>`,
      ) +
        scene(
          'From ten past',
          'min 08:10 and half an hour: :10 and :40.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [min]="tenPastEight" step="1800"></div>`,
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
        'Business hours',
        '08:10 to 18:00.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [max]="evening" [min]="tenPastEight"></div>`,
      ) +
        scene(
          'Outside them',
          'The control is invalid, and so is Apply.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" [min]="evening"></div>`,
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
        'Lunch',
        'Nothing between twelve and one.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [isTimeUnavailable]="isLunch"></div>`,
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
        'A courier',
        'A quarter of an hour, and an hour.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [offsets]="courier"></div>`,
      ) +
        scene(
          'None',
          'The clock alone.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [offsets]="[]"></div>`,
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
      scene(
        'Type +45m',
        'From a segment.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" relative></div>`,
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
        'Shifts',
        'Now, and three times of the day.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [presets]="presets"></div>`,
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
        'Escape leaves the value as it was.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo"></div>`,
      ) +
        scene(
          'Without',
          'The minute writes, and closes.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" confirm="false"></div>`,
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
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" size="sm"></div>`,
      ) +
        scene(
          'md',
          'The panel is the same at the three.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" size="md"></div>`,
        ) +
        scene(
          'lg',
          'The panel is the same at the three.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" size="lg"></div>`,
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
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" variant="outline"></div>`,
      ) +
        scene(
          'subtle',
          'The frame the fields beside it draw.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" variant="subtle"></div>`,
        ) +
        scene(
          'plain',
          'The frame the fields beside it draw.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" variant="plain"></div>`,
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
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" placement="bottom-end"></div>`,
      ) +
        scene(
          'Top, start',
          'Over its start.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" placement="top-start"></div>`,
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
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" disabled></div>`,
      ) +
        scene(
          'Read only',
          'Readable.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" readOnly></div>`,
        ) +
        scene(
          'Invalid',
          'Stated by the consumer.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" invalid></div>`,
        ) +
        scene(
          'Required',
          'The form needs it.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" required></div>`,
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
        `<div slField><label slFieldLabel>Departure</label><div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" name="departure"></div></div>`,
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
        'The clock keeps its four rows.',
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo" [presets]="presets"></div>`,
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
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [value]="time()" (valueChange)="time.set($event.value)"><span slTimePickerFooter>Gate B</span></div>`,
      ) +
        scene(
          'A provider',
          'Twenty minutes to a slot.',
          `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" step="1200"></div>`,
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
        `<div slTimePicker [hourCycle]="24" [referenceTime]="tenTwenty" [defaultValue]="halfPastTwo"></div>`,
      ),
    ),
  }),
};
