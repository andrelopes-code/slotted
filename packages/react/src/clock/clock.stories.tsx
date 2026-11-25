import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SlottedProvider } from '../i18n';
import { Clock } from './clock';
import { Grid, Scene } from './clock-demo';
import { REACT_CLOCK_DOCS, REACT_CLOCK_TOKENS } from './clock.docs';

const HALF_PAST_TWO = plainTime(14, 30);
const APPOINTMENTS = [
  plainTime(8, 40),
  plainTime(9),
  plainTime(9, 20),
  plainTime(10, 10),
  plainTime(13, 45),
  plainTime(15, 20),
  plainTime(18, 30),
];

const isTaken = (time: PlainTime) => time.hour === 10 || time.hour === 15;
const isLunch = (time: PlainTime) => time.hour === 12;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CLOCK_DOCS.clock.scenes, {
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

const meta = {
  title: 'Components/Clock',
  component: Clock,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Clock',
        description:
          'Every hour of the day in one grid and the minutes of the step under it. Two presses write a time, and nothing scrolls at any step.',
        framework: 'React',
        ...REACT_CLOCK_DOCS.clock,
        tokens: REACT_CLOCK_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Clock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { granularity: 'minute', hourCycle: 24, locale: 'en-US', step: 900 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Clock {...args} aria-label="Departure time" defaultValue={HALF_PAST_TWO} />
    </div>
  ),
};

export const Steps: Story = {
  parameters: scenario('steps'),
  render: () => (
    <Grid columns={3}>
      <Scene label="A quarter of an hour" note="Four minutes across.">
        <Clock aria-label="Quarter" defaultValue={HALF_PAST_TWO} hourCycle={24} />
      </Scene>

      <Scene label="Five minutes" note="Six across, under the six hours of a row.">
        <Clock aria-label="Five" defaultValue={HALF_PAST_TWO} hourCycle={24} step={300} />
      </Scene>

      <Scene label="One minute" note="Ten across, on the whole width.">
        <Clock aria-label="One" defaultValue={HALF_PAST_TWO} hourCycle={24} step={60} />
      </Scene>
    </Grid>
  ),
};

export const HourCycle: Story = {
  parameters: scenario('hour-cycle'),
  render: () => (
    <Grid columns={3}>
      <Scene label="Twenty-four hours" note="The parts of the day name the rows.">
        <Clock aria-label="Twenty-four" defaultValue={HALF_PAST_TWO} hourCycle={24} />
      </Scene>

      <Scene label="Twelve hours" note="The halves name the rows, and an hour is named whole.">
        <Clock aria-label="Twelve" defaultValue={HALF_PAST_TWO} hourCycle={12} />
      </Scene>

      <Scene label="The language in force" note="The words and the cycle are the locale’s.">
        <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
          <Clock aria-label="Departure time" defaultValue={HALF_PAST_TWO} />
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => (
    <Grid columns={2}>
      <Scene label="The hour alone" note="One press is the whole value.">
        <Clock aria-label="Hour" defaultValue={plainTime(14)} granularity="hour" hourCycle={24} />
      </Scene>

      <Scene label="Seconds" note="A third row, at the step of the clock.">
        <Clock
          aria-label="Cue"
          defaultValue={plainTime(14, 30, 25)}
          granularity="second"
          hourCycle={24}
          step={5}
        />
      </Scene>
    </Grid>
  ),
};

export const Slots: Story = {
  parameters: scenario('slots'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Appointments" note="Two are taken, and stay readable.">
        <Clock
          aria-label="Appointment"
          defaultValue={plainTime(9, 20)}
          hourCycle={24}
          isTimeUnavailable={isTaken}
          options={APPOINTMENTS}
        />
      </Scene>

      <Scene label="Nothing on offer" note="An empty list says so.">
        <Clock aria-label="Closed" options={[]} />
      </Scene>
    </Grid>
  ),
};

export const Bounds: Story = {
  parameters: scenario('bounds'),
  render: () => (
    <Grid columns={2}>
      <Scene label="Opening hours" note="08:00 to 18:00, and nothing at lunch.">
        <Clock
          aria-label="Visit"
          defaultValue={HALF_PAST_TWO}
          hourCycle={24}
          isTimeUnavailable={isLunch}
          max={plainTime(18)}
          min={plainTime(8)}
        />
      </Scene>

      <Scene label="From ten past" note="The step counts from the minimum: :10 and :40.">
        <Clock
          aria-label="Shuttle"
          defaultValue={plainTime(8, 40)}
          hourCycle={24}
          min={plainTime(8, 10)}
          step={1800}
        />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={3}>
      <Scene label="The hour it is" note="An outline on ten, and a fill on the chosen hour.">
        <Clock
          aria-label="Now"
          defaultValue={HALF_PAST_TWO}
          hourCycle={24}
          now={plainTime(10, 20)}
        />
      </Scene>

      <Scene label="Read only" note="Readable, and answers no press.">
        <Clock aria-label="Read only" defaultValue={HALF_PAST_TWO} hourCycle={24} readOnly />
      </Scene>

      <Scene label="Disabled" note="Out of the tab sequence.">
        <Clock aria-label="Disabled" defaultValue={HALF_PAST_TWO} disabled hourCycle={24} />
      </Scene>
    </Grid>
  ),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => (
    <Grid columns={1}>
      <Scene label="The rows follow the control" note="Switch the toolbar to dense.">
        <Clock aria-label="Departure time" defaultValue={HALF_PAST_TWO} hourCycle={24} />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const [time, setTime] = useState<PlainTime | null>(HALF_PAST_TWO);

    return (
      <Grid columns={1}>
        <Scene label="An owned value" note="The clock asks, and the story answers.">
          <Clock
            aria-label="Departure time"
            hourCycle={24}
            onValueChange={(next) => setTime(next)}
            value={time}
          />
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene label="Two tab stops" note="Tab to the hours, the arrows inside, Tab to the minutes.">
        <Clock aria-label="Departure time" defaultValue={HALF_PAST_TWO} hourCycle={24} />
      </Scene>
    </Grid>
  ),
};
