import { addDays, plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateRangePicker, DateRangePickerPreset } from './date-range-picker';
import { DateRangePickerDefaultsProvider } from './date-range-picker-defaults';
import { Grid, Measure, Scene } from './date-range-picker-demo';
import {
  REACT_DATE_RANGE_PICKER_DOCS,
  REACT_DATE_RANGE_PICKER_TOKENS,
} from './date-range-picker.docs';
import type {
  DateRange,
  DateRangePickerHandle,
  DateRangePickerPosition,
} from './date-range-picker.types';

/* One hotel, one September: every scene is a stay in it. */
const CHECKIN = plainDate(2026, 9, 12);
const CHECKOUT = plainDate(2026, 9, 16);
const STAY: DateRange = { start: CHECKIN, end: CHECKOUT };

/** The Portuguese catalog with a hotel's own words laid over the range picker's. */
const HOTEL = {
  ...PT_BR,
  dateRangePicker: {
    ...PT_BR.dateRangePicker,
    change: 'Alterar estadia, {start} – {end}, {length}',
    choose: 'Escolher estadia',
    end: 'Check-out',
    start: 'Check-in',
  },
};
const WEEKEND: DateRange = { start: plainDate(2026, 9, 18), end: plainDate(2026, 9, 20) };
const week = (from: PlainDate): DateRange => ({ start: from, end: addDays(from, 7) });
const isTaken = (date: PlainDate) => date.month === 9 && date.day >= 15 && date.day <= 18;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATE_RANGE_PICKER_DOCS.dateRangePicker.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    length: Length,
    limits: Limits,
    unavailable: Unavailable,
    presets: Presets,
    'open-end': OpenEnd,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Range Picker',
        description:
          'Two date fields in one frame, a trigger, and the calendar in range mode behind them. The band over the grid says how long the run is while it is still being drawn, which is the question the reader is actually asking.',
        framework: 'React',
        ...REACT_DATE_RANGE_PICKER_DOCS.dateRangePicker,
        tokens: REACT_DATE_RANGE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    contiguous: true,
    count: 'nights',
    locale: 'pt-BR',
    months: 2,
    placement: 'bottom-start',
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Estadia</FieldLabel>
        <DateRangePicker
          {...args}
          defaultValue={STAY}
          endName="checkout"
          messages={{ end: 'Check-out', start: 'Check-in' }}
          startName="checkin"
        />
        <FieldDescription>Type the dates or choose both in the calendar.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The three steps"
        note="Type, height, gutter and the two buttons’ boxes all follow the control scales, so a stay in a dense reservations table shrinks whole rather than in parts."
      >
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" size="sm" />
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" size="md" />
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" size="lg" />
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
        note="Hover each: the frame answers as one control, not as two fields side by side. Tab into one: the ring is the frame’s, and the band on a segment says which of the six fields a key will move."
      >
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" variant="outline" />
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" variant="subtle" />
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const Length: Story = {
  parameters: scenario('length'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Nights"
        note="Open it and press the 12th: the band says the nights the stay would cost for whichever day the pointer or the arrows are on, before the second press. 12 to 16 is 4 nights."
      >
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" months={1} />
      </Scene>
      <Scene
        label="Days"
        note="The same two dates, counted the way a leave request counts them: both ends, so 12 to 16 is 5 days, and the same day at both ends is 1 day rather than 0 nights."
      >
        <DateRangePicker count="days" defaultValue={STAY} locale="pt-BR" months={1} />
      </Scene>
    </Grid>
  ),
};

