import { signal } from '@angular/core';
import { plainTime } from '@slotted/core/date';
import type { PlainTime, TimeGranularity } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlClock } from './clock';
import { ANGULAR_CLOCK_DOCS, ANGULAR_CLOCK_TOKENS } from './clock.docs';
import type { ClockHourCycle } from './clock.types';

interface ClockStoryArgs {
  granularity: TimeGranularity;
  hourCycle: ClockHourCycle;
  locale: string;
  step: number;
}

const props = () => ({
  appointments: [
    plainTime(8, 40),
    plainTime(9),
    plainTime(9, 20),
    plainTime(10, 10),
    plainTime(13, 45),
    plainTime(15, 20),
    plainTime(18, 30),
  ],
  closing: plainTime(18),
  cue: plainTime(14, 30, 25),
  halfPastTwo: plainTime(14, 30),
  isLunch: (time: PlainTime) => time.hour === 12,
  isTaken: (time: PlainTime) => time.hour === 10 || time.hour === 15,
  opening: plainTime(8),
  tenPastEight: plainTime(8, 10),
  tenTwenty: plainTime(10, 20),
  time: signal<PlainTime | null>(plainTime(14, 30)),
  twentyPastNine: plainTime(9, 20),
  twentyToNine: plainTime(8, 40),
});

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CLOCK_DOCS.clock.scenes, {
    playground: Playground,
    steps: Steps,
    'hour-cycle': HourCycle,
    seconds: Seconds,
    slots: Slots,
    bounds: Bounds,
    states: States,
    density: Density,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<ClockStoryArgs> = {
  title: 'Components/Clock',
  component: SlClock,
  decorators: [moduleMetadata({ imports: [SlClock] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Clock',
        description:
          'Every hour of the day in one grid and the minutes of the step under it. Two presses write a time, and nothing scrolls at any step.',
        framework: 'Angular',
        ...ANGULAR_CLOCK_DOCS.clock,
        tokens: ANGULAR_CLOCK_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ClockStoryArgs>;

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
  args: { granularity: 'minute', hourCycle: 24, locale: 'en-US', step: 900 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...props(), ...args },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div
          slClock
          aria-label="Departure time"
          [defaultValue]="halfPastTwo"
          [granularity]="granularity"
          [hourCycle]="hourCycle"
          [locale]="locale"
          [step]="step"
        ></div>
      </div>`,
  }),
};

export const Steps: Story = {
  parameters: scenario('steps'),
  render: () => ({
    props: props(),
    template: grid(
      3,
      scene(
        'A quarter of an hour',
        'Four minutes across.',
        `<div slClock aria-label="Quarter" [hourCycle]="24" [defaultValue]="halfPastTwo"></div>`,
      ) +
        scene(
          'Five minutes',
          'Six across, under the six hours of a row.',
          `<div slClock aria-label="Five" [hourCycle]="24" [defaultValue]="halfPastTwo" step="300"></div>`,
        ) +
        scene(
          'One minute',
          'Ten across, on the whole width.',
          `<div slClock aria-label="One" [hourCycle]="24" [defaultValue]="halfPastTwo" step="60"></div>`,
        ),
    ),
  }),
};

export const HourCycle: Story = {
  parameters: scenario('hour-cycle'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Twenty-four hours',
        'The parts of the day name the rows.',
        `<div slClock aria-label="Twenty-four" [hourCycle]="24" [defaultValue]="halfPastTwo"></div>`,
      ) +
        scene(
          'Twelve hours',
          'The halves name the rows, and an hour is named whole.',
          `<div slClock aria-label="Twelve" [hourCycle]="12" [defaultValue]="halfPastTwo"></div>`,
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
        'The hour alone',
        'One press is the whole value.',
        `<div slClock aria-label="Hour" [hourCycle]="24" [defaultValue]="halfPastTwo" granularity="hour"></div>`,
      ) +
        scene(
          'Seconds',
          'A third row, at the step of the clock.',
          `<div slClock aria-label="Cue" [hourCycle]="24" [defaultValue]="cue" granularity="second" step="5"></div>`,
        ),
    ),
  }),
};

export const Slots: Story = {
  parameters: scenario('slots'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Appointments',
        'Two are taken, and stay readable.',
        `<div slClock aria-label="Appointment" [hourCycle]="24" [defaultValue]="twentyPastNine" [isTimeUnavailable]="isTaken" [options]="appointments"></div>`,
      ) +
        scene(
          'Nothing on offer',
          'An empty list says so.',
          `<div slClock aria-label="Closed" [hourCycle]="24" [options]="[]"></div>`,
        ),
    ),
  }),
};

export const Bounds: Story = {
  parameters: scenario('bounds'),
  render: () => ({
    props: props(),
    template: grid(
      2,
      scene(
        'Opening hours',
        '08:00 to 18:00, and nothing at lunch.',
        `<div slClock aria-label="Visit" [hourCycle]="24" [defaultValue]="halfPastTwo" [isTimeUnavailable]="isLunch" [max]="closing" [min]="opening"></div>`,
      ) +
        scene(
          'From ten past',
          'The step counts from the minimum: :10 and :40.',
          `<div slClock aria-label="Shuttle" [hourCycle]="24" [defaultValue]="twentyToNine" [min]="tenPastEight" step="1800"></div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: props(),
    template: grid(
      3,
      scene(
        'The hour it is',
        'An outline on ten, and a fill on the chosen hour.',
        `<div slClock aria-label="Now" [hourCycle]="24" [defaultValue]="halfPastTwo" [now]="tenTwenty"></div>`,
      ) +
        scene(
          'Read only',
          'Readable, and answers no press.',
          `<div slClock aria-label="Read only" [hourCycle]="24" [defaultValue]="halfPastTwo" readOnly></div>`,
        ) +
        scene(
          'Disabled',
          'Out of the tab sequence.',
          `<div slClock aria-label="Disabled" [hourCycle]="24" [defaultValue]="halfPastTwo" disabled></div>`,
        ),
    ),
  }),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'The rows follow the control',
        'Switch the toolbar to dense.',
        `<div slClock aria-label="Departure time" [hourCycle]="24" [defaultValue]="halfPastTwo"></div>`,
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: props(),
    template: grid(
      1,
      scene(
        'An owned value',
        'The clock asks, and the story answers.',
        `<div slClock aria-label="Departure time" [hourCycle]="24" [value]="time()" (valueChange)="time.set($event.value)"></div>`,
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
        'Two tab stops',
        'Tab to the hours, the arrows inside, Tab to the minutes.',
        `<div slClock aria-label="Departure time" [hourCycle]="24" [defaultValue]="halfPastTwo"></div>`,
      ),
    ),
  }),
};
