import { addDays, dayOfWeek, plainDate, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import type React from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateTimeRangePicker, DateTimeRangePickerPreset } from './datetime-range-picker';
import { DateTimeRangePickerDefaultsProvider } from './datetime-range-picker-defaults';
import { Grid, Measure, Scene } from './datetime-range-picker-demo';
import {
  REACT_DATETIME_RANGE_PICKER_DOCS,
  REACT_DATETIME_RANGE_PICKER_TOKENS,
} from './datetime-range-picker.docs';
import type {
  DateTimeRange,
  DateTimeRangePickerHandle,
  DateTimeRangePickerPosition,
} from './datetime-range-picker.types';

/* One rental agency, one September: every scene is a car picked up and returned. */
const at = (date: PlainDate, time: PlainTime): PlainDateTime => ({ date, time });
const PICKUP = at(plainDate(2026, 9, 12), plainTime(14));
const DROPOFF = at(plainDate(2026, 9, 16), plainTime(11));
const RENTAL: DateTimeRange = { start: PICKUP, end: DROPOFF };
const WEEKEND: DateTimeRange = {
  start: at(plainDate(2026, 9, 18), plainTime(17)),
  end: at(plainDate(2026, 9, 20), plainTime(19)),
};
const NOW = at(plainDate(2026, 9, 14), plainTime(10, 20));
const week = (from: PlainDateTime): DateTimeRange => ({
  start: from,
  end: at(addDays(from.date, 7), from.time),
});
const isSunday = (date: PlainDate) => dayOfWeek(date) === 0;
const closesAtNoonOnSaturday = (time: PlainTime, date: PlainDate) =>
  dayOfWeek(date) === 6 && time.hour >= 12;

/* The agency names the two ends after what happens to the car. */
const common = {
  hourCycle: 24 as const,
  locale: 'pt-BR',
  messages: { start: 'Pickup', end: 'Return' },
  referenceDateTime: NOW,
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker.scenes, {
    playground: Playground,
    panel: Panel,
    completeness: Completeness,
    length: Length,
    limits: Limits,
    'day-window': DayWindow,
    unavailable: Unavailable,
    months: Months,
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
  title: 'Components/DateTimeRangePicker',
  component: DateTimeRangePicker,
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
        title: 'Date Time Range Picker',
        description:
          'A one-line frame with the range in words, and behind it one end at a time: two tabs, the field of the current end, a hint, the calendar in range mode and the list of that end, running on its day. The band says how long the run would be while it is drawn.',
        framework: 'React',
        ...REACT_DATETIME_RANGE_PICKER_DOCS.dateTimeRangePicker,
        tokens: REACT_DATETIME_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateTimeRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    contiguous: true,
    hourCycle: 24,
    locale: 'pt-BR',
    months: 1,
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
        <FieldLabel>Pickup and return</FieldLabel>
        <DateTimeRangePicker
          {...common}
          {...args}
          defaultValue={RENTAL}
          endName="devolucao"
          startName="retirada"
        />
        <FieldDescription>Abra e escolha os dias na grelha e as horas nas listas.</FieldDescription>
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
        label="The pickup tab, already open"
        note="Two tabs say the two ends; the panel shows the one being chosen. The grid draws the 12th to the 16th, and the list runs on the 12th, the pickup’s day. Press the return tab: the same grid, and the list of the 16th. Press a day: the run restarts on it, and the end’s time is kept."
      >
        <Screen>
          <DateTimeRangePicker {...common} defaultOpen defaultValue={RENTAL} />
        </Screen>
      </Scene>
    </Grid>
  ),
};