export const Limits: Story = {
  parameters: scenario('limits'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two to seven nights"
        note="Choose a check-in in the grid: the next night and every night past the seventh are struck through, and the band under the dates says why. Type a check-out ten nights on and the frame goes invalid instead."
      >
        <Field>
          <FieldLabel>Estadia</FieldLabel>
          <DateRangePicker
            count="nights"
            defaultValue={{ start: CHECKIN, end: null }}
            locale="pt-BR"
            maxLength={7}
            minLength={2}
            months={1}
          />
          <FieldError>Uma estadia tem de 2 a 7 noites.</FieldError>
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
        label="A stay cannot cross a taken night"
        note="The room is taken from the 15th to the 18th. Press the 12th: the 15th and everything past it is refused, because a stay is contiguous; press the 19th instead and the run may only go forward."
      >
        <DateRangePicker
          count="nights"
          defaultValue={{ start: CHECKIN, end: null }}
          isDateUnavailable={isTaken}
          locale="pt-BR"
          months={1}
        />
      </Scene>
      <Scene
        label="A rule about the ends only"
        note="contiguous={false}: the same four days are refused as ends and the run may jump over them — the shape a report period has when the blocked days are holidays rather than bookings."
      >
        <DateRangePicker
          contiguous={false}
          count="days"
          defaultValue={{ start: CHECKIN, end: null }}
          isDateUnavailable={isTaken}
          locale="pt-BR"
          months={1}
        />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: function PresetsStory() {
    const [value, setValue] = useState<DateRange | null>(WEEKEND);

    return (
      <Grid columns={1}>
        <Scene
          label="The stays the hotel offers by name"
          note="The weekend is marked because it is the value. Press “One week”: the run is computed at the press, written with the select reason, and the surface closes. The footer holds the product’s own actions."
        >
          <DateRangePicker
            count="nights"
            footer={
              <Button onClick={() => setValue(null)} size="sm" variant="ghost">
                Limpar
              </Button>
            }
            locale="pt-BR"
            months={1}
            onValueChange={setValue}
            presets={
              <>
                <DateRangePickerPreset value={WEEKEND}>Weekend</DateRangePickerPreset>
                <DateRangePickerPreset value={() => week(CHECKIN)}>One week</DateRangePickerPreset>
                <DateRangePickerPreset value={() => week(plainDate(2026, 10, 3))}>
                  Feriado de outubro
                </DateRangePickerPreset>
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
        label="A check-in and no check-out"
        note="A value with one end, written where the reader sees it. Open the surface: the 12th is the start of an open run, and the first press closes it. The clear empties both ends at once."
      >
        <DateRangePicker
          clearable
          count="nights"
          defaultValue={{ start: CHECKIN, end: null }}
          locale="pt-BR"
          months={1}
        />
      </Scene>
      <Scene
        label="Both ends required"
        note="required reaches both fields as aria-required and the necessity mark, so a form cannot be posted from a date on."
      >
        <Field required>
          <FieldLabel>Estadia</FieldLabel>
          <DateRangePicker count="nights" locale="pt-BR" months={1} />
        </Field>
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
        note="The stay is legible and copyable, and both buttons are out of the tab sequence: a surface onto a grid nothing answers is worse than no surface."
      >
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" readOnly />
      </Scene>
      <Scene
        label="Disabled"
        note="Nothing answers and the dates stay readable — a disabled reservation still has to say when it is."
      >
        <DateRangePicker clearable count="nights" defaultValue={STAY} disabled locale="pt-BR" />
      </Scene>
      <Scene
        label="A check-out before its check-in"
        note="Invalid on the end field and on the frame, and nothing is swapped: a value the reader typed is not the family’s to rewrite. Tab in: the ring is retargeted to the danger color."
      >
        <Field>
          <FieldLabel>Estadia</FieldLabel>
          <DateRangePicker
            count="nights"
            defaultValue={{ start: CHECKOUT, end: CHECKIN }}
            locale="pt-BR"
          />
          <FieldError>O check-out tem de vir depois do check-in.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="The consumer’s own word"
        note="invalid from the field around it, with a value the family finds nothing wrong with: the server said the room is gone."
      >
        <Field invalid>
          <FieldLabel>Stay</FieldLabel>
          <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" />
          <FieldError>This room has already been booked for those dates.</FieldError>
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
          note="Choose a stay and submit: two hidden inputs send 2026-09-12 and 2026-09-16 under checkin and checkout, whether the reader typed them or pressed them."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setPosted(
                `${String(data.get('checkin') ?? '')} → ${String(data.get('checkout') ?? '')}`,
              );
            }}
          >
            <Field>
              <FieldLabel>Estadia</FieldLabel>
              <DateRangePicker
                count="nights"
                defaultValue={STAY}
                endName="checkout"
                locale="pt-BR"
                required
                startName="checkin"
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
        note="Two dates do not fit a frame this narrow, so each date clips its own digits at its edge and the trigger stays where it is; step into the check-out and it scrolls into view. Open it: the second month wraps under the first, because the surface is capped by the room the positioner measured."
      >
        <Measure>
          <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const handle = useRef<DateRangePickerHandle | null>(null);
    const [position, setPosition] = useState<DateRangePickerPosition>('start');

    return (
      <Grid columns={1}>
        <Scene
          label="Set once for the application"
          note="One provider decides that every stay counts nights, one month at a time; SlottedProvider decides Portuguese, with the hotel’s own words laid over the catalog — so a product does not repeat them on each form."
        >
          <SlottedProvider catalogs={{ 'pt-BR': HOTEL }} locale="pt-BR">
            <DateRangePickerDefaultsProvider count="nights" months={1}>
              <DateRangePicker defaultValue={STAY} />
            </DateRangePickerDefaultsProvider>
          </SlottedProvider>
        </Scene>
        <Scene
          label="The handle, and the end being edited"
          note="focus('end'), open() and close() are the actions no prop can express. The consumer owns position here: press “Edit check-out” and the next press in the grid writes the end instead of restarting the run."
          layout="stack"
        >
          <DateRangePicker
            count="nights"
            defaultValue={STAY}
            locale="pt-BR"
            months={1}
            onPositionChange={setPosition}
            position={position}
            ref={handle}
          />
          <Button onClick={() => setPosition('end')} variant="outline">
            Edit check-out
          </Button>
          <Button onClick={() => handle.current?.focus('end')} variant="outline">
            focus('end')
          </Button>
          <Button onClick={() => handle.current?.open()} variant="outline">
            open()
          </Button>
          <Button onClick={() => handle.current?.close()} variant="outline">
            close()
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
        label="Two presses, and the band between them"
        note="Tab to the trigger and press Enter: focus lands on the 12th. Press Enter, then arrow right four times — the band says 1, 2, 3, 4 nights as you go — and press Enter again. Then open it once more and press Escape with one end chosen: the draft is abandoned."
      >
        <DateRangePicker count="nights" defaultValue={STAY} locale="pt-BR" months={1} />
      </Scene>
    </Grid>
  ),
};
