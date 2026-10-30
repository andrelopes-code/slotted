import { plainTime } from '@slotted/core/date';
import type { PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type React from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { TimeRangePicker, TimeRangePickerPreset } from './time-range-picker';
import { TimeRangePickerDefaultsProvider } from './time-range-picker-defaults';
import { Grid, Measure, Scene } from './time-range-picker-demo';
import {
  REACT_TIME_RANGE_PICKER_DOCS,
  REACT_TIME_RANGE_PICKER_TOKENS,
} from './time-range-picker.docs';
import type {
  TimeRange,
  TimeRangePickerHandle,
  TimeRangePickerPosition,
} from './time-range-picker.types';

/* One meeting room, one working day: every scene is a booking of it. */
const START = plainTime(14);
const END = plainTime(16, 30);
const BOOKING: TimeRange = { start: START, end: END };
const MORNING: TimeRange = { start: plainTime(9), end: plainTime(12) };
const AFTERNOON: TimeRange = { start: plainTime(14), end: plainTime(18) };
const TEN_TWENTY = plainTime(10, 20);
const isCleaning = (time: PlainTime) => time.hour === 12;
const HOURS_BEFORE_NOON = [8, 9, 10, 11].map((hour) => plainTime(hour));
const AFTER_NOON = [13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5].map((hour) =>
  plainTime(Math.floor(hour), hour % 1 === 0 ? 0 : 30),
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TIME_RANGE_PICKER_DOCS.timeRangePicker.scenes, {
    playground: Playground,
    panel: Panel,
    length: Length,
    limits: Limits,
    unavailable: Unavailable,
    step: Step,
    now: Now,
    presets: Presets,
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
  title: 'Components/TimeRangePicker',
  component: TimeRangePicker,
  decorators: [
    (Story) => (
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <Story />
      </SlottedProvider>
    ),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Range Picker',
        description:
          'A one-line frame with the range in words, and behind it one end at a time: two tabs, the field of the current end, a hint, and its list. The end list strikes what the chosen start refuses the moment the tab moves to it, and every row says how long the run would be.',
        framework: 'React',
        ...REACT_TIME_RANGE_PICKER_DOCS.timeRangePicker,
        tokens: REACT_TIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TimeRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    contiguous: true,
    hourCycle: 24,
    locale: 'pt-BR',
    placement: 'bottom-start',
    size: 'md',
    step: 900,
    unavailableOptions: 'disable',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Reserva da sala</FieldLabel>
        <TimeRangePicker
          {...args}
          defaultValue={BOOKING}
          endName="end"
          referenceTime={TEN_TWENTY}
          startName="start"
        />
        <FieldDescription>Open and choose the start and the end in the two lists.</FieldDescription>
      </Field>
    </div>
  ),
};

/** An open surface needs room under it, and the stage is what gives it. */
const Screen = ({ children }: { children: React.ReactNode }) => (
  <div className="slotted-demo-viewport" data-size="screen">
    {children}
  </div>
);

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The end tab, already open"
        note="Two tabs say the two ends; the panel shows the one being chosen. The start is 14:00, so the end tab is current, the hint says what to choose, and the list strikes 13:00 to 13:45 and writes “15 min”, “30 min”, “1 hr” beside every time it does allow. Press one: the meeting is whole and the surface closes."
      >
        <Screen>
          <TimeRangePicker
            defaultOpen
            defaultValue={{ start: START, end: null }}
            hourCycle={24}
            locale="pt-BR"
            referenceTime={TEN_TWENTY}
          />
        </Screen>
      </Scene>
    </Grid>
  ),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Said as it is drawn"
        note="Open it and move along the end list with the pointer or the arrows: the band says the duration for the row under you, and every row says it beside its time."
      >
        <TimeRangePicker
          defaultValue={{ start: START, end: null }}
          hourCycle={24}
          locale="pt-BR"
          referenceTime={TEN_TWENTY}
        />
      </Scene>
      <Scene
        label="In the product’s own words"
        note="lengthLabel replaces the default: here the booking is counted in minutes, the unit a meeting room is billed in."
      >
        <TimeRangePicker
          defaultValue={BOOKING}
          hourCycle={24}
          lengthLabel={(seconds) => `${String(Math.round(seconds / 60))} min`}
          locale="pt-BR"
          referenceTime={TEN_TWENTY}
        />
      </Scene>
    </Grid>
  ),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Thirty minutes to four hours"
        note="With 14:00 as the start, the end list strikes 14:15 and everything past 18:00, and the band says why. Type 19:00 into the end field instead: the frame goes invalid."
      >
        <Field>
          <FieldLabel>Reserva da sala</FieldLabel>
          <TimeRangePicker
            defaultValue={{ start: START, end: null }}
            hourCycle={24}
            locale="pt-BR"
            maxLength={4 * 3600}
            minLength={30 * 60}
            referenceTime={TEN_TWENTY}
          />
          <FieldError>Uma reserva tem de 30 minutos a 4 horas.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A booking cannot cross the cleaning hour"
        note="The room is cleaned from 12:00 to 13:00. With 10:00 as the start, the end list strikes 12:00 and everything past it, because a booking is contiguous."
      >
        <TimeRangePicker
          defaultValue={{ start: plainTime(10), end: null }}
          hourCycle={24}
          isTimeUnavailable={isCleaning}
          locale="pt-BR"
          referenceTime={TEN_TWENTY}
        />
      </Scene>
      <Scene
        label="A rule about the ends only"
        note="contiguous={false}: the cleaning slots are refused as ends and the run may jump over them — the shape a shift has when the blocked hour is a break rather than a booking."
      >
        <TimeRangePicker
          contiguous={false}
          defaultValue={{ start: plainTime(10), end: null }}
          hourCycle={24}
          isTimeUnavailable={isCleaning}
          locale="pt-BR"
          referenceTime={TEN_TWENTY}
        />
      </Scene>
    </Grid>
  ),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Half-hour slots, between eight and twenty"
        note="min, max and step shape the list of either end. Type 14:07 into the field: the field still takes any minute, and the value is not invalid for falling between two rows."
      >
        <TimeRangePicker
          defaultValue={BOOKING}
          hourCycle={24}
          locale="pt-BR"
          max={plainTime(20)}
          min={plainTime(8)}
          referenceTime={TEN_TWENTY}
          step={1800}
        />
      </Scene>
      <Scene
        label="A stated list"
        note="options hands the list the times the room actually opens: on the hour before noon, every half hour after. No step describes that, and none has to."
      >
        <TimeRangePicker
          defaultValue={{ start: plainTime(9), end: null }}
          hourCycle={24}
          locale="pt-BR"
          options={[...HOURS_BEFORE_NOON, ...AFTER_NOON]}
          referenceTime={TEN_TWENTY}
        />
      </Scene>
    </Grid>
  ),
};