export const Completeness: Story = {
  parameters: scenario('completeness'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Four presses"
        note="Nothing chosen; the hint says what to choose. Press a day: focus moves to the list, for the pickup time. Press a time: the tab moves to the return and focus goes to the grid. Press a day, then a time: the work is whole and the surface closes. A rental never reaches the form half-drawn."
      >
        <Screen>
          <DateTimeRangePicker {...common} defaultOpen />
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
        note="A pickup on the 12th at 14:00 and no return. Move along the grid: the band says the days and hours for the day under you, at 14:00 on that day until a time is chosen."
      >
        <DateTimeRangePicker {...common} defaultValue={{ start: PICKUP, end: null }} />
      </Scene>
      <Scene
        label="On the same day, row by row"
        note="A rental returned the day it started: the end list writes the duration beside each row. Across days the rows stay quiet and the band alone says it — a column of “3 days 21 hr 15 min” says nothing the band does not."
      >
        <DateTimeRangePicker
          {...common}
          defaultValue={{ start: PICKUP, end: at(PICKUP.date, plainTime(18)) }}
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
        label="An hour to thirty days"
        note="With the 12th at 14:00 chosen, the grid refuses the days past the 12th of October and the end list refuses the first hour; the band says why. Type a return an hour on instead: the frame is valid at exactly the limit."
      >
        <Field>
          <FieldLabel>Pickup and return</FieldLabel>
          <DateTimeRangePicker
            {...common}
            defaultValue={{ start: PICKUP, end: null }}
            maxLength={30 * 86_400}
            minLength={3600}
          />
          <FieldError>Um aluguel dura de 1 hora a 30 dias.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const DayWindow: Story = {
  parameters: scenario('day-window'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Opening hours inside a season"
        note="The agency opens from 08:00 to 18:00; the fleet is booked from the 10th at 09:00 to the 20th of December at 18:00. Press the 10th: the list starts at 09:00. Press the 11th: it starts at 08:00. Both pairs of bounds apply, the platform’s own rule."
      >
        <DateTimeRangePicker
          {...common}
          defaultValue={{ start: at(plainDate(2026, 9, 10), plainTime(9)), end: null }}
          max={at(plainDate(2026, 12, 20), plainTime(18))}
          maxTime={plainTime(18)}
          min={at(plainDate(2026, 9, 10), plainTime(9))}
          minTime={plainTime(8)}
        />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Closed on Sunday, half a day on Saturday"
        note="The Sundays are greyed, and the end list on a Saturday stops at noon. With the 12th chosen, the grid refuses the 14th and everything past it: a rental cannot cross a closed day while it is contiguous."
      >
        <DateTimeRangePicker
          {...common}
          defaultValue={{ start: PICKUP, end: null }}
          isDateUnavailable={isSunday}
          isTimeUnavailable={closesAtNoonOnSaturday}
        />
      </Scene>
      <Scene
        label="A rule about the ends only"
        note="contiguous={false}: the Sundays are refused as ends and the run may jump over them — a rental returned on Monday is fine even though the agency was closed on Sunday."
      >
        <DateTimeRangePicker
          {...common}
          contiguous={false}
          defaultValue={{ start: PICKUP, end: null }}
          isDateUnavailable={isSunday}
          isTimeUnavailable={closesAtNoonOnSaturday}
        />
      </Scene>
    </Grid>
  ),
};

export const Months: Story = {
  parameters: scenario('months'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two months"
        note="Two months beside the list need about forty rems. Where the surface has them the three stand in a row; where it does not, the list drops under the grid and the second month wraps under the first."
      >
        <DateTimeRangePicker {...common} defaultValue={RENTAL} months={2} />
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
        note="It is the 14th at 10:20. Press “Agora”: the pickup is written whole, both halves, the tab moves to the return and focus carries to the grid for its day. referenceDateTime fixes the clock for this page."
      >
        <DateTimeRangePicker {...common} />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: function PresetsStory() {
    const [value, setValue] = useState<DateTimeRange | null>(WEEKEND);

    return (
      <Grid columns={1}>
        <Scene
          label="The rentals the agency offers by name"
          note="The weekend is marked because it is the value. Press “One week”: the run is computed at the press, written with the select reason, and the surface closes. The footer holds the product’s own actions."
        >
          <DateTimeRangePicker
            {...common}
            footer={
              <Button onClick={() => setValue(null)} size="sm" variant="ghost">
                Limpar
              </Button>
            }
            onValueChange={setValue}
            presets={
              <>
                <DateTimeRangePickerPreset value={WEEKEND}>Weekend</DateTimeRangePickerPreset>
                <DateTimeRangePickerPreset value={() => week(PICKUP)}>
                  One week
                </DateTimeRangePickerPreset>
                <DateTimeRangePickerPreset
                  value={() => week(at(plainDate(2026, 10, 3), plainTime(9)))}
                >
                  Feriado de outubro
                </DateTimeRangePickerPreset>
              </>
            }
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
        label="A pickup and no return"
        note="A value with one end, written where the reader sees it: “12 de set., 14:00 –”. Open the surface: it opens on the return tab, the grid holds an open run, and the list runs on whichever day the grid has focused. The clear empties both ends at once."
      >
        <DateTimeRangePicker {...common} clearable defaultValue={{ start: PICKUP, end: null }} />
      </Scene>
      <Scene
        label="Both ends required"
        note="required reaches both fields as aria-required and the necessity mark, so a form cannot be posted from a pickup alone."
      >
        <Field required>
          <FieldLabel>Pickup and return</FieldLabel>
          <DateTimeRangePicker {...common} />
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
        note="Type, height, gutter and the clear’s box follow the control scales, so a rental in a dense fleet table shrinks whole rather than in parts."
      >
        <DateTimeRangePicker {...common} clearable defaultValue={RENTAL} size="sm" />
        <DateTimeRangePicker {...common} clearable defaultValue={RENTAL} size="md" />
        <DateTimeRangePicker {...common} clearable defaultValue={RENTAL} size="lg" />
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
        <DateTimeRangePicker {...common} defaultValue={RENTAL} variant="outline" />
        <DateTimeRangePicker {...common} defaultValue={RENTAL} variant="subtle" />
        <DateTimeRangePicker {...common} defaultValue={RENTAL} variant="plain" />
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
        note="The rental is legible and copyable, and the trigger is out of the tab sequence: a surface onto a grid nothing answers is worse than no surface."
      >
        <DateTimeRangePicker {...common} defaultValue={RENTAL} readOnly />
      </Scene>
      <Scene
        label="Disabled"
        note="Nothing answers and the value stays readable — a disabled rental still has to say when it is."
      >
        <DateTimeRangePicker {...common} clearable defaultValue={RENTAL} disabled />
      </Scene>
      <Scene
        label="A return before its pickup"
        note="Invalid on the end field and on the frame, and nothing is swapped: a value the reader typed is not the family’s to rewrite. Tab in: the ring is retargeted to the danger colour."
      >
        <Field>
          <FieldLabel>Pickup and return</FieldLabel>
          <DateTimeRangePicker {...common} defaultValue={{ start: DROPOFF, end: PICKUP }} />
          <FieldError>The return must come after the pickup.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="The consumer’s own word"
        note="invalid from the field around it, with a value the family finds nothing wrong with: the server said the car is gone."
      >
        <Field invalid>
          <FieldLabel>Pickup and return</FieldLabel>
          <DateTimeRangePicker {...common} defaultValue={RENTAL} />
          <FieldError>This car is already rented for that period.</FieldError>
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
          note="Choose a rental and submit: two hidden inputs send 2026-09-12T14:00:00 and 2026-09-16T11:00:00 under retirada and devolucao, whether the reader typed them or pressed them."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setPosted(
                `${String(data.get('retirada') ?? '')} → ${String(data.get('devolucao') ?? '')}`,
              );
            }}
          >
            <Field>
              <FieldLabel>Pickup and return</FieldLabel>
              <DateTimeRangePicker
                {...common}
                defaultValue={RENTAL}
                endName="devolucao"
                required
                startName="retirada"
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
        note="The frame stays one line at the control height; the value is cut with an ellipsis and the trigger’s name carries it whole. Open it: the list drops under the grid."
      >
        <Measure>
          <DateTimeRangePicker {...common} clearable defaultValue={RENTAL} />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const handle = useRef<DateTimeRangePickerHandle | null>(null);
    const [position, setPosition] = useState<DateTimeRangePickerPosition>('start');

    return (
      <Grid columns={1}>
        <Scene
          label="Set once for the application"
          note="SlottedProvider decides that every rental is in Portuguese, one defaults provider that it runs two months at a time in half-hour slots, and messages lays the agency’s own words over the catalog — so a product does not repeat eight props on each form."
        >
          <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
            <DateTimeRangePickerDefaultsProvider hourCycle={24} months={2} step={1800}>
              <DateTimeRangePicker
                defaultValue={RENTAL}
                messages={{
                  change: 'Change rental, {start} – {end}, {length}',
                  done: 'Done',
                  end: 'Return',
                  start: 'Pickup',
                }}
                referenceDateTime={NOW}
              />
            </DateTimeRangePickerDefaultsProvider>
          </SlottedProvider>
        </Scene>
        <Scene
          label="What a row draws"
          note="renderOption replaces the row’s content and keeps the row: here each time is followed by the duration the family computed, on the day the list serves."
        >
          <DateTimeRangePicker
            {...common}
            defaultValue={{ start: PICKUP, end: at(PICKUP.date, plainTime(18)) }}
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
          note="focus(), open() and close() are the actions no prop can express. The consumer owns position — which tab — here: press “Edit return” and the surface opens onto the return tab, so the next press in the grid writes the return day instead of restarting the run."
          layout="stack"
        >
          <DateTimeRangePicker
            {...common}
            defaultValue={RENTAL}
            onPositionChange={setPosition}
            position={position}
            ref={handle}
          />
          <Button onClick={() => setPosition('end')} variant="outline">
            Edit return
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
        label="The grid, the list, and the band between them"
        note="Tab to the trigger and press ArrowDown: focus lands on the 12th. Arrow right twice and press Enter: the run restarts on the 14th and focus is in the list. Press Enter on a time: the tab moves to the return. Enter on a return day, then Enter on a return time. Escape at any point abandons the work."
      >
        <DateTimeRangePicker {...common} defaultValue={RENTAL} />
      </Scene>
    </Grid>
  ),
};