export const Now: Story = {
  parameters: scenario('now'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One now per end"
        note="It is 10:20. Press “Agora”: the start is written, the tab moves to the end, and focus carries to its list, whose rows now say how long a meeting from 10:20 would be. referenceTime fixes the clock for this page."
      >
        <TimeRangePicker hourCycle={24} locale="pt-BR" referenceTime={TEN_TWENTY} />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: function PresetsStory() {
    const [value, setValue] = useState<TimeRange | null>(AFTERNOON);

    return (
      <Grid columns={1}>
        <Scene
          label="The slots the office books by name"
          note="The afternoon is marked because it is the value. Press “Next hour”: the run is computed at the press, written with the select reason, and the surface closes. The footer holds the product’s own actions."
        >
          <TimeRangePicker
            footer={
              <Button onClick={() => setValue(null)} size="sm" variant="ghost">
                Limpar
              </Button>
            }
            hourCycle={24}
            locale="pt-BR"
            onValueChange={setValue}
            presets={
              <>
                <TimeRangePickerPreset value={MORNING}>Morning</TimeRangePickerPreset>
                <TimeRangePickerPreset value={AFTERNOON}>Afternoon</TimeRangePickerPreset>
                <TimeRangePickerPreset value={() => ({ start: plainTime(11), end: plainTime(12) })}>
                  Next hour
                </TimeRangePickerPreset>
              </>
            }
            referenceTime={TEN_TWENTY}
            value={value}
          />
        </Scene>
      </Grid>
    );
  },
};

export const OpenEnd: Story = {
  parameters: scenario('open-end'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A start and no end"
        note="A value with one end, written where the reader sees it: “14:00 –”. Open the surface: it opens on the end tab, the one to finish, and its first press completes the work. The clear empties both ends at once."
      >
        <TimeRangePicker
          clearable
          defaultValue={{ start: START, end: null }}
          hourCycle={24}
          locale="pt-BR"
          referenceTime={TEN_TWENTY}
        />
      </Scene>
      <Scene
        label="Both ends required"
        note="required reaches both fields as aria-required and the necessity mark, so a form cannot be posted from a start alone."
      >
        <Field required>
          <FieldLabel>Reserva da sala</FieldLabel>
          <TimeRangePicker hourCycle={24} locale="pt-BR" referenceTime={TEN_TWENTY} />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The three steps"
        note="Type, height, gutter and the clear’s box follow the control scales, so a booking in a dense schedule table shrinks whole rather than in parts."
      >
        <TimeRangePicker clearable defaultValue={BOOKING} hourCycle={24} locale="pt-BR" size="sm" />
        <TimeRangePicker clearable defaultValue={BOOKING} hourCycle={24} locale="pt-BR" size="md" />
        <TimeRangePicker clearable defaultValue={BOOKING} hourCycle={24} locale="pt-BR" size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The three frames"
        note="Hover each: the frame answers as one control. Tab to one: the ring is the frame’s, and in plain it is drawn inward, because a plain control’s box belongs to the cell around it."
      >
        <TimeRangePicker defaultValue={BOOKING} hourCycle={24} locale="pt-BR" variant="outline" />
        <TimeRangePicker defaultValue={BOOKING} hourCycle={24} locale="pt-BR" variant="subtle" />
        <TimeRangePicker defaultValue={BOOKING} hourCycle={24} locale="pt-BR" variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Read-only"
        note="The booking is legible and copyable, and the trigger is out of the tab sequence: a surface onto a list nothing answers is worse than no surface."
      >
        <TimeRangePicker defaultValue={BOOKING} hourCycle={24} locale="pt-BR" readOnly />
      </Scene>
      <Scene
        label="Disabled"
        note="Nothing answers and the times stay readable — a disabled booking still has to say when it is."
      >
        <TimeRangePicker clearable defaultValue={BOOKING} disabled hourCycle={24} locale="pt-BR" />
      </Scene>
      <Scene
        label="An end before its start"
        note="22:00 to 06:00 is a shift that crosses midnight, and a time has no day: invalid on the end field and on the frame, nothing swapped. The family that writes it is datetime-range-picker."
      >
        <Field>
          <FieldLabel>Turno</FieldLabel>
          <TimeRangePicker
            defaultValue={{ start: plainTime(22), end: plainTime(6) }}
            hourCycle={24}
            locale="pt-BR"
          />
          <FieldError>The end must come after the start.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="The consumer’s own word"
        note="invalid from the field around it, with a value the family finds nothing wrong with: the server said the room is taken."
      >
        <Field invalid>
          <FieldLabel>Room booking</FieldLabel>
          <TimeRangePicker defaultValue={BOOKING} hourCycle={24} locale="pt-BR" />
          <FieldError>The room is already booked at that time.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: function FormsStory() {
    const [posted, setPosted] = useState<string | null>(null);

    return (
      <Grid columns={1}>
        <Scene
          label="A plain form post"
          note="Choose a booking and submit: two hidden inputs send 14:00:00 and 16:30:00 under start and end, whether the reader typed the times or pressed them."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setPosted(`${String(data.get('start') ?? '')} → ${String(data.get('end') ?? '')}`);
            }}
          >
            <Field>
              <FieldLabel>Reserva da sala</FieldLabel>
              <TimeRangePicker
                defaultValue={BOOKING}
                endName="fim"
                hourCycle={24}
                locale="pt-BR"
                required
                startName="start"
              />
              <FieldDescription>
                {posted === null ? 'Not sent yet.' : `Sent: ${posted}`}
              </FieldDescription>
            </Field>
            <Button type="submit">Reservar</Button>
          </form>
        </Scene>
      </Grid>
    );
  },
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="In a narrow column"
        note="The frame stays one line at the control height; a value wider than the column is cut with an ellipsis and the trigger’s name carries it whole. Open it: the surface keeps its own width."
      >
        <Measure>
          <TimeRangePicker clearable defaultValue={BOOKING} hourCycle={24} locale="pt-BR" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const handle = useRef<TimeRangePickerHandle | null>(null);
    const [position, setPosition] = useState<TimeRangePickerPosition>('start');

    return (
      <Grid columns={1}>
        <Scene
          label="Set once for the application"
          note="SlottedProvider decides that every booking is in Portuguese, one defaults provider that it runs in half-hour slots on a 24-hour clock, and messages lays the office’s own words over the catalog — so a product does not repeat six props on each form."
        >
          <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
            <TimeRangePickerDefaultsProvider hourCycle={24} step={1800}>
              <TimeRangePicker
                defaultValue={BOOKING}
                messages={{
                  change: 'Change booking, {start} – {end}, {length}',
                  choose: 'Choose a time',
                  done: 'Done',
                }}
                referenceTime={TEN_TWENTY}
              />
            </TimeRangePickerDefaultsProvider>
          </SlottedProvider>
        </Scene>
        <Scene
          label="What a row draws"
          note="renderOption replaces the row’s content and keeps the row: here each time is followed by the room it books, and the duration the family computed."
        >
          <TimeRangePicker
            defaultValue={BOOKING}
            hourCycle={24}
            locale="pt-BR"
            referenceTime={TEN_TWENTY}
            renderOption={({ duration, label }) => (
              <>
                {label}
                {duration === null ? null : (
                  <span data-part="option-duration" data-part-option-duration="">
                    {duration}
                  </span>
                )}
              </>
            )}
          />
        </Scene>
        <Scene
          collapseFloor={40}
          label="The handle, and the end being edited"
          note="focus(), open() and close() are the actions no prop can express. The consumer owns position — which tab — here: press “Edit end” and the surface opens onto the end tab."
          layout="stack"
        >
          <TimeRangePicker
            defaultValue={BOOKING}
            hourCycle={24}
            locale="pt-BR"
            onPositionChange={setPosition}
            position={position}
            ref={handle}
            referenceTime={TEN_TWENTY}
          />
          <Button onClick={() => setPosition('end')} variant="outline">
            Edit end
          </Button>
          <Button onClick={() => handle.current?.open()} variant="outline">
            open()
          </Button>
          <Button onClick={() => handle.current?.close()} variant="outline">
            close()
          </Button>
          <Button onClick={() => handle.current?.focus()} variant="outline">
            focus()
          </Button>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two tabs, one list, and the band between them"
        note="Tab to the trigger and press ArrowDown: focus lands in the start list on 14:00. Arrow down twice, press Enter: the tab moves to the end and focus carries to its list. Arrow along it — the band says the duration as you go — and press Enter again. Open it once more, Tab to a tab and press ArrowLeft: the other end. Escape abandons the work."
      >
        <TimeRangePicker
          defaultValue={BOOKING}
          hourCycle={24}
          locale="pt-BR"
          referenceTime={TEN_TWENTY}
        />
      </Scene>
    </Grid>
  ),
};
